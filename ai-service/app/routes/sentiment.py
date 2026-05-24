from fastapi import APIRouter
from app.services.sentiment_service import predict_sentiment
from app.services.keyword_service import update_all_products, update_keyword_summary

router = APIRouter()

@router.post("/analyze")
def analyze(data: dict):
    text = data["text"]
    result = predict_sentiment(text)
    return {"sentiment": result}

@router.post("/rebuild-keywords")
def rebuild_keywords():
    """Rebuild keyword summary untuk semua produk dari review yang ada."""
    update_all_products()
    return {"status": "success", "message": "Keyword summary berhasil direbuild"}

@router.post("/rebuild-keywords/{product_id}")
def rebuild_keywords_product(product_id: str):
    """Rebuild keyword summary untuk satu produk."""
    update_keyword_summary(product_id)
    return {"status": "success", "message": f"Keyword updated untuk {product_id}"}