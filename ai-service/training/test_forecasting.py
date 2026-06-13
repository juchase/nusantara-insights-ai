import pandas as pd
import numpy as np
from datetime import timedelta
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from prophet import Prophet
import lightgbm as lgb
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import warnings
warnings.filterwarnings('ignore')

print("🔄 [1/5] Membaca dataset penjualan hasil preprocessing...")
df = pd.read_csv("dataset/output/penjualan_nusantara.csv")

# Pastikan tipe data tanggal benar
df['date'] = pd.to_datetime(df['date'])

# Ambil satu produk dengan data paling banyak/agresif untuk uji coba
all_products = df['product_id'].unique()
target_product = all_products[0] if len(all_products) > 0 else "MI-006"
df_product = df[df['product_id'] == target_product].sort_values('date')

print(f"📦 [2/5] Mengisolasi Produk ID: {target_product} (Total historis: {len(df_product)} hari)...")

# Group by date jika ada transaksi ganda di hari yang sama
df_ts = df_product.groupby('date')['units_sold'].sum().reset_index()

# 🧠 [3/5] TIME-BASED SPLIT (7 Hari Terakhir sebagai Test Set)
split_date = df_ts['date'].max() - timedelta(days=6)
train_df = df_ts[df_ts['date'] < split_date].reset_index(drop=True)
test_df = df_ts[df_ts['date'] >= split_date].reset_index(drop=True)

actual_sales = test_df['units_sold'].values
print(f"📅 Data Latih: {train_df['date'].min().strftime('%Y-%m-%d')} s/d {train_df['date'].max().strftime('%Y-%m-%d')}")
print(f"📅 Data Uji (7 Hari): {test_df['date'].min().strftime('%Y-%m-%d')} s/d {test_df['date'].max().strftime('%Y-%m-%d')}")

print("\n🚀 [4/5] Melatih dan Memprediksi dengan 4 Model...")
print("=" * 60)

# ─────────────────────────────────────────────────────────────────────────
# MODEL 1: META PROPHET
# ─────────────────────────────────────────────────────────────────────────
print("⏳ Menghitung Meta Prophet...")
prophet_train = train_df.rename(columns={'date': 'ds', 'units_sold': 'y'})
model_prophet = Prophet(weekly_seasonality=True, yearly_seasonality=False, daily_seasonality=False, seasonality_mode='multiplicative')
model_prophet.fit(prophet_train)

future_prophet = model_prophet.make_future_dataframe(periods=7, freq='D')
forecast_prophet = model_prophet.predict(future_prophet)
pred_prophet = forecast_prophet['yhat'].tail(7).values

# ─────────────────────────────────────────────────────────────────────────
# MODEL 2: EXPONENTIAL SMOOTHING (HOLT-WINTERS)
# ─────────────────────────────────────────────────────────────────────────
print("⏳ Menghitung Exponential Smoothing (Holt-Winters)...")
try:
    model_hw = ExponentialSmoothing(train_df['units_sold'], seasonal_periods=7, trend='add', seasonal='add').fit()
    pred_hw = model_hw.forecast(7).values
except:
    pred_hw = np.full(7, train_df['units_sold'].mean())

# ─────────────────────────────────────────────────────────────────────────
# MODEL 3: LIGHTGBM (TABULAR TIME SERIES)
# ─────────────────────────────────────────────────────────────────────────
print("⏳ Menghitung LightGBM Tabular...")
def create_features(data_frame):
    df_feat = data_frame.copy()
    df_feat['dayofweek'] = df_feat['date'].dt.dayofweek
    df_feat['dayofmonth'] = df_feat['date'].dt.day
    df_feat['lag_7'] = df_feat['units_sold'].shift(7)
    return df_feat.dropna()

df_features = create_features(df_ts)
train_lgb = df_features[df_features['date'] < split_date]
test_lgb = df_features[df_features['date'] >= split_date]

if len(train_lgb) > 10:
    X_train_lgb = train_lgb[['dayofweek', 'dayofmonth', 'lag_7']]
    y_train_lgb = train_lgb['units_sold']
    X_test_lgb = test_lgb[['dayofweek', 'dayofmonth', 'lag_7']]
    
    model_lgb = lgb.LGBMRegressor(n_estimators=50, random_state=42, verbose=-1)
    model_lgb.fit(X_train_lgb, y_train_lgb)
    pred_lgb = model_lgb.predict(X_test_lgb)
else:
    pred_lgb = np.full(7, train_df['units_sold'].mean())

# ─────────────────────────────────────────────────────────────────────────
# MODEL 4: ADAPTIVE POLYNOMIAL REGRESSION (NEW 🔥)
# ─────────────────────────────────────────────────────────────────────────
print("⏳ Menghitung Adaptive Polynomial Regression...")
# Membuat fitur indeks waktu linear (t = 1, 2, 3, ...)
t_train = np.array(train_df.index).reshape(-1, 1)
t_test = np.array(range(len(train_df), len(train_df) + 7)).reshape(-1, 1)
y_train_poly = train_df['units_sold'].values

best_mae = float('inf')
pred_poly = np.zeros(7)
best_degree = 1

# Proses ADAPTIVE: Mencari derajat (degree 1 sampai 5) yang paling minim eror di data latih
for degree in range(1, 6):
    poly_features = PolynomialFeatures(degree=degree)
    X_poly_train = poly_features.fit_transform(t_train)
    X_poly_test = poly_features.transform(t_test)
    
    tmp_model = LinearRegression()
    tmp_model.fit(X_poly_train, y_train_poly)
    
    # Validasi internal pada 7 hari terakhir dari data latih untuk memilih degree terbaik
    in_sample_pred = tmp_model.predict(X_poly_train[-7:])
    tmp_mae = mean_absolute_error(y_train_poly[-7:], in_sample_pred)
    
    if tmp_mae < best_mae:
        best_mae = tmp_mae
        best_degree = degree
        pred_poly = tmp_model.predict(X_poly_test)

print(f"   ℹ️ Derajat Polinomial Terpilih (Adaptive): Derajat {best_degree}")

# ─────────────────────────────────────────────────────────────────────────
# 📊 [5/5] EVALUASI DAN METRIKS KOMPARASI KESELURUHAN
# ─────────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("=== HASIL PERBANDINGAN EVALUASI FORECASTING (4 MODEL) ===")
print("=" * 60)

results = {
    "Meta Prophet": pred_prophet,
    "Holt-Winters HW": pred_hw,
    "LightGBM Regressor": pred_lgb,
    f"Adaptive Poly Reg (Deg-{best_degree})": pred_poly
}

for name, pred in results.items():
    # Mengamankan nilai prediksi agar tidak bernilai minus (penjualan minimal 0)
    clean_pred = np.clip(pred, 0, None)
    
    mae = mean_absolute_error(actual_sales, clean_pred)
    rmse = root_mean_squared_error(actual_sales, clean_pred)
    
    print(f"\n▶️ Model: {name}")
    print(f"   Nilai Eror MAE  : {mae:.4f}  (Semakin mendekati 0 = Semakin Akurat)")
    print(f"   Nilai Eror RMSE : {rmse:.4f} (Mengukur sensitivitas lonjakan agresif)")
    print(f"   Hasil Prediksi 7 Hari: {np.round(clean_pred, 1).tolist()}")
    print("-" * 60)

print(f"📊 Data Aktual Riil Sebenarnya: {actual_sales.tolist()}")