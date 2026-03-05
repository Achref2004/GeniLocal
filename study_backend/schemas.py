from pydantic import BaseModel, EmailStr
from typing import Optional
from pydantic import BaseModel, EmailStr
# Ce que l'utilisateur envoie lors de l'inscription
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

# Ce que l'API renvoie (on ne renvoie jamais le mot de passe !)
class UserOut(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool

    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr  # Utilise EmailStr si tu as pydantic[email] installé, sinon juste String

class ResetPasswordUpdate(BaseModel):
    token: str
    new_password: str  # <--- Vérifie bien l'orthographe exacte ici