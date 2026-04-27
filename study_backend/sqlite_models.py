"""
SQLite Models for persistent storage of IA history, chat, planning, avatar, and progression.
Includes IaCache for instant re-delivery of previously generated IA responses.
"""

import hashlib

from sqlalchemy import (
    create_engine, Column, Integer, String, DateTime, Text, Boolean, JSON, Float,
    ForeignKey, Index, func
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import json
import os

# Create a single SQLite database in study_backend directory.
# This file is shared with the main SQLAlchemy database to ensure one database only.
db_path = os.path.join(os.path.dirname(__file__), 'study_app.db')
DATABASE_URL = f"sqlite:///{db_path.replace(chr(92), '/')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class IaHistory(Base):
    """Store all AI-generated content (resumes, QCM, Q/R, chat)"""
    __tablename__ = "ia_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    mode = Column(String(20), nullable=False)  # 'resume', 'qcm', 'qcm_remedial', 'qr', 'chat'
    input_text = Column(Text, nullable=False)
    subject = Column(String(100), nullable=True, index=True)
    result = Column(Text, nullable=False)
    # question, user_answer, correction removed as requested
    meta_data = Column("metadata", JSON, nullable=True)  # tokens, time, model_version, etc

    __table_args__ = (
        Index('idx_user_mode_subject', 'user_id', 'mode', 'subject'),
    )


class IaCache(Base):
    """
    Cache for IA-generated responses.
    Uses MD5 hash of (input_text + mode + subject) to detect duplicate requests.
    Per-user isolation: each user has their own cache entries.
    """
    __tablename__ = "ia_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    input_hash = Column(String(32), nullable=False, index=True)  # MD5 hex digest
    mode = Column(String(20), nullable=False)  # 'resume', 'qcm', 'qr', etc.
    subject = Column(String(100), nullable=True)
    input_text = Column(Text, nullable=False)  # Original text (for display)
    response = Column(Text, nullable=False)  # Full Ollama response
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index('idx_cache_lookup', 'user_id', 'input_hash', 'mode'),
    )

    @staticmethod
    def compute_hash(text: str, mode: str, subject: str = "", language: str = "fr", extra_data: str = "") -> str:
        """Generate a deterministic hash for cache lookup."""
        lang = (language or 'fr').strip().lower()
        raw = f"{mode}:{subject}:{lang}:{text}:{extra_data}".strip().lower()
        return hashlib.md5(raw.encode('utf-8')).hexdigest()


class ChatMessage(Base):
    """Persistent chat messages storage"""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    session_id = Column(String(50), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    role = Column(String(10), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)

    __table_args__ = (
        Index('idx_user_session', 'user_id', 'session_id'),
    )


class AvatarConfig(Base):
    """User avatar customization storage"""
    __tablename__ = "avatar_configs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, unique=True, index=True)
    config = Column(JSON, nullable=False)  # {top, hairColor, eyes, eyebrows, mouth, etc}
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PlanningItem(Base):
    """Planning notes and events"""
    __tablename__ = "planning_items"

    id = Column(String(50), primary_key=True)  # UUID
    user_id = Column(Integer, nullable=False, index=True)
    date = Column(String(10), nullable=False)  # YYYY-MM-DD
    item_type = Column(String(20), nullable=False)  # 'note' or 'event'
    type = Column(String(50), default='libre')
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    subject = Column(String(255), nullable=True)
    category = Column(String(20), nullable=False)  # 'etude', 'revision', 'examen', 'loisir'
    source = Column(String(20), nullable=False)  # 'manual' or 'ocr'
    checked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index('idx_user_date', 'user_id', 'date'),
    )


class UserProgression(Base):
    """Aggregated user progression statistics"""
    __tablename__ = "user_progression"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, unique=True, index=True)
    qcm_before = Column(Integer, default=0)
    qcm_after = Column(Integer, default=0)
    resume_count = Column(Integer, default=0)
    total_study_time = Column(Integer, default=0)  # seconds
    last_activity = Column(DateTime, nullable=True)
    qcm_score_avg = Column(Float, default=0.0)
    # qr_score removed as requested
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    subjects = Column(JSON, nullable=True)  # {subject: {score, count, avg_time}}


class Backup(Base):
    """Store user backup data for export/import"""
    __tablename__ = "backups"

    id = Column(String(50), primary_key=True)  # UUID
    user_id = Column(Integer, nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    data = Column(JSON, nullable=False)  # Exported data as JSON
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    size = Column(Integer, nullable=False)  # bytes

    __table_args__ = (
        Index('idx_user_created', 'user_id', 'created_at'),
    )


# Initialize database
def init_db():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
