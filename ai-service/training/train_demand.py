import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib

data = {
    "day": [1,2,3,4,5,6,7],
    "sales": [100,120,130,140,150,160,170]
}

df = pd.DataFrame(data)

X = df[["day"]]
y = df["sales"]

model = LinearRegression()
model.fit(X, y)

joblib.dump(model, "models/demand_model.pkl")

print("Demand model trained")