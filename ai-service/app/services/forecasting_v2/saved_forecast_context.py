from __future__ import annotations

from sqlalchemy import text

from app.services.forecasting_v2.confidence import calculate_forecast_confidence
from app.services.forecasting_v2.model_registry import get_daily_model, get_weekly_model


def load_saved_forecast_context(db, product_id: str, frequency: str) -> dict:
    """Load an already-persisted Forecasting V2 result without running a model."""
    if frequency not in {"D", "W"}:
        raise ValueError("Frequency harus D atau W.")

    predictions = db.execute(
        text("""
            SELECT "predictionDate", "predictedSales", "modelVersion"
            FROM "Prediction"
            WHERE "productId" = :product_id AND "freq" = :frequency
            ORDER BY "predictionDate" ASC
        """),
        {"product_id": product_id, "frequency": frequency},
    ).mappings().all()

    if not predictions:
        raise LookupError(
            f"Prediksi Forecasting V2 {frequency} belum tersedia untuk produk ini."
        )

    model_version = str(predictions[-1]["modelVersion"] or "")
    prefix = f"forecasting_v2:{frequency}:"
    model_used = model_version[len(prefix):] if model_version.startswith(prefix) else "unavailable"

    static_selection = None
    try:
        static_selection = (
            get_daily_model(product_id) if frequency == "D"
            else get_weekly_model(product_id)
        )
    except (FileNotFoundError, ValueError):
        static_selection = None

    saved_selection = db.execute(
        text("""
            SELECT "selectedModel", "selectionReason", "validationMae",
                   "validationRmse", "validationWape", "nPredictions",
                   "evaluationStatus"
            FROM "ForecastModelSelection"
            WHERE "productId" = :product_id AND frequency = :frequency
            LIMIT 1
        """),
        {"product_id": product_id, "frequency": frequency},
    ).mappings().first()

    if static_selection is not None:
        selected_model = static_selection.model_name
        validation_mae = static_selection.validation_mae
        validation_rmse = static_selection.validation_rmse
        validation_wape = static_selection.validation_wape
        n_predictions = static_selection.n_predictions
        evaluation_status = "success"
    elif saved_selection is not None:
        selected_model = str(saved_selection["selectedModel"])
        validation_mae = saved_selection["validationMae"]
        validation_rmse = saved_selection["validationRmse"]
        validation_wape = saved_selection["validationWape"]
        n_predictions = int(saved_selection["nPredictions"] or 0)
        evaluation_status = str(saved_selection["evaluationStatus"] or "unavailable")
    else:
        selected_model = None
        validation_mae = validation_rmse = validation_wape = None
        n_predictions = 0
        evaluation_status = "unavailable"

    # A selected-model score must never be presented as the runtime fallback score.
    fallback_used = not selected_model or model_used.lower() != str(selected_model).lower()
    confidence = calculate_forecast_confidence(
        validation_wape=validation_wape,
        n_predictions=n_predictions,
        fallback_used=fallback_used,
        evaluation_status=evaluation_status,
    )

    forecast_values = [float(row["predictedSales"]) for row in predictions]
    forecast_average = sum(forecast_values) / len(forecast_values)

    if frequency == "D":
        history_rows = db.execute(
            text("""
                SELECT DATE("date") AS period, SUM(quantity) AS total
                FROM "Sales"
                WHERE "productId" = :product_id
                GROUP BY DATE("date")
                ORDER BY period DESC
                LIMIT 7
            """),
            {"product_id": product_id},
        ).fetchall()
    else:
        history_rows = db.execute(
            text("""
                SELECT DATE_TRUNC('week', "date") AS period, SUM(quantity) AS total
                FROM "Sales"
                WHERE "productId" = :product_id
                GROUP BY DATE_TRUNC('week', "date")
                ORDER BY period DESC
                LIMIT 4
            """),
            {"product_id": product_id},
        ).fetchall()

    history_values = [float(row[1] or 0) for row in history_rows]
    baseline = sum(history_values) / len(history_values) if history_values else 0.0
    if baseline <= 0 and forecast_average <= 0:
        growth = 0.0
    elif baseline <= 0:
        growth = 100.0
    else:
        growth = ((forecast_average - baseline) / baseline) * 100.0
    growth = round(growth, 2)
    growth_display = "meningkat" if growth > 1 else "menurun" if growth < -1 else "stabil"

    return {
        "status": "success",
        "product_id": product_id,
        "freq": frequency,
        "model_selected": selected_model or "unavailable",
        "model_used": model_used,
        "strategy": "static_registry" if static_selection is not None else (
            "adaptive_selection" if saved_selection is not None else "unavailable"
        ),
        "fallback_used": fallback_used,
        "evaluation_status": evaluation_status,
        "validation": {
            "mae": float(validation_mae) if validation_mae is not None else None,
            "rmse": float(validation_rmse) if validation_rmse is not None else None,
            "wape": float(validation_wape) if validation_wape is not None else None,
            "n_predictions": n_predictions,
        },
        "confidence": confidence.to_dict(),
        "growth": growth,
        "growth_display": growth_display,
        "forecast_summary": {
            "avg": round(forecast_average, 2),
            "min": round(min(forecast_values), 2),
            "max": round(max(forecast_values), 2),
        },
        "forecast": [
            {"date": row["predictionDate"].isoformat(), "predicted_sales": float(row["predictedSales"])}
            for row in predictions
        ],
    }
