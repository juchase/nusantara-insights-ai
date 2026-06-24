import re
import spacy
import os
from sqlalchemy import text
from app.utils.db import SessionLocal
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

# ── Muat model spaCy Indonesia ────────────────────────────────────────────────
# spaCy di sini HANYA dipakai untuk lemmatisasi (kata dasar), BUKAN untuk
# menentukan relevansi kata. POS tagging terlalu permisif karena meloloskan
# semua NOUN/ADJ termasuk kata netral seperti "aroma", "harum", "rasa".

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "models", "id_core_news_sm", "id_core_news_sm-0.0.4")

try:
    nlp = spacy.load(MODEL_PATH)
except OSError:
    raise RuntimeError(f"Gagal memuat model. Pastikan folder model ada di: {MODEL_PATH}")

factory = StopWordRemoverFactory()
SASTRAWI_STOPWORDS = set(factory.get_stop_words())

CUSTOM_STOPWORDS = {
    "joss", "spesial", "mantap", "mantul", "top", "sip", "jos",
    "puas", "keren", "oke", "okay", "siap", "setuju", "terjangkau",
    "sangat", "banget", "bgt", "sekali", "terlalu", "amat", "nih", "kok",
    "recommended", "recommend", "good", "great", "nice", "best", "thanks",
    "terimakasih", "makasih", "toko", "seller", "admin", "aplikasi", "beli",
    "pesan", "order", "bintang", "ulasan", "review", "kak", "gan", "sis", "ya", "yg",
}
STOPWORDS = SASTRAWI_STOPWORDS | CUSTOM_STOPWORDS

# ── NEGATION WORDS ─────────────────────────────────────────────────────────────
# Kata yang mengindikasikan bahwa kata SETELAHNYA BISA jadi keluhan/kekurangan,
# bukan pujian. Contoh: "kurang renyah", "tidak segar", "gak enak"
# PENTING: trigger ini hanya jadi GERBANG KEDUA -- kata setelahnya TETAP harus
# ada di whitelist kategori (_WORD_TO_CATEGORY) agar lolos. Tanpa syarat ini,
# kata umum/typo apapun setelah "kurang"/"tidak" akan ikut lolos (lihat bug
# yang ditemukan: "kurang tau", "kurang pankai", "kurang perlu" semuanya
# tertangkap padahal bukan keluhan produk).
NEGATION_TRIGGERS = {"kurang", "tidak", "gak", "ga", "bukan", "tanpa", "minim", "kekurangan"}

# ── INTENSIFIER NEGATIF ────────────────────────────────────────────────────────
# Kata yang SELALU bermakna negatif tanpa perlu negasi tambahan
NEGATIVE_STANDALONE = {
    "rusak", "robek", "penyok", "bocor", "pecah", "retak", "tumpah",
    "lambat", "lama", "telat", "terlambat", "lelet",
    "mahal", "kemahalan",
    "expired", "kadaluarsa", "basi", "apek", "kotor", "berjamur", "berbau",
    "palsu", "tiruan", "beda", "berbeda", "salah", "hancur", "melempem",
    "cuek", "kecewa", "marah", "kesal", "menyengat",
    "buruk", "ampas", "kasar", "hambar",
}

# ── KATEGORISASI ────────────────────────────────────────────────────────────────
# Hanya kata yang LOLOS sebagai keluhan (lihat is_complaint_word) yang akan
# dipetakan ke kategori ini. Kategori dipakai untuk PENGELOMPOKAN tampilan,
# bukan untuk filter awal.
#
# Kata sifat netral/positif (bagus, enak, fresh, cocok, rapi, sedap, aman, dst)
# DITAMBAHKAN di sini secara sengaja -- bukan supaya mereka lolos begitu saja,
# tapi supaya KETIKA mereka muncul lewat jalur negasi ("kurang bagus",
# "kurang fresh", "tidak rapi"), hasilnya jatuh ke kategori bermakna
# ("Kualitas Tidak Sesuai") bukan "lainnya".
CATEGORY_MAPS = {
    "pengiriman": [
        "kirim", "kurir", "paket", "lambat", "lama", "ongkir",
        "sampe", "sampai", "ekspedisi", "resi", "antar", "telat",
        "terlambat", "lelet",
    ],
    "kemasan": [
        "kemas", "bungkus", "bocor", "tumpah", "plastik", "kotak",
        "dus", "segel", "pecah", "robek", "penyok", "basah", "rusak",
        "karton",
    ],
    "kualitas produk": [
        "rasa", "kualitas", "expired", "basi", "apek", "kotor", "berjamur",
        "berbau", "palsu", "tiruan", "beda", "berbeda", "sesuai", "hancur",
        "melempem", "salah", "kadaluarsa",
        # kata sifat netral/positif -- hanya bermakna keluhan saat didahului
        # negasi ("kurang enak", "tidak fresh", "tidak rapi")
        "enak", "bagus", "fresh", "cocok", "rapi", "rapih", "sedap",
        "renyah", "segar", "lengket", "licin",
    ],
    "harga": ["harga", "mahal", "kemahalan"],
    "pelayanan": [
        "pelayanan", "respon", "balas", "chat", "admin", "cuek",
        "ramah", "kecewa", "marah", "kesal", "menyengat",
    ],
}

_WORD_TO_CATEGORY: dict[str, str] = {}
for cat, words in CATEGORY_MAPS.items():
    for w in words:
        _WORD_TO_CATEGORY[w] = cat


def determine_category(word: str) -> str:
    """Exact match — bukan substring match. 'aroma' tidak match 'roma' dsb."""
    return _WORD_TO_CATEGORY.get(word, "lainnya")


def is_complaint_word(lemma: str, prev_lemma: str | None) -> bool:
    """
    Tentukan apakah sebuah kata (setelah lemmatisasi) benar-benar
    mengindikasikan KELUHAN, bukan deskripsi netral/positif, kata umum,
    atau typo yang tidak relevan.

    Dua jalur kata dianggap keluhan:
    1. Kata itu sendiri SELALU negatif (NEGATIVE_STANDALONE)
       contoh: "rusak", "lambat", "mahal" — tidak butuh konteks tambahan
    2. Kata itu didahului oleh negation trigger DAN kata itu sendiri
       ADA di whitelist kategori (_WORD_TO_CATEGORY)
       contoh: "kurang renyah" -> lolos KARENA "renyah" terdaftar di kategori
       Tanpa syarat whitelist ini, SEMUA kata setelah "kurang"/"tidak" akan
       lolos -- termasuk kata umum ("kurang tau", "kurang perlu") dan typo
       ("kurang pankai") yang bukan keluhan produk sama sekali. Ini adalah
       fix untuk bug di mana 48% hasil ekstraksi jatuh ke kategori "lainnya".
    """
    if lemma in NEGATIVE_STANDALONE:
        return True
    if prev_lemma in NEGATION_TRIGGERS and lemma in _WORD_TO_CATEGORY:
        return True
    return False


def update_keyword_summary(product_id: str):
    db = SessionLocal()
    try:
        product_row = db.execute(
            text('SELECT name FROM "Product" WHERE id = :pid'),
            {"pid": product_id},
        ).fetchone()
        current_product_tokens = set()
        if product_row and product_row[0]:
            current_product_tokens = set(
                re.sub(r'[^a-z\s]', '', product_row[0].lower()).split()
            )

        dynamic_stopwords = STOPWORDS | current_product_tokens

        rows = db.execute(text("""
            SELECT "reviewText" FROM "Review"
            WHERE "productId" = :product_id AND "sentiment" IN ('negative', 'neutral')
        """), {"product_id": product_id}).fetchall()

        word_count: dict[str, int] = {}

        for row in rows:
            if not row or not row[0]:
                continue

            doc = nlp(row[0].lower())
            tokens = list(doc)

            for i, token in enumerate(tokens):
                normalized = re.sub(r'[^a-z]', '', token.lemma_.strip())

                if len(normalized) <= 2:
                    continue
                if normalized in dynamic_stopwords:
                    continue

                # Ambil lemma kata SEBELUMNYA untuk cek negasi
                prev_lemma = None
                if i > 0:
                    prev_lemma = re.sub(r'[^a-z]', '', tokens[i - 1].lemma_.strip())

                # ── FILTER UTAMA — hanya kata yang benar-benar keluhan ────────
                if is_complaint_word(normalized, prev_lemma):
                    word_count[normalized] = word_count.get(normalized, 0) + 1

        top_words = sorted(word_count.items(), key=lambda x: -x[1])[:5]

        db.execute(
            text('DELETE FROM "KeywordSummary" WHERE "productId" = :product_id'),
            {"product_id": product_id},
        )

        for word, count in top_words:
            category = determine_category(word)
            db.execute(text("""
                INSERT INTO "KeywordSummary" (id, "productId", word, count, category)
                VALUES (gen_random_uuid(), :product_id, :word, :count, :category)
            """), {
                "product_id": product_id,
                "word":       word,
                "count":      count,
                "category":   category,
            })

        db.commit()
        print(f"🎯 Keluhan valid untuk {product_id}: {[w for w, _ in top_words]}")

    except Exception as e:
        db.rollback()
        print(f"🔥 Error: {e}")
    finally:
        db.close()


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
    """Ambil satu kata kunci dengan count tertinggi beserta kategorinya."""
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