def generate_structured_insights(positive, negative, neutral, keyword, growth, trend):

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
            f"Terdapat sentimen negatif yang cukup tinggi sebesar {negative:.0f}% dari total ulasan pelanggan."
        )
    elif positive >= 60:
        insights.append({
            "type": "positive",
            "title": "Sentimen Pelanggan Positif",
            "description": f"Sebanyak {positive:.0f}% pelanggan memberikan ulasan positif.",
            "priority": "LOW"
        })
        raw_sentences.append(
            f"Sebanyak {positive:.0f}% pelanggan memberikan ulasan positif terhadap produk ini."
        )
    else:
        insights.append({
            "type": "neutral",
            "title": "Sentimen Pelanggan Netral",
            "description": f"Sentimen pelanggan cenderung netral ({positive:.0f}% positif).",
            "priority": "LOW"
        })
        raw_sentences.append(
            f"Sentimen pelanggan cenderung netral dengan {positive:.0f}% ulasan positif."
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

    return insights, recommendations, raw_sentences  # ← tambah raw_sentences