
import pandas as pd
import pytest

from app.services.backtesting.validation_selection import (
    select_validation_models,
)


def make_predictions():
    dates = pd.date_range(
        "2024-01-01",
        periods=4,
        freq="D",
    )

    actual = [10, 20, 30, 40]

    rows = []

    forecasts = {
        "naive": [12, 22, 32, 42],
        "sma": [10, 20, 30, 40],
        "wma": [15, 25, 35, 45],
    }

    for model, predicted in forecasts.items():
        for date, y_true, y_pred in zip(
            dates,
            actual,
            predicted,
        ):
            rows.append({
                "product_id": "P001",
                "frequency": "daily",
                "model": model,
                "ds": date,
                "y_true": y_true,
                "y_pred": y_pred,
            })

    return pd.DataFrame(rows)


def test_selects_best_validation_model():
    predictions = make_predictions()

    selection, metrics = select_validation_models(
        predictions
    )

    assert selection.iloc[0]["selected_model"] == "sma"
    assert selection.iloc[0]["selection_reason"] == (
        "best_validation_mae"
    )

    assert metrics["model"].nunique() == 3


def test_naive_selected_when_candidate_does_not_improve():
    predictions = make_predictions()

    predictions.loc[
        predictions["model"] == "sma",
        "y_pred",
    ] = [15, 25, 35, 45]

    selection, _ = select_validation_models(predictions)

    assert selection.iloc[0]["selected_model"] == "naive"
    assert selection.iloc[0]["selection_reason"] == (
        "best_validation_mae"
    )
    assert not selection.iloc[0]["fallback_applied"]

def test_naive_is_selected_when_it_has_best_mae():
    predictions = make_predictions()

    predictions.loc[
        predictions["model"] == "naive",
        "y_pred",
    ] = [10, 20, 30, 40]

    selection, _ = select_validation_models(
        predictions
    )

    assert selection.iloc[0]["selected_model"] == "naive"
    assert not selection.iloc[0]["fallback_applied"]


def test_naive_unavailable_is_not_evaluable():
    predictions = make_predictions()

    predictions = predictions[
        predictions["model"] != "naive"
    ]

    predictions.loc[:, "y_pred"] = [
        15, 25, 35, 45
    ] * 2

    selection, _ = select_validation_models(
        predictions
    )

    assert pd.isna(
        selection.iloc[0]["selected_model"]
    )

    assert selection.iloc[0]["selection_reason"] == (
        "naive_unavailable"
    )


def test_rejects_duplicate_predictions():
    predictions = make_predictions()

    predictions = pd.concat([
        predictions,
        predictions.iloc[[0]],
    ], ignore_index=True)

    with pytest.raises(ValueError):
        select_validation_models(predictions)


def test_rejects_inconsistent_actual_values():
    predictions = make_predictions()

    predictions.loc[
        predictions["model"] == "sma",
        "y_true",
    ] = 999

    with pytest.raises(ValueError):
        select_validation_models(predictions)


def test_rejects_invalid_prediction_values():
    predictions = make_predictions()

    predictions.loc[0, "y_pred"] = float("nan")

    with pytest.raises(ValueError):
        select_validation_models(predictions)


def test_wape_none_when_actual_is_zero():
    predictions = make_predictions()

    predictions["y_true"] = 0

    _, metrics = select_validation_models(
        predictions
    )

    assert metrics["wape"].isna().all()
