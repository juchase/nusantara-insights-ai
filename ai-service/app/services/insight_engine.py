from sqlalchemy import text
from app.utils.db import SessionLocal

# ---------------------------------------------------------------------
# Konfigurasi rekomendasi berbasis KATEGORI (dari KeywordSummary)
# ---------------------------------------------------------------------
CATEGORY_CONFIG = {
    "pengiriman": {
        "sentence": "Keluhan utama pelanggan berfokus pada layanan pengiriman yang lambat atau bermasalah.",
        "rec": "Evaluasi performa mitra ekspedisi dan pertimbangkan opsi pengiriman ekspres untuk meningkatkan kepuasan pelanggan.",
    },
    "kemasan": {
        "sentence": "Terdapat keluhan terkait kondisi atau kualitas kemasan produk yang diterima pelanggan.",
        "rec": "Perbaiki standar pengemasan dan tambahkan lapisan pelindung untuk meminimalkan risiko kerusakan saat pengiriman.",
    },
    "produk": {
        "sentence": "Keluhan signifikan terkait kualitas produk yang tidak sesuai ekspektasi pelanggan.",
        "rec": "Perketat proses quality control sebelum produk dikemas dan dikirim ke pelanggan.",
    },
    # ── TAMBAHKAN ──
    "kualitas produk": {  # alias untuk kategori dengan spasi
        "sentence": "Keluhan signifikan terkait kualitas produk yang tidak sesuai ekspektasi pelanggan.",
        "rec": "Perketat proses quality control sebelum produk dikemas dan dikirim ke pelanggan.",
    },
    "pelayanan": {
        "sentence": "Pelanggan mengeluhkan responsivitas atau kualitas layanan yang kurang memuaskan.",
        "rec": "Tingkatkan standar layanan pelanggan dengan mempercepat waktu respons terhadap pertanyaan dan keluhan.",
    },
    "lainnya": {
        "sentence": "Terdapat keluhan beragam yang tidak masuk kategori utama, perlu analisis lebih lanjut.",
        "rec": "Lakukan analisis lebih mendalam terhadap ulasan pelanggan untuk mengidentifikasi pola keluhan spesifik.",
    }
}

# ---------------------------------------------------------------------
# Helper: ambil kata kunci dominan & kategorinya dari database
# ---------------------------------------------------------------------
def get_dominant_keyword(product_id: str):
    """
    Mengambil satu kata kunci dengan count tertinggi beserta kategorinya
    dari tabel KeywordSummary untuk product_id tertentu.
    Return: (word, category) atau (None, None) jika tidak ada data.
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

# ---------------------------------------------------------------------
# Fungsi utama: generate structured insights
# ---------------------------------------------------------------------
def generate_structured_insights(
    product_id: str,           # ← harus ada
    positive: float,
    negative: float,
    neutral: float,
    growth: float,
    trend: str,
    product_name: str,
    keyword: str = None,
    category: str = None,
):
    """
    Menghasilkan insights terstruktur (list of dict), rekomendasi (list),
    dan kalimat naratif (list) berdasarkan sentimen, demand, dan keluhan utama.
    - keyword & category: jika tidak diberikan, akan diambil dari KeywordSummary.
    """
    insights = []
    recommendations = []
    raw_sentences = []

    # ---- Ambil keyword dominan dari database jika tidak diberikan ----
    if keyword is None or category is None:
        db_keyword, db_category = get_dominant_keyword(product_id)
        if db_keyword:
            keyword = keyword or db_keyword
            category = category or db_category
        else:
            keyword = keyword or ""
            category = category or "lainnya"

    # ---- SENTIMEN ----
    if negative >= 50:
        insights.append({
            "type": "warning",
            "title": "Sentimen Negatif Sangat Tinggi",
            "description": f"Lebih dari separuh pelanggan ({negative:.0f}%) memberikan ulasan negatif.",
            "priority": "HIGH",
        })
        raw_sentences.append(
            f"{product_name} menerima {negative:.0f}% ulasan negatif dari total pelanggan, "
            "menunjukkan adanya ketidakpuasan yang perlu segera ditangani."
        )
    elif negative > 30:
        insights.append({
            "type": "warning",
            "title": "Sentimen Negatif Tinggi",
            "description": f"Sentimen negatif mencapai {negative:.0f}%, perlu perhatian.",
            "priority": "HIGH",
        })
        raw_sentences.append(
            f"{product_name} menerima {negative:.0f}% ulasan negatif dari total pelanggan, "
            "menunjukkan adanya ketidakpuasan yang perlu segera ditangani."
        )
    elif positive >= 70:
        insights.append({
            "type": "positive",
            "title": "Sentimen Pelanggan Sangat Positif",
            "description": f"Sebanyak {positive:.0f}% pelanggan memberikan ulasan positif.",
            "priority": "LOW",
        })
        raw_sentences.append(
            f"Sebanyak {positive:.0f}% pelanggan memberikan ulasan positif terhadap produk {product_name}."
        )
    elif positive >= 50:
        insights.append({
            "type": "positive",
            "title": "Sentimen Pelanggan Positif",
            "description": f"Mayoritas pelanggan ({positive:.0f}%) memberikan ulasan positif.",
            "priority": "LOW",
        })
        raw_sentences.append(
            f"Mayoritas pelanggan ({positive:.0f}%) memberikan ulasan positif terhadap {product_name}."
        )
    else:
        insights.append({
            "type": "neutral",
            "title": "Sentimen Pelanggan Netral",
            "description": f"Sentimen pelanggan bervariasi ({positive:.0f}% positif, {negative:.0f}% negatif).",
            "priority": "MEDIUM",
        })
        raw_sentences.append(
            f"Sentimen pelanggan terhadap {product_name} bervariasi dengan "
            f"{positive:.0f}% ulasan positif dan {negative:.0f}% ulasan negatif."
        )

    # ---- DEMAND ----
    if trend == "up":
        insights.append({
            "type": "opportunity",
            "title": "Permintaan Produk Meningkat",
            "description": f"Permintaan diprediksi meningkat {growth:.0f}% dalam 7 hari ke depan.",
            "priority": "MEDIUM",
        })
        raw_sentences.append(
            f"Permintaan produk diprediksi meningkat sebesar {growth:.0f}% "
            "dalam periode mendatang, perlu kesiapan stok tambahan."
        )
        recommendations.append(
            f"Siapkan stok tambahan untuk mengantisipasi kenaikan permintaan {growth:.0f}% "
            "dalam 7 hari ke depan."
        )
    elif trend == "down":
        insights.append({
            "type": "warning",
            "title": "Permintaan Produk Menurun",
            "description": f"Permintaan diprediksi turun {abs(growth):.0f}% dalam 7 hari ke depan.",
            "priority": "HIGH",
        })
        raw_sentences.append(
            f"Permintaan produk diprediksi menurun sebesar {abs(growth):.0f}% "
            "dalam periode mendatang, membutuhkan peninjauan strategi promosi."
        )
        recommendations.append(
            f"Tinjau strategi promosi untuk mendorong kembali minat pelanggan "
            f"dan mengatasi penurunan permintaan {abs(growth):.0f}%."
        )
    else:
        insights.append({
            "type": "positive",
            "title": "Permintaan Produk Stabil",
            "description": "Permintaan produk cenderung stabil dalam 7 hari ke depan.",
            "priority": "LOW",
        })
        raw_sentences.append("Permintaan produk relatif stabil dalam periode mendatang.")
        recommendations.append(
            "Pertahankan kualitas layanan dan pantau performa produk secara berkala."
        )

    # ---- KELUHAN UTAMA (berdasarkan KATEGORI) ----
    if category and category in CATEGORY_CONFIG:
        cfg = CATEGORY_CONFIG[category]
    else:
        cfg = CATEGORY_CONFIG["lainnya"]  # fallback

    # Tambahkan insight dan rekomendasi dari kategori
    title = f"Keluhan Utama: {category.capitalize()}" if category else "Keluhan Utama"

    insights.append({
        "type": "warning",
        "title": title,
        "description": cfg["sentence"],
        "priority": "HIGH" if category != "lainnya" else "MEDIUM",
    })
    raw_sentences.append(cfg["sentence"])
    recommendations.append(cfg["rec"])

    # ---- FALLBACK jika tidak ada insight sama sekali ----
    if not insights:
        insights.append({
            "type": "positive",
            "title": "Performa Produk Stabil",
            "description": "Tidak ditemukan masalah signifikan pada produk saat ini.",
            "priority": "LOW",
        })
        raw_sentences.append("Tidak ditemukan masalah signifikan pada produk saat ini.")

    if not recommendations:
        recommendations.append(
            "Pertahankan kualitas produk dan lakukan monitoring performa secara berkala."
        )

    return insights, recommendations, raw_sentences


# ---------------------------------------------------------------------
# Fungsi: executive summary (ringkasan satu paragraf)
# ---------------------------------------------------------------------
def generate_executive_summary(
    product_id: str,
    positive: float,
    negative: float,
    trend: str,
    risk_level: str,
    product_name: str,
    growth: float = 0.0,
    dominant_issue: str = None,   # opsional, jika diberikan akan dipakai
):
    """
    Menghasilkan ringkasan eksekutif dalam bentuk paragraf pendek.
    - dominant_issue: jika tidak diberikan, akan diambil dari KeywordSummary (kategori).
    """
    # ---- Ambil kategori dominan dari database jika tidak diberikan ----
    if dominant_issue is None:
        _, db_category = get_dominant_keyword(product_id)
        dominant_issue = db_category if db_category else "lainnya"

    # ---- Mapping kategori ke prioritas bisnis ----
    issue_map = {
        "pengiriman": "peningkatan kualitas dan kecepatan layanan pengiriman",
        "kemasan": "perbaikan standar pengemasan produk",
        "produk": "pengendalian dan peningkatan kualitas produk",
        "kualitas produk": "pengendalian dan peningkatan kualitas produk",
        "pelayanan": "peningkatan responsivitas layanan pelanggan",
        "lainnya": "monitoring performa produk secara berkala",
    }
    prioritas = issue_map.get(dominant_issue, issue_map["lainnya"])

    # ---- Deskripsi sentimen ----
    if negative >= 50:
        sentimen = f"lebih dari separuh pelanggan ({negative:.0f}%) memberikan ulasan negatif"
    elif negative >= 30:
        sentimen = f"sentimen negatif yang cukup tinggi ({negative:.0f}%)"
    elif positive >= 70:
        sentimen = f"sentimen pelanggan yang sangat positif ({positive:.0f}%)"
    elif positive >= 50:
        sentimen = f"mayoritas pelanggan ({positive:.0f}%) memberikan ulasan positif"
    else:
        sentimen = (
            f"sentimen pelanggan yang bervariasi "
            f"({positive:.0f}% positif, {negative:.0f}% negatif)"
        )

    # ---- Deskripsi demand ----
    if trend == "up":
        demand = f"Permintaan diprediksi meningkat {growth:.0f}% dalam 7 hari ke depan."
    elif trend == "down":
        demand = f"Permintaan diprediksi menurun {abs(growth):.0f}% dalam periode mendatang."
    else:
        demand = "Permintaan relatif stabil dalam periode mendatang."

    # ---- Opening berdasarkan risk level ----
    risk_map = {
        "high": f"{product_name} memerlukan penanganan segera",
        "medium": f"{product_name} memerlukan perhatian",
        "low": f"{product_name} dalam kondisi baik",
    }
    opening = risk_map.get(risk_level, f"{product_name} perlu dipantau")

    # ---- Gabungkan menjadi satu paragraf ----
    return (
        f"{opening} dengan {sentimen}. "
        f"{demand} "
        f"Prioritas utama adalah {prioritas}."
    )