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

def calculate_sentiment_trend(product_id: str, db) -> dict:
    """
    Bandingkan sentimen periode awal vs periode akhir.
    Pakai first-half vs second-half dari semua review.
    """
    rows = db.execute(text("""
        SELECT sentiment, "reviewDate"
        FROM "Review"
        WHERE "productId" = :pid
        ORDER BY "reviewDate" ASC
    """), {"pid": product_id}).fetchall()

    # Minimal 10 review untuk perbandingan bermakna
    if len(rows) < 10:
        return {
            "status":               "insufficient_data",
            "first_period_positive":  0,
            "second_period_positive": 0,
            "delta":                  0,
            "trend":                  "insufficient_data",
            "label":                  "Data belum cukup",
            "message":                "Minimal 10 ulasan diperlukan untuk analisis tren",
        }

    mid    = len(rows) // 2
    first  = rows[:mid]
    second = rows[mid:]

    def pos_pct(data):
        if not data:
            return 0
        pos = sum(1 for r in data if r[0] == "positive")
        return round(pos / len(data) * 100, 1)

    first_pos  = pos_pct(first)
    second_pos = pos_pct(second)
    delta      = round(second_pos - first_pos, 1)

    # Ambil rentang tanggal tiap periode
    first_start  = str(first[0][1])[:10]   if first  else "—"
    first_end    = str(first[-1][1])[:10]  if first  else "—"
    second_start = str(second[0][1])[:10]  if second else "—"
    second_end   = str(second[-1][1])[:10] if second else "—"

    if delta > 5:
        trend   = "improving"
        label   = "Membaik"
        message = f"Sentimen positif naik {delta:.1f}% pada periode akhir"
    elif delta < -5:
        trend   = "declining"
        label   = "Menurun"
        message = f"Sentimen positif turun {abs(delta):.1f}% pada periode akhir"
    else:
        trend   = "stable"
        label   = "Stabil"
        message = "Sentimen pelanggan relatif konsisten antar periode"

    return {
        "status":                 "ok",
        "first_period_positive":  first_pos,
        "second_period_positive": second_pos,
        "delta":                  delta,
        "trend":                  trend,
        "label":                  label,
        "message":                message,
        "first_period_range":     f"{first_start} — {first_end}",
        "second_period_range":    f"{second_start} — {second_end}",
        "first_period_count":     len(first),
        "second_period_count":    len(second),
    }