from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db

from app.services.aggregation_service import aggregate_product_metrics
from app.services.health_score_service import calculate_health_score
from app.services.insight_engine import generate_structured_insights

from app.schemas.insight_schema import InsightResponse

router = APIRouter()


@router.get(
    "/generate-insight/{product_id}",
    response_model=InsightResponse
)
def generate_insight(
    product_id: str,
    db: Session = Depends(get_db)
):

    # 1. AGGREGATE REAL DATA
    data = aggregate_product_metrics(
        product_id=product_id,
        db=db
    )

    print("DATA:", data)

    # 2. EXTRACT DATA
    positive = data["positive_percentage"]
    negative = data["negative_percentage"]
    growth = data["growth_percentage"]
    keyword = data["top_keyword"]

    # 3. HEALTH SCORE
    health_score = calculate_health_score(
        positive,
        negative,
        growth
    )

    # 4. STRUCTURED INSIGHT
    insights, recommendations = generate_structured_insights(
        positive,
        negative,
        keyword,
        growth
    )

    # 5. SUMMARY
    summary = (
        f"Produk menunjukkan pertumbuhan "
        f"{growth}% dengan sentimen positif "
        f"sebesar {positive}%."
    )

    # 6. RESPONSE
    return {
        "summary": summary,

        "health_score": health_score,

        "insights": insights,

        "recommendations": recommendations
    }