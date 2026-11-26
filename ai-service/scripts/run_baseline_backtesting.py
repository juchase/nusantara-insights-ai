
from pathlib import Path

import pandas as pd

from app.services.backtesting.data_loader import load_all_sales
from app.services.backtesting.preprocessing import (
    prepare_daily_data,
    prepare_weekly_data,
)
from app.services.backtesting.backtest_engine import (
    run_rolling_origin_backtest,
)
from app.services.backtesting.models.baseline import (
    naive_forecast,
    sma_forecast,
    wma_forecast,
)
from app.services.backtesting.models.exponential_smoothing import (
    ses_forecast,
    holt_forecast,
    holt_winters_forecast,
)
from app.services.backtesting.models.statistical import (
    prophet_forecast,
    sarima_forecast,
)
from app.services.backtesting.models.intermittent import (
    croston_forecast,
    sba_forecast,
    tsb_forecast,
)
from app.services.backtesting.evaluation.metrics import (
    evaluate_forecast,
)
from app.services.backtesting.evaluation.intermittency import (
    calculate_intermittency,
)


OUTPUT_DIR = Path("backtesting_results/intermittent")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BASELINE_MODELS = {
    "naive": lambda train, horizon: naive_forecast(
        train, horizon
    ),
    "sma": lambda train, horizon: sma_forecast(
        train, horizon, window=7
    ),
    "wma": lambda train, horizon: wma_forecast(
        train, horizon, window=7
    ),
}

INTERMITTENT_MODELS = {
    "croston": lambda train, horizon: croston_forecast(
        train, horizon, alpha=0.1
    ),
    "sba": lambda train, horizon: sba_forecast(
        train, horizon, alpha=0.1
    ),
    "tsb": lambda train, horizon: tsb_forecast(
        train, horizon, alpha=0.1, beta=0.1
    ),
}

CONFIGS = {
    "daily": {
        "horizon": 7,
        "min_train_size": 28,
        "models": {
            **BASELINE_MODELS,
            "ses": lambda train, horizon: ses_forecast(
                train, horizon
            ),
            "holt": lambda train, horizon: holt_forecast(
                train, horizon
            ),
            "holt_winters_7": lambda train, horizon: holt_winters_forecast(
                train, horizon, seasonal_periods=7
            ),
            "prophet": lambda train, horizon: prophet_forecast(
                train, horizon, frequency="D"
            ),
            "sarima_7": lambda train, horizon: sarima_forecast(
                train, horizon, seasonal_periods=7
            ),
            **INTERMITTENT_MODELS,
        },
    },
    "weekly": {
        "horizon": 4,
        "min_train_size": 12,
        "models": {
            **BASELINE_MODELS,
            "ses": lambda train, horizon: ses_forecast(
                train, horizon
            ),
            "holt": lambda train, horizon: holt_forecast(
                train, horizon
            ),
            "prophet": lambda train, horizon: prophet_forecast(
                train, horizon, frequency="W"
            ),
            "arima": lambda train, horizon: sarima_forecast(
                train, horizon
            ),
            **INTERMITTENT_MODELS,
        },
    },
}


def run_frequency(
    dataset: pd.DataFrame,
    frequency: str,
):
    config = CONFIGS[frequency]

    all_predictions = []
    all_fold_metrics = []
    all_product_metrics = []
    all_diagnostics = []
    skipped_products = []

    for product_id, product_df in dataset.groupby("product_id"):
        product_df = product_df.sort_values("ds").reset_index(drop=True)

        # Diagnosis pola permintaan produk
        diagnostic = calculate_intermittency(
            product_df["y"].to_numpy()
        )

        all_diagnostics.append({
            "product_id": product_id,
            "frequency": frequency,
            **diagnostic,
        })

        required_size = (
            config["min_train_size"] + config["horizon"]
        )

        if len(product_df) < required_size:
            skipped_products.append({
                "product_id": product_id,
                "frequency": frequency,
                "reason": (
                    f"Data tidak cukup: {len(product_df)} periode, "
                    f"minimal {required_size}."
                ),
            })
            continue

        predictions, fold_metrics = run_rolling_origin_backtest(
            df=product_df[["ds", "y"]],
            models=config["models"],
            horizon=config["horizon"],
            min_train_size=config["min_train_size"],
        )

        # Simpan fold metrics meskipun semua model gagal
        if not fold_metrics.empty:
            fold_metrics["product_id"] = product_id
            fold_metrics["frequency"] = frequency
            all_fold_metrics.append(fold_metrics)

        if not predictions.empty:
            predictions["product_id"] = product_id
            predictions["frequency"] = frequency
            all_predictions.append(predictions)

        # Jika tidak ada prediksi berhasil, jangan hitung metrik
        if predictions.empty:
            skipped_products.append({
                "product_id": product_id,
                "frequency": frequency,
                "reason": "Tidak ada model yang menghasilkan prediksi.",
            })
            continue

        # Pooled out-of-sample metrics per produk dan model
        for model_name, model_predictions in predictions.groupby("model"):

            metrics = evaluate_forecast(
                model_predictions["y_true"].to_numpy(),
                model_predictions["y_pred"].to_numpy(),
            )

            model_folds = fold_metrics[
                fold_metrics["model"] == model_name
            ]

            successful_folds = model_folds[
                model_folds["status"] == "success"
            ]

            failed_folds = model_folds[
                model_folds["status"] == "failed"
            ]

            all_product_metrics.append({
                "product_id": product_id,
                "frequency": frequency,
                "model": model_name,

                "total_folds": int(model_folds["fold"].nunique()),
                "successful_folds": int(
                    successful_folds["fold"].nunique()
                ),
                "failed_folds": int(
                    failed_folds["fold"].nunique()
                ),

                "test_observations": len(model_predictions),

                "pooled_mae": metrics["mae"],
                "pooled_rmse": metrics["rmse"],
                "pooled_wape": metrics["wape"],

                "mean_fold_mae": successful_folds["mae"].mean(),
                "mean_fold_rmse": successful_folds["rmse"].mean(),
                "mean_fold_wape": successful_folds["wape"].mean(),
            })

        print(
            f"[{frequency}] Product {product_id}: "
            f"{fold_metrics['fold'].nunique()} folds"
        )

    predictions_df = (
        pd.concat(all_predictions, ignore_index=True)
        if all_predictions else pd.DataFrame()
    )

    fold_metrics_df = (
        pd.concat(all_fold_metrics, ignore_index=True)
        if all_fold_metrics else pd.DataFrame()
    )

    product_metrics_df = pd.DataFrame(all_product_metrics)
    diagnostics_df = pd.DataFrame(all_diagnostics)
    skipped_df = pd.DataFrame(skipped_products)

    # Simpan seluruh hasil eksperimen
    predictions_df.to_csv(
        OUTPUT_DIR / f"{frequency}_predictions.csv",
        index=False,
    )

    fold_metrics_df.to_csv(
        OUTPUT_DIR / f"{frequency}_fold_metrics.csv",
        index=False,
    )

    product_metrics_df.to_csv(
        OUTPUT_DIR / f"{frequency}_product_metrics.csv",
        index=False,
    )

    diagnostics_df.to_csv(
        OUTPUT_DIR / f"{frequency}_diagnostics.csv",
        index=False,
    )

    skipped_df.to_csv(
        OUTPUT_DIR / f"{frequency}_skipped_products.csv",
        index=False,
    )

    return product_metrics_df, skipped_df


def main():
    print("=== OLIST MULTI-MODEL BACKTESTING ===")

    raw_df = load_all_sales()

    print("Raw products:", raw_df["product_id"].nunique())

    daily_df = prepare_daily_data(raw_df)
    weekly_df = prepare_weekly_data(daily_df)

    print("Daily products:", daily_df["product_id"].nunique())
    print("Weekly products:", weekly_df["product_id"].nunique())

    daily_metrics, daily_skipped = run_frequency(
        daily_df,
        "daily",
    )

    weekly_metrics, weekly_skipped = run_frequency(
        weekly_df,
        "weekly",
    )

    combined = pd.concat(
        [daily_metrics, weekly_metrics],
        ignore_index=True,
    )

    combined.to_csv(
        OUTPUT_DIR / "all_product_metrics.csv",
        index=False,
    )

    print("\n=== FINAL SUMMARY ===")
    print("Daily evaluated products:", daily_metrics["product_id"].nunique())
    print("Weekly evaluated products:", weekly_metrics["product_id"].nunique())
    print("Daily skipped:", len(daily_skipped))
    print("Weekly skipped:", len(weekly_skipped))

    print("\n=== MODEL SUMMARY ===")
    if not combined.empty:
        print(
            combined.groupby(["frequency", "model"])[
                ["pooled_mae", "pooled_rmse", "pooled_wape"]
            ]
            .mean()
            .round(4)
            .to_string()
        )

    print("\n=== MODEL EXECUTION SUMMARY ===")

    if not combined.empty:
        execution_summary = (
            combined.groupby(["frequency", "model"])[
                [
                    "total_folds",
                    "successful_folds",
                    "failed_folds",
                ]
            ]
            .sum()
        )

    execution_summary["success_rate"] = (
        execution_summary["successful_folds"]
        / execution_summary["total_folds"]
        * 100
    )

    print(execution_summary.round(2).to_string())

    print(f"\nResults saved to: {OUTPUT_DIR.resolve()}")


if __name__ == "__main__":
    main()
