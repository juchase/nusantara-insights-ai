from app.utils.db import SessionLocal
from sqlalchemy import text
from datetime import datetime, timedelta
import pandas as pd
import numpy as np


def _get_prophet():
    from prophet import Prophet
    return Prophet


def diagnose_data(df: pd.DataFrame) -> dict:
    y = df["y"].values
    mean    = float(np.mean(y))
    std     = float(np.std(y))
    cv      = (std / mean * 100) if mean > 0 else 999
    if len(y) > 2:
        autocorr = float(np.corrcoef(y[:-1], y[1:])[0, 1])
        if np.isnan(autocorr):
            autocorr = 0.0
    else:
        autocorr = 0.0
    days        = len(df)
    has_yearly  = days >= 365
    has_monthly = days >= 30
    has_promo   = "promo" in df.columns and df["promo"].sum() > 0
    print(f"📊 DIAGNOSA: days={days} | CV={cv:.1f}% | autocorr={autocorr:.3f} | promo={has_promo}")
    return {
        "days": int(days),
        "mean": round(float(mean), 1),
        "std": round(float(std), 1),
        "cv_pct": round(float(cv), 1),
        "autocorr": round(float(autocorr), 3),
        "has_yearly": bool(has_yearly),
        "has_monthly": bool(has_monthly),
        "has_promo": bool(has_promo),
        "is_volatile": bool(cv > 50),
    }


def build_prophet_model(df_train: pd.DataFrame, diagnosis: dict, freq: str = "D") -> object:
    Prophet = _get_prophet()
    days     = diagnosis["days"]
    volatile = diagnosis["is_volatile"]
    autocorr = diagnosis["autocorr"]

    if days < 30:
        changepoint_prior = 0.01
    elif days < 60:
        changepoint_prior = 0.03
    elif days < 90:
        changepoint_prior = 0.05
    elif volatile and abs(autocorr) < 0.3:
        changepoint_prior = 0.05
    else:
        changepoint_prior = 0.1

    seasonality_mode = "multiplicative" if volatile else "additive"
    seasonality_prior = 5.0 if days >= 60 else 2.0

    print(f"🔧 CONFIG: changepoint={changepoint_prior} | mode={seasonality_mode} | seasonality_prior={seasonality_prior} | freq={freq}")

    model = Prophet(
        changepoint_prior_scale  = changepoint_prior,
        seasonality_prior_scale  = seasonality_prior,
        seasonality_mode         = seasonality_mode,
        weekly_seasonality       = True if freq == "D" else False,
        yearly_seasonality       = diagnosis["has_yearly"],
        daily_seasonality        = False,
        interval_width           = 0.80,
    )

    if diagnosis["has_monthly"] and freq == "D":
        model.add_seasonality(name="monthly", period=30.5, fourier_order=3)

    if diagnosis["has_promo"]:
        model.add_regressor("promo", prior_scale=10.0, standardize=False, mode="multiplicative")
        print("📣 Promotion flag diaktifkan sebagai regressor")

    try:
        model.add_country_holidays(country_name="ID")
        print("🇮🇩 Holiday Indonesia ditambahkan")
    except Exception:
        pass

    if "stok_tersedia" in df_train.columns:
        model.add_regressor("stok_tersedia")
    if "pos_lag1" in df_train.columns:
        model.add_regressor("pos_lag1")
    if "neg_lag1" in df_train.columns:
        model.add_regressor("neg_lag1")

    model.fit(df_train)
    return model


def calculate_confidence(forecast: pd.DataFrame, data_points: int, diagnosis: dict) -> tuple[float, dict]:
    yhat       = forecast["yhat"].values
    yhat_upper = forecast["yhat_upper"].values
    yhat_lower = forecast["yhat_lower"].values
    with np.errstate(divide="ignore", invalid="ignore"):
        rel_widths = np.where(yhat > 0, (yhat_upper - yhat_lower) / yhat, 1.0)
    avg_rel_width  = float(np.mean(rel_widths))
    raw_confidence = max(0.0, 1.0 - avg_rel_width) * 100
    if data_points >= 180:
        raw_confidence = min(raw_confidence * 1.15, 95.0)
    elif data_points >= 90:
        raw_confidence = min(raw_confidence * 1.10, 95.0)
    elif data_points >= 30:
        raw_confidence = raw_confidence * 1.0
    elif data_points >= 14:
        raw_confidence = raw_confidence * 0.85
    else:
        raw_confidence = raw_confidence * 0.70
    if diagnosis.get("has_promo"):
        raw_confidence = min(raw_confidence * 1.05, 95.0)
    if abs(diagnosis.get("autocorr", 0)) > 0.5:
        raw_confidence = min(raw_confidence * 1.05, 95.0)
    confidence = round(max(5.0, min(raw_confidence, 95.0)), 2)

    if confidence >= 70:
        context = {"label": "Akurasi Tinggi", "message": "Pola penjualan konsisten, prediksi interval dapat diandalkan.", "color": "green"}
    elif confidence >= 40:
        context = {"label": "Akurasi Sedang", "message": f"Prediksi cukup andal dengan {data_points} data poin. Tambah data hingga 90 hari untuk akurasi lebih tinggi.", "color": "amber"}
    else:
        if data_points < 14:
            msg = f"Data historis hanya {data_points} poin — minimal 14 poin diperlukan. Tambahkan {14-data_points} data poin lagi."
        else:
            msg = f"Pola penjualan masih fluktuatif dengan {data_points} data poin. Tambah data hingga 90 poin untuk hasil lebih akurat."
        context = {"label": "Akurasi Rendah", "message": msg, "color": "red"}
    return confidence, context


def _forecast_with_moving_average(df: pd.DataFrame, db, product_id: str, freq: str = "W"):
    """Prediksi menggunakan Weighted Moving Average"""
    last_weeks = df["y"].tail(min(3, len(df))).values
    weights = [0.5, 0.3, 0.2][:len(last_weeks)]
    weighted_avg = np.average(last_weeks, weights=weights) if len(last_weeks) > 0 else 0

    if freq == "W":
        future_dates = pd.date_range(start=df["ds"].max() + pd.Timedelta(weeks=1), periods=4, freq="W-MON")
    else:
        future_dates = pd.date_range(start=df["ds"].max() + pd.Timedelta(days=1), periods=7, freq="D")

    forecast_future = pd.DataFrame({
        "ds": future_dates,
        "yhat": weighted_avg,
        "yhat_lower": max(0, weighted_avg * 0.7),
        "yhat_upper": weighted_avg * 1.3,
    })

    db.execute(text("""
        DELETE FROM "Prediction" WHERE "productId" = :product_id
    """), {"product_id": product_id})
    for _, row in forecast_future.iterrows():
        # ── PERBAIKAN: Tambahkan modelVersion ──
        db.execute(text("""
            INSERT INTO "Prediction" (
                "id", "productId", "predictionDate",
                "predictedSales", "upperBound", "lowerBound", "createdAt",
                "modelVersion"
            ) VALUES (
                gen_random_uuid(), :product_id, :pred_date,
                :pred_value, :pred_upper, :pred_lower, NOW(),
                :model_version
            )
        """), {
            "product_id": product_id,
            "pred_date": row["ds"].date(),
            "pred_value": int(round(row["yhat"])),
            "pred_upper": int(round(row["yhat_upper"])),
            "pred_lower": int(round(row["yhat_lower"])),
            "model_version": "moving_average"
        })
    db.commit()

    raw_growth = round(((weighted_avg - df["y"].mean()) / df["y"].mean()) * 100, 1) if df["y"].mean() > 0 else 0
    avg_pred = weighted_avg

    # ── Logika low-volume untuk Moving Average ──────────────────────────────
    if avg_pred < 30 and abs(raw_growth) > 50:
        growth = 0.0
        growth_display = f"+{round(avg_pred)} unit"
    else:
        growth = raw_growth
        if growth > 0:
            growth_display = f"+{growth:.1f}%"
        elif growth < 0:
            growth_display = f"{growth:.1f}%"
        else:
            growth_display = "stabil"

    return {
        "status": "success",
        "totalInserted": len(forecast_future),
        "growth": growth,
        "growth_display": growth_display,
        "confidence": 35.0,
        "confidence_context": {
            "label": "Estimasi Kasar",
            "message": f"Data sangat terbatas, prediksi menggunakan rata-rata tertimbang.",
            "color": "amber",
        },
        "model_used": "moving_average",
        "freq": freq,
        "data_points": len(df),
        "diagnosis": {},
        "forecast_summary": {
            "avg": round(weighted_avg, 1),
            "min": round(forecast_future["yhat"].min(), 1),
            "max": round(forecast_future["yhat"].max(), 1),
            "lower": round(forecast_future["yhat_lower"].mean(), 1),
            "upper": round(forecast_future["yhat_upper"].mean(), 1),
        }
    }


def predict_and_save(product_id: str):
    db = SessionLocal()
    try:
        print(f"🚀 START FORECASTING (HYBRID) untuk {product_id}")

        # ── PASS 1: DATA HARIAN ────────────────────────────────────────────
        sales_daily_query = """
            SELECT
                "date" AS ds,
                SUM(quantity) AS y,
                MAX(COALESCE("promotionFlag"::int, 0)) AS promo
            FROM "Sales"
            WHERE "productId" = :product_id
            GROUP BY ds
            ORDER BY ds
        """
        daily_result = db.execute(text(sales_daily_query), {"product_id": product_id}).fetchall()

        if not daily_result:
            print("⚠️ Tidak ada data penjualan. Menggunakan dummy harian.")
            return _forecast_with_moving_average(
                pd.DataFrame(columns=["ds", "y", "promo"]), db, product_id, freq="D"
            )

        df_daily = pd.DataFrame(daily_result, columns=["ds", "y", "promo"])
        df_daily["ds"] = pd.to_datetime(df_daily["ds"])
        df_daily["y"] = df_daily["y"].astype(float).clip(lower=0)
        df_daily["promo"] = df_daily["promo"].fillna(0).astype(float)

        # ── Ambil review harian (untuk regressor) ────────────────────────
        review_daily_query = """
            SELECT
                "reviewDate" AS ds,
                COUNT(*) AS total_reviews,
                COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) AS pos,
                COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) AS neg
            FROM "Review"
            WHERE "productId" = :product_id
            GROUP BY ds
        """
        review_daily = db.execute(text(review_daily_query), {"product_id": product_id}).fetchall()
        df_rev = pd.DataFrame(review_daily, columns=["ds", "total_reviews", "pos", "neg"])
        df_daily = df_daily.merge(df_rev, on="ds", how="outer").fillna(0)

        df_daily["stok_tersedia"] = np.where((df_daily["y"] == 0) & (df_daily["total_reviews"] == 0), 0, 1)
        df_daily["pos_lag1"] = df_daily["pos"].shift(1).fillna(0)
        df_daily["neg_lag1"] = df_daily["neg"].shift(1).fillna(0)
        df_daily = df_daily.dropna().reset_index(drop=True)

        data_points_daily = len(df_daily)
        if data_points_daily < 7:
            print("⚠️ Data harian < 7 hari. Beralih ke mingguan.")
            return _forecast_weekly_fallback(db, product_id, df_daily)

        diagnosis_daily = diagnose_data(df_daily)

        # ── Pass 1: Forecast harian ──────────────────────────────────────────
        print("🤖 Pass 1: Forecast harian...")
        model_daily = build_prophet_model(df_daily, diagnosis_daily, freq="D")

        future_daily = model_daily.make_future_dataframe(periods=7, freq="D")
        future_daily["stok_tersedia"] = 1
        future_daily["pos_lag1"] = 0
        future_daily["neg_lag1"] = 0
        future_daily = future_daily.merge(df_daily[["ds", "promo"]], on="ds", how="left")
        future_daily["promo"] = future_daily["promo"].fillna(0)

        forecast_daily = model_daily.predict(future_daily)
        forecast_daily_future = forecast_daily.tail(7).copy()
        for col in ["yhat", "yhat_lower", "yhat_upper"]:
            forecast_daily_future[col] = forecast_daily_future[col].clip(lower=0)

        confidence_daily, context_daily = calculate_confidence(
            forecast_daily_future, data_points_daily, diagnosis_daily
        )
        print(f"📊 PASS 1 Confidence: {confidence_daily}% ({context_daily['label']})")

        if confidence_daily >= 40:
            print("✅ PASS 1 diterima (confidence >= 40%)")
            db.execute(text("""
                DELETE FROM "Prediction" WHERE "productId" = :product_id
            """), {"product_id": product_id})
            for _, row in forecast_daily_future.iterrows():
                # ── PERBAIKAN: Tambahkan modelVersion ──
                db.execute(text("""
                    INSERT INTO "Prediction" (
                        "id", "productId", "predictionDate",
                        "predictedSales", "upperBound", "lowerBound", "createdAt",
                        "modelVersion"
                    ) VALUES (
                        gen_random_uuid(), :product_id, :pred_date,
                        :pred_value, :pred_upper, :pred_lower, NOW(),
                        :model_version
                    )
                """), {
                    "product_id": product_id,
                    "pred_date": row["ds"].date(),
                    "pred_value": int(round(row["yhat"])),
                    "pred_upper": int(round(row["yhat_upper"])),
                    "pred_lower": int(round(row["yhat_lower"])),
                    "model_version": "prophet"
                })
            db.commit()

            # ── Hitung growth untuk produk harian yang stabil ──────────────
            last_actual = float(df_daily["y"].iloc[-1])
            avg_pred = float(forecast_daily_future["yhat"].mean())
            raw_growth = round(((avg_pred - last_actual) / last_actual) * 100, 1) if last_actual > 0 else 0

            # Logika low-volume untuk produk harian (volume rendah)
            if avg_pred < 10 and abs(raw_growth) > 50:
                growth = 0.0
                growth_display = f"+{round(avg_pred)} unit"
            else:
                growth = raw_growth
                if growth > 0:
                    growth_display = f"+{growth:.1f}%"
                elif growth < 0:
                    growth_display = f"{growth:.1f}%"
                else:
                    growth_display = "stabil"

            return {
                "status": "success",
                "totalInserted": 7,
                "growth": growth,
                "growth_display": growth_display,
                "confidence": confidence_daily,
                "confidence_context": context_daily,
                "model_used": "prophet",
                "freq": "D",
                "data_points": data_points_daily,
                "diagnosis": diagnosis_daily,
                "forecast_summary": {
                    "avg": round(float(avg_pred), 1),
                    "min": round(float(forecast_daily_future["yhat"].min()), 1),
                    "max": round(float(forecast_daily_future["yhat"].max()), 1),
                    "lower": round(float(forecast_daily_future["yhat_lower"].mean()), 1),
                    "upper": round(float(forecast_daily_future["yhat_upper"].mean()), 1),
                }
            }

        # ── PASS 2: Forecast mingguan ──────────────────────────────────────
        print("🔁 PASS 1 confidence < 40%, beralih ke PASS 2 (mingguan)...")
        return _forecast_weekly_fallback(db, product_id, df_daily)

    except Exception as e:
        db.rollback()
        print(f"🔥 ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
    finally:
        db.close()


def _forecast_weekly_fallback(db, product_id: str, df_daily: pd.DataFrame):
    """Helper: ambil data mingguan dan lakukan forecast (Prophet atau Moving Average)."""
    df_daily["ds"] = pd.to_datetime(df_daily["ds"])
    df_daily.set_index("ds", inplace=True)
    df_weekly = df_daily.resample("W-MON").sum()
    df_weekly.reset_index(inplace=True)
    df_weekly["promo"] = df_weekly["promo"].fillna(0)
    df_weekly["total_reviews"] = df_weekly["total_reviews"].fillna(0)
    df_weekly["stok_tersedia"] = np.where((df_weekly["y"] == 0) & (df_weekly["total_reviews"] == 0), 0, 1)
    df_weekly["pos_lag1"] = df_weekly["pos"].shift(1).fillna(0)
    df_weekly["neg_lag1"] = df_weekly["neg"].shift(1).fillna(0)
    df_weekly = df_weekly.dropna().reset_index(drop=True)

    if len(df_weekly) < 4:
        print("⚠️ Data mingguan < 4 minggu. Menggunakan Moving Average.")
        return _forecast_with_moving_average(df_weekly, db, product_id, freq="W")

    diagnosis_weekly = diagnose_data(df_weekly)
    avg_sales_per_week = diagnosis_weekly["mean"]
    if avg_sales_per_week < 5:
        print("⚠️ Penjualan mingguan rata-rata < 5 unit. Menggunakan Moving Average.")
        return _forecast_with_moving_average(df_weekly, db, product_id, freq="W")

    print("🤖 PASS 2: Forecast mingguan dengan Prophet...")
    model_weekly = build_prophet_model(df_weekly, diagnosis_weekly, freq="W")

    future_weekly = model_weekly.make_future_dataframe(periods=4, freq="W-MON")
    future_weekly["stok_tersedia"] = 1
    future_weekly["pos_lag1"] = 0
    future_weekly["neg_lag1"] = 0
    future_weekly = future_weekly.merge(df_weekly[["ds", "promo"]], on="ds", how="left")
    future_weekly["promo"] = future_weekly["promo"].fillna(0)

    forecast_weekly = model_weekly.predict(future_weekly)
    forecast_weekly_future = forecast_weekly.tail(4).copy()
    for col in ["yhat", "yhat_lower", "yhat_upper"]:
        forecast_weekly_future[col] = forecast_weekly_future[col].clip(lower=0)

    confidence_weekly, context_weekly = calculate_confidence(
        forecast_weekly_future, len(df_weekly), diagnosis_weekly
    )
    confidence_weekly = max(confidence_weekly, 25.0)
    print(f"📊 PASS 2 Confidence: {confidence_weekly}% ({context_weekly['label']})")

    db.execute(text("""
        DELETE FROM "Prediction" WHERE "productId" = :product_id
    """), {"product_id": product_id})
    for _, row in forecast_weekly_future.iterrows():
        # ── PERBAIKAN: modelVersion untuk Prophet mingguan ──
        db.execute(text("""
            INSERT INTO "Prediction" (
                "id", "productId", "predictionDate",
                "predictedSales", "upperBound", "lowerBound", "createdAt",
                "modelVersion"
            ) VALUES (
                gen_random_uuid(), :product_id, :pred_date,
                :pred_value, :pred_upper, :pred_lower, NOW(),
                :model_version
            )
        """), {
            "product_id": product_id,
            "pred_date": row["ds"].date(),
            "pred_value": int(round(row["yhat"])),
            "pred_upper": int(round(row["yhat_upper"])),
            "pred_lower": int(round(row["yhat_lower"])),
            "model_version": "prophet"
        })
    db.commit()

    last_actual = float(df_weekly["y"].iloc[-1])
    avg_pred = float(forecast_weekly_future["yhat"].mean())
    raw_growth = round(((avg_pred - last_actual) / last_actual) * 100, 1) if last_actual > 0 else 0

    # ── Logika low-volume untuk Prophet mingguan ────────────────────────────
    # Untuk mingguan, jika avg_pred < 10 dan growth ekstrem, set growth = 0
    if avg_pred < 10 and abs(raw_growth) > 50:
        growth = 0.0
        growth_display = f"+{round(avg_pred)} unit"
    else:
        growth = raw_growth
        if growth > 0:
            growth_display = f"+{growth:.1f}%"
        elif growth < 0:
            growth_display = f"{growth:.1f}%"
        else:
            growth_display = "stabil"

    return {
        "status": "success",
        "totalInserted": 4,
        "growth": growth,
        "growth_display": growth_display,
        "confidence": confidence_weekly,
        "confidence_context": context_weekly,
        "model_used": "prophet",
        "freq": "W",
        "data_points": len(df_weekly),
        "diagnosis": diagnosis_weekly,
        "forecast_summary": {
            "avg": round(float(avg_pred), 1),
            "min": round(float(forecast_weekly_future["yhat"].min()), 1),
            "max": round(float(forecast_weekly_future["yhat"].max()), 1),
            "lower": round(float(forecast_weekly_future["yhat_lower"].mean()), 1),
            "upper": round(float(forecast_weekly_future["yhat_upper"].mean()), 1),
        }
    }