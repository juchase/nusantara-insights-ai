def build_prompt(
    positive,
    negative,
    trend,
    keyword
):

    return f"""
Anda adalah AI Business Analyst.

Buat insight bisnis singkat berdasarkan data berikut:

- Sentimen positif: {positive:.0f}%
- Sentimen negatif: {negative:.0f}%
- Trend permintaan: {trend}
- Keluhan utama: {keyword}

Tulis maksimal 2 kalimat.
Gunakan Bahasa Indonesia profesional.
Jangan gunakan bullet point.
"""