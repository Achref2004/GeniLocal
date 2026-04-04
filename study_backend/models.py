from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, Text, Date
from sqlalchemy.orm import relationship
from database import Base

# models.py
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    username = Column(String(55))
    
    # Ajout du champ fullname pour correspondre à ton schéma de profil
    fullname = Column(String(100), nullable=True) 
    
    hashed_password = Column(String(255), nullable=True) 
    is_admin = Column(Boolean, default=False)

    # Champs de profil
    phone = Column(String(20), nullable=True)
    birthdate = Column(String(50), nullable=True) # Gardé en String pour plus de flexibilité avec le front-end
    institution = Column(String(255), nullable=True)
    region = Column(String(100), nullable=True)  # Région/Pays
    level = Column(String(50), default="Licence 3")
    objective = Column(Text, nullable=True)

    # Lien vers les stats
    stats = relationship("UserStats", back_populates="owner", uselist=False, cascade="all, delete-orphan")

class UserStats(Base):
    __tablename__ = "user_stats"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    total_study_seconds = Column(Integer, default=0)
    days_present = Column(Integer, default=0)
    average_qcm_score = Column(Float, default=0.0)
    documents_analyzed = Column(Integer, default=0)
    badges = Column(String(255), default="")

    owner = relationship("User", back_populates="stats")