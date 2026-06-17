def build_prompt(raw_sentences: list, top_recommendation: str) -> str:

    # Prioritaskan kalimat PERTAMA (biasanya berisi nama produk + sentimen)
    # dan kalimat KEDUA (biasanya berisi growth/demand) — jangan dipotong dulu
    # baru batasi total panjang di akhir jika masih kepanjangan
    sentences = raw_sentences[:2]
    rule_text = " ".join(sentences)

    # Batas lebih longgar — cukup untuk 2 kalimat lengkap dengan nama produk
    # (sebelumnya 300 karakter terlalu ketat sampai memotong nama produk)
    if len(rule_text) > 420:
        rule_text = rule_text[:420].rsplit(" ", 1)[0]

    rec_text = top_recommendation[:120] if top_recommendation else ""

    prompt = f"""Tugas: Ubah kalimat analisis bisnis berikut menjadi narasi yang natural dan mudah dipahami. WAJIB sebutkan nama produk dan semua angka yang ada. Tulis 2 kalimat lengkap. Bahasa Indonesia formal.

Contoh:
Input: Produk A mendapat 65% ulasan positif. Permintaan naik 12% dalam 7 hari. Siapkan stok tambahan.
Output: Produk A mendapat respons positif dari 65% pelanggan dengan permintaan diprediksi naik 12% dalam seminggu ke depan. Disarankan segera menyiapkan stok tambahan untuk mengantisipasi kenaikan ini.

Input: {rule_text} {rec_text}
Output:"""

    return prompt