
import pandas as pd

from app.services.backtesting.operational_selection import (
    build_operational_selection,
)


def make_comparison():
    return pd.DataFrame([
        {
            "product_id": "P001",
            "frequency": "daily",
            "recommended_model": "TSB",
            "recommended_mae": 2.0,
            "naive_mae": 3.0,
            "recommended_rmse": 3.0,
            "naive_rmse": 4.0,
            "recommended_wape": 20.0,
            "naive_wape": 30.0,
        },
        {
            "product_id": "P002",
            "frequency": "daily",
            "recommended_model": "WMA",
            "recommended_mae": 4.0,
            "naive_mae": 3.0,
            "recommended_rmse": 5.0,
            "naive_rmse": 4.0,
            "recommended_wape": 40.0,
            "naive_wape": 30.0,
        },
        {
            "product_id": "P003",
            "frequency": "weekly",
            "recommended_model": "Naive",
            "recommended_mae": 3.0,
            "naive_mae": 3.0,
            "recommended_rmse": 4.0,
            "naive_rmse": 4.0,
            "recommended_wape": 30.0,
            "naive_wape": 30.0,
        },
        {
            "product_id": "P004",
            "frequency": "weekly",
            "recommended_model": "SBA",
            "recommended_mae": 2.0,
            "naive_mae": float("nan"),
            "recommended_rmse": 3.0,
            "naive_rmse": float("nan"),
            "recommended_wape": 20.0,
            "naive_wape": float("nan"),
        },
    ])


def make_selection_report():
    return pd.DataFrame([
        {
            "product_id": "P001",
            "frequency": "daily",
            "demand_pattern": "intermittent",
        },
        {
            "product_id": "P002",
            "frequency": "daily",
            "demand_pattern": "lumpy",
        },
        {
            "product_id": "P003",
            "frequency": "weekly",
            "demand_pattern": "smooth",
        },
        {
            "product_id": "P004",
            "frequency": "weekly",
            "demand_pattern": "erratic",
        },
    ])


def test_keeps_model_that_beats_naive():
    result = build_operational_selection(
        make_comparison(),
        make_selection_report(),
    )

    row = result[result["product_id"] == "P001"].iloc[0]

    assert row["operational_model"] == "TSB"
    assert row["decision"] == "keep_recommended_model"


def test_falls_back_when_model_loses_to_naive():
    result = build_operational_selection(
        make_comparison(),
        make_selection_report(),
    )

    row = result[result["product_id"] == "P002"].iloc[0]

    assert row["operational_model"] == "Naive"
    assert row["decision"] == "fallback_to_naive"


def test_keeps_naive_when_already_selected():
    result = build_operational_selection(
        make_comparison(),
        make_selection_report(),
    )

    row = result[result["product_id"] == "P003"].iloc[0]

    assert row["operational_model"] == "Naive"
    assert row["decision"] == "baseline_selected"


def test_missing_naive_metric_is_not_evaluable():
    result = build_operational_selection(
        make_comparison(),
        make_selection_report(),
    )

    row = result[result["product_id"] == "P004"].iloc[0]

    assert pd.isna(row["operational_model"])
    assert row["decision"] == "not_evaluable"
