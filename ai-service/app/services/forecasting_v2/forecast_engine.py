
import logging
from dataclasses import dataclass

import numpy as np

from app.services.forecasting_v2.policy import (
    resolve_forecast_model,
)

from app.services.forecasting_v2.model_runner import (
    run_forecast_model,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

logger = logging.getLogger(__name__)


HORIZONS = {
    "D": 7,
    "W": 4,
}


@dataclass(frozen=True)
class ForecastResult:
    product_id: str
    frequency: str
    model_used: str
    strategy: str
    fallback_used: bool
    forecast: tuple[float, ...]


def _validate_history(history) -> np.ndarray:
    values = np.asarray(history, dtype=float)

    if values.ndim != 1:
        raise ValueError(
            "History harus berupa array satu dimensi."
        )

    if len(values) == 0:
        raise ValueError(
            "History tidak boleh kosong."
        )

    if not np.isfinite(values).all():
        raise ValueError(
            "History mengandung NaN atau infinity."
        )

    if (values < 0).any():
        raise ValueError(
            "Demand tidak boleh negatif."
        )

    return values


def generate_forecast(
    product_id: str,
    frequency: str,
    history,
) -> ForecastResult:

    if not product_id or not product_id.strip():
        raise ValueError(
            "product_id tidak boleh kosong."
        )

    if frequency not in HORIZONS:
        raise ValueError(
            f"Frequency tidak didukung: {frequency}"
        )

    values = _validate_history(history)
    horizon = HORIZONS[frequency]

    decision = resolve_forecast_model(
        product_id=product_id,
        frequency=frequency,
    )

    logger.info(
        "Forecast started. product_id=%s frequency=%s "
        "selected_model=%s strategy=%s",
        product_id,
        frequency,
        decision.model_name,
        decision.strategy,
    )

    try:
        forecast = run_forecast_model(
            model_name=decision.model_name,
            y_train=values,
            horizon=horizon,
            frequency=frequency,
        )

        model_used = decision.model_name
        fallback_used = decision.fallback_required
        strategy = decision.strategy

        logger.info(
            "Forecast model executed successfully. "
            "product_id=%s frequency=%s model=%s",
            product_id,
            frequency,
            model_used,
        )

    except Exception:
        logger.exception(
            "Forecast model execution failed. "
            "product_id=%s frequency=%s selected_model=%s",
            product_id,
            frequency,
            decision.model_name,
        )

        if decision.model_name == "naive":
            raise

        logger.warning(
            "Attempting Naive fallback. "
            "product_id=%s frequency=%s",
            product_id,
            frequency,
        )

        forecast = run_forecast_model(
            model_name="naive",
            y_train=values,
            horizon=horizon,
            frequency=frequency,
        )

        model_used = "naive"
        fallback_used = True
        strategy = "naive_fallback"

        logger.info(
            "Naive fallback executed successfully. "
            "product_id=%s frequency=%s",
            product_id,
            frequency,
        )

    return ForecastResult(
        product_id=product_id,
        frequency=frequency,
        model_used=model_used,
        strategy=strategy,
        fallback_used=fallback_used,
        forecast=tuple(
            float(value) for value in forecast
        ),
    )
