import pandas as pd

df = pd.read_csv(
    "app/services/forecasting_v2/model_selection/daily_validation_selection.csv"
)

print(
    df[df.astype(str).apply(
        lambda col: col.str.contains(
            "0aabfb375647d9738ad0f7b4ea3653b1",
            regex=False
        )
    ).any(axis=1)].to_string(index=False)
)