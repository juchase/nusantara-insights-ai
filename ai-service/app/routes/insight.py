import uuid
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

from database import get_db
from app.services.aggregation_service import aggregate_product_metrics, calculate_sentiment_trend
from app.services.health_score_service import calculate_health_score, get_health_label
from app.services.prompt_builder import build_prompt
from app.services.llm_service import safe_generate
from app.services.insight_engine import generate_structured_insights, generate_executive_summary
from app.services.keyword_service import NEGATIVE_STANDALONE
from app.services.demand_service import predict_and_save

router = APIRouter()

@router.get("/generate-insight/{product_id}")
def generate_insight(product_id: str, db: Session = Depends(get_db)):
    current_time = datetime.now()

    forecast_result = predict_and_save(product_id)

    # ── Ambil data dari forecasting ──────────────────────────────────────────
    if forecast_result.get("status") == "success":
        growth = float(forecast_result.get("growth", 0))
        growth_display = forecast_result.get("growth_display", "meningkat")
        confidence = float(forecast_result.get("confidence", 0))
        confidence_context = forecast_result.get("confidence_context", {
            "label": "Akurasi Rendah",
            "message": "Data tidak cukup",
            "color": "red"
        })
        forecast_summary = forecast_result.get("forecast_summary", {})
        model_used = forecast_result.get("model_used", "prophet")
        freq = forecast_result.get("freq", "D")
    else:
        growth = 0.0
        growth_display = "meningkat"
        confidence = 0.0
        confidence_context = {
            "label": "Gagal Prediksi",
            "message": "Terjadi kesalahan pada forecasting.",
            "color": "red"
        }
        forecast_summary = {}
        model_used = "prophet"
        freq = "D"
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

    if forecast_result.get("status") == "success":
        growth = float(forecast_result.get("growth", 0))
        growth_display = forecast_result.get("growth_display", "meningkat")
        confidence = float(forecast_result.get("confidence", 0))
        confidence_context = forecast_result.get("confidence_context", {
            "label": "Akurasi Rendah",
            "message": "Data tidak cukup",
            "color": "red"
        })
        forecast_summary = forecast_result.get("forecast_summary", {})
        model_used = forecast_result.get("model_used", "prophet")
        freq = forecast_result.get("freq", "D")
    else:
        growth = 0.0
        growth_display = "meningkat"
        confidence = 0.0
        confidence_context = {
            "label": "Gagal Prediksi",
            "message": "Terjadi kesalahan pada forecasting.",
            "color": "red"
        }
        forecast_summary = {}
        model_used = "prophet"
        freq = "D"

    # Tentukan trend dari growth
    trend = "up" if growth > 5 else "down" if growth < -5 else "stable"

    print(f"📌 growth_display yang dikirim ke LLM: '{growth_display}'")

    score = calculate_health_score(positive, negative, growth)
    label = get_health_label(score)
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

    rule_summary = " ".join(raw_sentences[:3])
    top_rec = recommendations[0] if recommendations else ""

    # ── Pre-filter LLM ──────────────────────────────────────────────────
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

    # ── Simpan ke tabel Insight ──────────────────────────────────────────
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
        print(f"✅ Insight saved — {product_name} | confidence: {confidence}% | LLM Used: {llm_used}")
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
    }