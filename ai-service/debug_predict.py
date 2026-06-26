import sys
from app.utils.db import SessionLocal
from app.services.demand_service import predict_and_save

def debug_forecast(product_id: str):
    print(f"\n🔍 DEBUG: Memanggil predict_and_save untuk produk {product_id}")
    result = predict_and_save(product_id)
    print("\n📦 Hasil dari predict_and_save:")
    print(result)
    if result.get("status") == "success":
        print(f"\n✅ Confidence: {result.get('confidence')}%")
        print(f"📈 Growth: {result.get('growth')}%")
        print(f"📊 Context: {result.get('confidence_context')}")
    else:
        print(f"\n❌ Gagal: {result.get('error')}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python debug_forecast.py <product_id>")
        sys.exit(1)
    product_id = sys.argv[1]
    debug_forecast(product_id)