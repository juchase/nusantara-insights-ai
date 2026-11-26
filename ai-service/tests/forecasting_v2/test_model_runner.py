
import numpy as np
import pytest

from app.services.forecasting_v2.model_runner import (
    run_forecast_model,
)


@pytest.mark.parametrize(
    "model_name",
    [
        "naive",
        "sma",
        "wma",
        "ses",
        "holt",
        "holt_winters_7",
        "sarima_7",
        "croston",
        "sba",
        "tsb",
    ],
)
def test_daily_models_return_valid_forecast(model_name):
    history = np.array(
        [10, 12, 8, 15, 11, 13, 9] * 8,
        dtype=float,
    )

    forecast = run_forecast_model(
        model_name=model_name,
        y_train=history,
        horizon=7,
    )

    assert forecast.shape == (7,)
    assert np.isfinite(forecast).all()
    assert (forecast >= 0).all()


def test_naive_forecast():
    forecast = run_forecast_model(
        model_name="naive",
        y_train=[10, 12, 15],
        horizon=4,
    )

    np.testing.assert_array_equal(
        forecast,
        [15, 15, 15, 15],
    )


def test_unknown_model_raises_error():
    with pytest.raises(ValueError):
        run_forecast_model(
            model_name="unknown",
            y_train=[10, 12, 15],
            horizon=7,
        )


def test_empty_history_raises_error():
    with pytest.raises(ValueError):
        run_forecast_model(
            model_name="naive",
            y_train=[],
            horizon=7,
        )


def test_weekly_arima_returns_valid_forecast():
    history = np.array([2, 1, 3, 2, 4, 1, 2, 3] * 8, dtype=float)
    forecast = run_forecast_model(
        model_name="arima",
        y_train=history,
        horizon=4,
        frequency="W",
    )
    assert forecast.shape == (4,)
    assert np.isfinite(forecast).all()
    assert (forecast >= 0).all()
