from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import text

from app.services.forecasting_v2.adaptive_selection.evaluator import (
    AdaptiveSelectionResult,
    run_adaptive_evaluation,
)
from app.services.forecasting_v2.model_registry import (
    ModelSelection,
    get_daily_model,
    get_weekly_model,
)

RE_EVALUATION_DAYS = 30


@dataclass(frozen=True)
class SelectionResolution:
    selection: ModelSelection | None
    strategy: str
    fallback_required: bool
    evaluation_status: str
    selection_reason: str
    validation_mae: float | None
    validation_rmse: float | None
    validation_wape: float | None
    n_predictions: int


def _get_static_selection(product_id: str, frequency: str) -> ModelSelection | None:
    # Public API uses D/W; CSV registry stores daily/weekly.
    try:
        if frequency == "D":
            return get_daily_model(product_id)
        if frequency == "W":
            return get_weekly_model(product_id)
        raise ValueError(f"Frequency tidak didukung: {frequency}")
    except (FileNotFoundError, ValueError):
        # Missing/invalid static lock should not prevent adaptive evaluation.
        return None


def _load_saved_selection(db, product_id: str, frequency: str):
    return db.execute(text('''
        SELECT "selectedModel", "selectionReason", "validationMae",
               "validationRmse", "validationWape", "nPredictions",
               "evaluationStatus", "dataPoints", "evaluatedAt", strategy
        FROM "ForecastModelSelection"
        WHERE "productId" = :product_id AND frequency = :frequency
        LIMIT 1
    '''), {"product_id": product_id, "frequency": frequency}).mappings().first()


def _should_reevaluate(saved, current_points: int) -> bool:
    if saved is None:
        return True
    previous_points = int(saved["dataPoints"] or 0)
    added_threshold = max(8, int(previous_points * 0.20))
    evaluated_at = saved["evaluatedAt"]
    if evaluated_at and evaluated_at.tzinfo is None:
        evaluated_at = evaluated_at.replace(tzinfo=timezone.utc)
    age_expired = not evaluated_at or datetime.now(timezone.utc) - evaluated_at >= timedelta(days=RE_EVALUATION_DAYS)
    data_grew = current_points >= previous_points + added_threshold
    return data_grew or age_expired



def _persist_static_selection_if_missing(db, product_id: str, frequency: str, history, static: ModelSelection) -> None:
    """Persist Phase 3.6 metrics for dashboard read-back without re-running evaluation."""
    saved = _load_saved_selection(db, product_id, frequency)
    if saved is not None and saved.get("strategy") == "validation_selected" and saved.get("selectedModel") == static.model_name:
        return

    db.execute(text('''
        INSERT INTO "ForecastModelSelection" (
            id, "productId", frequency, "selectedModel", "selectionReason",
            strategy, "validationMae", "validationRmse", "validationWape",
            "nPredictions", "evaluationStatus", "evaluationVersion",
            "dataPoints", "dataVersion", "evaluatedAt", "createdAt", "updatedAt"
        ) VALUES (
            gen_random_uuid()::text, :product_id, :frequency, :selected_model, :selection_reason,
            'validation_selected', :validation_mae, :validation_rmse, :validation_wape,
            :n_predictions, 'success', 'phase3.6', :data_points, NULL,
            NOW(), NOW(), NOW()
        )
        ON CONFLICT ("productId", frequency) DO UPDATE SET
            "selectedModel" = EXCLUDED."selectedModel",
            "selectionReason" = EXCLUDED."selectionReason",
            strategy = EXCLUDED.strategy,
            "validationMae" = EXCLUDED."validationMae",
            "validationRmse" = EXCLUDED."validationRmse",
            "validationWape" = EXCLUDED."validationWape",
            "nPredictions" = EXCLUDED."nPredictions",
            "evaluationStatus" = EXCLUDED."evaluationStatus",
            "evaluationVersion" = EXCLUDED."evaluationVersion",
            "dataPoints" = EXCLUDED."dataPoints",
            "evaluatedAt" = NOW(),
            "updatedAt" = NOW()
    '''), {
        "product_id": product_id,
        "frequency": frequency,
        "selected_model": static.model_name,
        "selection_reason": static.selection_reason,
        "validation_mae": static.validation_mae,
        "validation_rmse": static.validation_rmse,
        "validation_wape": static.validation_wape,
        "n_predictions": static.n_predictions,
        "data_points": len(history),
    })

def _save_selection(db, product_id: str, frequency: str, result: AdaptiveSelectionResult) -> None:
    db.execute(text('''
        INSERT INTO "ForecastModelSelection" (
            id, "productId", frequency, "selectedModel", "selectionReason",
            strategy, "validationMae", "validationRmse", "validationWape",
            "nPredictions", "evaluationStatus", "evaluationVersion",
            "dataPoints", "dataVersion", "evaluatedAt", "createdAt", "updatedAt"
        ) VALUES (
            gen_random_uuid()::text, :product_id, :frequency, :selected_model, :selection_reason,
            'adaptive_selection', :validation_mae, :validation_rmse, :validation_wape,
            :n_predictions, :evaluation_status, 'v1', :data_points, NULL,
            :evaluated_at, NOW(), NOW()
        )
        ON CONFLICT ("productId", frequency) DO UPDATE SET
            "selectedModel" = EXCLUDED."selectedModel",
            "selectionReason" = EXCLUDED."selectionReason",
            strategy = EXCLUDED.strategy,
            "validationMae" = EXCLUDED."validationMae",
            "validationRmse" = EXCLUDED."validationRmse",
            "validationWape" = EXCLUDED."validationWape",
            "nPredictions" = EXCLUDED."nPredictions",
            "evaluationStatus" = EXCLUDED."evaluationStatus",
            "evaluationVersion" = EXCLUDED."evaluationVersion",
            "dataPoints" = EXCLUDED."dataPoints",
            "evaluatedAt" = EXCLUDED."evaluatedAt",
            "updatedAt" = NOW()
    '''), {
        "product_id": product_id,
        "frequency": frequency,
        "selected_model": result.selected_model,
        "selection_reason": result.selection_reason,
        "validation_mae": result.validation_mae,
        "validation_rmse": result.validation_rmse,
        "validation_wape": result.validation_wape,
        "n_predictions": result.n_predictions,
        "evaluation_status": result.evaluation_status,
        "data_points": result.data_points,
        "evaluated_at": result.evaluated_at.replace(tzinfo=None),
    })


def _as_resolution(saved) -> SelectionResolution:
    status = str(saved["evaluationStatus"])
    fallback = status != "success"
    selection = ModelSelection(
        product_id="",
        frequency="",
        model_name=str(saved["selectedModel"]),
        selection_reason=str(saved["selectionReason"]),
        validation_mae=float(saved["validationMae"]) if saved["validationMae"] is not None else None,
        validation_rmse=float(saved["validationRmse"]) if saved["validationRmse"] is not None else None,
        validation_wape=float(saved["validationWape"]) if saved["validationWape"] is not None else None,
        n_predictions=int(saved["nPredictions"] or 0),
    )
    return SelectionResolution(
        selection=selection,
        strategy="adaptive_selection" if not fallback else "naive_fallback",
        fallback_required=fallback,
        evaluation_status=status,
        selection_reason=selection.selection_reason,
        validation_mae=selection.validation_mae,
        validation_rmse=selection.validation_rmse,
        validation_wape=selection.validation_wape,
        n_predictions=selection.n_predictions,
    )


def resolve_selection(db, product_id: str, frequency: str, history) -> SelectionResolution:
    # Phase 3.6 static decisions remain authoritative and untouched.
    static = _get_static_selection(product_id, frequency)
    if static is not None:
        _persist_static_selection_if_missing(db, product_id, frequency, history, static)
        return SelectionResolution(
            selection=static,
            strategy="validation_selected",
            fallback_required=False,
            evaluation_status="success",
            selection_reason=static.selection_reason,
            validation_mae=static.validation_mae,
            validation_rmse=static.validation_rmse,
            validation_wape=static.validation_wape,
            n_predictions=static.n_predictions,
        )

    saved = _load_saved_selection(db, product_id, frequency)
    if saved is not None and not _should_reevaluate(saved, len(history)):
        return _as_resolution(saved)

    result = run_adaptive_evaluation(history, frequency)
    _save_selection(db, product_id, frequency, result)
    db.flush()
    refreshed = _load_saved_selection(db, product_id, frequency)
    return _as_resolution(refreshed)
