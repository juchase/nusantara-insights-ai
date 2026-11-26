
from pathlib import Path

import pandas as pd

from app.services.backtesting.operational_selection import (
    build_operational_selection,
    save_operational_reports,
)


BASE_DIR = Path("backtesting_results")

SELECTION_DIR = BASE_DIR / "model_selection"
FINAL_DIR = BASE_DIR / "final_selection"
OUTPUT_DIR = BASE_DIR / "operational_selection"


def main():
    print("=== PHASE 3.5.5: OPERATIONAL FALLBACK EVALUATION ===")

    naive_comparison = pd.read_csv(
        FINAL_DIR / "naive_comparison.csv"
    )

    selection_report = pd.read_csv(
        SELECTION_DIR / "model_selection_report.csv"
    )

    operational = build_operational_selection(
        naive_comparison=naive_comparison,
        selection_report=selection_report,
    )

    save_operational_reports(
        operational=operational,
        output_dir=OUTPUT_DIR,
    )

    print("\n=== DECISION SUMMARY ===")

    summary = (
        operational.groupby(
            ["frequency", "decision"],
            dropna=False,
        )
        .size()
        .unstack(fill_value=0)
    )

    print(summary.to_string())

    print("\n=== FALLBACK SUMMARY ===")

    fallback_summary = pd.read_csv(
        OUTPUT_DIR / "fallback_summary.csv"
    )

    print(
        fallback_summary.round(2).to_string(index=False)
    )

    print("\n=== FALLBACK BY DEMAND PATTERN ===")

    pattern_path = OUTPUT_DIR / "fallback_by_pattern.csv"

    if pattern_path.exists():
        pattern_summary = pd.read_csv(pattern_path)

        print(
            pattern_summary.round(2).to_string(index=False)
        )

    print(f"\nReports saved to: {OUTPUT_DIR.resolve()}")


if __name__ == "__main__":
    main()
