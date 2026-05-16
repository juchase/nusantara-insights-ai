def generate_structured_insights(
    positive,
    negative,
    keyword,
    growth,
    trend
):

    insights = []
    recommendations = []

    if negative > 30:

        insights.append({
            "type": "warning",
            "title": "Sentimen Negatif Tinggi",
            "description":
                f"Sentimen negatif mencapai {negative:.0f}%.",
            "priority": "HIGH"
        })

    if keyword == "pengiriman":

        insights.append({
            "type": "warning",
            "title": "Keluhan Pengiriman",
            "description":
                "Mayoritas pelanggan mengeluhkan pengiriman.",
            "priority": "HIGH"
        })

        recommendations.append(
            "Evaluasi kualitas layanan logistik."
        )
    
    if trend == "up":

        insights.append({
            "type": "opportunity",
            "title": "Permintaan Produk Meningkat",
            "description":
                f"Permintaan diprediksi meningkat {growth:.0f}%.",
            "priority": "MEDIUM"
        })

        recommendations.append(
            "Tambahkan stok untuk mengantisipasi kenaikan permintaan."
        )

    if trend == "stable":

        insights.append({
            "type": "positive",
            "title": "Permintaan Produk Stabil",
            "description":
                "Permintaan produk cenderung stabil.",
            "priority": "LOW"
        })

        recommendations.append(
            "Pertahankan kualitas layanan dan pantau performa produk secara berkala."
        )

    if positive > 60:

        insights.append({
            "type": "positive",
            "title": "Sentimen Positif",
            "description":
                "Mayoritas pelanggan puas terhadap produk.",
            "priority": "LOW"
        })

    if len(insights) == 0:

        insights.append({
            "type": "positive",
            "title": "Performa Produk Stabil",
            "description":
                "Tidak ditemukan masalah signifikan.",
            "priority": "LOW"
        })

    if len(recommendations) == 0:

        recommendations.append(
            "Pertahankan kualitas produk dan lakukan monitoring berkala."
        )

    return insights, recommendations