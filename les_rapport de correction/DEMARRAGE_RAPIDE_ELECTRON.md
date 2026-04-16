# 🚀 GUIDE DÉMARRAGE RAPIDE - Application Desktop Electron

## ⚡ 5 Minutes pour Lancer l'App

### Étape 1: Installation (2 min)

```bash
# Aller au dossier racine
cd c:/Users/jnaye/projet_pfe_study

# Installer toutes les dépendances
npm install
cd study && npm install && cd ..

# Installer backend Python
pip install -r study_backend/requirements.txt
```

### Étape 2: Lancer l'App (1 min)

```bash
# Depuis la racine du projet
npm run electron:dev
```

✅ **C'est tout!** L'app s'ouvre automatiquement dans une fenêtre Electron.

---

## Qu'est-ce qui se passe?

1. **Vite dev server** démarre sur :5173 (React app)
2. **Python backend** démarre automatiquement sur :8000
3. **Electron window** s'ouvre et charge l'app
4. **DevTools** activé automatiquement (F12 pour déboguer)

---

## 🎮 Commandes Principales

### Développement

```bash
npm run electron:dev       # Lancer en mode développement
npm run dev               # Juste Vite (sans Electron)
```

### Production

```bash
npm run electron:build    # Build pour tous les OS
npm run electron:build:win  # Windows seulement (.exe)
npm run electron:build:mac  # macOS seulement (.dmg)
npm run electron:build:linux # Linux seulement (.AppImage)
```

### Autres

```bash
npm run build             # Build React app
npm run preview           # Préview build
npm run lint              # Vérifier code
```

---

## 📂 Structure des Dossiers

```
projet_pfe_study/
├── electron/           ← Electron app (main.js, preload.js)
├── study/              ← React frontend (src/, public/)
├── study_backend/      ← Python API (main.py, models/)
├── scripts/            ← Build scripts
├── package.json        ← Config Electron
└── README.md
```

---

## 🐛 Dépannage Rapide

| Problème | Solution |
|----------|----------|
| Backend ne démarre pas | `pip install -r study_backend/requirements.txt` |
| Port 5173 occupé | `npm install -g killport && killport 5173` |
| Port 8000 occupé | Tuer le processus Python existant |
| Vite not found | `cd study && npm install && cd ..` |
| Electron blank screen | Appuyer F12, check console pour erreurs |

---

## 📦 Éléments de l'App

- ✅ **Backend**: Auto-lancé (aucune action nécessaire)
- ✅ **Frontend**: React hot reload
- ✅ **Database**: SQLite (auto-créé)
- ✅ **Cache**: Redis (optionnel)
- ✅ **AI**: Ollama (optionnel)

---

## 🎯 Prêt pour Production?

```bash
# 1. Build React
npm run build

# 2. Build Electron
npm run electron:build

# 3. Installer générés dans dist/
# - PFEStudy-1.0.0-Setup.exe (Windows)
# - PFEStudy-1.0.0.dmg (macOS)
# - PFEStudy-1.0.0.AppImage (Linux)
```

---

**Voir RAPPORT_ELECTRON_DESKTOP.md pour la documentation complète!**
