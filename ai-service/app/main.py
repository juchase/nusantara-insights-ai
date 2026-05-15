from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import sentiment, demand, insight

app = FastAPI()

origins = [
    "http://localhost:3000",  # Next.js
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sentiment.router)
app.include_router(demand.router)
app.include_router(insight.router)