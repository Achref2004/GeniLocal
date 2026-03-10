from pydantic import BaseModel, EmailStr
from typing import Optional

# 1. Inscription
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

# 2. IMPORTANT : C'est ce qui manque pour la mise à jour du profil !
class UserUpdate(BaseModel):
    fullname: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    birthdate: Optional[str] = None
    institution: Optional[str] = None
    level: Optional[str] = None
    objective: Optional[str] = None

# 3. Ce que l'API renvoie (Profil complet pour le Front)
class UserOut(BaseModel):
    id: int
    username: Optional[str] = None # <--- AJOUTE CETTE LIGNE    email: str
    fullname: Optional[str] = None
    phone: Optional[str] = None
    birthdate: Optional[str] = None
    institution: Optional[str] = None
    level: Optional[str] = None
    objective: Optional[str] = None
    is_admin: bool

    class Config:
        from_attributes = True

# 4. Mot de passe oublié
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordUpdate(BaseModel):
    token: str
    new_password: str