
import numpy as np


def calculate_intermittency(y) -> dict:
    """
    Menghitung Average Demand Interval (ADI) dan CV squared.

    ADI:
        Total periode / jumlah periode dengan demand positif.

    CV²:
        Variance demand positif / mean demand positif squared.
    """

    values = np.asarray(y, dtype=float)

    if values.ndim != 1 or len(values) == 0:
        raise ValueError("Data harus berupa array satu dimensi dan tidak kosong.")

    if not np.isfinite(values).all():
        raise ValueError("Data mengandung NaN atau infinity.")

    if (values < 0).any():
        raise ValueError("Demand tidak boleh negatif.")

    positive_demand = values[values > 0]
    nonzero_periods = len(positive_demand)

    if nonzero_periods == 0:
        return {
            "adi": None,
            "cv2": None,
            "demand_pattern": "no_demand",
            "nonzero_periods": 0,
            "zero_periods": len(values),
        }

    adi = len(values) / nonzero_periods

    mean_demand = float(np.mean(positive_demand))

    if mean_demand == 0:
        cv2 = None
    else:
        cv2 = float(
            (np.std(positive_demand, ddof=0) / mean_demand) ** 2
        )

    # Klasifikasi konvensional Syntetos-Boylan.
    if cv2 is None:
        pattern = "unknown"
    elif adi < 1.32 and cv2 < 0.49:
        pattern = "smooth"
    elif adi >= 1.32 and cv2 < 0.49:
        pattern = "intermittent"
    elif adi < 1.32 and cv2 >= 0.49:
        pattern = "erratic"
    else:
        pattern = "lumpy"

    return {
        "adi": float(adi),
        "cv2": cv2,
        "demand_pattern": pattern,
        "nonzero_periods": nonzero_periods,
        "zero_periods": len(values) - nonzero_periods,
    }
