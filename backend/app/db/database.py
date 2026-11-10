import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Dynamically find the absolute path to the backend folder
# __file__ is app/db/database.py -> .parent is db/ -> .parent is app/ -> .parent is backend/
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BACKEND_DIR / "precerto.db"

# 2. Use the absolute path for SQLite
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# connect_args={"check_same_thread": False} is strictly required for SQLite + FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False, "timeout": 15}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
