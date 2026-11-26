# app/services/backtesting/preprocessing.py

import pandas as pd


def prepare_daily_data(
    df: pd.DataFrame
) -> pd.DataFrame:

    if df.empty:
        return pd.DataFrame(
            columns=["product_id", "ds", "y"]
        )

    result = []

    for product_id, group in df.groupby("product_id"):

        group = group.copy()

        group["ds"] = pd.to_datetime(
            group["ds"]
        ).dt.normalize()

        group["y"] = pd.to_numeric(
            group["y"],
            errors="coerce"
        )

        group = group.dropna(
            subset=["ds", "y"]
        )

        if group.empty:
            continue

        if (group["y"] < 0).any():
            raise ValueError(
                f"Quantity negatif ditemukan: {product_id}"
            )

        daily = (
            group.groupby("ds")["y"]
            .sum()
            .sort_index()
        )

        calendar = pd.date_range(
            start=daily.index.min(),
            end=daily.index.max(),
            freq="D"
        )

        daily = daily.reindex(
            calendar,
            fill_value=0
        )

        product_daily = pd.DataFrame({
            "product_id": product_id,
            "ds": daily.index,
            "y": daily.values
        })

        result.append(product_daily)

    if not result:
        return pd.DataFrame(
            columns=["product_id", "ds", "y"]
        )

    return pd.concat(
        result,
        ignore_index=True
    )


def prepare_weekly_data(
    daily_df: pd.DataFrame
) -> pd.DataFrame:

    if daily_df.empty:
        return pd.DataFrame(
            columns=["product_id", "ds", "y"]
        )

    result = []

    for product_id, group in daily_df.groupby("product_id"):

        group = group.copy()

        group = group.set_index("ds").sort_index()

        weekly = (
            group["y"]
            .resample("W-MON")
            .sum()
        )

        product_weekly = pd.DataFrame({
            "product_id": product_id,
            "ds": weekly.index,
            "y": weekly.values
        })

        result.append(product_weekly)

    return pd.concat(
        result,
        ignore_index=True
    )