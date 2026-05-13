"""
routers/users_router.py — Profil utilisateur, statistiques, badges, progression.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import auth, models, schemas
from database import get_db
from services.badge_service import parse_badges, normalize_badges

router = APIRouter(tags=["Users"])


# ── Profil ────────────────────────────────────────────────────────────────────

@router.get("/users/me", response_model=schemas.UserOut)
def get_my_profile(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@router.put("/users/me", response_model=schemas.UserOut)
def update_my_profile(
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    db_user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    for key, value in user_update.model_dump(exclude_unset=True).items():
        setattr(db_user, key, value)

    try:
        db.commit()
        db.refresh(db_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur base de données : {str(e)}")

    return db_user


# ── Statistiques ──────────────────────────────────────────────────────────────

@router.get("/users/me/stats", response_model=schemas.UserStatsOut)
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    stats = db.query(models.UserStats).filter(models.UserStats.user_id == current_user.id).first()
    if not stats:
        raise HTTPException(status_code=404, detail="Statistiques non trouvées")
    return stats


# ── Badges ────────────────────────────────────────────────────────────────────

@router.post("/users/me/badges")
def add_custom_badge(
    badge: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    stats = db.query(models.UserStats).filter(models.UserStats.user_id == current_user.id).first()
    if not stats:
        raise HTTPException(status_code=404, detail="Statistiques introuvables")

    badges = parse_badges(stats.badges)
    new_badge = str(badge.get("name", "")).strip()
    if new_badge and new_badge not in badges:
        badges.append(new_badge)
        stats.badges = json.dumps(normalize_badges(badges))
        db.commit()
    return {"badges": badges}


# ── Progression ───────────────────────────────────────────────────────────────

@router.get("/api/progression")
def get_progression(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    stats = db.query(models.UserStats).filter(models.UserStats.user_id == current_user.id).first()
    if not stats:
        stats = models.UserStats(user_id=current_user.id)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return stats


@router.post("/api/progression")
def update_progression(
    prog_in: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    db_stats = db.query(models.UserStats).filter(models.UserStats.user_id == current_user.id).first()
    if not db_stats:
        raise HTTPException(status_code=404, detail="Stats introuvables")

    inc_sec = prog_in.get("increment_seconds", 0)
    inc_pres = prog_in.get("increment_presence", 0)
    inc_docs = prog_in.get("increment_documents_analyzed", 0)

    if inc_sec > 0:
        db_stats.total_study_seconds += inc_sec
    elif "total_study_seconds" in prog_in:
        db_stats.total_study_seconds = prog_in["total_study_seconds"]

    if inc_pres > 0:
        db_stats.days_present += inc_pres

    if inc_docs > 0:
        db_stats.documents_analyzed += inc_docs

    db.commit()
    return {
        "message": "Succès",
        "total_seconds": db_stats.total_study_seconds,
        "days_present": db_stats.days_present,
        "documents_analyzed": db_stats.documents_analyzed,
    }
