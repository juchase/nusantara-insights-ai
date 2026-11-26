from app.services.forecasting_v2.policy import resolve_forecast_model


def test_weekly_uses_validation_selected_model():
    decision = resolve_forecast_model(
        product_id="06edb72f1e0c64b14c5b79353f7abea3",
        frequency="W",
    )
    assert decision.model_name == "tsb"
    assert decision.strategy == "validation_selected"
    assert decision.fallback_required is False


def test_daily_uses_validation_selected_model():
    decision = resolve_forecast_model(
        product_id="06edb72f1e0c64b14c5b79353f7abea3",
        frequency="D",
    )
    assert decision.model_name == "sma"
    assert decision.strategy == "validation_selected"
    assert decision.fallback_required is False


def test_unknown_daily_product_uses_naive_fallback():
    decision = resolve_forecast_model("unknown-product", "D")
    assert decision.model_name == "naive"
    assert decision.strategy == "naive_fallback"
    assert decision.fallback_required is True


def test_unknown_weekly_product_uses_naive_fallback():
    decision = resolve_forecast_model("unknown-product", "W")
    assert decision.model_name == "naive"
    assert decision.strategy == "naive_fallback"
    assert decision.fallback_required is True


def test_unsupported_frequency_raises_error():
    try:
        resolve_forecast_model("product-001", "M")
    except ValueError:
        return
    raise AssertionError("Expected ValueError")
