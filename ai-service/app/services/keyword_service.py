import re
import spacy
from sqlalchemy import text
from app.utils.db import SessionLocal
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

# 1. Muat model spaCy Indonesia
try:
    nlp = spacy.load("id_core_news_sm")
except OSError:
    import os
    os.system("python -m spacy download id_core_news_sm")
    nlp = spacy.load("id_core_news_sm")

factory = StopWordRemoverFactory()
SASTRAWI_STOPWORDS = set(factory.get_stop_words())

# Blacklist kata sampah / slang umum
CUSTOM_STOPWORDS = {
    "joss", "spesial", "mantap", "mantul", "top", "sip", "jos",
    "puas", "keren", "oke", "okay", "siap", "setuju", "terjangkau",
    "sangat", "banget", "bgt", "sekali", "terlalu", "amat", "nih", "kok",
    "recommended", "recommend", "good", "great", "nice", "best", "thanks", 
    "terimakasih", "makasih", "toko", "seller", "admin", "aplikasi", "beli",
    "pesan", "order", "bintang", "ulasan", "review", "kak", "gan", "sis", "ya", "yg"
}

STOPWORDS = SASTRAWI_STOPWORDS | CUSTOM_STOPWORDS

# 2. Kamus Pemetaan Kategori Otomatis (Cukup daftarkan rumpun kata dasarnya saja)
CATEGORY_MAPS = {
    "pengiriman": ["kirim", "kurir", "paket", "lambat", "lama", "ongkir", "sampe", "sampai", "ekspedisi", "resi", "antar"],
    "kemasan": ["kemas", "bungkus", "bocor", "tumpah", "plastik", "kotak", "dus", "segel", "pecah", "robek", "penyok", "basah"],
    "produk": ["rasa", "kualitas", "harga", "mahal", "expired", "basi", "apek", "kotor", "palsu", "tiruan", "beda", "sesuai", "hancur", "melempem"],
    "pelayanan": ["pelayanan", "respon", "balas", "chat", "admin", "cuek", "ramah", "lambat", "slow", "kecewa"]
}

def determine_category(word: str) -> str:
    """Fungsi mendeteksi kategori berdasarkan kedekatan kata kunci dasar"""
    for category, keywords in CATEGORY_MAPS.items():
        if any(kw in word for kw in keywords):
            return category
    return "lainnya" # Jika tidak masuk rumpun manapun, masuk kategori lainnya

def update_keyword_summary(product_id: str):
    db = SessionLocal()
    try:
        # Ambil nama produk dari DB untuk saringan darurat
        product_row = db.execute(text('SELECT name FROM "Product" WHERE id = :pid'), {"pid": product_id}).fetchone()
        current_product_tokens = set()
        if product_row and product_row[0]:
            current_product_tokens = set(re.sub(r'[^a-z\s]', '', product_row[0].lower()).split())

        dynamic_stopwords = STOPWORDS | current_product_tokens

        # Ambil ulasan bermasalah (NEGATIVE atau NEUTRAL)
        rows = db.execute(text("""
            SELECT "reviewText" FROM "Review"
            WHERE "productId" = :product_id AND "sentiment" IN ('negative', 'neutral')
        """), {"product_id": product_id}).fetchall()

        word_count: dict[str, int] = {}
        
        for row in rows:
            if not row or not row[0]:
                continue
                
            # Proses teks ulasan dengan spaCy AI
            doc = nlp(row[0].lower())
            
            for token in doc:
                # Mengubah ke kata dasar asli (contoh: "pengirimannya" -> "kirim")
                normalized = token.lemma_.strip()
                normalized = re.sub(r'[^a-z]', '', normalized)
                
                # Filter otomatis berbasis tipe kata (Kata Sifat & Kata Benda)
                if token.pos_ in ["ADJ", "NOUN"] and len(normalized) > 2:
                    if normalized not in dynamic_stopwords:
                        word_count[normalized] = word_count.get(normalized, 0) + 1

        # Ambil top 5 keluhan otomatis murni dari hasil analisis spaCy
        top_words = sorted(word_count.items(), key=lambda x: -x[1])[:5]

        # Reset data lama untuk produk ini
        db.execute(text('DELETE FROM "KeywordSummary" WHERE "productId" = :product_id'), {"product_id": product_id})

        for word, count in top_words:
            # Otomatis tentukan kategori kata keluhan tersebut sebelum masuk DB
            category = determine_category(word)
            
            # Eksekusi insert (Mengasumsikan Anda sudah menambahkan kolom "category" di tabel DB)
            db.execute(text("""
                INSERT INTO "KeywordSummary" (id, "productId", word, count, category)
                VALUES (gen_random_uuid(), :product_id, :word, :count, :category)
            """), {
                "product_id": product_id,
                "word": word,
                "count": count,
                "category": category
            })

            # Alternatif jika TIDAK INGIN ubah kolom DB (Gunakan baris di bawah ini dan matikan SQL di atas):
            # gabung_kata = f"{category}: {word}"
            # db.execute(text('INSERT INTO "KeywordSummary" (id, "productId", word, count) VALUES (gen_random_uuid(), :product_id, :word, :count)'), {"product_id": product_id, "word": gabung_kata, "count": count})

        db.commit()
        print(f"🎯 Keluhan Ber-Kategori Sukses untuk {product_id}!")

    except Exception as e:
        db.rollback()
        print(f"🔥 Error: {e}")
    finally:
        db.close()

# Tambahkan di bagian bawah file keyword_service.py

def update_all_products():
    db = SessionLocal()
    try:
        product_ids = db.execute(text('SELECT id FROM "Product"')).fetchall()
        for (pid,) in product_ids:
            update_keyword_summary(pid)
        print("✅ Semua produk telah diperbarui keyword summary-nya.")
    except Exception as e:
        print(f"❌ Error update_all_products: {e}")
    finally:
        db.close()

def get_dominant_keyword(product_id: str):
    """
    Mengambil satu kata kunci dengan count tertinggi beserta kategorinya.
    Return: (word, category) atau (None, None)
    """
    db = SessionLocal()
    try:
        row = db.execute(text("""
            SELECT word, category
            FROM "KeywordSummary"
            WHERE "productId" = :product_id
            ORDER BY count DESC
            LIMIT 1
        """), {"product_id": product_id}).fetchone()
        return (row.word, row.category) if row else (None, None)
    finally:
        db.close()