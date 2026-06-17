from app.utils.db import SessionLocal
from sqlalchemy import text
from datetime import timedelta
import pandas as pd
import numpy as np


def _get_prophet():
    from prophet import Prophet
    return Prophet


# ─────────────────────────────────────────────────────────────────────────────
# HELPER — DIAGNOSA DATA
# Menentukan karakteristik data sebelum memilih konfigurasi model
# ─────────────────────────────────────────────────────────────────────────────

def diagnose_data(df: pd.DataFrame) -> dict:
    """
    Analisis karakteristik data penjualan untuk menentukan
    konfigurasi Prophet yang paling sesuai.
    """
    y = df["y"].values

    mean    = float(np.mean(y))
    std     = float(np.std(y))
    cv      = (std / mean * 100) if mean > 0 else 999

    # Autocorrelation lag-1 — ukuran kekuatan pola sekuensial
    if len(y) > 2:
        autocorr = float(np.corrcoef(y[:-1], y[1:])[0, 1])
        if np.isnan(autocorr):
            autocorr = 0.0
    else:
        autocorr = 0.0

    days        = len(df)
    has_yearly  = days >= 365
    has_monthly = days >= 30

    # Deteksi apakah ada promotion_flag di dataframe
    has_promo   = "promo" in df.columns and df["promo"].sum() > 0

    print(f"📊 DIAGNOSA: days={days} | CV={cv:.1f}% | autocorr={autocorr:.3f} | promo={has_promo}")

    return {
        "days":        int(days),
        "mean":        round(float(mean), 1),
        "std":         round(float(std), 1),
        "cv_pct":      round(float(cv), 1),
        "autocorr":    round(float(autocorr), 3),
        "has_yearly":  bool(has_yearly),
        "has_monthly": bool(has_monthly),
        "has_promo":   bool(has_promo),
        "is_volatile": bool(cv > 50),
    }


# ─────────────────────────────────────────────────────────────────────────────
# HELPER — BUILD PROPHET MODEL
# Konfigurasi adaptif berdasarkan karakteristik data UMKM
# ─────────────────────────────────────────────────────────────────────────────

def build_prophet_model(df_train: pd.DataFrame, diagnosis: dict) -> object:
    """
    Konfigurasi Prophet yang disesuaikan untuk data penjualan UMKM:

    Prinsip tuning untuk UMKM:
    - Data UMKM biasanya pendek (< 90 hari) dan fluktuatif
    - Pola mingguan lebih dominan dari pola tahunan
    - Lonjakan karena promo perlu dipisahkan dari tren normal
    - Model harus konservatif — hindari overfit pada noise jangka pendek

    Parameter kunci:
    - changepoint_prior_scale : seberapa fleksibel model mengikuti perubahan tren
      Rendah (0.01–0.05) = konservatif, cocok untuk data pendek/noisy
      Tinggi (0.1–0.5)   = fleksibel, cocok untuk data panjang dengan tren jelas
    - seasonality_prior_scale : seberapa kuat efek musiman dimodelkan
      Rendah = musiman diperhalus, tinggi = musiman lebih dominan
    - seasonality_mode        : additive jika fluktuasi musiman konstan,
                                multiplicative jika fluktuasi musiman proporsional
    """
    Prophet = _get_prophet()

    days     = diagnosis["days"]
    volatile = diagnosis["is_volatile"]
    autocorr = diagnosis["autocorr"]

    # ── Pilih changepoint_prior_scale adaptif ────────────────────────────────
    # Data pendek + volatile → lebih konservatif agar tidak overfit noise
    # Data panjang + ada pola → lebih fleksibel untuk tangkap perubahan tren
    if days < 30:
        changepoint_prior = 0.01   # sangat konservatif — data sangat sedikit
    elif days < 60:
        changepoint_prior = 0.03   # konservatif — data masih terbatas
    elif days < 90:
        changepoint_prior = 0.05   # default — cukup konservatif
    elif volatile and abs(autocorr) < 0.3:
        changepoint_prior = 0.05   # volatile tanpa pola → tetap konservatif
    else:
        changepoint_prior = 0.1    # data cukup panjang + ada pola → lebih fleksibel

    # ── Pilih seasonality_mode ───────────────────────────────────────────────
    # UMKM dengan data fluktuatif lebih cocok multiplicative
    # karena magnitude fluktuasi cenderung proporsional dengan level penjualan
    seasonality_mode = "multiplicative" if volatile else "additive"

    # ── Pilih seasonality_prior_scale ────────────────────────────────────────
    # Data pendek → perhalus efek musiman agar tidak overfit
    seasonality_prior = 5.0 if days >= 60 else 2.0

    print(f"🔧 CONFIG: changepoint={changepoint_prior} | mode={seasonality_mode} | seasonality_prior={seasonality_prior}")

    model = Prophet(
        changepoint_prior_scale  = changepoint_prior,
        seasonality_prior_scale  = seasonality_prior,
        seasonality_mode         = seasonality_mode,
        weekly_seasonality       = True,          # pola hari kerja vs weekend — selalu aktif
        yearly_seasonality       = diagnosis["has_yearly"],   # aktif hanya jika data >= 1 tahun
        daily_seasonality        = False,         # tidak relevan untuk data harian agregat
        interval_width           = 0.80,          # uncertainty interval 80%
    )

    # ── Tambah seasonality bulanan jika data >= 30 hari ─────────────────────
    # Prophet default hanya punya weekly dan yearly
    # Monthly seasonality membantu tangkap pola awal/akhir bulan (gajian, dll)
    if diagnosis["has_monthly"]:
        model.add_seasonality(
            name   = "monthly",
            period = 30.5,
            fourier_order = 3,   # 3 = sederhana, cukup untuk pola bulanan UMKM
        )

    # ── Tambah promotion_flag sebagai regressor ──────────────────────────────
    # Memisahkan efek promo dari tren normal
    # → interval prediksi lebih sempit → confidence lebih tinggi
    if diagnosis["has_promo"]:
        model.add_regressor(
            "promo",
            prior_scale    = 10.0,  # efek promo bisa signifikan, beri ruang lebih
            standardize    = False, # 0/1 flag, tidak perlu standardisasi
            mode           = "multiplicative",
        )
        print("📣 Promotion flag diaktifkan sebagai regressor")

    # ── Tambah hari libur nasional Indonesia ─────────────────────────────────
    try:
        model.add_country_holidays(country_name="ID")
        print("🇮🇩 Holiday Indonesia ditambahkan")
    except Exception:
        pass

    model.fit(df_train)
    return model


# ─────────────────────────────────────────────────────────────────────────────
# HELPER — CONFIDENCE DARI INTERVAL
# ─────────────────────────────────────────────────────────────────────────────

def calculate_confidence(
    forecast:    pd.DataFrame,
    data_points: int,
    diagnosis:   dict,
) -> tuple[float, dict]:
    """
    Hitung confidence berdasarkan lebar uncertainty interval
    relatif terhadap nilai prediksi.

    Interval sempit  → confidence tinggi
    Interval lebar   → confidence rendah
    """
    yhat       = forecast["yhat"].values
    yhat_upper = forecast["yhat_upper"].values
    yhat_lower = forecast["yhat_lower"].values

    with np.errstate(divide="ignore", invalid="ignore"):
        rel_widths = np.where(
            yhat > 0,
            (yhat_upper - yhat_lower) / yhat,
            1.0,
        )

    avg_rel_width  = float(np.mean(rel_widths))
    raw_confidence = max(0.0, 1.0 - avg_rel_width) * 100

    # ── Penyesuaian berdasarkan jumlah data ──────────────────────────────────
    if data_points >= 180:
        raw_confidence = min(raw_confidence * 1.15, 95.0)  # bonus besar: data sangat cukup
    elif data_points >= 90:
        raw_confidence = min(raw_confidence * 1.10, 95.0)  # bonus sedang: data cukup
    elif data_points >= 30:
        raw_confidence = raw_confidence * 1.0               # netral: data minimal
    elif data_points >= 14:
        raw_confidence = raw_confidence * 0.85              # penalty ringan: data kurang
    else:
        raw_confidence = raw_confidence * 0.70              # penalty berat: data sangat kurang

    # ── Bonus jika ada promotion_flag (model lebih informatif) ───────────────
    if diagnosis.get("has_promo"):
        raw_confidence = min(raw_confidence * 1.05, 95.0)

    # ── Bonus jika ada pola sekuensial yang kuat ─────────────────────────────
    if abs(diagnosis.get("autocorr", 0)) > 0.5:
        raw_confidence = min(raw_confidence * 1.05, 95.0)

    confidence = round(max(5.0, min(raw_confidence, 95.0)), 2)

    # ── Context label dan pesan ───────────────────────────────────────────────
    if confidence >= 70:
        context = {
            "label":   "Akurasi Tinggi",
            "message": "Pola penjualan konsisten, prediksi interval dapat diandalkan.",
            "color":   "green",
        }
    elif confidence >= 40:
        context = {
            "label":   "Akurasi Sedang",
            "message": (
                f"Prediksi cukup andal dengan {data_points} hari data. "
                "Tambah data hingga 90 hari untuk akurasi lebih tinggi."
            ),
            "color":   "amber",
        }
    else:
        if data_points < 14:
            days_needed = 14 - data_points
            msg = (
                f"Data historis hanya {data_points} hari — minimal 14 hari diperlukan. "
                f"Tambahkan {days_needed} hari data lagi."
            )
        else:
            msg = (
                f"Pola penjualan masih fluktuatif dengan {data_points} hari data. "
                "Tambah data hingga 90 hari untuk hasil lebih akurat."
            )
        context = {
            "label":   "Akurasi Rendah",
            "message": msg,
            "color":   "red",
        }

    return confidence, context


# ─────────────────────────────────────────────────────────────────────────────
# MAIN SERVICE
# ─────────────────────────────────────────────────────────────────────────────

def predict_and_save(product_id: str):
    db = SessionLocal()

    try:
        print(f"🚀 START PROPHET PREDICTION: {product_id}")

        # ── AMBIL DATA PENJUALAN + PROMOTION FLAG DARI DB ────────────────────
        # Aggregasi per hari — ambil max promo flag (1 jika ada promo di hari itu)
        result = db.execute(text("""
            SELECT
                "date",
                SUM("quantity")                                       AS total_qty,
                MAX(COALESCE("promotionFlag"::int, 0))                AS promo_flag
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

        # ── SIAPKAN DATAFRAME ─────────────────────────────────────────────────
        df = pd.DataFrame(result, columns=["ds", "y", "promo"])
        df["ds"]    = pd.to_datetime(df["ds"])
        df["y"]     = df["y"].astype(float).clip(lower=0)  # clip retur ke 0
        df["promo"] = df["promo"].fillna(0).astype(float)

        data_points = len(df)
        has_promo   = df["promo"].sum() > 0

        print(f"📊 DATA HISTORIS: {data_points} hari ({df['ds'].min().date()} s/d {df['ds'].max().date()})")
        print(f"📣 Promotion flag: {'ada (' + str(int(df['promo'].sum())) + ' hari promo)' if has_promo else 'tidak ada'}")

        # ── DIAGNOSA DATA ─────────────────────────────────────────────────────
        diagnosis = diagnose_data(df)

        # ── LATIH MODEL PROPHET ───────────────────────────────────────────────
        print("🤖 Melatih model Prophet...")
        model = build_prophet_model(df, diagnosis)

        # ── BUAT FUTURE DATAFRAME + ISI PROMO FLAG ───────────────────────────
        future = model.make_future_dataframe(periods=7, freq="D")

        # Gabungkan promo flag historis ke future dataframe
        # 7 hari ke depan diasumsikan tidak ada promo (default 0)
        # UMKM bisa override ini secara manual jika tahu jadwal promo
        future = future.merge(
            df[["ds", "promo"]],
            on  = "ds",
            how = "left",
        )
        future["promo"] = future["promo"].fillna(0).astype(float)

        # ── PREDIKSI ──────────────────────────────────────────────────────────
        forecast        = model.predict(future)
        forecast_future = forecast.tail(7).copy()

        # Clip ke 0 — penjualan tidak bisa negatif
        for col in ["yhat", "yhat_lower", "yhat_upper"]:
            forecast_future[col] = forecast_future[col].clip(lower=0)

        print(f"📈 PREDIKSI 7 HARI:")
        for _, row in forecast_future.iterrows():
            print(f"   {row['ds'].date()} → {row['yhat']:.1f} [{row['yhat_lower']:.1f} – {row['yhat_upper']:.1f}]")

        # ── HITUNG CONFIDENCE ─────────────────────────────────────────────────
        confidence, confidence_context = calculate_confidence(
            forecast_future, data_points, diagnosis
        )
        print(f"📊 CONFIDENCE: {confidence}% ({confidence_context['label']})")

        # ── SIMPAN KE DB ──────────────────────────────────────────────────────
        db.execute(text("""
            DELETE FROM "Prediction" WHERE "productId" = :product_id
        """), {"product_id": product_id})

        for _, row in forecast_future.iterrows():
            pred_date  = row["ds"].date()
            pred_value = int(round(row["yhat"]))
            pred_upper = int(round(row["yhat_upper"]))
            pred_lower = int(round(row["yhat_lower"]))

            try:
                db.execute(text("""
                    INSERT INTO "Prediction" (
                        "id", "productId", "predictionDate",
                        "predictedSales", "upperBound", "lowerBound", "createdAt"
                    )
                    VALUES (
                        gen_random_uuid(), :product_id, :pred_date,
                        :pred_value, :pred_upper, :pred_lower, NOW()
                    )
                """), {
                    "product_id": product_id,
                    "pred_date":  pred_date,
                    "pred_value": pred_value,
                    "pred_upper": pred_upper,
                    "pred_lower": pred_lower,
                })
            except Exception:
                # Fallback jika kolom upperBound/lowerBound belum ada
                db.execute(text("""
                    INSERT INTO "Prediction" (
                        "id", "productId", "predictionDate", "predictedSales", "createdAt"
                    )
                    VALUES (gen_random_uuid(), :product_id, :pred_date, :pred_value, NOW())
                """), {
                    "product_id": product_id,
                    "pred_date":  pred_date,
                    "pred_value": pred_value,
                })

            print(f"   INSERTED: {pred_value} on {pred_date} [{pred_lower}–{pred_upper}]")

        db.commit()
        print("✅ COMMIT SUCCESS")

        # ── GROWTH ────────────────────────────────────────────────────────────
        last_actual    = float(df["y"].iloc[-1])
        avg_prediction = float(forecast_future["yhat"].mean())
        growth = (
            round(((avg_prediction - last_actual) / last_actual) * 100, 1)
            if last_actual > 0 else 0
        )

        return {
            "status":             "success",
            "totalInserted":      int(len(forecast_future)),
            "growth":             float(growth),
            "confidence":         float(confidence),
            "confidence_context": confidence_context,
            "model_used":         "prophet",
            "data_points":        int(data_points),
            "diagnosis": {
                k: (bool(v) if isinstance(v, (bool, np.bool_)) else
                    int(v)  if isinstance(v, (int,  np.integer)) else
                    float(v) if isinstance(v, (float, np.floating)) else v)
                for k, v in diagnosis.items()
            },
            "forecast_summary": {
                "avg":   round(float(avg_prediction), 1),
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