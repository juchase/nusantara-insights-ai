from pydantic import BaseModel
from typing import List


class InsightItem(BaseModel):
    type: str
    title: str
    description: str
    priority: str


class InsightResponse(BaseModel):
    summary: str
    health_score: int
    insights: List[InsightItem]
    recommendations: List[str]