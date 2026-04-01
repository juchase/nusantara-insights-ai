from fastapi import FastAPI
from pydantic import BaseModel
from services.sentiment import analyze_sentiment

app = FastAPI()

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