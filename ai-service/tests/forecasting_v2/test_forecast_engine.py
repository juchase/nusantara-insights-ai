
import numpy as np
import pytest

from app.services.forecasting_v2.forecast_engine import (
    generate_forecast,
)


def test_unknown_weekly_product_uses_naive_fallback():
    result = generate_forecast(
        product_id="product-001",
        frequency="W",
        history=[10, 12, 15],
    )

    assert result.model_used == "naive"
    assert result.strategy == "naive_fallback"
    assert result.fallback_used is True
    assert result.forecast == (15.0, 15.0, 15.0, 15.0)


def test_daily_unknown_product_uses_naive_fallback():
    result = generate_forecast(
        product_id="unknown-product",
        frequency="D",
        history=[10, 12, 15],
    )

    assert result.model_used == "naive"
    assert result.strategy == "naive_fallback"
    assert result.fallback_used is True
    assert len(result.forecast) == 7


def test_weekly_horizon_is_four():
    result = generate_forecast(
        product_id="product-002",
        frequency="W",
        history=[5, 7, 9],
    )

    assert len(result.forecast) == 4


def test_daily_horizon_is_seven():
    result = generate_forecast(
        product_id="unknown-product",
        frequency="D",
        history=[5, 7, 9],
    )

    assert len(result.forecast) == 7


def test_empty_history_is_rejected():
    with pytest.raises(ValueError):
        generate_forecast(
            product_id="product-001",
            frequency="W",
            history=[],
        )


def test_invalid_frequency_is_rejected():
    with pytest.raises(ValueError):
        generate_forecast(
            product_id="product-001",
            frequency="M",
            history=[10, 20, 30],
        )
