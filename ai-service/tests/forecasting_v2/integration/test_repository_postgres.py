
from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import text

from app.services.forecasting_v2.prediction_repository import (
    get_daily_sales_history,
    save_predictions,
)


def insert_prediction(
    db_session,
    product_id: str,
    frequency: str,
    prediction_date: date,
    predicted_sales: int,
) -> None:
    db_session.execute(
        text("""
            INSERT INTO "Prediction" (
                "id",
                "productId",
                "predictionDate",
                "predictedSales",
                "modelVersion",
                "freq"
            )
            VALUES (
                :id,
                :product_id,
                :prediction_date,
                :predicted_sales,
                :model_version,
                :frequency
            )
        """),
        {
            "id": str(uuid4()),
            "product_id": product_id,
            "prediction_date": prediction_date,
            "predicted_sales": predicted_sales,
            "model_version": "test_old",
            "frequency": frequency,
        },
    )


def get_predictions(db_session, product_id: str):
    return db_session.execute(
        text("""
            SELECT "freq", "predictedSales"
            FROM "Prediction"
            WHERE "productId" = :product_id
            ORDER BY "freq"
        """),
        {"product_id": product_id},
    ).fetchall()


def test_get_daily_sales_history_from_postgres(
    db_session,
    test_product,
):
    product_id = test_product

    db_session.execute(
        text("""
            INSERT INTO "Sales" (
                "id",
                "productId",
                "date",
                "quantity"
            )
            VALUES
                (:id1, :product_id, :date1, 5),
                (:id2, :product_id, :date2, 3),
                (:id3, :product_id, :date3, 4)
        """),
        {
            "id1": str(uuid4()),
            "id2": str(uuid4()),
            "id3": str(uuid4()),
            "product_id": product_id,
            "date1": datetime(2024, 1, 1, 8, 0),
            "date2": datetime(2024, 1, 1, 15, 0),
            "date3": datetime(2024, 1, 3, 10, 0),
        },
    )

    result = get_daily_sales_history(
        db=db_session,
        product_id=product_id,
    )

    assert len(result) == 3
    assert result["y"].tolist() == [8.0, 0.0, 4.0]


def test_save_predictions_to_postgres(
    db_session,
    test_product,
):
    product_id = test_product

    inserted = save_predictions(
        db=db_session,
        product_id=product_id,
        forecast_dates=[
            date(2024, 1, 4),
            date(2024, 1, 5),
        ],
        forecast_values=[10.0, 12.0],
        model_version="forecasting_v2:D:naive",
        frequency="D",
    )

    assert inserted == 2

    rows = db_session.execute(
        text("""
            SELECT
                "predictedSales",
                "modelVersion"
            FROM "Prediction"
            WHERE "productId" = :product_id
              AND "freq" = 'D'
            ORDER BY "predictionDate"
        """),
        {"product_id": product_id},
    ).fetchall()

    assert len(rows) == 2
    assert [row[0] for row in rows] == [10, 12]

    assert all(
        row[1] == "forecasting_v2:D:naive"
        for row in rows
    )


def test_daily_update_preserves_weekly_predictions(
    db_session,
    test_product,
):
    product_id = test_product

    insert_prediction(
        db_session,
        product_id,
        "D",
        date(2024, 1, 1),
        5,
    )

    insert_prediction(
        db_session,
        product_id,
        "W",
        date(2024, 1, 1),
        50,
    )

    save_predictions(
        db=db_session,
        product_id=product_id,
        forecast_dates=[date(2024, 1, 2)],
        forecast_values=[10],
        model_version="forecasting_v2:D:naive",
        frequency="D",
    )

    rows = get_predictions(db_session, product_id)

    results = {
        row[0]: row[1]
        for row in rows
    }

    assert len(rows) == 2
    assert results["D"] == 10
    assert results["W"] == 50


def test_weekly_update_preserves_daily_predictions(
    db_session,
    test_product,
):
    product_id = test_product

    insert_prediction(
        db_session,
        product_id,
        "D",
        date(2024, 1, 1),
        10,
    )

    insert_prediction(
        db_session,
        product_id,
        "W",
        date(2024, 1, 1),
        50,
    )

    save_predictions(
        db=db_session,
        product_id=product_id,
        forecast_dates=[date(2024, 1, 8)],
        forecast_values=[70],
        model_version="forecasting_v2:W:naive",
        frequency="W",
    )

    rows = get_predictions(db_session, product_id)

    results = {
        row[0]: row[1]
        for row in rows
    }

    assert len(rows) == 2
    assert results["D"] == 10
    assert results["W"] == 70


def test_rollback_restores_previous_predictions(
    db_session,
    test_product,
):
    product_id = test_product

    insert_prediction(
        db_session,
        product_id,
        "D",
        date(2024, 1, 1),
        25,
    )

    db_session.flush()

    nested_transaction = db_session.begin_nested()

    try:
        save_predictions(
            db=db_session,
            product_id=product_id,
            forecast_dates=[date(2024, 1, 2)],
            forecast_values=[100],
            model_version="forecasting_v2:D:naive",
            frequency="D",
        )

        nested_transaction.rollback()

    except Exception:
        if nested_transaction.is_active:
            nested_transaction.rollback()
        raise

    rows = db_session.execute(
        text("""
            SELECT
                "predictionDate",
                "predictedSales"
            FROM "Prediction"
            WHERE "productId" = :product_id
              AND "freq" = 'D'
        """),
        {"product_id": product_id},
    ).fetchall()

    assert len(rows) == 1
    assert rows[0][0].date() == date(2024, 1, 1)
    assert rows[0][1] == 25
