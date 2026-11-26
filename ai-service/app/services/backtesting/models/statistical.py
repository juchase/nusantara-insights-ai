
import warnings

import numpy as np
import pandas as pd

from prophet import Prophet
from statsmodels.tsa.statespace.sarimax import SARIMAX


def _validate_input(y_train, horizon: int) -> np.ndarray:
    if (
        not isinstance(horizon, int)
        or isinstance(horizon, bool)
        or horizon < 1
    ):
        raise ValueError("horizon harus integer >= 1.")

    values = np.asarray(y_train, dtype=float)

    if values.ndim != 1:
        raise ValueError("y_train harus satu dimensi.")

    if len(values) < 3:
        raise ValueError("Minimal 3 observasi training diperlukan.")

    if not np.isfinite(values).all():
        raise ValueError("Data mengandung NaN atau infinity.")

    if (values < 0).any():
        raise ValueError("Demand tidak boleh negatif.")

    return values


def _validate_forecast(values, horizon: int) -> np.ndarray:
    forecast = np.asarray(values, dtype=float)

    if forecast.ndim != 1 or len(forecast) != horizon:
        raise ValueError("Panjang output forecast tidak sesuai horizon.")

    if not np.isfinite(forecast).all():
        raise ValueError("Forecast mengandung NaN atau infinity.")

    return np.maximum(forecast, 0.0)


def prophet_forecast(
    y_train,
    horizon: int,
    frequency: str = "D",
) -> np.ndarray:
    """
    Prophet dengan konfigurasi sederhana.

    D  : data harian, weekly seasonality aktif.
    W  : data mingguan, yearly seasonality nonaktif.
    """

    values = _validate_input(y_train, horizon)

    if frequency not in {"D", "W"}:
        raise ValueError("frequency hanya boleh 'D' atau 'W'.")

    dates = pd.date_range(
        start="2000-01-01",
        periods=len(values),
        freq=frequency,
    )

    train_df = pd.DataFrame({
        "ds": dates,
        "y": values,
    })

    model = Prophet(
        growth="linear",
        weekly_seasonality=(frequency == "D"),
        yearly_seasonality=False,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,
        uncertainty_samples=0,
    )

    model.fit(train_df)

    future = model.make_future_dataframe(
        periods=horizon,
        freq=frequency,
        include_history=False,
    )

    forecast = model.predict(future)

    return _validate_forecast(
        forecast["yhat"].to_numpy(),
        horizon,
    )



def sarima_forecast(
    y_train,
    horizon: int,
    seasonal_periods: int | None = None,
) -> np.ndarray:
    """
    SARIMA dengan pencarian konfigurasi terbatas.

    Hanya kandidat yang konvergen yang dapat dipilih.
    Pemilihan kandidat menggunakan AIC dari training data.
    """

    values = _validate_input(y_train, horizon)

    if seasonal_periods is not None:
        if (
            not isinstance(seasonal_periods, int)
            or isinstance(seasonal_periods, bool)
            or seasonal_periods < 2
        ):
            raise ValueError("seasonal_periods harus integer >= 2.")

        if len(values) < 2 * seasonal_periods:
            raise ValueError(
                f"Histori SARIMA tidak cukup: perlu minimal "
                f"{2 * seasonal_periods} observasi."
            )

        candidates = [
            ((0, 1, 1), (0, 0, 1, seasonal_periods)),
            ((1, 1, 0), (1, 0, 0, seasonal_periods)),
            ((0, 1, 1), (1, 0, 0, seasonal_periods)),
            ((0, 1, 1), (0, 0, 0, 0)),
        ]

    else:
        candidates = [
            ((0, 1, 1), (0, 0, 0, 0)),
            ((1, 1, 0), (0, 0, 0, 0)),
            ((0, 0, 1), (0, 0, 0, 0)),
            ((1, 0, 0), (0, 0, 0, 0)),
        ]

    successful_models = []
    failures = []

    for order, seasonal_order in candidates:
        try:
            model = SARIMAX(
                values,
                order=order,
                seasonal_order=seasonal_order,
                trend="n",
                enforce_stationarity=False,
                enforce_invertibility=False,
            )

            fitted = model.fit(
                disp=False,
                maxiter=300,
                method="lbfgs",
            )

            converged = fitted.mle_retvals.get(
                "converged",
                False,
            )

            if not converged:
                failures.append(
                    f"{order}/{seasonal_order}: not converged"
                )
                continue

            if not np.isfinite(fitted.aic):
                failures.append(
                    f"{order}/{seasonal_order}: invalid AIC"
                )
                continue

            successful_models.append(fitted)

        except Exception as exc:
            failures.append(
                f"{order}/{seasonal_order}: {exc}"
            )

    if not successful_models:
        raise RuntimeError(
            "Semua kandidat SARIMA gagal. "
            + " | ".join(failures)
        )

    # Pemilihan berdasarkan AIC training saja.
    best_model = min(
        successful_models,
        key=lambda result: result.aic,
    )

    forecast = best_model.forecast(steps=horizon)

    return _validate_forecast(forecast, horizon)
