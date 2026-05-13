"""
services/email_service.py — Configuration FastMail et templates HTML.
"""
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from config import (
    MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM,
    MAIL_PORT, MAIL_SERVER, FRONTEND_URL
)

# ── Configuration de la connexion SMTP ───────────────────────────────────────
mail_config = ConnectionConfig(
    MAIL_USERNAME=MAIL_USERNAME,
    MAIL_PASSWORD=MAIL_PASSWORD,
    MAIL_FROM=MAIL_FROM,
    MAIL_PORT=MAIL_PORT,
    MAIL_SERVER=MAIL_SERVER,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


def build_reset_email_html(username: str, link: str) -> str:
    """Construit le corps HTML de l'e-mail de réinitialisation de mot de passe."""
    return f"""
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
            .wrapper {{ max-width: 520px; margin: 0 auto; }}
            .card {{
                background: linear-gradient(135deg, #1a2845 0%, #0f1419 100%);
                position: relative;
                padding: 50px 40px;
                text-align: center;
                border-radius: 8px;
                border: 4px solid #c0c0c0;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }}
            .card-content {{ position: relative; z-index: 1; }}
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
                margin: 30px 0;
            }}
            .security-note {{
                font-size: 12px;
                color: #b0b0b0;
                margin-top: 20px;
                font-family: 'Georgia', serif;
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
            .ticket-footer .copyright {{ color: #a0a0a0; font-size: 10px; margin-bottom: 10px; }}
            .ticket-footer .author   {{ color: #a0a0a0; font-size: 10px; margin-bottom: 15px; }}
            .ticket-footer .message  {{
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
                    <div class="logo">
                        <span style="color: #0b57a0;">Geni</span><span style="color:#763349;">Local</span>
                    </div>
                    <div class="greeting">Bienvenue</div>
                    <div class="user-name">{username}</div>
                    <p class="message">
                        Nous avons reçu une demande de réinitialisation<br>
                        de votre mot de passe.
                    </p>
                    <a href="{link}" class="button"> Réinitialiser</a>
                    <p class="security-note"> Ce lien expirera dans 1 heure</p>
                    <div class="ticket-divider"></div>
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


async def send_reset_email(to_email: str, username: str, reset_link: str) -> None:
    """Envoie l'e-mail de réinitialisation de mot de passe."""
    html_body = build_reset_email_html(username, reset_link)
    message = MessageSchema(
        subject=" Réinitialisation de votre mot de passe GeniLocal",
        recipients=[to_email],
        body=html_body,
        subtype=MessageType.html,
    )
    fm = FastMail(mail_config)
    await fm.send_message(message)
