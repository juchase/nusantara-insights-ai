from fastapi import FastAPI
from typing import List, Tuple
from pydantic import BaseModel
from services.sentiment import analyze_sentiment
from services.insight import generate_insight
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReviewRequest(BaseModel):
    text: str

@app.get("/")
def root():
    return {"status": "AI Service Running 🚀"}

@app.post("/analyze-sentiment")
def analyze(request: ReviewRequest):
    result = analyze_sentiment(request.text)
    return {
        "sentiment": result
    }

class InsightRequest(BaseModel):
    sentiment: dict
    keywords: List[Tuple[str, int]]

@app.post("/generate-insight")
def insight(req: InsightRequest):
    result = generate_insight(req.sentiment, req.keywords)
    return {
        "insight": result
    }