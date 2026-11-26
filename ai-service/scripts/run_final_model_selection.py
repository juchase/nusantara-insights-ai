
from pathlib import Path

import pandas as pd

from app.services.backtesting.final_model_selection import (
    build_final_selection,
    save_final_selection_reports,
)


BASE_DIR = Path("backtesting_results")

SELECTION_DIR = BASE_DIR / "model_selection"
ROBUSTNESS_DIR = BASE_DIR / "robustness"
OUTPUT_DIR = BASE_DIR / "final_selection"


def load_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            f"File hasil eksperimen tidak ditemukan: {path}"
        )

    return pd.read_csv(path)


def main():
    print("=== PHASE 3.5: FINAL MODEL SELECTION ===")

    selection_report = load_csv(
        SELECTION_DIR / "model_selection_report.csv"
    )

    pattern_summary = load_csv(
        SELECTION_DIR / "pattern_model_summary.csv"
    )

    robustness_report = load_csv(
        ROBUSTNESS_DIR / "robustness_report.csv"
    )

    stability = load_csv(
        ROBUSTNESS_DIR / "selection_stability.csv"
    )

    print("\n=== INPUT SUMMARY ===")
    print(
        "Selection records:",
        len(selection_report),
    )
    print(
        "Robustness records:",
        len(robustness_report),
    )
    print(
        "Stability records:",
        len(stability),
    )
    print(
        "Pattern records:",
        len(pattern_summary),
    )

    reports = build_final_selection(
        selection_report=selection_report,
        robustness_report=robustness_report,
        stability=stability,
        pattern_summary=pattern_summary,
    )

    save_final_selection_reports(
        reports=reports,
        output_dir=OUTPUT_DIR,
    )

    print("\n=== FINAL MODEL PER FREQUENCY ===")

    frequency_report = reports[
        "frequency_model_recommendation"
    ]

    for frequency, data in frequency_report.groupby("frequency"):
        print(f"\n[{frequency.upper()}]")

        columns = [
            "model",
            "products",
            "average_rank",
            "aggregate_rank",
            "mean_mae",
            "mean_rmse",
            "mean_wape",
        ]

        available = [
            column for column in columns
            if column in data.columns
        ]

        print(
            data[available]
            .head(5)
            .round(3)
            .to_string(index=False)
        )

    print("\n=== NAIVE BASELINE COMPARISON ===")

    naive_comparison = reports["naive_comparison"]

    if not naive_comparison.empty:
        summary = (
            naive_comparison.groupby("frequency")
            .agg(
                products=("product_id", "nunique"),
                beats_naive_mae=("beats_naive_mae", "sum"),
                beats_naive_rmse=("beats_naive_rmse", "sum"),
                beats_naive_wape=("beats_naive_wape", "sum"),
                beats_naive_all=("beats_naive_all_metrics", "sum"),
            )
            .reset_index()
        )

        print(summary.to_string(index=False))

    print("\n=== PATTERN RECOMMENDATION ===")

    pattern_report = reports[
        "pattern_model_recommendation"
    ]

    if not pattern_report.empty:
        recommended = pattern_report[
            pattern_report["recommended"]
        ]

        print(
            recommended[
                [
                    "frequency",
                    "demand_pattern",
                    "model",
                    "products",
                    "average_rank",
                    "pattern_rank",
                ]
            ]
            .round(3)
            .to_string(index=False)
        )

    print(
        f"\nReports saved to: {OUTPUT_DIR.resolve()}"
    )


if __name__ == "__main__":
    main()
