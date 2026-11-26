from pathlib import Path
import pandas as pd
import numpy as np

BASE = Path("backtesting_results/phase36/test")

for frequency in ["daily", "weekly"]:
    df = pd.read_csv(
        BASE / f"{frequency}_paired_predictions.csv"
    )

    print(f"\n=== {frequency.upper()} PRODUCT WIN RATE ===")

    df["selected_abs_error"] = (
        df["y_true_selected"] - df["y_pred_selected"]
    ).abs()

    df["naive_abs_error"] = (
        df["y_true_naive"] - df["y_pred_naive"]
    ).abs()

    df["selected_squared_error"] = (
        df["y_true_selected"] - df["y_pred_selected"]
    ) ** 2

    df["naive_squared_error"] = (
        df["y_true_naive"] - df["y_pred_naive"]
    ) ** 2

    results = []

    for product_id, group in df.groupby("product_id"):
        selected_mae = group["selected_abs_error"].mean()
        naive_mae = group["naive_abs_error"].mean()

        selected_rmse = np.sqrt(
            group["selected_squared_error"].mean()
        )
        naive_rmse = np.sqrt(
            group["naive_squared_error"].mean()
        )

        selected_wape = (
            group["selected_abs_error"].sum()
            / group["y_true_selected"].abs().sum() * 100
            if group["y_true_selected"].abs().sum() > 0
            else np.nan
        )

        naive_wape = (
            group["naive_abs_error"].sum()
            / group["y_true_naive"].abs().sum() * 100
            if group["y_true_naive"].abs().sum() > 0
            else np.nan
        )

        results.append({
            "product_id": product_id,
            "n_predictions": len(group),
            "selected_mae": selected_mae,
            "naive_mae": naive_mae,
            "selected_rmse": selected_rmse,
            "naive_rmse": naive_rmse,
            "selected_wape": selected_wape,
            "naive_wape": naive_wape,
            "mae_win": selected_mae < naive_mae,
            "rmse_win": selected_rmse < naive_rmse,
            "wape_win": (
                selected_wape < naive_wape
                if pd.notna(selected_wape) and pd.notna(naive_wape)
                else False
            ),
        })

    result_df = pd.DataFrame(results)

    print("Jumlah produk:", len(result_df))
    print("MAE wins:", result_df["mae_win"].sum())
    print("RMSE wins:", result_df["rmse_win"].sum())
    print("WAPE wins:", result_df["wape_win"].sum())

    result_df.to_csv(
        BASE / f"{frequency}_product_win_rate.csv",
        index=False,
    )