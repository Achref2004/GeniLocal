"""
main.py — Point d'entrée minimal de l'API GeniLocal.

Toute la logique métier est déléguée aux modules :
  routers/   → auth, users, admin, ia, ocr, history, chat, planning, avatar
  services/  → badge_service, ia_service, email_service
  config.py  → variables d'environnement
"""
import models
from database import engine, get_db
from sqlite_models import Base as SqliteBase, engine as sqlite_engine

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from config import SESSION_SECRET_KEY

# ── Import de tous les routers ─────────────────────────────────────────────────
from routers.auth_router     import router as auth_router
from routers.users_router    import router as users_router
from routers.admin_router    import router as admin_router
from routers.ia_router       import router as ia_router
from routers.ocr_router      import router as ocr_router
from routers.history_router  import router as history_router
from routers.chat_router     import router as chat_router
from routers.planning_router import router as planning_router
from routers.avatar_router   import router as avatar_router

# ── Création des tables (main DB + SQLite user data) ──────────────────────────
models.Base.metadata.create_all(bind=engine)
SqliteBase.metadata.create_all(bind=sqlite_engine)

# ── Application FastAPI ────────────────────────────────────────────────────────
app = FastAPI(
    title="GeniLocal API",
    description="API backend de l'application GeniLocal — IA, OCR, planning et suivi étudiant.",
    version="1.0.0",
)

# ── Middlewares ────────────────────────────────────────────────────────────────
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET_KEY)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Enregistrement des routers ────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(ia_router)
app.include_router(ocr_router)
app.include_router(history_router)
app.include_router(chat_router)
app.include_router(planning_router)
app.include_router(avatar_router)


# ── Route racine ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
def home():
    return {"message": "Bienvenue sur l'API de GeniLocal"}


# ── Démarrage local ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
