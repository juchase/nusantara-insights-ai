import joblib
from app.utils.preprocess import clean_text

model = joblib.load("model/model.pkl")
vectorizer = joblib.load("model/vectorizer.pkl")


def predict_sentiment(text: str) -> str:
    clean = clean_text(text)

    # 🔥 RULE LAYER

    if "tidak_ada_masalah" in clean:
        return "positive"

    if "tidak_sesuai" in clean:
        return "negative"

    if "pengiriman sangat lama" in clean:
        return "negative"

    if "biasa saja" in clean:
        return "neutral"

    # ML
    vec = vectorizer.transform([clean])
    return model.predict(vec)[0]