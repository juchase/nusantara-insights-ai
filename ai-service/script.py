"""
prepare_datasets.py
====================
Script preprocessing dataset untuk NusantaraInsights AI
Mengubah PRDECT-ID dan FMCG 2022-2024 ke skema yang ditetapkan di Bab 3.

Jalankan:
    python prepare_datasets.py

Output:
    output/ulasan_nusantara.csv   → siap untuk Sentiment Analysis
    output/penjualan_nusantara.csv → siap untuk Demand Forecasting
"""

import pandas as pd
import os

# ─── KONFIGURASI PATH (OTOMATIS DAN ANTI-EROR) ───────────────────────────────
# Mengunci direktori dasar tempat file prepare_datasets.py ini berada
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_ULASAN    = os.path.join(BASE_DIR, "PRDECT-ID_Dataset.csv")
INPUT_PENJUALAN = os.path.join(BASE_DIR, "FMCG_2022_2024.csv")
OUTPUT_DIR      = os.path.join(BASE_DIR, "output")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# BAGIAN 1 — DATASET ULASAN (PRDECT-ID)
# ─────────────────────────────────────────────────────────────────────────────
print("=" * 60)
print("MEMPROSES DATASET ULASAN (PRDECT-ID)")
print("=" * 60)

df_ulasan = pd.read_csv(INPUT_ULASAN)

print(f"  Jumlah baris awal   : {len(df_ulasan):,}")
print(f"  Kolom asal          : {list(df_ulasan.columns)}")
print(f"  Distribusi Sentiment: {df_ulasan['Sentiment'].value_counts().to_dict()}")

# 1. Rename kolom ke skema NusantaraInsights AI
df_ulasan = df_ulasan.rename(columns={
    "Customer Review"   : "review_text",
    "Customer Rating"   : "star_rating",
    "Sentiment"         : "sentiment_label",
    "Category"          : "product_category",
    "Product Name"      : "product_name",
})

# 2. Tambah review_id sebagai primary key
df_ulasan.insert(0, "review_id", range(1, len(df_ulasan) + 1))

# 3. Normalkan label sentimen ke huruf kecil (positif/negatif)
#    PRDECT-ID hanya punya Positive/Negative, tidak ada Neutral
df_ulasan["sentiment_label"] = df_ulasan["sentiment_label"].str.lower()

# 4. Tambah kolom netral dummy untuk ulasan dengan rating 3
#    (PRDECT-ID tidak punya label Neutral, kita derive dari star_rating)
mask_netral = df_ulasan["star_rating"] == 3
df_ulasan.loc[mask_netral, "sentiment_label"] = "netral"
print(f"\n  Baris diubah ke Netral (star_rating=3): {mask_netral.sum()}")

# 5. Pilih dan urutkan kolom sesuai skema Bab 3
kolom_output_ulasan = [
    "review_id",
    "product_category",
    "product_name",
    "review_text",
    "star_rating",
    "sentiment_label",
]
df_ulasan_out = df_ulasan[kolom_output_ulasan]

# 6. Simpan
path_ulasan = os.path.join(OUTPUT_DIR, "ulasan_nusantara.csv")
df_ulasan_out.to_csv(path_ulasan, index=False, encoding="utf-8-sig")

print(f"\n  Distribusi final sentiment_label:")
print(df_ulasan_out["sentiment_label"].value_counts().to_string(dtype=False))
print(f"\n  Contoh 3 baris pertama:")
print(df_ulasan_out.head(3).to_string(index=False))
print(f"\n✅ Disimpan ke: {path_ulasan} ({len(df_ulasan_out):,} baris)")


# ─────────────────────────────────────────────────────────────────────────────
# BAGIAN 2 — DATASET PENJUALAN (FMCG 2022-2024)
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("MEMPROSES DATASET PENJUALAN (FMCG 2022-2024)")
print("=" * 60)

df_penjualan = pd.read_csv(INPUT_PENJUALAN)

print(f"  Jumlah baris awal   : {len(df_penjualan):,}")
print(f"  Kolom asal          : {list(df_penjualan.columns)}")
print(f"  Rentang tanggal     : {df_penjualan['date'].min()} s/d {df_penjualan['date'].max()}")
print(f"  Jumlah SKU unik     : {df_penjualan['sku'].nunique()}")

# 1. Rename kolom ke skema NusantaraInsights AI
df_penjualan = df_penjualan.rename(columns={
    "date"            : "date",
    "sku"             : "product_id",
    "price_unit"      : "unit_price",
    "promotion_flag"  : "promotion_flag",
    "stock_available" : "stock_level",
    "units_sold"      : "units_sold",
})

# 2. Tambah transaction_id sebagai primary key
df_penjualan.insert(0, "transaction_id", range(1, len(df_penjualan) + 1))

# 3. Pastikan format tanggal konsisten (YYYY-MM-DD)
df_penjualan["date"] = pd.to_datetime(df_penjualan["date"]).dt.strftime("%Y-%m-%d")

# 4. Pilih dan urutkan kolom sesuai skema Bab 3
kolom_output_penjualan = [
    "transaction_id",
    "date",
    "product_id",
    "units_sold",
    "unit_price",
    "promotion_flag",
    "stock_level",
]
df_penjualan_out = df_penjualan[kolom_output_penjualan]

# 5. Simpan
path_penjualan = os.path.join(OUTPUT_DIR, "penjualan_nusantara.csv")
df_penjualan_out.to_csv(path_penjualan, index=False, encoding="utf-8-sig")

print(f"\n  Rentang promotion_flag: {df_penjualan_out['promotion_flag'].unique()}")
print(f"  Rentang units_sold    : {df_penjualan_out['units_sold'].min()} - {df_penjualan_out['units_sold'].max()}")
print(f"  Rentang unit_price    : {df_penjualan_out['unit_price'].min()} - {df_penjualan_out['unit_price'].max()}")
print(f"\n  Contoh 3 baris pertama:")
print(df_penjualan_out.head(3).to_string(index=False))
print(f"\n✅ Disimpan ke: {path_penjualan} ({len(df_penjualan_out):,} baris)")


# ─────────────────────────────────────────────────────────────────────────────
# RINGKASAN AKHIR
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("RINGKASAN OUTPUT")
print("=" * 60)
print(f"  1. {path_ulasan}")
print(f"     {len(df_ulasan_out):,} baris ulasan | kolom: {list(df_ulasan_out.columns)}")
print(f"  2. {path_penjualan}")
print(f"     {len(df_penjualan_out):,} baris transaksi | kolom: {list(df_penjualan_out.columns)}")
print("\nKedua file siap diupload ke platform NusantaraInsights AI.")