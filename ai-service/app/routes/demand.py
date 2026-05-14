from fastapi import APIRouter
from app.services.demand_service import predict_and_save

router = APIRouter()

@router.post("/predict-demand/{product_id}")
def predict(product_id: str):
    return predict_and_save(product_id)