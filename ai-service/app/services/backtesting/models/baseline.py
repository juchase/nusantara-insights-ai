
import numpy as np


def _validate_input(y_train, horizon: int) -> np.ndarray:
    """Validate historical demand and forecast horizon."""

    if not isinstance(horizon, int) or isinstance(horizon, bool) or horizon < 1:
        raise ValueError("horizon harus berupa integer >= 1.")

    values = np.asarray(y_train, dtype=float)

    if values.ndim != 1:
        raise ValueError("y_train harus berupa array satu dimensi.")

    if len(values) == 0:
        raise ValueError("Data training tidak boleh kosong.")

    if not np.isfinite(values).all():
        raise ValueError("Data training mengandung NaN atau infinity.")

    if (values < 0).any():
        raise ValueError("Demand tidak boleh negatif.")

    return values


def naive_forecast(y_train, horizon: int) -> np.ndarray:
    """
    Menggunakan nilai aktual terakhir sebagai prediksi
    untuk seluruh periode forecast.
    """
    values = _validate_input(y_train, horizon)
    return np.full(horizon, values[-1], dtype=float)


def sma_forecast(
    y_train,
    horizon: int,
    window: int = 7,
) -> np.ndarray:
    """
    Simple Moving Average.

    Menggunakan rata-rata window periode terakhir.
    Jika data lebih pendek dari window, gunakan semua
    data historis yang tersedia.
    """
    values = _validate_input(y_train, horizon)

    if not isinstance(window, int) or isinstance(window, bool) or window < 1:
        raise ValueError("window harus berupa integer >= 1.")

    recent_values = values[-window:]
    average = np.mean(recent_values)

    return np.full(horizon, average, dtype=float)


def wma_forecast(
    y_train,
    horizon: int,
    window: int = 7,
) -> np.ndarray:
    """
    Weighted Moving Average.

    Bobot meningkat untuk data yang lebih baru.
    Contoh 3 periode: bobot [1, 2, 3].
    """
    values = _validate_input(y_train, horizon)

    if not isinstance(window, int) or isinstance(window, bool) or window < 1:
        raise ValueError("window harus berupa integer >= 1.")

    recent_values = values[-window:]

    weights = np.arange(1, len(recent_values) + 1, dtype=float)

    weighted_average = np.average(
        recent_values,
        weights=weights,
    )

    return np.full(horizon, weighted_average, dtype=float)
