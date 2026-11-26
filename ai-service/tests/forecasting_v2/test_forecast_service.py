
import pandas as pd
import pytest
from unittest.mock import MagicMock, patch

from app.services.forecasting_v2.forecast_service import (
    run_forecast_v2,
)


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def daily_history():
    return pd.DataFrame({
        "ds": pd.date_range(
            "2024-01-01",
            periods=30,
            freq="D",
        ),
        "y": [10.0] * 30,
    })


@pytest.fixture
def weekly_history():
    return pd.DataFrame({
        "ds": pd.date_range(
            "2024-01-01",
            periods=5,
            freq="W-MON",
        ),
        "y": [70.0] * 5,
    })


def mock_forecast_result(frequency):
    horizon = 7 if frequency == "D" else 4

    return MagicMock(
        model_used="naive",
        strategy="naive_primary" if frequency == "W"
        else "validation_selected",
        fallback_used=False,
        forecast=tuple([10.0] * horizon),
    )


@patch(
    "app.services.forecasting_v2.forecast_service.SessionLocal",
    create=True,
)
@patch(
    "app.services.forecasting_v2.forecast_service.save_predictions"
)
@patch(
    "app.services.forecasting_v2.forecast_service.build_forecast_dates"
)
@patch(
    "app.services.forecasting_v2.forecast_service.generate_forecast"
)
@patch(
    "app.services.forecasting_v2.forecast_service.get_daily_sales_history"
)
def test_daily_forecast_success(
    mock_get_history,
    mock_generate,
    mock_dates,
    mock_save,
    mock_session,
    mock_db,
    daily_history,
):
    mock_session.return_value = mock_db
    mock_get_history.return_value = daily_history
    mock_generate.return_value = mock_forecast_result("D")
    mock_dates.return_value = [
        pd.Timestamp("2024-01-31").date()
        for _ in range(7)
    ]
    mock_save.return_value = 7

    result = run_forecast_v2(
        product_id="product-123",
        frequency="D",
    )

    assert result["status"] == "success"
    assert result["freq"] == "D"
    assert result["totalInserted"] == 7

    mock_generate.assert_called_once()
    assert mock_generate.call_args.kwargs["frequency"] == "D"

    mock_save.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.close.assert_called_once()


@patch(
    "app.services.forecasting_v2.forecast_service.SessionLocal",
)
@patch(
    "app.services.forecasting_v2.forecast_service.save_predictions"
)
@patch(
    "app.services.forecasting_v2.forecast_service.build_forecast_dates"
)
@patch(
    "app.services.forecasting_v2.forecast_service.generate_forecast"
)
@patch(
    "app.services.forecasting_v2.forecast_service.aggregate_weekly_history"
)
@patch(
    "app.services.forecasting_v2.forecast_service.get_daily_sales_history"
)
def test_weekly_forecast_success(
    mock_get_history,
    mock_aggregate,
    mock_generate,
    mock_dates,
    mock_save,
    mock_session,
    mock_db,
    daily_history,
    weekly_history,
):
    mock_session.return_value = mock_db
    mock_get_history.return_value = daily_history
    mock_aggregate.return_value = weekly_history
    mock_generate.return_value = mock_forecast_result("W")
    mock_dates.return_value = [
        pd.Timestamp("2024-02-05").date()
        for _ in range(4)
    ]
    mock_save.return_value = 4

    result = run_forecast_v2(
        product_id="product-123",
        frequency="W",
    )

    assert result["status"] == "success"
    assert result["freq"] == "W"
    assert result["totalInserted"] == 4

    mock_aggregate.assert_called_once()
    mock_generate.assert_called_once()

    assert mock_generate.call_args.kwargs["frequency"] == "W"

    mock_db.commit.assert_called_once()
    mock_db.close.assert_called_once()


@patch(
    "app.services.forecasting_v2.forecast_service.SessionLocal",
    create=True,
)
@patch(
    "app.services.forecasting_v2.forecast_service.get_daily_sales_history"
)
def test_empty_history_raises_error(
    mock_get_history,
    mock_session,
    mock_db,
):
    mock_session.return_value = mock_db

    mock_get_history.return_value = pd.DataFrame(
        columns=["ds", "y"]
    )

    with pytest.raises(ValueError, match="Tidak ada histori"):
        run_forecast_v2(
            product_id="product-123",
            frequency="D",
        )

    mock_db.rollback.assert_called_once()
    mock_db.close.assert_called_once()
    mock_db.commit.assert_not_called()


@patch(
    "app.services.forecasting_v2.forecast_service.SessionLocal",
    create=True,
)
@patch(
    "app.services.forecasting_v2.forecast_service.save_predictions"
)
@patch(
    "app.services.forecasting_v2.forecast_service.build_forecast_dates"
)
@patch(
    "app.services.forecasting_v2.forecast_service.generate_forecast"
)
@patch(
    "app.services.forecasting_v2.forecast_service.get_daily_sales_history"
)
def test_save_failure_rolls_back(
    mock_get_history,
    mock_generate,
    mock_dates,
    mock_save,
    mock_session,
    mock_db,
    daily_history,
):
    mock_session.return_value = mock_db
    mock_get_history.return_value = daily_history
    mock_generate.return_value = mock_forecast_result("D")
    mock_dates.return_value = [
        pd.Timestamp("2024-01-31").date()
        for _ in range(7)
    ]

    mock_save.side_effect = RuntimeError(
        "Database insert failed"
    )

    with pytest.raises(RuntimeError, match="Database insert failed"):
        run_forecast_v2(
            product_id="product-123",
            frequency="D",
        )

    mock_db.rollback.assert_called_once()
    mock_db.close.assert_called_once()
    mock_db.commit.assert_not_called()
