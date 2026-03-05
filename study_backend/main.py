from fastapi import FastAPI, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from authlib.integrations.starlette_client import OAuth
import models, schemas, auth
from database import engine, get_db
from auth import get_current_user, get_current_admin 
from typing import List
from fastapi.security import OAuth2PasswordRequestForm
from starlette.middleware.sessions import SessionMiddleware

# --- NOUVEAUX IMPORTS POUR L'EMAIL ---
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

# Création des tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Study API")

app.add_middleware(SessionMiddleware, secret_key="ton_secret_pour_les_sessions_etudes_achref")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION GMAIL (À REMPLIR) ---
conf = ConnectionConfig(
    MAIL_USERNAME = "achrefjnayeh@gmail.com",        # Ton adresse Gmail
    MAIL_PASSWORD = "anqfrbovynwirqiy",        # Ton code de 16 caractères Google
    MAIL_FROM = "achrefjnayeh@gmail.com",
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

@app.get("/")
def home():
    return {"message": "Bienvenue sur l'API de Study"}

# ... (Routes signup, login, admin restent identiques) ...

@app.post("/signup", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    hashed_pwd = auth.hash_password(user.password)
    new_user = models.User(username=user.username, email=user.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
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

# --- CONFIGURATION GOOGLE OAUTH ---
oauth = OAuth()
oauth.register(
    name='google',
    client_id='708566411731-vpgbh8iapqckqckcoqpm6hrc4dm46abe.apps.googleusercontent.com',
    client_secret='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',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@app.get("/login/google")
async def login_google(request: Request):
    redirect_uri = "http://localhost:8000/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/google/callback")
async def auth_google(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get('userinfo')
    user = db.query(models.User).filter(models.User.email == user_info['email']).first()
    if not user:
        user = models.User(username=user_info['name'], email=user_info['email'], is_admin=False)
        db.add(user)
        db.commit()
        db.refresh(user)
    access_token = auth.create_access_token(data={"sub": user.email, "is_admin": user.is_admin})
    return RedirectResponse(url=f"http://localhost:5173/login?token={access_token}")

# --- ROUTE FORGOT PASSWORD FINALE (ENVOI RÉEL) ---
@app.post("/forgot-password")
async def forgot_password(email_schema: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email_schema.email).first()
    
    if not user:
        return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé."}

    if user.hashed_password is None:
        raise HTTPException(
            status_code=400, 
            detail="Ce compte utilise Google. Connectez-vous avec Google."
        )

    # Création du lien
    reset_token = auth.create_access_token(data={"sub": user.email})
    link = f"http://localhost:5173/reset-password?token={reset_token}"

    # Préparation du message HTML
    message = MessageSchema(
        subject="Réinitialisation de ton mot de passe Study 📚",
        recipients=[user.email],
        body=f"""
        <div style="font-family: Arial, sans-serif; border: 1px solid #d4af37; padding: 20px; border-radius: 10px;">
            <h2 style="color: #5d4037;">Bonjour {user.username},</h2>
            <p>Clique sur le lien ci-dessous pour changer ton mot de passe :</p>
            <a href="{link}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #8d6e63; text-decoration: none; border-radius: 5px;">Changer mon mot de passe</a>
            <p>Ce lien expirera bientôt.</p>
        </div>
        """,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)
    
    return {"message": "Le hibou est parti ! Vérifie ta boîte mail."}
@app.post("/reset-password")
async def reset_password(reset_data: schemas.ResetPasswordUpdate, db: Session = Depends(get_db)):
    # 1. Décoder le token pour trouver l'utilisateur
    try:
        # On réutilise la logique de décodage de auth.py
        payload = auth.verify_token(reset_data.token) 
        email = payload.get("sub")
    except:
        raise HTTPException(status_code=400, detail="Le lien est invalide ou a expiré.")

    # 2. Chercher l'utilisateur dans la base
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé.")

    # 3. Mettre à jour le mot de passe
    user.hashed_password = auth.hash_password(reset_data.new_password)
    db.commit()

    return {"message": "Ton mot de passe a été mis à jour avec succès !"}