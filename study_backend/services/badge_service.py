"""
services/badge_service.py — Logique de gestion des badges utilisateurs.
"""
import json
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func


def parse_badges(raw: str) -> list[str]:
    """Désérialise la colonne JSON `badges` en liste de chaînes."""
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
    except Exception:
        return [str(raw)]
    return []


def normalize_badges(badges: list[str]) -> list[str]:
    """Déduplique et trie les badges."""
    normalized = []
    for item in badges:
        text = str(item).strip()
        if text and text not in normalized:
            normalized.append(text)
    return sorted(normalized)


def update_user_badges(db: Session, user_id: int, mode: str) -> None:
    """
    Recalcule et persiste les badges de l'utilisateur après une nouvelle
    entrée dans l'historique IA.
    """
    import models
    import sqlite_models

    stats = db.query(models.UserStats).filter(models.UserStats.user_id == user_id).first()
    if not stats:
        return

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    total_today = db.query(sqlite_models.IaHistory).filter(
        sqlite_models.IaHistory.user_id == user_id,
        sqlite_models.IaHistory.timestamp >= today_start,
    ).count()

    resume_today = db.query(sqlite_models.IaHistory).filter(
        sqlite_models.IaHistory.user_id == user_id,
        sqlite_models.IaHistory.mode == "resume",
        sqlite_models.IaHistory.timestamp >= today_start,
    ).count()

    qcm_today = db.query(sqlite_models.IaHistory).filter(
        sqlite_models.IaHistory.user_id == user_id,
        sqlite_models.IaHistory.mode == "qcm",
        sqlite_models.IaHistory.timestamp >= today_start,
    ).count()

    qr_today = db.query(sqlite_models.IaHistory).filter(
        sqlite_models.IaHistory.user_id == user_id,
        sqlite_models.IaHistory.mode == "qr",
        sqlite_models.IaHistory.timestamp >= today_start,
    ).count()

    total_history = db.query(sqlite_models.IaHistory).filter(
        sqlite_models.IaHistory.user_id == user_id,
    ).count()

    unique_subjects = (
        db.query(func.count(func.distinct(sqlite_models.IaHistory.subject)))
        .filter(
            sqlite_models.IaHistory.user_id == user_id,
            sqlite_models.IaHistory.subject != None,
            sqlite_models.IaHistory.subject != "",
        )
        .scalar()
        or 0
    )

    badges = parse_badges(stats.badges)

    if total_history > 0 and "Premier utilisation" not in badges:
        badges.append("Premier utilisation")
    if unique_subjects >= 5 and "+5 matières ajoutées" not in badges:
        badges.append("+5 matières ajoutées")
    if resume_today >= 10 and "Résumé Expert" not in badges:
        badges.append("Résumé Expert")
    if qcm_today >= 5 and "QCM Master" not in badges:
        badges.append("QCM Master")
    if qr_today >= 5 and "Conversation Active" not in badges:
        badges.append("Conversation Active")
    if stats.total_study_seconds >= 3600 and "1h d'étude" not in badges:
        badges.append("1h d'étude")
    if stats.days_present >= 7 and "Présence 1 semaine" not in badges:
        badges.append("Présence 1 semaine")

    stats.badges = json.dumps(normalize_badges(badges))
    db.commit()


def recalc_days_present(user_id: int) -> int:
    """Compte le nombre de jours distincts où l'utilisateur a une entrée IA."""
    import sqlite_models
    db = sqlite_models.SessionLocal()
    try:
        count = (
            db.query(func.strftime("%Y-%m-%d", sqlite_models.IaHistory.timestamp))
            .filter(sqlite_models.IaHistory.user_id == user_id)
            .distinct()
            .count()
        )
        return count
    finally:
        db.close()
