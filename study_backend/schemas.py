from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List, Literal

# 1. Inscription
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    region: Optional[str] = None

# 2. IMPORTANT : C'est ce qui manque pour la mise à jour du profil !
class UserUpdate(BaseModel):
    fullname: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    birthdate: Optional[str] = None
    institution: Optional[str] = None
    region: Optional[str] = None
    level: Optional[str] = None
    objective: Optional[str] = None

# 3. Ce que l'API renvoie (Profil complet pour le Front)
class UserOut(BaseModel):
    id: int
    username: Optional[str] = None
    email: str
    fullname: Optional[str] = None
    phone: Optional[str] = None
    birthdate: Optional[str] = None
    institution: Optional[str] = None
    region: Optional[str] = None
    level: Optional[str] = None
    objective: Optional[str] = None
    is_admin: bool

    class Config:
        from_attributes = True

# 4. Schéma pour admin (sans ID affiché)
class UserOutAdmin(BaseModel):
    username: Optional[str] = None
    email: str
    fullname: Optional[str] = None
    phone: Optional[str] = None
    birthdate: Optional[str] = None
    institution: Optional[str] = None
    region: Optional[str] = None
    level: Optional[str] = None
    objective: Optional[str] = None
    is_admin: bool

    class Config:
        from_attributes = True

# 5. User Stats
class UserStatsOut(BaseModel):
    total_study_seconds: int
    days_present: int
    average_qcm_score: float
    documents_analyzed: int
    badges: str

    class Config:
        from_attributes = True

# 6. Schéma pour créer un utilisateur (admin)
class AdminCreateUser(BaseModel):
    username: str
    email: EmailStr
    password: str
    fullname: Optional[str] = None
    institution: Optional[str] = None
    region: Optional[str] = None
    is_admin: bool = False

# 6. Mot de passe oublié
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordUpdate(BaseModel):
    token: str
    new_password: str

# 7. Avatar Config
from typing import Dict, Any, List

class AvatarConfigSchema(BaseModel):
    top: str
    hairColor: str
    eyes: str
    eyebrows: str
    mouth: str
    facialHair: str
    clothing: str
    clothesColor: str
    accessories: str
    skinColor: str

    class Config:
        from_attributes = True

# 8. IA History
class IaHistoryCreate(BaseModel):
    mode: str
    input_text: str
    subject: Optional[str] = None
    result: str
    question: Optional[str] = None
    user_answer: Optional[str] = None
    correction: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None

class IaHistoryOut(IaHistoryCreate):
    id: int
    timestamp: Any

    class Config:
        from_attributes = True

# 8.5 Chat messages
class ChatMessageCreate(BaseModel):
    session_id: str
    role: Literal['user', 'assistant']
    content: str

class ChatMessageOut(ChatMessageCreate):
    id: int
    timestamp: Any

    class Config:
        from_attributes = True

# 9. Planning Item
class PlanningItemCreate(BaseModel):
    id: str
    date: str
    type: str = "libre"
    item_type: str
    title: str
    content: Optional[str] = None
    subject: Optional[str] = None
    category: str
    source: str
    checked: bool = False

class PlanningItemOut(PlanningItemCreate):
    class Config:
        from_attributes = True
