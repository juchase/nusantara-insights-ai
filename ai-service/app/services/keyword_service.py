# app/services/keyword_service.py

from app.utils.db import SessionLocal
from sqlalchemy import text
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory
import re

factory = StopWordRemoverFactory()
SASTRAWI_STOPWORDS = set(factory.get_stop_words())

CUSTOM_STOPWORDS = {
    # slang positif — bukan keluhan
    "joss", "spesial", "mantap", "mantul", "top", "sip", "jos",
    "puas", "keren", "oke", "okay", "siap", "setuju",
    "terjangkau", "autentik", "original", "asli", "rapi",
    "harum", "wangi", "lezat", "nikmat", "gurih",

    # kata deskripsi produk — terlalu generik
    "cemilan", "camilan", "makanan", "minuman", "kopi", "teh",
    "produk", "barang", "item", "beli", "dapat",

    # kata dengan sufiks yang tidak bermakna sebagai keluhan
    "harganya", "aromanya", "rasanya", "baunya", "isinya",
    "kemasannya", "pelayanannya", "tampilannya",

    # kata umum yang lolos Sastrawi
    "recommended", "recommend", "good", "great", "nice",
    "best", "worst", "love", "like", "hate", "fine", "well",
    "thanks", "thank", "terimakasih", "makasih",

    # kata opini netral
    "standar", "biasa", "hambar", "teliti",
}

STOPWORDS = SASTRAWI_STOPWORDS | CUSTOM_STOPWORDS

# Keyword yang dianggap valid sebagai keluhan UMKM
VALID_COMPLAINT_KEYWORDS = {
    "pengiriman", "kualitas", "harga", "kemasan", "pelayanan",
    "expired", "bocor", "tumpah", "plastik", "rusak", "cacat",
    "lambat", "lama", "mahal", "apek", "basi", "kotor", "lecet",
    "pecah", "retak", "penyok", "basah", "robek", "kurang",
    "salah", "tidak_sesuai", "palsu", "tiruan", "berbeda",
}

def extract_keywords(text: str) -> list[str]:
    words = re.sub(r'[^a-zA-Z\s]', '', text.lower()).split()
    return [
        w for w in words
        if len(w) > 3 and w not in STOPWORDS
    ]

def update_keyword_summary(product_id: str):
    db = SessionLocal()
    try:
        rows = db.execute(text("""
            SELECT "reviewText" FROM "Review"
            WHERE "productId" = :product_id
        """), {"product_id": product_id}).fetchall()

        word_count: dict[str, int] = {}
        for row in rows:
            words = extract_keywords(row[0])
            for word in words:
                # ✅ Normalize di sini sebelum masuk dict
                normalized = word.lower().strip()
                word_count[normalized] = word_count.get(normalized, 0) + 1

        if not word_count:
            print(f"⚠ Tidak ada keyword untuk produk {product_id}")
            return

        # Prioritaskan keyword yang ada di VALID_COMPLAINT_KEYWORDS
        # Sisanya tetap masuk tapi di belakang
        def sort_key(item):
            word, count = item
            priority = 0 if word in VALID_COMPLAINT_KEYWORDS else 1
            return (priority, -count)

        top_words = sorted(word_count.items(), key=sort_key)[:20]

        db.execute(text("""
            DELETE FROM "KeywordSummary"
            WHERE "productId" = :product_id
        """), {"product_id": product_id})

        # ✅ Loop yang benar — word sudah normalized dari dict
        for word, count in top_words:
            db.execute(text("""
                INSERT INTO "KeywordSummary" (id, "productId", word, count)
                VALUES (gen_random_uuid(), :product_id, :word, :count)
            """), {
                "product_id": product_id,
                "word": word,
                "count": count
            })

        db.commit()
        print(f"✅ Keyword updated untuk produk {product_id}: {[w for w, _ in top_words[:5]]}")

    except Exception as e:
        db.rollback()
        print(f"🔥 Keyword update error: {e}")
    finally:
        db.close()

def update_all_products():
    db = SessionLocal()
    try:
        product_ids = db.execute(text("""
            SELECT DISTINCT "productId" FROM "Review"
        """)).fetchall()

        print(f"🔄 Update keyword untuk {len(product_ids)} produk...")
        for (product_id,) in product_ids:
            update_keyword_summary(product_id)
        print("✅ Semua keyword berhasil diupdate")
    finally:
        db.close()