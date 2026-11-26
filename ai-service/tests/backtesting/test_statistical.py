
import numpy as np

from app.services.backtesting.models.statistical import (
    prophet_forecast,
    sarima_forecast,
)


def check_output(name, prediction, horizon):
    assert len(prediction) == horizon
    assert np.isfinite(prediction).all()
    assert (prediction >= 0).all()

    print(f"{name}: {prediction.round(3).tolist()}")


def main():
    horizon = 7

    daily_data = [
        2, 3, 2, 4, 5, 3, 4,
        3, 4, 3, 5, 6, 4, 5,
        4, 5, 4, 6, 7, 5, 6,
        5, 6, 5, 7, 8, 6, 7,
        6, 7, 6, 8, 9, 7, 8,
        7, 8, 7, 9, 10, 8, 9,
        8, 9, 8, 10, 11, 9, 10,
        9, 10, 9, 11, 12, 10, 11,
    ]

    weekly_data = [
        10, 11, 12, 10, 13, 14, 12,
        15, 14, 16, 15, 17, 18, 16,
        19, 18, 20, 19, 21, 22, 20,
        23, 22, 24, 23, 25, 26, 24,
        27, 26, 28, 27, 29, 30, 28,
        31, 30, 32, 31, 33, 34, 32,
    ]

    print("=== STATISTICAL MODELS TEST ===")

    # Prophet harian: weekly seasonality.
    prophet_daily = prophet_forecast(
        daily_data,
        horizon,
        frequency="D",
    )
    check_output("Prophet daily", prophet_daily, horizon)

    # Prophet mingguan: tanpa yearly seasonality.
    prophet_weekly = prophet_forecast(
        weekly_data,
        horizon,
        frequency="W",
    )
    check_output("Prophet weekly", prophet_weekly, horizon)

    # SARIMA harian: seasonal period 7.
    sarima_daily = sarima_forecast(
        daily_data,
        horizon,
        seasonal_periods=7,
    )
    check_output("SARIMA daily seasonal 7", sarima_daily, horizon)

    # SARIMA mingguan: nonseasonal.
    sarima_weekly = sarima_forecast(
        weekly_data,
        horizon,
    )
    check_output("ARIMA weekly nonseasonal", sarima_weekly, horizon)

    # Validasi histori musiman tidak cukup.
    try:
        sarima_forecast(
            [1, 2, 3, 4, 5, 6, 7],
            horizon,
            seasonal_periods=7,
        )
    except ValueError:
        print("Insufficient SARIMA history: correctly rejected.")
    else:
        raise AssertionError(
            "SARIMA seharusnya menolak histori yang tidak cukup."
        )

    print("\nAll statistical model tests passed.")


if __name__ == "__main__":
    main()
