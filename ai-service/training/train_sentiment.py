import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC # <-- Menggunakan Linear SVC sebagai core AI pemenang
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import sys
import os

# Set path agar bisa membaca modul utilitas aplikasi
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.utils.preprocess import clean_text
from app.config.model_paths import SENTIMENT_MODEL_PATH, SENTIMENT_VECTORIZER_PATH

print("🔄 Loading dataset ulasan hasil preprocessing...")
df = pd.read_csv("dataset/output/ulasan_nusantara.csv")

print("🧹 Membersihkan teks menggunakan utilitas web...")
df["clean"] = df["review_text"].astype(str).apply(clean_text)

print("🧠 Membagi data train dan test (80:20)...")
X_train_text, X_test_text, y_train, y_test = train_test_split(
    df["clean"],
    df["sentiment_label"],
    test_size=0.2,
    random_state=42,
    stratify=df["sentiment_label"]
)

print("🔥 Membuat ekstraksi fitur TF-IDF (Konfigurasi sublinear_tf)...")
vectorizer = TfidfVectorizer(
    ngram_range=(1, 2),
    min_df=2,
    max_df=0.9,
    sublinear_tf=True
)

X_train = vectorizer.fit_transform(X_train_text)
X_test = vectorizer.transform(X_test_text)

print("🚀 Melatih model Linear SVC untuk sistem produksi web...")
# C=1.0 dan random_state dikunci sesuai parameter eksperimen yang sukses tadi
model = LinearSVC(C=1.0, max_iter=2000, random_state=42)
model.fit(X_train, y_train)

# Evaluasi akhir sebelum disimpan
y_pred = model.predict(X_test)
print("\n📊 Hasil Evaluasi Akhir Model Produksi:\n")
print(classification_report(y_test, y_pred, digits=4))

# 💾 MENYIMPAN MODEL SECARA RESMI (Menggantikan model Logistic Regression lama)
print("💾 Menyimpan model dan vectorizer baru ke direktori aplikasi...")
joblib.dump(model, SENTIMENT_MODEL_PATH)
joblib.dump(vectorizer, SENTIMENT_VECTORIZER_PATH)

print("\n✅ Model Linear SVC sukses dilatih dan diintegrasikan ke website NusantaraInsight AI!")
