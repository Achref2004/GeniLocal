"""
routers/chat_router.py — Persistance des messages de chat par session.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models, schemas
from auth import get_current_user
from sqlite_models import get_db as get_sqlite_db, ChatMessage

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("/messages")
def save_chat_message(
    message_in: schemas.ChatMessageCreate,
    db: Session = Depends(get_sqlite_db),
    current_user: models.User = Depends(get_current_user),
):
    """Enregistre un message de chat pour l'utilisateur et la session en cours."""
    db_msg = ChatMessage(
        user_id    = current_user.id,
        session_id = message_in.session_id,
        role       = message_in.role,
        content    = message_in.content,
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return {
        "id":         db_msg.id,
        "session_id": db_msg.session_id,
        "role":       db_msg.role,
        "content":    db_msg.content,
        "timestamp":  db_msg.timestamp,
    }


@router.get("/messages")
def get_chat_messages(
    session_id: str,
    limit: int = 50,
    db: Session = Depends(get_sqlite_db),
    current_user: models.User = Depends(get_current_user),
):
    """Récupère l'historique de chat pour la session et l'utilisateur connectés."""
    messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id    == current_user.id,
            ChatMessage.session_id == session_id,
        )
        .order_by(ChatMessage.timestamp.asc())
        .limit(limit)
        .all()
    )
    return {
        "messages": [
            {
                "id":         m.id,
                "session_id": m.session_id,
                "role":       m.role,
                "content":    m.content,
                "timestamp":  m.timestamp,
            }
            for m in messages
        ]
    }
