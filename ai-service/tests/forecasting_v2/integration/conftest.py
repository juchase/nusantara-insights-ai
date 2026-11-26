
import os
from uuid import uuid4

import pytest

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session


@pytest.fixture(scope="session")
def test_engine():
    database_url = os.getenv("TEST_DATABASE_URL")

    if not database_url:
        pytest.fail("TEST_DATABASE_URL belum dikonfigurasi.")

    url = make_url(database_url)

    if not url.database or not url.database.endswith("_test"):
        pytest.fail(
            "Test hanya boleh menggunakan database "
            "dengan nama berakhiran _test."
        )

    engine = create_engine(
        database_url,
        pool_pre_ping=True,
    )

    try:
        yield engine
    finally:
        engine.dispose()


@pytest.fixture
def db_session(test_engine):
    connection = test_engine.connect()
    transaction = connection.begin()

    session = Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
        autoflush=False,
    )

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def test_product(db_session):
    user_id = str(uuid4())
    product_id = str(uuid4())

    db_session.execute(
        text("""
            INSERT INTO "User" (
                "id",
                "email",
                "createdAt",
                "updatedAt"
            )
            VALUES (
                :id,
                :email,
                NOW(),
                NOW()
            )
        """),
        {
            "id": user_id,
            "email": f"{user_id}@integration.test",
        },
    )

    db_session.execute(
        text("""
            INSERT INTO "Product" (
                "id",
                "userId",
                "name"
            )
            VALUES (
                :id,
                :user_id,
                :name
            )
        """),
        {
            "id": product_id,
            "user_id": user_id,
            "name": "Integration Test Product",
        },
    )

    return product_id
