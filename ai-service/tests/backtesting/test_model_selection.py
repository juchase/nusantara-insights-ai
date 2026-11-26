
import pandas as pd
import pytest

from app.services.backtesting.model_selection import (
    clean_predictions,
    clean_fold_metrics,
    get_common_folds,
    rank_models,
)


def test_clean_predictions_removes_exact_duplicates():
    data = pd.DataFrame([
        {
            "product_id": "p1",
            "frequency": "daily",
            "fold": 1,
            "model": "tsb",
            "ds": "2020-01-01",
            "y_true": 2,
            "y_pred": 1.5,
        },
        {
            "product_id": "p1",
            "frequency": "daily",
            "fold": 1,
            "model": "tsb",
            "ds": "2020-01-01",
            "y_true": 2,
            "y_pred": 1.5,
        },
    ])

    result = clean_predictions(data)

    assert len(result) == 1


def test_clean_predictions_rejects_conflicting_predictions():
    data = pd.DataFrame([
        {
            "product_id": "p1",
            "frequency": "daily",
            "fold": 1,
            "model": "tsb",
            "ds": "2020-01-01",
            "y_true": 2,
            "y_pred": 1.5,
        },
        {
            "product_id": "p1",
            "frequency": "daily",
            "fold": 1,
            "model": "tsb",
            "ds": "2020-01-01",
            "y_true": 2,
            "y_pred": 2.0,
        },
    ])

    with pytest.raises(ValueError):
        clean_predictions(data)


def test_clean_fold_metrics_prefers_success():
    data = pd.DataFrame([
        {
            "product_id": "p1",
            "frequency": "daily",
            "fold": 1,
            "model": "tsb",
            "status": None,
        },
        {
            "product_id": "p1",
            "frequency": "daily",
            "fold": 1,
            "model": "tsb",
            "status": "success",
        },
    ])

    result = clean_fold_metrics(data)

    assert len(result) == 1
    assert result.iloc[0]["status"] == "success"


def test_common_folds_uses_all_expected_models():
    predictions = pd.DataFrame([
        {
            "product_id": "p1",
            "frequency": "daily",
            "fold": 1,
            "model": "tsb",
        },
        {
            "product_id": "p1",
            "frequency": "daily",
            "fold": 2,
            "model": "tsb",
        },
        {
            "product_id": "p1",
            "frequency": "daily",
            "fold": 1,
            "model": "ses",
        },
    ])

    result = get_common_folds(
        predictions,
        "p1",
        "daily",
        ["tsb", "ses"],
    )

    assert result == {1}


def test_common_folds_empty_when_model_has_no_predictions():
    predictions = pd.DataFrame([
        {
            "product_id": "p1",
            "frequency": "daily",
            "fold": 1,
            "model": "tsb",
        },
    ])

    result = get_common_folds(
        predictions,
        "p1",
        "daily",
        ["tsb", "ses"],
    )

    assert result == set()


def test_rank_models_selects_lowest_average_rank():
    data = pd.DataFrame([
        {
            "product_id": "p1",
            "frequency": "daily",
            "model": "tsb",
            "mae": 1.0,
            "rmse": 1.0,
            "wape": 10.0,
        },
        {
            "product_id": "p1",
            "frequency": "daily",
            "model": "ses",
            "mae": 2.0,
            "rmse": 2.0,
            "wape": 20.0,
        },
    ])

    result = rank_models(data)

    winner = result[result["selected"]]

    assert winner.iloc[0]["model"] == "tsb"
