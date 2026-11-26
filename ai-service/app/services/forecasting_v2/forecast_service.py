from __future__ import annotations
import numpy as np
from app.utils.db import SessionLocal
from app.services.forecasting_v2.adaptive_selection.selection_service import resolve_selection
from app.services.forecasting_v2.confidence import calculate_forecast_confidence
from app.services.forecasting_v2.forecast_engine import generate_forecast
from app.services.forecasting_v2.prediction_repository import aggregate_weekly_history, build_forecast_dates, get_daily_sales_history, save_predictions

def _calculate_growth(history_values, forecast_values):
    history = np.asarray(history_values, dtype=float); forecast = np.asarray(forecast_values, dtype=float)
    baseline = float(np.mean(history[-min(7, len(history)):])) if len(history) else 0.0
    forecast_average = float(np.mean(forecast)) if len(forecast) else 0.0
    growth = 0.0 if baseline <= 0 and forecast_average <= 0 else 100.0 if baseline <= 0 else ((forecast_average - baseline) / baseline) * 100.0
    return round(float(growth), 2), "meningkat" if growth > 1 else "menurun" if growth < -1 else "stabil"

def run_forecast_v2(product_id: str, frequency: str) -> dict:
    if not product_id or not product_id.strip(): raise ValueError("product_id tidak boleh kosong.")
    if frequency not in {"D", "W"}: raise ValueError(f"Frequency tidak didukung: {frequency}")
    db = SessionLocal()
    try:
        daily_history = get_daily_sales_history(db, product_id)
        if daily_history.empty: raise ValueError(f"Tidak ada histori penjualan untuk produk {product_id}.")
        history = daily_history if frequency == "D" else aggregate_weekly_history(daily_history)
        if history.empty: raise ValueError("Histori penjualan kosong setelah preprocessing.")
        values = history["y"].to_numpy(dtype=float)
        resolution = resolve_selection(db, product_id, frequency, values)
        result = generate_forecast(product_id, frequency, values, resolution.selection, resolution.strategy, resolution.fallback_required, resolution.evaluation_status)
        forecast_dates = build_forecast_dates(history["ds"].iloc[-1], frequency, len(result.forecast))
        model_version = f"forecasting_v2:{frequency}:{result.model_used}"
        total_inserted = save_predictions(db, product_id, forecast_dates, result.forecast, model_version, frequency)
        confidence = calculate_forecast_confidence(result.validation_wape, result.n_predictions, result.fallback_used, result.evaluation_status)
        growth, growth_display = _calculate_growth(values, result.forecast)
        db.commit()
        forecast_values = list(result.forecast)
        return {
            "status": "success", "product_id": product_id, "freq": frequency,
            "model_selected": result.model_selected, "model_used": result.model_used,
            "strategy": result.strategy, "fallback_used": result.fallback_used,
            "selection_reason": result.selection_reason, "evaluation_status": result.evaluation_status,
            "data_points": len(history), "totalInserted": total_inserted,
            "validation": {"mae": result.validation_mae, "rmse": result.validation_rmse, "wape": result.validation_wape, "n_predictions": result.n_predictions},
            "confidence": confidence.to_dict(), "growth": growth, "growth_display": growth_display,
            "forecast": [{"date": date.isoformat(), "predicted_sales": value} for date, value in zip(forecast_dates, forecast_values)],
            "forecast_summary": {"avg": round(sum(forecast_values) / len(forecast_values), 2), "min": round(min(forecast_values), 2), "max": round(max(forecast_values), 2)},
        }
    except Exception:
        db.rollback(); raise
    finally:
        db.close()
