"""Decision-lock registry for Daily and Weekly Forecasting V2."""
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
DAILY_SELECTION_FILE = BASE_DIR / "model_selection" / "daily_validation_selection.csv"
WEEKLY_SELECTION_FILE = BASE_DIR / "model_selection" / "weekly_validation_selection.csv"
REQUIRED_COLUMNS = {"product_id", "frequency", "selected_model", "selection_reason", "fallback_applied", "validation_mae", "validation_rmse", "validation_wape", "n_predictions"}
SUPPORTED_MODELS = {"naive", "sma", "wma", "ses", "holt", "holt_winters_7", "sarima_7", "prophet", "croston", "sba", "tsb", "arima"}

@dataclass(frozen=True)
class ModelSelection:
    product_id: str
    frequency: str
    model_name: str
    selection_reason: str
    validation_mae: float | None
    validation_rmse: float | None
    validation_wape: float | None
    n_predictions: int

def _load_registry(path: Path, expected_frequency: str) -> dict[str, ModelSelection]:
    if not path.exists():
        raise FileNotFoundError(f"Decision lock {expected_frequency} tidak ditemukan: {path}")
    df = pd.read_csv(path, dtype={"product_id": str})
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"Kolom decision lock tidak lengkap: {sorted(missing)}")
    if df.empty or df[list(REQUIRED_COLUMNS)].isna().any().any():
        raise ValueError(f"Decision lock {expected_frequency} kosong atau memiliki nilai kosong.")
    df["product_id"] = df["product_id"].astype(str).str.strip()
    df["frequency"] = df["frequency"].astype(str).str.strip().str.lower()
    df["selected_model"] = df["selected_model"].astype(str).str.strip().str.lower()
    if (df["product_id"] == "").any() or (df["frequency"] != expected_frequency).any():
        raise ValueError(f"Registry {expected_frequency} memiliki product_id/frequency tidak valid.")
    if df.duplicated(["product_id", "frequency"]).any():
        raise ValueError(f"Terdapat duplikasi product_id pada decision lock {expected_frequency}.")
    unsupported = set(df["selected_model"]) - SUPPORTED_MODELS
    if unsupported:
        raise ValueError(f"Model {expected_frequency} belum didukung: {sorted(unsupported)}")
    for column in ("validation_mae", "validation_rmse", "validation_wape", "n_predictions"):
        df[column] = pd.to_numeric(df[column], errors="coerce")
        if not df[column].map(lambda value: pd.notna(value) and value >= 0).all():
            raise ValueError(f"Nilai {column} tidak valid.")
    if (df["n_predictions"] < 1).any():
        raise ValueError("n_predictions harus minimal 1.")
    return {row["product_id"]: ModelSelection(row["product_id"], expected_frequency, row["selected_model"], row["selection_reason"], float(row["validation_mae"]), float(row["validation_rmse"]), float(row["validation_wape"]), int(row["n_predictions"])) for row in df.to_dict(orient="records")}

@lru_cache(maxsize=1)
def _load_daily_registry():
    return _load_registry(DAILY_SELECTION_FILE, "daily")

@lru_cache(maxsize=1)
def _load_weekly_registry():
    return _load_registry(WEEKLY_SELECTION_FILE, "weekly")

def get_daily_model(product_id: str):
    if not product_id: raise ValueError("product_id tidak boleh kosong.")
    return _load_daily_registry().get(str(product_id).strip())

def get_weekly_model(product_id: str):
    if not product_id: raise ValueError("product_id tidak boleh kosong.")
    return _load_weekly_registry().get(str(product_id).strip())

def clear_registry_cache():
    _load_daily_registry.cache_clear(); _load_weekly_registry.cache_clear()
