"""
routers/admin_router.py — Endpoints réservés aux administrateurs.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import auth, models, schemas
from database import get_db
from auth import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=List[schemas.UserOutAdmin])
def get_admin_users(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    """Récupère la liste de tous les utilisateurs (hors admins)."""
    return db.query(models.User).filter(models.User.is_admin == False).all()


@router.post("/users", response_model=schemas.UserOutAdmin, status_code=status.HTTP_201_CREATED)
def admin_create_user(
    user_data: schemas.AdminCreateUser,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    """L'admin crée un nouvel utilisateur."""
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    hashed_pwd = auth.hash_password(user_data.password)
    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pwd,
        fullname=user_data.fullname,
        institution=user_data.institution,
        region=user_data.region,
        is_admin=user_data.is_admin,
    )
    db.add(new_user)
    db.flush()
    db.add(models.UserStats(user_id=new_user.id))
    db.commit()
    db.refresh(new_user)
    return new_user


@router.delete("/users/{email}", status_code=status.HTTP_200_OK)
def admin_delete_user(
    email: str,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    """L'admin supprime un utilisateur par son email."""
    if email == current_admin.email:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous supprimer vous-même")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    db.delete(user)
    db.commit()
    return {"message": f"Utilisateur {email} supprimé avec succès"}


@router.put("/users/{email}", response_model=schemas.UserOutAdmin)
def admin_update_user(
    email: str,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    """L'admin modifie un utilisateur."""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    for key, value in user_update.model_dump(exclude_unset=True).items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    """Statistiques des utilisateurs groupées par région et université (normalisées)."""
    users = db.query(models.User).filter(models.User.is_admin == False).all()

    by_region: dict = {}
    by_institution: dict = {}

    for user in users:
        region = (user.region or "Non spécifié").strip().lower()
        norm_region = region.capitalize() if region != "non spécifié" else "Non spécifié"
        by_region[norm_region] = by_region.get(norm_region, 0) + 1

        institution = (user.institution or "Non spécifié").strip().lower()
        norm_institution = institution.capitalize() if institution != "non spécifié" else "Non spécifié"
        by_institution[norm_institution] = by_institution.get(norm_institution, 0) + 1

    return {
        "total_users": len(users),
        "by_region": by_region,
        "by_institution": by_institution,
    }
