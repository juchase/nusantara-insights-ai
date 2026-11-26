
import numpy as np

from app.services.backtesting.models.intermittent import (
    croston_forecast,
    sba_forecast,
    tsb_forecast,
)

from app.services.backtesting.evaluation.intermittency import (
    calculate_intermittency,
)

from app.services.backtesting.evaluation.metrics import (
    evaluate_forecast,
)


def main():
    horizon = 4

    intermittent_data = [
        0, 0, 5, 0, 0, 3, 0, 0, 0, 7,
        0, 0, 4, 0, 0, 0, 6, 0, 0, 5,
    ]

    print("=== INTERMITTENT DEMAND TEST ===")

    predictions = {
        "croston": croston_forecast(
            intermittent_data, horizon, alpha=0.1
        ),
        "sba": sba_forecast(
            intermittent_data, horizon, alpha=0.1
        ),
        "tsb": tsb_forecast(
            intermittent_data,
            horizon,
            alpha=0.1,
            beta=0.1,
        ),
    }

    for name, prediction in predictions.items():
        assert len(prediction) == horizon
        assert np.isfinite(prediction).all()
        assert (prediction >= 0).all()

        print(f"{name}: {prediction.round(4).tolist()}")

    # SBA seharusnya memberikan koreksi lebih rendah dari Croston.
    assert np.all(
        predictions["sba"] <= predictions["croston"]
    )

    # TSB harus menurunkan probabilitas setelah periode tanpa demand.
    recent_demand = tsb_forecast(
        [5],
        horizon,
        alpha=0.1,
        beta=0.1,
    )

    old_demand = tsb_forecast(
        [5, 0, 0, 0, 0, 0],
        horizon,
        alpha=0.1,
        beta=0.1,
    )

    assert old_demand[0] < recent_demand[0]

    print("\n=== INTERMITTENCY DIAGNOSTIC ===")

    diagnostic = calculate_intermittency(intermittent_data)
    print(diagnostic)

    # Semua periode nol.
    zero_forecast = croston_forecast(
        [0, 0, 0, 0],
        horizon,
    )
    assert np.all(zero_forecast == 0)

    zero_diagnostic = calculate_intermittency(
        [0, 0, 0, 0]
    )
    assert zero_diagnostic["demand_pattern"] == "no_demand"

    # Uji evaluasi metrics.
    actual = [0, 0, 5, 0]
    predicted = croston_forecast(
        [0, 0, 5, 0, 0, 3],
        horizon,
    )

    metrics = evaluate_forecast(actual, predicted)
    print("\nMetrics:", metrics)

    print("\nAll intermittent demand tests passed.")


if __name__ == "__main__":
    main()
