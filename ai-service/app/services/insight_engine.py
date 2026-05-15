def generate_structured_insights(
    positive,
    negative,
    keyword,
    growth
):

    insights = []
    recommendations = []

    # NEGATIVE WARNING
    if negative > 30:
        insights.append({
            "type": "warning",
            "title": "Sentimen Negatif Tinggi",
            "description": f"Sentimen negatif mencapai {negative}%.",
            "priority": "HIGH"
        })

    # SHIPPING ISSUE
    if keyword == "pengiriman":
        insights.append({
            "type": "warning",
            "title": "Keluhan Pengiriman",
            "description": "Mayoritas pelanggan mengeluhkan pengiriman.",
            "priority": "HIGH"
        })

        recommendations.append(
            "Evaluasi kualitas layanan logistik."
        )

    # DEMAND OPPORTUNITY
    if growth > 10:
        insights.append({
            "type": "opportunity",
            "title": "Peningkatan Permintaan",
            "description": f"Permintaan diprediksi meningkat {growth}%.",
            "priority": "MEDIUM"
        })

        recommendations.append(
            "Tambahkan stok untuk mengantisipasi kenaikan permintaan."
        )

    # POSITIVE
    if positive > 60:
        insights.append({
            "type": "positive",
            "title": "Sentimen Positif",
            "description": "Mayoritas pelanggan puas terhadap produk.",
            "priority": "LOW"
        })

    return insights, recommendations