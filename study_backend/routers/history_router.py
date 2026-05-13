"""
routers/history_router.py — Historique IA et cache utilisateur.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models, schemas
from auth import get_current_user
from sqlite_models import get_db as get_sqlite_db, IaHistory, IaCache
from services.badge_service import update_user_badges

router = APIRouter(tags=["History"])


@router.get("/api/history", response_model=List[schemas.IaHistoryOut])
def get_ia_history(
    db: Session = Depends(get_sqlite_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        items = (
            db.query(IaHistory)
            .filter(IaHistory.user_id == current_user.id)
            .order_by(IaHistory.timestamp.desc())
            .all()
        )
        return [item for item in items if item is not None]
    except Exception:
        import traceback
        traceback.print_exc()
        return []


@router.post("/api/history", response_model=schemas.IaHistoryOut)
def save_ia_history(
    history_in: schemas.IaHistoryCreate,
    db: Session = Depends(get_sqlite_db),
    current_user: models.User = Depends(get_current_user),
):
    db_hist = IaHistory(
        user_id     = current_user.id,
        mode        = history_in.mode or "unknown",
        input_text  = history_in.input_text or "",
        subject     = history_in.subject,
        result      = history_in.result or "",
        question    = history_in.question,
        user_answer = history_in.user_answer,
        correction  = history_in.correction,
        meta_data   = history_in.meta_data,
    )
    db.add(db_hist)
    db.commit()
    db.refresh(db_hist)

    # La mise à jour des badges ne doit jamais bloquer la persistance.
    try:
        update_user_badges(db, current_user.id, history_in.mode)
    except Exception as e:
        print(f"⚠️ Badge update error: {e}")

    return db_hist


@router.delete("/api/history")
def clear_ia_history(
    db: Session = Depends(get_sqlite_db),
    current_user: models.User = Depends(get_current_user),
):
    """Efface l'historique IA de l'utilisateur connecté."""
    db.query(IaHistory).filter(IaHistory.user_id == current_user.id).delete()
    db.commit()
    return {"status": "ok"}


@router.get("/api/history/{item_id}")
def get_ia_history_detail(
    item_id: int,
    db: Session = Depends(get_sqlite_db),
    current_user: models.User = Depends(get_current_user),
):
    """Détail complet d'un élément d'historique (résumé / QCM / Q&R passé)."""
    item = db.query(IaHistory).filter(
        IaHistory.id == item_id,
        IaHistory.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.delete("/api/cache")
def clear_ia_cache(
    db: Session = Depends(get_sqlite_db),
    current_user: models.User = Depends(get_current_user),
):
    """Permet à l'utilisateur de vider son cache pour forcer une nouvelle génération."""
    db.query(IaCache).filter(IaCache.user_id == current_user.id).delete()
    db.commit()
    return {"status": "ok"}
