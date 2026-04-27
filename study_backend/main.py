from fastapi import FastAPI, Depends, HTTPException, status, Request, APIRouter, UploadFile, File
from fastapi.responses import RedirectResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from fastapi.middleware.cors import CORSMiddleware
from authlib.integrations.starlette_client import OAuth
import models, schemas, auth, sqlite_models
from database import engine, get_db
from auth import get_current_user, get_current_admin
from typing import List, Dict, AsyncGenerator
from fastapi.security import OAuth2PasswordRequestForm
from starlette.middleware.sessions import SessionMiddleware
from datetime import datetime, timedelta
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
import httpx
import json
import os
import sys
import tempfile
from dotenv import load_dotenv

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# Création des tables (main database)
models.Base.metadata.create_all(bind=engine)

# Création des tables SQLite pour données utilisateur (history, cache, planning, avatar)
from sqlite_models import Base as SqliteBase, engine as sqlite_engine, get_db as get_sqlite_db
SqliteBase.metadata.create_all(bind=sqlite_engine)

app = FastAPI(title="GeniLocal API")

# Middleware
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET_KEY", "ton_secret_pour_les_sessions_etudes_achref"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration Email
conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD"), 
    MAIL_FROM = os.getenv("MAIL_FROM"),
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

@app.get("/")
def home():
    return {"message": "Bienvenue sur l'API de GeniLocal"}

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
            hashed_password=hashed_pwd,
            region=user.region
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
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@app.get("/login/google")
async def login_google(request: Request):
    redirect_uri = f"{BACKEND_URL}/auth/google/callback"
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
    return RedirectResponse(url=f"{FRONTEND_URL}/login?token={access_token}")

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

@app.get("/users/me/stats", response_model=schemas.UserStatsOut)
def get_my_stats(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    stats = db.query(models.UserStats).filter(models.UserStats.user_id == current_user.id).first()
    if not stats:
        raise HTTPException(status_code=404, detail="Statistiques non trouvées")
    return stats

# --- BADGES ET PROGRESSION INTELLIGENTE ---

def parse_badges(raw: str):
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
    except Exception:
        return [str(raw)]
    return []


def normalize_badges(badges):
    normalized = []
    for item in badges:
        text = str(item).strip()
        if text and text not in normalized:
            normalized.append(text)
    return sorted(normalized)


def update_user_badges(db: Session, user_id: int, mode: str):
    stats = db.query(models.UserStats).filter(models.UserStats.user_id == user_id).first()
    if not stats:
        return

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    total_today = db.query(sqlite_models.IaHistory).filter(
        sqlite_models.IaHistory.user_id == user_id,
        sqlite_models.IaHistory.timestamp >= today_start
    ).count()
    resume_today = db.query(sqlite_models.IaHistory).filter(
        sqlite_models.IaHistory.user_id == user_id,
        sqlite_models.IaHistory.mode == 'resume',
        sqlite_models.IaHistory.timestamp >= today_start
    ).count()
    qcm_today = db.query(sqlite_models.IaHistory).filter(
        sqlite_models.IaHistory.user_id == user_id,
        sqlite_models.IaHistory.mode == 'qcm',
        sqlite_models.IaHistory.timestamp >= today_start
    ).count()
    qr_today = db.query(sqlite_models.IaHistory).filter(
        sqlite_models.IaHistory.user_id == user_id,
        sqlite_models.IaHistory.mode == 'qr',
        sqlite_models.IaHistory.timestamp >= today_start
    ).count()
    total_history = db.query(sqlite_models.IaHistory).filter(
        sqlite_models.IaHistory.user_id == user_id
    ).count()
    unique_subjects = db.query(func.count(func.distinct(sqlite_models.IaHistory.subject))).filter(
        sqlite_models.IaHistory.user_id == user_id,
        sqlite_models.IaHistory.subject != None,
        sqlite_models.IaHistory.subject != ''
    ).scalar() or 0

    badges = parse_badges(stats.badges)

    if total_history > 0 and 'Premier utilisation' not in badges:
        badges.append('Premier utilisation')
    if unique_subjects >= 5 and '+5 matières ajoutées' not in badges:
        badges.append('+5 matières ajoutées')
    if resume_today >= 10 and 'Résumé Expert' not in badges:
        badges.append('Résumé Expert')
    if qcm_today >= 5 and 'QCM Master' not in badges:
        badges.append('QCM Master')
    if qr_today >= 5 and 'Conversation Active' not in badges:
        badges.append('Conversation Active')
    if stats.total_study_seconds >= 3600 and '1h d\'étude' not in badges:
        badges.append('1h d\'étude')
    if stats.days_present >= 7 and 'Présence 1 semaine' not in badges:
        badges.append('Présence 1 semaine')

    stats.badges = json.dumps(normalize_badges(badges))
    db.commit()


def recalc_days_present(user_id: int) -> int:
    db = sqlite_models.SessionLocal()
    try:
        count = db.query(func.strftime('%Y-%m-%d', sqlite_models.IaHistory.timestamp)).filter(
            sqlite_models.IaHistory.user_id == user_id
        ).distinct().count()
        return count
    finally:
        db.close()


@app.post('/users/me/badges')
def add_custom_badge(badge: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    stats = db.query(models.UserStats).filter(models.UserStats.user_id == current_user.id).first()
    if not stats:
        raise HTTPException(status_code=404, detail='Statistiques introuvables')

    badges = parse_badges(stats.badges)
    new_badge = str(badge.get('name', '')).strip()
    if new_badge and new_badge not in badges:
        badges.append(new_badge)
        stats.badges = json.dumps(normalize_badges(badges))
        db.commit()
    return {'badges': badges}

# --- STATISTIQUES ---

@app.get("/api/progression")
def get_progression(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    stats = db.query(models.UserStats).filter(models.UserStats.user_id == current_user.id).first()
    if not stats:
        stats = models.UserStats(user_id=current_user.id)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return stats

@app.post("/api/progression")
def update_progression(prog_in: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_stats = db.query(models.UserStats).filter(models.UserStats.user_id == current_user.id).first()
    if not db_stats:
        raise HTTPException(status_code=404, detail="Stats introuvables")

    inc_sec = prog_in.get("increment_seconds", 0)
    inc_pres = prog_in.get("increment_presence", 0)
    
    if inc_sec > 0:
        db_stats.total_study_seconds += inc_sec
    elif "total_study_seconds" in prog_in:
        # Fallback to direct set for backwards compatibility if needed
        db_stats.total_study_seconds = prog_in["total_study_seconds"]
        
    if inc_pres > 0:
        db_stats.days_present += inc_pres
    
    db.commit()
    return {"message": "Succès", "total_seconds": db_stats.total_study_seconds, "days_present": db_stats.days_present}

# --- AUTRES ROUTES ---

@app.post("/forgot-password")
async def forgot_password(email_schema: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email_schema.email).first()
    if not user:
        return {"message": "Si cet email existe, un lien a été envoyé."}
    if user.hashed_password is None:
        raise HTTPException(status_code=400, detail="Ce compte utilise Google.")

    reset_token = auth.create_access_token(data={"sub": user.email})
    link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    # Créer un template HTML 
    username = user.fullname or user.username or "Utilisateur"

    html_body = f"""
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                margin: 0;
                padding: 20px;
                font-family: 'Georgia', 'Playfair Display', serif;
                background: #f5f5f5;
            }}
            .wrapper {{
                max-width: 520px;
                margin: 0 auto;
            }}
            .card {{
                background: linear-gradient(135deg, #1a2845 0%, #0f1419 100%);
                position: relative;
                padding: 50px 40px;
                text-align: center;
                border-radius: 8px;
                border: 4px solid #c0c0c0;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }}
            .card-content {{
                position: relative;
                z-index: 1;
            }}
            .logo {{
                font-size: 37px;
                font-weight: bold;
                margin-bottom: 20px;
                letter-spacing: 2px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.7), 0 0 8px rgba(0,0,0,0.5);
            }}
            .greeting {{
                font-size: 26px;
                font-weight: normal;
                margin-bottom: 10px;
                letter-spacing: 0.5px;
                color: #c0c0c0;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.7), 0 0 8px rgba(0,0,0,0.5);
            }}
            .user-name {{
                font-size: 38px;
                font-weight: bold;
                margin-bottom: 30px;
                color: #e8d5b7;
                text-shadow: 3px 3px 6px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.6);
                font-family: 'Playfair Display', Georgia, serif;
            }}
            .message {{
                color: #e0e0e0;
                font-size: 14px;
                line-height: 1.8;
                margin: 20px 0;
                font-family: 'Georgia', serif;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.7), 0 0 6px rgba(0,0,0,0.5);
            }}
            .button {{
                display: inline-block;
                background: linear-gradient(135deg, #1a3456 0%, #0d1b2a 100%);
                color: white;
                padding: 14px 45px;
                text-decoration: none;
                border-radius: 4px;
                font-weight: 700;
                font-size: 15px;
                letter-spacing: 1.2px;
                text-transform: uppercase;
                box-shadow: 0 4px 15px rgba(26, 52, 86, 0.6);
                transition: all 0.3s ease;
                margin: 30px 0;
            }}
            .button:hover {{
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(26, 52, 86, 0.8);
                background: linear-gradient(135deg, #2a4a70 0%, #1a3456 100%);
            }}
            .security-note {{
                font-size: 12px;
                color: #b0b0b0;
                margin-top: 20px;
                font-family: 'Georgia', serif;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.7), 0 0 6px rgba(0,0,0,0.5);
            }}
            .footer {{
                text-align: center;
                margin-top: 40px;
                color: #e8d5b7;
                font-size: 12px;
                font-family: 'Georgia', serif;
                letter-spacing: 0.5px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.7), 0 0 6px rgba(0,0,0,0.5);
            }}
            .ticket-divider {{
                border-top: 2px dashed #c0c0c0;
                margin: 40px 0;
                opacity: 0.6;
            }}
            .ticket-footer {{
                text-align: center;
                color: #c0c0c0;
                font-size: 11px;
                font-family: 'Georgia', serif;
                line-height: 1.8;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
                margin-top: 30px;
                padding-top: 20px;
            }}
            .ticket-footer .copyright {{
                color: #a0a0a0;
                font-size: 10px;
                margin-bottom: 10px;
            }}
            .ticket-footer .author {{
                color: #a0a0a0;
                font-size: 10px;
                margin-bottom: 15px;
            }}
            .ticket-footer .message {{
                color: #e8d5b7;
                font-size: 12px;
                font-weight: bold;
                letter-spacing: 0.5px;
            }}
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="card">
                <div class="card-content">
                    <!-- Logo -->
                    <div class="logo"> <span style="color: #0b57a0;">Geni</span><span style="color:#763349 ;">Local</span></div>
                    <!-- Greeting with user name -->
                    <div class="greeting">Bienvenue</div>
                    <div class="user-name">{username}</div>

                    <!-- Message -->
                    <p class="message">
                        Nous avons reçu une demande de réinitialisation<br>
                        de votre mot de passe.
                    </p>

                    <!-- Reset button -->
                    <a href="{link}" class="button"> Réinitialiser</a>

                    <!-- Security note -->
                    <p class="security-note"> Ce lien expirera dans 1 heure</p>

                    <!-- Ticket divider -->
                    <div class="ticket-divider"></div>

                    <!-- Ticket footer -->
                    <div class="ticket-footer">
                        <div class="copyright">© 2026 Study - Tous droits réservés</div>
                        <div class="author">Créé par Achref Jnayeh</div>
                        <div class="message">✨ Bonne chance champione dans vos apprentissages! ✨</div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    message = MessageSchema(
        subject=" Réinitialisation de votre mot de passe GeniLocal",
        recipients=[user.email],
        body=html_body,
        subtype=MessageType.html
    )
    fm = FastMail(conf)
    await fm.send_message(message)
    return {"message": "Email envoyé !"}

@app.post("/reset-password")
def reset_password(reset_data: schemas.ResetPasswordUpdate, db: Session = Depends(get_db)):
    # Vérifier que le token est valide
    payload = auth.verify_token(reset_data.token)
    if not payload:
        raise HTTPException(status_code=400, detail="Le lien est invalide ou a expiré.")

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=400, detail="Token invalide.")

    # Chercher l'utilisateur
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    # Mettre à jour le mot de passe
    user.hashed_password = auth.hash_password(reset_data.new_password)
    db.commit()

    return {"message": "Mot de passe réinitialisé avec succès !"}

@app.get("/admin/users", response_model=List[schemas.UserOutAdmin])
def get_admin_users(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin)):
    """Récupère la liste de tous les utilisateurs (sauf les admins)"""
    return db.query(models.User).filter(models.User.is_admin == False).all()

@app.post("/admin/users", response_model=schemas.UserOutAdmin, status_code=status.HTTP_201_CREATED)
def admin_create_user(
    user_data: schemas.AdminCreateUser,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """L'admin crée un nouvel utilisateur"""
    # Vérifier que l'email n'existe pas déjà
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    # Créer le nouvel utilisateur
    hashed_pwd = auth.hash_password(user_data.password)
    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pwd,
        fullname=user_data.fullname,
        institution=user_data.institution,
        region=user_data.region,
        is_admin=user_data.is_admin
    )
    db.add(new_user)
    db.flush()

    # Créer les stats pour le nouvel utilisateur
    new_stats = models.UserStats(user_id=new_user.id)
    db.add(new_stats)

    db.commit()
    db.refresh(new_user)
    return new_user

@app.delete("/admin/users/{email}", status_code=status.HTTP_200_OK)
def admin_delete_user(
    email: str,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """L'admin supprime un utilisateur par son email"""
    # On ne peut pas supprimer l'admin lui-même
    if email == current_admin.email:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous supprimer vous-même")

    # Trouver l'utilisateur
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    # Supprimer l'utilisateur (les stats sont supprimées en cascade)
    db.delete(user)
    db.commit()

    return {"message": f"Utilisateur {email} supprimé avec succès"}

@app.put("/admin/users/{email}", response_model=schemas.UserOutAdmin)
def admin_update_user(
    email: str,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """L'admin modifie un utilisateur"""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    # Mettre à jour les champs
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user

@app.get("/admin/stats")
def get_admin_stats(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin)):
    """Retourne les statistiques des utilisateurs groupées par région et université (normalisées)"""
    users = db.query(models.User).filter(models.User.is_admin == False).all()

    # Grouper par région et université (normalisé en minuscules, affiché en capitalize)
    by_region = {}
    by_institution = {}

    for user in users:
        # Ligne 1: Normaliser la région (minuscules, trim, puis capitalize)
        region = (user.region or "Non spécifié").strip().lower()
        normalized_region = region.capitalize() if region != "non spécifié" else "Non spécifié"
        by_region[normalized_region] = by_region.get(normalized_region, 0) + 1

        # Ligne 2: Normaliser l'université (minuscules, trim, puis capitalize)
        institution = (user.institution or "Non spécifié").strip().lower()
        normalized_institution = institution.capitalize() if institution != "non spécifié" else "Non spécifié"
        by_institution[normalized_institution] = by_institution.get(normalized_institution, 0) + 1

    return {
        "total_users": len(users),
        "by_region": by_region,
        "by_institution": by_institution
    }


# ══════════════════════════════════════════════════════════════
# MODULE IA — RAISONNEMENT (Ollama / Mistral Streaming)
# ══════════════════════════════════════════════════════════════

OLLAMA_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")


def build_ia_prompt(
    mode: str,
    text: str,
    subject: str = "",
    user_answer: str = "",
    language: str = "fr",
    wrong_topics: str = "",
) -> str:
    lang = language.lower() if language else 'fr'
    if lang not in ('fr', 'en', 'ar'):
        lang = 'fr'

    if mode == "resume":
        if lang == 'en':
            return (
                f"You are an expert teacher in {subject}. "
                f"Create a clear, structured and concise summary of the following text. "
                f"Use headings, bullet points and key takeaways. "
                f"Respond only in ENGLISH.\n\nText:\n{text}"
            )
        elif lang == 'ar':
            return (
                f"أنت معلم خبير في {subject}. "
                f"قدم ملخصًا واضحًا ومنظمًا ومختصرًا للنص التالي. "
                f"استخدم عناوين ونقاطًا رئيسية. "
                f"أجب باللغة العربية فقط.\n\nالنص:\n{text}"
            )
        return (
            f"Tu es un professeur expert en {subject}. "
            f"Fais un résumé clair, structuré et concis du texte suivant. "
            f"Utilise des titres, des puces et des points clés. "
            f"Réponds uniquement en français.\n\nTexte:\n{text}"
        )
    elif mode == "qcm":
        if lang == 'en':
            return (
                f"You are an expert quiz creator. Generate exactly 5 multiple choice questions based on the following text. "
                f"Each question must have exactly 4 options and one correct answer. "
                f"Respond ONLY with valid JSON, no extra text, in this exact format:\n"
                f'[{{"question":"...","choices":["Option A","Option B","Option C","Option D"],"correct":0}}]\n'
                f"Text:\n{text}"
            )
        elif lang == 'ar':
            return (
                f"أنت خبير في إنشاء الاختبارات. أنشئ 5 أسئلة اختيار من متعدد استنادًا إلى النص التالي. "
                f"يجب أن تحتوي كل سؤال على 4 خيارات وإجابة صحيحة واحدة. "
                f"أجب فقط بصيغة JSON صحيحة، بدون نص إضافي.\n"
                f'[{{"question":"...","choices":["الخيار أ","الخيار ب","الخيار ج","الخيار د"],"correct":0}}]\n'
                f"النص:\n{text}"
            )
        return (
            f"Tu es un professeur. Génère exactement 5 questions QCM basées sur le texte suivant. "
            f"Chaque question doit avoir exactement 4 choix et une seule bonne réponse. "
            f"Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni apres, dans ce format exact:\n"
            f'[{{"question":"...","choices":["Option A","Option B","Option C","Option D"],"correct":0}}]\n'
            f"Texte:\n{text}"
        )
    elif mode == "qcm_remedial":
        topics = (wrong_topics or "").strip() or "les notions mal comprises"
        if lang == "en":
            return (
                f"You are an expert teacher. The learner struggled with these items:\n{topics}\n\n"
                f"Generate exactly 3 clear multiple-choice questions in ENGLISH based on the reference text below. "
                f"Each question must have exactly 4 options and one correct answer (index 0-3 in field \"correct\"). "
                f"Respond ONLY with a JSON array, no markdown, no extra text, in this exact shape:\n"
                f'[{{"question":"...","choices":["A","B","C","D"],"correct":0}}]\n\n'
                f"Reference text:\n{text}"
            )
        if lang == "ar":
            return (
                f"أنت معلم خبير. واجه المتعلم صعوبات في:\n{topics}\n\n"
                f"أنشئ بالضبط 3 أسئلة اختيار من متعدد واضحة بالعربية من النص المرجعي. "
                f"لكل سؤال 4 خيارات وإجابة صحيحة واحدة (حقل correct من 0 إلى 3). "
                f"أجب فقط بمصفوفة JSON بدون markdown:\n"
                f'[{{"question":"...","choices":["أ","ب","ج","د"],"correct":0}}]\n\n'
                f"النص:\n{text}"
            )
        return (
            f"Tu es un professeur expert. L'apprenant a eu des difficultés sur les sujets suivants :\n{topics}\n\n"
            f"Génère exactement 3 questions QCM SIMPLES en FRANÇAIS, basées sur le texte de référence ci-dessous, "
            f"pour consolider ces notions. Chaque question : exactement 4 choix, une seule bonne réponse (champ \"correct\" = 0 à 3). "
            f"Réponds UNIQUEMENT avec un tableau JSON (commence par [ et finit par ]), sans markdown, sans texte avant ou après :\n"
            f'[{{"question":"...","choices":["Option A","Option B","Option C","Option D"],"correct":0}}]\n\n'
            f"Texte de référence :\n{text}"
        )
    elif mode == "qr_question":
        if lang == 'en':
            return (
                f"You are an expert teacher. Ask ONE single meaningful question based on the following text to test the learner's understanding. "
                f"Ask only the question, nothing else.\n\nText:\n{text}"
            )
        elif lang == 'ar':
            return (
                f"أنت معلم خبير. اطرح سؤالًا واحدًا فقط بناءً على النص التالي لاختبار فهم الطالب. "
                f"اطرح السؤال فقط، دون أي نص إضافي.\n\nالنص:\n{text}"
            )
        return (
            f"Tu es un professeur. Pose UNE seule question pertinente basée sur le texte suivant pour tester la compréhension de l'étudiant. "
            f"Pose uniquement la question, rien d'autre.\n\nTexte:\n{text}"
        )
    elif mode == "qr_correct":
        if lang == 'en':
            return (
                f"You are a kind expert teacher. Here is the reference text:\n{text}\n\n"
                f"Student answer: {user_answer}\n\n"
                f"Evaluate the answer. Say if it is correct or incorrect, explain why, and stay encouraging. "
                f"Respond only in ENGLISH."
            )
        elif lang == 'ar':
            return (
                f"أنت معلم خبير وودود. إليك النص المرجعي:\n{text}\n\n"
                f"إجابة الطالب: {user_answer}\n\n"
                f"قيم الإجابة. قل إذا كانت صحيحة أم خاطئة واشرح لماذا. كن مشجعًا. "
                f"أجب باللغة العربية فقط."
            )
        return (
            f"Tu es un professeur bienveillant. Voici le contexte:\n\n"
            f"Texte de référence:\n{text}\n\n"
            f"Réponse de l'étudiant : {user_answer}\n\n"
            f"Évalue la réponse. Dis si c'est correct ou incorrect, explique pourquoi. "
            f"Sois encourageant. Réponds uniquement en français."
        )
    return text


async def stream_ollama_response(prompt: str, is_json: bool = False):
    """Stream from Ollama without caching (for chat, Q/R correction, etc.)."""
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": True,
        "options": {"temperature": 0.7, "num_predict": 2048, "top_k": 40, "top_p": 0.9, "num_ctx": 4096}
    }
    if is_json:
        payload["format"] = "json"
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream("POST", OLLAMA_URL, json=payload) as response:
            full_text = ""
            async for chunk in response.aiter_lines():
                line = str(chunk)
                if line.strip():
                    try:
                        data = json.loads(line)
                        token = str(data.get("response", ""))
                        full_text += token
                        done = bool(data.get("done", False))
                        yield f"data: {json.dumps({'token': token, 'done': done})}\n\n"
                        if done:
                            yield f"data: {json.dumps({'token': '', 'done': True, 'full_text': full_text})}\n\n"
                            break
                    except json.JSONDecodeError:
                        continue


async def stream_ollama_and_cache(prompt: str, is_json: bool, user_id: int, input_hash: str, mode: str, subject: str, input_text: str):
    """Stream from Ollama and save completed response to IaCache."""
    from sqlite_models import IaCache, SessionLocal as SqliteSession
    full_text = ""
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": True,
        "options": {"temperature": 0.7, "num_predict": 2048, "top_k": 40, "top_p": 0.9, "num_ctx": 4096}
    }
    if is_json:
        payload["format"] = "json"
    async with httpx.AsyncClient(timeout=300.0) as client:
        async with client.stream("POST", OLLAMA_URL, json=payload) as response:
            async for chunk in response.aiter_lines():
                line = str(chunk)
                if line.strip():
                    try:
                        data = json.loads(line)
                        token = str(data.get("response", ""))
                        full_text += token
                        done = bool(data.get("done", False))
                        yield f"data: {json.dumps({'token': token, 'done': done})}\n\n"
                        if done:
                            yield f"data: {json.dumps({'token': '', 'done': True, 'full_text': full_text})}\n\n"
                            break
                    except json.JSONDecodeError:
                        continue

    # Save to cache after streaming completes
    if full_text.strip():
        try:
            db = SqliteSession()
            cache_entry = IaCache(
                user_id=user_id,
                input_hash=input_hash,
                mode=mode,
                subject=subject or "",
                input_text=input_text[:2000],
                response=full_text,
            )
            db.add(cache_entry)
            db.commit()
            db.close()
        except Exception as e:
            print(f"⚠️ Cache save error: {e}")


@app.post("/api/generate")
async def ia_generate(request: Request, db: Session = Depends(get_db)):
    from sqlite_models import IaCache, SessionLocal as SqliteSession
    body = await request.json()
    mode = body.get("mode", "resume")
    text = body.get("text", "")
    subject = body.get("subject", "")
    user_answer = body.get("user_answer", "")
    language = body.get("language", "fr")
    wrong_topics = body.get("wrongTopics") or body.get("wrong_topics") or ""

    # --- Cache lookup (only for cacheable modes without user_answer) ---
    cacheable_modes = ("resume", "qcm", "qr_question", "qcm_remedial")
    user_id = None

    # Try to extract user from token
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ", 1)[1]
            payload = auth.verify_token(token)
            email = payload.get("sub")
            if email:
                user = db.query(models.User).filter(models.User.email == email).first()
                if user:
                    user_id = user.id
        except Exception:
            pass

    cache_extra = wrong_topics.strip() if mode == "qcm_remedial" else ""

    if user_id and mode in cacheable_modes and not user_answer:
        sqlite_db = SqliteSession()
        input_hash = IaCache.compute_hash(text, mode, subject, language, cache_extra)
        try:
            cached = sqlite_db.query(IaCache).filter(
                IaCache.user_id == user_id,
                IaCache.input_hash == input_hash,
                IaCache.mode == mode,
            ).first()

            if cached:
                # CACHE HIT — return instantly as JSON (no streaming needed)
                from fastapi.responses import JSONResponse
                response_data = {
                    "cached": True,
                    "full_text": cached.response,
                    "mode": cached.mode,
                    "subject": cached.subject or "",
                }
                sqlite_db.close()
                return JSONResponse(content=response_data)
        finally:
            sqlite_db.close()

    # --- CACHE MISS — stream from Ollama ---
    prompt = build_ia_prompt(mode, text, subject, user_answer, language, wrong_topics)
    # Ollama "format":"json" often wraps arrays as odd objects (e.g. {"[...]":{}}); plain JSON in the prompt is more reliable.
    is_json = False

    if user_id and mode in cacheable_modes and not user_answer:
        input_hash = IaCache.compute_hash(text, mode, subject, language, cache_extra)
        return StreamingResponse(
            stream_ollama_and_cache(prompt, is_json, user_id, input_hash, mode, subject, text),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
        )
    else:
        return StreamingResponse(
            stream_ollama_response(prompt, is_json),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
        )


@app.get("/api/health")
async def ia_health():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get("http://localhost:11434/api/tags")
            models_list = resp.json().get("models", [])
            return {"status": "ok", "ollama": True, "models": [m["name"] for m in models_list]}
    except Exception:
        return {"status": "ok", "ollama": False, "models": []}


# ══════════════════════════════════════════════════════════════
# MODULE OCR — Upload & Parse Schedule into Calendar Events
# ══════════════════════════════════════════════════════════════

# Add the parent folder (project root) to path so we can import ocr_hybrid
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

@app.post("/api/ocr/schedule")
async def ocr_schedule(file: UploadFile = File(...)):
    """
    Receives a file (PDF, image, DOCX), runs OCR via ocr_hybrid.py,
    then uses regex + AI to parse the extracted text into calendar events.
    """
    import re as _re
    from datetime import datetime as _dt

    # Save uploaded file to temp
    suffix = os.path.splitext(file.filename or "upload")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    raw_text = ""
    try:
        # Try importing and running OCR
        try:
            from ocr_hybrid import process_document
            result = process_document(tmp_path, languages=["fr", "en"], verbose=False)
            raw_text = result.full_text or ""
        except ImportError:
            raw_text = f"[OCR module not available] File received: {file.filename}"
        except Exception as e:
            raw_text = f"[OCR Error] {str(e)}"

        if not raw_text.strip():
            return {"events": [], "raw_text": "Aucun texte detecte dans le document."}

        current_year = _dt.now().year
        events = []

        # ══════════════════════════════════════════════════════
        # STEP 1: Regex-based date extraction from raw text
        # ══════════════════════════════════════════════════════
        date_pattern = _re.compile(
            r'(?:(?:Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\s+)?'
            r'(\d{1,2})\s*[/\-\.]\s*(\d{1,2})\s*[/\-\.]\s*(\d{2,4})',
            _re.IGNORECASE
        )
        time_pattern = _re.compile(r'\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}')

        date_matches = list(date_pattern.finditer(raw_text))

        if date_matches:
            print(f"[OCR] Found {len(date_matches)} dates via regex")

            for i, match in enumerate(date_matches):
                day = match.group(1).zfill(2)
                month = match.group(2).zfill(2)
                year_str = match.group(3)
                year = year_str if len(year_str) == 4 else str(current_year)
                date_iso = f"{year}-{month}-{day}"

                # Validate date
                try:
                    _dt.strptime(date_iso, "%Y-%m-%d")
                except ValueError:
                    continue

                # Get text section for this date (until next date or end)
                start_pos = match.end()
                end_pos = date_matches[i + 1].start() if i + 1 < len(date_matches) else len(raw_text)
                section_text = raw_text[start_pos:end_pos]

                # Extract time slots
                times_found = time_pattern.findall(section_text)

                # Remove time slots from text for cleaner parsing
                cleaned = section_text
                for t in times_found:
                    cleaned = cleaned.replace(t, ' ')

                # Split into parts by newlines, pipes, tabs
                parts = _re.split(r'[\n\r\t|]+', cleaned)

                # Filter meaningful course names
                course_names = []
                for part in parts:
                    part = part.strip()
                    if not part or len(part) < 3:
                        continue
                    if _re.match(r'^[\s\-\u2013\u2014.]+$', part):
                        continue
                    if _re.match(r'^\d{1,2}:\d{2}', part):
                        continue
                    if part in ['-', '--']:
                        continue
                    course_names.append(part)

                # Create events from course names
                time_idx = 0
                for course_raw in course_names:
                    # Separate professor name if present
                    prof_match = _re.search(
                        r'[(\n]\s*((?:Mr|Mme|Prof|Dr)\.?\s+.+?)(?:\)|$)',
                        course_raw, _re.IGNORECASE
                    )

                    if prof_match:
                        subject = course_raw[:prof_match.start()].strip().rstrip('(').strip()
                        prof = prof_match.group(1).strip()
                        title = f"{subject} - {prof}"
                    else:
                        lines = [l.strip() for l in course_raw.split('\n') if l.strip()]
                        if len(lines) >= 2 and _re.match(r'^(?:Mr|Mme|Prof|Dr)\b', lines[-1], _re.IGNORECASE):
                            subject = ' '.join(lines[:-1])
                            title = f"{subject} - {lines[-1]}"
                        else:
                            subject = course_raw.strip()
                            title = subject

                    subject = _re.sub(r'\s+', ' ', subject).strip()
                    title = _re.sub(r'\s+', ' ', title).strip()

                    if not subject or len(subject) < 2:
                        continue

                    time_slot = times_found[time_idx] if time_idx < len(times_found) else ''
                    time_idx += 1

                    events.append({
                        "title": title,
                        "date": date_iso,
                        "subject": subject,
                        "time": time_slot,
                        "category": "etude"
                    })

            print(f"[OCR] Regex extracted {len(events)} events")

        # ══════════════════════════════════════════════════════
        # STEP 2: Fallback to Ollama AI if regex found nothing
        # ══════════════════════════════════════════════════════
        if not events:
            print("[OCR] No dates found via regex, falling back to Ollama AI...")
            try:
                parse_prompt = (
                    "Extrait les cours de cet emploi du temps. "
                    "Retourne un JSON: {\"events\": [{\"title\": \"...\", \"date\": \"YYYY-MM-DD\", "
                    "\"subject\": \"...\", \"time\": \"\", \"category\": \"etude\"}]}. "
                    f"Si l'annee manque, utilise {current_year}. "
                    "Convertis les dates jj/mm/aaaa ou jj-mm-aaaa en YYYY-MM-DD. "
                    f"Texte:\n{raw_text[:4000]}\nJSON:"
                )

                async with httpx.AsyncClient(timeout=90.0) as client:
                    resp = await client.post(OLLAMA_URL, json={
                        "model": OLLAMA_MODEL,
                        "prompt": parse_prompt,
                        "stream": False,
                        "format": "json",
                        "options": {"temperature": 0.1, "num_predict": 2048}
                    })

                    if resp.status_code == 200:
                        data = resp.json()
                        response_text = data.get("response", "")
                        try:
                            parsed = json.loads(response_text)
                            if isinstance(parsed, list):
                                events = parsed
                            elif isinstance(parsed, dict) and "events" in parsed:
                                events = parsed["events"]
                        except json.JSONDecodeError:
                            pass

                        for ev in events:
                            date_str = str(ev.get("date", "")).strip()
                            if date_str:
                                for fmt_in, fmt_out in [
                                    (r'^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$', lambda m: f"{m.group(3)}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}"),
                                    (r'^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$', lambda m: f"{m.group(1)}-{m.group(2).zfill(2)}-{m.group(3).zfill(2)}"),
                                    (r'^(\d{1,2})[/\-.](\d{1,2})$', lambda m: f"{current_year}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}"),
                                ]:
                                    m = _re.match(fmt_in, date_str)
                                    if m:
                                        ev["date"] = fmt_out(m)
                                        break

                            # Validate YYYY-MM-DD
                            if not _re.match(r'^\d{4}-\d{2}-\d{2}$', str(ev.get("date", ""))):
                                ev["date"] = ""

                            # Ensure subject
                            if not ev.get("subject") and ev.get("title"):
                                ev["subject"] = ev["title"]

            except Exception as parse_err:
                print(f"[OCR] AI parsing error: {parse_err}")

        return {"events": events, "raw_text": raw_text[:5000]}

    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


@app.post("/api/ocr/extract-text")
async def ocr_extract_text(file: UploadFile = File(...)):
    """
    Receives a file (PDF, image, DOCX), runs OCR via ocr_hybrid.py,
    then uses Ollama to clean/correct the extracted text.
    Returns both the raw OCR text and the cleaned version.
    Used by the Raisonnement page for file attachment.
    """
    suffix = os.path.splitext(file.filename or "upload")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    raw_text = ""
    cleaned_text = ""
    try:
        # Run OCR
        try:
            from ocr_hybrid import process_document
            result = process_document(tmp_path, languages=["fr", "en"], verbose=False)
            raw_text = result.full_text or ""
        except ImportError:
            raw_text = f"[OCR module not available] File received: {file.filename}"
        except Exception as e:
            raw_text = f"[OCR Error] {str(e)}"

        if not raw_text.strip():
            return {"raw_text": "", "cleaned_text": "", "error": "Aucun texte detecte dans le document."}

        # Use Ollama to clean and correct the OCR text
        cleaned_text = raw_text  # Default: use raw if Ollama fails
        try:
            clean_prompt = (
                "Tu es un assistant specialise dans la correction de texte extrait par OCR. "
                "Le texte suivant a ete extrait automatiquement d'un document (PDF, image ou Word). "
                "Il peut contenir des erreurs d'OCR, des caracteres mal reconnus, ou un formatage casse. "
                "Corrige les erreurs evidentes, ameliore la mise en forme, "
                "et retourne le texte nettoye et bien structure. "
                "Garde le contenu original intact - ne resume PAS, ne supprime PAS d'information. "
                "Corrige seulement les erreurs de reconnaissance. "
                "Reponds UNIQUEMENT avec le texte corrige, sans commentaire.\n\n"
                f"Texte brut extrait par OCR:\n{raw_text[:4000]}"
            )

            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(OLLAMA_URL, json={
                    "model": OLLAMA_MODEL,
                    "prompt": clean_prompt,
                    "stream": False,
                    "options": {"temperature": 0.2, "num_predict": 4096}
                })

                if resp.status_code == 200:
                    data = resp.json()
                    response_text = data.get("response", "")
                    if response_text.strip():
                        cleaned_text = response_text.strip()
        except Exception:
            # Ollama not available — use raw text
            pass

        return {
            "raw_text": raw_text[:8000],
            "cleaned_text": cleaned_text[:8000],
            "filename": file.filename,
        }

    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


# --- APIS FOR USER DATA ISOLATION (HISTORY, PLANNING, AVATAR) ---
from typing import List

@app.get("/api/history", response_model=List[schemas.IaHistoryOut])
def get_ia_history(db: Session = Depends(get_sqlite_db), current_user: models.User = Depends(get_current_user)):
    from sqlite_models import IaHistory
    try:
        items = db.query(IaHistory).filter(IaHistory.user_id == current_user.id).order_by(IaHistory.timestamp.desc()).all()
        # Filter out any None items (can happen with corrupted rows)
        return [item for item in items if item is not None]
    except Exception as e:
        import traceback
        traceback.print_exc()
        return []

@app.post("/api/history", response_model=schemas.IaHistoryOut)
def save_ia_history(history_in: schemas.IaHistoryCreate, db: Session = Depends(get_sqlite_db), current_user: models.User = Depends(get_current_user)):
    from sqlite_models import IaHistory
    db_hist = IaHistory(user_id=current_user.id, **history_in.model_dump())
    db.add(db_hist)
    db.commit()
    update_user_badges(db, current_user.id, history_in.mode)
    db.refresh(db_hist)
    return db_hist

@app.delete("/api/history")
def clear_ia_history(db: Session = Depends(get_sqlite_db), current_user: models.User = Depends(get_current_user)):
    """Efface l'historique IA de l'utilisateur connecté."""
    from sqlite_models import IaHistory
    db.query(IaHistory).filter(IaHistory.user_id == current_user.id).delete()
    db.commit()
    return {"status": "ok"}

@app.post("/api/chat/messages")
def save_chat_message(message_in: schemas.ChatMessageCreate, db: Session = Depends(get_sqlite_db), current_user: models.User = Depends(get_current_user)):
    """Enregistre un message de chat pour l'utilisateur et la session en cours."""
    from sqlite_models import ChatMessage
    db_msg = ChatMessage(
        user_id=current_user.id,
        session_id=message_in.session_id,
        role=message_in.role,
        content=message_in.content,
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return {
        "id": db_msg.id,
        "session_id": db_msg.session_id,
        "role": db_msg.role,
        "content": db_msg.content,
        "timestamp": db_msg.timestamp,
    }

@app.get("/api/chat/messages")
def get_chat_messages(session_id: str, limit: int = 50, db: Session = Depends(get_sqlite_db), current_user: models.User = Depends(get_current_user)):
    """Récupère l'historique de chat pour la session et l'utilisateur connectés."""
    from sqlite_models import ChatMessage
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id, ChatMessage.session_id == session_id)
        .order_by(ChatMessage.timestamp.asc())
        .limit(limit)
        .all()
    )

    return {
        "messages": [
            {
                "id": message.id,
                "session_id": message.session_id,
                "role": message.role,
                "content": message.content,
                "timestamp": message.timestamp,
            }
            for message in messages
        ]
    }

@app.get("/api/history/{item_id}")
def get_ia_history_detail(item_id: int, db: Session = Depends(get_sqlite_db), current_user: models.User = Depends(get_current_user)):
    """Get full detail of a single history item (for viewing past résumé/QCM/Q&R)."""
    from sqlite_models import IaHistory
    item = db.query(IaHistory).filter(IaHistory.id == item_id, IaHistory.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@app.delete("/api/cache")
def clear_ia_cache(db: Session = Depends(get_sqlite_db), current_user: models.User = Depends(get_current_user)):
    """Allow user to clear their own cache if they want fresh re-generation."""
    from sqlite_models import IaCache
    db.query(IaCache).filter(IaCache.user_id == current_user.id).delete()
    db.commit()
    return {"status": "ok"}

@app.get("/api/planning/notes", response_model=List[schemas.PlanningItemOut])
def get_planning_notes(db: Session = Depends(get_sqlite_db), current_user: models.User = Depends(get_current_user)):
    from sqlite_models import PlanningItem
    return db.query(PlanningItem).filter(PlanningItem.user_id == current_user.id, PlanningItem.item_type == "note").order_by(PlanningItem.created_at.desc()).all()

@app.post("/api/planning/notes", response_model=schemas.PlanningItemOut)
def save_planning_note(note_in: schemas.PlanningItemCreate, db: Session = Depends(get_sqlite_db), current_user: models.User = Depends(get_current_user)):
    from sqlite_models import PlanningItem
    db_note = db.query(PlanningItem).filter(PlanningItem.id == note_in.id, PlanningItem.user_id == current_user.id).first()
    if db_note:
        for k, v in note_in.model_dump().items():
            setattr(db_note, k, v)
    else:
        db_note = PlanningItem(user_id=current_user.id, **note_in.model_dump())
        db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@app.delete("/api/planning/notes/{item_id}")
def delete_planning_note(item_id: str, db: Session = Depends(get_sqlite_db), current_user: models.User = Depends(get_current_user)):
    from sqlite_models import PlanningItem
    db_note = db.query(PlanningItem).filter(PlanningItem.id == item_id, PlanningItem.user_id == current_user.id).first()
    if db_note:
        db.delete(db_note)
        db.commit()
    return {"status": "ok"}

@app.get("/api/planning/events", response_model=List[schemas.PlanningItemOut])
def get_planning_events(db: Session = Depends(get_sqlite_db), current_user: models.User = Depends(get_current_user)):
    from sqlite_models import PlanningItem
    return db.query(PlanningItem).filter(PlanningItem.user_id == current_user.id, PlanningItem.item_type == "event").order_by(PlanningItem.date.asc()).all()

@app.post("/api/planning/events")
def save_planning_events(events_in: List[schemas.PlanningItemCreate], db: Session = Depends(get_sqlite_db), current_user: models.User = Depends(get_current_user)):
    from sqlite_models import PlanningItem
    for ev in events_in:
        db_ev = db.query(PlanningItem).filter(PlanningItem.id == ev.id, PlanningItem.user_id == current_user.id).first()
        if db_ev:
            for k, v in ev.model_dump().items():
                setattr(db_ev, k, v)
        else:
            db_ev = PlanningItem(user_id=current_user.id, **ev.model_dump())
            db.add(db_ev)
    db.commit()
    return {"status": "ok"}

@app.delete("/api/planning/events/{item_id}")
def delete_planning_event(item_id: str, db: Session = Depends(get_sqlite_db), current_user: models.User = Depends(get_current_user)):
    from sqlite_models import PlanningItem
    db_ev = db.query(PlanningItem).filter(PlanningItem.id == item_id, PlanningItem.user_id == current_user.id).first()
    if db_ev:
        db.delete(db_ev)
        db.commit()
    return {"status": "ok"}

@app.get("/api/avatar")
def get_avatar(db: Session = Depends(get_sqlite_db), current_user: models.User = Depends(get_current_user)):
    from sqlite_models import AvatarConfig
    db_av = db.query(AvatarConfig).filter(AvatarConfig.user_id == current_user.id).first()
    if db_av:
        return db_av.config
    # Default config
    return {"top":"shortFlat","hairColor":"2c1b18","eyes":"default","eyebrows":"defaultNatural","mouth":"default","facialHair":"none","clothing":"shirtCrewNeck","clothesColor":"262e33","accessories":"none","skinColor":"ffdbb4"}

@app.post("/api/avatar")
def save_avatar(config: schemas.AvatarConfigSchema, db: Session = Depends(get_sqlite_db), current_user: models.User = Depends(get_current_user)):
    from sqlite_models import AvatarConfig
    db_av = db.query(AvatarConfig).filter(AvatarConfig.user_id == current_user.id).first()
    if db_av:
        db_av.config = config.model_dump()
    else:
        db_av = AvatarConfig(user_id=current_user.id, config=config.model_dump())
        db.add(db_av)
    db.commit()
    return db_av.config


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)
