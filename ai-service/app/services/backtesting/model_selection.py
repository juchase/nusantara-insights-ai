
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from app.services.backtesting.evaluation.metrics import evaluate_forecast


PREDICTION_KEYS = [
    "product_id",
    "frequency",
    "fold",
    "model",
    "ds",
]

FOLD_KEYS = [
    "product_id",
    "frequency",
    "fold",
    "model",
]

REQUIRED_PREDICTION_COLUMNS = {
    *PREDICTION_KEYS,
    "y_true",
    "y_pred",
}


def clean_predictions(predictions: pd.DataFrame) -> pd.DataFrame:
    """Remove exact duplicates and validate prediction records."""
    missing = REQUIRED_PREDICTION_COLUMNS - set(predictions.columns)

    if missing:
        raise ValueError(
            f"Kolom predictions tidak lengkap: {sorted(missing)}"
        )

    result = predictions.copy()

    result["ds"] = pd.to_datetime(result["ds"])
    result["y_true"] = pd.to_numeric(result["y_true"], errors="coerce")
    result["y_pred"] = pd.to_numeric(result["y_pred"], errors="coerce")

    result = result.dropna(
        subset=PREDICTION_KEYS + ["y_true", "y_pred"]
    )

    # Hanya menghapus duplikasi yang benar-benar identik.
    result = result.drop_duplicates(
        subset=PREDICTION_KEYS + ["y_true", "y_pred"]
    )

    # Satu model tidak boleh memiliki dua prediksi berbeda
    # untuk produk, fold, dan tanggal pengujian yang sama.
    conflict_keys = PREDICTION_KEYS

    conflicts = result.duplicated(
        subset=conflict_keys,
        keep=False,
    )

    if conflicts.any():
        raise ValueError(
            "Ditemukan prediksi berbeda untuk kombinasi "
            "produk, fold, model, dan tanggal yang sama."
        )

    return result.reset_index(drop=True)


def clean_fold_metrics(fold_metrics: pd.DataFrame) -> pd.DataFrame:
    """Resolve duplicated fold records deterministically."""
    required = set(FOLD_KEYS + ["status"])

    missing = required - set(fold_metrics.columns)

    if missing:
        raise ValueError(
            f"Kolom fold_metrics tidak lengkap: {sorted(missing)}"
        )

    result = fold_metrics.copy()

    result["status"] = (
        result["status"]
        .astype("string")
        .str.strip()
        .str.lower()
    )

    def resolve_status(values):
        statuses = set(values.dropna())

        if "success" in statuses:
            return "success"

        if "failed" in statuses:
            return "failed"

        return "unknown"

    aggregations = {}

    for column in result.columns:
        if column in FOLD_KEYS:
            continue

        if column == "status":
            aggregations[column] = resolve_status
        else:
            aggregations[column] = "first"

    result = (
        result.groupby(FOLD_KEYS, as_index=False, dropna=False)
        .agg(aggregations)
    )

    return result



def get_common_folds(
    predictions: pd.DataFrame,
    product_id: str,
    frequency: str,
    expected_models: list[str],
) -> set:
    """Return folds shared by every expected model."""
    product_data = predictions[
        (predictions["product_id"] == product_id)
        & (predictions["frequency"] == frequency)
    ]

    if product_data.empty or not expected_models:
        return set()

    fold_sets = []

    for model in expected_models:
        model_data = product_data[
            product_data["model"] == model
        ]

        model_folds = set(model_data["fold"].unique())

        if not model_folds:
            return set()

        fold_sets.append(model_folds)

    return set.intersection(*fold_sets)


def validate_common_fold_predictions(
    predictions: pd.DataFrame,
) -> None:
    """Ensure models use identical test dates and actual values."""
    reference = None

    for (product_id, frequency, fold), fold_data in predictions.groupby(
        ["product_id", "frequency", "fold"]
    ):
        model_frames = []

        for model, model_data in fold_data.groupby("model"):
            current = (
                model_data[["ds", "y_true"]]
                .sort_values("ds")
                .reset_index(drop=True)
            )
            current = current.rename(
                columns={"y_true": f"y_true_{model}"}
            )
            model_frames.append(current)

        if not model_frames:
            continue

        base = model_frames[0]

        for other in model_frames[1:]:
            if not base["ds"].equals(other["ds"]):
                raise ValueError(
                    f"Tanggal pengujian tidak sama: "
                    f"{product_id}, {frequency}, fold {fold}"
                )

            if not np.allclose(
                base.iloc[:, 1].to_numpy(dtype=float),
                other.iloc[:, 1].to_numpy(dtype=float),
                equal_nan=True,
            ):
                raise ValueError(
                    f"Nilai aktual tidak sama: "
                    f"{product_id}, {frequency}, fold {fold}"
                )



def calculate_product_model_metrics(
    predictions: pd.DataFrame,
    diagnostics: pd.DataFrame,
    expected_models: dict[str, list[str]],
) -> pd.DataFrame:
    """Calculate metrics using common folds across all expected models."""
    cleaned = clean_predictions(predictions)

    diagnostic_columns = [
        "product_id",
        "frequency",
        "adi",
        "cv2",
        "demand_pattern",
    ]

    diagnostics = diagnostics[diagnostic_columns].drop_duplicates(
        subset=["product_id", "frequency"]
    )

    results = []

    for (product_id, frequency), product_data in cleaned.groupby(
        ["product_id", "frequency"]
    ):
        models = expected_models.get(frequency, [])

        common_folds = get_common_folds(
            cleaned,
            product_id,
            frequency,
            models,
        )

        if not common_folds:
            continue

        common_data = product_data[
            product_data["fold"].isin(common_folds)
        ].copy()

        # Pastikan semua model memiliki tanggal dan aktual yang sama.
        validate_common_fold_predictions(common_data)

        for model in models:
            model_data = common_data[
                common_data["model"] == model
            ]

            if model_data.empty:
                continue

            metrics = evaluate_forecast(
                model_data["y_true"].to_numpy(dtype=float),
                model_data["y_pred"].to_numpy(dtype=float),
            )

            results.append({
                "product_id": product_id,
                "frequency": frequency,
                "model": model,
                "common_folds": len(common_folds),
                "test_observations": len(model_data),
                "mae": metrics["mae"],
                "rmse": metrics["rmse"],
                "wape": metrics["wape"],
            })

    result_df = pd.DataFrame(results)

    if result_df.empty:
        return result_df

    return result_df.merge(
        diagnostics,
        on=["product_id", "frequency"],
        how="left",
        validate="many_to_one",
    )

def rank_models(
    metrics: pd.DataFrame,
) -> pd.DataFrame:
    """Rank models per product using MAE, RMSE, and WAPE."""
    if metrics.empty:
        return metrics.copy()

    result = metrics.copy()

    group_columns = ["product_id", "frequency"]

    result["mae_rank"] = result.groupby(
        group_columns
    )["mae"].rank(method="average", ascending=True)

    result["rmse_rank"] = result.groupby(
        group_columns
    )["rmse"].rank(method="average", ascending=True)

    result["wape_rank"] = result.groupby(
        group_columns
    )["wape"].rank(method="average", ascending=True)

    rank_columns = ["mae_rank", "rmse_rank", "wape_rank"]

    result["average_rank"] = result[rank_columns].mean(
        axis=1,
        skipna=True,
    )

    result["selection_rank"] = result.groupby(
        group_columns
    )["average_rank"].rank(
        method="min",
        ascending=True,
    )

    result = result.sort_values(
        group_columns + ["average_rank", "wape", "mae"]
    )

    result["selected"] = result["selection_rank"] == 1

    return result.reset_index(drop=True)


def build_pattern_summary(
    ranked: pd.DataFrame,
) -> pd.DataFrame:
    """Summarize average model ranking by demand pattern."""
    if ranked.empty:
        return pd.DataFrame()

    summary = (
        ranked.groupby(
            ["frequency", "demand_pattern", "model"],
            dropna=False,
        )
        .agg(
            products=("product_id", "nunique"),
            average_rank=("average_rank", "mean"),
            mean_mae=("mae", "mean"),
            mean_rmse=("rmse", "mean"),
            mean_wape=("wape", "mean"),
        )
        .reset_index()
    )

    summary["pattern_rank"] = summary.groupby(
        ["frequency", "demand_pattern"]
    )["average_rank"].rank(
        method="min",
        ascending=True,
    )

    return summary.sort_values(
        ["frequency", "demand_pattern", "pattern_rank"]
    )


def save_selection_reports(
    ranked: pd.DataFrame,
    output_dir: Path,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    ranked.to_csv(
        output_dir / "model_selection_report.csv",
        index=False,
    )

    winners = ranked[ranked["selected"]].copy()

    winners.to_csv(
        output_dir / "selected_models_per_product.csv",
        index=False,
    )

    pattern_summary = build_pattern_summary(ranked)

    pattern_summary.to_csv(
        output_dir / "pattern_model_summary.csv",
        index=False,
    )
