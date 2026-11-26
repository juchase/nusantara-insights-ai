from dataclasses import dataclass
from typing import Literal
from app.services.forecasting_v2.model_registry import ModelSelection

Frequency = Literal["D", "W"]

@dataclass(frozen=True)
class ForecastDecision:
    product_id: str
    frequency: Frequency
    model_name: str
    strategy: str
    fallback_required: bool
    selection_reason: str
    validation_mae: float | None = None
    validation_rmse: float | None = None
    validation_wape: float | None = None
    n_predictions: int = 0
    evaluation_status: str = "unavailable"

def resolve_forecast_model(product_id: str, frequency: Frequency, selection: ModelSelection | None = None, strategy: str | None = None, fallback_required: bool = False, evaluation_status: str = "success") -> ForecastDecision:
    if not product_id or not product_id.strip(): raise ValueError("product_id tidak boleh kosong.")
    if frequency not in {"D", "W"}: raise ValueError(f"Frequency tidak didukung: {frequency}")
    if selection is None:
        return ForecastDecision(product_id, frequency, "naive", "naive_fallback", True, "selection_unavailable", evaluation_status=evaluation_status)
    return ForecastDecision(product_id, frequency, selection.model_name, strategy or "validation_selected", fallback_required, selection.selection_reason, selection.validation_mae, selection.validation_rmse, selection.validation_wape, selection.n_predictions, evaluation_status)
