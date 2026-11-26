
import pandas as pd

from app.services.backtesting.backtest_engine import (
    run_rolling_origin_backtest,
)
from app.services.backtesting.models.baseline import (
    naive_forecast,
    sma_forecast,
    wma_forecast,
)
from app.services.backtesting.evaluation.metrics import (
    evaluate_forecast,
)


def main():
    # Data simulasi 60 hari untuk menguji mekanisme fold.
    df = pd.DataFrame({
        "ds": pd.date_range("2024-01-01", periods=60, freq="D"),
        "y": [
            2, 3, 2, 4, 5, 3, 4, 6, 5, 4,
            3, 5, 6, 4, 5, 7, 6, 5, 4, 6,
            7, 5, 6, 8, 7, 6, 5, 7, 8, 6,
            7, 9, 8, 7, 6, 8, 9, 7, 8, 10,
            9, 8, 7, 9, 10, 8, 9, 11, 10, 9,
            8, 10, 11, 9, 10, 12, 11, 10, 9, 11,
        ],
    })

    models = {
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

    predictions, fold_metrics = run_rolling_origin_backtest(
        df=df,
        models=models,
        horizon=7,
        min_train_size=28,
    )

    print("\n=== ROLLING ORIGIN TEST ===")
    print("Total folds:", fold_metrics["fold"].nunique())
    print("Prediction rows:", len(predictions))

    print("\n=== FOLD METRICS ===")
    print(fold_metrics.to_string(index=False))

    print("\n=== AGGREGATED MODEL METRICS ===")

    # Gabungkan semua prediksi out-of-sample per model.
    for model_name, group in predictions.groupby("model"):
        metrics = evaluate_forecast(
            group["y_true"].to_numpy(),
            group["y_pred"].to_numpy(),
        )

        print(model_name, metrics)

    # Validasi bahwa semua prediksi berada di luar training window.
    assert predictions["y_true"].notna().all()
    assert predictions["y_pred"].notna().all()
    assert predictions.groupby("model").size().nunique() == 1

    print("\nAll rolling-origin tests passed.")


if __name__ == "__main__":
    main()
