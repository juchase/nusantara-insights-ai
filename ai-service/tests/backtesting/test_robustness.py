
import pandas as pd

from app.services.backtesting.robustness import (
    calculate_fold_wins,
    calculate_metric_consistency,
    calculate_selection_stability,
)


def test_fold_wins_selects_lowest_error():
    data = pd.DataFrame([
        {
            "product_id": "p1",
            "frequency": "daily",
            "fold": 1,
            "model": "tsb",
            "mae": 1.0,
            "rmse": 1.2,
            "wape": 20.0,
        },
        {
            "product_id": "p1",
            "frequency": "daily",
            "fold": 1,
            "model": "ses",
            "mae": 2.0,
            "rmse": 2.2,
            "wape": 30.0,
        },
    ])

    ranked, summary = calculate_fold_wins(data)

    winner = ranked[ranked["model"] == "tsb"].iloc[0]

    assert winner["mae_win"]
    assert winner["rmse_win"]
    assert winner["wape_win"]

    tsb_summary = summary[
        summary["model"] == "tsb"
    ].iloc[0]

    assert tsb_summary["mae_wins"] == 1
    assert tsb_summary["rmse_wins"] == 1
    assert tsb_summary["wape_wins"] == 1


def test_fold_wins_handles_wape_nan():
    data = pd.DataFrame([
        {
            "product_id": "p1",
            "frequency": "daily",
            "fold": 1,
            "model": "tsb",
            "mae": 1.0,
            "rmse": 1.2,
            "wape": float("nan"),
        },
        {
            "product_id": "p1",
            "frequency": "daily",
            "fold": 1,
            "model": "ses",
            "mae": 2.0,
            "rmse": 2.2,
            "wape": float("nan"),
        },
    ])

    ranked, summary = calculate_fold_wins(data)

    assert not ranked["wape_win"].any()

    tsb_summary = summary[
        summary["model"] == "tsb"
    ].iloc[0]

    assert pd.isna(tsb_summary["wape_win_rate"])


def test_metric_consistency_counts_metric_wins():
    data = pd.DataFrame([
        {
            "product_id": "p1",
            "frequency": "daily",
            "fold": 1,
            "model": "tsb",
            "mae": 1.0,
            "rmse": 1.0,
            "wape": 10.0,
            "mae_rank": 1,
            "rmse_rank": 1,
            "wape_rank": 1,
        },
        {
            "product_id": "p1",
            "frequency": "daily",
            "fold": 1,
            "model": "ses",
            "mae": 2.0,
            "rmse": 2.0,
            "wape": 20.0,
            "mae_rank": 2,
            "rmse_rank": 2,
            "wape_rank": 2,
        },
    ])

    result = calculate_metric_consistency(data)

    tsb = result[result["model"] == "tsb"].iloc[0]

    assert tsb["mae_wins"] == 1
    assert tsb["rmse_wins"] == 1
    assert tsb["wape_wins"] == 1


def test_selection_stability_splits_folds_into_periods():
    rows = []

    for fold in range(1, 7):
        rows.extend([
            {
                "product_id": "p1",
                "frequency": "daily",
                "fold": fold,
                "model": "tsb",
                "mae": 1.0,
                "rmse": 1.0,
                "wape": 10.0,
                "mae_rank": 1,
                "rmse_rank": 1,
                "wape_rank": 1,
            },
            {
                "product_id": "p1",
                "frequency": "daily",
                "fold": fold,
                "model": "ses",
                "mae": 2.0,
                "rmse": 2.0,
                "wape": 20.0,
                "mae_rank": 2,
                "rmse_rank": 2,
                "wape_rank": 2,
            },
        ])

    result = calculate_selection_stability(
        pd.DataFrame(rows)
    )

    assert set(result["period"]) == {
        "early",
        "middle",
        "late",
    }

    winners = result[
        (result["model"] == "tsb")
        & result["selected"]
    ]

    assert len(winners) == 3
