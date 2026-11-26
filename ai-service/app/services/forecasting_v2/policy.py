from dataclasses import dataclass
from typing import Literal

from app.services.forecasting_v2.model_registry import (
    get_daily_model,
    get_weekly_model,
)


Frequency = Literal["D", "W"]


@dataclass(frozen=True)
class ForecastDecision:
    product_id: str
    frequency: Frequency
    model_name: str
    strategy: str
    fallback_required: bool
    selection_reason: str


def resolve_forecast_model(product_id: str, frequency: Frequency) -> ForecastDecision:
    if not product_id or not product_id.strip():
        raise ValueError("product_id tidak boleh kosong.")

    if frequency == "D":
        selection = get_daily_model(product_id)
        label = "daily"
    elif frequency == "W":
        selection = get_weekly_model(product_id)
        label = "weekly"
    else:
        raise ValueError(f"Frequency tidak didukung: {frequency}")

    if selection is None:
        return ForecastDecision(
            product_id=product_id,
            frequency=frequency,
            model_name="naive",
            strategy="naive_fallback",
            fallback_required=True,
            selection_reason=f"{label}_product_not_in_decision_lock",
        )

    return ForecastDecision(
        product_id=product_id,
        frequency=frequency,
        model_name=selection.model_name,
        strategy="validation_selected",
        fallback_required=False,
        selection_reason=selection.selection_reason,
    )
