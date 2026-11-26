
from pathlib import Path

import pandas as pd


DATASET_PATH = (
    Path(__file__).resolve().parents[3]
    / "data"
    / "olist_dataset_final.csv"
)


def load_all_sales() -> pd.DataFrame:
    """
    Load transaksi penjualan dari dataset Olist.

    Baris review tidak digunakan karena kolom sales bernilai kosong.
    Identitas produk menggunakan product hash dari dataset asli.
    """

    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Dataset tidak ditemukan: {DATASET_PATH}"
        )

    df = pd.read_csv(DATASET_PATH)

    required_columns = {"product", "date", "sales"}
    missing_columns = required_columns - set(df.columns)

    if missing_columns:
        raise ValueError(
            f"Kolom dataset tidak lengkap: {sorted(missing_columns)}"
        )

    # Ambil hanya baris transaksi Sales.
    sales_df = df.loc[
        df["sales"].notna(),
        ["product", "date", "sales"]
    ].copy()

    sales_df = sales_df.rename(
        columns={
            "product": "product_id",
            "date": "ds",
            "sales": "y",
        }
    )

    sales_df["ds"] = pd.to_datetime(
        sales_df["ds"],
        errors="coerce"
    ).dt.normalize()

    sales_df["y"] = pd.to_numeric(
        sales_df["y"],
        errors="coerce"
    )

    sales_df = sales_df.dropna(
        subset=["product_id", "ds", "y"]
    )

    if sales_df.empty:
        raise ValueError("Tidak ditemukan transaksi Sales yang valid.")

    if (sales_df["y"] < 0).any():
        raise ValueError(
            "Ditemukan quantity negatif dalam dataset."
        )

    sales_df["product_id"] = (
        sales_df["product_id"].astype(str).str.strip()
    )

    if sales_df["product_id"].eq("").any():
        raise ValueError("Ditemukan product ID kosong.")

    return sales_df.sort_values(
        ["product_id", "ds"]
    ).reset_index(drop=True)
