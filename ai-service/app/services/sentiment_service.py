import joblib
from app.utils.preprocess import clean_text

model = joblib.load("model/model.pkl")
vectorizer = joblib.load("model/vectorizer.pkl")

def predict_sentiment(text):
    clean = clean_text(text)
    vec = vectorizer.transform([clean])
    result = model.predict(vec)[0]
    return result