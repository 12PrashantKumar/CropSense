from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Default: SQLite (no server needed, works on any machine).
# To use PostgreSQL, set DATABASE_URL in a .env file:
#   DATABASE_URL=postgresql://user:password@localhost/crop_disease_db
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cropsense.db")

connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
