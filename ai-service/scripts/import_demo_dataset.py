"""Idempotently import Olist demo data into Prisma PostgreSQL tables.

From AI-SERVICE root:
  python scripts/import_demo_dataset.py --user-email demo@example.com
  python scripts/import_demo_dataset.py --user-id <demo-user-id>
Without --apply this only validates the file. Target user must have isDemo=TRUE.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from uuid import uuid4

import pandas as pd
from sqlalchemy import bindparam, text

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATASET = ROOT / "data" / "olist_dataset_final.csv"
sys.path.insert(0, str(ROOT))

from app.utils.db import engine  # noqa: E402


def load_and_validate(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Dataset tidak ditemukan: {path}")
    frame = pd.read_csv(path, dtype={"product": str})
    required = {"product", "date", "reviewText", "rating", "sales"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Kolom dataset tidak lengkap: {sorted(missing)}")
    if frame["product"].isna().any():
        raise ValueError("Dataset memiliki product ID kosong.")
    frame["product"] = frame["product"].astype(str).str.strip()
    if frame["product"].eq("").any():
        raise ValueError("Dataset memiliki product ID kosong.")
    frame["date"] = pd.to_datetime(frame["date"], errors="coerce")
    if frame["date"].isna().any():
        raise ValueError("Dataset memiliki tanggal tidak valid.")

    sales = frame.loc[frame["sales"].notna(), ["product", "date", "sales"]].copy()
    sales["quantity"] = pd.to_numeric(sales["sales"], errors="coerce")
    if sales["quantity"].isna().any() or (sales["quantity"] < 0).any():
        raise ValueError("Quantity penjualan tidak valid.")
    if not (sales["quantity"] % 1 == 0).all():
        raise ValueError("Quantity penjualan harus bilangan bulat.")
    sales["quantity"] = sales["quantity"].astype(int)
    if sales.duplicated(["product", "date"]).any():
        raise ValueError("Duplikasi product/date ditemukan pada Sales.")

    reviews = frame.loc[
        frame["reviewText"].notna(),
        ["product", "date", "reviewText", "rating"],
    ].copy()
    reviews["reviewText"] = reviews["reviewText"].astype(str).str.strip()
    reviews["rating"] = pd.to_numeric(reviews["rating"], errors="coerce")
    if reviews["reviewText"].eq("").any() or reviews["rating"].isna().any():
        raise ValueError("Teks review atau rating tidak valid.")
    if not reviews["rating"].between(1, 5).all() or not (reviews["rating"] % 1 == 0).all():
        raise ValueError("Rating harus integer antara 1 dan 5.")
    reviews["rating"] = reviews["rating"].astype(int)
    if reviews.duplicated(["product", "reviewText", "date"]).any():
        raise ValueError("Duplikasi product/reviewText/reviewDate ditemukan pada Review.")

    product_ids = sorted(set(frame["product"]))
    return product_ids, sales, reviews


def resolve_demo_user(conn, user_id: str | None, user_email: str | None) -> str:
    if bool(user_id) == bool(user_email):
        raise ValueError("Pilih tepat satu: --user-id atau --user-email.")
    if user_id:
        query = text('SELECT "id", "isDemo" FROM "User" WHERE "id" = :value')
        value = user_id
    else:
        query = text('SELECT "id", "isDemo" FROM "User" WHERE "email" = :value')
        value = user_email
    row = conn.execute(query, {"value": value}).mappings().first()
    if row is None:
        raise ValueError("Akun demo tidak ditemukan.")
    if not row["isDemo"]:
        raise ValueError("User tujuan bukan akun demo (isDemo harus TRUE).")
    return row["id"]


def import_dataset(dataset: Path, user_id: str | None, user_email: str | None, apply: bool):
    product_ids, sales, reviews = load_and_validate(dataset)
    print(f"Dataset valid: {len(product_ids)} products, {len(sales)} sales, {len(reviews)} reviews.")
    if not apply:
        print("DRY RUN: database tidak diubah. Tambahkan --apply untuk commit.")
        return

    with engine.begin() as conn:
        demo_user_id = resolve_demo_user(conn, user_id, user_email)
        existing_query = text(
            'SELECT "id", "userId" FROM "Product" WHERE "id" IN :ids'
        ).bindparams(bindparam("ids", expanding=True))
        existing = conn.execute(
            existing_query,
            {"ids": product_ids},
        ).mappings().all()
        conflicts = [row["id"] for row in existing if row["userId"] != demo_user_id]
        if conflicts:
            raise ValueError(
                "Product ID sudah dimiliki user lain; import dibatalkan. "
                f"Contoh ID: {conflicts[:3]}"
            )

        product_rows = [
            {"id": pid, "user_id": demo_user_id, "name": f"Produk Olist {pid[:8]}"}
            for pid in product_ids
        ]
        conn.execute(
            text('''
                INSERT INTO "Product" ("id", "userId", "name")
                VALUES (:id, :user_id, :name)
                ON CONFLICT ("id") DO NOTHING
            '''),
            product_rows,
        )

        sales_rows = [
            {
                "id": str(uuid4()),
                "product_id": row.product,
                "date": row.date.to_pydatetime(),
                "quantity": int(row.quantity),
            }
            for row in sales.itertuples(index=False)
        ]
        conn.execute(
            text('''
                INSERT INTO "Sales" ("id", "productId", "date", "quantity")
                VALUES (:id, :product_id, :date, :quantity)
                ON CONFLICT ("productId", "date")
                DO UPDATE SET "quantity" = EXCLUDED."quantity"
            '''),
            sales_rows,
        )

        review_rows = [
            {
                "id": str(uuid4()),
                "product_id": row.product,
                "review_text": row.reviewText,
                "rating": int(row.rating),
                "review_date": row.date.to_pydatetime(),
            }
            for row in reviews.itertuples(index=False)
        ]
        conn.execute(
            text('''
                INSERT INTO "Review"
                    ("id", "productId", "reviewText", "rating", "reviewDate")
                VALUES
                    (:id, :product_id, :review_text, :rating, :review_date)
                ON CONFLICT ("productId", "reviewText", "reviewDate")
                DO UPDATE SET "rating" = EXCLUDED."rating"
            '''),
            review_rows,
        )
        print(
            f"Import committed: {len(product_rows)} products, "
            f"{len(sales_rows)} sales, {len(review_rows)} reviews "
            f"for demo user {demo_user_id}."
        )


def main():
    parser = argparse.ArgumentParser(description="Import Olist demo data into PostgreSQL.")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--user-id")
    parser.add_argument("--user-email")
    parser.add_argument("--apply", action="store_true", help="Commit database changes (default: dry-run).")
    args = parser.parse_args()
    import_dataset(args.dataset, args.user_id, args.user_email, args.apply)


if __name__ == "__main__":
    main()
