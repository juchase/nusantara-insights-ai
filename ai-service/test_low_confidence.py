import sys
from sqlalchemy import text
from app.utils.db import SessionLocal
from rebuild_user import generate_insight_for_product, update_keyword_summary

def get_lowest_confidence_products(user_id: str, limit: int = 10):
    db = SessionLocal()
    try:
        rows = db.execute(text("""
            SELECT i."productId", p.name, i.confidence
            FROM "Insight" i
            JOIN "Product" p ON i."productId" = p.id
            WHERE p."userId" = :user_id
            ORDER BY i.confidence ASC
            LIMIT :limit
        """), {"user_id": user_id, "limit": limit}).fetchall()
        return rows
    finally:
        db.close()

def test_low_confidence(user_id: str):
    products = get_lowest_confidence_products(user_id, limit=10)
    if not products:
        print("⚠️ Tidak ada produk ditemukan.")
        return

    print(f"\n🚀 Memulai rebuild khusus untuk {len(products)} produk dengan confidence terendah milik user {user_id}...\n")

    db = SessionLocal()
    try:
        for idx, (pid, name, conf) in enumerate(products):
            print(f"\n{'='*60}")
            print(f"📦 [{idx+1}/{len(products)}] {name} (Confidence: {conf}%)")
            print(f"{'='*60}")
            update_keyword_summary(pid)
            result = generate_insight_for_product(pid, db)
            if result["status"] == "ok":
                print(f"✅ Berhasil memperbarui insight untuk {name}")
            else:
                print(f"❌ Gagal memperbarui insight untuk {name}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_low_confidence.py <user_id>")
        sys.exit(1)
    user_id = sys.argv[1]
    test_low_confidence(user_id)