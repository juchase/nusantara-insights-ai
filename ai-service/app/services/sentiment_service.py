import joblib
from app.utils.preprocess import clean_text
from app.config.model_paths import SENTIMENT_MODEL_PATH, SENTIMENT_VECTORIZER_PATH

model = joblib.load(SENTIMENT_MODEL_PATH)
vectorizer = joblib.load(SENTIMENT_VECTORIZER_PATH)


def predict_sentiment(text: str) -> str:
    clean = clean_text(text)

    # RULE LAYER

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