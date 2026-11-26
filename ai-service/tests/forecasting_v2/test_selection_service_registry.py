from app.services.forecasting_v2 import selection_service
from app.services.forecasting_v2.model_registry import ModelSelection


def _selection(product_id: str, frequency: str, model: str) -> ModelSelection:
    return ModelSelection(
        product_id=product_id,
        frequency=frequency,
        model_name=model,
        selection_reason="regression-test",
        validation_mae=1.0,
        validation_rmse=1.0,
        validation_wape=10.0,
        n_predictions=4,
    )


def test_daily_frequency_maps_to_daily_registry(monkeypatch):
    expected = _selection("p1", "daily", "sma")
    monkeypatch.setattr(selection_service, "get_daily_model", lambda product_id: expected)
    monkeypatch.setattr(selection_service, "get_weekly_model", lambda product_id: None)

    assert selection_service._get_static_selection("p1", "D") == expected


def test_weekly_frequency_maps_to_weekly_registry(monkeypatch):
    expected = _selection("p1", "weekly", "tsb")
    monkeypatch.setattr(selection_service, "get_weekly_model", lambda product_id: expected)
    monkeypatch.setattr(selection_service, "get_daily_model", lambda product_id: None)

    assert selection_service._get_static_selection("p1", "W") == expected


def test_unsupported_frequency_is_not_treated_as_weekly(monkeypatch):
    monkeypatch.setattr(selection_service, "get_daily_model", lambda product_id: None)
    monkeypatch.setattr(selection_service, "get_weekly_model", lambda product_id: None)

    assert selection_service._get_static_selection("p1", "M") is None
