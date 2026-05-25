from app.utils.db import SessionLocal
from sqlalchemy import text
import numpy as np
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import Pipeline
from sklearn.linear_model import Ridge
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
from datetime import datetime, timedelta
import uuid

# ─────────────────────────────────────────
# LANGKAH 1 — DIAGNOSA DATA
# ─────────────────────────────────────────

def diagnose_data(sales: list) -> dict:
    arr = np.array(sales, dtype=float)

    mean     = float(np.mean(arr))
    std      = float(np.std(arr))
    cv       = (std / mean * 100) if mean > 0 else 999

    # Autocorrelation lag-1
    # Mendekati 1 = ada pola kuat, mendekati 0 = random
    if len(arr) > 2:
        autocorr = float(np.corrcoef(arr[:-1], arr[1:])[0, 1])
        if np.isnan(autocorr):
            autocorr = 0.0
    else:
        autocorr = 0.0

    # Verdict berdasarkan CV dan autocorrelation
    if cv > 60 and abs(autocorr) < 0.3:
        verdict       = "volatile_random"
        recommendation = "smooth + polynomial"
    elif cv > 60 and abs(autocorr) >= 0.3:
        verdict        = "volatile_with_pattern"
        recommendation = "smooth + polynomial"
    elif cv <= 60 and abs(autocorr) >= 0.3:
        verdict        = "stable_with_pattern"
        recommendation = "polynomial only"
    else:
        verdict        = "stable_no_pattern"
        recommendation = "linear sufficient"

    print(f"📊 DIAGNOSA: CV={cv:.1f}% | autocorr={autocorr:.3f} | verdict={verdict}")
    print(f"💡 REKOMENDASI: {recommendation}")

    return {
        "mean":           round(mean, 1),
        "std":            round(std, 1),
        "cv_pct":         round(cv, 1),
        "autocorr":       round(autocorr, 3),
        "data_points":    len(arr),
        "verdict":        verdict,
        "recommendation": recommendation,
    }


# ─────────────────────────────────────────
# LANGKAH 2 — SMOOTHING (jika volatile)
# ─────────────────────────────────────────

def smooth_sales(sales: list, window: int = 3) -> list:
    """
    Moving average untuk reduksi noise.
    Dipakai kalau CV > 60% (data volatile).
    """
    if len(sales) < window:
        return sales

    smoothed = []
    for i in range(len(sales)):
        start = max(0, i - window + 1)
        smoothed.append(round(float(np.mean(sales[start:i + 1])), 2))

    print(f"🔄 SMOOTHING: {sales[:5]} → {smoothed[:5]}")
    return smoothed


# ─────────────────────────────────────────
# LANGKAH 3 — MODEL SELECTION
# ─────────────────────────────────────────

def build_polynomial_model(degree: int):
    return Pipeline([
        ("poly",  PolynomialFeatures(degree=degree, include_bias=False)),
        ("ridge", Ridge(alpha=1.0)),
    ])

def select_best_model(X, y, diagnosis: dict):
    """
    Pilih model terbaik berdasarkan hasil diagnosa:
    - stable_no_pattern   → Linear saja (degree 1)
    - stable_with_pattern → Coba degree 1-2
    - volatile_*          → Coba degree 1-3
    """
    verdict = diagnosis["verdict"]

    if verdict == "stable_no_pattern":
        degrees = [1]
    elif verdict == "stable_with_pattern":
        degrees = [1, 2]
    else:
        # volatile — coba semua, pilih terbaik
        degrees = [1, 2, 3]

    best_model  = None
    best_score  = -999
    best_degree = 1

    for degree in degrees:
        try:
            if degree == 1:
                m = LinearRegression()
            else:
                m = build_polynomial_model(degree)

            m.fit(X, y)
            score = r2_score(y, m.predict(X))

            print(f"   degree={degree} → R²={score:.4f}")

            # Hindari overfit — degree tinggi dengan gain kecil tidak worth it
            improvement_threshold = 0.05
            if score > best_score + (improvement_threshold if degree > 1 else 0):
                best_score  = score
                best_model  = m
                best_degree = degree

        except Exception as e:
            print(f"   degree={degree} → ERROR: {e}")
            continue

    print(f"✅ MODEL TERPILIH: degree={best_degree} | R²={best_score:.4f}")
    return best_model, best_degree, best_score


# ─────────────────────────────────────────
# LANGKAH 4 — CONFIDENCE + CONTEXT
# ─────────────────────────────────────────

def calculate_confidence(r2_score_val: float, diagnosis: dict) -> float:
    """
    Confidence disesuaikan dengan karakteristik data.
    Data volatile dapat penalty karena prediksi memang lebih tidak pasti.
    """
    base = max(0.0, r2_score_val) * 100

    # Penalty kalau data volatile
    if diagnosis["cv_pct"] > 60:
        base *= 0.85   # kurangi 15% untuk data volatile
    elif diagnosis["cv_pct"] > 40:
        base *= 0.92   # kurangi 8% untuk data cukup volatile

    # Bonus kalau ada autocorrelation kuat
    if abs(diagnosis["autocorr"]) > 0.5:
        base = min(base * 1.1, 95)

    # Minimum 5% (bukan 0, karena model tetap memberikan estimasi)
    return round(max(5.0, min(base, 95.0)), 2)


def get_confidence_context(confidence: float, diagnosis: dict) -> dict:
    cv = diagnosis["cv_pct"]

    if cv > 60:
        return {
            "label":   "Data Fluktuatif",
            "message": "Penjualan sangat tidak beraturan — prediksi sebagai estimasi kasar saja",
            "color":   "amber"
        }
    elif confidence >= 70:
        return {
            "label":   "Akurasi Tinggi",
            "message": "Pola penjualan konsisten, prediksi dapat diandalkan",
            "color":   "green"
        }
    elif confidence >= 40:
        return {
            "label":   "Akurasi Sedang",
            "message": "Ada pola tren, gunakan sebagai referensi",
            "color":   "amber"
        }
    else:
        return {
            "label":   "Akurasi Rendah",
            "message": "Tambah data historis lebih banyak untuk hasil lebih akurat",
            "color":   "red"
        }


# ─────────────────────────────────────────
# MAIN SERVICE
# ─────────────────────────────────────────

def predict_and_save(product_id: str):
    db = SessionLocal()

    try:
        print(f"🚀 START PREDICTION: {product_id}")

        # Ambil sales dari DB
        result = db.execute(text("""
            SELECT "quantity" FROM "Sales"
            WHERE "productId" = :product_id
            ORDER BY "date" ASC
        """), {"product_id": product_id}).fetchall()

        sales = [row[0] for row in result]
        print(f"📊 SALES DATA ({len(sales)} titik): {sales[:10]}...")

        if len(sales) < 3:
            print("⚠ Data tidak cukup untuk prediksi")
            return {
                "status":      "insufficient_data",
                "message":     "Minimal 3 data penjualan diperlukan untuk prediksi",
                "totalInserted": 0,
                "confidence":  0,
            }

        # ── LANGKAH 1: Diagnosa ─────────────────
        diagnosis = diagnose_data(sales)

        # ── LANGKAH 2: Smoothing jika perlu ─────
        if diagnosis["cv_pct"] > 60:
            print(f"🔄 Data volatile (CV={diagnosis['cv_pct']:.1f}%), apply smoothing...")
            sales_for_training = smooth_sales(sales, window=3)
        else:
            print(f"✅ Data cukup stabil (CV={diagnosis['cv_pct']:.1f}%), skip smoothing")
            sales_for_training = sales

        # ── LANGKAH 3: Pilih model terbaik ──────
        X = np.arange(1, len(sales_for_training) + 1).reshape(-1, 1)
        y = np.array(sales_for_training)

        print(f"🤖 MODEL SELECTION (verdict: {diagnosis['verdict']}):")
        best_model, best_degree, best_r2 = select_best_model(X, y, diagnosis)

        # ── LANGKAH 4: Hitung confidence ────────
        confidence         = calculate_confidence(best_r2, diagnosis)
        confidence_context = get_confidence_context(confidence, diagnosis)

        print(f"📈 CONFIDENCE: {confidence}% ({confidence_context['label']})")

        # Prediksi 7 hari ke depan
        future_days = np.arange(
            len(sales_for_training) + 1,
            len(sales_for_training) + 8
        ).reshape(-1, 1)

        predictions = best_model.predict(future_days)

        # Pastikan prediksi tidak negatif
        predictions = np.maximum(predictions, 0)

        # Hapus prediksi lama
        db.execute(text("""
            DELETE FROM "Prediction"
            WHERE "productId" = :product_id
        """), {"product_id": product_id})

        # Insert prediksi baru
        for i, pred in enumerate(predictions):
            date = datetime.today() + timedelta(days=i + 1)
            db.execute(text("""
                INSERT INTO "Prediction"
                ("id", "productId", "predictedSales", "predictionDate", "modelVersion")
                VALUES (:id, :product_id, :sales, :prediction_date, :model_version)
            """), {
                "id":            str(uuid.uuid4()),
                "product_id":    product_id,
                "sales":         int(round(pred)),
                "prediction_date": date,
                "model_version": f"v2-poly{best_degree}",  # versi model tercatat
            })

            print(f"   INSERTED: {int(round(pred))} on {date.strftime('%Y-%m-%d')}")

        db.commit()
        print("✅ COMMIT SUCCESS")

        return {
            "status":        "success",
            "totalInserted": len(predictions),
            "confidence":    confidence,
            "confidence_context": confidence_context,
            "model_used":    f"polynomial_degree_{best_degree}",
            "r2_score":      round(best_r2, 4),
            "diagnosis":     diagnosis,
        }

    except Exception as e:
        db.rollback()
        print(f"🔥 ERROR: {e}")
        return {"error": str(e)}

    finally:
        db.close()