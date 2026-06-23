import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.db import SessionLocal
from sqlalchemy import text
import json
from datetime import datetime

def get_all_reviews_with_sentiment():
    db = SessionLocal()
    try:
        rows = db.execute(text("""
            SELECT 
                p.id AS product_id,
                p.name AS product_name,
                r.id AS review_id,
                r."reviewText",
                r.sentiment,
                r.rating,
                r."reviewDate"
            FROM "Review" r
            JOIN "Product" p ON p.id = r."productId"
            ORDER BY p.name, r."reviewDate" DESC
        """)).fetchall()
        
        products = {}
        for row in rows:
            product_id = row[0]
            if product_id not in products:
                products[product_id] = {
                    "product_name": row[1],
                    "product_id": product_id,
                    "reviews": []
                }
            products[product_id]["reviews"].append({
                "review_id": row[2],
                "reviewText": row[3],
                "sentiment": row[4],
                "rating": row[5],
                "reviewDate": str(row[6]) if row[6] else None
            })
        return products
    finally:
        db.close()

def export_reviews_to_file():
    products = get_all_reviews_with_sentiment()
    
    # Export ke JSON
    with open("all_reviews_export.json", "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    
    # Export ke CSV
    with open("all_reviews_export.csv", "w", encoding="utf-8") as f:
        f.write("product_id,product_name,reviewText,sentiment,rating,reviewDate\n")
        for pid, data in products.items():
            for review in data["reviews"]:
                text = review["reviewText"].replace('"', '""').replace('\n', ' ')
                f.write(f"{pid},{data['product_name']},\"{text}\",{review['sentiment']},{review['rating']},{review['reviewDate']}\n")
    
    print(f"✅ Data diekspor ke all_reviews_export.json dan all_reviews_export.csv")
    print(f"   Total produk: {len(products)}")
    total = sum(len(p["reviews"]) for p in products.values())
    print(f"   Total ulasan: {total}")

if __name__ == "__main__":
    export_reviews_to_file()