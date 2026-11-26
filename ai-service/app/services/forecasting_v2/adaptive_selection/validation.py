from __future__ import annotations

from dataclasses import dataclass
import math

import numpy as np

from app.services.forecasting_v2.forecast_engine import HORIZONS
from app.services.forecasting_v2.model_runner import run_forecast_model


MIN_TRAIN_POINTS = {"D": 21, "W": 8}
MIN_VALIDATION_FOLDS = 2


@dataclass(frozen=True)
class ModelEvaluation:
    model_name: str
    mae: float
    rmse: float
    wape: float | None
    n_predictions: int
    folds: int


def calculate_metrics(actual, predicted) -> tuple[float, float, float | None]:
    y_true = np.asarray(actual, dtype=float)
    y_pred = np.asarray(predicted, dtype=float)
    if y_true.ndim != 1 or y_pred.ndim != 1 or len(y_true) != len(y_pred) or not len(y_true):
        raise ValueError("Actual dan predicted harus array 1D dengan panjang sama dan tidak kosong.")
    if not np.isfinite(y_true).all() or not np.isfinite(y_pred).all():
        raise ValueError("Data evaluasi mengandung NaN atau infinity.")
    errors = y_true - y_pred
    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(np.square(errors))))
    denominator = float(np.sum(np.abs(y_true)))
    wape = float(np.sum(np.abs(errors)) / denominator * 100.0) if denominator > 0 else None
    return mae, rmse, wape


def get_candidate_models(frequency: str, n_points: int) -> list[str]:
    if frequency not in HORIZONS:
        raise ValueError("Frequency harus D atau W.")
    candidates = ["naive", "sma", "wma", "ses", "holt", "croston", "sba", "tsb"]
    if frequency == "D" and n_points >= 35:
        candidates.extend(["holt_winters_7", "sarima_7"])
    if n_points >= 50:
        candidates.append("arima")
    return candidates


def evaluate_model(
    model_name: str,
    values: np.ndarray,
    frequency: str,
    folds: int = MIN_VALIDATION_FOLDS,
) -> ModelEvaluation:
    horizon = HORIZONS[frequency]
    min_train = MIN_TRAIN_POINTS[frequency]
    first_validation_start = len(values) - folds * horizon
    if first_validation_start < min_train:
        raise ValueError("Data belum mencukupi untuk walk-forward validation.")

    actual_all: list[float] = []
    predicted_all: list[float] = []
    successful_folds = 0

    for fold_index in range(folds):
        train_end = first_validation_start + fold_index * horizon
        test_end = train_end + horizon
        train = values[:train_end]
        actual = values[train_end:test_end]
        if len(actual) != horizon:
            continue
        predicted = run_forecast_model(
            model_name=model_name,
            y_train=train,
            horizon=horizon,
            frequency=frequency,
        )
        actual_all.extend(float(value) for value in actual)
        predicted_all.extend(float(value) for value in predicted)
        successful_folds += 1

    if successful_folds != folds:
        raise RuntimeError("Tidak semua fold validasi berhasil.")

    mae, rmse, wape = calculate_metrics(actual_all, predicted_all)
    return ModelEvaluation(
        model_name=model_name,
        mae=mae,
        rmse=rmse,
        wape=wape,
        n_predictions=len(actual_all),
        folds=successful_folds,
    )


def evaluate_candidates(history, frequency: str) -> tuple[ModelEvaluation | None, list[ModelEvaluation], str]:
    values = np.asarray(history, dtype=float)
    if values.ndim != 1 or not np.isfinite(values).all() or (values < 0).any():
        raise ValueError("Histori harus berupa array 1D dengan demand non-negatif dan finite.")
    if frequency not in HORIZONS:
        raise ValueError("Frequency harus D atau W.")

    horizon = HORIZONS[frequency]
    required_points = MIN_TRAIN_POINTS[frequency] + MIN_VALIDATION_FOLDS * horizon
    if len(values) < required_points:
        return None, [], f"insufficient_history:{len(values)}<{required_points}"

    results: list[ModelEvaluation] = []
    errors: dict[str, str] = {}
    for model_name in get_candidate_models(frequency, len(values)):
        try:
            results.append(evaluate_model(model_name, values, frequency))
        except Exception as exc:  # candidate failure must not stop other candidates
            errors[model_name] = str(exc)[:240]

    if not results:
        return None, [], "all_candidate_models_failed"

    # Prefer relative error when defined. If all validation actuals are zero,
    # choose by MAE then RMSE, while keeping WAPE/confidence unavailable.
    if any(item.wape is not None and math.isfinite(item.wape) for item in results):
        results.sort(key=lambda item: (
            item.wape if item.wape is not None else float("inf"),
            item.mae,
            item.rmse,
            item.model_name,
        ))
        reason = "lowest_walk_forward_wape_then_mae_rmse"
    else:
        results.sort(key=lambda item: (item.mae, item.rmse, item.model_name))
        reason = "wape_undefined_selected_by_mae_then_rmse"

    return results[0], results, reason
