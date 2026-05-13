"""
config.py — Variables d'environnement centralisées pour GeniLocal API.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── URLs ──────────────────────────────────────────────────────────────────────
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL: str  = os.getenv("BACKEND_URL",  "http://localhost:8000")

# ── Sécurité ──────────────────────────────────────────────────────────────────
SESSION_SECRET_KEY: str = os.getenv(
    "SESSION_SECRET_KEY",
    "ton_secret_pour_les_sessions_etudes_achref"
)

# ── Google OAuth ──────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID:     str = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

# ── Ollama / IA ───────────────────────────────────────────────────────────────
OLLAMA_URL:   str = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "mistral")

# ── Email ─────────────────────────────────────────────────────────────────────
MAIL_USERNAME:  str = os.getenv("MAIL_USERNAME", "")
MAIL_PASSWORD:  str = os.getenv("MAIL_PASSWORD", "")
MAIL_FROM:      str = os.getenv("MAIL_FROM", "")
MAIL_PORT:      int = int(os.getenv("MAIL_PORT", "587"))
MAIL_SERVER:    str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
