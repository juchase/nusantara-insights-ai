from sqlalchemy import Column, String, Integer
from app.database import Base

class Review(Base):

    __tablename__ = "Review"

    id = Column(String, primary_key=True)
    sentiment = Column(String)
    aspect = Column(String)