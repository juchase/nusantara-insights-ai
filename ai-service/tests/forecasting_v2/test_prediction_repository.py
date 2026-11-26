
import pandas as pd
import pytest

from app.services.forecasting_v2.prediction_repository import (
    prepare_daily_history,
    aggregate_weekly_history,
    build_forecast_dates,
)


def test_daily_history_fills_missing_dates():
    df = pd.DataFrame({
        "ds": ["2024-01-01", "2024-01-03"],
        "y": [10, 5],
    })

    result = prepare_daily_history(df)

    assert len(result) == 3
    assert result["y"].tolist() == [10.0, 0.0, 5.0]


def test_daily_history_aggregates_duplicate_dates():
    df = pd.DataFrame({
        "ds": ["2024-01-01", "2024-01-01"],
        "y": [10, 5],
    })

    result = prepare_daily_history(df)

    assert len(result) == 1
    assert result.iloc[0]["y"] == 15


def test_daily_history_clips_negative_sales():
    df = pd.DataFrame({
        "ds": ["2024-01-01", "2024-01-02"],
        "y": [10, -5],
    })

    result = prepare_daily_history(df)

    assert result["y"].tolist() == [10.0, 0.0]



def test_weekly_history_uses_w_monday():
    daily = pd.DataFrame({
        "ds": pd.date_range("2024-01-01", periods=14, freq="D"),
        "y": [1.0] * 14,
    })

    result = aggregate_weekly_history(daily)

    assert len(result) == 3
    assert result["y"].tolist() == [1.0, 7.0, 6.0]

    assert result["ds"].tolist() == [
        pd.Timestamp("2024-01-01"),
        pd.Timestamp("2024-01-08"),
        pd.Timestamp("2024-01-15"),
    ]


def test_daily_forecast_dates():
    dates = build_forecast_dates(
        last_history_date="2024-01-10",
        frequency="D",
        horizon=7,
    )

    assert len(dates) == 7
    assert str(dates[0]) == "2024-01-11"
    assert str(dates[-1]) == "2024-01-17"


def test_weekly_forecast_dates():
    dates = build_forecast_dates(
        last_history_date="2024-01-08",
        frequency="W",
        horizon=4,
    )

    assert len(dates) == 4
    assert str(dates[0]) == "2024-01-15"
    assert str(dates[-1]) == "2024-02-05"


def test_empty_history_returns_empty_dataframe():
    result = prepare_daily_history(
        pd.DataFrame(columns=["ds", "y"])
    )

    assert result.empty


def test_invalid_frequency_is_rejected():
    with pytest.raises(ValueError):
        build_forecast_dates(
            last_history_date="2024-01-10",
            frequency="M",
            horizon=4,
        )
