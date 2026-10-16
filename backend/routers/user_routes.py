from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from routers.portfolio_routes import get_current_user
from auth import verify_password, get_password_hash

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me")
def get_profile(user: models.User = Depends(get_current_user)):
    return {
        "email": user.email,
        "full_name": user.full_name,
        "username": user.username,
        "bio": user.bio
    }


@router.put("/me")
def update_profile(profile_data: schemas.UserProfileUpdate, user: models.User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    # only fields the client actually sent, so a partial body can't wipe the rest
    for field, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Username already taken")
    return {"message": "Profile updated successfully"}


# NEW: Change Password Route
@router.put("/password")
def update_password(passwords: schemas.PasswordUpdate, user: models.User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    # Check if they typed their old password correctly
    if not verify_password(passwords.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    user.hashed_password = get_password_hash(passwords.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


# NEW: Delete Account Route
@router.delete("/me")
def delete_account(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Delete all their portfolios to prevent ghost data
    db.query(models.Portfolio).filter(models.Portfolio.user_id == user.id).delete()
    # 2. Delete the user
    db.delete(user)
    db.commit()

    return {"message": "Account deleted permanently"}