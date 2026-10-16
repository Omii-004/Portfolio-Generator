from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
import os
from dotenv import load_dotenv
from routers import auth_routes, resume_routes, portfolio_routes, feedback_routes, user_routes

load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="PortfoliAI API")

# This allows our React frontend to talk to our FastAPI backend!
# Set FRONTEND_ORIGIN (comma-separated) when the frontend is not on localhost.
origins = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register our routes down here, after 'app' exists!
app.include_router(auth_routes.router)
app.include_router(resume_routes.router)
app.include_router(portfolio_routes.router)
app.include_router(feedback_routes.router)
app.include_router(user_routes.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the PortfoliAI Backend!"}