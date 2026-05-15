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

    neutral_query = text("""
        SELECT COUNT(*)
        FROM "Review"
        WHERE sentiment = 'neutral'
        AND "productId" = :product_id
    """)

    positive = db.execute(
        positive_query,
        {
            "product_id": product_id
        }
    ).scalar()

    neutral = db.execute(
        neutral_query,
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

    total = positive + negative + neutral

    positive_percentage = (
        positive / total * 100
    ) if total > 0 else 0

    negative_percentage = (
        negative / total * 100
    ) if total > 0 else 0

    neutral_percentage = (
        neutral / total * 100
    ) if total > 0 else 0

    growth_percentage = 15

    top_keyword = "pengiriman"

    forecast_trend = "up"

    print("POSITIVE:", positive)
    print("NEGATIVE:", negative)
    print("NEUTRAL:", neutral)

    return {

        "positive_sentiment":
            round(positive_percentage, 2),

        "neutral_sentiment":
            round(neutral_percentage, 2),

        "negative_sentiment":
            round(negative_percentage, 2),

        "positive_percentage": positive_percentage,
        "neutral_percentage": neutral_percentage,
        "negative_percentage": negative_percentage,

        "growth_percentage": growth_percentage,

        "top_keyword": top_keyword,

        "forecast_trend": forecast_trend
    }