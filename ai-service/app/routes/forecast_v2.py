
import logging

from fastapi import APIRouter, HTTPException, Query

from app.services.forecasting_v2.forecast_service import (
    run_forecast_v2,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/forecast/v2",
    tags=["Forecasting V2"],
)


@router.post("/{product_id}")
def generate_forecast_v2(
    product_id: str,
    frequency: str = Query(default="D"),
):
    """
    Generate demand forecast menggunakan Forecasting V2.

    D = Daily, horizon 7 hari.
    W = Weekly, horizon 4 minggu.
    """

    if frequency not in {"D", "W"}:
        raise HTTPException(
            status_code=400,
            detail="Frequency harus D atau W.",
        )

    try:
        result = run_forecast_v2(
            product_id=product_id,
            frequency=frequency,
        )

        return {
            "success": True,
            **result,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )

    except Exception:
        logger.exception(
            "Forecasting V2 gagal untuk product_id=%s",
            product_id,
        )

        raise HTTPException(
            status_code=500,
            detail="Terjadi kesalahan saat menjalankan Forecasting V2.",
        )
