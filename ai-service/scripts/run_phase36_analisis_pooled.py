
from pathlib import Path
import pandas as pd
import numpy as np

BASE = Path("backtesting_results/phase36/test")

def calculate_pooled_metrics(df):
    y_true = df["y_true"].to_numpy(dtype=float)
    y_pred = df["y_pred"].to_numpy(dtype=float)

    errors = y_true - y_pred

    total_actual = np.abs(y_true).sum()

    return {
        "n_predictions": len(df),
        "mae": np.abs(errors).mean(),
        "rmse": np.sqrt(np.mean(errors ** 2)),
        "wape": (
            np.abs(errors).sum() / total_actual * 100
            if total_actual > 0
            else np.nan
        ),
    }


for frequency in ["daily", "weekly"]:
    print(f"\n=== {frequency.upper()} PAIRED POOLED TEST ===")

    predictions = pd.read_csv(
        BASE / frequency / "test_predictions.csv"
    )

    comparison = pd.read_csv(
        BASE / frequency / "test_model_comparison.csv"
    )

    selected_rows = []

    for row in comparison.itertuples(index=False):
        product_id = str(row.product_id)
        selected_model = str(row.selected_model)

        product_predictions = predictions[
            predictions["product_id"].astype(str) == product_id
        ]

        selected = product_predictions[
            product_predictions["model"] == selected_model
        ].copy()

        naive = product_predictions[
            product_predictions["model"] == "naive"
        ].copy()

        if selected.empty or naive.empty:
            continue

        keys = ["product_id", "fold", "ds"]

        paired = selected.merge(
            naive,
            on=keys,
            suffixes=("_selected", "_naive"),
            validate="one_to_one",
        )

        if paired.empty:
            continue

        # Actual values must match for paired observations.
        if not np.allclose(
            paired["y_true_selected"],
            paired["y_true_naive"],
        ):
            raise ValueError(
                f"Actual values mismatch: {product_id}"
            )

        selected_rows.append(paired)

    if not selected_rows:
        print("Tidak ada pasangan prediksi yang valid.")
        continue

    paired_df = pd.concat(
        selected_rows,
        ignore_index=True,
    )

    selected_metrics = calculate_pooled_metrics(
        pd.DataFrame({
            "y_true": paired_df["y_true_selected"],
            "y_pred": paired_df["y_pred_selected"],
        })
    )

    naive_metrics = calculate_pooled_metrics(
        pd.DataFrame({
            "y_true": paired_df["y_true_naive"],
            "y_pred": paired_df["y_pred_naive"],
        })
    )

    print("Jumlah observasi berpasangan:", len(paired_df))

    print("\nSelected model:")
    print(selected_metrics)

    print("\nNaive:")
    print(naive_metrics)

    print("\nSelisih Selected - Naive:")
    for metric in ["mae", "rmse", "wape"]:
        delta = (
            selected_metrics[metric]
            - naive_metrics[metric]
        )
        print(f"{metric}: {delta:.6f}")

    paired_df.to_csv(
        BASE / f"{frequency}_paired_predictions.csv",
        index=False,
    )
