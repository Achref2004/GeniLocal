# 📧 Carte de visite Email - Guide de Personnalisation

## 🎨 Nouvelle carte de visite pour email d'oubli de mot de passe

L'email reçu par l'utilisateur affiche maintenant une **belle carte de visite** au lieu d'une simple ligne bleue!

### ✨ Caractéristiques

✅ **Présentation élégante** - Carte blanche avec bordure verte
✅ **Logo personnalisable** - Facile à changer
✅ **Nom de l'utilisateur** - Affiche le nom complet ou le username
✅ **Bouton attractif** - Gradient vert avec effet hover
✅ **Design cohérent** - Même style que l'app Study
✅ **Responsive** - Fonctionne sur tous les appareils
✅ **Lien de secours** - Option de copier le lien manuellement
✅ **Avertissement sécurité** - Affiche que le lien expire en 1 heure

## 🔧 Comment changer le logo

Le logo est défini à la ligne 303 du fichier `study_backend/main.py`:

```html
<div class="logo">📚 Study</div>
```

### Option 1: Changer l'emoji
```html
<div class="logo">🎓 Study</div>  <!-- Emblème académique -->
<div class="logo">⭐ Study</div>  <!-- Étoile -->
<div class="logo">🚀 Study</div>  <!-- Fusée -->
<div class="logo">📖 Study</div>  <!-- Livre -->
```

### Option 2: Ajouter une image/logo
```html
<img src="https://votre-domaine.com/logo.png" alt="Study" style="height: 40px; margin-bottom: 10px;">
<p>Study</p>
```

### Option 3: Texte stylisé uniquement
```html
<div class="logo">STUDY</div>
```

### Option 4: Logo avec URL configurable
Si vous voulez que le logo soit dynamique depuis la BD:

1. Ajoutez un paramètre de configuration:
```python
SITE_LOGO = "📚 Study"  # Modifiable depuis .env
```

2. Utilisez-le dans le template:
```python
SITE_LOGO = os.getenv("SITE_LOGO", "📚 Study")
...
<div class="logo">{SITE_LOGO}</div>
```

## 📝 Personnalisations possibles

### Changer les couleurs
- **Couleur verte**: `#2d7a5a` → Changez `#2d7a5a` dans le CSS
- **Couleur dorée**: `#cdaa6a` → Changez `#cdaa6a` dans le CSS
- **Couleur grise**: `#8a9a8f` → Changez `#8a9a8f` dans le CSS

### Changer le message
Ligne 314-316:
```python
Nous avons reçu une demande de réinitialisation de votre mot de passe.
Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe sécurisé.
```

### Changer le texte du bouton
Ligne 320:
```python
<a href="{link}" class="button">🔐 Réinitialiser mon mot de passe</a>
```

### Changer le pied de page
Ligne 338-344:
```python
© 2026 Study - Tous droits réservés
Créé par Achref Jnayeh
✨ Bonne chance dans vos apprentissages! ✨
```

## 🎨 Préview de la carte

```
┌─────────────────────────────────────┐
│   📚 Study                          │
│   Plateforme d'apprentissage        │
├─────────────────────────────────────┤
│                                     │
│   Bienvenue, Ahmed! 👋              │
│                                     │
│   Nous avons reçu une demande...    │
│                                     │
│   ─────────────────────────────     │
│                                     │
│   [🔐 Réinitialiser mon mot de passe]  │
│                                     │
│   ⏰ Ce lien expirera en 1 heure     │
│                                     │
├─────────────────────────────────────┤
│   © 2026 Study                      │
│   ✨ Bonne chance! ✨               │
└─────────────────────────────────────┘
```

## 🚀 Exemple: Changer le logo en image URL

Modifiez le fichier `study_backend/main.py` ligne 303:

```python
# AVANT (emoji)
<div class="logo">📚 Study</div>

# APRÈS (image)
<img src="https://votre-site.com/logo.png" alt="Study" style="height: 50px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
<div style="font-size: 24px; color: #2d7a5a; font-weight: bold; font-family: 'Playfair Display', serif;">Study</div>
```

## 📧 Template complet

Le template est dans la fonction `forgot_password()` du fichier `study_backend/main.py` (lignes 185-360).

Pour créer un template séparé, créez un fichier `email_template.html` et importez-le:

```python
with open('email_template.html', 'r', encoding='utf-8') as f:
    html_body = f.read().format(username=username, link=link)
```

## ✅ Tester l'email

1. Allez à `http://localhost:5173/forgot-password`
2. Entrez votre email
3. Vérifiez votre boîte mail
4. Vous verrez la **belle carte de visite** au lieu d'une ligne bleue! 🎉

## 🔐 Sécurité

⚠️ **Important**: Le lien dans l'email est spécifique à chaque utilisateur et expire après 1 heure.

---

**Besoin d'aide pour personnaliser?** Consultez le fichier main.py lignes 185-360.
