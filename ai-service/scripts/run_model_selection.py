
from pathlib import Path

import pandas as pd

from app.services.backtesting.model_selection import (
    clean_fold_metrics,
    clean_predictions,
    calculate_product_model_metrics,
    rank_models,
    save_selection_reports,
    build_pattern_summary,
)


INPUT_DIR = Path("backtesting_results/intermittent")
OUTPUT_DIR = Path("backtesting_results/model_selection")


def main():
    print("=== MODEL SELECTION PHASE 3 ===")

    daily_predictions = pd.read_csv(
        INPUT_DIR / "daily_predictions.csv"
    )

    weekly_predictions = pd.read_csv(
        INPUT_DIR / "weekly_predictions.csv"
    )

    daily_folds = pd.read_csv(
        INPUT_DIR / "daily_fold_metrics.csv"
    )

    weekly_folds = pd.read_csv(
        INPUT_DIR / "weekly_fold_metrics.csv"
    )

    daily_diagnostics = pd.read_csv(
        INPUT_DIR / "daily_diagnostics.csv"
    )

    weekly_diagnostics = pd.read_csv(
        INPUT_DIR / "weekly_diagnostics.csv"
    )

    predictions = pd.concat(
        [daily_predictions, weekly_predictions],
        ignore_index=True,
    )

    fold_metrics = pd.concat(
        [daily_folds, weekly_folds],
        ignore_index=True,
    )

    diagnostics = pd.concat(
        [daily_diagnostics, weekly_diagnostics],
        ignore_index=True,
    )

    predictions = clean_predictions(predictions)
    fold_metrics = clean_fold_metrics(fold_metrics)

    execution_summary = (
        fold_metrics.groupby(["frequency", "model", "status"])
        .size()
        .unstack(fill_value=0)
        .reset_index()
    )   

    execution_summary.to_csv(
        OUTPUT_DIR / "model_execution_summary.csv",
        index=False,
    )

    expected_models = {
        frequency: sorted(
            fold_metrics.loc[
                fold_metrics["frequency"] == frequency,
                "model",
            ].dropna().unique().tolist()
        )
        for frequency in ["daily", "weekly"]
    }

    print("\n=== EXPECTED MODELS ===")
    for frequency, models in expected_models.items():
        print(f"{frequency}: {len(models)} models")

    product_metrics = calculate_product_model_metrics(
        predictions=predictions,
        diagnostics=diagnostics,
        expected_models=expected_models,
    )

    if product_metrics.empty:
        print("Tidak ada produk dengan common folds.")
        return

    ranked = rank_models(product_metrics)

    save_selection_reports(
        ranked=ranked,
        output_dir=OUTPUT_DIR,
    )

    pattern_summary = build_pattern_summary(ranked)

    print("\n=== TOP MODELS PER FREQUENCY ===")

    for frequency in ["daily", "weekly"]:
        subset = ranked[
            ranked["frequency"] == frequency
        ]

        summary = (
            subset.groupby("model")["average_rank"]
            .mean()
            .sort_values()
        )

        print(f"\n{frequency.upper()}")
        print(summary.round(3).to_string())

    print("\n=== PATTERN SUMMARY ===")
    if not pattern_summary.empty:
        print(
            pattern_summary[
                pattern_summary["pattern_rank"] == 1
            ].to_string(index=False)
        )

    print(f"\nReports saved to: {OUTPUT_DIR.resolve()}")


if __name__ == "__main__":
    main()
