import re
from sqlalchemy import text
from app.utils.db import SessionLocal
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

factory = StopWordRemoverFactory()
SASTRAWI_STOPWORDS = set(factory.get_stop_words())

CUSTOM_STOPWORDS = {
    # slang positif / penguat rasa — bukan keluhan
    "joss", "spesial", "mantap", "mantul", "top", "sip", "jos",
    "puas", "keren", "oke", "okay", "siap", "setuju",
    "terjangkau", "autentik", "original", "asli", "rapi",
    "harum", "wangi", "lezat", "nikmat", "gurih", "enak", "sedap",
    "sangat", "banget", "bgt", "sekali", "terlalu", "amat",
    
    # kata deskripsi produk — tambahkan rumpun keripik / fmcg generik
    "cemilan", "camilan", "makanan", "minuman", "kopi", "teh", "herbal",
    "keripik", "kripik", "singkong", "pisang", "bumbu", "rasa", "varian",
    "produk", "barang", "item", "beli", "dapat", "pesan", "order",
    
    # kata deskripsi fisik / kepunyaan
    "harganya", "aromanya", "rasanya", "baunya", "isinya",
    "kemasannya", "pelayanannya", "tampilannya", "ukurannya",
    "recommended", "recommend", "good", "great", "nice",
    "best", "worst", "love", "like", "hate", "fine", "well",
    "thanks", "thank", "terimakasih", "makasih",
    "standar", "biasa", "hambar", "teliti",
}

STOPWORDS = SASTRAWI_STOPWORDS | CUSTOM_STOPWORDS

VALID_COMPLAINT_KEYWORDS = {
    "pengiriman", "kualitas", "harga", "kemasan", "pelayanan",
    "expired", "bocor", "tumpah", "plastik", "rusak", "cacat",
    "lambat", "lama", "mahal", "apek", "basi", "kotor", "lecet",
    "pecah", "retak", "penyok", "basah", "robek", "kurang",
    "salah", "tidak_sesuai", "palsu", "tiruan", "berbeda",
}

def update_keyword_summary(product_id: str):
    db = SessionLocal()
    try:
        # 1. Ambil nama spesifik produk ini langsung dari DB untuk saringan darurat
        product_row = db.execute(text('SELECT name FROM "Product" WHERE id = :pid'), {"pid": product_id}).fetchone()
        current_product_tokens = set()
        if product_row:
            current_product_tokens = set(re.sub(r'[^a-z\s]', '', product_row[0].lower()).split())

        # 2. Gabungkan semua jaring stopword (Sastrawi + Custom + Nama Produk Spesifik)
        dynamic_stopwords = STOPWORDS | current_product_tokens

        # 3. Kunci ulasan hanya yang berlabel NEGATIVE atau NEUTRAL
        rows = db.execute(text("""
            SELECT "reviewText" FROM "Review"
            WHERE "productId" = :product_id AND "sentiment" IN ('negative', 'neutral')
        """), {"product_id": product_id}).fetchall()

        word_count: dict[str, int] = {}
        for row in rows:
            words = re.sub(r'[^a-zA-Z\s]', '', row[0].lower()).split()
            for word in words:
                normalized = word.lower().strip()
                
                # 🛡️ FILTER MUTLAK: Wajib ada di daftar keluhan & bersih dari stopword jenis apa pun
                if normalized in VALID_COMPLAINT_KEYWORDS and normalized not in dynamic_stopwords:
                    word_count[normalized] = word_count.get(normalized, 0) + 1

        # 4. Ambil top 5 keluhan murni
        top_words = sorted(word_count.items(), key=lambda x: -x[1])[:5]

        # 5. Reset dan simpan ke database PostgreSQL
        db.execute(text('DELETE FROM "KeywordSummary" WHERE "productId" = :product_id'), {"product_id": product_id})

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
        print(f"🎯 Keluhan Bersih Terdeteksi untuk {product_id}: {[w for w, _ in top_words]}")

    except Exception as e:
        db.rollback()
        print(f"🔥 Error: {e}")
    finally:
        db.close()

def update_all_products():
    db = SessionLocal()
    try:
        product_ids = db.execute(text('SELECT DISTINCT "productId" FROM "Review"')).fetchall()
        print(f"🔄 Menghitung ulang keluhan untuk {len(product_ids)} produk...")
        for (product_id,) in product_ids:
            update_keyword_summary(product_id)
        print("✅ Analisis keluhan selesai diperbarui!")
    finally:
        db.close()
