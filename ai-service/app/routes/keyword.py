from fastapi import APIRouter
from app.services.keyword_service import update_all_products, update_keyword_summary
from app.services.aggregation_service import aggregate_product_metrics
from app.services.health_score_service import calculate_health_score
from database import SessionLocal
from sqlalchemy import text

router = APIRouter()

@router.post("/rebuild-keywords")
def rebuild_keywords():
    update_all_products()
    return {"status": "success", "message": "Keyword summary berhasil direbuild"}

@router.post("/rebuild-keywords/{product_id}")
def rebuild_keywords_product(product_id: str):
    update_keyword_summary(product_id)
    return {"status": "success", "message": f"Keyword updated untuk {product_id}"}

@router.post("/rebuild-all")
def rebuild_all():
    from app.services.keyword_service import update_all_products
    update_all_products()

    db = SessionLocal()
    try:
        product_ids = db.execute(text('SELECT id FROM "Product"')).fetchall()
        results = []
        for (product_id,) in product_ids:
            data = aggregate_product_metrics(product_id, db)
            score = calculate_health_score(
                data["positive_percentage"],
                data["negative_percentage"],
                data["growth_percentage"]
            )
            risk_level = "high" if score < 35 else "medium" if score < 55 else "low"

            # Gunakan top_category, bukan top_keyword
            dominant_issue = data.get("top_category") or "lainnya"

            db.execute(text("""
                UPDATE "Insight"
                SET "dominantIssue" = :issue,
                    "riskLevel"     = :risk,
                    "healthScore"   = :score
                WHERE "productId" = :pid
                AND "createdAt" = (
                    SELECT MAX("createdAt") FROM "Insight"
                    WHERE "productId" = :pid
                )
            """), {
                "issue": dominant_issue,
                "risk":  risk_level,
                "score": score,
                "pid":   product_id,
            })
            db.commit()
            results.append({
                "product_id": product_id,
                "dominant_issue": dominant_issue,
                "risk_level": risk_level,
                "health_score": score,
            })
        return {"status": "success", "updated": len(results), "results": results}
    finally:
        db.close()

@router.post("/update-keyword-summary/{product_id}")
def update_keyword_endpoint(product_id: str):
    update_keyword_summary(product_id)
    return {"status": "ok", "product_id": product_id}