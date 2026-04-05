from fastapi import FastAPI, Depends, HTTPException, status, Request, APIRouter
from fastapi.responses import RedirectResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi.middleware.cors import CORSMiddleware
from authlib.integrations.starlette_client import OAuth
import models, schemas, auth
from database import engine, get_db
from auth import get_current_user, get_current_admin
from typing import List, Dict, AsyncGenerator
from fastapi.security import OAuth2PasswordRequestForm
from starlette.middleware.sessions import SessionMiddleware
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
import httpx
import json

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
                font-size: 36px;
                font-weight: bold;
                margin-bottom: 20px;
                letter-spacing: 2px;
                color: #e8d5b7;
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
                    <div class="logo"> Study yee m3lem</div>

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

                    <!-- Main footer -->
                    <div class="footer">
                        © 2026 Study
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    message = MessageSchema(
        subject="🔐 Réinitialisation de votre mot de passe Study",
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

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "mistral"


def build_ia_prompt(mode: str, text: str, subject: str = "", user_answer: str = "") -> str:
    if mode == "resume":
        return (
            f"Tu es un professeur expert en {subject}. "
            f"Fais un résumé clair, structuré et concis du texte suivant. "
            f"Utilise des titres, des puces et des points clés. "
            f"Réponds uniquement en français.\n\nTexte:\n{text}"
        )
    elif mode == "qcm":
        return (
            f"Tu es un professeur. Génère exactement 5 questions QCM basées sur le texte suivant. "
            f"Chaque question doit avoir exactement 4 choix (A, B, C, D) et une seule bonne réponse. "
            f"Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni apres, dans ce format exact:\n"
            f'[{{"question":"...","choices":["A. ...","B. ...","C. ...","D. ..."],"correct":0}}]\n'
            f"Le champ correct est l index (0-3) de la bonne reponse.\n\nTexte:\n{text}"
        )
    elif mode == "qr_question":
        return (
            f"Tu es un professeur. Pose UNE seule question pertinente basee sur le texte suivant "
            f"pour tester la comprehension de l etudiant. Pose uniquement la question, rien d autre. "
            f"Reponds en francais.\n\nTexte:\n{text}"
        )
    elif mode == "qr_correct":
        return (
            f"Tu es un professeur bienveillant. Voici le contexte:\n\n"
            f"Texte de reference:\n{text}\n\n"
            f"Reponse de l etudiant: {user_answer}\n\n"
            f"Evalue la reponse. Dis si c est correct ou incorrect, explique pourquoi. "
            f"Sois encourageant. Reponds en francais."
        )
    return text


async def stream_ollama_response(prompt: str, is_json: bool = False):
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


@app.post("/api/generate")
async def ia_generate(request: Request):
    body = await request.json()
    mode = body.get("mode", "resume")
    text = body.get("text", "")
    subject = body.get("subject", "")
    user_answer = body.get("user_answer", "")
    prompt = build_ia_prompt(mode, text, subject, user_answer)
    is_json = (mode == "qcm")
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
