
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
from app.services.backtesting.validation_selection import (
    select_validation_models,
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
from app.services.backtesting.evaluation.intermittency import (
    calculate_intermittency,
)


OUTPUT_DIR = Path("backtesting_results/phase36")


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


def save_csv(dataframe, path):
    dataframe.to_csv(path, index=False)


def run_frequency(dataset, frequency):
    config = CONFIGS[frequency]

    horizon = config["horizon"]
    min_train_size = config["min_train_size"]
    models = config["models"]

    split = split_chronologically(
        dataset,
        train_ratio=0.60,
        validation_ratio=0.20,
        min_train_size=min_train_size,
    )

    frequency_dir = OUTPUT_DIR / frequency
    frequency_dir.mkdir(parents=True, exist_ok=True)

    all_predictions = []
    all_fold_metrics = []
    all_model_metrics = []
    all_selections = []
    all_diagnostics = []
    skipped_products = []

    

    # Ambil seluruh product_id dari dataset asli,
    # bukan hanya produk yang muncul di train.
    all_product_ids = sorted(
        dataset["product_id"].dropna().unique()
    )

    # Buat lookup agar tidak perlu filter DataFrame berulang kali.
    train_groups = {
        product_id: group.sort_values("ds").reset_index(drop=True)
        for product_id, group in split.train.groupby("product_id")
    }

    validation_groups = {
        product_id: group.sort_values("ds").reset_index(drop=True)
        for product_id, group in split.validation.groupby("product_id")
    }

    for product_id in all_product_ids:

        product_train = train_groups.get(
            product_id,
            pd.DataFrame(columns=["ds", "y"]),
        )

        product_validation = validation_groups.get(
            product_id,
            pd.DataFrame(columns=["ds", "y"]),
        )

        # Produk tidak memiliki observasi pada train.
        if product_train.empty:
            skipped_products.append({
                "product_id": product_id,
                "frequency": frequency,
                "reason": "Tidak memiliki observasi pada periode train.",
            })
            continue

        if product_validation.empty:
            skipped_products.append({
                "product_id": product_id,
                "frequency": frequency,
                "reason": "Tidak memiliki data validation.",
            })
            continue

        if len(product_train) < min_train_size:
            skipped_products.append({
                "product_id": product_id,
                "frequency": frequency,
                "reason": (
                    f"Train hanya {len(product_train)} periode; "
                    f"minimum {min_train_size}."
                ),
            })
            continue

        if len(product_validation) < horizon:
            skipped_products.append({
                "product_id": product_id,
                "frequency": frequency,
                "reason": (
                    f"Validation hanya {len(product_validation)} "
                    f"periode; minimum satu horizon adalah {horizon}."
                ),
            })
            continue

        # Demand pattern is calculated from TRAIN only.
        diagnostic = calculate_intermittency(
            product_train["y"].to_numpy(dtype=float)
        )

        all_diagnostics.append({
            "product_id": product_id,
            "frequency": frequency,
            **diagnostic,
        })

        predictions, fold_metrics = (
            run_holdout_rolling_origin_backtest(
                history_df=product_train[["ds", "y"]],
                evaluation_df=product_validation[["ds", "y"]],
                models=models,
                horizon=horizon,
                min_train_size=min_train_size,
                step_size=horizon,
            )
        )

        expected_folds = len(product_validation) // horizon
        expected_observations = expected_folds * horizon

        if not fold_metrics.empty:
            fold_metrics["product_id"] = product_id
            fold_metrics["frequency"] = frequency

            all_fold_metrics.append(fold_metrics)

        if not predictions.empty:
            predictions["product_id"] = product_id
            predictions["frequency"] = frequency

            all_predictions.append(predictions)

        # A model is eligible only when every expected fold
        # succeeds and every evaluated date has a prediction.
        eligible_models = []

        for model_name in models:
            model_folds = fold_metrics[
                fold_metrics["model"] == model_name
            ]

            model_predictions = predictions[
                predictions["model"] == model_name
            ] if not predictions.empty else pd.DataFrame()

            successful_folds = (
                model_folds["status"].eq("success").sum()
                if not model_folds.empty
                else 0
            )

            complete_coverage = (
                successful_folds == expected_folds
                and len(model_predictions) == expected_observations
                and model_predictions["ds"].nunique()
                == expected_observations
            )

            if complete_coverage:
                eligible_models.append(model_name)

        eligible_predictions = (
            predictions[
                predictions["model"].isin(eligible_models)
            ].copy()
            if not predictions.empty
            else pd.DataFrame()
        )

        # Preserve all model execution results, including failures.
        for model_name in models:
            model_folds = fold_metrics[
                fold_metrics["model"] == model_name
            ]

            model_predictions = (
                predictions[
                    predictions["model"] == model_name
                ]
                if not predictions.empty
                else pd.DataFrame()
            )

            all_model_metrics.append({
                "product_id": product_id,
                "frequency": frequency,
                "model": model_name,
                "expected_folds": expected_folds,
                "successful_folds": int(
                    (model_folds["status"] == "success").sum()
                ) if not model_folds.empty else 0,
                "failed_folds": int(
                    (model_folds["status"] == "failed").sum()
                ) if not model_folds.empty else 0,
                "prediction_observations": len(model_predictions),
                "eligible_for_selection": (
                    model_name in eligible_models
                ),
            })

        if eligible_predictions.empty:
            all_selections.append({
                "product_id": product_id,
                "frequency": frequency,
                "selected_model": None,
                "selection_reason": "no_complete_model",
                "fallback_applied": False,
                "validation_mae": np.nan,
                "validation_rmse": np.nan,
                "validation_wape": np.nan,
                "n_predictions": 0,
            })

            print(
                f"[{frequency}] {product_id}: "
                "No model has complete validation coverage."
            )
            continue

        selection, model_metrics = select_validation_models(
            eligible_predictions,
            naive_model="naive",
        )

        selection["product_id"] = product_id
        selection["frequency"] = frequency

        model_metrics["product_id"] = product_id
        model_metrics["frequency"] = frequency

        all_selections.append(
            selection.to_dict(orient="records")[0]
        )

        all_model_metrics.extend(
            model_metrics.to_dict(orient="records")
        )

        selected_model = selection.iloc[0]["selected_model"]

        print(
            f"[{frequency}] {product_id}: "
            f"{expected_folds} folds, "
            f"selected={selected_model}"
        )

    predictions_df = pd.concat(
        all_predictions,
        ignore_index=True,
    ) if all_predictions else pd.DataFrame()

    fold_metrics_df = pd.concat(
        all_fold_metrics,
        ignore_index=True,
    ) if all_fold_metrics else pd.DataFrame()

    model_metrics_df = pd.DataFrame(all_model_metrics)
    selection_df = pd.DataFrame(all_selections)
    diagnostics_df = pd.DataFrame(all_diagnostics)
    skipped_df = pd.DataFrame(skipped_products)

    save_csv(
        predictions_df,
        frequency_dir / "validation_predictions.csv",
    )

    save_csv(
        fold_metrics_df,
        frequency_dir / "validation_fold_metrics.csv",
    )

    save_csv(
        model_metrics_df,
        frequency_dir / "validation_model_metrics.csv",
    )

    save_csv(
        selection_df,
        frequency_dir / "validation_model_selection.csv",
    )

    save_csv(
        diagnostics_df,
        frequency_dir / "validation_diagnostics.csv",
    )

    save_csv(
        skipped_df,
        frequency_dir / "validation_skipped_products.csv",
    )

    metadata = {
        "frequency": frequency,
        "split": {
            key: str(value) if isinstance(value, pd.Timestamp)
            else value
            for key, value in split.metadata.items()
        },
        "horizon": horizon,
        "min_train_size": min_train_size,
        "expected_models": list(models.keys()),
        "evaluation_protocol": "expanding_window_rolling_origin",
        "step_size": horizon,
    }

    with open(
        frequency_dir / "split_metadata.json",
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            metadata,
            file,
            indent=4,
            ensure_ascii=False,
        )

    print(f"\n[{frequency}] PRODUCT AUDIT")

    print("Dataset products:", dataset["product_id"].nunique())
    print("Train products:", split.train["product_id"].nunique())
    print("Validation products:", split.validation["product_id"].nunique())
    print("Test products:", split.test["product_id"].nunique())

    print(
        "Products absent from train:",
        sorted(
            set(dataset["product_id"])
            - set(split.train["product_id"])
        ),
    )

    return selection_df, skipped_df, metadata


def main():
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    print("=== PHASE 3.6 VALIDATION ===")

    raw_df = load_all_sales()

    print("Raw products:", raw_df["product_id"].nunique())

    daily_df = prepare_daily_data(raw_df)
    weekly_df = prepare_weekly_data(daily_df)

    print("Daily products:", daily_df["product_id"].nunique())
    print("Weekly products:", weekly_df["product_id"].nunique())

    daily_selection, daily_skipped, daily_metadata = (
        run_frequency(daily_df, "daily")
    )

    weekly_selection, weekly_skipped, weekly_metadata = (
        run_frequency(weekly_df, "weekly")
    )

    combined_selection = pd.concat(
        [daily_selection, weekly_selection],
        ignore_index=True,
    )

    combined_selection.to_csv(
        OUTPUT_DIR / "validation_model_selection_all.csv",
        index=False,
    )

    combined_metadata = {
        "daily": daily_metadata,
        "weekly": weekly_metadata,
    }

    with open(
        OUTPUT_DIR / "validation_split_metadata.json",
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            combined_metadata,
            file,
            indent=4,
            ensure_ascii=False,
        )

    print("\n=== VALIDATION SUMMARY ===")

    for frequency, selection in [
        ("daily", daily_selection),
        ("weekly", weekly_selection),
    ]:
        print(f"\n{frequency.upper()}")

        print(
            "Products with selection:",
            selection["selected_model"].notna().sum(),
        )

        print(
            "Not evaluable:",
            selection["selected_model"].isna().sum(),
        )

        if not selection.empty:
            print(
                selection["selected_model"]
                .value_counts(dropna=False)
                .to_string()
            )

    print("\nDaily skipped:", len(daily_skipped))
    print("Weekly skipped:", len(weekly_skipped))

    print("\nValidation results saved to:", OUTPUT_DIR.resolve())


if __name__ == "__main__":
    main()
