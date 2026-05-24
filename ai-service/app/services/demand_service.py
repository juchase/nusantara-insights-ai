from app.utils.db import SessionLocal
from sqlalchemy import text
import joblib
import numpy as np
from datetime import datetime, timedelta
import uuid
from sklearn.metrics import r2_score
from app.config.model_paths import DEMAND_MODEL_PATH

model = joblib.load(DEMAND_MODEL_PATH)


def predict_and_save(product_id: str):
    db = SessionLocal()

    try:
        print(" START PREDICTION:", product_id)
        print("🚀 START PREDICTION:", product_id)

        # 1. ambil sales dari DB
        result = db.execute(text("""
            SELECT "quantity"
            FROM "Sales"
            WHERE "productId" = :product_id
            ORDER BY "date" ASC
        """), {"product_id": product_id}).fetchall()

        sales = [row[0] for row in result]

        print("📊 SALES DATA:", sales)

        # validasi minimal data
        if len(sales) < 3:
            return {
                "status": "insufficient_data",
                "message": "Minimal 3 data penjualan diperlukan untuk prediksi",
                "totalInserted": 0,
                "confidence": 0
            }
        # 2. hapus prediction lama
        db.execute(text("""
            DELETE FROM "Prediction"
            WHERE "productId" = :product_id
        """), {"product_id": product_id})

        # 3. training model
        X = np.arange(1, len(sales) + 1).reshape(-1, 1)
        model.fit(X, sales)

        # prediction untuk historical data
        historical_predictions = model.predict(X)

        # reliability score
        confidence = r2_score(
            sales,
            historical_predictions
        )

        # clamp biar realistis
        confidence = max(
            0,
            min(confidence * 100, 95)
        )

        future_days = np.arange(
            len(sales) + 1,
            len(sales) + 8
        ).reshape(-1, 1)

        predictions = model.predict(future_days)

        print("📈 CONFIDENCE:", confidence)

        # 4. insert ke DB
        for i, pred in enumerate(predictions):
            date = datetime.today() + timedelta(days=i + 1)

            db.execute(text("""
                INSERT INTO "Prediction"
                ("id", "productId", "predictedSales", "predictionDate", "modelVersion")
                VALUES (:id, :product_id, :sales, :prediction_date, 'v1-linear')
            """), {
                "id": str(uuid.uuid4()),
                "product_id": product_id,
                "sales": int(pred),
                "prediction_date": date
            })

            print(f" INSERTED: {int(pred)} on {date}")

        # 5. commit
        db.commit()
        print(" COMMIT SUCCESS")
        print("✅ COMMIT SUCCESS")

        return {
            "status": "success",

            "totalInserted": len(predictions),

            "confidence": round(confidence, 2)
        }

    except Exception as e:
        db.rollback()
        print("🔥 ERROR:", e)
        return {"error": str(e)}

    finally:
        db.close()