from app.services.insight_service import generate_business_insight

result = generate_business_insight(
    product_id="123",
    db=None
)

print(result)