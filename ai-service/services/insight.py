def generate_insight(sentiment, keywords):
    if not keywords:
        return "Belum ada insight"

    top_keyword = keywords[0][0]

    # 🔥 Rule spesifik (biar kelihatan pintar)
    if top_keyword == "pengiriman":
        return "Keluhan terbesar ada pada pengiriman. Disarankan menggunakan jasa ekspedisi yang lebih cepat."

    if top_keyword == "kemasan":
        return "Banyak keluhan terkait kemasan. Disarankan meningkatkan kualitas packaging produk."

    total = sentiment["positive"] + sentiment["neutral"] + sentiment["negative"]
    negative_rate = sentiment["negative"] / (total or 1)

    if negative_rate > 0.3:
        return f"Banyak pelanggan mengeluhkan '{top_keyword}'. Segera lakukan perbaikan."
    elif negative_rate > 0.15:
        return f"Terdapat beberapa keluhan terkait '{top_keyword}'. Perlu perhatian lebih."
    else:
        return f"Mayoritas pelanggan puas. Namun tetap perhatikan '{top_keyword}'."