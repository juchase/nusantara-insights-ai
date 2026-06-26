import sys
import uuid
import json
import time
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.utils.db import SessionLocal
from app.services.aggregation_service import aggregate_product_metrics, calculate_sentiment_trend
from app.services.health_score_service import calculate_health_score, get_health_label
from app.services.prompt_builder import build_prompt
from app.services.llm_service import safe_generate
from app.services.insight_engine import generate_structured_insights, generate_executive_summary
from app.services.keyword_service import update_keyword_summary, NEGATIVE_STANDALONE
from app.services.demand_service import predict_and_save   # ← WAJIB DI-IMPORT


def should_call_llm(product_id: str, db: Session) -> bool:
    total_neg_neutral = db.execute(text("""
        SELECT COUNT(*) FROM "Review"
        WHERE "productId" = :pid AND sentiment IN ('negative', 'neutral')
    """), {"pid": product_id}).scalar() or 0

    sample_reviews = db.execute(text("""
        SELECT "reviewText" FROM "Review"
        WHERE "productId" = :pid AND sentiment IN ('negative', 'neutral')
        ORDER BY "reviewDate" DESC LIMIT 10
    """), {"pid": product_id}).fetchall()

    found_strong = False
    for row in sample_reviews:
        text_lower = row[0].lower()
        for word in NEGATIVE_STANDALONE:
            if word in text_lower:
                found_strong = True
                break
        if found_strong:
            break

    return (total_neg_neutral >= 10) or found_strong


def generate_insight_for_product(product_id: str, db: Session):
    """Generate dan simpan insight. Selalu memanggil predict_and_save terlebih dahulu."""
    start_time = time.time()
    current_time = datetime.now()

    try:
        # ── 1. Panggil forecasting (WAJIB UNTUK SEMUA PRODUK) ──────────────
        print(f"⏳ Menjalankan forecasting untuk {product_id}...")
        forecast_result = predict_and_save(product_id)

        # ── 2. Ambil hasil forecasting ──────────────────────────────────────
        if forecast_result.get("status") == "success":
            confidence = float(forecast_result.get("confidence", 0))
            confidence_context = forecast_result.get("confidence_context", {
                "label": "Akurasi Rendah",
                "message": "Data tidak cukup",
                "color": "red"
            })
            growth = float(forecast_result.get("growth", 0))
            trend = "up" if growth > 5 else "down" if growth < -5 else "stable"
        else:
            # Jika forecasting gagal (misal error query), beri nilai default
            confidence = 0.0
            confidence_context = {
                "label": "Gagal Prediksi",
                "message": "Terjadi kesalahan pada forecasting.",
                "color": "red"
            }
            growth = 0.0
            trend = "stable"
            print(f"⚠️ Forecasting gagal untuk {product_id}: {forecast_result.get('error', 'unknown')}")

        # ── 3. Ambil data produk dan metrik ──────────────────────────────────
        product_row = db.execute(text("""
            SELECT name FROM "Product" WHERE id = :pid
        """), {"pid": product_id}).fetchone()
        product_name = product_row[0] if product_row else "Produk ini"

        data = aggregate_product_metrics(product_id=product_id, db=db)

        positive = float(data.get("positive_percentage") or 0)
        negative = float(data.get("negative_percentage") or 0)
        neutral  = float(data.get("neutral_percentage")  or 0)
        keyword  = data.get("top_keyword")
        category = data.get("top_category")

        # ── 4. Hitung health score ──────────────────────────────────────────
        score = calculate_health_score(positive, negative, growth)
        label = get_health_label(score)
        risk_level = "high" if score < 35 else "medium" if score < 55 else "low"

        # ── 5. Generate insight dari rule engine ────────────────────────────
        insights, recommendations, raw_sentences = generate_structured_insights(
            product_id=product_id,
            positive=positive,
            negative=negative,
            neutral=neutral,
            keyword=keyword,
            category=category,
            growth=growth,
            trend=trend,
            product_name=product_name,
        )

        dominant_issue = category or "lainnya"

        executive_summary = generate_executive_summary(
            product_id=product_id,
            product_name=product_name,
            positive=positive,
            negative=negative,
            trend=trend,
            risk_level=risk_level,
            dominant_issue=dominant_issue,
            growth=growth,
        )

        rule_summary = " ".join(raw_sentences[:3])
        top_rec = recommendations[0] if recommendations else ""

        # ── 6. Pre-filter LLM ──────────────────────────────────────────────
        if should_call_llm(product_id, db):
            prompt = build_prompt(raw_sentences=raw_sentences, top_recommendation=top_rec)
            final_summary = safe_generate(
                prompt=prompt,
                fallback_text=rule_summary,
                rule_text=rule_summary,
            )
            llm_used = final_summary != rule_summary
        else:
            print(f"⏭ Skip LLM untuk {product_name} (data terbatas)")
            final_summary = rule_summary
            llm_used = False

        # ── 7. Simpan ke tabel Insight ──────────────────────────────────────
        insights_json = json.dumps(insights, ensure_ascii=False)
        recommendations_json = json.dumps(recommendations, ensure_ascii=False)

        insert_params = {
            "id": str(uuid.uuid4()),
            "product_id": product_id,
            "summary": final_summary,
            "executive_summary": executive_summary,
            "insights": insights_json,
            "recommendations": recommendations_json,
            "sentiment": float(positive),
            "issue": dominant_issue,
            "trend": trend,
            "growth": float(growth),
            "risk": risk_level,
            "health_score": float(score),
            "llm_used": llm_used,
            "model": "qwen2.5" if llm_used else None,
            "confidence": float(confidence),
            "confidence_label": confidence_context.get("label", "Akurasi Rendah"),
            "confidence_message": confidence_context.get("message", ""),
            "confidence_color": confidence_context.get("color", "red"),
            "created_at": current_time,
            "updated_at": current_time,
        }

        insert_sql = """
            INSERT INTO "Insight" (
                id, "productId",
                summary, "executiveSummary",
                insights, recommendations,
                "sentimentScore", "dominantIssue", "demandTrend",
                "demandGrowthPct", "riskLevel", "healthScore",
                "llmUsed", "llmModel",
                "confidence", "confidenceLabel", "confidenceMessage", "confidenceColor",
                "createdAt", "updatedAt"
            ) VALUES (
                :id, :product_id,
                :summary, :executive_summary,
                :insights, :recommendations,
                :sentiment, :issue, :trend,
                :growth, :risk, :health_score,
                :llm_used, :model,
                :confidence, :confidence_label, :confidence_message, :confidence_color,
                :created_at, :updated_at
            )
        """

        db.execute(text(insert_sql), insert_params)
        db.commit()

        duration = time.time() - start_time
        print(f"✅ Insight saved — {product_name} | confidence: {confidence}% | LLM Used: {llm_used} | ⏱️ {duration:.2f}s")
        if confidence < 20:
            print(f"   ⚠️ PERINGATAN: Confidence sangat rendah (< 20%)! Periksa data sales produk ini.")

        return {"status": "ok", "llm_used": llm_used, "confidence": confidence}

    except Exception as e:
        db.rollback()
        duration = time.time() - start_time
        print(f"❌ Gagal menyimpan insight untuk {product_name} ({duration:.2f}s): {e}")
        return {"status": "error", "error": str(e)}


def rebuild_user(user_id: str):
    db = SessionLocal()
    try:
        product_rows = db.execute(
            text('SELECT id FROM "Product" WHERE "userId" = :user_id'),
            {"user_id": user_id}
        ).fetchall()

        if not product_rows:
            print(f"⚠️ Tidak ada produk ditemukan untuk user {user_id}")
            return

        total = len(product_rows)
        print(f"\n🚀 Memulai rebuild untuk {total} produk milik user {user_id}...")
        print(f"📅 Mulai pada: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

        stats = {
            "success": 0,
            "llm_used": 0,
            "llm_skipped": 0,
            "error": 0,
            "low_confidence": 0
        }

        start_total = time.time()

        for idx, (pid,) in enumerate(product_rows):
            print(f"\n{'='*60}")
            print(f"📦 [{idx+1}/{total}] Memproses produk {pid}")
            print(f"{'='*60}")

            try:
                # 1. Update keyword summary (wajib)
                update_keyword_summary(pid)

                # 2. Generate insight (sudah termasuk forecasting)
                result = generate_insight_for_product(pid, db)

                if result["status"] == "ok":
                    stats["success"] += 1
                    if result["llm_used"]:
                        stats["llm_used"] += 1
                    else:
                        stats["llm_skipped"] += 1
                    if result["confidence"] < 20:
                        stats["low_confidence"] += 1
                else:
                    stats["error"] += 1

            except Exception as e:
                print(f"❌ Fatal error saat memproses produk {pid}: {e}")
                stats["error"] += 1

        total_duration = time.time() - start_total
        total_minutes = int(total_duration // 60)
        total_seconds = int(total_duration % 60)

        print(f"\n{'='*60}")
        print("📊 RINGKASAN REBUILD")
        print(f"{'='*60}")
        print(f"✅ Total produk diproses    : {total}")
        print(f"✅ Berhasil                 : {stats['success']}")
        print(f"❌ Gagal                    : {stats['error']}")
        print(f"🤖 LLM Digunakan            : {stats['llm_used']}")
        print(f"⏭ LLM Dilewati (Pre-filter): {stats['llm_skipped']}")
        print(f"⚠️ Confidence < 20%          : {stats['low_confidence']}")
        print(f"⏱️ Total waktu eksekusi      : {total_minutes} menit {total_seconds} detik")
        print(f"{'='*60}")

        if stats['low_confidence'] > 0:
            print("\n🔔 Saran: Periksa produk dengan confidence < 20%. Data penjualannya mungkin sangat sparse atau fluktuatif ekstrem.")

        print(f"\n✅ Selesai! Semua produk user {user_id} telah diperbarui.")

    except Exception as e:
        print(f"❌ Error fatal pada proses utama: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python rebuild_user.py <user_id>")
        sys.exit(1)
    user_id = sys.argv[1]
    rebuild_user(user_id)