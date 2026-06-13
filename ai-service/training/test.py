import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.naive_bayes import MultinomialNB
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.utils.preprocess import clean_text

print("🔄 [1/5] Membaca dataset...")
# Membaca data hasil preprocessing prepare_datasets.py
df = pd.read_csv("dataset/output/ulasan_nusantara.csv")

# Validasi kolom sesuai skema baru Bab 3
if "review_text" not in df.columns or "sentiment_label" not in df.columns:
    raise ValueError("Dataset harus punya kolom: review_text & sentiment_label")

print(f"🧹 [2/5] Membersihkan teks ulasan (Total data: {len(df):,} baris)...")
df["clean"] = df["review_text"].astype(str).apply(clean_text)

print("🧠 [3/5] Membagi data train dan test...")
# Pembagian data menggunakan kolom skema baru secara konsisten
X_train_text, X_test_text, y_train, y_test = train_test_split(
    df["clean"],
    df["sentiment_label"],
    test_size=0.2,
    random_state=42,
    stratify=df["sentiment_label"]
)

print("🔥 [4/5] Melakukan ekstraksi fitur TF-IDF (N-Gram 1,2)...")
vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_df=0.9, sublinear_tf=True)
X_train = vectorizer.fit_transform(X_train_text)
X_test = vectorizer.transform(X_test_text)

models = {
    "Logistic Regression": LogisticRegression(max_iter=1000),
    "Linear SVC": LinearSVC(C=1.0, max_iter=2000, random_state=42),
    "Multinomial Naive Bayes": MultinomialNB(alpha=1.0)
}

print("\n🚀 [5/5] Memulai komparasi model di memori...")
print("=" * 50)

for name, model in models.items():
    print(f"⏳ Melatih model {name}...")
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    print(f"▶️ Model: {name} | Akurasi: {acc:.4f}")
    print("-" * 50)
    print(classification_report(y_test, y_pred, digits=4))
    print("=" * 50)

print("\n✅ Semua model selesai diuji!")
