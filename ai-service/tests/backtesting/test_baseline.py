
import numpy as np

from app.services.backtesting.models.baseline import (
    naive_forecast,
    sma_forecast,
    wma_forecast,
)

from app.services.backtesting.evaluation.metrics import (
    evaluate_forecast,
)


def main():
    history = [2, 4, 3, 5, 6]
    actual = [7, 8, 6]

    horizon = 3

    predictions = {
        "naive": naive_forecast(history, horizon),
        "sma": sma_forecast(history, horizon, window=3),
        "wma": wma_forecast(history, horizon, window=3),
    }

    print("=== BASELINE FORECAST TEST ===")

    for model_name, prediction in predictions.items():
        metrics = evaluate_forecast(actual, prediction)

        print(f"\nModel: {model_name}")
        print("Prediction:", prediction.tolist())
        print("Metrics:", metrics)

    # Validasi WAPE saat seluruh aktual bernilai nol.
    zero_actual = [0, 0, 0]
    zero_prediction = [1, 2, 3]

    zero_metrics = evaluate_forecast(
        zero_actual,
        zero_prediction,
    )

    assert zero_metrics["wape"] is None

    # Validasi output model.
    for prediction in predictions.values():
        assert len(prediction) == horizon
        assert np.isfinite(prediction).all()

    print("\nAll baseline tests passed.")


if __name__ == "__main__":
    main()
