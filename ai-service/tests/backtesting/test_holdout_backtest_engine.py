
import numpy as np
import pandas as pd
import pytest

from app.services.backtesting.holdout_backtest_engine import (
    run_holdout_rolling_origin_backtest,
)


def make_data():
    dates = pd.date_range(
        "2024-01-01",
        periods=40,
        freq="D",
    )

    history = pd.DataFrame({
        "ds": dates[:30],
        "y": np.arange(30, dtype=float),
    })

    evaluation = pd.DataFrame({
        "ds": dates[30:],
        "y": np.arange(30, 40, dtype=float),
    })

    return history, evaluation


def naive_forecast(train, horizon):
    return np.repeat(train[-1], horizon)


def test_holdout_returns_expected_folds():
    history, evaluation = make_data()

    predictions, metrics = (
        run_holdout_rolling_origin_backtest(
            history_df=history,
            evaluation_df=evaluation,
            models={"naive": naive_forecast},
            horizon=2,
            min_train_size=10,
        )
    )

    assert metrics["fold"].nunique() == 5
    assert len(predictions) == 10
    assert metrics["status"].eq("success").all()


def test_training_history_expands_after_each_fold():
    history, evaluation = make_data()

    _, metrics = run_holdout_rolling_origin_backtest(
        history_df=history,
        evaluation_df=evaluation,
        models={"naive": naive_forecast},
        horizon=2,
        min_train_size=10,
    )

    assert metrics["train_size"].tolist() == [
        30, 32, 34, 36, 38
    ]


def test_future_actuals_are_not_used_early():
    history, evaluation = make_data()

    observed_train_sizes = []

    def tracking_forecast(train, horizon):
        observed_train_sizes.append(len(train))
        return np.repeat(train[-1], horizon)

    run_holdout_rolling_origin_backtest(
        history_df=history,
        evaluation_df=evaluation,
        models={"tracking": tracking_forecast},
        horizon=2,
        min_train_size=10,
    )

    assert observed_train_sizes == [
        30, 32, 34, 36, 38
    ]


def test_failed_model_does_not_stop_other_models():
    history, evaluation = make_data()

    def failing_forecast(train, horizon):
        raise RuntimeError("Model failure")

    predictions, metrics = run_holdout_rolling_origin_backtest(
        history_df=history,
        evaluation_df=evaluation,
        models={
            "broken": failing_forecast,
            "naive": naive_forecast,
        },
        horizon=2,
        min_train_size=10,
    )

    assert metrics[metrics["model"] == "broken"][
        "status"
    ].eq("failed").all()

    assert metrics[metrics["model"] == "naive"][
        "status"
    ].eq("success").all()

    assert not predictions.empty


def test_rejects_overlapping_history_and_evaluation():
    history, evaluation = make_data()

    evaluation.loc[0, "ds"] = history["ds"].iloc[-1]

    with pytest.raises(ValueError):
        run_holdout_rolling_origin_backtest(
            history,
            evaluation,
            {"naive": naive_forecast},
            horizon=2,
            min_train_size=10,
        )


def test_rejects_insufficient_evaluation_data():
    history, evaluation = make_data()

    with pytest.raises(ValueError):
        run_holdout_rolling_origin_backtest(
            history,
            evaluation.iloc[:1],
            {"naive": naive_forecast},
            horizon=2,
            min_train_size=10,
        )


def test_rejects_invalid_forecast():
    history, evaluation = make_data()

    def invalid_forecast(train, horizon):
        return np.repeat(np.nan, horizon)

    _, metrics = run_holdout_rolling_origin_backtest(
        history,
        evaluation,
        {"invalid": invalid_forecast},
        horizon=2,
        min_train_size=10,
    )

    assert metrics["status"].eq("failed").all()
