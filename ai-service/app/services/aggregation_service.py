from sqlalchemy import text

def aggregate_product_metrics(product_id, db):

    positive = db.execute(text("""
        SELECT COUNT(*) FROM "Review"
        WHERE sentiment = 'positive'
        AND "productId" = :pid
    """), {"pid": product_id}).scalar() or 0

    negative = db.execute(text("""
        SELECT COUNT(*) FROM "Review"
        WHERE sentiment = 'negative'
        AND "productId" = :pid
    """), {"pid": product_id}).scalar() or 0

    neutral = db.execute(text("""
        SELECT COUNT(*) FROM "Review"
        WHERE sentiment = 'neutral'
        AND "productId" = :pid
    """), {"pid": product_id}).scalar() or 0

    # KeywordSummary tidak punya productId — ambil global
    top_keyword = db.execute(text("""
        SELECT word FROM "KeywordSummary"
        ORDER BY count DESC
        LIMIT 1
    """)).scalar()

    predictions = db.execute(text("""
        SELECT "predictedSales" FROM "Prediction"
        WHERE "productId" = :pid
        ORDER BY "predictionDate" DESC
        LIMIT 2
    """), {"pid": product_id}).fetchall()

    total = positive + negative + neutral

    pos_pct  = round((positive / total * 100), 1) if total > 0 else 0
    neg_pct  = round((negative / total * 100), 1) if total > 0 else 0
    neu_pct  = round((neutral  / total * 100), 1) if total > 0 else 0

    growth_pct = 0.0
    if len(predictions) >= 2:
        latest, previous = predictions[0][0], predictions[1][0]
        if previous > 0:
            growth_pct = round(((latest - previous) / previous) * 100, 1)

    if growth_pct > 5:
        trend = "up"
    elif growth_pct < -5:
        trend = "down"
    else:
        trend = "stable"

    return {
        "positive_percentage": pos_pct,
        "negative_percentage": neg_pct,
        "neutral_percentage":  neu_pct,
        "total_reviews":       total,
        "growth_percentage":   growth_pct,
        "top_keyword":         top_keyword or "umum",
        "forecast_trend":      trend,
    }