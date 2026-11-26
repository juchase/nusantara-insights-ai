
import pandas as pd
import pytest

from app.services.backtesting.temporal_split import (
    split_chronologically,
)


def make_data():
    dates = pd.date_range(
        "2024-01-01",
        periods=100,
        freq="D",
    )

    rows = []

    for product_id in ["P001", "P002"]:
        for index, date in enumerate(dates):
            rows.append({
                "product_id": product_id,
                "ds": date,
                "y": index,
            })

    return pd.DataFrame(rows)


def test_split_uses_chronological_boundaries():
    result = split_chronologically(make_data())

    assert result.train["ds"].max() < result.validation["ds"].min()

    assert (
        result.validation["ds"].max()
        < result.test["ds"].min()
    )


def test_split_has_no_overlapping_dates():
    result = split_chronologically(make_data())

    train_dates = set(result.train["ds"])
    validation_dates = set(result.validation["ds"])
    test_dates = set(result.test["ds"])

    assert train_dates.isdisjoint(validation_dates)
    assert train_dates.isdisjoint(test_dates)
    assert validation_dates.isdisjoint(test_dates)


def test_split_preserves_all_rows():
    original = make_data()

    result = split_chronologically(original)

    total_rows = (
        len(result.train)
        + len(result.validation)
        + len(result.test)
    )

    assert total_rows == len(original)


def test_split_uses_shared_dates_for_all_products():
    result = split_chronologically(make_data())

    for split_data in [
        result.train,
        result.validation,
        result.test,
    ]:
        product_dates = (
            split_data.groupby("product_id")["ds"]
            .apply(set)
        )

        assert product_dates.iloc[0] == product_dates.iloc[1]


def test_invalid_ratio_raises_error():
    with pytest.raises(ValueError):
        split_chronologically(
            make_data(),
            train_ratio=0.8,
            validation_ratio=0.3,
        )


def test_missing_date_raises_error():
    data = make_data()
    data.loc[0, "ds"] = None

    with pytest.raises(ValueError):
        split_chronologically(data)


def test_products_with_different_date_ranges():
    dates = pd.date_range(
        "2024-01-01",
        periods=100,
        freq="D",
    )

    data = pd.concat([
        pd.DataFrame({
            "product_id": "P001",
            "ds": dates,
            "y": 1,
        }),
        pd.DataFrame({
            "product_id": "P002",
            "ds": dates[20:],
            "y": 2,
        }),
    ], ignore_index=True)

    result = split_chronologically(data)

    assert (
        result.train["ds"].max()
        < result.validation["ds"].min()
    )

    assert (
        result.validation["ds"].max()
        < result.test["ds"].min()
    )

    assert set(result.train["product_id"]) == {
        "P001", "P002"
    }


def test_invalid_min_train_size_raises_error():
    data = make_data()

    with pytest.raises(ValueError):
        split_chronologically(
            data,
            min_train_size=-1,
        )


def test_split_preserves_product_rows():
    original = make_data()

    result = split_chronologically(original)

    combined = pd.concat([
        result.train,
        result.validation,
        result.test,
    ])

    assert len(combined) == len(original)

    assert (
        combined.groupby("product_id").size().to_dict()
        == original.groupby("product_id").size().to_dict()
    )
