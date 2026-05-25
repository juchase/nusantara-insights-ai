from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db

from app.services.aggregation_service import aggregate_product_metrics
from app.services.health_score_service import calculate_health_score, get_health_label
from app.services.insight_engine import generate_structured_insights
from app.services.prompt_builder import build_prompt
from app.services.llm_service import safe_generate

router = APIRouter()

@router.get("/generate-insight/{product_id}")
def generate_insight(product_id: str, db: Session = Depends(get_db)):

    data = aggregate_product_metrics(product_id=product_id, db=db)

    positive = data["positive_percentage"]
    negative = data["negative_percentage"]
    neutral  = data["neutral_percentage"]
    growth   = data["growth_percentage"]
    keyword  = data["top_keyword"]
    trend    = data["forecast_trend"]

    product_row = db.execute(text("""
        SELECT name FROM "Product" WHERE id = :pid
    """), {"pid": product_id}).fetchone()

    product_name = product_row[0] if product_row else "ini"

    score = calculate_health_score(positive, negative, growth)
    label = get_health_label(score)

    insights, recommendations, raw_sentences = generate_structured_insights(
        positive=positive,
        negative=negative,
        neutral=neutral,
        keyword=keyword,
        growth=growth,
        trend=trend,
        product_name=product_name
    )

    rule_summary = " ".join(raw_sentences[:2])
    top_rec      = recommendations[0] if recommendations else ""

    prompt = build_prompt(
        raw_sentences=raw_sentences,
        top_recommendation=top_rec
    )

    final_summary = safe_generate(
        prompt=prompt,
        fallback_text=rule_summary,
        rule_text=rule_summary
    )

    # ✅ Cek apakah LLM berhasil atau fallback
    llm_used = final_summary != rule_summary

    return {
        "summary":         final_summary,
        "health_score":    score,
        "health_label":    label,
        "insights":        insights,
        "recommendations": recommendations,
        "dominant_issue":  keyword,
        "risk_level":      "high" if score < 35 else "medium" if score < 55 else "low",
        "llm_used":        llm_used,
        "metrics":         data,
    }