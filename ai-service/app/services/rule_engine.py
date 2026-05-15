def generate_rules(data):

    insights = []
    recommendations = []

    # Demand naik
    if data["growth_percentage"] > 10:
        insights.append(
            f"Permintaan meningkat sebesar {data['growth_percentage']}%"
        )

        recommendations.append(
            "Pertimbangkan menambah stok produk"
        )

    # Negative sentiment tinggi
    if data["negative_sentiment"] > 30:
        insights.append(
            "Sentimen negatif pelanggan meningkat"
        )

        recommendations.append(
            "Evaluasi kualitas layanan pelanggan"
        )

    # Keyword pengiriman
    if data["top_keyword"] == "pengiriman":
        recommendations.append(
            "Optimalkan proses logistik dan pengiriman"
        )

    return {
        "severity": "medium",
        "insights": insights,
        "recommendations": recommendations
    }