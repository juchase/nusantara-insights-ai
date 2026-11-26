from app.utils.db import SessionLocal

from app.services.forecasting_v2.forecast_engine import (
    generate_forecast,
)

from app.services.forecasting_v2.prediction_repository import (
    get_daily_sales_history,
    aggregate_weekly_history,
    build_forecast_dates,
    save_predictions,
)

def run_forecast_v2(product_id: str, frequency: str) -> dict:
    """
    Menjalankan forecasting V2 dan menyimpan hasilnya.

    frequency:
        D = Daily, horizon 7 hari
        W = Weekly, horizon 4 minggu

    Session database dikelola oleh service ini.
    """

    if not product_id or not product_id.strip():
        raise ValueError("product_id tidak boleh kosong.")

    if frequency not in {"D", "W"}:
        raise ValueError(
            f"Frequency tidak didukung: {frequency}"
        )

    db = SessionLocal()

    try:
        # 1. Ambil histori penjualan harian.
        daily_history = get_daily_sales_history(
            db=db,
            product_id=product_id,
        )

        if daily_history.empty:
            raise ValueError(
                f"Tidak ada histori penjualan untuk produk {product_id}."
            )

        # 2. Siapkan histori sesuai frequency.
        if frequency == "D":
            history = daily_history

        else:
            history = aggregate_weekly_history(
                daily_history
            )

        if history.empty:
            raise ValueError(
                "Histori penjualan kosong setelah preprocessing."
            )

        # 3. Jalankan forecasting engine.
        result = generate_forecast(
            product_id=product_id,
            frequency=frequency,
            history=history["y"].to_numpy(),
        )

        # 4. Buat tanggal prediksi.
        forecast_dates = build_forecast_dates(
            last_history_date=history["ds"].iloc[-1],
            frequency=frequency,
            horizon=len(result.forecast),
        )

        # 5. Simpan hasil ke database.
        # Bounds belum merupakan prediction interval statistik.
        model_version = (
            f"forecasting_v2:{frequency}:{result.model_used}"
        )

        total_inserted = save_predictions(
            db=db,
            product_id=product_id,
            forecast_dates=forecast_dates,
            forecast_values=result.forecast,
            model_version=model_version,
            frequency=frequency,
        )

        # 6. Commit hanya setelah seluruh proses berhasil.
        db.commit()

        forecast_values = list(result.forecast)

        return {
            "status": "success",
            "product_id": product_id,
            "freq": frequency,
            "model_used": result.model_used,
            "strategy": result.strategy,
            "fallback_used": result.fallback_used,
            "data_points": len(history),
            "totalInserted": total_inserted,
            "forecast": [
                {
                    "date": date.isoformat(),
                    "predicted_sales": value,
                }
                for date, value in zip(
                    forecast_dates,
                    forecast_values,
                )
            ],
            "forecast_summary": {
                "avg": round(
                    sum(forecast_values) / len(forecast_values),
                    2,
                ),
                "min": round(min(forecast_values), 2),
                "max": round(max(forecast_values), 2),
            },
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
