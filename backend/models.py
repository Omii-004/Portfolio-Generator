from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from database import Base
import datetime
from sqlalchemy.sql import func


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    username = Column(String, nullable=True, unique=True)
    bio = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)  # Connects to the User
    resume_data = Column(Text)  # Will store the AI-parsed JSON string
    selected_stack = Column(String)
    selected_theme = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    rating = Column(Integer, nullable=False)
    comments = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())