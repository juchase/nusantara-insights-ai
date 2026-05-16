from sqlalchemy import text

def aggregate_product_metrics(product_id, db):
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

    keyword_query=text("""
        SELECT word
        FROM "KeywordSummary"
        WHERE "productId" = :product_id
        ORDER BY count DESC
        LIMIT 1
    """)
    
    prediction_query=text("""
        SELECT "predictedSales"
        FROM "Prediction"
        WHERE "productId" = :product_id
        ORDER BY "predictionDate" DESC
        LIMIT 2
    """)

    positive = db.execute(positive_query, {"product_id": product_id}).scalar()

    negative = db.execute(negative_query, {"product_id": product_id}).scalar()

    neutral = db.execute(neutral_query, {"product_id": product_id}).scalar()
    
    top_keyword = db.execute(keyword_query, {"product_id": product_id}).scalar()
    
    predictions = db.execute(prediction_query, {"product_id": product_id}).fetchall()

    total = positive + negative + neutral

    positive_percentage = (positive / total * 100) if total > 0 else 0

    negative_percentage = (negative / total * 100) if total > 0 else 0

    neutral_percentage = (neutral / total * 100) if total > 0 else 0
    
    growth_percentage = 0

    if len(predictions) >= 2:
        latest = predictions[0][0]
        previous = predictions[1][0]
        if previous > 0:
            growth_percentage = ((latest - previous) / previous) * 100

    forecast_trend = "stable"
    
    if growth_percentage > 5:
        forecast_trend = "up"

    elif growth_percentage < -5:
        forecast_trend = "down"
    
    return {
        "positive_percentage": round(positive_percentage, 2),
        "negative_percentage": round(negative_percentage, 2),
        "neutral_percentage": round(neutral_percentage, 2),

        "growth_percentage": round(growth_percentage, 2),

        "top_keyword": top_keyword or "Tidak diketahui",
        
        "forecast_trend": forecast_trend
    }