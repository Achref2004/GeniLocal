"""
routers/planning_router.py — Notes et événements du planning utilisateur.
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models, schemas
from auth import get_current_user
from sqlite_models import get_db as get_sqlite_db, PlanningItem

router = APIRouter(prefix="/api/planning", tags=["Planning"])


# ── Notes ─────────────────────────────────────────────────────────────────────

@router.get("/notes", response_model=List[schemas.PlanningItemOut])
def get_planning_notes(
    db: Session = Depends(get_sqlite_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(PlanningItem)
        .filter(PlanningItem.user_id == current_user.id, PlanningItem.item_type == "note")
        .order_by(PlanningItem.created_at.desc())
        .all()
    )


@router.post("/notes", response_model=schemas.PlanningItemOut)
def save_planning_note(
    note_in: schemas.PlanningItemCreate,
    db: Session = Depends(get_sqlite_db),
    current_user: models.User = Depends(get_current_user),
):
    db_note = db.query(PlanningItem).filter(
        PlanningItem.id      == note_in.id,
        PlanningItem.user_id == current_user.id,
    ).first()

    if db_note:
        for k, v in note_in.model_dump().items():
            setattr(db_note, k, v)
    else:
        db_note = PlanningItem(user_id=current_user.id, **note_in.model_dump())
        db.add(db_note)

    db.commit()
    db.refresh(db_note)
    return db_note


@router.delete("/notes/{item_id}")
def delete_planning_note(
    item_id: str,
    db: Session = Depends(get_sqlite_db),
    current_user: models.User = Depends(get_current_user),
):
    db_note = db.query(PlanningItem).filter(
        PlanningItem.id      == item_id,
        PlanningItem.user_id == current_user.id,
    ).first()
    if db_note:
        db.delete(db_note)
        db.commit()
    return {"status": "ok"}


# ── Événements ────────────────────────────────────────────────────────────────

@router.get("/events", response_model=List[schemas.PlanningItemOut])
def get_planning_events(
    db: Session = Depends(get_sqlite_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(PlanningItem)
        .filter(PlanningItem.user_id == current_user.id, PlanningItem.item_type == "event")
        .order_by(PlanningItem.date.asc())
        .all()
    )


@router.post("/events")
def save_planning_events(
    events_in: List[schemas.PlanningItemCreate],
    db: Session = Depends(get_sqlite_db),
    current_user: models.User = Depends(get_current_user),
):
    for ev in events_in:
        db_ev = db.query(PlanningItem).filter(
            PlanningItem.id      == ev.id,
            PlanningItem.user_id == current_user.id,
        ).first()

        if db_ev:
            for k, v in ev.model_dump().items():
                setattr(db_ev, k, v)
        else:
            db_ev = PlanningItem(user_id=current_user.id, **ev.model_dump())
            db.add(db_ev)

    db.commit()
    return {"status": "ok"}


@router.delete("/events/{item_id}")
def delete_planning_event(
    item_id: str,
    db: Session = Depends(get_sqlite_db),
    current_user: models.User = Depends(get_current_user),
):
    db_ev = db.query(PlanningItem).filter(
        PlanningItem.id      == item_id,
        PlanningItem.user_id == current_user.id,
    ).first()
    if db_ev:
        db.delete(db_ev)
        db.commit()
    return {"status": "ok"}
