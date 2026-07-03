# compare_demand_models.py
"""
Membandingkan model demand forecasting menggunakan data real dari penjualan_nusantara.csv
Dataset: transaction_id, date, product_id, units_sold, unit_price, promotion_flag, stock_level
Agregasi per product (pilih product dengan data terbanyak)
"""

import pandas as pd
import numpy as np
import time
import warnings
warnings.filterwarnings('ignore')

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib

# Import optional models
try:
    import lightgbm as lgb
    LGB_AVAILABLE = True
except ImportError:
    LGB_AVAILABLE = False
    print("[INFO] LightGBM tidak terinstall. Jalankan: pip install lightgbm")

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False
    print("[INFO] XGBoost tidak terinstall. Jalankan: pip install xgboost")

# Konfigurasi
DATA_PATH = "dataset/output/penjualan_nusantara.csv"
# Optional: tentukan product_id tertentu, jika None akan ambil produk dengan data terbanyak
PRODUCT_ID = None  # contoh: "PROD123" atau None

# ==================================================
# 1. BACA DATA
# ==================================================
print("📂 Membaca dataset...")
df = pd.read_csv(DATA_PATH)
print(f"Total baris: {len(df):,}")
print(f"Kolom: {df.columns.tolist()}")

# Pastikan kolom date dan units_sold ada
if 'date' not in df.columns or 'units_sold' not in df.columns:
    raise ValueError("Dataset harus memiliki kolom 'date' dan 'units_sold'")

# Konversi date ke datetime
df['date'] = pd.to_datetime(df['date'])

# ==================================================
# 2. PILIH SATU PRODUK (atau user tentukan)
# ==================================================
if PRODUCT_ID is None:
    # Pilih produk dengan jumlah transaksi terbanyak
    product_counts = df['product_id'].value_counts()
    PRODUCT_ID = product_counts.index[0]
    print(f"Produk dengan data terbanyak: {PRODUCT_ID} ({product_counts.iloc[0]} transaksi)")
else:
    if PRODUCT_ID not in df['product_id'].values:
        raise ValueError(f"Product ID {PRODUCT_ID} tidak ditemukan")
    print(f"Menggunakan produk: {PRODUCT_ID}")

# Filter data untuk product tersebut
df_prod = df[df['product_id'] == PRODUCT_ID].copy()
print(f"Data produk: {len(df_prod)} baris")

# ==================================================
# 3. AGREGASI PER HARI (units_sold)
# ==================================================
daily = df_prod.groupby('date')['units_sold'].sum().reset_index()
daily = daily.sort_values('date').reset_index(drop=True)
daily.columns = ['date', 'sales']
print(f"Rentang tanggal: {daily['date'].min()} s/d {daily['date'].max()}")
print(f"Total hari dengan penjualan: {len(daily)}")

# Cek missing dates? Kita akan isi dengan 0 untuk hari tanpa penjualan
full_date_range = pd.date_range(start=daily['date'].min(), end=daily['date'].max(), freq='D')
daily = daily.set_index('date').reindex(full_date_range, fill_value=0).reset_index()
daily.columns = ['date', 'sales']
print(f"Setelah mengisi hari kosong: {len(daily)} hari (nilai 0 untuk hari tanpa transaksi)")

# ==================================================
# 4. FEATURE ENGINEERING
# ==================================================
def create_features(df):
    df = df.copy()
    # Fitur tanggal
    df['day'] = df['date'].dt.day
    df['month'] = df['date'].dt.month
    df['dayofweek'] = df['date'].dt.dayofweek  # 0=Senin, 6=Minggu
    df['weekend'] = (df['dayofweek'] >= 5).astype(int)
    
    # Lag features
    for lag in [1, 2, 3, 7]:
        df[f'lag_{lag}'] = df['sales'].shift(lag)
    
    # Rolling mean (hanya berdasarkan data sebelumnya)
    df['rolling_mean_3'] = df['sales'].rolling(window=3, min_periods=1).mean().shift(1)
    df['rolling_mean_7'] = df['sales'].rolling(window=7, min_periods=1).mean().shift(1)
    
    # Hapus baris dengan NaN (akibat lag)
    df = df.dropna().reset_index(drop=True)
    return df

daily_feat = create_features(daily)
print(f"Setelah feature engineering: {len(daily_feat)} baris (hilang {len(daily)-len(daily_feat)} baris awal karena lag)")

# ==================================================
# 5. SPLIT DATA (time series: 80% train, 20% test)
# ==================================================
train_size = int(len(daily_feat) * 0.8)
train = daily_feat.iloc[:train_size]
test = daily_feat.iloc[train_size:]

feature_cols = ['day', 'month', 'dayofweek', 'weekend',
                'lag_1', 'lag_2', 'lag_3', 'lag_7',
                'rolling_mean_3', 'rolling_mean_7']
X_train = train[feature_cols]
y_train = train['sales']
X_test = test[feature_cols]
y_test = test['sales']

print(f"\nSplit data: Train = {len(train)} hari, Test = {len(test)} hari")
print(f"Fitur yang digunakan: {feature_cols}")

# ==================================================
# 6. DEFINE MODEL
# ==================================================
models = {}
models['LinearRegression'] = LinearRegression()
models['RandomForest'] = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
if LGB_AVAILABLE:
    models['LightGBM'] = lgb.LGBMRegressor(n_estimators=100, learning_rate=0.1, random_state=42, verbose=-1)
if XGB_AVAILABLE:
    models['XGBoost'] = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, random_state=42, verbosity=0)

# ==================================================
# 7. EVALUASI
# ==================================================
results = []

for name, model in models.items():
    print(f"\n--- Training {name} ---")
    start = time.time()
    model.fit(X_train, y_train)
    train_time = time.time() - start
    
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    rmse_train = np.sqrt(mean_squared_error(y_train, y_pred_train))
    rmse_test = np.sqrt(mean_squared_error(y_test, y_pred_test))
    mae_train = mean_absolute_error(y_train, y_pred_train)
    mae_test = mean_absolute_error(y_test, y_pred_test)
    r2_train = r2_score(y_train, y_pred_train)
    r2_test = r2_score(y_test, y_pred_test)
    mape_test = np.mean(np.abs((y_test - y_pred_test) / (y_test + 1e-6))) * 100
    
    results.append({
        'model': name,
        'train_time_sec': train_time,
        'rmse_train': rmse_train,
        'rmse_test': rmse_test,
        'mae_train': mae_train,
        'mae_test': mae_test,
        'r2_train': r2_train,
        'r2_test': r2_test,
        'mape_test': mape_test
    })
    
    print(f"  Time: {train_time:.3f}s | RMSE test: {rmse_test:.2f} | MAE: {mae_test:.2f} | MAPE: {mape_test:.2f}% | R²: {r2_test:.4f}")

# ==================================================
# 8. RINGKASAN & SIMPAN MODEL TERBAIK
# ==================================================
df_results = pd.DataFrame(results).sort_values('rmse_test')
print("\n" + "="*60)
print("📊 PERINGKAT MODEL (berdasarkan RMSE test terkecil):")
print("="*60)
print(df_results[['model', 'rmse_test', 'mae_test', 'mape_test', 'r2_test', 'train_time_sec']].to_string(index=False))

best_name = df_results.iloc[0]['model']
best_model = models[best_name]
print(f"\n🏆 Model terbaik: {best_name} (RMSE = {df_results.iloc[0]['rmse_test']:.2f})")

# Simpan model terbaik ke path yang digunakan di API
try:
    from app.config.model_paths import DEMAND_MODEL_PATH
    print(f"\n🔄 Melatih ulang {best_name} dengan seluruh data ({len(daily_feat)} hari)...")
    X_all = daily_feat[feature_cols]
    y_all = daily_feat['sales']
    best_model.fit(X_all, y_all)
    joblib.dump(best_model, DEMAND_MODEL_PATH)
    print(f"✅ Model disimpan ke {DEMAND_MODEL_PATH}")
    
    # Simpan metadata fitur
    meta = {'feature_columns': feature_cols, 'product_id': PRODUCT_ID}
    joblib.dump(meta, DEMAND_MODEL_PATH.replace('.pkl', '_meta.pkl'))
    print("Metadata fitur dan product_id juga disimpan.")
except Exception as e:
    print(f"⚠️ Gagal menyimpan model: {e}")
    # Simpan lokal sebagai backup
    joblib.dump(best_model, "best_demand_model.pkl")
    print("Model terbaik disimpan sebagai best_demand_model.pkl")

print("\n✅ Perbandingan selesai.")