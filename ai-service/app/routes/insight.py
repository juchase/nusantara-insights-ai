import uuid
import json
import requests
from fastapi import APIRouter, Depends, HTTPException, Header, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import os
import hmac

from database import get_db
from app.services.aggregation_service import aggregate_product_metrics, calculate_sentiment_trend
from app.services.health_score_service import calculate_health_score, get_health_label
from app.services.prompt_builder import build_prompt
from app.services.llm_service import safe_generate
from app.services.insight_engine import generate_structured_insights, generate_executive_summary
from app.services.keyword_service import NEGATIVE_STANDALONE
from app.services.forecasting_v2.saved_forecast_context import load_saved_forecast_context

router = APIRouter()

@router.get("/generate-insight/{product_id}")
def generate_insight_get_deprecated(product_id: str):
    """GET no longer generates data; use authenticated server-side POST."""
    raise HTTPException(
        status_code=405,
        detail="Gunakan POST /generate-insight/{product_id} setelah Forecasting V2 selesai.",
    )


@router.post("/generate-insight/{product_id}")
def generate_insight_from_saved_forecast(
    product_id: str,
    payload: dict = Body(default={}),
    x_internal_api_secret: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Generate Insight from persisted Forecasting V2 output; never runs forecasting."""
    expected_secret = os.getenv("INTERNAL_API_SECRET")
    if not expected_secret or not x_internal_api_secret or not hmac.compare_digest(
        expected_secret, x_internal_api_secret
    ):
        raise HTTPException(status_code=401, detail="Unauthorized internal request")

    product = db.execute(
        text('SELECT id FROM "Product" WHERE id = :pid'),
        {"pid": product_id},
    ).fetchone()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    frequency = str((payload or {}).get("frequency", "D")).upper()
    try:
        forecast_result = load_saved_forecast_context(db, product_id, frequency)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except LookupError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    return _generate_insight(product_id, db, forecast_result)


def _generate_insight(product_id: str, db: Session, forecast_result: dict):
    current_time = datetime.now()

    confidence_data = forecast_result.get("confidence") or {}
    confidence = confidence_data.get("score")
    confidence_context = {
        "status": confidence_data.get("status", "unavailable"),
        "reason": confidence_data.get("reason"),
        "label": confidence_data.get("label", "Belum tersedia"),
        "message": confidence_data.get("message", "Confidence belum tersedia."),
        "color": confidence_data.get("color", "gray"),
    }
    growth = float(forecast_result.get("growth", 0.0))
    growth_display = forecast_result.get("growth_display", "stabil")
    forecast_summary = forecast_result.get("forecast_summary", {})
    model_used = forecast_result.get("model_used", "unavailable")
    freq = forecast_result.get("freq", "D")

    # ── 1. Ambil dan validasi produk sebelum proses insight ─────────────────
    product_row = db.execute(text("""
        SELECT name, "userId" FROM "Product" WHERE id = :pid
    """), {"pid": product_id}).fetchone()

    if not product_row:
        raise HTTPException(status_code=404, detail="Product not found")

    product_name = product_row[0]   # name
    user_id = product_row[1]        # userId

    # ── 3. Aggregate metrics ──────────────────────────────────────────────
    data = aggregate_product_metrics(product_id=product_id, db=db)

    positive = float(data.get("positive_percentage") or 0)
    negative = float(data.get("negative_percentage") or 0)
    neutral  = float(data.get("neutral_percentage")  or 0)
    keyword  = data.get("top_keyword")
    category = data.get("top_category")

    # ── 4. Health Score & Risk ──────────────────────────────────────────────
    score = calculate_health_score(positive, negative, growth)
    label = get_health_label(score)
    risk_level = "high" if score < 35 else "medium" if score < 55 else "low"

    # Tentukan trend dari growth
    trend = "up" if growth > 5 else "down" if growth < -5 else "stable"

    print(f"📌 growth_display yang dikirim ke LLM: '{growth_display}'")

    # ── 5. Generate insights ──────────────────────────────────────────────
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

    # ── 6. Pre-filter LLM ──────────────────────────────────────────────────
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

    should_call_llm = (total_neg_neutral >= 10) or found_strong

    if should_call_llm:
        prompt = build_prompt(
            raw_sentences=raw_sentences,
            top_recommendation=top_rec,
            growth_display=growth_display
        )
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

    # ── 7. Simpan ke tabel Insight ──────────────────────────────────────────
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
        "confidence": float(confidence) if confidence is not None else None,
        "confidence_label": confidence_context.get("label", "Belum tersedia"),
        "confidence_message": confidence_context.get("message", ""),
        "confidence_color": confidence_context.get("color", "gray"),
        "freq": freq,
        "model_version": model_used,
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
            "freq",
            "modelVersion",
            "createdAt", "updatedAt"
        ) VALUES (
            :id, :product_id,
            :summary, :executive_summary,
            :insights, :recommendations,
            :sentiment, :issue, :trend,
            :growth, :risk, :health_score,
            :llm_used, :model,
            :confidence, :confidence_label, :confidence_message, :confidence_color,
            :freq,
            :model_version,
            :created_at, :updated_at
        )
    """

    try:
        db.execute(text(insert_sql), insert_params)
        db.commit()

        # ── Kirim notifikasi ─────────────────────────────────────────────────────
        notif_url = os.getenv("NEXTJS_PUBLIC_URL", "http://localhost:3000") + "/api/notifications"

        # 1. Notifikasi Insight Selesai
        payload = {
            "userId": str(user_id),
            "title": "Insight Baru Tersedia",
            "message": f"Insight untuk produk '{product_name}' sudah siap.",
            "type": "info"
        }
        try:
            internal_secret = os.getenv("INTERNAL_API_SECRET")
            headers = {"x-internal-api-secret": internal_secret} if internal_secret else {}
            requests.post(notif_url, json=payload, headers=headers, timeout=5)
        except Exception as e:
            print(f"⚠️ Gagal kirim notifikasi insight: {e}")

        # 2. Jika risk_level == 'high'
        if risk_level == 'high':
            payload_risk = {
                "userId": str(user_id),
                "title": "⚠️ Risiko Tinggi Terdeteksi",
                "message": f"Produk '{product_name}' memerlukan perhatian segera.",
                "type": "warning"
            }
            try:
                internal_secret = os.getenv("INTERNAL_API_SECRET")
                headers = {"x-internal-api-secret": internal_secret} if internal_secret else {}
                requests.post(notif_url, json=payload_risk, headers=headers, timeout=5)
            except Exception as e:
                print(f"⚠️ Gagal kirim notifikasi risiko tinggi: {e}")
                
        print(f"✅ Insight saved — {product_name} | confidence: {confidence if confidence is not None else 'unavailable'} | LLM Used: {llm_used}")

    except Exception as e:
        db.rollback()
        print(f"❌ INSERT ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise

    return {
        "executive_summary":  executive_summary,
        "summary":            final_summary,
        "health_score":       score,
        "health_label":       label,
        "insights":           insights,
        "recommendations":    recommendations,
        "dominant_issue":     dominant_issue,
        "risk_level":         risk_level,
        "llm_used":           llm_used,
        "metrics":            data,
        "sentiment_trend":    calculate_sentiment_trend(product_id, db),
        "confidence":         confidence,
        "confidence_context": confidence_context,
        "forecast_summary":   forecast_summary,
        "forecast_model": model_used,
        "forecast_frequency": freq,
        "forecast_validation": forecast_result.get("validation") if "forecast_result" in locals() else None,
        "forecast_strategy": forecast_result.get("strategy") if "forecast_result" in locals() else "unavailable",
        "forecast_fallback_used": forecast_result.get("fallback_used") if "forecast_result" in locals() else True,
    }