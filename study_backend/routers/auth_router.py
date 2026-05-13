"""
routers/auth_router.py — Authentification : inscription, connexion,
Google OAuth, mot de passe oublié / réinitialisation.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth

import auth, models, schemas
from database import get_db
from config import FRONTEND_URL, BACKEND_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
from services.email_service import send_reset_email

router = APIRouter(tags=["Auth"])

# ── Google OAuth client ───────────────────────────────────────────────────────
oauth = OAuth()
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


# ── Inscription ───────────────────────────────────────────────────────────────

@router.post("/signup", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

        hashed_pwd = auth.hash_password(user.password)
        new_user = models.User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_pwd,
            region=user.region,
        )
        db.add(new_user)
        db.flush()

        db.add(models.UserStats(user_id=new_user.id))
        db.commit()
        db.refresh(new_user)
        return new_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Cet email est déjà enregistré.")


# ── Connexion ─────────────────────────────────────────────────────────────────

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")
    if user.hashed_password is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce compte utilise Google.")
    if not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")

    access_token = auth.create_access_token(data={"sub": user.email, "is_admin": user.is_admin})
    return {"access_token": access_token, "token_type": "bearer", "is_admin": user.is_admin}


# ── Google OAuth ──────────────────────────────────────────────────────────────

@router.get("/login/google")
async def login_google(request: Request):
    redirect_uri = f"{BACKEND_URL}/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/auth/google/callback")
async def auth_google(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get("userinfo")

    user = db.query(models.User).filter(models.User.email == user_info["email"]).first()
    if not user:
        user = models.User(
            username=user_info["name"],
            email=user_info["email"],
            is_admin=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    stats = db.query(models.UserStats).filter(models.UserStats.user_id == user.id).first()
    if not stats:
        db.add(models.UserStats(user_id=user.id))
        db.commit()

    access_token = auth.create_access_token(data={"sub": user.email, "is_admin": user.is_admin})
    return RedirectResponse(url=f"{FRONTEND_URL}/login?token={access_token}")


# ── Mot de passe oublié ───────────────────────────────────────────────────────

@router.post("/forgot-password")
async def forgot_password(email_schema: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email_schema.email).first()
    if not user:
        return {"message": "Si cet email existe, un lien a été envoyé."}
    if user.hashed_password is None:
        raise HTTPException(status_code=400, detail="Ce compte utilise Google.")

    reset_token = auth.create_access_token(data={"sub": user.email})
    link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    username = user.fullname or user.username or "Utilisateur"

    await send_reset_email(user.email, username, link)
    return {"message": "Email envoyé !"}


@router.post("/reset-password")
def reset_password(reset_data: schemas.ResetPasswordUpdate, db: Session = Depends(get_db)):
    payload = auth.verify_token(reset_data.token)
    if not payload:
        raise HTTPException(status_code=400, detail="Le lien est invalide ou a expiré.")

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=400, detail="Token invalide.")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    user.hashed_password = auth.hash_password(reset_data.new_password)
    db.commit()
    return {"message": "Mot de passe réinitialisé avec succès !"}
