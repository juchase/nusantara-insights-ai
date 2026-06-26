def build_prompt(
    raw_sentences: list[str],
    top_recommendation: str,
    growth_display: str = "",
) -> str:
    """
    Membuat prompt dengan contoh gaya naratif yang diinginkan, dan menghindari frasa klise.
    """
    sentiment_text = raw_sentences[0] if raw_sentences else "Sentimen pelanggan secara umum baik."
    if not growth_display:
        growth_display = "meningkat"

    prompt = f"""
Anda adalah asisten bisnis untuk UMKM Indonesia. Tulis narasi bisnis yang natural, mengalir, dan tidak kaku (2–3 kalimat). Ikuti gaya seperti contoh di bawah ini.

Contoh gaya yang diinginkan:
"Sebanyak 98% pelanggan memberikan ulasan positif terhadap produk ini, dan permintaannya diprediksi naik sekitar 11 unit dalam waktu dekat. Dengan tren yang positif, menjaga kualitas layanan dan memantau performa produk secara berkala menjadi langkah tepat untuk mempertahankan kepercayaan pelanggan."

Data Anda saat ini:
- Sentimen pelanggan: {sentiment_text}
- Perkembangan permintaan: {growth_display}
- Rekomendasi yang relevan: {top_recommendation}

Petunjuk:
- Gunakan nama produk yang ada di data sentimen.
- Setelah menyebut nama produk di awal, gunakan "produk ini" atau "tersebut".
- Hindari frasa klise seperti "langkah yang bijak". Gunakan variasi seperti "langkah tepat", "hal penting", atau langsung menyebutkan tindakan yang perlu dilakukan.
- Jangan menulis frasa kaku seperti "rekomendasi yang relevan adalah" atau "disarankan untuk".
- Jangan menambahkan angka atau informasi yang tidak ada.
- Buat narasi yang enak dibaca, bervariasi, dan terlihat manusiawi.
"""
    return prompt.strip()