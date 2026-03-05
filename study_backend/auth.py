from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import models, database

# Ceci indique à FastAPI où chercher le jeton (dans l'en-tête Authorization)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
# --- CONFIGURATION DU JETON ---
SECRET_KEY = "TON_SECRET_TRES_PRIVE_ET_UNIQUE" # Change-le par une phrase longue
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # Le badge expire après 1 heure

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# Fonction spéciale pour ton UNIQUE ADMIN
def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé à l'administrateur du grimoire."
        )
    return current_user
from passlib.context import CryptContext

# On définit le moteur de hachage
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 1. La fonction pour hacher (utilisée dans SignUp)
def hash_password(password: str):
    return pwd_context.hash(password)

# 2. La fonction pour vérifier (sera utilisée dans Login)
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)
def create_access_token(data: dict):
    """Génère le jeton JWT avec les données de l'utilisateur"""
    to_encode = data.copy()
    
    # On définit l'expiration
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # On signe le jeton avec notre clé secrète
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
def verify_token(token: str):
    """Décode le jeton pour vérifier s'il est valide et extraire l'email"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload  # Retourne les données contenues dans le jeton (ex: {"sub": "email@test.com"})
    except JWTError:
        # Si le jeton est expiré ou a été modifié, on renvoie None
        return None