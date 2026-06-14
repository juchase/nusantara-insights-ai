def generate_structured_insights(
    positive, negative, neutral, keyword, growth, trend, product_name
):
    insights      = []
    recommendations = []
    raw_sentences = []

    # ── SENTIMEN ─────────────────────────────────────────────────────────────
    if negative >= 50:
        insights.append({
            "type":        "warning",
            "title":       "Sentimen Negatif Sangat Tinggi",
            "description": f"Lebih dari separuh pelanggan ({negative:.0f}%) memberikan ulasan negatif.",
            "priority":    "HIGH",
        })
        raw_sentences.append(
            f"{product_name} menerima {negative:.0f}% ulasan negatif dari total pelanggan, "
            "menunjukkan adanya ketidakpuasan yang perlu segera ditangani."
        )
    elif negative > 30:
        insights.append({
            "type":        "warning",
            "title":       "Sentimen Negatif Tinggi",
            "description": f"Sentimen negatif mencapai {negative:.0f}%, perlu perhatian.",
            "priority":    "HIGH",
        })
        raw_sentences.append(
            f"{product_name} menerima {negative:.0f}% ulasan negatif dari total pelanggan, "
            "menunjukkan adanya ketidakpuasan yang perlu segera ditangani."
        )
    elif positive >= 70:
        insights.append({
            "type":        "positive",
            "title":       "Sentimen Pelanggan Sangat Positif",
            "description": f"Sebanyak {positive:.0f}% pelanggan memberikan ulasan positif.",
            "priority":    "LOW",
        })
        raw_sentences.append(
            f"Sebanyak {positive:.0f}% pelanggan memberikan ulasan positif terhadap produk {product_name}."
        )
    elif positive >= 50:
        insights.append({
            "type":        "positive",
            "title":       "Sentimen Pelanggan Positif",
            "description": f"Mayoritas pelanggan ({positive:.0f}%) memberikan ulasan positif.",
            "priority":    "LOW",
        })
        raw_sentences.append(
            f"Mayoritas pelanggan ({positive:.0f}%) memberikan ulasan positif terhadap {product_name}."
        )
    else:
        insights.append({
            "type":        "neutral",
            "title":       "Sentimen Pelanggan Netral",
            "description": f"Sentimen pelanggan bervariasi ({positive:.0f}% positif, {negative:.0f}% negatif).",
            "priority":    "MEDIUM",
        })
        raw_sentences.append(
            f"Sentimen pelanggan terhadap {product_name} bervariasi dengan "
            f"{positive:.0f}% ulasan positif dan {negative:.0f}% ulasan negatif."
        )

    # ── DEMAND ───────────────────────────────────────────────────────────────
    if trend == "up":
        insights.append({
            "type":        "opportunity",
            "title":       "Permintaan Produk Meningkat",
            "description": f"Permintaan diprediksi meningkat {growth:.0f}% dalam 7 hari ke depan.",
            "priority":    "MEDIUM",
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
            "type":        "warning",
            "title":       "Permintaan Produk Menurun",
            "description": f"Permintaan diprediksi turun {abs(growth):.0f}% dalam 7 hari ke depan.",
            "priority":    "HIGH",
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
            "type":        "positive",
            "title":       "Permintaan Produk Stabil",
            "description": "Permintaan produk cenderung stabil dalam 7 hari ke depan.",
            "priority":    "LOW",
        })
        raw_sentences.append(
            "Permintaan produk relatif stabil dalam periode mendatang."
        )
        recommendations.append(
            "Pertahankan kualitas layanan dan pantau performa produk secara berkala."
        )

    # ── KEYWORD — rekomendasi spesifik berdasarkan keluhan ───────────────────
    keyword_config = {
        "pengiriman": {
            "sentence": "Keluhan utama pelanggan berfokus pada layanan pengiriman yang lambat atau bermasalah.",
            "rec":      "Evaluasi performa mitra ekspedisi dan pertimbangkan penambahan opsi pengiriman ekspres untuk meningkatkan kepuasan pelanggan.",
        },
        "kualitas": {
            "sentence": "Terdapat keluhan signifikan terkait kualitas produk yang tidak sesuai ekspektasi pelanggan.",
            "rec":      "Perketat proses quality control sebelum produk dikemas dan dikirim ke pelanggan.",
        },
        "harga": {
            "sentence": "Beberapa pelanggan menilai harga produk kurang kompetitif dibanding alternatif lain.",
            "rec":      "Pertimbangkan program bundling, diskon loyalitas, atau penyesuaian harga untuk meningkatkan daya saing.",
        },
        "kemasan": {
            "sentence": "Terdapat keluhan terkait kondisi atau kualitas kemasan produk yang diterima pelanggan.",
            "rec":      "Perbaiki standar pengemasan dan tambahkan lapisan pelindung untuk meminimalkan risiko kerusakan saat pengiriman.",
        },
        "pelayanan": {
            "sentence": "Pelanggan mengeluhkan responsivitas atau kualitas layanan yang kurang memuaskan.",
            "rec":      "Tingkatkan standar layanan pelanggan dengan mempercepat waktu respons terhadap pertanyaan dan keluhan.",
        },
        "rusak": {
            "sentence": "Terdapat laporan produk yang diterima dalam kondisi rusak atau cacat.",
            "rec":      "Evaluasi proses pengemasan dan penanganan produk selama pengiriman untuk mengurangi tingkat kerusakan.",
        },
        "bocor": {
            "sentence": "Terdapat laporan produk bocor yang menyebabkan ketidakpuasan pelanggan.",
            "rec":      "Perbarui standar pengemasan dan lakukan uji kebocoran sebelum produk dikirimkan.",
        },
        "expired": {
            "sentence": "Terdapat laporan produk yang diterima dalam kondisi mendekati atau melewati tanggal kedaluwarsa.",
            "rec":      "Terapkan sistem FIFO (First In First Out) pada manajemen stok untuk memastikan produk segar sampai ke pelanggan.",
        },
        "lambat": {
            "sentence": "Pelanggan mengeluhkan waktu pengiriman yang terlalu lama.",
            "rec":      "Pertimbangkan bermitra dengan ekspedisi yang menawarkan layanan pengiriman same-day atau next-day.",
        },
        "mahal": {
            "sentence": "Pelanggan menilai harga produk terlalu tinggi dibanding produk sejenis.",
            "rec":      "Evaluasi struktur harga dan pertimbangkan program promosi atau voucher diskon untuk menarik lebih banyak pembeli.",
        },
    }

    kw = (keyword or "").lower().strip()
    if kw in keyword_config:
        cfg = keyword_config[kw]
        raw_sentences.append(cfg["sentence"])
        recommendations.append(cfg["rec"])
        insights.append({
            "type":        "warning",
            "title":       f"Keluhan Utama: {keyword.capitalize()}",
            "description": cfg["sentence"],
            "priority":    "HIGH",
        })
    elif kw and kw not in ("umum", "none", "tidak diketahui", ""):
        # Keyword tidak ada di map tapi tetap perlu ditampilkan
        sentence = f"Keluhan yang paling sering muncul dari pelanggan adalah terkait '{keyword}'."
        raw_sentences.append(sentence)
        recommendations.append(
            f"Lakukan investigasi lebih lanjut terhadap keluhan '{keyword}' "
            "yang paling banyak dilaporkan pelanggan."
        )
        insights.append({
            "type":        "warning",
            "title":       f"Keluhan Utama: {keyword.capitalize()}",
            "description": sentence,
            "priority":    "MEDIUM",
        })

    # ── FALLBACK ─────────────────────────────────────────────────────────────
    if not insights:
        insights.append({
            "type":        "positive",
            "title":       "Performa Produk Stabil",
            "description": "Tidak ditemukan masalah signifikan pada produk saat ini.",
            "priority":    "LOW",
        })
        raw_sentences.append("Tidak ditemukan masalah signifikan pada produk saat ini.")

    if not recommendations:
        recommendations.append(
            "Pertahankan kualitas produk dan lakukan monitoring performa secara berkala."
        )

    return insights, recommendations, raw_sentences


def generate_executive_summary(
    product_name: str,
    positive: float,
    negative: float,
    trend: str,
    risk_level: str,
    dominant_issue: str,
    growth: float,
) -> str:

    # ── Sentimen ──────────────────────────────────────────────────────────────
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

    # ── Demand ────────────────────────────────────────────────────────────────
    if trend == "up":
        demand = f"Permintaan diprediksi meningkat {growth:.0f}% dalam 7 hari ke depan."
    elif trend == "down":
        demand = f"Permintaan diprediksi menurun {abs(growth):.0f}% dalam periode mendatang."
    else:
        demand = "Permintaan relatif stabil dalam periode mendatang."

    # ── Prioritas berdasarkan dominant issue ──────────────────────────────────
    issue_map = {
        "pengiriman": "peningkatan kualitas dan kecepatan layanan pengiriman",
        "kualitas":   "pengendalian dan peningkatan kualitas produk",
        "harga":      "evaluasi strategi penetapan harga dan program promosi",
        "kemasan":    "perbaikan standar pengemasan produk",
        "pelayanan":  "peningkatan responsivitas layanan pelanggan",
        "rusak":      "pengendalian kerusakan produk selama pengiriman",
        "expired":    "pengendalian masa kedaluwarsa dengan sistem FIFO",
        "bocor":      "perbaikan kualitas segel dan kemasan produk",
        "lambat":     "percepatan proses pengiriman ke pelanggan",
        "mahal":      "evaluasi strategi harga dan program diskon",
    }
    kw       = (dominant_issue or "").lower().strip()
    prioritas = issue_map.get(kw, "monitoring performa produk secara berkala")

    # ── Opening berdasarkan risk level ────────────────────────────────────────
    risk_map = {
        "high":   f"{product_name} memerlukan penanganan segera",
        "medium": f"{product_name} memerlukan perhatian",
        "low":    f"{product_name} dalam kondisi baik",
    }
    opening = risk_map.get(risk_level, f"{product_name} perlu dipantau")

    return (
        f"{opening} dengan {sentimen}. "
        f"{demand} "
        f"Prioritas utama adalah {prioritas}."
    )