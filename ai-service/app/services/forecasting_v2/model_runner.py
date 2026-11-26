from collections.abc import Callable

import numpy as np


ForecastFunction = Callable[..., np.ndarray]


def _validate_forecast_output(forecast, horizon: int) -> np.ndarray:
    result = np.asarray(forecast, dtype=float)
    if result.ndim != 1:
        raise ValueError("Forecast harus berupa array satu dimensi.")
    if len(result) != horizon:
        raise ValueError(f"Horizon tidak sesuai: expected={horizon}, received={len(result)}")
    if not np.isfinite(result).all():
        raise ValueError("Forecast mengandung NaN atau infinity.")
    if (result < 0).any():
        raise ValueError("Forecast mengandung demand negatif.")
    return result


def _get_forecast_function(model_name: str, frequency: str = "D") -> ForecastFunction:
    """Lazy import agar dependency model dimuat hanya saat dibutuhkan."""
    if model_name == "naive":
        from app.services.backtesting.models.baseline import naive_forecast
        return naive_forecast
    if model_name == "sma":
        from app.services.backtesting.models.baseline import sma_forecast
        return lambda y, h: sma_forecast(y, h, window=7)
    if model_name == "wma":
        from app.services.backtesting.models.baseline import wma_forecast
        return lambda y, h: wma_forecast(y, h, window=7)
    if model_name == "ses":
        from app.services.backtesting.models.exponential_smoothing import ses_forecast
        return ses_forecast
    if model_name == "holt":
        from app.services.backtesting.models.exponential_smoothing import holt_forecast
        return holt_forecast
    if model_name == "holt_winters_7":
        from app.services.backtesting.models.exponential_smoothing import holt_winters_forecast
        return lambda y, h: holt_winters_forecast(y, h, seasonal_periods=7)
    if model_name == "sarima_7":
        from app.services.backtesting.models.statistical import sarima_forecast
        return lambda y, h: sarima_forecast(y, h, seasonal_periods=7)
    if model_name == "arima":
        # Same non-seasonal SARIMAX candidate orders used by the repository's
        # statistical forecaster, kept local to V2 to avoid changing backtesting.
        from statsmodels.tsa.statespace.sarimax import SARIMAX

        def forecast_arima(y, h):
            candidates = [
                (0, 1, 1),
                (1, 1, 0),
                (0, 0, 1),
                (1, 0, 0),
            ]
            fitted_models = []
            for order in candidates:
                fitted = SARIMAX(
                    y,
                    order=order,
                    seasonal_order=(0, 0, 0, 0),
                    trend="n",
                    enforce_stationarity=False,
                    enforce_invertibility=False,
                ).fit(disp=False, maxiter=300, method="lbfgs")
                if fitted.mle_retvals.get("converged", False) and np.isfinite(fitted.aic):
                    fitted_models.append(fitted)
            if not fitted_models:
                raise RuntimeError("Semua kandidat ARIMA gagal konvergen.")
            best = min(fitted_models, key=lambda result: result.aic)
            return best.forecast(steps=h)

        return forecast_arima
    if model_name == "prophet":
        from app.services.backtesting.models.statistical import prophet_forecast
        return lambda y, h: prophet_forecast(y, h, frequency=frequency)
    if model_name == "croston":
        from app.services.backtesting.models.intermittent import croston_forecast
        return lambda y, h: croston_forecast(y, h, alpha=0.1)
    if model_name == "sba":
        from app.services.backtesting.models.intermittent import sba_forecast
        return lambda y, h: sba_forecast(y, h, alpha=0.1)
    if model_name == "tsb":
        from app.services.backtesting.models.intermittent import tsb_forecast
        return lambda y, h: tsb_forecast(y, h, alpha=0.1, beta=0.1)
    raise ValueError(f"Model forecasting tidak didukung: {model_name}")


def run_forecast_model(
    model_name: str,
    y_train,
    horizon: int,
    frequency: str = "D",
) -> np.ndarray:
    if not isinstance(horizon, int) or isinstance(horizon, bool) or horizon < 1:
        raise ValueError("horizon harus integer >= 1.")
    if frequency not in {"D", "W"}:
        raise ValueError("frequency harus D atau W.")

    values = np.asarray(y_train, dtype=float)
    if values.ndim != 1 or len(values) == 0:
        raise ValueError("Training data harus array satu dimensi dan tidak kosong.")
    if not np.isfinite(values).all():
        raise ValueError("Training data mengandung NaN atau infinity.")
    if (values < 0).any():
        raise ValueError("Demand tidak boleh negatif.")

    normalized_name = model_name.strip().lower()
    forecast_function = _get_forecast_function(normalized_name, frequency)
    return _validate_forecast_output(forecast_function(values, horizon), horizon)
