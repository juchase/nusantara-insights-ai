from datetime import timedelta
from sqlalchemy import text
import pandas as pd
import numpy as np


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
    """
    Bandingkan sentimen 30 hari terakhir vs 30 hari sebelumnya (jendela
    waktu setara panjang), relatif ke tanggal ulasan TERBARU produk ini --
    bukan tanggal hari ini -- supaya tetap valid untuk dataset historis.
    Fallback ke split jumlah ulasan hanya jika salah satu jendela kosong.
    """
    rows = db.execute(text("""
        SELECT sentiment, "reviewDate"
        FROM "Review"
        WHERE "productId" = :pid
        ORDER BY "reviewDate" DESC
    """), {"pid": product_id}).fetchall()

    if len(rows) < 10:
        return {
            "status":                 "insufficient_data",
            "first_period_positive":  0,
            "second_period_positive": 0,
            "delta":                  0,
            "trend":                  "insufficient_data",
            "label":                  "Data belum cukup",
            "message":                "Minimal 10 ulasan diperlukan untuk analisis tren",
        }

    latest_date    = rows[0][1]
    cutoff_date    = latest_date - timedelta(days=30)
    second_cutoff  = cutoff_date - timedelta(days=30)

    second_period = [r for r in rows if r[1] >= cutoff_date]
    first_period  = [r for r in rows if second_cutoff <= r[1] < cutoff_date]

    if not first_period or not second_period:
        mid = len(rows) // 2
        first_period  = rows[mid:]
        second_period = rows[:mid]

    def pos_pct(data):
        if not data:
            return 0
        pos = sum(1 for r in data if r[0] == "positive")
        return round(pos / len(data) * 100, 1)

    first_pos  = pos_pct(first_period)
    second_pos = pos_pct(second_period)
    delta      = round(second_pos - first_pos, 1)

    first_sorted  = sorted(first_period, key=lambda r: r[1])
    second_sorted = sorted(second_period, key=lambda r: r[1])

    first_start  = str(first_sorted[0][1])[:10]   if first_sorted  else "—"
    first_end    = str(first_sorted[-1][1])[:10]  if first_sorted  else "—"
    second_start = str(second_sorted[0][1])[:10]  if second_sorted else "—"
    second_end   = str(second_sorted[-1][1])[:10] if second_sorted else "—"

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
        "first_period_count":     len(first_period),
        "second_period_count":    len(second_period),
    }


def get_weekly_forecast_data(product_id: str, db):
    """
    Menyiapkan data penjualan mingguan + regressor stok (berdasarkan ulasan)
    untuk dimasukkan ke dalam model Prophet.
    """
    # 1. Ambil data sales
    sales_rows = db.execute(text("""
        SELECT date, quantity FROM "Sales" WHERE "productId" = :pid ORDER BY date
    """), {"pid": product_id}).fetchall()
    df_sales = pd.DataFrame(sales_rows, columns=['date', 'sales'])
    df_sales['date'] = pd.to_datetime(df_sales['date'])
    df_sales.set_index('date', inplace=True)

    # 2. Ambil data ulasan & sentimen
    review_rows = db.execute(text("""
        SELECT "reviewDate", sentiment FROM "Review" WHERE "productId" = :pid
    """), {"pid": product_id}).fetchall()
    df_reviews = pd.DataFrame(review_rows, columns=['date', 'sentiment'])
    df_reviews['date'] = pd.to_datetime(df_reviews['date'])
    df_reviews['positive'] = (df_reviews['sentiment'] == 'positive').astype(int)
    df_reviews['negative'] = (df_reviews['sentiment'] == 'negative').astype(int)
    df_sent = df_reviews.groupby('date')[['positive', 'negative']].sum()

    # 3. Gabungkan & Resampling ke MINGGUAN (W-Mon)
    df = df_sales.join(df_sent, how='outer').fillna(0)
    df_weekly = df.resample('W-Mon').sum()

    # 4. Tandai Stok Habis (Logika Cerdas Anda)
    df_weekly['total_reviews'] = df_weekly['positive'] + df_weekly['negative']
    df_weekly['stok_tersedia'] = np.where(
        (df_weekly['sales'] == 0) & (df_weekly['total_reviews'] == 0),
        0, 1
    )

    # 5. Smoothing / Imputasi untuk minggu stok habis
    rolling_sales = df_weekly['sales'].rolling(window=3, min_periods=1).mean()
    df_weekly['sales_clean'] = np.where(
        df_weekly['stok_tersedia'] == 0,
        rolling_sales,
        df_weekly['sales']
    )

    # 6. Fitur Lag untuk Sentimen (sentimen minggu lalu → penjualan minggu ini)
    df_weekly['pos_lag1'] = df_weekly['positive'].shift(1).fillna(0)
    df_weekly['neg_lag1'] = df_weekly['negative'].shift(1).fillna(0)

    # 7. Format untuk Prophet (ds, y, dan regressor)
    df_prophet = df_weekly.reset_index().rename(columns={'date': 'ds', 'sales_clean': 'y'})
    df_prophet = df_prophet.fillna(0)

    return df_prophet, df_weekly