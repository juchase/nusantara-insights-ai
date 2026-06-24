from sqlalchemy import text
from datetime import timedelta

def aggregate_product_metrics(product_id, db):
    positive = db.execute(text("""
        SELECT COUNT(*) FROM "Review"
        WHERE sentiment = 'positive' AND "productId" = :pid
    """), {"pid": product_id}).scalar() or 0

    negative = db.execute(text("""
        SELECT COUNT(*) FROM "Review"
        WHERE sentiment = 'negative' AND "productId" = :pid
    """), {"pid": product_id}).scalar() or 0

    neutral = db.execute(text("""
        SELECT COUNT(*) FROM "Review"
        WHERE sentiment = 'neutral' AND "productId" = :pid
    """), {"pid": product_id}).scalar() or 0

    # Ambil kata kunci dan kategori teratas
    row = db.execute(text("""
        SELECT word, category
        FROM "KeywordSummary"
        WHERE "productId" = :pid
        ORDER BY count DESC
        LIMIT 1
    """), {"pid": product_id}).fetchone()

    top_keyword = row[0] if row else "umum"
    top_category = row[1] if row else "lainnya"

    total = positive + negative + neutral
    pos_pct = round((positive / total) * 100, 1) if total > 0 else 0
    neg_pct = round((negative / total) * 100, 1) if total > 0 else 0
    neu_pct = round((neutral / total) * 100, 1) if total > 0 else 0

    last_sale = db.execute(text("""
        SELECT quantity FROM "Sales"
        WHERE "productId" = :pid
        ORDER BY date DESC LIMIT 1
    """), {"pid": product_id}).scalar()

    avg_prediction = db.execute(text("""
        SELECT AVG("predictedSales") FROM "Prediction"
        WHERE "productId" = :pid
    """), {"pid": product_id}).scalar()

    growth_pct = 0
    if last_sale and avg_prediction:
        growth_pct = round(((avg_prediction - last_sale) / last_sale) * 100, 1)

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
        "top_keyword":         top_keyword,
        "top_category":        top_category,
        "forecast_trend":      trend,
    }

def calculate_sentiment_trend(product_id: str, db) -> dict:
    rows = db.execute(text("""
        SELECT sentiment, "reviewDate"
        FROM "Review"
        WHERE "productId" = :pid
        ORDER BY "reviewDate" DESC
    """), {"pid": product_id}).fetchall()

    if len(rows) < 10:
        return {"status": "insufficient_data", "label": "Data belum cukup"}

    # Tanggal terbaru sebagai patokan
    latest_date = rows[0][1]
    cutoff_date = latest_date - timedelta(days=30)               # 30 hari terakhir
    second_cutoff = cutoff_date - timedelta(days=30)             # 30 hari sebelumnya

    # Filter berdasarkan waktu (bukan berdasarkan count)
    second_period = [r for r in rows if r[1] >= cutoff_date]
    first_period = [r for r in rows if second_cutoff <= r[1] < cutoff_date]

    # Fallback jika data di salah satu periode kosong
    if not first_period or not second_period:
        mid = len(rows) // 2
        first_period = rows[:mid]
        second_period = rows[mid:]

    def pos_pct(data):
        if not data: return 0
        pos = sum(1 for r in data if r[0] == "positive")
        return round(pos / len(data) * 100, 1)

    first_pos = pos_pct(first_period)
    second_pos = pos_pct(second_period)
    delta = round(second_pos - first_pos, 1)

    if delta > 5:   trend, label = "improving", "Membaik"
    elif delta < -5: trend, label = "declining", "Menurun"
    else:           trend, label = "stable", "Stabil"

    return {
        "status": "ok",
        "first_period_positive": first_pos,
        "second_period_positive": second_pos,
        "delta": delta,
        "trend": trend,
        "label": label,
        "message": f"Sentimen positif {trend} {abs(delta):.1f}% pada 30 hari terakhir",
    }