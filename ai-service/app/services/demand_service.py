from app.utils.db import SessionLocal
from sqlalchemy import text
from datetime import timedelta
import pandas as pd
import numpy as np

# Prophet diimport di dalam fungsi untuk menghindari cold-start lambat di level modul
# Kalau ingin pre-load, pindahkan ke atas file setelah instalasi stabil
def _get_prophet():
    from prophet import Prophet
    return Prophet


# ─────────────────────────────────────────
# HELPER — BUILD PROPHET MODEL
# ─────────────────────────────────────────

def build_prophet_model(df_train: pd.DataFrame) -> object:
    """
    Buat dan latih model Prophet dari DataFrame dengan kolom ds dan y.
    Konfigurasi disesuaikan untuk data penjualan UMKM harian:
    - weekly_seasonality  : aktif — pola hari kerja vs akhir pekan
    - yearly_seasonality  : aktif jika data >= 1 tahun, nonaktif jika lebih sedikit
    - seasonality_mode    : multiplicative — lebih cocok untuk data ritel yang fluktuatif
    - interval_width      : 0.80 — uncertainty interval 80%
    """
    Prophet = _get_prophet()

    has_yearly = (df_train["ds"].max() - df_train["ds"].min()).days >= 365

    model = Prophet(
        weekly_seasonality=True,
        yearly_seasonality=has_yearly,
        daily_seasonality=False,
        seasonality_mode="multiplicative",
        interval_width=0.80,
        changepoint_prior_scale=0.05,   # konservatif — hindari overfit pada lonjakan sesaat
    )

    # Tambahkan hari libur nasional Indonesia
    # Prophet akan memperhitungkan Lebaran, Natal, dll sebagai efek khusus
    try:
        model.add_country_holidays(country_name="ID")
    except Exception:
        # Fallback jika holidays belum tersedia di environment
        pass

    model.fit(df_train)
    return model


# ─────────────────────────────────────────
# HELPER — CONFIDENCE DARI INTERVAL
# ─────────────────────────────────────────

def calculate_confidence(forecast: pd.DataFrame, data_points: int) -> tuple[float, dict]:
    """
    Hitung confidence berdasarkan lebar uncertainty interval relatif terhadap prediksi.
    Interval sempit = confidence tinggi, interval lebar = confidence rendah.
    """
    yhat       = forecast["yhat"].values
    yhat_upper = forecast["yhat_upper"].values
    yhat_lower = forecast["yhat_lower"].values

    # Relative interval width — seberapa lebar interval dibanding nilai prediksi
    with np.errstate(divide="ignore", invalid="ignore"):
        rel_widths = np.where(
            yhat > 0,
            (yhat_upper - yhat_lower) / yhat,
            1.0
        )

    avg_rel_width = float(np.mean(rel_widths))

    # Konversi ke confidence (interval lebar → confidence rendah)
    raw_confidence = max(0.0, 1.0 - avg_rel_width) * 100

    # Bonus kecil jika data historis banyak
    if data_points >= 90:
        raw_confidence = min(raw_confidence * 1.1, 95.0)
    elif data_points < 14:
        raw_confidence *= 0.75   # penalty data sedikit

    confidence = round(max(5.0, min(raw_confidence, 95.0)), 2)

    # Context label
    if confidence >= 70:
        context = {
            "label":   "Akurasi Tinggi",
            "message": "Pola penjualan konsisten, prediksi interval dapat diandalkan",
            "color":   "green",
        }
    elif confidence >= 40:
        context = {
            "label":   "Akurasi Sedang",
            "message": "Ada pola tren, gunakan sebagai referensi perencanaan stok",
            "color":   "amber",
        }
    else:
        context = {
            "label":   "Akurasi Rendah",
            "message": "Tambah data historis lebih banyak untuk hasil lebih akurat",
            "color":   "red",
        }

    return confidence, context


# ─────────────────────────────────────────
# MAIN SERVICE
# ─────────────────────────────────────────

def predict_and_save(product_id: str):
    db = SessionLocal()

    try:
        print(f"🚀 START PROPHET PREDICTION: {product_id}")

        # ── AMBIL DATA DARI DB ────────────────────────────────────────
        result = db.execute(text("""
            SELECT "date", SUM("quantity") as total_qty
            FROM "Sales"
            WHERE "productId" = :product_id
            GROUP BY "date"
            ORDER BY "date" ASC
        """), {"product_id": product_id}).fetchall()

        if not result or len(result) < 7:
            print("⚠ Data tidak cukup untuk prediksi (minimal 7 hari)")
            return {
                "status":        "insufficient_data",
                "message":       "Minimal 7 data penjualan harian diperlukan untuk prediksi Prophet",
                "totalInserted": 0,
                "confidence":    0,
            }

        # ── SIAPKAN DATAFRAME PROPHET (kolom: ds, y) ──────────────────
        df = pd.DataFrame(result, columns=["ds", "y"])
        df["ds"] = pd.to_datetime(df["ds"])
        df["y"]  = df["y"].astype(float)

        # Clip nilai negatif (retur) ke 0 — penjualan tidak boleh negatif
        df["y"] = df["y"].clip(lower=0)

        data_points = len(df)
        print(f"📊 DATA HISTORIS: {data_points} hari ({df['ds'].min().date()} s/d {df['ds'].max().date()})")

        # ── LATIH MODEL PROPHET ───────────────────────────────────────
        print("🤖 Melatih model Prophet...")
        model = build_prophet_model(df)

        # ── BUAT PREDIKSI 7 HARI KE DEPAN ────────────────────────────
        future    = model.make_future_dataframe(periods=7, freq="D")
        forecast  = model.predict(future)

        # Ambil hanya 7 hari prediksi (bukan historis)
        forecast_future = forecast.tail(7).copy()

        # Clip prediksi negatif ke 0
        forecast_future["yhat"]       = forecast_future["yhat"].clip(lower=0)
        forecast_future["yhat_lower"] = forecast_future["yhat_lower"].clip(lower=0)
        forecast_future["yhat_upper"] = forecast_future["yhat_upper"].clip(lower=0)

        print(f"📈 PREDIKSI 7 HARI:")
        for _, row in forecast_future.iterrows():
            print(f"   {row['ds'].date()} → {row['yhat']:.1f} [{row['yhat_lower']:.1f} – {row['yhat_upper']:.1f}]")

        # ── HITUNG CONFIDENCE ─────────────────────────────────────────
        confidence, confidence_context = calculate_confidence(forecast_future, data_points)
        print(f"📊 CONFIDENCE: {confidence}% ({confidence_context['label']})")

        # ── SIMPAN KE DB ──────────────────────────────────────────────
        # Hapus prediksi lama
        db.execute(text("""
            DELETE FROM "Prediction"
            WHERE "productId" = :product_id
        """), {"product_id": product_id})

        # Insert prediksi baru beserta upper dan lower bound
        for _, row in forecast_future.iterrows():
            pred_date      = row["ds"].date()
            pred_value     = int(round(row["yhat"]))
            pred_upper     = int(round(row["yhat_upper"]))
            pred_lower     = int(round(row["yhat_lower"]))

            # Cek apakah kolom upperBound dan lowerBound sudah ada di tabel Prediction
            # Jika belum, gunakan INSERT tanpa kolom tersebut dan tambahkan migrasi Prisma
            try:
                db.execute(text("""
                    INSERT INTO "Prediction" ("id", "productId", "predictionDate", "predictedSales", "upperBound", "lowerBound", "createdAt")
                    VALUES (gen_random_uuid(), :product_id, :pred_date, :pred_value, :pred_upper, :pred_lower, NOW())
                """), {
                    "product_id": product_id,
                    "pred_date":  pred_date,
                    "pred_value": pred_value,
                    "pred_upper": pred_upper,
                    "pred_lower": pred_lower,
                })
            except Exception:
                # Fallback: insert tanpa upper/lower jika kolom belum ada
                db.execute(text("""
                    INSERT INTO "Prediction" ("id", "productId", "predictionDate", "predictedSales", "createdAt")
                    VALUES (gen_random_uuid(), :product_id, :pred_date, :pred_value, NOW())
                """), {
                    "product_id": product_id,
                    "pred_date":  pred_date,
                    "pred_value": pred_value,
                })
            print(f"   INSERTED: {pred_value} on {pred_date}")

        db.commit()
        print("✅ COMMIT SUCCESS")

        # ── HITUNG GROWTH ─────────────────────────────────────────────
        last_actual    = float(df["y"].iloc[-1])
        avg_prediction = float(forecast_future["yhat"].mean())
        growth = round(((avg_prediction - last_actual) / last_actual) * 100, 1) if last_actual > 0 else 0

        return {
            "status":             "success",
            "totalInserted":      len(forecast_future),
            "growth":             growth,
            "confidence":         confidence,
            "confidence_context": confidence_context,
            "model_used":         "prophet",
            "data_points":        data_points,
            "forecast_summary": {
                "avg":   round(avg_prediction, 1),
                "min":   round(float(forecast_future["yhat"].min()), 1),
                "max":   round(float(forecast_future["yhat"].max()), 1),
                "lower": round(float(forecast_future["yhat_lower"].mean()), 1),
                "upper": round(float(forecast_future["yhat_upper"].mean()), 1),
            },
        }

    except Exception as e:
        db.rollback()
        print(f"🔥 ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

    finally:
        db.close()