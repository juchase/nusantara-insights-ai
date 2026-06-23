"""
prepare_tokopedia_dataset.py
=============================
Menyesuaikan dataset tokopedia_product_reviews_2025.csv ke skema upload
NusantaraInsights AI: product, reviewtext, rating, date, sales

Lalu membagi hasilnya menjadi 5 batch CSV agar bisa diupload satu per satu
secara manual (menghindari pipeline AI sequential yang berjalan lama
jika semua produk diupload sekaligus).

Jalankan:
    python prepare_tokopedia_dataset.py

Output:
    output/nusantara_batch_1.csv
    output/nusantara_batch_2.csv
    output/nusantara_batch_3.csv
    output/nusantara_batch_4.csv
    output/nusantara_batch_5.csv
    output/ringkasan_batch.csv   -> daftar produk per batch utk referensi
"""

import pandas as pd
import numpy as np
import os
import html

# ─── KONFIGURASI ──────────────────────────────────────────────────────────────
INPUT_FILE       = "tokopedia/tokopedia_product_reviews_2025.csv"
OUTPUT_DIR       = "tokopedia/outputs"
MIN_REVIEWS      = 20      # ambang minimal ulasan per produk agar terpilih
N_BATCH          = 5       # jumlah file split
SALES_WINDOW_DAYS = 90     # rentang hari time series sales yang digenerate
RANDOM_SEED      = 42

np.random.seed(RANDOM_SEED)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── 1. BACA DATASET ──────────────────────────────────────────────────────────
print("=" * 60)
print("MEMBACA DATASET TOKOPEDIA")
print("=" * 60)

df = pd.read_csv(INPUT_FILE)
print(f"  Jumlah baris awal     : {len(df):,}")
print(f"  Jumlah produk unik    : {df['product_name'].nunique():,}")

# ─── 2. FILTER PRODUK DENGAN ULASAN >= MIN_REVIEWS ───────────────────────────
review_counts = df["product_name"].value_counts()
selected_products = review_counts[review_counts >= MIN_REVIEWS].index

df = df[df["product_name"].isin(selected_products)].copy()
print(f"\n  Produk terpilih (>= {MIN_REVIEWS} ulasan): {len(selected_products):,}")
print(f"  Total baris ulasan setelah filter      : {len(df):,}")

# ─── 3. PARSE TANGGAL ─────────────────────────────────────────────────────────
df["review_date"] = pd.to_datetime(df["review_date"], errors="coerce")
df = df.dropna(subset=["review_date"])

# ─── 4. RENAME KOLOM KE SKEMA UPLOAD NUSANTARAINSIGHTS AI ────────────────────
#    Skema target (case-insensitive, dibaca oleh upload-dataset/route.ts):
#    product, reviewtext, rating, date
df_out = df.rename(columns={
    "product_name": "product",
    "review_text":  "reviewtext",
    "rating":       "rating",
    "review_date":  "date",
})

# Bersihkan HTML entity (&amp; -> &, &lt; -> <, dst) yang muncul di data asli
df_out["reviewtext"] = df_out["reviewtext"].apply(
    lambda x: html.unescape(x) if isinstance(x, str) else x
)
df_out["product"] = df_out["product"].apply(
    lambda x: html.unescape(x) if isinstance(x, str) else x
)

# ─── 5. GENERATE KOLOM "sales" SECARA SINTETIS ───────────────────────────────
# Dataset asli hanya punya sold_count KUMULATIF total per produk, bukan
# time series harian. Kita generate units terjual per HARI per PRODUK dengan
# mendistribusikan sold_count secara proporsional ke rentang tanggal ulasan,
# ditambah noise acak agar polanya tidak datar/linear sempurna (lebih natural
# untuk diuji di Prophet forecasting).
print("\n" + "=" * 60)
print("GENERATE KOLOM 'sales' SINTETIS DARI sold_count")
print("=" * 60)

def generate_daily_sales(group: pd.DataFrame) -> pd.DataFrame:
    """
    Untuk satu produk: buat time series harian untuk 90 HARI TERAKHIR
    (dihitung dari tanggal ulasan terbaru produk tersebut), lalu isi 'sales'
    dengan jumlah unit acak yang rata-rata totalnya proporsional terhadap
    sold_count produk tersebut.

    Catatan: rentang dibatasi 90 hari (bukan dari ulasan pertama) karena
    beberapa produk punya ulasan yang tersebar 3-9 tahun -- membuat time
    series sepanjang itu tidak realistis untuk forecasting UMKM dan akan
    membuat jumlah baris meledak tidak wajar.
    """
    sold_count = float(group["sold_count"].iloc[0])
    end_date   = group["date"].max()
    start_date = end_date - pd.Timedelta(days=SALES_WINDOW_DAYS - 1)

    full_range = pd.date_range(start=start_date, end=end_date, freq="D")
    n_days = len(full_range)

    # Rata-rata unit/hari diturunkan dari sold_count, dibatasi rentang wajar
    # untuk skala UMKM (3 - 150 unit/hari) supaya tidak ekstrem
    avg_daily = np.clip(sold_count / max(n_days, 1), 3, 150)

    # Pola harian: rata-rata + noise Poisson (count data, non-negatif)
    # + sedikit tren musiman mingguan (weekend lebih tinggi)
    weekday_factor = np.where(full_range.dayofweek >= 5, 1.25, 1.0)
    daily_sales = np.random.poisson(lam=avg_daily, size=n_days) * weekday_factor
    daily_sales = np.round(daily_sales).astype(int)
    daily_sales = np.clip(daily_sales, 0, None)

    return pd.DataFrame({
        "date":  full_range,
        "sales": daily_sales,
    })

sales_frames = []
for product_name, group in df_out.groupby("product"):
    daily = generate_daily_sales(group)
    daily["product"] = product_name
    sales_frames.append(daily)

df_sales = pd.concat(sales_frames, ignore_index=True)
print(f"  Baris time series sales digenerate: {len(df_sales):,}")
print(f"  Rentang sales/hari               : {df_sales['sales'].min()} - {df_sales['sales'].max()}")

# ─── 6. GABUNGKAN REVIEW + SALES MENJADI SATU CSV PER PRODUK ─────────────────
# Skema upload NusantaraInsights AI memproses review dan sales dari KOLOM
# YANG SAMA per baris (lihat upload-dataset/route.ts: kolom 'sales' opsional
# di baris yang sama dengan ulasan). Karena review dan sales punya granularitas
# berbeda (review = per kejadian ulasan, sales = per hari per produk), kita
# satukan dengan strategi:
#   - Baris ulasan TETAP membawa reviewtext + rating + date, dan kalau di
#     tanggal itu ada data sales sintetis, tempelkan ke kolom sales-nya.
#   - Tanggal yang punya sales tapi TIDAK ada ulasan pada hari itu dibuatkan
#     baris dummy ulasan ringkas ("-") supaya datanya tetap masuk sebagai
#     baris penjualan (karena baris tanpa reviewtext akan dilewati saat
#     parsing review, tapi tetap diproses untuk kolom sales).
print("\n" + "=" * 60)
print("MENGGABUNGKAN REVIEW + SALES PER PRODUK")
print("=" * 60)

df_out["date_only"] = df_out["date"].dt.date
df_sales["date_only"] = df_sales["date"].dt.date

merged_frames = []
for product_name in df_out["product"].unique():
    rev = df_out[df_out["product"] == product_name].copy()
    sal = df_sales[df_sales["product"] == product_name].copy()
    sold_count = float(rev["sold_count"].iloc[0]) if "sold_count" in rev.columns else 100.0

    rev = rev.sort_values("date")
    sales_by_date = sal.set_index("date_only")["sales"].to_dict()
    used_dates = set()

    # Rata-rata unit/hari produk ini -- dipakai untuk mengisi ulasan yang
    # tanggalnya JATUH DI LUAR window sales 90 hari (ulasan lama), supaya
    # kolom sales tidak pernah kosong untuk satupun baris.
    avg_daily_fallback = int(np.clip(sold_count / SALES_WINDOW_DAYS, 3, 150))

    sales_col = []
    for _, row in rev.iterrows():
        d = row["date_only"]
        if d in sales_by_date and d not in used_dates:
            sales_col.append(int(sales_by_date[d]))
            used_dates.add(d)
        else:
            # Ulasan di luar window 90 hari -> tetap diisi sales sintetis
            # (Poisson di sekitar rata-rata harian produk) agar tidak kosong
            sales_col.append(int(np.random.poisson(lam=avg_daily_fallback)))
    rev["sales"] = sales_col

    # Tanggal dengan sales tapi belum ada ulasan -> buat baris dummy ringkas
    missing_dates = sal[~sal["date_only"].isin(used_dates)]
    if len(missing_dates) > 0:
        dummy = pd.DataFrame({
            "product":    product_name,
            "reviewtext": "-",
            "rating":     3,
            "date":       missing_dates["date"].values,
            "sales":      missing_dates["sales"].values.astype(int),
        })
        rev = pd.concat([rev, dummy], ignore_index=True)

    merged_frames.append(rev)

df_final = pd.concat(merged_frames, ignore_index=True)

# ─── 7. PILIH & URUTKAN KOLOM SESUAI SKEMA UPLOAD ────────────────────────────
kolom_output = ["product", "reviewtext", "rating", "date", "sales"]
df_final = df_final[kolom_output]
df_final["date"] = pd.to_datetime(df_final["date"]).dt.strftime("%Y-%m-%d")
df_final["rating"] = df_final["rating"].fillna(3).astype(int)
# Sales adalah JUMLAH UNIT TERJUAL -> harus integer, bukan float
df_final["sales"] = df_final["sales"].fillna(0).astype(int)
df_final = df_final.sort_values(["product", "date"]).reset_index(drop=True)

print(f"  Total baris final (review + dummy sales) : {len(df_final):,}")
print(f"  Baris dengan reviewtext asli              : {(df_final['reviewtext'] != '-').sum():,}")
print(f"  Baris dummy (sales-only, tanggal tanpa ulasan): {(df_final['reviewtext'] == '-').sum():,}")
print(f"  Baris dengan sales kosong (harus 0)            : {df_final['sales'].isna().sum()}")

# ─── 8. SPLIT MENJADI N_BATCH FILE BERDASARKAN PRODUK ────────────────────────
# Split per PRODUK (bukan per baris) supaya satu produk tidak terpecah
# ke 2 file berbeda -> setiap file tetap konsisten secara time series.
print("\n" + "=" * 60)
print(f"MEMBAGI MENJADI {N_BATCH} BATCH")
print("=" * 60)

unique_products = df_final["product"].unique()
np.random.shuffle(unique_products)
product_batches = np.array_split(unique_products, N_BATCH)

ringkasan = []
for i, batch_products in enumerate(product_batches, start=1):
    batch_df = df_final[df_final["product"].isin(batch_products)].copy()
    out_path = os.path.join(OUTPUT_DIR, f"nusantara_batch_{i}.csv")
    batch_df.to_csv(out_path, index=False, encoding="utf-8-sig")

    n_reviews_real = (batch_df["reviewtext"] != "-").sum()
    print(f"  Batch {i}: {len(batch_products):4d} produk | {len(batch_df):6,} baris "
          f"({n_reviews_real:,} ulasan asli) -> {out_path}")

    for p in batch_products:
        ringkasan.append({"batch": i, "product": p})

# ─── 9. SIMPAN RINGKASAN PRODUK PER BATCH (referensi) ────────────────────────
df_ringkasan = pd.DataFrame(ringkasan)
ringkasan_path = os.path.join(OUTPUT_DIR, "ringkasan_batch.csv")
df_ringkasan.to_csv(ringkasan_path, index=False, encoding="utf-8-sig")

print("\n" + "=" * 60)
print("SELESAI")
print("=" * 60)
print(f"  {N_BATCH} file batch siap diupload satu per satu ke NusantaraInsights AI.")
print(f"  Ringkasan pemetaan produk->batch: {ringkasan_path}")
print(f"\n  Contoh 5 baris pertama batch 1:")
print(pd.read_csv(os.path.join(OUTPUT_DIR, "nusantara_batch_1.csv")).head(5).to_string(index=False))