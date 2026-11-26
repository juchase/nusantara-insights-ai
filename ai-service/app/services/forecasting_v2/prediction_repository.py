
from datetime import timedelta

import numpy as np
import pandas as pd
from sqlalchemy import text
from uuid import uuid4


def get_daily_sales_history(db, product_id: str) -> pd.DataFrame:
    """
    Mengambil histori penjualan dan mengagregasikannya per tanggal.

    Tanggal tanpa transaksi akan diisi nol pada tahap preprocessing.
    """

    if not product_id or not product_id.strip():
        raise ValueError("product_id tidak boleh kosong.")

    query = text("""
        SELECT
            DATE("date") AS ds,
            SUM(quantity) AS y
        FROM "Sales"
        WHERE "productId" = :product_id
        GROUP BY DATE("date")
        ORDER BY DATE("date")
    """)

    rows = db.execute(
        query,
        {"product_id": product_id},
    ).fetchall()

    if not rows:
        return pd.DataFrame(columns=["ds", "y"])

    df = pd.DataFrame(rows, columns=["ds", "y"])

    return prepare_daily_history(df)


def prepare_daily_history(df: pd.DataFrame) -> pd.DataFrame:
    """
    Membersihkan histori dan membuat kalender harian lengkap.

    Nol berarti tidak ada penjualan yang tercatat,
    bukan bukti ketersediaan stok.
    """

    required_columns = {"ds", "y"}

    if not required_columns.issubset(df.columns):
        raise ValueError("Data harus memiliki kolom ds dan y.")

    if df.empty:
        return pd.DataFrame(columns=["ds", "y"])

    data = df.copy()

    data["ds"] = pd.to_datetime(
        data["ds"],
        errors="coerce",
    ).dt.normalize()

    data["y"] = pd.to_numeric(
        data["y"],
        errors="coerce",
    )

    data = data.dropna(subset=["ds", "y"])

    data["y"] = data["y"].clip(lower=0)

    daily = (
        data.groupby("ds")["y"]
        .sum()
        .sort_index()
    )

    calendar = pd.date_range(
        start=daily.index.min(),
        end=daily.index.max(),
        freq="D",
    )

    daily = daily.reindex(calendar, fill_value=0)

    result = daily.rename_axis("ds").reset_index()

    result["y"] = result["y"].astype(float)

    return result


def aggregate_weekly_history(
    daily_history: pd.DataFrame,
) -> pd.DataFrame:
    """
    Mengubah histori harian menjadi mingguan.

    Menggunakan W-MON agar konsisten dengan service lama.
    """

    if not {"ds", "y"}.issubset(daily_history.columns):
        raise ValueError("Data harian harus memiliki kolom ds dan y.")

    if daily_history.empty:
        return pd.DataFrame(columns=["ds", "y"])

    data = daily_history.copy()

    data["ds"] = pd.to_datetime(data["ds"], errors="coerce")
    data["y"] = pd.to_numeric(data["y"], errors="coerce")

    data = data.dropna(subset=["ds", "y"])

    if data.empty:
        return pd.DataFrame(columns=["ds", "y"])

    weekly = (
        data.set_index("ds")["y"]
        .resample("W-MON")
        .sum()
        .rename_axis("ds")
        .reset_index()
    )

    return weekly


def build_forecast_dates(
    last_history_date,
    frequency: str,
    horizon: int,
) -> list:
    """
    Membuat tanggal untuk periode forecast berikutnya.
    """

    if frequency not in {"D", "W"}:
        raise ValueError(f"Frequency tidak didukung: {frequency}")

    if horizon < 1:
        raise ValueError("Horizon minimal 1.")

    last_date = pd.Timestamp(last_history_date).normalize()

    if pd.isna(last_date):
        raise ValueError("Tanggal histori terakhir tidak valid.")

    if frequency == "D":
        start_date = last_date + timedelta(days=1)
        freq = "D"
    else:
        start_date = last_date + timedelta(weeks=1)
        freq = "W-MON"

    dates = pd.date_range(
        start=start_date,
        periods=horizon,
        freq=freq,
    )

    return [date.date() for date in dates]



def save_predictions(
    db,
    product_id: str,
    forecast_dates: list,
    forecast_values,
    model_version: str,
    frequency: str,
    upper_bounds=None,
    lower_bounds=None,
) -> int:
    """
    Mengganti prediksi sebelumnya berdasarkan product dan frequency.

    Transaction commit/rollback dikelola oleh pemanggil.
    """

    # 1. Validasi input
    if not isinstance(product_id, str) or not product_id.strip():
        raise ValueError("product_id tidak boleh kosong.")

    if not isinstance(model_version, str) or not model_version.strip():
        raise ValueError("model_version tidak boleh kosong.")

    if frequency not in {"D", "W"}:
        raise ValueError("Frequency harus D atau W.")

    values = np.asarray(forecast_values, dtype=float)

    if values.ndim != 1 or len(values) == 0:
        raise ValueError("Forecast harus berupa array satu dimensi.")

    if not np.isfinite(values).all():
        raise ValueError("Forecast mengandung NaN atau infinity.")

    if (values < 0).any():
        raise ValueError("Forecast tidak boleh negatif.")

    if len(forecast_dates) != len(values):
        raise ValueError("Jumlah tanggal dan forecast tidak sama.")

    # 2. Validasi prediction bounds
    if upper_bounds is None:
        upper_bounds = values

    if lower_bounds is None:
        lower_bounds = values

    upper = np.asarray(upper_bounds, dtype=float)
    lower = np.asarray(lower_bounds, dtype=float)

    if upper.ndim != 1 or lower.ndim != 1:
        raise ValueError("Prediction bounds harus satu dimensi.")

    if len(upper) != len(values) or len(lower) != len(values):
        raise ValueError("Jumlah prediction bounds tidak sesuai.")

    if not np.isfinite(upper).all() or not np.isfinite(lower).all():
        raise ValueError("Prediction bounds mengandung nilai tidak valid.")

    if (lower < 0).any() or (upper < 0).any():
        raise ValueError("Prediction bounds tidak boleh negatif.")

    if (lower > values).any() or (upper < values).any():
        raise ValueError("Prediction bounds tidak mencakup forecast.")

    # 3. Siapkan records untuk INSERT
    records = []

    for forecast_date, value, upper_value, lower_value in zip(
        forecast_dates,
        values,
        upper,
        lower,
    ):
        records.append({
            "id": str(uuid4()),
            "product_id": product_id,
            "pred_date": forecast_date,
            "pred_value": int(round(value)),
            "pred_upper": int(round(upper_value)),
            "pred_lower": int(round(lower_value)),
            "model_version": model_version,
            "frequency": frequency,
        })

    # 4. Hapus prediksi lama hanya untuk frequency yang sama
    db.execute(
        text("""
            DELETE FROM "Prediction"
            WHERE "productId" = :product_id
              AND "freq" = :frequency
        """),
        {
            "product_id": product_id,
            "frequency": frequency,
        },
    )

    # 5. Simpan prediksi baru
    db.execute(
        text("""
            INSERT INTO "Prediction" (
                "id",
                "productId",
                "predictionDate",
                "predictedSales",
                "upperBound",
                "lowerBound",
                "createdAt",
                "modelVersion",
                "freq"
            )
            VALUES (
                :id,
                :product_id,
                :pred_date,
                :pred_value,
                :pred_upper,
                :pred_lower,
                NOW(),
                :model_version,
                :frequency
            )
        """),
        records,
    )

    return len(records)
