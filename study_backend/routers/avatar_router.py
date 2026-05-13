"""
routers/avatar_router.py — Configuration de l'avatar utilisateur.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models, schemas
from auth import get_current_user
from sqlite_models import get_db as get_sqlite_db, AvatarConfig

router = APIRouter(prefix="/api", tags=["Avatar"])

_DEFAULT_AVATAR = {
    "top":          "shortFlat",
    "hairColor":    "2c1b18",
    "eyes":         "default",
    "eyebrows":     "defaultNatural",
    "mouth":        "default",
    "facialHair":   "none",
    "clothing":     "shirtCrewNeck",
    "clothesColor": "262e33",
    "accessories":  "none",
    "skinColor":    "ffdbb4",
}


@router.get("/avatar")
def get_avatar(
    db: Session = Depends(get_sqlite_db),
    current_user: models.User = Depends(get_current_user),
):
    db_av = db.query(AvatarConfig).filter(AvatarConfig.user_id == current_user.id).first()
    if db_av:
        return db_av.config
    return _DEFAULT_AVATAR


@router.post("/avatar")
def save_avatar(
    config: schemas.AvatarConfigSchema,
    db: Session = Depends(get_sqlite_db),
    current_user: models.User = Depends(get_current_user),
):
    db_av = db.query(AvatarConfig).filter(AvatarConfig.user_id == current_user.id).first()
    if db_av:
        db_av.config = config.model_dump()
    else:
        db_av = AvatarConfig(user_id=current_user.id, config=config.model_dump())
        db.add(db_av)
    db.commit()
    return db_av.config
