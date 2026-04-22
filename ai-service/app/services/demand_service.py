import joblib
import numpy as np
from datetime import datetime, timedelta

model = joblib.load("models/demand_model.pkl")

def predict_demand(data: dict):
    sales = data["sales"]

    X = np.arange(1, len(sales)+1).reshape(-1, 1)
    model.fit(X, sales)

    future_days = np.arange(len(sales)+1, len(sales)+8).reshape(-1,1)
    predictions = model.predict(future_days)

    today = datetime.today()

    result = []
    for i, pred in enumerate(predictions):
        result.append({
            "date": (today + timedelta(days=i+1)).strftime("%Y-%m-%d"),
            "predictedSales": int(pred)
        })

    return { "predictions": result }