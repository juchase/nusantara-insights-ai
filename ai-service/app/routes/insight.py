from fastapi import APIRouter, Depends
from app.services.insight_service import generate_business_insight
from database import get_db

router = APIRouter()

@router.get("/generate-insight/{product_id}")

def generate_insight(

    product_id: str,

    db = Depends(get_db)

):

    result = generate_business_insight(
        product_id=product_id,
        db=db
    )

    return result