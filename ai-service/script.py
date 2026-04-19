from app.services.sentiment_service import predict_sentiment

tests = [
    "produk sangat bagus",
    "pengiriman sangat lama",
    "biasa saja",
    "tidak ada masalah",
    "tidak sesuai deskripsi",
]

for t in tests:
    print(t, "=>", predict_sentiment(t))