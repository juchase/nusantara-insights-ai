
from pathlib import Path

import pandas as pd

from app.services.backtesting.model_selection import (
    clean_fold_metrics,
    clean_predictions,
)
from app.services.backtesting.robustness import (
    calculate_fold_metrics,
    calculate_fold_wins,
    calculate_metric_consistency,
    calculate_selection_stability,
    build_robustness_report,
    save_robustness_reports,
)


INPUT_DIR = Path("backtesting_results/intermittent")
OUTPUT_DIR = Path("backtesting_results/robustness")


def main():
    print("=== PHASE 3.4: ROBUSTNESS VALIDATION ===")

    predictions = pd.concat(
        [
            pd.read_csv(INPUT_DIR / "daily_predictions.csv"),
            pd.read_csv(INPUT_DIR / "weekly_predictions.csv"),
        ],
        ignore_index=True,
    )

    raw_fold_metrics = pd.concat(
        [
            pd.read_csv(INPUT_DIR / "daily_fold_metrics.csv"),
            pd.read_csv(INPUT_DIR / "weekly_fold_metrics.csv"),
        ],
        ignore_index=True,
    )

    predictions = clean_predictions(predictions)
    fold_records = clean_fold_metrics(raw_fold_metrics)

    # Ambil model dari seluruh catatan fold, termasuk yang gagal.
    expected_models = {
        frequency: sorted(
            fold_records.loc[
                fold_records["frequency"] == frequency,
                "model",
            ].dropna().unique().tolist()
        )
        for frequency in ["daily", "weekly"]
    }

    print("\n=== EXPECTED MODELS ===")
    for frequency, models in expected_models.items():
        print(f"{frequency}: {len(models)} models")

    # Prediksi hanya berisi fold yang berhasil.
    fold_metrics = calculate_fold_metrics(
        predictions=predictions,
        expected_models=expected_models,
    )

    if fold_metrics.empty:
        print("Tidak ada common fold untuk dievaluasi.")
        return

    ranked_folds, win_summary = calculate_fold_wins(
        fold_metrics
    )

    metric_consistency = calculate_metric_consistency(
        ranked_folds
    )

    stability = calculate_selection_stability(
        ranked_folds
    )

    robustness_report = build_robustness_report(
        fold_metrics=ranked_folds,
        fold_win_summary=win_summary,
        stability=stability,
    )

    save_robustness_reports(
        fold_metrics=ranked_folds,
        fold_win_summary=win_summary,
        metric_consistency=metric_consistency,
        stability=stability,
        robustness_report=robustness_report,
        output_dir=OUTPUT_DIR,
    )

    print("\n=== METRIC WIN SUMMARY ===")
    print(
        win_summary.sort_values(
            ["frequency", "mae_win_rate"],
            ascending=[True, False],
        ).round(3).to_string(index=False)
    )

    print("\n=== SELECTION STABILITY ===")
    if not stability.empty:
        stability_summary = (
            stability.groupby(
                ["frequency", "period", "model"]
            )
            .agg(
                selected_products=("selected", "sum"),
                average_rank=("average_rank", "mean"),
            )
            .reset_index()
        )

        print(
            stability_summary.sort_values(
                ["frequency", "period", "average_rank"]
            ).round(3).to_string(index=False)
        )

    print(f"\nReports saved to: {OUTPUT_DIR.resolve()}")


if __name__ == "__main__":
    main()
