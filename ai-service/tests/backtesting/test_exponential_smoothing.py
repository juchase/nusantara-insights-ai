
import numpy as np

from app.services.backtesting.models.exponential_smoothing import (
    ses_forecast,
    holt_forecast,
    holt_winters_forecast,
)


def validate_output(name, prediction, horizon):
    assert len(prediction) == horizon
    assert np.isfinite(prediction).all()
    assert (prediction >= 0).all()

    print(f"{name}: {prediction.round(3).tolist()}")


def main():
    horizon = 7

    # Data dengan level relatif stabil.
    stable_data = [
        5, 6, 4, 5, 5, 6, 4,
        5, 6, 5, 4, 6, 5, 5,
        4, 5, 6, 5, 5, 4, 6,
        5, 4, 6, 5, 5, 6, 4,
    ]

    # Data dengan tren meningkat.
    trend_data = [
        2, 3, 3, 4, 4, 5, 5,
        6, 6, 7, 7, 8, 8, 9,
        9, 10, 10, 11, 11, 12,
        12, 13, 13, 14, 14, 15,
        15, 16,
    ]

    # Data dengan pola musiman 7 periode.
    seasonal_data = [
        5, 7, 8, 9, 10, 12, 14,
        5, 7, 8, 9, 10, 12, 14,
        5, 7, 8, 9, 10, 12, 14,
        5, 7, 8, 9, 10, 12, 14,
    ]

    print("=== EXPONENTIAL SMOOTHING TEST ===")

    ses = ses_forecast(stable_data, horizon)
    validate_output("SES", ses, horizon)

    holt = holt_forecast(trend_data, horizon)
    validate_output("Holt", holt, horizon)

    hw = holt_winters_forecast(
        seasonal_data,
        horizon,
        seasonal_periods=7,
    )
    validate_output("Holt-Winters", hw, horizon)

    # Validasi histori musiman tidak cukup.
    try:
        holt_winters_forecast(
            [1, 2, 3, 4, 5, 6, 7],
            horizon,
            seasonal_periods=7,
        )
    except ValueError:
        print("Insufficient seasonal history: correctly rejected.")
    else:
        raise AssertionError(
            "Holt-Winters seharusnya menolak histori yang tidak cukup."
        )

    print("\nAll exponential smoothing tests passed.")


if __name__ == "__main__":
    main()
