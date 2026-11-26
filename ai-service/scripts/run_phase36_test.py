
from pathlib import Path
import json

import numpy as np
import pandas as pd

from app.services.backtesting.data_loader import load_all_sales
from app.services.backtesting.preprocessing import (
    prepare_daily_data,
    prepare_weekly_data,
)
from app.services.backtesting.temporal_split import (
    split_chronologically,
)
from app.services.backtesting.holdout_backtest_engine import (
    run_holdout_rolling_origin_backtest,
)
from app.services.backtesting.evaluation.metrics import (
    evaluate_forecast,
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
            "holt_winters_7": lambda train, horizon: (
                holt_winters_forecast(
                    train,
                    horizon,
                    seasonal_periods=7,
                )
            ),
            "prophet": lambda train, horizon: prophet_forecast(
                train,
                horizon,
                frequency="D",
            ),
            "sarima_7": lambda train, horizon: sarima_forecast(
                train,
                horizon,
                seasonal_periods=7,
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
                train,
                horizon,
                frequency="W",
            ),
            "arima": lambda train, horizon: sarima_forecast(
                train, horizon
            ),
            **INTERMITTENT_MODELS,
        },
    },
}


BASE_DIR = Path("backtesting_results/phase36")
LOCK_DIR = BASE_DIR / "decision_lock"
OUTPUT_DIR = BASE_DIR / "test"


def save_csv(dataframe, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    dataframe.to_csv(path, index=False)


def load_locked_selection(frequency):
    path = (
        LOCK_DIR
        / frequency
        / "validation_model_selection.csv"
    )

    if not path.exists():
        raise FileNotFoundError(
            f"Decision lock tidak ditemukan: {path}"
        )

    selection = pd.read_csv(path)

    required = {"product_id", "selected_model"}

    if not required.issubset(selection.columns):
        raise ValueError(
            f"{path} harus memiliki kolom {required}"
        )

    if selection["product_id"].duplicated().any():
        raise ValueError(
            f"Decision lock memiliki product_id duplikat: {path}"
        )

    selection["product_id"] = (
        selection["product_id"].astype(str)
    )

    return selection


def aggregate_test_metrics(predictions):
    if predictions.empty:
        return {
            "n_predictions": 0,
            "mae": np.nan,
            "rmse": np.nan,
            "wape": np.nan,
        }

    metrics = evaluate_forecast(
        predictions["y_true"].to_numpy(dtype=float),
        predictions["y_pred"].to_numpy(dtype=float),
    )

    return {
        "n_predictions": len(predictions),
        **metrics,
    }


def run_frequency(dataset, frequency):
    config = CONFIGS[frequency]

    horizon = config["horizon"]
    min_train_size = config["min_train_size"]
    available_models = config["models"]

    selection = load_locked_selection(frequency)

    split = split_chronologically(
        dataset,
        train_ratio=0.60,
        validation_ratio=0.20,
        min_train_size=min_train_size,
    )

    train_groups = {
        str(product_id): group.sort_values("ds").reset_index(drop=True)
        for product_id, group in split.train.groupby("product_id")
    }

    validation_groups = {
        str(product_id): group.sort_values("ds").reset_index(drop=True)
        for product_id, group in split.validation.groupby("product_id")
    }

    test_groups = {
        str(product_id): group.sort_values("ds").reset_index(drop=True)
        for product_id, group in split.test.groupby("product_id")
    }

    all_predictions = []
    all_fold_metrics = []
    all_model_metrics = []
    all_comparisons = []
    skipped_products = []

    for row in selection.itertuples(index=False):
        product_id = str(row.product_id)
        selected_model = row.selected_model

        if pd.isna(selected_model):
            skipped_products.append({
                "product_id": product_id,
                "frequency": frequency,
                "reason": "Tidak memiliki model pilihan pada decision lock.",
            })
            continue

        selected_model = str(selected_model)

        if selected_model not in available_models:
            skipped_products.append({
                "product_id": product_id,
                "frequency": frequency,
                "reason": (
                    f"Model '{selected_model}' tidak tersedia "
                    "pada konfigurasi runner."
                ),
            })
            continue

        product_train = train_groups.get(product_id)
        product_validation = validation_groups.get(product_id)
        product_test = test_groups.get(product_id)

        if product_train is None or product_validation is None:
            skipped_products.append({
                "product_id": product_id,
                "frequency": frequency,
                "reason": "Train atau validation tidak ditemukan.",
            })
            continue

        if product_test is None or product_test.empty:
            skipped_products.append({
                "product_id": product_id,
                "frequency": frequency,
                "reason": "Tidak memiliki observasi pada periode test.",
            })
            continue

        history = pd.concat(
            [
                product_train[["ds", "y"]],
                product_validation[["ds", "y"]],
            ],
            ignore_index=True,
        ).sort_values("ds").reset_index(drop=True)

        product_test = product_test[["ds", "y"]].copy()

        if len(history) < min_train_size:
            skipped_products.append({
                "product_id": product_id,
                "frequency": frequency,
                "reason": "Histori train + validation di bawah minimum.",
            })
            continue

        if len(product_test) < horizon:
            skipped_products.append({
                "product_id": product_id,
                "frequency": frequency,
                "reason": (
                    f"Test hanya {len(product_test)} periode; "
                    f"minimum satu horizon adalah {horizon}."
                ),
            })
            continue

        # Run selected model and Naive only.
        # If selected model is Naive, run it once.
        model_names = list(dict.fromkeys([
            selected_model,
            "naive",
        ]))

        test_models = {
            name: available_models[name]
            for name in model_names
        }

        predictions, fold_metrics = (
            run_holdout_rolling_origin_backtest(
                history_df=history,
                evaluation_df=product_test,
                models=test_models,
                horizon=horizon,
                min_train_size=min_train_size,
                step_size=horizon,
            )
        )

        expected_folds = len(product_test) // horizon
        expected_observations = expected_folds * horizon
        trailing_observations = len(product_test) - expected_observations

        if not predictions.empty:
            predictions["product_id"] = product_id
            predictions["frequency"] = frequency
            all_predictions.append(predictions)

        if not fold_metrics.empty:
            fold_metrics["product_id"] = product_id
            fold_metrics["frequency"] = frequency
            all_fold_metrics.append(fold_metrics)

        product_model_results = {}

        for model_name in model_names:
            model_folds = (
                fold_metrics[
                    fold_metrics["model"] == model_name
                ]
                if not fold_metrics.empty
                else pd.DataFrame()
            )

            model_predictions = (
                predictions[
                    predictions["model"] == model_name
                ].copy()
                if not predictions.empty
                else pd.DataFrame()
            )

            successful_folds = (
                int(model_folds["status"].eq("success").sum())
                if not model_folds.empty
                else 0
            )

            failed_folds = (
                int(model_folds["status"].eq("failed").sum())
                if not model_folds.empty
                else 0
            )

            complete_coverage = (
                successful_folds == expected_folds
                and failed_folds == 0
                and len(model_predictions) == expected_observations
                and model_predictions["ds"].nunique()
                == expected_observations
            )

            aggregate = aggregate_test_metrics(
                model_predictions
            ) if complete_coverage else {
                "n_predictions": len(model_predictions),
                "mae": np.nan,
                "rmse": np.nan,
                "wape": np.nan,
            }

            status = (
                "success"
                if complete_coverage
                else "incomplete_or_failed"
            )

            result = {
                "product_id": product_id,
                "frequency": frequency,
                "model": model_name,
                "is_selected_model": model_name == selected_model,
                "is_baseline": model_name == "naive",
                "expected_folds": expected_folds,
                "successful_folds": successful_folds,
                "failed_folds": failed_folds,
                "expected_observations": expected_observations,
                "prediction_observations": len(model_predictions),
                "eligible_for_final_comparison": complete_coverage,
                "status": status,
                **aggregate,
            }

            all_model_metrics.append(result)
            product_model_results[model_name] = result

        selected_result = product_model_results[selected_model]
        naive_result = product_model_results["naive"]

        comparison = {
            "product_id": product_id,
            "frequency": frequency,
            "selected_model": selected_model,
            "selected_status": selected_result["status"],
            "naive_status": naive_result["status"],
            "selected_mae": selected_result["mae"],
            "naive_mae": naive_result["mae"],
            "selected_rmse": selected_result["rmse"],
            "naive_rmse": naive_result["rmse"],
            "selected_wape": selected_result["wape"],
            "naive_wape": naive_result["wape"],
            "selected_minus_naive_mae": np.nan,
            "selected_minus_naive_rmse": np.nan,
            "selected_minus_naive_wape": np.nan,
            "test_observations": len(product_test),
            "evaluated_observations": expected_observations,
            "trailing_observations_ignored": trailing_observations,
        }

        if (
            selected_result["status"] == "success"
            and naive_result["status"] == "success"
        ):
            comparison["selected_minus_naive_mae"] = (
                selected_result["mae"] - naive_result["mae"]
            )
            comparison["selected_minus_naive_rmse"] = (
                selected_result["rmse"] - naive_result["rmse"]
            )

            if (
                pd.notna(selected_result["wape"])
                and pd.notna(naive_result["wape"])
            ):
                comparison["selected_minus_naive_wape"] = (
                    selected_result["wape"] - naive_result["wape"]
                )

        all_comparisons.append(comparison)

        print(
            f"[{frequency}] {product_id}: "
            f"selected={selected_model}, "
            f"folds={expected_folds}, "
            f"selected_status={selected_result['status']}, "
            f"naive_status={naive_result['status']}"
        )

    frequency_dir = OUTPUT_DIR / frequency
    frequency_dir.mkdir(parents=True, exist_ok=True)

    predictions_df = (
        pd.concat(all_predictions, ignore_index=True)
        if all_predictions else pd.DataFrame()
    )

    fold_metrics_df = (
        pd.concat(all_fold_metrics, ignore_index=True)
        if all_fold_metrics else pd.DataFrame()
    )

    model_metrics_df = pd.DataFrame(all_model_metrics)
    comparisons_df = pd.DataFrame(all_comparisons)
    skipped_df = pd.DataFrame(skipped_products)

    save_csv(
        predictions_df,
        frequency_dir / "test_predictions.csv",
    )
    save_csv(
        fold_metrics_df,
        frequency_dir / "test_fold_metrics.csv",
    )
    save_csv(
        model_metrics_df,
        frequency_dir / "test_model_metrics.csv",
    )
    save_csv(
        comparisons_df,
        frequency_dir / "test_model_comparison.csv",
    )
    save_csv(
        skipped_df,
        frequency_dir / "test_skipped_products.csv",
    )

    metadata = {
        "frequency": frequency,
        "horizon": horizon,
        "min_train_size": min_train_size,
        "step_size": horizon,
        "initial_history": "train + validation",
        "evaluation_period": "test",
        "protocol": "expanding_window_rolling_origin",
        "selection_source": str(
            LOCK_DIR / frequency / "validation_model_selection.csv"
        ),
        "selection_changed_using_test": False,
        "selected_products_in_lock": len(selection),
        "evaluated_products": len(comparisons_df),
        "skipped_products": len(skipped_df),
        "test_start": str(split.metadata["test_start"]),
        "test_end": str(split.metadata["test_end"]),
        "test_dates": split.metadata["test_dates"],
        "trailing_test_observations_ignored": int(
            comparisons_df["trailing_observations_ignored"].sum()
        ) if not comparisons_df.empty else 0,
    }

    with open(
        frequency_dir / "test_metadata.json",
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            metadata,
            file,
            indent=4,
            ensure_ascii=False,
        )

    print(f"\n=== {frequency.upper()} TEST SUMMARY ===")
    print("Products in decision lock:", len(selection))
    print("Products evaluated:", len(comparisons_df))
    print("Products skipped:", len(skipped_df))

    if not model_metrics_df.empty:
        print("\nModel execution status:")
        print(
            model_metrics_df.groupby(
                ["model", "status"]
            ).size().to_string()
        )

    return comparisons_df, skipped_df, metadata


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=== PHASE 3.6 FINAL TEST ===")

    raw_df = load_all_sales()

    daily_df = prepare_daily_data(raw_df)
    weekly_df = prepare_weekly_data(daily_df)

    daily_comparison, daily_skipped, daily_metadata = (
        run_frequency(daily_df, "daily")
    )

    weekly_comparison, weekly_skipped, weekly_metadata = (
        run_frequency(weekly_df, "weekly")
    )

    combined_comparison = pd.concat(
        [daily_comparison, weekly_comparison],
        ignore_index=True,
    )

    save_csv(
        combined_comparison,
        OUTPUT_DIR / "test_model_comparison_all.csv",
    )

    combined_metadata = {
        "phase": "3.6",
        "stage": "final_test_evaluation",
        "daily": daily_metadata,
        "weekly": weekly_metadata,
        "model_selection_changed_using_test": False,
    }

    with open(
        OUTPUT_DIR / "test_metadata_all.json",
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            combined_metadata,
            file,
            indent=4,
            ensure_ascii=False,
        )

    print("\n=== FINAL TEST COMPLETE ===")
    print(
        "Results saved to:",
        OUTPUT_DIR.resolve(),
    )


if __name__ == "__main__":
    main()
