from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db

from app.services.aggregation_service import aggregate_product_metrics
from app.services.health_score_service import calculate_health_score
from app.services.insight_engine import generate_structured_insights
from app.services.prompt_builder import build_prompt
from app.services.llm_service import safe_generate

router = APIRouter()


@router.get("/generate-insight/{product_id}")
def generate_insight(
    product_id: str,
    db: Session = Depends(get_db)
):

    data = aggregate_product_metrics(
        product_id=product_id,
        db=db
    )

    positive = data["positive_percentage"]
    negative = data["negative_percentage"]
    growth = data["growth_percentage"]
    keyword = data["top_keyword"]
    trend = data["forecast_trend"]

    health_score = calculate_health_score(
        positive,
        negative,
        growth
    )

    insights, recommendations = generate_structured_insights(
        positive=positive,
        negative=negative,
        keyword=keyword,
        growth=growth,
        trend=trend
    )

    if trend == "up":
        trend_text = "meningkat"

    elif trend == "down":
        trend_text = "menurun"

    else:
        trend_text = "stabil"

    prompt = build_prompt(
        positive=positive,
        negative=negative,
        trend=trend_text,
        keyword=keyword
    )

    summary = safe_generate(
        prompt=prompt,
        fallback_text="Insight tidak dapat dibuat."
    )

    return {
        "summary": summary,
        "health_score": health_score,
        "insights": insights,
        "recommendations": recommendations
    }