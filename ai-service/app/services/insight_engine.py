def generate_structured_insights(positive, negative, neutral, keyword, growth, trend, product_name):

    insights = []
    recommendations = []
    raw_sentences = []  # ← kalimat jadi dari rule engine

    # SENTIMEN
    if negative > 30:
        insights.append({
            "type": "warning",
            "title": "Sentimen Negatif Tinggi",
            "description": f"Sentimen negatif mencapai {negative:.0f}%.",
            "priority": "HIGH"
        })
        raw_sentences.append(
            f"{product_name} menerima {negative:.0f}% ulasan negatif dari total pelanggan, "
            "menunjukkan adanya ketidakpuasan yang perlu segera ditangani."
        )
    elif positive >= 60:
        insights.append({
            "type": "positive",
            "title": "Sentimen Pelanggan Positif",
            "description": f"Sebanyak {positive:.0f}% pelanggan memberikan ulasan positif.",
            "priority": "LOW"
        })
        raw_sentences.append(
            f"Sebanyak {positive:.0f}% pelanggan memberikan ulasan positif terhadap produk {product_name}."
        )
    else:
        insights.append({
            "type": "neutral",
            "title": "Sentimen Pelanggan Netral",
            "description": f"Sentimen pelanggan cenderung netral ({positive:.0f}% positif).",
            "priority": "LOW"
        })
        raw_sentences.append(
            f"Sentimen pelanggan cenderung netral dengan {positive:.0f}% ulasan positif terhadap produk {product_name}."
        )

    # DEMAND
    if trend == "up":
        insights.append({
            "type": "opportunity",
            "title": "Permintaan Produk Meningkat",
            "description": f"Permintaan diprediksi meningkat {growth:.0f}%.",
            "priority": "MEDIUM"
        })
        raw_sentences.append(
            f"Permintaan produk diprediksi meningkat sebesar {growth:.0f}% dalam periode mendatang."
        )
        recommendations.append("Siapkan stok tambahan untuk mengantisipasi kenaikan permintaan.")

    elif trend == "down":
        insights.append({
            "type": "warning",
            "title": "Permintaan Produk Menurun",
            "description": f"Permintaan diprediksi menurun {abs(growth):.0f}%.",
            "priority": "HIGH"
        })
        raw_sentences.append(
            f"Permintaan produk diprediksi menurun sebesar {abs(growth):.0f}% dalam periode mendatang."
        )
        recommendations.append("Tinjau strategi promosi untuk mendorong kembali minat pelanggan.")

    else:
        insights.append({
            "type": "positive",
            "title": "Permintaan Produk Stabil",
            "description": "Permintaan produk cenderung stabil.",
            "priority": "LOW"
        })
        raw_sentences.append("Permintaan produk relatif stabil dalam periode mendatang.")
        recommendations.append("Pertahankan kualitas layanan dan pantau performa produk secara berkala.")

    # KEYWORD
    keyword_map = {
        "pengiriman": (
            "Keluhan utama pelanggan berfokus pada layanan pengiriman.",
            "Evaluasi mitra ekspedisi dan pertimbangkan penambahan opsi pengiriman yang lebih cepat."
        ),
        "kualitas": (
            "Terdapat keluhan signifikan terkait kualitas produk.",
            "Perketat proses quality control sebelum produk dikirim ke pelanggan."
        ),
        "harga": (
            "Beberapa pelanggan menilai harga produk kurang kompetitif.",
            "Pertimbangkan program bundling atau diskon loyalitas untuk meningkatkan nilai produk."
        ),
    }

    if keyword in keyword_map:
        sentence, rec = keyword_map[keyword]
        raw_sentences.append(sentence)
        recommendations.append(rec)
        insights.append({
            "type": "warning",
            "title": f"Keluhan: {keyword.capitalize()}",
            "description": sentence,
            "priority": "HIGH"
        })
    elif keyword and keyword != "tidak diketahui":
        raw_sentences.append(
            f"Keluhan yang paling sering muncul dari pelanggan adalah terkait {keyword}."
        )

    # FALLBACK
    if not insights:
        insights.append({
            "type": "positive",
            "title": "Performa Produk Stabil",
            "description": "Tidak ditemukan masalah signifikan.",
            "priority": "LOW"
        })
        raw_sentences.append("Tidak ditemukan masalah signifikan pada produk saat ini.")

    if not recommendations:
        recommendations.append("Pertahankan kualitas produk dan lakukan monitoring berkala.")

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

    # ── Sentimen ───────────────────────────
    if negative >= 50:
        sentimen = f"lebih dari separuh pelanggan ({negative:.0f}%) memberikan ulasan negatif"
    elif negative >= 30:
        sentimen = f"sentimen negatif yang cukup tinggi ({negative:.0f}%)"
    elif positive >= 70:
        sentimen = f"sentimen pelanggan yang sangat positif ({positive:.0f}%)"
    elif positive >= 50:
        sentimen = f"mayoritas pelanggan ({positive:.0f}%) memberikan ulasan positif"
    else:
        sentimen = f"sentimen pelanggan yang bervariasi ({positive:.0f}% positif, {negative:.0f}% negatif)"

    # ── Demand ─────────────────────────────
    if trend == "up":
        demand = f"Permintaan diprediksi meningkat {growth:.0f}% dalam periode mendatang."
    elif trend == "down":
        demand = f"Permintaan diprediksi menurun {abs(growth):.0f}% dalam periode mendatang."
    else:
        demand = "Permintaan relatif stabil dalam periode mendatang."

    # ── Prioritas ──────────────────────────
    issue_map = {
        "pengiriman": "peningkatan kualitas layanan pengiriman",
        "kualitas":   "pengendalian kualitas produk",
        "harga":      "evaluasi strategi penetapan harga",
        "kemasan":    "perbaikan standar pengemasan produk",
        "pelayanan":  "peningkatan responsivitas layanan pelanggan",
        "expired":    "pengendalian masa kadaluarsa produk",
        "bocor":      "perbaikan kualitas kemasan produk",
    }
    prioritas = issue_map.get(
        dominant_issue.lower() if dominant_issue else "",
        "monitoring performa produk secara berkala"
    )

    # ── Risk context ───────────────────────
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