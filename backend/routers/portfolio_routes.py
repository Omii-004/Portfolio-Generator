from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import Response, HTMLResponse
from sqlalchemy.orm import Session
from database import get_db
import models
from pydantic import BaseModel
import json
import jwt
from auth import SECRET_KEY, ALGORITHM
from services.generator import generate_portfolio_zip

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])


# Define what data the frontend will send us
class GenerateRequest(BaseModel):
    resume_data: dict
    selected_stack: str
    selected_theme: str


# A helper function to verify the user's JWT token
def get_current_user_email(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        # The header looks like "Bearer eyJhbG..."
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_owned_portfolio(portfolio_id: int, user: models.User, db: Session):
    portfolio = db.query(models.Portfolio).filter(models.Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    if portfolio.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your portfolio")
    return portfolio


@router.post("/generate")
def generate_portfolio(request: GenerateRequest, user: models.User = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    # 1. Save the portfolio record to the database
    new_portfolio = models.Portfolio(
        user_id=user.id,
        resume_data=json.dumps(request.resume_data),  # Convert dictionary to JSON string
        selected_stack=request.selected_stack,
        selected_theme=request.selected_theme
    )
    db.add(new_portfolio)
    db.commit()
    db.refresh(new_portfolio)  # This gets us the new ID

    return {"message": "Portfolio generated", "portfolio_id": new_portfolio.id}


@router.get("/my-portfolios")
def get_my_portfolios(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get all portfolios belonging to this user, sorted by newest first
    portfolios = db.query(models.Portfolio).filter(models.Portfolio.user_id == user.id).order_by(
        models.Portfolio.created_at.desc()).all()

    # Format the data cleanly for the frontend
    result = []
    for p in portfolios:
        resume_data = json.loads(p.resume_data)
        date_str = p.created_at.strftime("%b %d, %Y") if p.created_at else "Today"

        result.append({
            "id": p.id,
            "name": resume_data.get("name", "Unknown"),
            "stack": p.selected_stack,
            "theme": p.selected_theme,
            "date": date_str
        })

    return {"portfolios": result, "email": user.email}


@router.get("/preview/{portfolio_id}")
def preview_portfolio(portfolio_id: int, user: models.User = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    portfolio = get_owned_portfolio(portfolio_id, user, db)
    resume_data = json.loads(portfolio.resume_data)
    _, html = generate_portfolio_zip(resume_data, portfolio.selected_stack, portfolio.selected_theme)

    # Return the raw HTML directly to the browser
    return HTMLResponse(content=html)


@router.get("/download/{portfolio_id}")
def download_portfolio(portfolio_id: int, user: models.User = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    portfolio = get_owned_portfolio(portfolio_id, user, db)
    resume_data = json.loads(portfolio.resume_data)
    zip_bytes, _ = generate_portfolio_zip(resume_data, portfolio.selected_stack, portfolio.selected_theme)

    # Return the ZIP file data
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=portfolio_{portfolio_id}.zip"}
    )


@router.delete("/{portfolio_id}")
def delete_portfolio(portfolio_id: int, user: models.User = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    db.delete(get_owned_portfolio(portfolio_id, user, db))
    db.commit()
    return {"message": "Portfolio deleted"}