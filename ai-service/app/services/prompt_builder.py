def build_prompt(raw_sentences: list, top_recommendation: str) -> str:

    # Gabung maksimal 3 kalimat dari rule engine (bukan 2)
    # agar konteks lebih lengkap untuk LLM
    rule_text = " ".join(raw_sentences[:3])

    prompt = f"""Tugas: Ubah kalimat analisis bisnis berikut menjadi narasi yang lebih natural dan mudah dipahami pelaku UMKM. Gunakan semua angka yang ada. Tulis 2-3 kalimat lengkap. Akhiri setiap kalimat dengan tanda titik. Bahasa Indonesia formal.

Contoh 1:
Input: Produk A menerima 65% ulasan positif dari total pelanggan. Permintaan produk diprediksi meningkat sebesar 12% dalam periode mendatang, perlu kesiapan stok tambahan. Siapkan stok tambahan untuk mengantisipasi kenaikan permintaan 12% dalam 7 hari ke depan.
Output: Produk A mendapat respons positif dari pelanggan dengan 65% ulasan yang memuaskan. Permintaan diprediksi naik 12% dalam 7 hari ke depan, sehingga disarankan untuk segera menyiapkan stok tambahan agar tidak terjadi kehabisan produk.

Contoh 2:
Input: Produk B menerima 48% ulasan negatif dari total pelanggan, menunjukkan adanya ketidakpuasan yang perlu segera ditangani. Permintaan produk diprediksi menurun sebesar 22% dalam periode mendatang. Keluhan utama pelanggan berfokus pada layanan pengiriman yang lambat atau bermasalah.
Output: Hampir separuh pelanggan (48%) memberikan ulasan negatif terhadap Produk B, terutama terkait layanan pengiriman. Permintaan diprediksi turun 22% dalam 7 hari ke depan, sehingga evaluasi mitra ekspedisi perlu segera dilakukan untuk mencegah penurunan lebih lanjut.

Contoh 3:
Input: Mayoritas pelanggan (72%) memberikan ulasan positif terhadap Produk C. Permintaan relatif stabil dalam periode mendatang. Pertahankan kualitas layanan dan pantau performa produk secara berkala.
Output: Produk C mendapat apresiasi tinggi dari pelanggan dengan 72% ulasan positif dan permintaan yang stabil. Disarankan untuk terus mempertahankan kualitas produk dan layanan agar kepuasan pelanggan tetap terjaga.

Sekarang:
Input: {rule_text} {top_recommendation}
Output:"""

    return prompt