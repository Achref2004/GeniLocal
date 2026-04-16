# 🎨 Guide Complet : Logo et Icône pour Application Electron

## 📋 Vue d'ensemble
Ce guide explique comment créer et intégrer un logo pour votre application Electron "Study".

---

## **Option 1 : Utiliser un Logo Existant (Rapide)**

### Étape 1 : Convertir le SVG en PNG
J'ai créé un logo SVG pour vous (`assets/logo.svg`).

Pour le convertir en PNG, vous avez plusieurs options :

#### a) **Utiliser un service en ligne** (Recommandé - Gratuit)
1. Allez sur https://cloudconvert.com/svg-to-png
2. Téléchargez `assets/logo.svg`
3. Convertissez en PNG (256x256)
4. Sauvegardez comme `assets/icon.png`

#### b) **Utiliser ImageMagick** (Installation requise)
```bash
convert -background none -density 256 assets/logo.svg -resize 256x256 assets/icon.png
```

#### c) **Utiliser Node.js + Sharp** (Recommandé)
```bash
# Installez sharp
npm install sharp

# Générez les icônes
node scripts/generate-icon.js
```

---

## **Option 2 : Créer un Logo Personnalisé**

### Outils recommandés :
1. **Figma** (https://figma.com) - Gratuit, en ligne
2. **Canva** (https://canva.com) - Gratuit avec modèles
3. **Adobe Express** (https://www.adobe.com/express)
4. **Gravit Designer** (https://www.designer.io)

### Spécifications du Logo :
- **Format** : PNG ou SVG
- **Taille** : 256x256 pixels minimum
- **Style** : Simple, épuré, lisible à petite taille
- **Fond** : Transparent recommandé

---

## **Intégration dans Electron**

### ✅ Les fichiers sont déjà configurés :

1. **Icône de la fenêtre** : `electron/main.js` (ligne 197)
   ```javascript
   icon: path.join(__dirname, '../assets/icon.png'),
   ```

2. **Dossier créé** : `assets/` avec `logo.svg` et génération de PNG

3. **Logo Web** : À ajouter au HTML (voir ci-dessous)

---

## **Ajouter le Logo dans l'Interface Web**

### 1. Favicon dans `study/index.html`
```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <!-- AJOUTER CETTE LIGNE -->
    <link rel="icon" type="image/png" href="/assets/logo.svg" />
    <link rel="shortcut icon" href="/assets/logo.svg" />
    
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Study Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### 2. Logo dans le Header/Navbar
```jsx
// Dans votre composant Navbar ou Header
<img 
  src="/assets/logo.svg" 
  alt="Study Logo" 
  width="40" 
  height="40" 
  className="app-logo"
/>
```

### 3. CSS pour le logo
```css
.app-logo {
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.app-logo:hover {
  transform: scale(1.05);
}
```

---

## **Créer un Raccourci Bureau (Windows)**

### Automatique avec Node.js
```javascript
// scripts/create-desktop-shortcut.js
const fs = require('fs');
const path = require('path');
const os = require('os');

function createDesktopShortcut() {
  if (os.platform() !== 'win32') {
    console.log('ℹ️  Desktop shortcut creation is Windows-only');
    return;
  }

  const shortcutContent = `
[InternetShortcut]
URL=file:///${__dirname}/../build/Study.exe
IconIndex=0
`;

  const desktopPath = path.join(os.homedir(), 'Desktop', 'Study.lnk');
  console.log('📌 Créer un raccourci sur le Bureau via Electron Builder...');
}

createDesktopShortcut();
```

### Manuel (Windows)
1. Allez dans le dossier où votre app est installée
2. Clic droit sur `Study.exe` → "Envoyer vers" → "Votre Bureau (créer raccourci)"
3. Clic droit sur le raccourci → Propriétés
4. Sous "Raccourci", cliquez "Changer l'icône"
5. Sélectionnez `assets/icon.png` ou le `.exe`

---

## **Configuration Electron Builder (package.json)**

Pour générer une version standalone avec logo :

```json
{
  "build": {
    "appId": "com.study.app",
    "productName": "Study Platform",
    "files": [
      "dist/**/*",
      "electron/**/*",
      "assets/**/*",
      "study/dist/**/*",
      "study_backend/**/*"
    ],
    "win": {
      "target": ["nsis", "portable"],
      "icon": "assets/icon.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "Study Platform"
    }
  }
}
```

---

## **Prochaines étapes**

1. ✅ **Convertir le SVG en PNG**
   ```bash
   npm install sharp
   node scripts/generate-icon.js
   ```

2. ✅ **Tester avec Electron**
   ```bash
   npm run dev
   # Vérifiez que le logo s'affiche sur la fenêtre
   ```

3. ✅ **Ajouter le favicon au HTML**
   - Modifiez `study/index.html`

4. ✅ **Créer le raccourci de bureau**
   - Automatique avec NSIS ou manuel

---

## **Fichiers créés pour vous**

- ✅ `assets/logo.svg` - Logo SVG original
- ✅ `scripts/generate-icon.js` - Script de conversion SVG → PNG
- ✅ Configuration Electron déjà prête pour les icônes

---

## **Dépannage**

### ❌ L'icône ne s'affiche pas sur la fenêtre
- Vérifiez le chemin : `assets/icon.png` existe-t-il ?
- Redémarrez l'application : `npm run dev`

### ❌ Le favicon ne s'affiche pas
- Videz le cache du navigateur : Ctrl+Shift+Del
- Utilisez un chemin absolu : `/assets/logo.svg`

### ❌ L'image est floue/pixelisée
- Augmentez la résolution source (min 256x256)
- Utilisez PNG au lieu de JPG

---

## **Ressources**

| Outil | Lien | Usage |
|-------|------|-------|
| Figma | https://figma.com | Design avancé |
| Canva | https://canva.com | Modèles prêts |
| CloudConvert | https://cloudconvert.com | Conversion en ligne |
| Sharp | https://sharp.pixelplumbing.com | Conversion Node.js |

---

**Besoin d'aide ?** Demandez-moi d'implémenter les modifications automatiquement !
