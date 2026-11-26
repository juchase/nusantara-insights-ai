
from collections.abc import Callable

import numpy as np
import pandas as pd

from app.services.backtesting.evaluation.metrics import (
    evaluate_forecast,
)


ForecastFunction = Callable[[np.ndarray, int], np.ndarray]


def run_rolling_origin_backtest(
    df: pd.DataFrame,
    models: dict[str, ForecastFunction],
    horizon: int,
    min_train_size: int,
    step_size: int | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Expanding-window rolling-origin backtest untuk satu produk.

    Input:
        df: DataFrame dengan kolom ds dan y.
        models: mapping nama model ke fungsi forecast.
        horizon: jumlah periode yang diprediksi per fold.
        min_train_size: jumlah observasi minimum untuk training.
        step_size: jarak antar-origin. Default = horizon.

    Output:
        predictions: hasil prediksi setiap periode dan fold.
        metrics: metrik evaluasi per model dan fold.
    """

    if not isinstance(horizon, int) or isinstance(horizon, bool) or horizon < 1:
        raise ValueError("horizon harus integer >= 1.")

    if (
        not isinstance(min_train_size, int)
        or isinstance(min_train_size, bool)
        or min_train_size < 1
    ):
        raise ValueError("min_train_size harus integer >= 1.")

    if step_size is None:
        step_size = horizon

    if not isinstance(step_size, int) or isinstance(step_size, bool) or step_size < 1:
        raise ValueError("step_size harus integer >= 1.")

    if not models:
        raise ValueError("Minimal satu model harus diberikan.")

    required_columns = {"ds", "y"}
    if not required_columns.issubset(df.columns):
        raise ValueError("DataFrame harus memiliki kolom ds dan y.")

    data = df[["ds", "y"]].copy()
    data["ds"] = pd.to_datetime(data["ds"], errors="coerce")
    data["y"] = pd.to_numeric(data["y"], errors="coerce")

    if data[["ds", "y"]].isna().any().any():
        raise ValueError("Data mengandung tanggal atau demand kosong.")

    data = data.sort_values("ds").reset_index(drop=True)

    if data["ds"].duplicated().any():
        raise ValueError("Tanggal duplikat ditemukan.")

    if (data["y"] < 0).any():
        raise ValueError("Demand tidak boleh negatif.")

    if not np.isfinite(data["y"].to_numpy(dtype=float)).all():
        raise ValueError("Demand mengandung infinity.")

    if len(data) < min_train_size + horizon:
        raise ValueError(
            "Data tidak cukup untuk training dan satu fold pengujian."
        )

    if any(not callable(model) for model in models.values()):
        raise ValueError("Setiap model harus berupa fungsi yang callable.")

    y = data["y"].to_numpy(dtype=float)
    dates = data["ds"].to_numpy()

    prediction_rows = []
    metric_rows = []

    fold = 0
    train_end = min_train_size

    while train_end + horizon <= len(data):
        fold += 1

        train = y[:train_end]
        actual = y[train_end:train_end + horizon]
        test_dates = dates[train_end:train_end + horizon]

        
        for model_name, forecast_function in models.items():
            try:
                predicted = np.asarray(
                    forecast_function(train.copy(), horizon),
                    dtype=float,
                )

                if predicted.ndim != 1 or len(predicted) != horizon:
                    raise ValueError(
                        "Panjang prediksi tidak sesuai horizon."
                    )

                if not np.isfinite(predicted).all():
                    raise ValueError(
                        "Prediksi mengandung NaN atau infinity."
                    )

                if (predicted < 0).any():
                    raise ValueError(
                        "Prediksi mengandung demand negatif."
                    )

                fold_metrics = evaluate_forecast(actual, predicted)

                metric_rows.append({
                    "fold": fold,
                    "train_size": train_end,
                    "train_end": dates[train_end - 1],
                    "test_start": test_dates[0],
                    "test_end": test_dates[-1],
                    "model": model_name,
                    "status": "success",
                    "error": None,
                    **fold_metrics,
                })

                for i in range(horizon):
                    prediction_rows.append({
                        "fold": fold,
                        "model": model_name,
                        "ds": test_dates[i],
                        "y_true": float(actual[i]),
                        "y_pred": float(predicted[i]),
                    })

            except Exception as exc:
                metric_rows.append({
                    "fold": fold,
                    "train_size": train_end,
                    "train_end": dates[train_end - 1],
                    "test_start": test_dates[0],
                    "test_end": test_dates[-1],
                    "model": model_name,
                    "status": "failed",
                    "error": str(exc)[:500],
                    "mae": np.nan,
                    "rmse": np.nan,
                    "wape": np.nan,
                })
                continue

            for i in range(horizon):
                prediction_rows.append({
                    "fold": fold,
                    "model": model_name,
                    "ds": test_dates[i],
                    "y_true": float(actual[i]),
                    "y_pred": float(predicted[i]),
                })

        train_end += step_size

    return (
        pd.DataFrame(prediction_rows),
        pd.DataFrame(metric_rows),
    )
