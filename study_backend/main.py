from fastapi import FastAPI, Depends, HTTPException, status, Request, APIRouter
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi.middleware.cors import CORSMiddleware
from authlib.integrations.starlette_client import OAuth
import models, schemas, auth
from database import engine, get_db
from auth import get_current_user, get_current_admin 
from typing import List
from fastapi.security import OAuth2PasswordRequestForm
from starlette.middleware.sessions import SessionMiddleware
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

# Création des tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Study API")

# Middleware
app.add_middleware(SessionMiddleware, secret_key="ton_secret_pour_les_sessions_etudes_achref")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration Email
conf = ConnectionConfig(
    MAIL_USERNAME = "achrefjnayeh@gmail.com",
    MAIL_PASSWORD = "anqfrbovynwirqiy", 
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

# --- AUTHENTICATION ---

@app.post("/signup", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
        
        hashed_pwd = auth.hash_password(user.password)
        new_user = models.User(
            username=user.username, 
            email=user.email, 
            hashed_password=hashed_pwd
        )
        db.add(new_user)
        db.flush() 

        new_stats = models.UserStats(user_id=new_user.id)
        db.add(new_stats)
        
        db.commit()
        db.refresh(new_user)
        return new_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Cet email est déjà enregistré.")

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

# --- GOOGLE OAUTH ---
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

    stats = db.query(models.UserStats).filter(models.UserStats.user_id == user.id).first()
    if not stats:
        new_stats = models.UserStats(user_id=user.id)
        db.add(new_stats)
        db.commit()

    access_token = auth.create_access_token(data={"sub": user.email, "is_admin": user.is_admin})
    return RedirectResponse(url=f"http://localhost:5173/login?token={access_token}")

# --- PROFIL UTILISATEUR (FIXED) ---

@app.get("/users/me", response_model=schemas.UserOut)
def get_my_profile(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.put("/users/me", response_model=schemas.UserOut)
def update_my_profile(
    user_update: schemas.UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    db_user = db.query(models.User).filter(models.User.id == current_user.id).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    # On convertit le schéma en dictionnaire en ignorant les valeurs non envoyées
    update_data = user_update.model_dump(exclude_unset=True)
    
    # On met à jour dynamiquement chaque champ présent
    for key, value in update_data.items():
        setattr(db_user, key, value)

    try:
        db.commit()
        db.refresh(db_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur base de données : {str(e)}")
        
    return db_user

# --- STATISTIQUES ---

@app.get("/users/me/stats")
def get_my_stats(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    stats = db.query(models.UserStats).filter(models.UserStats.user_id == current_user.id).first()
    if not stats:
        stats = models.UserStats(user_id=current_user.id)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return stats

@app.put("/users/me/stats")
def update_my_stats(stats_update: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_stats = db.query(models.UserStats).filter(models.UserStats.user_id == current_user.id).first()
    if not db_stats:
        raise HTTPException(status_code=404, detail="Stats introuvables")

    new_seconds = stats_update.get("total_study_seconds", db_stats.total_study_seconds)
    db_stats.total_study_seconds = new_seconds
    db_stats.days_present = new_seconds // 86400 
    
    db.commit()
    return {"message": "Succès", "total_seconds": db_stats.total_study_seconds}

# --- AUTRES ROUTES ---

@app.post("/forgot-password")
async def forgot_password(email_schema: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email_schema.email).first()
    if not user:
        return {"message": "Si cet email existe, un lien a été envoyé."}
    if user.hashed_password is None:
        raise HTTPException(status_code=400, detail="Ce compte utilise Google.")

    reset_token = auth.create_access_token(data={"sub": user.email})
    link = f"http://localhost:5173/reset-password?token={reset_token}"
    message = MessageSchema(
        subject="Réinitialisation de ton mot de passe Study 📚",
        recipients=[user.email],
        body=f"Clique ici : {link}",
        subtype=MessageType.html
    )
    fm = FastMail(conf)
    await fm.send_message(message)
    return {"message": "Email envoyé !"}

@app.get("/admin/users", response_model=List[schemas.UserOut])
def get_admin_users(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin)):
    return db.query(models.User).all()