from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from app.services.forecasting_v2.adaptive_selection.validation import (
    ModelEvaluation,
    evaluate_candidates,
)


@dataclass(frozen=True)
class AdaptiveSelectionResult:
    selected_model: str
    selection_reason: str
    evaluation_status: str
    validation_mae: float | None
    validation_rmse: float | None
    validation_wape: float | None
    n_predictions: int
    folds: int
    data_points: int
    evaluated_at: datetime
    candidate_results: tuple[ModelEvaluation, ...]


def run_adaptive_evaluation(history, frequency: str) -> AdaptiveSelectionResult:
    data_points = len(history)
    best, evaluations, reason = evaluate_candidates(history, frequency)
    now = datetime.now(timezone.utc)

    if best is None:
        return AdaptiveSelectionResult(
            selected_model="naive",
            selection_reason=reason,
            evaluation_status="insufficient_data" if reason.startswith("insufficient_history") else "failed",
            validation_mae=None,
            validation_rmse=None,
            validation_wape=None,
            n_predictions=0,
            folds=0,
            data_points=data_points,
            evaluated_at=now,
            candidate_results=tuple(),
        )

    return AdaptiveSelectionResult(
        selected_model=best.model_name,
        selection_reason=reason,
        evaluation_status="success",
        validation_mae=best.mae,
        validation_rmse=best.rmse,
        validation_wape=best.wape,
        n_predictions=best.n_predictions,
        folds=best.folds,
        data_points=data_points,
        evaluated_at=now,
        candidate_results=tuple(evaluations),
    )
