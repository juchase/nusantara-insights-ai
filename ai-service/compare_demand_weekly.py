# compare_demand_weekly.py
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import time

try:
    import lightgbm as lgb
    LGB_AVAILABLE = True
except:
    LGB_AVAILABLE = False
try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except:
    XGB_AVAILABLE = False

DATA_PATH = "dataset/output/penjualan_nusantara.csv"

print("📂 Membaca dataset...")
df = pd.read_csv(DATA_PATH)
df['date'] = pd.to_datetime(df['date'])

# Pilih produk dengan data terbanyak (sama seperti sebelumnya)
product_counts = df['product_id'].value_counts()
PRODUCT_ID = product_counts.index[0]
print(f"Produk: {PRODUCT_ID}")

df_prod = df[df['product_id'] == PRODUCT_ID].copy()

# Agregasi per hari dulu, kemudian per minggu
daily = df_prod.groupby('date')['units_sold'].sum().reset_index()
daily.columns = ['date', 'sales']
daily = daily.set_index('date').asfreq('D', fill_value=0).reset_index()
daily.columns = ['date', 'sales']

# Buat kolom year-week
daily['year_week'] = daily['date'].dt.isocalendar().year.astype(str) + '-' + daily['date'].dt.isocalendar().week.astype(str)
weekly = daily.groupby('year_week')['sales'].sum().reset_index()
weekly['date_start'] = weekly['year_week'].apply(lambda x: pd.to_datetime(x.split('-')[0] + '-W' + x.split('-')[1] + '-1', format='%G-W%V-%u'))
weekly = weekly.sort_values('date_start').reset_index(drop=True)
weekly = weekly[['date_start', 'sales']]
weekly.columns = ['date', 'sales']

print(f"Aggregasi mingguan: {len(weekly)} minggu")
print(f"Rentang: {weekly['date'].min()} s/d {weekly['date'].max()}")
print(f"Minggu dengan sales=0: {(weekly['sales']==0).sum()} minggu ({(weekly['sales']==0).mean()*100:.1f}%)")

# Feature engineering untuk mingguan
def create_weekly_features(df):
    df = df.copy()
    df['weekofyear'] = df['date'].dt.isocalendar().week
    df['month'] = df['date'].dt.month
    df['quarter'] = df['date'].dt.quarter
    # Lag 1,2,3 minggu
    for lag in [1, 2, 3]:
        df[f'lag_{lag}'] = df['sales'].shift(lag)
    # Rolling mean 3 minggu
    df['rolling_mean_3'] = df['sales'].rolling(window=3, min_periods=1).mean().shift(1)
    # Hapus NaN
    df = df.dropna().reset_index(drop=True)
    return df

weekly_feat = create_weekly_features(weekly)

# Split (80% train, 20% test) berdasarkan urutan waktu
train_size = int(len(weekly_feat) * 0.8)
train = weekly_feat.iloc[:train_size]
test = weekly_feat.iloc[train_size:]

feature_cols = ['weekofyear', 'month', 'quarter', 'lag_1', 'lag_2', 'lag_3', 'rolling_mean_3']
X_train = train[feature_cols]
y_train = train['sales']
X_test = test[feature_cols]
y_test = test['sales']

print(f"\nTrain: {len(train)} minggu, Test: {len(test)} minggu")

models = {'LinearRegression': LinearRegression()}
models['RandomForest'] = RandomForestRegressor(n_estimators=100, random_state=42)
if LGB_AVAILABLE:
    models['LightGBM'] = lgb.LGBMRegressor(n_estimators=100, verbose=-1)
if XGB_AVAILABLE:
    models['XGBoost'] = xgb.XGBRegressor(n_estimators=100, verbosity=0)

results = []
for name, model in models.items():
    print(f"\n--- {name} ---")
    start = time.time()
    model.fit(X_train, y_train)
    t = time.time() - start
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    mape = np.mean(np.abs((y_test - y_pred) / (y_test + 1e-6))) * 100
    results.append([name, rmse, mae, mape, r2, t])
    print(f"  RMSE: {rmse:.2f}, MAE: {mae:.2f}, MAPE: {mape:.2f}%, R2: {r2:.4f}, Time: {t:.3f}s")

print("\n=== RINGKASAN (mingguan) ===")
df_res = pd.DataFrame(results, columns=['Model','RMSE','MAE','MAPE','R2','Time']).sort_values('RMSE')
print(df_res.to_string(index=False))

# Simpan model terbaik
best = df_res.iloc[0]['Model']
print(f"\n🏆 Model terbaik untuk data mingguan: {best}")