
import numpy as np


def _validate_arrays(y_true, y_pred):
    actual = np.asarray(y_true, dtype=float)
    predicted = np.asarray(y_pred, dtype=float)

    if actual.ndim != 1 or predicted.ndim != 1:
        raise ValueError("y_true dan y_pred harus satu dimensi.")

    if len(actual) == 0:
        raise ValueError("Data evaluasi tidak boleh kosong.")

    if len(actual) != len(predicted):
        raise ValueError(
            "Panjang y_true dan y_pred harus sama."
        )

    if not np.isfinite(actual).all():
        raise ValueError("y_true mengandung NaN atau infinity.")

    if not np.isfinite(predicted).all():
        raise ValueError("y_pred mengandung NaN atau infinity.")

    if (actual < 0).any() or (predicted < 0).any():
        raise ValueError("Demand aktual dan prediksi tidak boleh negatif.")

    return actual, predicted


def calculate_mae(y_true, y_pred) -> float:
    """Mean Absolute Error."""
    actual, predicted = _validate_arrays(y_true, y_pred)

    return float(np.mean(np.abs(actual - predicted)))


def calculate_rmse(y_true, y_pred) -> float:
    """Root Mean Squared Error."""
    actual, predicted = _validate_arrays(y_true, y_pred)

    return float(np.sqrt(np.mean((actual - predicted) ** 2)))


def calculate_wape(y_true, y_pred) -> float | None:
    """
    Weighted Absolute Percentage Error.

    Mengembalikan None jika total aktual = 0 karena
    WAPE tidak terdefinisi pada kondisi tersebut.
    """
    actual, predicted = _validate_arrays(y_true, y_pred)

    denominator = np.sum(actual)

    if denominator == 0:
        return None

    numerator = np.sum(np.abs(actual - predicted))

    return float((numerator / denominator) * 100)


def evaluate_forecast(y_true, y_pred) -> dict:
    """Menghitung seluruh metrik evaluasi."""
    actual, predicted = _validate_arrays(y_true, y_pred)

    return {
        "mae": calculate_mae(actual, predicted),
        "rmse": calculate_rmse(actual, predicted),
        "wape": calculate_wape(actual, predicted),
    }
