import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import joblib
from app.utils.preprocess import clean_text

df = pd.read_csv("dataset/dataset.csv")

df['clean'] = df['reviewText'].apply(clean_text)

vectorizer = TfidfVectorizer(ngram_range=(1,2))
X = vectorizer.fit_transform(df['clean'])

y = df['sentiment']

model = MultinomialNB()
model.fit(X, y)

joblib.dump(model, "model/model.pkl")
joblib.dump(vectorizer, "model/vectorizer.pkl")

print("✅ Model trained & saved!")