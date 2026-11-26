# Olist demo integration (Forecasting V2)

## What changed
- Forecasting V2 now reads both Daily and Weekly decision-lock CSVs.
- Weekly selection is sourced from `backtesting_results/phase36/weekly/validation_model_selection.csv`.
- Unknown products in either frequency use the existing Naive fallback.
- Runtime failures in a selected non-Naive model fall back to Naive for both frequencies.
- Weekly Prophet receives frequency `W`; non-seasonal ARIMA is implemented in the V2 runner using the same SARIMAX candidate orders found in the existing statistical forecasting implementation. Backtesting files are not modified.
- `scripts/import_demo_dataset.py` imports the source Olist data into `Product`, `Sales`, and `Review`.

## Import prerequisites
1. Run Prisma migrations so the schema in `schema.prisma` is present.
2. Ensure the demo account already exists and has `User.isDemo = TRUE`.
3. Ensure `.env` contains the same `DATABASE_URL` used by the application.
4. Run from the AI-SERVICE root.

## Dry run
```bash
python scripts/import_demo_dataset.py --user-email YOUR_DEMO_EMAIL
```

Or:
```bash
python scripts/import_demo_dataset.py --user-id YOUR_DEMO_USER_ID
```

The script validates the CSV and prints expected row counts without writing to PostgreSQL.

## Commit import
Only after confirming the demo user and database target:
```bash
python scripts/import_demo_dataset.py --user-email YOUR_DEMO_EMAIL --apply
```

The importer:
- Requires a demo account (`isDemo = TRUE`).
- Preserves original 32-character product IDs.
- Refuses to reassign products owned by another user.
- Uses PostgreSQL `ON CONFLICT` on the unique keys from the Prisma schema.
- Can be rerun without duplicating Sales or Review records.
- Creates generic display names `Produk Olist <first-8-id-chars>` because the raw source only contains product hashes, not product names or categories.

## Expected import counts
- 40 Product
- 4,394 Sales
- 2,827 Review

## Forecasting V2 selection
- Daily: 35 decision-locked products.
- Weekly: 30 decision-locked products.
- Products outside the respective decision lock use Naive fallback.
- `Prediction.freq` keeps Daily and Weekly predictions separate.

## Validation
The following tests passed in the isolated uploaded project:
```bash
pytest tests/forecasting_v2/test_policy.py tests/forecasting_v2/test_model_runner.py tests/forecasting_v2/test_forecast_engine.py tests/forecasting_v2/test_prediction_repository.py -q -k "not sarima_7"
```

Database-backed service tests could not be run in this environment because the uploaded ZIP did not include `.env` / `DATABASE_URL`. One existing SARIMA test was excluded because the current environment does not have the `prophet` package installed (the backtesting statistical module imports Prophet at module load). Run the complete suite in the project's configured virtual environment.
