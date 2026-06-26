import sys
import uuid
import json
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


def should_call_llm(product_id: str, db: Session) -> bool:
    """
    Pre-filter: putuskan apakah produk ini layak diproses LLM.
    - Jika total ulasan negatif/netral >= 10 → panggil LLM.
    - Jika ada kata negatif kuat (dari NEGATIVE_STANDALONE) di 10 ulasan terbaru → panggil LLM.
    """
    total_neg_neutral = db.execute(text("""
        SELECT COUNT(*) FROM "Review"
        WHERE "productId" = :pid AND sentiment IN ('negative', 'neutral')
    """), {"pid": product_id}).scalar() or 0

    # Ambil 10 ulasan terbaru untuk cek kata negatif kuat
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
    """Generate dan simpan insight untuk satu produk (logika sama dengan endpoint)."""
    current_time = datetime.now()

    # Ambil nama produk
    product_row = db.execute(text("""
        SELECT name FROM "Product" WHERE id = :pid
    """), {"pid": product_id}).fetchone()
    product_name = product_row[0] if product_row else "Produk ini"

    data = aggregate_product_metrics(product_id=product_id, db=db)

    positive = float(data.get("positive_percentage") or 0)
    negative = float(data.get("negative_percentage") or 0)
    neutral  = float(data.get("neutral_percentage")  or 0)
    growth   = float(data.get("growth_percentage")   or 0)
    keyword  = data.get("top_keyword")
    category = data.get("top_category")
    trend    = data.get("forecast_trend") or "stable"

    score      = calculate_health_score(positive, negative, growth)
    label      = get_health_label(score)
    risk_level = "high" if score < 35 else "medium" if score < 55 else "low"

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

    rule_summary  = " ".join(raw_sentences[:3])
    top_rec       = recommendations[0] if recommendations else ""

    # ── Pre-filter ────────────────────────────────────────────────────────────
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

    # ── Hitung confidence ────────────────────────────────────────────────────
    data_points_row = db.execute(text("""
        SELECT COUNT(*) FROM "Sales" WHERE "productId" = :pid
    """), {"pid": product_id}).scalar() or 0
    data_points = int(data_points_row)

    confidence_row = db.execute(text("""
        SELECT
            AVG("predictedSales")            AS avg_pred,
            AVG("upperBound" - "lowerBound") AS avg_interval
        FROM "Prediction"
        WHERE "productId" = :pid
          AND "upperBound" IS NOT NULL
          AND "lowerBound" IS NOT NULL
    """), {"pid": product_id}).fetchone()

    if confidence_row and confidence_row[0] is not None and confidence_row[1] is not None:
        avg_pred     = float(confidence_row[0])
        avg_interval = float(confidence_row[1])
        rel_width    = avg_interval / avg_pred if avg_pred > 0 else 1.0
        raw_conf     = max(0.0, 1.0 - rel_width) * 100

        if data_points >= 90:
            raw_conf = min(raw_conf * 1.1, 95.0)
        elif data_points < 14:
            raw_conf *= 0.75

        confidence = round(max(5.0, min(raw_conf, 95.0)), 2)
    else:
        confidence = 0.0

    if confidence >= 70:
        confidence_label   = "Akurasi Tinggi"
        confidence_color   = "green"
        confidence_message = "Pola penjualan konsisten, prediksi interval dapat diandalkan."
    elif confidence >= 40:
        confidence_label   = "Akurasi Sedang"
        confidence_color   = "amber"
        confidence_message = (
            f"Prediksi cukup andal dengan {data_points} hari data. "
            "Tambah data hingga 90 hari untuk akurasi lebih tinggi."
        )
    else:
        confidence_label   = "Akurasi Rendah"
        confidence_color   = "red"
        if data_points < 14:
            days_needed = 14 - data_points
            confidence_message = (
                f"Data historis hanya {data_points} hari — minimal 14 hari diperlukan. "
                f"Tambahkan {days_needed} hari data lagi untuk prediksi yang lebih baik."
            )
        else:
            confidence_message = (
                f"Pola penjualan masih fluktuatif dengan {data_points} hari data. "
                "Tambah data hingga 90 hari untuk hasil lebih akurat."
            )

    # ── Siapkan parameter INSERT ──────────────────────────────────────────────
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
        "confidence_label": confidence_label,
        "confidence_message": confidence_message,
        "confidence_color": confidence_color,
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

    try:
        db.execute(text(insert_sql), insert_params)
        db.commit()
        print(f"✅ Insight saved — {product_name} | confidence: {confidence}% | LLM Used: {llm_used}")
    except Exception as e:
        db.rollback()
        print(f"❌ Gagal menyimpan insight untuk {product_name}: {e}")


def rebuild_user(user_id: str):
    db = SessionLocal()
    try:
        # Ambil semua produk milik user
        product_rows = db.execute(
            text('SELECT id FROM "Product" WHERE "userId" = :user_id'),
            {"user_id": user_id}
        ).fetchall()

        if not product_rows:
            print(f"⚠️ Tidak ada produk ditemukan untuk user {user_id}")
            return

        total = len(product_rows)
        print(f"🚀 Memulai rebuild untuk {total} produk user {user_id}...")

        for idx, (pid,) in enumerate(product_rows):
            print(f"\n[{idx+1}/{total}] Memproses produk {pid}")
            # 1. Update keyword summary (wajib untuk semua produk)
            update_keyword_summary(pid)
            # 2. Generate dan simpan insight
            generate_insight_for_product(pid, db)

        print(f"\n✅ Selesai! Semua produk user {user_id} telah diperbarui.")
    except Exception as e:
        print(f"❌ Error fatal: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python rebuild_user.py <user_id>")
        sys.exit(1)
    user_id = sys.argv[1]
    rebuild_user(user_id)