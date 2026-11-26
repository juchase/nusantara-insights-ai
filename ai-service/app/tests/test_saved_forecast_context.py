from datetime import date
from types import SimpleNamespace

from app.services.forecasting_v2 import saved_forecast_context as service


class FakeResult:
    def __init__(self, rows=None, first=None):
        self._rows = rows or []
        self._first = first

    def mappings(self):
        return self

    def all(self):
        return self._rows

    def first(self):
        return self._first

    def fetchall(self):
        return self._rows


class FakeDB:
    def __init__(self, predictions, selection, history):
        self.results = [
            FakeResult(rows=predictions),
            FakeResult(first=selection),
            FakeResult(rows=history),
        ]

    def execute(self, *_args, **_kwargs):
        return self.results.pop(0)


def test_saved_context_uses_persisted_predictions_without_running_forecast(monkeypatch):
    monkeypatch.setattr(
        service,
        "get_daily_model",
        lambda _product_id: SimpleNamespace(
            model_name="sma",
            validation_mae=2.0,
            validation_rmse=3.0,
            validation_wape=20.0,
            n_predictions=4,
        ),
    )
    db = FakeDB(
        predictions=[
            {"predictionDate": date(2026, 11, 27), "predictedSales": 12, "modelVersion": "forecasting_v2:D:sma"},
            {"predictionDate": date(2026, 11, 28), "predictedSales": 14, "modelVersion": "forecasting_v2:D:sma"},
        ],
        selection=None,
        history=[(date(2026, 11, 20), 10), (date(2026, 11, 21), 10)],
    )

    result = service.load_saved_forecast_context(db, "product-1", "D")

    assert result["freq"] == "D"
    assert result["model_used"] == "sma"
    assert result["fallback_used"] is False
    assert result["confidence"]["score"] == 80.0
    assert result["forecast_summary"]["avg"] == 13.0


def test_saved_context_marks_confidence_unavailable_for_runtime_fallback(monkeypatch):
    monkeypatch.setattr(
        service,
        "get_weekly_model",
        lambda _product_id: SimpleNamespace(
            model_name="tsb",
            validation_mae=2.0,
            validation_rmse=3.0,
            validation_wape=20.0,
            n_predictions=4,
        ),
    )
    db = FakeDB(
        predictions=[
            {"predictionDate": date(2026, 12, 7), "predictedSales": 8, "modelVersion": "forecasting_v2:W:naive"},
        ],
        selection=None,
        history=[(date(2026, 11, 16), 7), (date(2026, 11, 23), 8)],
    )

    result = service.load_saved_forecast_context(db, "product-1", "W")

    assert result["fallback_used"] is True
    assert result["confidence"]["score"] is None
    assert result["confidence"]["reason"] == "fallback_model_used"


def test_saved_context_rejects_invalid_frequency():
    try:
        service.load_saved_forecast_context(FakeDB([], None, []), "product-1", "M")
    except ValueError as exc:
        assert "Frequency harus D atau W" in str(exc)
    else:
        raise AssertionError("Invalid frequency should be rejected")
