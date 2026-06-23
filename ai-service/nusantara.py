import pandas as pd
import numpy as np
import os

# Path dataset asli
base_path = r"C:\Users\user\Desktop\skripsi\nusantara_insights_ai\ai-service\olist_dataset"
df = pd.read_csv(os.path.join(base_path, "tokopedia_product_reviews_2025.csv"))

# --- 1. Disambiguasi produk dengan nama sama ---
df["product"] = df["product_name"] + " | " + df["shop_id"].astype(str)

# --- 2. Generate sales sintetis ---
def generate_sales(row):
    product_reviews = df[df["product"] == row["product"]]["review_date"]
    if product_reviews.empty:
        return None
    
    min_date, max_date = product_reviews.min(), product_reviews.max()
    date_range = pd.date_range(min_date, max_date, freq="D")
    
    total_sales = row["sold_count"]
    daily_sales = np.random.multinomial(total_sales, [1/len(date_range)]*len(date_range))
    
    sales_df = pd.DataFrame({
        "product": row["product"],
        "date": date_range,
        "sales": daily_sales
    })
    return sales_df   # fungsi selesai di sini

# --- 3. Buat sales_df di luar fungsi ---
sales_data = []
for _, row in df.drop_duplicates("product")[["product","sold_count"]].iterrows():
    s = generate_sales(row)
    if s is not None:
        sales_data.append(s)

# ⬇️ Perhatikan: baris ini sejajar dengan for, bukan menjorok
sales_df = pd.concat(sales_data, ignore_index=True)

# --- 4. Gabungkan dengan review & rating ---
final_df = df.merge(
    sales_df,
    left_on=["product","review_date"],
    right_on=["product","date"],
    how="left"
)

final_df = final_df.rename(columns={
    "review_text": "reviewtext",
    "review_score": "rating",
    "review_date": "date"
})

final_df = final_df[["product","reviewtext","rating","date","sales"]]

# --- 5. Split jadi 5 file CSV ---
unique_products = final_df["product"].unique()
chunks = np.array_split(unique_products, 5)

output_dir = os.path.join(base_path, "nusantarainsights_split")
os.makedirs(output_dir, exist_ok=True)

for i, chunk in enumerate(chunks, start=1):
    chunk_df = final_df[final_df["product"].isin(chunk)]
    chunk_df.to_csv(os.path.join(output_dir, f"nusantarainsights_part{i}.csv"), index=False)

print("✅ Berhasil membuat 5 file CSV di folder:", output_dir)
