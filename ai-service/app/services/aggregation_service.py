from sqlalchemy import text

def aggregate_product_metrics(product_id, db):

    print("DB SESSION:", db)

    positive_query = text("""
        SELECT COUNT(*)
        FROM "Review"
        WHERE sentiment = 'positive'
        AND "productId" = :product_id
    """)

    negative_query = text("""
        SELECT COUNT(*)
        FROM "Review"
        WHERE sentiment = 'negative'
        AND "productId" = :product_id
    """)

    positive = db.execute(
        positive_query,
        {
            "product_id": product_id
        }
    ).scalar()

    negative = db.execute(
        negative_query,
        {
            "product_id": product_id
        }
    ).scalar()

    total = positive + negative

    positive_percentage = (
        positive / total * 100
    ) if total > 0 else 0

    negative_percentage = (
        negative / total * 100
    ) if total > 0 else 0

    print("POSITIVE:", positive)
    print("NEGATIVE:", negative)

    return {

        "positive_sentiment":
            round(positive_percentage, 2),

        "negative_sentiment":
            round(negative_percentage, 2),

        "growth_percentage": 15,

        "top_keyword": "pengiriman",

        "forecast_trend": "up"
    }