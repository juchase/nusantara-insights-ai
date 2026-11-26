# scripts/run_backtesting.py

import json
from pathlib import Path

import pandas as pd

from app.services.backtesting.data_loader import (
    load_all_sales
)

from app.services.backtesting.preprocessing import (
    prepare_daily_data,
    prepare_weekly_data
)


OUTPUT_DIR = Path("backtesting_results")


def run_audit(
    raw_df: pd.DataFrame,
    daily_df: pd.DataFrame,
    weekly_df: pd.DataFrame
):

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    raw_quantity = float(raw_df["y"].sum())
    daily_quantity = float(daily_df["y"].sum())
    weekly_quantity = float(weekly_df["y"].sum())

    product_ids = sorted(
        raw_df["product_id"].unique().tolist()
    )

    audit_rows = []

    for product_id in product_ids:

        raw = raw_df[
            raw_df["product_id"] == product_id
        ]

        daily = daily_df[
            daily_df["product_id"] == product_id
        ]

        weekly = weekly_df[
            weekly_df["product_id"] == product_id
        ]

        audit_rows.append({
            "product_id": product_id,
            "raw_records": len(raw),
            "daily_periods": len(daily),
            "weekly_periods": len(weekly),
            "active_days": int((daily["y"] > 0).sum()),
            "zero_days": int((daily["y"] == 0).sum()),
            "total_quantity_raw": float(raw["y"].sum()),
            "total_quantity_daily": float(daily["y"].sum()),
            "total_quantity_weekly": float(weekly["y"].sum()),
            "start_date": str(daily["ds"].min().date()),
            "end_date": str(daily["ds"].max().date()),
            "daily_duplicates": int(daily["ds"].duplicated().sum()),
            "weekly_duplicates": int(weekly["ds"].duplicated().sum())
        })

    audit_df = pd.DataFrame(audit_rows)

    summary = {
        "total_products": len(product_ids),
        "total_raw_records": len(raw_df),
        "total_daily_records": len(daily_df),
        "total_weekly_records": len(weekly_df),
        "raw_quantity": raw_quantity,
        "daily_quantity": daily_quantity,
        "weekly_quantity": weekly_quantity,
        "quantity_preserved": (
            raw_quantity == daily_quantity
            and raw_quantity == weekly_quantity
        ),
        "daily_duplicates": int(
            daily_df.duplicated(
                ["product_id", "ds"]
            ).sum()
        ),
        "weekly_duplicates": int(
            weekly_df.duplicated(
                ["product_id", "ds"]
            ).sum()
        ),
        "missing_daily_values": int(
            daily_df[["ds", "y"]].isna().sum().sum()
        ),
        "missing_weekly_values": int(
            weekly_df[["ds", "y"]].isna().sum().sum()
        )
    }

    audit_df.to_csv(
        OUTPUT_DIR / "audit_summary.csv",
        index=False
    )

    daily_df.to_csv(
        OUTPUT_DIR / "daily_dataset.csv",
        index=False
    )

    weekly_df.to_csv(
        OUTPUT_DIR / "weekly_dataset.csv",
        index=False
    )

    with open(
        OUTPUT_DIR / "audit_report.json",
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            summary,
            file,
            indent=4
        )

    return summary


def main():

    print("=" * 60)
    print("NUSANTARAINSIGHT AI - BACKTESTING DATA AUDIT")
    print("=" * 60)

    print("\n[1] Loading Sales data...")

    raw_df = load_all_sales()

    print(f"Raw records: {len(raw_df)}")
    print(
        "Products:",
        raw_df["product_id"].nunique()
    )

    print("\n[2] Preparing daily dataset...")

    daily_df = prepare_daily_data(raw_df)

    print(
        "Daily records:",
        len(daily_df)
    )

    print("\n[3] Preparing weekly dataset...")

    weekly_df = prepare_weekly_data(daily_df)

    print(
        "Weekly records:",
        len(weekly_df)
    )

    print("\n[4] Running audit...")

    summary = run_audit(
        raw_df,
        daily_df,
        weekly_df
    )

    print("\nAUDIT SUMMARY")

    for key, value in summary.items():
        print(f"{key}: {value}")

    print("\nResults saved in:", OUTPUT_DIR)


if __name__ == "__main__":
    main()