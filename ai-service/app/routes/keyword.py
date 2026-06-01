from fastapi import APIRouter
from app.services.keyword_service import update_all_products, update_keyword_summary

router = APIRouter()

@router.post("/rebuild-keywords")
def rebuild_keywords():
    update_all_products()
    return {"status": "success", "message": "Keyword summary berhasil direbuild"}

@router.post("/rebuild-keywords/{product_id}")
def rebuild_keywords_product(product_id: str):
    update_keyword_summary(product_id)
    return {"status": "success", "message": f"Keyword updated untuk {product_id}"}