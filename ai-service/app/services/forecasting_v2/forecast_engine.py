import logging
from dataclasses import dataclass
import numpy as np
from app.services.forecasting_v2.model_runner import run_forecast_model
from app.services.forecasting_v2.model_registry import ModelSelection
from app.services.forecasting_v2.policy import resolve_forecast_model

logger = logging.getLogger(__name__)
HORIZONS = {"D": 7, "W": 4}

@dataclass(frozen=True)
class ForecastResult:
    product_id: str
    frequency: str
    model_selected: str
    model_used: str
    strategy: str
    fallback_used: bool
    forecast: tuple[float, ...]
    selection_reason: str
    evaluation_status: str
    validation_mae: float | None
    validation_rmse: float | None
    validation_wape: float | None
    n_predictions: int

def _validate_history(history):
    values = np.asarray(history, dtype=float)
    if values.ndim != 1 or len(values) == 0: raise ValueError("History harus berupa array satu dimensi dan tidak kosong.")
    if not np.isfinite(values).all(): raise ValueError("History mengandung NaN atau infinity.")
    if (values < 0).any(): raise ValueError("Demand tidak boleh negatif.")
    return values

def generate_forecast(product_id: str, frequency: str, history, selection: ModelSelection | None = None, strategy: str | None = None, fallback_required: bool = False, evaluation_status: str = "success") -> ForecastResult:
    if frequency not in HORIZONS: raise ValueError(f"Frequency tidak didukung: {frequency}")
    values = _validate_history(history)
    decision = resolve_forecast_model(product_id, frequency, selection, strategy, fallback_required, evaluation_status)
    model_selected = decision.model_name
    model_used = model_selected
    fallback_used = decision.fallback_required
    final_strategy = decision.strategy
    try:
        forecast = run_forecast_model(model_used, values, HORIZONS[frequency], frequency)
    except Exception:
        logger.exception("Selected model failed; trying Naive fallback. product_id=%s frequency=%s model=%s", product_id, frequency, model_selected)
        if model_selected == "naive": raise
        forecast = run_forecast_model("naive", values, HORIZONS[frequency], frequency)
        model_used, fallback_used, final_strategy = "naive", True, "runtime_fallback"
    return ForecastResult(product_id, frequency, model_selected, model_used, final_strategy, fallback_used, tuple(float(v) for v in forecast), decision.selection_reason, decision.evaluation_status, decision.validation_mae, decision.validation_rmse, decision.validation_wape, decision.n_predictions)
