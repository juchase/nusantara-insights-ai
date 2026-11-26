
from dataclasses import dataclass

import pandas as pd


@dataclass
class TemporalSplit:
    train: pd.DataFrame
    validation: pd.DataFrame
    test: pd.DataFrame
    metadata: dict


def split_chronologically(
    data: pd.DataFrame,
    date_col: str = "ds",
    train_ratio: float = 0.60,
    validation_ratio: float = 0.20,
    min_train_size: int = 1,
) -> TemporalSplit:
    """
    Split time-series data chronologically using shared date boundaries.

    Split is based on unique dates, not row counts.
    All products use the same calendar boundaries.
    """

    if data.empty:
        raise ValueError("Dataset kosong.")

    if date_col not in data.columns:
        raise ValueError(
            f"Kolom tanggal '{date_col}' tidak ditemukan."
        )

    if (
        not isinstance(min_train_size, int)
        or isinstance(min_train_size, bool)
        or min_train_size < 1
    ):
        raise ValueError(
            "min_train_size harus integer >= 1."
        )

    if not 0 < train_ratio < 1:
        raise ValueError(
            "train_ratio harus berada antara 0 dan 1."
        )

    if not 0 < validation_ratio < 1:
        raise ValueError(
            "validation_ratio harus berada antara 0 dan 1."
        )

    if train_ratio + validation_ratio >= 1:
        raise ValueError(
            "train_ratio + validation_ratio harus kurang dari 1."
        )

    result = data.copy()

    result[date_col] = pd.to_datetime(
        result[date_col],
        errors="coerce",
    )

    if result[date_col].isna().any():
        raise ValueError(
            f"Ditemukan tanggal kosong atau tidak valid pada {date_col}."
        )

    unique_dates = pd.Index(
        result[date_col].drop_duplicates().sort_values()
    )

    total_dates = len(unique_dates)

    if total_dates < 3:
        raise ValueError(
            "Minimal diperlukan tiga tanggal unik."
        )

    train_end_idx = int(total_dates * train_ratio)

    validation_end_idx = int(
        total_dates * (train_ratio + validation_ratio)
    )

    test_start_idx = validation_end_idx

    if train_end_idx < min_train_size:
        raise ValueError(
            f"Data train hanya memiliki {train_end_idx} tanggal, "
            f"minimum {min_train_size}."
        )

    if (
        validation_end_idx <= train_end_idx
        or test_start_idx >= total_dates
    ):
        raise ValueError(
            "Hasil pembagian tidak valid. "
            "Periksa jumlah tanggal dan rasio split."
        )

    train_dates = unique_dates[:train_end_idx]
    validation_dates = unique_dates[
        train_end_idx:validation_end_idx
    ]
    test_dates = unique_dates[validation_end_idx:]

    train = result[
        result[date_col].isin(train_dates)
    ].copy()

    validation = result[
        result[date_col].isin(validation_dates)
    ].copy()

    test = result[
        result[date_col].isin(test_dates)
    ].copy()

    train = train.sort_values(
        date_col
    ).reset_index(drop=True)

    validation = validation.sort_values(
        date_col
    ).reset_index(drop=True)

    test = test.sort_values(
        date_col
    ).reset_index(drop=True)

    train_max = train[date_col].max()
    validation_min = validation[date_col].min()
    validation_max = validation[date_col].max()
    test_min = test[date_col].min()

    if not train_max < validation_min:
        raise AssertionError(
            "Train dan validation mengalami overlap."
        )

    if not validation_max < test_min:
        raise AssertionError(
            "Validation dan test mengalami overlap."
        )

    metadata = {
        "total_dates": total_dates,
        "train_dates": len(train_dates),
        "validation_dates": len(validation_dates),
        "test_dates": len(test_dates),

        "train_start": train[date_col].min(),
        "train_end": train_max,

        "validation_start": validation_min,
        "validation_end": validation_max,

        "test_start": test_min,
        "test_end": test[date_col].max(),

        "train_rows": len(train),
        "validation_rows": len(validation),
        "test_rows": len(test),

        "train_ratio": train_ratio,
        "validation_ratio": validation_ratio,
        "test_ratio": 1 - train_ratio - validation_ratio,
    }

    return TemporalSplit(
        train=train,
        validation=validation,
        test=test,
        metadata=metadata,
    )
