
import numpy as np

from statsmodels.tsa.holtwinters import (
    ExponentialSmoothing,
    Holt,
    SimpleExpSmoothing,
)


def _validate_input(y_train, horizon: int) -> np.ndarray:
    if (
        not isinstance(horizon, int)
        or isinstance(horizon, bool)
        or horizon < 1
    ):
        raise ValueError("horizon harus integer >= 1.")

    values = np.asarray(y_train, dtype=float)

    if values.ndim != 1:
        raise ValueError("y_train harus satu dimensi.")

    if len(values) == 0:
        raise ValueError("Data training tidak boleh kosong.")

    if not np.isfinite(values).all():
        raise ValueError("Data training mengandung NaN atau infinity.")

    if (values < 0).any():
        raise ValueError("Demand tidak boleh negatif.")

    return values


def _validate_forecast(forecast, horizon: int) -> np.ndarray:
    result = np.asarray(forecast, dtype=float)

    if result.ndim != 1 or len(result) != horizon:
        raise ValueError("Output forecast memiliki dimensi atau panjang salah.")

    if not np.isfinite(result).all():
        raise ValueError("Forecast mengandung NaN atau infinity.")

    # Demand tidak mungkin negatif.
    return np.maximum(result, 0.0)


def ses_forecast(y_train, horizon: int) -> np.ndarray:
    """
    Simple Exponential Smoothing.
    Cocok untuk data tanpa tren dan musiman yang kuat.
    """
    values = _validate_input(y_train, horizon)

    model = SimpleExpSmoothing(
        values,
        initialization_method="estimated",
    )

    fitted = model.fit(optimized=True)

    return _validate_forecast(
        fitted.forecast(horizon),
        horizon,
    )


def holt_forecast(y_train, horizon: int) -> np.ndarray:
    """
    Holt Linear Trend.
    Memperhitungkan level dan tren tanpa komponen musiman.
    """
    values = _validate_input(y_train, horizon)

    if len(values) < 3:
        raise ValueError(
            "Holt membutuhkan minimal 3 observasi training."
        )

    model = Holt(
        values,
        damped_trend=True,
        initialization_method="estimated",
    )

    fitted = model.fit(optimized=True)

    return _validate_forecast(
        fitted.forecast(horizon),
        horizon,
    )


def holt_winters_forecast(
    y_train,
    horizon: int,
    seasonal_periods: int,
) -> np.ndarray:
    """
    Holt-Winters additive.

    Mensyaratkan minimal dua siklus musiman lengkap.
    Tidak menggunakan multiplicative karena demand dapat bernilai nol.
    """
    values = _validate_input(y_train, horizon)

    if (
        not isinstance(seasonal_periods, int)
        or isinstance(seasonal_periods, bool)
        or seasonal_periods < 2
    ):
        raise ValueError("seasonal_periods harus integer >= 2.")

    if len(values) < 2 * seasonal_periods:
        raise ValueError(
            f"Histori tidak cukup untuk Holt-Winters: "
            f"perlu minimal {2 * seasonal_periods} observasi, "
            f"tersedia {len(values)}."
        )

    model = ExponentialSmoothing(
        values,
        trend="add",
        damped_trend=True,
        seasonal="add",
        seasonal_periods=seasonal_periods,
        initialization_method="estimated",
    )

    fitted = model.fit(optimized=True)

    return _validate_forecast(
        fitted.forecast(horizon),
        horizon,
    )
