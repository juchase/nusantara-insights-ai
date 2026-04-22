from fastapi import FastAPI
from app.routes import sentiment, demand

app = FastAPI()

app.include_router(sentiment.router)
app.include_router(demand.router)