from app.services.aggregation_service import aggregate_product_metrics

result = aggregate_product_metrics(
    product_id="123",
    db=None
)

print(result)