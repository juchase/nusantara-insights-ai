# train_two_stage_demand.py (perbaikan final)
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, precision_score, recall_score, mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
import joblib
import warnings
warnings.filterwarnings('ignore')

# ==================================================
# 1. Baca data
# ==================================================
DATA_PATH = "dataset/output/penjualan_nusantara.csv"
print("📂 Membaca dataset...")
df = pd.read_csv(DATA_PATH)
df['date'] = pd.to_datetime(df['date'])

# Pilih produk dengan data terbanyak
product_counts = df['product_id'].value_counts()
PRODUCT_ID = product_counts.index[0]
print(f"Produk: {PRODUCT_ID} ({product_counts.iloc[0]} transaksi)")

df_prod = df[df['product_id'] == PRODUCT_ID].copy()

# ==================================================
# 2. Agregasi harian
# ==================================================
daily = df_prod.groupby('date').agg(
    sales=('units_sold', 'sum'),
    promotion_flag=('promotion_flag', 'max'),
    stock_level=('stock_level', 'mean')
).reset_index()

min_date = daily['date'].min()
max_date = daily['date'].max()
all_dates = pd.date_range(start=min_date, end=max_date, freq='D')
daily = daily.set_index('date').reindex(all_dates, fill_value=0).reset_index()
daily.rename(columns={'index': 'date'}, inplace=True)

daily['stock_level'] = daily['stock_level'].replace(0, np.nan).ffill().fillna(0)
daily['promotion_flag'] = daily['promotion_flag'].fillna(0)

print(f"Rentang tanggal: {min_date.date()} s/d {max_date.date()}")
print(f"Total hari: {len(daily)}")
print(f"Hari dengan sales > 0: {(daily['sales']>0).sum()} ({((daily['sales']>0).mean()*100):.1f}%)")

# ==================================================
# 3. Feature Engineering
# ==================================================
def create_features(df):
    df = df.copy()
    df['day'] = df['date'].dt.day
    df['month'] = df['date'].dt.month
    df['dayofweek'] = df['date'].dt.dayofweek
    df['weekend'] = (df['dayofweek'] >= 5).astype(int)
    
    for lag in [1, 2, 3, 7]:
        df[f'sales_lag_{lag}'] = df['sales'].shift(lag)
    
    df['sales_rolling_mean_3'] = df['sales'].rolling(window=3, min_periods=1).mean().shift(1)
    df['sales_rolling_mean_7'] = df['sales'].rolling(window=7, min_periods=1).mean().shift(1)
    
    for lag in [1, 7]:
        df[f'promo_lag_{lag}'] = df['promotion_flag'].shift(lag)
        df[f'stock_lag_{lag}'] = df['stock_level'].shift(lag)
    
    df = df.dropna().reset_index(drop=True)
    return df

daily_feat = create_features(daily)
print(f"Setelah feature engineering: {len(daily_feat)} baris")

feature_cols = ['day', 'month', 'dayofweek', 'weekend',
                'sales_lag_1', 'sales_lag_2', 'sales_lag_3', 'sales_lag_7',
                'sales_rolling_mean_3', 'sales_rolling_mean_7',
                'promotion_flag', 'promo_lag_1', 'promo_lag_7',
                'stock_level', 'stock_lag_1', 'stock_lag_7']

X = daily_feat[feature_cols]
y_sales = daily_feat['sales']
y_clf = (daily_feat['sales'] > 0).astype(int)

# ==================================================
# 4. Split dengan stratifikasi untuk menjaga positif di test
# ==================================================
print("\nMelakukan split data (80/20) dengan stratifikasi...")
X_train, X_test, y_clf_train, y_clf_test, y_sales_train, y_sales_test = train_test_split(
    X, y_clf, y_sales, test_size=0.2, random_state=42, stratify=y_clf
)

print(f"Train: {len(X_train)} hari, Test: {len(X_test)} hari")
print(f"Proporsi positif di train: {y_clf_train.mean():.3f}, test: {y_clf_test.mean():.3f}")

# ==================================================
# 5. Model Dua Tahap
# ==================================================
print("\n=== Model Dua Tahap (Hurdle) ===")

# Tahap 1: Klasifikasi
clf_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
clf_model.fit(X_train, y_clf_train)
y_clf_pred = clf_model.predict(X_test)
y_clf_proba = clf_model.predict_proba(X_test)

# Penanganan jika hanya 1 kelas (misal semua prediksi 0)
if y_clf_proba.shape[1] == 1:
    # Jika hanya satu kolom, artinya hanya kelas 0. Kita buat proba kelas 1 = 0
    y_clf_proba_1 = np.zeros(len(y_clf_proba))
    print("Warning: Classifier hanya memprediksi satu kelas (semua 0). Proba kelas 1 di-set 0.")
else:
    y_clf_proba_1 = y_clf_proba[:, 1]

acc = accuracy_score(y_clf_test, y_clf_pred)
prec = precision_score(y_clf_test, y_clf_pred, zero_division=0)
rec = recall_score(y_clf_test, y_clf_pred, zero_division=0)
print(f"  Classifier - Acc: {acc:.4f}, Prec: {prec:.4f}, Rec: {rec:.4f}")

# Tahap 2: Regresi hanya pada data positif
train_pos_idx = y_sales_train > 0
if train_pos_idx.sum() == 0:
    print("Error: Tidak ada data positif di train set. Tidak bisa melatih regressor.")
    exit()
X_train_pos = X_train[train_pos_idx]
y_train_pos = y_sales_train[train_pos_idx]
print(f"  Data positif untuk regresi: {len(X_train_pos)} hari")
reg_model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
reg_model.fit(X_train_pos, y_train_pos)

# Prediksi hurdle
y_pred_hurdle = y_clf_proba_1 * reg_model.predict(X_test)
rmse_h = np.sqrt(mean_squared_error(y_sales_test, y_pred_hurdle))
mae_h = mean_absolute_error(y_sales_test, y_pred_hurdle)
mape_h = np.mean(np.abs((y_sales_test - y_pred_hurdle) / (y_sales_test + 1e-6))) * 100
r2_h = r2_score(y_sales_test, y_pred_hurdle)
print(f"\nHurdle Model - Test set:")
print(f"  RMSE: {rmse_h:.2f}, MAE: {mae_h:.2f}, MAPE: {mape_h:.2f}%, R²: {r2_h:.4f}")

# ==================================================
# 6. Regresi Langsung sebagai pembanding
# ==================================================
print("\n=== Regresi Langsung (RandomForest) ===")
reg_direct = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
reg_direct.fit(X_train, y_sales_train)
y_pred_direct = reg_direct.predict(X_test)
rmse_d = np.sqrt(mean_squared_error(y_sales_test, y_pred_direct))
mae_d = mean_absolute_error(y_sales_test, y_pred_direct)
mape_d = np.mean(np.abs((y_sales_test - y_pred_direct) / (y_sales_test + 1e-6))) * 100
r2_d = r2_score(y_sales_test, y_pred_direct)
print(f"  RMSE: {rmse_d:.2f}, MAE: {mae_d:.2f}, MAPE: {mape_d:.2f}%, R²: {r2_d:.4f}")

# ==================================================
# 7. Simpan model dan metadata
# ==================================================
import os
os.makedirs("models", exist_ok=True)
joblib.dump(clf_model, "models/demand_clf.pkl")
joblib.dump(reg_model, "models/demand_reg.pkl")
joblib.dump(feature_cols, "models/demand_features.pkl")
print("\n✅ Model dua tahap disimpan di folder models/")