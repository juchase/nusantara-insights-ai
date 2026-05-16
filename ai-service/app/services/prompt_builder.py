def build_prompt(raw_sentences: list, top_recommendation: str) -> str:

    # Gabung max 2 kalimat dari rule engine sebagai input
    rule_text = " ".join(raw_sentences[:2])

    # Few-shot: kasih 3 contoh konkret input → output
    prompt = f"""Tugas: Ubah kalimat analisis bisnis menjadi lebih natural dan mudah dipahami. Tetap gunakan angka yang ada. Maksimal 3 kalimat. Bahasa Indonesia formal.

Contoh 1:
Input: Sebanyak 65% ulasan pelanggan bersifat positif. Permintaan produk diprediksi meningkat sebesar 12% dalam 7 hari ke depan. Siapkan stok tambahan untuk mengantisipasi kenaikan permintaan.
Output: Produk ini mendapat sambutan baik dari pelanggan dengan 65% ulasan positif. Permintaan diprediksi naik 12% dalam seminggu ke depan, sehingga disarankan untuk menyiapkan stok tambahan.

Contoh 2:
Input: Sebanyak 45% ulasan pelanggan bersifat negatif. Keluhan utama pelanggan berfokus pada layanan pengiriman. Evaluasi mitra ekspedisi dan pertimbangkan penambahan opsi pengiriman yang lebih cepat.
Output: Hampir separuh pelanggan (45%) memberikan ulasan negatif, dengan keluhan utama pada layanan pengiriman. Disarankan untuk mengevaluasi mitra ekspedisi dan menambah opsi pengiriman yang lebih cepat.

Contoh 3:
Input: Permintaan produk diprediksi menurun sebesar 8% dalam 7 hari ke depan. Sentimen pelanggan cenderung netral dengan 40% ulasan positif. Tinjau strategi promosi untuk mendorong kembali minat pelanggan.
Output: Permintaan diprediksi turun 8% dalam seminggu ke depan disertai sentimen pelanggan yang masih netral. Peninjauan strategi promosi perlu segera dilakukan untuk mendorong kembali minat pelanggan.

Sekarang:
Input: {rule_text} {top_recommendation}
Output:"""

    return prompt