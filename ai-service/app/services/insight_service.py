from app.services.aggregation_service import aggregate_product_metrics
from app.services.rule_engine import generate_rules
from app.services.prompt_builder import build_prompt
from app.services.llm_service import safe_generate


def generate_business_insight(product_id, db):

    # 1. Aggregate data
    data = aggregate_product_metrics(product_id, db)

    # 2. Generate rules
    rules = generate_rules(data)

    # 3. Build prompt
    prompt = build_prompt(data, rules)

    # 4. Generate AI insight
    ai_result = safe_generate(
        prompt=prompt,
        fallback_text="Insight AI tidak tersedia."
    )
    
    return {
        "metrics": data,
        "rules": rules,
        "final_insight": ai_result
    }