
import numpy as np


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
        raise ValueError("Data mengandung NaN atau infinity.")

    if (values < 0).any():
        raise ValueError("Demand tidak boleh negatif.")

    return values


def _validate_alpha(alpha: float, name: str = "alpha") -> float:
    if not isinstance(alpha, (int, float)) or isinstance(alpha, bool):
        raise ValueError(f"{name} harus berupa angka.")

    if not 0 < alpha <= 1:
        raise ValueError(f"{name} harus berada pada rentang (0, 1].")

    return float(alpha)


def _constant_forecast(value: float, horizon: int) -> np.ndarray:
    if not np.isfinite(value):
        raise ValueError("Forecast menghasilkan nilai tidak valid.")

    return np.full(
        horizon,
        max(float(value), 0.0),
        dtype=float,
    )


def croston_forecast(
    y_train,
    horizon: int,
    alpha: float = 0.1,
) -> np.ndarray:
    """
    Croston method.

    Ukuran demand dan interval antar-demand diperbarui
    hanya ketika terjadi demand positif.
    """

    values = _validate_input(y_train, horizon)
    alpha = _validate_alpha(alpha)

    nonzero_indices = np.flatnonzero(values > 0)

    # Tidak ada demand positif dalam training.
    if len(nonzero_indices) == 0:
        return _constant_forecast(0.0, horizon)

    first_index = int(nonzero_indices[0])

    demand_size = float(values[first_index])
    interval = float(first_index + 1)
    last_demand_index = first_index

    for index in nonzero_indices[1:]:
        index = int(index)

        observed_interval = float(index - last_demand_index)

        demand_size += alpha * (
            float(values[index]) - demand_size
        )

        interval += alpha * (
            observed_interval - interval
        )

        last_demand_index = index

    forecast = demand_size / interval

    return _constant_forecast(forecast, horizon)


def sba_forecast(
    y_train,
    horizon: int,
    alpha: float = 0.1,
) -> np.ndarray:
    """
    Syntetos-Boylan Approximation.

    Menggunakan koreksi bias pada estimasi Croston:
    (1 - alpha / 2) * Croston forecast.
    """

    values = _validate_input(y_train, horizon)
    alpha = _validate_alpha(alpha)

    croston_prediction = croston_forecast(
        values,
        horizon,
        alpha,
    )

    correction_factor = 1.0 - (alpha / 2.0)

    return np.maximum(
        croston_prediction * correction_factor,
        0.0,
    )


def tsb_forecast(
    y_train,
    horizon: int,
    alpha: float = 0.1,
    beta: float = 0.1,
) -> np.ndarray:
    """
    Teunter-Syntetos-Babai method.

    alpha: smoothing parameter untuk demand size.
    beta: smoothing parameter untuk demand occurrence probability.

    Probability diperbarui setiap periode, termasuk ketika
    demand bernilai nol.
    """

    values = _validate_input(y_train, horizon)

    alpha = _validate_alpha(alpha, "alpha")
    beta = _validate_alpha(beta, "beta")

    occurrence = (values > 0).astype(float)
    nonzero_indices = np.flatnonzero(values > 0)

    if len(nonzero_indices) == 0:
        return _constant_forecast(0.0, horizon)

    # Inisialisasi berdasarkan histori training.
    probability = float(np.mean(occurrence))
    demand_size = float(np.mean(values[values > 0]))

    for index, demand in enumerate(values):
        event = occurrence[index]

        # Update probabilitas pada setiap periode.
        probability += beta * (event - probability)

        # Update demand size hanya jika ada demand positif.
        if event > 0:
            demand_size += alpha * (demand - demand_size)

    forecast = probability * demand_size

    return _constant_forecast(forecast, horizon)
