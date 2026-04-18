import pandas as pd
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

from app.utils.preprocess import clean_text

# 📥 Load dataset
df = pd.read_csv("dataset/dataset.csv")

# 🔍 Validasi kolom
if "reviewText" not in df.columns or "sentiment" not in df.columns:
    raise ValueError("Dataset harus punya kolom: reviewText & sentiment")

# 🧹 Clean text
df["clean"] = df["reviewText"].astype(str).apply(clean_text)

# 🧠 Split dulu (ANTI DATA LEAKAGE)
X_train_text, X_test_text, y_train, y_test = train_test_split(
    df["clean"],
    df["sentiment"],
    test_size=0.2,
    random_state=42,
    stratify=df["sentiment"]
)

# 🔥 Vectorizer
vectorizer = TfidfVectorizer(
    ngram_range=(1, 2),
    min_df=2,
    max_df=0.9
)

X_train = vectorizer.fit_transform(X_train_text)
X_test = vectorizer.transform(X_test_text)

# 🔥 Model
model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

# 📊 Evaluasi
y_pred = model.predict(X_test)

print("\n📊 Classification Report:\n")
print(classification_report(y_test, y_pred))

# 💾 Save
joblib.dump(model, "model/model.pkl")
joblib.dump(vectorizer, "model/vectorizer.pkl")

print("\n✅ Model trained & saved!")