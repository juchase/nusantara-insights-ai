from fastapi import APIRouter
from app.services.demand_service import predict_demand

router = APIRouter()

@router.post("/predict-demand")
def predict(data: dict):
    return predict_demand(data)