from sqlalchemy import Column, Integer, String, Boolean
from database import Base

# models.py
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    username = Column(String(255))
    # AJOUTE nullable=True ICI
    hashed_password = Column(String(255), nullable=True) 
    is_admin = Column(Boolean, default=False)