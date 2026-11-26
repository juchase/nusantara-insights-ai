
from collections.abc import Callable

import numpy as np
import pandas as pd

from app.services.backtesting.evaluation.metrics import (
    evaluate_forecast,
)


ForecastFunction = Callable[[np.ndarray, int], np.ndarray]


def run_holdout_rolling_origin_backtest(
    history_df: pd.DataFrame,
    evaluation_df: pd.DataFrame,
    models: dict[str, ForecastFunction],
    horizon: int,
    min_train_size: int,
    step_size: int | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Rolling-origin evaluation over a held-out period.

    history_df:
        Historical observations available before evaluation starts.

    evaluation_df:
        Observations reserved for validation or final testing.

    Each fold predicts only the next horizon observations.
    After a fold, its actual observations are added to history.
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

    if (
        not isinstance(step_size, int)
        or isinstance(step_size, bool)
        or step_size < 1
    ):
        raise ValueError("step_size harus integer >= 1.")

    if not models:
        raise ValueError("Minimal satu model harus diberikan.")

    if any(not callable(model) for model in models.values()):
        raise ValueError("Setiap model harus berupa fungsi callable.")

    required_columns = {"ds", "y"}

    for name, frame in [
        ("history_df", history_df),
        ("evaluation_df", evaluation_df),
    ]:
        if not isinstance(frame, pd.DataFrame):
            raise TypeError(f"{name} harus berupa DataFrame.")

        if not required_columns.issubset(frame.columns):
            raise ValueError(
                f"{name} harus memiliki kolom ds dan y."
            )

        if frame.empty:
            raise ValueError(f"{name} tidak boleh kosong.")

    def prepare_frame(
        frame: pd.DataFrame,
        name: str,
    ) -> pd.DataFrame:
        data = frame[["ds", "y"]].copy()

        data["ds"] = pd.to_datetime(
            data["ds"],
            errors="coerce",
        )

        data["y"] = pd.to_numeric(
            data["y"],
            errors="coerce",
        )

        if data[["ds", "y"]].isna().any().any():
            raise ValueError(
                f"{name} memiliki tanggal atau demand kosong."
            )

        if not np.isfinite(
            data["y"].to_numpy(dtype=float)
        ).all():
            raise ValueError(
                f"{name} mengandung demand infinity."
            )

        if (data["y"] < 0).any():
            raise ValueError(
                f"{name} mengandung demand negatif."
            )

        data = data.sort_values("ds").reset_index(drop=True)

        if data["ds"].duplicated().any():
            raise ValueError(
                f"{name} memiliki tanggal duplikat."
            )

        return data

    history = prepare_frame(history_df, "history_df")
    evaluation = prepare_frame(
        evaluation_df,
        "evaluation_df",
    )

    if history["ds"].max() >= evaluation["ds"].min():
        raise ValueError(
            "history_df harus berakhir sebelum evaluation_df dimulai."
        )

    if len(history) < min_train_size:
        raise ValueError(
            "History tidak memenuhi min_train_size."
        )

    if len(evaluation) < horizon:
        raise ValueError(
            "Evaluation harus memiliki minimal satu horizon."
        )

    history_values = history["y"].to_numpy(dtype=float)
    history_dates = history["ds"].to_numpy()

    evaluation_values = evaluation["y"].to_numpy(dtype=float)
    evaluation_dates = evaluation["ds"].to_numpy()

    prediction_rows = []
    metric_rows = []

    fold = 0
    evaluation_start = 0

    while evaluation_start + horizon <= len(evaluation):
        fold += 1

        evaluation_end = evaluation_start + horizon

        train = history_values.copy()
        actual = evaluation_values[
            evaluation_start:evaluation_end
        ]

        test_dates = evaluation_dates[
            evaluation_start:evaluation_end
        ]

        train_end_date = history_dates[-1]

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

                fold_metrics = evaluate_forecast(
                    actual,
                    predicted,
                )

                metric_rows.append({
                    "fold": fold,
                    "train_size": len(train),
                    "train_end": train_end_date,
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
                    "train_size": len(train),
                    "train_end": train_end_date,
                    "test_start": test_dates[0],
                    "test_end": test_dates[-1],
                    "model": model_name,
                    "status": "failed",
                    "error": str(exc)[:500],
                    "mae": np.nan,
                    "rmse": np.nan,
                    "wape": np.nan,
                })

        # Actual observations from the completed evaluation fold
        # become available only to the next forecast origin.
        history_values = np.concatenate([
            history_values,
            actual,
        ])

        history_dates = np.concatenate([
            history_dates,
            test_dates,
        ])

        evaluation_start += step_size

    return (
        pd.DataFrame(prediction_rows),
        pd.DataFrame(metric_rows),
    )
