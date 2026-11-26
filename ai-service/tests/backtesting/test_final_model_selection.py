
import pandas as pd

from app.services.backtesting.final_model_selection import (
    build_final_selection,
)


def test_selects_best_model_per_product():
    selection = pd.DataFrame([
        {
            "product_id": "P001",
            "frequency": "daily",
            "model": "TSB",
            "average_rank": 1.0,
            "selected": True,
            "mae": 2.0,
            "rmse": 3.0,
            "wape": 20.0,
        },
        {
            "product_id": "P001",
            "frequency": "daily",
            "model": "Naive",
            "average_rank": 2.0,
            "selected": False,
            "mae": 3.0,
            "rmse": 4.0,
            "wape": 30.0,
        },
    ])

    result = build_final_selection(
        selection_report=selection,
        robustness_report=pd.DataFrame(),
        stability=pd.DataFrame(),
        pattern_summary=pd.DataFrame(),
    )

    final = result["final_model_selection"]

    assert len(final) == 1
    assert final.iloc[0]["model"] == "TSB"


def test_tie_uses_wape_then_mae_then_rmse():
    selection = pd.DataFrame([
        {
            "product_id": "P001",
            "frequency": "daily",
            "model": "Model_A",
            "average_rank": 1.0,
            "selected": True,
            "mae": 2.0,
            "rmse": 3.0,
            "wape": 25.0,
        },
        {
            "product_id": "P001",
            "frequency": "daily",
            "model": "Model_B",
            "average_rank": 1.0,
            "selected": True,
            "mae": 2.0,
            "rmse": 3.0,
            "wape": 20.0,
        },
    ])

    result = build_final_selection(
        selection_report=selection,
        robustness_report=pd.DataFrame(),
        stability=pd.DataFrame(),
        pattern_summary=pd.DataFrame(),
    )

    final = result["final_model_selection"]

    assert len(final) == 1
    assert final.iloc[0]["model"] == "Model_B"


def test_naive_comparison():
    selection = pd.DataFrame([
        {
            "product_id": "P001",
            "frequency": "daily",
            "model": "TSB",
            "average_rank": 1.0,
            "selected": True,
            "mae": 2.0,
            "rmse": 3.0,
            "wape": 20.0,
        },
        {
            "product_id": "P001",
            "frequency": "daily",
            "model": "Naive",
            "average_rank": 2.0,
            "selected": False,
            "mae": 4.0,
            "rmse": 5.0,
            "wape": 40.0,
        },
    ])

    result = build_final_selection(
        selection_report=selection,
        robustness_report=pd.DataFrame(),
        stability=pd.DataFrame(),
        pattern_summary=pd.DataFrame(),
    )

    comparison = result["naive_comparison"]

    assert len(comparison) == 1
    assert comparison.iloc[0]["recommended_model"] == "TSB"
    assert comparison.iloc[0]["beats_naive_all_metrics"]
