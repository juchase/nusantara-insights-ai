import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.config.model_paths import DEMAND_MODEL_PATH

data = {
    "day": [1,2,3,4,5,6,7],
    "sales": [100,120,130,140,150,160,170]
}

df = pd.DataFrame(data)

X = df[["day"]]
y = df["sales"]

model = LinearRegression()
model.fit(X, y)

joblib.dump(model, DEMAND_MODEL_PATH)

print("Demand model trained")