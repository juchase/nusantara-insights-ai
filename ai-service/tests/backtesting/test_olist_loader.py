
from app.services.backtesting.data_loader import load_all_sales

df = load_all_sales()

print("\n=== OLIST DATA LOADER ===")
print("Total sales records:", len(df))
print("Unique products:", df["product_id"].nunique())
print("Total quantity:", df["y"].sum())
print("Date range:", df["ds"].min(), "to", df["ds"].max())

print("\n=== SAMPLE ===")
print(df.head())

print("\n=== PRODUCT SUMMARY ===")
print(
    df.groupby("product_id")["y"]
    .agg(["count", "sum", "min", "max"])
    .head(10)
)
