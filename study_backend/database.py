from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# SQLite Database Configuration
DB_PATH = os.path.join(os.path.dirname(__file__), 'study_app.db')
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH.replace(chr(92), '/')}"

# For SQLite, we need to add some special arguments
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False  # Set to True for SQL debugging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()