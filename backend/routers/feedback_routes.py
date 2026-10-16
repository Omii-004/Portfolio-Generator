from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
from pydantic import BaseModel

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])


# What data we expect from the React frontend
class FeedbackCreate(BaseModel):
    rating: int
    comments: str


@router.post("/")
def submit_feedback(feedback: FeedbackCreate, db: Session = Depends(get_db)):
    # Create the database record
    new_feedback = models.Feedback(
        rating=feedback.rating,
        comments=feedback.comments
    )

    # Save it to SQLite
    db.add(new_feedback)
    db.commit()

    return {"message": "Feedback submitted successfully"}