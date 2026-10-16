import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# This will create a file named portfolio.db in your backend folder
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./portfolio.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# A helper function we will use later to talk to the database
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()