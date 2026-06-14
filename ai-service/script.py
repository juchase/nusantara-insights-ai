import sys
import os

# Menambahkan root directory agar Python bisa membaca modul 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.db import SessionLocal
from sqlalchemy import text
import traceback

# Import service demand (Prophet) dan service insight (LLM + Stats)
from app.services.demand_service import predict_and_save
# Catatan: Sesuaikan path import router/service ini jika fungsi generate_insight Anda ditaruh di file terpisah
# dari router FastAPI utama (misal dari app.services.insight_service atau file endpoint router-nya)
from app.routes.insight import generate_insight # 👈 Sesuaikan file asal fungsi generate_insight Anda

def rebuild_all_pipelines():
    db = SessionLocal()
    try:
        # 1. Ambil semua productId unik yang memiliki ulasan untuk diproses
        product_rows = db.execute(text('SELECT DISTINCT "productId" FROM "Review"')).fetchall()
        product_ids = [row[0] for row in product_rows]
    except Exception as e:
        print(f"🔥 Gagal mengambil data produk dari database: {e}")
        return
    finally:
        db.close()

    total_products = len(product_ids)
    print(f"🔄 Memulai proses pembangunan ulang AI Pipeline untuk {total_products} produk...")
    print("=" * 60)

    success_count = 0
    fail_count = 0

    for idx, product_id in enumerate(product_ids, start=1):
        print(f"\n[🚀 {idx}/{total_products}] Memproses Product ID: {product_id}")
        print("-" * 50)
        
        # Menggunakan session baru per produk agar transaksi DB terisolasi dengan aman
        product_db = SessionLocal()
        try:
            # 🔄 TAHAP 1: Hitung Prediksi Penjualan & Simpan Interval Prophet (Upper/Lower)
            print("📊 Menjalankan Prediksi Deret Waktu (Prophet Service)...")
            demand_result = predict_and_save(product_id)
            
            if isinstance(demand_result, dict) and demand_result.get("status") == "insufficient_data":
                print(f"⚠️ Prophet melewatkan produk ini: {demand_result.get('message')}")
                # Tetap lanjut ke tahap insight sentimen meskipun data penjualan kurang dari 7 hari

            # 🔄 TAHAP 2: Agregasi Metrik, Hitung Tren Sentimen Periode, & Generate Ringkasan LLM
            print("🤖 Memicu Analisis Sentimen & Insight Executive via AI Engine...")
            # generate_insight otomatis menghitung sentiment_trend, confidence, dan menyimpan data ke tabel "Insight"
            insight_result = generate_insight(product_id=product_id, db=product_db)
            
            print(f"✨ Berhasil membuat Insight Baru.")
            print(f"   - Health Score : {insight_result.get('health_score')} ({insight_result.get('health_label')})")
            print(f"   - LLM Digunakan: {'Ya' if insight_result.get('llm_used') else 'Tidak (Fallback)'}")
            
            success_count += 1
            
        except Exception as err:
            product_db.rollback()
            fail_count += 1
            print(f"❌ Gagal memproses Product ID {product_id}")
            print(f"   Detail Error: {err}")
            traceback.print_exc()
        finally:
            product_db.close()
            print("-" * 50)

    print("\n" + "=" * 60)
    print("🏁 EKSEKUSI PIPELINE AI SELESAI")
    print(f"✅ Sukses Terproses : {success_count} produk")
    print(f"⚠️ Gagal Terproses  : {fail_count} produk")
    print("=" * 60)

if __name__ == "__main__":
    rebuild_all_pipelines()
