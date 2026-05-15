from app.services.aggregation_service import aggregate_product_metrics
from app.services.rule_engine import generate_rules
from app.services.prompt_builder import build_prompt
from app.services.llm_service import safe_generate

from app.services.health_score_service import calculate_health_score
from app.services.insight_engine import generate_structured_insights


def generate_business_insight(product_id, db):

    # 1. Aggregate data
    data = aggregate_product_metrics(product_id, db)

    # 2. Generate rules
    rules = generate_rules(data)

    # 3. Health score
    health_score = calculate_health_score(
        positive=data["positive_percentage"],
        negative=data["negative_percentage"],
        growth_percentage=data["growth_percentage"]
    )

    # 4. Structured insights
    insights, recommendations = generate_structured_insights(
        positive=data["positive_percentage"],
        negative=data["negative_percentage"],
        keyword=data["top_keyword"],
        growth=data["growth_percentage"]
    )

    # 5. Build prompt
    prompt = build_prompt(
        data=data,
        rules=rules,
        insights=insights
    )

    # 6. LLM generate
    ai_result = safe_generate(
        prompt=prompt,
        fallback_text="Insight AI tidak tersedia."
    )

    # 7. Final response
    return {
        "summary": ai_result,

        "health_score": health_score,

        "insights": insights,

        "recommendations": recommendations,

        "metrics": data,

        "rules": rules
    }