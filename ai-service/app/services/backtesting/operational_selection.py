
import numpy as np
import pandas as pd


PRODUCT_KEYS = ["product_id", "frequency"]


def build_operational_selection(
    naive_comparison: pd.DataFrame,
    selection_report: pd.DataFrame,
) -> pd.DataFrame:
    """
    Simulate an operational fallback policy using MAE.

    The recommended model is retained only when its MAE
    is strictly lower than the Naive baseline MAE.

    This is an evaluation policy, not production logic.
    """
    required_comparison = {
        "product_id",
        "frequency",
        "recommended_model",
        "recommended_mae",
        "naive_mae",
        "recommended_rmse",
        "naive_rmse",
        "recommended_wape",
        "naive_wape",
    }

    missing = required_comparison - set(naive_comparison.columns)

    if missing:
        raise ValueError(
            f"Kolom naive_comparison tidak lengkap: {sorted(missing)}"
        )

    result = naive_comparison.copy()

    if result.duplicated(PRODUCT_KEYS).any():
        raise ValueError(
            "Ditemukan lebih dari satu rekomendasi untuk "
            "kombinasi product_id dan frequency."
        )

    for column in [
        "recommended_mae",
        "naive_mae",
        "recommended_rmse",
        "naive_rmse",
        "recommended_wape",
        "naive_wape",
    ]:
        result[column] = pd.to_numeric(
            result[column],
            errors="coerce",
        )

    selected_models = result["recommended_model"].astype("string")

    selected_is_naive = (
        selected_models.str.strip().str.lower() == "naive"
    )

    mae_available = (
        np.isfinite(result["recommended_mae"])
        & np.isfinite(result["naive_mae"])
    )

    model_beats_naive = (
        result["recommended_mae"] < result["naive_mae"]
    )

    result["operational_model"] = pd.Series(
        pd.NA,
        index=result.index,
        dtype="string",
    )

    result["decision"] = "not_evaluable"
    result["decision_reason"] = "MAE model atau Naive tidak tersedia"

    # If Naive is already the selected model, retain it.
    result.loc[
        selected_is_naive,
        "operational_model",
    ] = "Naive"

    result.loc[
        selected_is_naive,
        "decision",
    ] = "baseline_selected"

    result.loc[
        selected_is_naive,
        "decision_reason",
    ] = "Naive sudah menjadi model rekomendasi Phase 3.3"

    # Non-Naive recommendations with valid MAE.
    valid_non_naive = mae_available & ~selected_is_naive

    keep_model = valid_non_naive & model_beats_naive
    fallback = valid_non_naive & ~model_beats_naive

    result.loc[
        keep_model,
        "operational_model",
    ] = selected_models.loc[keep_model]

    result.loc[
        keep_model,
        "decision",
    ] = "keep_recommended_model"

    result.loc[
        keep_model,
        "decision_reason",
    ] = "MAE model rekomendasi lebih rendah daripada Naive"

    result.loc[
        fallback,
        "operational_model",
    ] = "Naive"

    result.loc[
        fallback,
        "decision",
    ] = "fallback_to_naive"

    result.loc[
        fallback,
        "decision_reason",
    ] = "MAE model rekomendasi tidak lebih baik daripada Naive"

    # Improvement relative to Naive, in percent.
    denominator = result["naive_mae"].replace(0, np.nan)

    result["mae_improvement_pct"] = (
        (
            result["naive_mae"]
            - result["recommended_mae"]
        )
        / denominator
        * 100
    )

    result["rmse_improvement_pct"] = (
        (
            result["naive_rmse"]
            - result["recommended_rmse"]
        )
        / result["naive_rmse"].replace(0, np.nan)
        * 100
    )

    result["wape_improvement_pct"] = (
        (
            result["naive_wape"]
            - result["recommended_wape"]
        )
        / result["naive_wape"].replace(0, np.nan)
        * 100
    )

    # Attach demand pattern from Phase 3.3.
    if not selection_report.empty:
        required_selection = {
            "product_id",
            "frequency",
            "demand_pattern",
        }

        missing = required_selection - set(selection_report.columns)

        if missing:
            raise ValueError(
                f"Kolom selection_report tidak lengkap: {sorted(missing)}"
            )

        patterns = (
            selection_report[
                PRODUCT_KEYS + ["demand_pattern"]
            ]
            .drop_duplicates(subset=PRODUCT_KEYS)
        )

        result = result.merge(
            patterns,
            on=PRODUCT_KEYS,
            how="left",
            validate="one_to_one",
        )

    return result.sort_values(
        ["frequency", "product_id"]
    ).reset_index(drop=True)


def build_fallback_summary(
    operational: pd.DataFrame,
    group_columns: list[str],
) -> pd.DataFrame:
    """Summarize operational decisions by frequency or pattern."""
    if operational.empty:
        return pd.DataFrame()

    summary = (
        operational.groupby(
            group_columns,
            dropna=False,
        )
        .agg(
            products=("product_id", "nunique"),
            kept_recommended_model=(
                "decision",
                lambda values: (
                    values == "keep_recommended_model"
                ).sum(),
            ),
            fallback_to_naive=(
                "decision",
                lambda values: (
                    values == "fallback_to_naive"
                ).sum(),
            ),
            baseline_selected=(
                "decision",
                lambda values: (
                    values == "baseline_selected"
                ).sum(),
            ),
            not_evaluable=(
                "decision",
                lambda values: (
                    values == "not_evaluable"
                ).sum(),
            ),
        )
        .reset_index()
    )

    summary["evaluated_products"] = (
        summary["products"] - summary["not_evaluable"]
    )

    denominator = summary["evaluated_products"].replace(0, np.nan)

    summary["fallback_rate_pct"] = (
        summary["fallback_to_naive"]
        / denominator
        * 100
    )

    summary["keep_rate_pct"] = (
        summary["kept_recommended_model"]
        / denominator
        * 100
    )

    return summary


def save_operational_reports(
    operational: pd.DataFrame,
    output_dir,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    operational.to_csv(
        output_dir / "operational_model_selection.csv",
        index=False,
    )

    frequency_summary = build_fallback_summary(
        operational,
        ["frequency"],
    )

    frequency_summary.to_csv(
        output_dir / "fallback_summary.csv",
        index=False,
    )

    if "demand_pattern" in operational.columns:
        pattern_summary = build_fallback_summary(
            operational,
            ["frequency", "demand_pattern"],
        )

        pattern_summary.to_csv(
            output_dir / "fallback_by_pattern.csv",
            index=False,
        )
