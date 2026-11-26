
import numpy as np
import pandas as pd

from app.services.backtesting.evaluation.metrics import (
    evaluate_forecast,
)


REQUIRED_COLUMNS = {
    "product_id",
    "frequency",
    "model",
    "ds",
    "y_true",
    "y_pred",
}


def _calculate_model_metrics(
    predictions: pd.DataFrame,
) -> pd.DataFrame:
    """
    Calculate pooled validation metrics for each product,
    frequency, and model.
    """

    rows = []

    group_columns = [
        "product_id",
        "frequency",
        "model",
    ]

    for keys, group in predictions.groupby(
        group_columns,
        sort=True,
    ):
        product_id, frequency, model = keys

        group = group.sort_values("ds")

        metrics = evaluate_forecast(
            group["y_true"].to_numpy(dtype=float),
            group["y_pred"].to_numpy(dtype=float),
        )

        rows.append({
            "product_id": product_id,
            "frequency": frequency,
            "model": model,
            "n_predictions": len(group),
            **metrics,
        })

    return pd.DataFrame(rows)


def select_validation_models(
    predictions: pd.DataFrame,
    naive_model: str = "naive",
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Select one operational model per product and frequency
    using validation predictions only.

    Selection metric:
        1. MAE
        2. RMSE
        3. WAPE
        4. Model name

    Fallback:
        If the best non-Naive model does not outperform Naive
        on MAE, select Naive.
    """

    if predictions.empty:
        raise ValueError(
            "Validation predictions tidak boleh kosong."
        )

    missing_columns = REQUIRED_COLUMNS - set(
        predictions.columns
    )

    if missing_columns:
        raise ValueError(
            f"Kolom wajib tidak ditemukan: {sorted(missing_columns)}"
        )

    data = predictions.copy()

    data["ds"] = pd.to_datetime(
        data["ds"],
        errors="coerce",
    )

    if data["ds"].isna().any():
        raise ValueError(
            "Tanggal validation tidak valid."
        )

    for column in ["y_true", "y_pred"]:
        data[column] = pd.to_numeric(
            data[column],
            errors="coerce",
        )

        values = data[column].to_numpy(dtype=float)

        if not np.isfinite(values).all():
            raise ValueError(
                f"{column} mengandung NaN atau infinity."
            )

        if (values < 0).any():
            raise ValueError(
                f"{column} tidak boleh negatif."
            )

    duplicate_keys = [
        "product_id",
        "frequency",
        "model",
        "ds",
    ]

    if data.duplicated(duplicate_keys).any():
        raise ValueError(
            "Prediksi validation memiliki duplikasi "
            "produk, frekuensi, model, dan tanggal."
        )

    # All models must be evaluated on identical actual values
    # for each product, frequency, and validation date.
    actual_counts = (
        data.groupby(
            ["product_id", "frequency", "ds"]
        )["y_true"]
        .nunique()
    )

    if (actual_counts > 1).any():
        raise ValueError(
            "Nilai aktual validation berbeda antar model."
        )

    model_metrics = _calculate_model_metrics(data)

    selections = []

    for (product_id, frequency), group in model_metrics.groupby(
        ["product_id", "frequency"],
        sort=True,
    ):
        ranked = group.sort_values(
            ["mae", "rmse", "wape", "model"],
            na_position="last",
        )

        best = ranked.iloc[0]

        naive_rows = group[
            group["model"] == naive_model
        ]

        if naive_rows.empty:
            selections.append({
                "product_id": product_id,
                "frequency": frequency,
                "selected_model": None,
                "selection_reason": "naive_unavailable",
                "fallback_applied": False,
                "validation_mae": np.nan,
                "validation_rmse": np.nan,
                "validation_wape": np.nan,
                "n_predictions": 0,
            })
            continue

        selected = best
        selection_reason = "best_validation_mae"
        fallback_applied = False

        selections.append({
            "product_id": product_id,
            "frequency": frequency,
            "selected_model": selected["model"],
            "selection_reason": selection_reason,
            "fallback_applied": fallback_applied,
            "validation_mae": selected["mae"],
            "validation_rmse": selected["rmse"],
            "validation_wape": selected["wape"],
            "n_predictions": selected["n_predictions"],
        })


    selection_df = pd.DataFrame(selections)

    return selection_df, model_metrics
