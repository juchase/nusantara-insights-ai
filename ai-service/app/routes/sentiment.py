from fastapi import APIRouter
from app.services.sentiment_service import predict_sentiment

router = APIRouter()

@router.post("/analyze")
def analyze(data: dict):
    text = data["text"]
    result = predict_sentiment(text)
    return {"sentiment": result}