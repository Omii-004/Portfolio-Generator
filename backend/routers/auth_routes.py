from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth

# Group these endpoints under the /api/auth URL
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Hash password and save to database
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(new_user)
    db.commit()

    # the frontend logs straight in from this response, so it needs the token
    return {
        "message": "User created successfully",
        "access_token": auth.create_access_token(data={"sub": new_user.email}),
    }


@router.post("/login", response_model=schemas.Token)
def login_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Find the user
    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    # 2. Verify the password matches the hash
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 3. Generate and return the JWT token
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}