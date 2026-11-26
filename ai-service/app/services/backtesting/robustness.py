
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from app.services.backtesting.evaluation.metrics import evaluate_forecast
from app.services.backtesting.model_selection import (
    clean_predictions,
    clean_fold_metrics,
    get_common_folds,
    validate_common_fold_predictions,
)


GROUP_KEYS = ["product_id", "frequency", "fold"]
PRODUCT_KEYS = ["product_id", "frequency"]


def calculate_fold_metrics(
    predictions: pd.DataFrame,
    expected_models: dict[str, list[str]],
) -> pd.DataFrame:
    """
    Calculate MAE, RMSE, and WAPE per model per common fold.
    Only folds shared by all expected models are evaluated.
    """
    cleaned = clean_predictions(predictions)
    results = []

    for (product_id, frequency), product_data in cleaned.groupby(
        PRODUCT_KEYS
    ):
        models = expected_models.get(frequency, [])

        common_folds = get_common_folds(
            cleaned,
            product_id,
            frequency,
            models,
        )

        for fold in sorted(common_folds):
            fold_data = product_data[
                product_data["fold"] == fold
            ].copy()

            validate_common_fold_predictions(fold_data)

            for model in models:
                model_data = fold_data[
                    fold_data["model"] == model
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
                    "fold": fold,
                    "model": model,
                    "test_observations": len(model_data),
                    "mae": metrics["mae"],
                    "rmse": metrics["rmse"],
                    "wape": metrics["wape"],
                })

    return pd.DataFrame(results)


def calculate_fold_wins(
    fold_metrics: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Calculate per-fold ranks and wins for each metric.
    Lower MAE, RMSE, and WAPE are better.
    """
    if fold_metrics.empty:
        return pd.DataFrame(), pd.DataFrame()

    result = fold_metrics.copy()

    metric_columns = ["mae", "rmse", "wape"]
    group_columns = GROUP_KEYS

    for metric in metric_columns:
        result[f"{metric}_rank"] = result.groupby(
            group_columns
        )[metric].rank(
            method="min",
            ascending=True,
            na_option="bottom",
        )

        best_rank = result.groupby(
            group_columns
        )[f"{metric}_rank"].transform("min")

        result[f"{metric}_win"] = (
            result[f"{metric}_rank"] == best_rank
        ) & result[metric].notna()

    summary_rows = []

    for (frequency, model), model_data in result.groupby(
        ["frequency", "model"]
    ):
        row = {
            "frequency": frequency,
            "model": model,
            "evaluated_folds": int(
                model_data[["product_id", "fold"]]
                .drop_duplicates()
                .shape[0]
            ),
        }

        for metric in metric_columns:
            row[f"{metric}_wins"] = int(
                model_data[f"{metric}_win"].sum()
            )

            valid = model_data[metric].notna()

            row[f"{metric}_win_rate"] = (
                model_data.loc[valid, f"{metric}_win"].mean() * 100
                if valid.any()
                else np.nan
            )

            row[f"mean_{metric}_rank"] = (
                model_data.loc[valid, f"{metric}_rank"].mean()
                if valid.any()
                else np.nan
            )

        summary_rows.append(row)

    summary = pd.DataFrame(summary_rows)

    return result, summary


def calculate_metric_consistency(
    fold_metrics: pd.DataFrame,
) -> pd.DataFrame:
    """
    Compare model performance across metrics at product level.
    Reports how often a model wins each metric.
    """
    if fold_metrics.empty:
        return pd.DataFrame()

    metric_columns = ["mae", "rmse", "wape"]
    rows = []

    for (product_id, frequency, model), data in fold_metrics.groupby(
        ["product_id", "frequency", "model"]
    ):
        row = {
            "product_id": product_id,
            "frequency": frequency,
            "model": model,
        }

        for metric in metric_columns:
            ranks = data[f"{metric}_rank"] if f"{metric}_rank" in data else None

            if ranks is None:
                row[f"{metric}_wins"] = 0
                row[f"{metric}_evaluated_folds"] = 0
                continue

            row[f"{metric}_wins"] = int(
                (ranks == 1).sum()
            )
            row[f"{metric}_evaluated_folds"] = int(
                ranks.notna().sum()
            )

        rows.append(row)

    return pd.DataFrame(rows)


def calculate_selection_stability(
    fold_metrics: pd.DataFrame,
) -> pd.DataFrame:
    """
    Split each product's common folds into chronological thirds.
    Compare average model rank in early, middle, and late periods.
    """
    if fold_metrics.empty:
        return pd.DataFrame()

    rows = []

    for (product_id, frequency), product_data in fold_metrics.groupby(
        PRODUCT_KEYS
    ):
        folds = sorted(product_data["fold"].unique())

        if len(folds) < 3:
            continue

        chunks = np.array_split(np.asarray(folds), 3)

        for period_name, period_folds in zip(
            ["early", "middle", "late"],
            chunks,
        ):
            period_data = product_data[
                product_data["fold"].isin(period_folds)
            ]

            for model, model_data in period_data.groupby("model"):
                metric_ranks = []

                for metric in ["mae", "rmse", "wape"]:
                    rank_column = f"{metric}_rank"

                    if rank_column not in model_data:
                        continue

                    values = model_data[rank_column].dropna()

                    if not values.empty:
                        metric_ranks.append(values.mean())

                rows.append({
                    "product_id": product_id,
                    "frequency": frequency,
                    "period": period_name,
                    "model": model,
                    "folds": len(period_folds),
                    "average_rank": (
                        float(np.mean(metric_ranks))
                        if metric_ranks
                        else np.nan
                    ),
                })

    result = pd.DataFrame(rows)

    if result.empty:
        return result

    result["period_rank"] = result.groupby(
        ["product_id", "frequency", "period"]
    )["average_rank"].rank(
        method="min",
        ascending=True,
    )

    result["selected"] = result["period_rank"] == 1

    return result



def build_robustness_report(
    fold_metrics: pd.DataFrame,
    fold_win_summary: pd.DataFrame,
    stability: pd.DataFrame,
) -> pd.DataFrame:
    """Combine fold performance and stability into one report."""
    if fold_metrics.empty:
        return pd.DataFrame()

    # 1. Aggregate overall fold performance.
    overall = (
        fold_metrics.groupby(["frequency", "model"])
        .apply(
            lambda group: pd.Series({
                "products": group["product_id"].nunique(),
                "evaluated_product_folds": (
                    group[["product_id", "fold"]]
                    .drop_duplicates()
                    .shape[0]
                ),
                "mean_mae": group["mae"].mean(),
                "mean_rmse": group["rmse"].mean(),
                "mean_wape": group["wape"].mean(),
            }),
            include_groups=False,
        )
        .reset_index()
    )

    # 2. Merge fold win summary.
    if not fold_win_summary.empty:
        overall = overall.merge(
            fold_win_summary,
            on=["frequency", "model"],
            how="left",
            suffixes=("", "_wins"),
        )

    # 3. Aggregate selection stability by period.
    period_columns = [
        "early_selections",
        "middle_selections",
        "late_selections",
    ]

    if not stability.empty:
        required_columns = {
            "frequency",
            "model",
            "period",
            "selected",
        }

        missing = required_columns - set(stability.columns)

        if missing:
            raise ValueError(
                f"Kolom stability tidak lengkap: {sorted(missing)}"
            )

        stability_data = stability.copy()

        # Pastikan nilai selected berupa boolean.
        if not pd.api.types.is_bool_dtype(
            stability_data["selected"]
        ):
            stability_data["selected"] = (
                stability_data["selected"]
                .astype("string")
                .str.lower()
                .map({"true": True, "false": False})
                .fillna(False)
            )

        # Hitung jumlah produk terpilih untuk setiap periode.
        stable = (
            stability_data.pivot_table(
                index=["frequency", "model"],
                columns="period",
                values="selected",
                aggfunc="sum",
                fill_value=0,
            )
            .reindex(
                columns=["early", "middle", "late"],
                fill_value=0,
            )
            .rename(columns={
                "early": "early_selections",
                "middle": "middle_selections",
                "late": "late_selections",
            })
            .reset_index()
        )

        stable["selected_product_periods"] = (
            stable[period_columns].sum(axis=1)
        )

        stable[period_columns + ["selected_product_periods"]] = (
            stable[
                period_columns + ["selected_product_periods"]
            ].astype(int)
        )

        overall = overall.merge(
            stable,
            on=["frequency", "model"],
            how="left",
        )

    else:
        # Tetap sediakan kolom agar struktur output konsisten.
        overall["selected_product_periods"] = 0

        for column in period_columns:
            overall[column] = 0

    return overall



def save_robustness_reports(
    fold_metrics: pd.DataFrame,
    fold_win_summary: pd.DataFrame,
    metric_consistency: pd.DataFrame,
    stability: pd.DataFrame,
    robustness_report: pd.DataFrame,
    output_dir: Path,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    fold_metrics.to_csv(
        output_dir / "fold_win_summary.csv",
        index=False,
    )

    fold_win_summary.to_csv(
        output_dir / "metric_win_summary.csv",
        index=False,
    )

    metric_consistency.to_csv(
        output_dir / "product_metric_consistency.csv",
        index=False,
    )

    stability.to_csv(
        output_dir / "selection_stability.csv",
        index=False,
    )

    robustness_report.to_csv(
        output_dir / "robustness_report.csv",
        index=False,
    )
