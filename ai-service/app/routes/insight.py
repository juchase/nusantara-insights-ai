import uuid
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from app.services.aggregation_service import aggregate_product_metrics, calculate_sentiment_trend
from app.services.health_score_service import calculate_health_score, get_health_label
from app.services.prompt_builder import build_prompt
from app.services.llm_service import safe_generate
from app.services.insight_engine import generate_structured_insights, generate_executive_summary
from datetime import datetime

current_time = datetime.now()
router = APIRouter()

@router.get("/generate-insight/{product_id}")
def generate_insight(product_id: str, db: Session = Depends(get_db)):

    # Ambil nama produk
    product_row = db.execute(text("""
        SELECT name FROM "Product" WHERE id = :pid
    """), {"pid": product_id}).fetchone()
    product_name = product_row[0] if product_row else "Produk ini"

    data = aggregate_product_metrics(product_id=product_id, db=db)

    positive = data["positive_percentage"]
    negative = data["negative_percentage"]
    neutral  = data["neutral_percentage"]
    growth   = data["growth_percentage"]
    keyword  = data["top_keyword"]
    trend    = data["forecast_trend"]

    score      = calculate_health_score(positive, negative, growth)
    label      = get_health_label(score)
    risk_level = "high" if score < 35 else "medium" if score < 55 else "low"

    insights, recommendations, raw_sentences = generate_structured_insights(
        positive=positive,
        negative=negative,
        neutral=neutral,
        keyword=keyword,
        growth=growth,
        trend=trend,
        product_name=product_name,
    )

    executive_summary = generate_executive_summary(
        product_name=product_name,
        positive=positive,
        negative=negative,
        trend=trend,
        risk_level=risk_level,
        dominant_issue=keyword or "",
        growth=growth,
    )

    rule_summary  = " ".join(raw_sentences[:2])
    top_rec       = recommendations[0] if recommendations else ""
    prompt        = build_prompt(raw_sentences=raw_sentences, top_recommendation=top_rec)
    final_summary = safe_generate(
        prompt=prompt,
        fallback_text=rule_summary,
        rule_text=rule_summary
    )
    llm_used = final_summary != rule_summary

    # ✅ Simpan ke DB — nama kolom sesuai schema
    try:
        db.execute(text("""
            INSERT INTO "Insight" (
                id, "productId",
                summary, "executiveSummary",
                insights, recommendations,
                "sentimentScore", "dominantIssue", "demandTrend",
                "demandGrowthPct", "riskLevel", "healthScore",
                "llmUsed", "llmModel",
                "createdAt", "updatedAt"
            ) VALUES (
                :id, :product_id,
                :summary, :executive_summary,
                CAST(:insights AS jsonb), CAST(:recommendations AS jsonb),
                :sentiment, :issue, :trend,
                :growth, :risk, :health_score,
                :llm_used, :model,
                :created_at, :updated_at
            )
        """), {
            "id":                str(uuid.uuid4()),
            "product_id":        product_id,
            "summary":           final_summary,
            "executive_summary": executive_summary,
            "insights":          json.dumps(insights),
            "recommendations":   json.dumps(recommendations),
            "sentiment":         positive,
            "issue":             keyword or "none",
            "trend":             trend,
            "growth":            growth,
            "risk":              risk_level,
            "health_score":      score,
            "llm_used":          llm_used,
            "model":             "qwen2.5" if llm_used else None,
            "created_at":        current_time,  # Isian untuk kolom createdAt
            "updated_at":        current_time,  # Isian untuk kolom updatedAt
        })
        db.commit()
        print(f"✅ Insight saved untuk {product_name}")

    except Exception as e:
        db.rollback()
        print(f"⚠ Gagal simpan insight: {e}")

    sentiment_trend = calculate_sentiment_trend(product_id, db)

    return {
        "executive_summary": executive_summary,
        "summary":           final_summary,
        "health_score":      score,
        "health_label":      label,
        "insights":          insights,
        "recommendations":   recommendations,
        "dominant_issue":    keyword,
        "risk_level":        risk_level,
        "llm_used":          llm_used,
        "metrics":           data,
        "sentiment_trend":   sentiment_trend,
    }