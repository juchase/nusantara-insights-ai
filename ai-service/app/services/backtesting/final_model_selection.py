
from pathlib import Path

import numpy as np
import pandas as pd


PRODUCT_KEYS = ["product_id", "frequency"]
MODEL_KEYS = ["frequency", "model"]
METRICS = ["mae", "rmse", "wape"]


def _validate_columns(
    dataframe: pd.DataFrame,
    required: set[str],
    name: str,
) -> None:
    missing = required - set(dataframe.columns)

    if missing:
        raise ValueError(
            f"Kolom {name} tidak lengkap: {sorted(missing)}"
        )


def _select_product_winners(
    selection_report: pd.DataFrame,
) -> pd.DataFrame:
    """
    Pilih satu model per produk dan frekuensi.

    Ranking utama tetap berasal dari Phase 3.3.
    Tie diselesaikan dengan WAPE, MAE, kemudian RMSE.
    """
    if selection_report.empty:
        return pd.DataFrame()

    _validate_columns(
        selection_report,
        {
            "product_id",
            "frequency",
            "model",
            "average_rank",
            "selected",
            "mae",
            "rmse",
            "wape",
        },
        "selection_report",
    )

    result = selection_report.copy()

    # Hanya kandidat yang terpilih berdasarkan ranking Phase 3.3.
    winners = result[result["selected"].astype(bool)].copy()

    if winners.empty:
        return pd.DataFrame()

    # Tie-breaker hanya digunakan untuk rekomendasi operasional.
    winners = winners.sort_values(
        PRODUCT_KEYS + [
            "average_rank",
            "wape",
            "mae",
            "rmse",
            "model",
        ],
        ascending=True,
        na_position="last",
    )

    winners = winners.drop_duplicates(
        subset=PRODUCT_KEYS,
        keep="first",
    )

    return winners.reset_index(drop=True)


def _build_naive_comparison(
    selection_report: pd.DataFrame,
    final_selection: pd.DataFrame,
) -> pd.DataFrame:
    """
    Bandingkan model rekomendasi dengan Naive
    menggunakan metrik agregat per produk.
    """
    if selection_report.empty or final_selection.empty:
        return pd.DataFrame()

    naive = selection_report[
        selection_report["model"].str.lower() == "naive"
    ][
        PRODUCT_KEYS + METRICS
    ].copy()

    naive = naive.rename(
        columns={
            "mae": "naive_mae",
            "rmse": "naive_rmse",
            "wape": "naive_wape",
        }
    )

    selected = final_selection[
        PRODUCT_KEYS + ["model"] + METRICS
    ].copy()

    selected = selected.rename(
        columns={
            "model": "recommended_model",
            "mae": "recommended_mae",
            "rmse": "recommended_rmse",
            "wape": "recommended_wape",
        }
    )

    comparison = selected.merge(
        naive,
        on=PRODUCT_KEYS,
        how="left",
        validate="one_to_one",
    )

    for metric in METRICS:
        recommended_column = f"recommended_{metric}"
        naive_column = f"naive_{metric}"
        improvement_column = f"{metric}_improvement_pct"

        denominator = comparison[naive_column].replace(0, np.nan)

        comparison[improvement_column] = (
            (comparison[naive_column] - comparison[recommended_column])
            / denominator
            * 100
        )

    comparison["beats_naive_mae"] = (
        comparison["recommended_mae"] < comparison["naive_mae"]
    )

    comparison["beats_naive_rmse"] = (
        comparison["recommended_rmse"] < comparison["naive_rmse"]
    )

    comparison["beats_naive_wape"] = (
        comparison["recommended_wape"] < comparison["naive_wape"]
    )

    comparison["beats_naive_all_metrics"] = (
        comparison[
            [
                "beats_naive_mae",
                "beats_naive_rmse",
                "beats_naive_wape",
            ]
        ].all(axis=1)
    )

    comparison.loc[
        comparison["recommended_model"].str.lower() == "naive",
        [
            "beats_naive_mae",
            "beats_naive_rmse",
            "beats_naive_wape",
            "beats_naive_all_metrics",
        ],
    ] = False

    return comparison


def _build_frequency_recommendation(
    selection_report: pd.DataFrame,
    robustness_report: pd.DataFrame,
) -> pd.DataFrame:
    """
    Ringkasan kandidat model berdasarkan frekuensi.

    Average rank Phase 3.3 menjadi dasar urutan.
    Robustness disertakan sebagai bukti pendukung.
    """
    if selection_report.empty:
        return pd.DataFrame()

    summary = (
        selection_report.groupby(
            MODEL_KEYS,
            dropna=False,
        )
        .agg(
            products=("product_id", "nunique"),
            average_rank=("average_rank", "mean"),
            mean_mae=("mae", "mean"),
            mean_rmse=("rmse", "mean"),
            mean_wape=("wape", "mean"),
            selected_products=("selected", "sum"),
        )
        .reset_index()
    )

    summary["aggregate_rank"] = summary.groupby(
        "frequency"
    )["average_rank"].rank(
        method="min",
        ascending=True,
    )

    if not robustness_report.empty:
        robustness_columns = [
            "frequency",
            "model",
            "evaluated_product_folds",
            "mean_mae_rank",
            "mean_rmse_rank",
            "mean_wape_rank",
            "mae_win_rate",
            "rmse_win_rate",
            "wape_win_rate",
            "early_selections",
            "middle_selections",
            "late_selections",
        ]

        available = [
            column
            for column in robustness_columns
            if column in robustness_report.columns
        ]

        robustness = robustness_report[available].copy()

        summary = summary.merge(
            robustness,
            on=MODEL_KEYS,
            how="left",
            validate="one_to_one",
        )

    return summary.sort_values(
        ["frequency", "aggregate_rank", "mean_wape", "mean_mae"],
        na_position="last",
    ).reset_index(drop=True)


def _build_pattern_recommendation(
    pattern_summary: pd.DataFrame,
) -> pd.DataFrame:
    """
    Ambil model dengan pattern_rank terbaik
    untuk setiap kombinasi frekuensi dan demand pattern.
    """
    if pattern_summary.empty:
        return pd.DataFrame()

    _validate_columns(
        pattern_summary,
        {
            "frequency",
            "demand_pattern",
            "model",
            "pattern_rank",
            "average_rank",
            "mean_mae",
            "mean_rmse",
            "mean_wape",
        },
        "pattern_summary",
    )

    result = pattern_summary.copy()

    result = result.sort_values(
        [
            "frequency",
            "demand_pattern",
            "pattern_rank",
            "mean_wape",
            "mean_mae",
        ],
        na_position="last",
    )

    result["recommended"] = (
        result.groupby(
            ["frequency", "demand_pattern"]
        )["pattern_rank"].transform("min")
        == result["pattern_rank"]
    )

    return result.reset_index(drop=True)


def build_final_selection(
    selection_report: pd.DataFrame,
    robustness_report: pd.DataFrame,
    stability: pd.DataFrame,
    pattern_summary: pd.DataFrame,
) -> dict[str, pd.DataFrame]:
    """
    Gabungkan hasil Phase 3.3 dan Phase 3.4.

    Phase 3.3:
        Dasar pemilihan model per produk.

    Phase 3.4:
        Validasi konsistensi dan robustness.

    Pattern summary:
        Rekomendasi berdasarkan pola permintaan.
    """
    del stability  # Stability sudah diringkas di robustness_report.

    final_selection = _select_product_winners(
        selection_report
    )

    naive_comparison = _build_naive_comparison(
        selection_report,
        final_selection,
    )

    frequency_recommendation = _build_frequency_recommendation(
        selection_report,
        robustness_report,
    )

    pattern_recommendation = _build_pattern_recommendation(
        pattern_summary
    )

    return {
        "final_model_selection": final_selection,
        "naive_comparison": naive_comparison,
        "frequency_model_recommendation": frequency_recommendation,
        "pattern_model_recommendation": pattern_recommendation,
    }


def save_final_selection_reports(
    reports: dict[str, pd.DataFrame],
    output_dir: Path,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    for filename, dataframe in reports.items():
        dataframe.to_csv(
            output_dir / f"{filename}.csv",
            index=False,
        )
