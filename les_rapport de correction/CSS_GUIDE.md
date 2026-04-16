# 🎨 Guide CSS Amélioré - Study Platform

Ce guide explique comment utiliser les nouveaux styles CSS pour maintenir un design cohérent et beau.

## 📦 Structure des fichiers CSS

- **`index.css`** : CSS global avec variables, animations et typographie
- **`App.css`** : Styles spécifiques à la page login/formulaires
- **`theme.css`** : Design tokens réutilisables et composants
- **`components/styles.css`** : Styles des composants (dashboard, profile, etc.)

## 🔧 Comment importer les CSS

Dans votre `App.jsx` ou `main.jsx`, importez les CSS dans cet ordre :

```jsx
import './theme.css'          // Design tokens
import './index.css'          // Styles globaux
import './App.css'            // Styles app
import './components/styles.css' // Styles composants
```

## 🎯 Variables CSS disponibles

### Couleurs
```css
/* Primaires (Vert naturel) */
--color-primary-500: #8a9a8f;
--color-primary-600: #708678;

/* Accents (Doré) */
--color-accent-500: #cdaa6a;
--color-accent-600: #b5955c;

/* États */
--color-success: #4ade80;
--color-error: #ef4444;
--color-warning: #f59e0b;
```

### Espacements
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
```

### Border Radius
```css
--radius-md: 10px;
--radius-lg: 16px;
--radius-xl: 20px;
```

### Shadows
```css
--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.12);
--shadow-lg: 0 20px 40px rgba(0, 0, 0, 0.15);
```

## 🧩 Classes réutilisables

### Boutons
```jsx
// Primaire
<button className="btn-base btn-primary">Connexion</button>

// Secondaire
<button className="btn-base btn-secondary">Annuler</button>

// Outline
<button className="btn-base btn-outline">Info</button>

// Danger
<button className="btn-base btn-danger">Supprimer</button>
```

### Inputs
```jsx
<input
  type="email"
  className="input-base"
  placeholder="Votre email"
/>
```

### Cards
```jsx
// Card standard
<div className="card-base">
  Contenu
</div>

// Card élevée/premium
<div className="card-base card-elevated">
  Contenu important
</div>
```

### Alerts
```jsx
// Succès
<div className="alert-base alert-success">
  ✓ Opération réussie
</div>

// Erreur
<div className="alert-base alert-error">
  ✗ Une erreur s'est produite
</div>

// Warning
<div className="alert-base alert-warning">
  ⚠ Attention requise
</div>
```

### Badges
```jsx
<span className="badge-base badge-primary">Admin</span>
<span className="badge-base badge-success">Actif</span>
<span className="badge-base badge-error">Bloqué</span>
```

### Typos
```jsx
<h1 className="heading-1">Titre principal</h1>
<h2 className="heading-2">Titre secondaire</h2>
<p className="body-md">Texte normal</p>
<label className="label">Label</label>
```

### Utilities
```jsx
// Flexbox
<div className="flex-center gap-md">Centré avec espacement</div>
<div className="flex-between">Espace entre</div>

// Padding & Margin
<div className="p-lg m-xl">Padding large + Margin extra large</div>

// Rounded
<div className="rounded-lg">Bordures arrondies</div>

// Shadow
<div className="shadow-lg">Ombre large</div>

// Alignment
<p className="text-center">Texte centré</p>
```

## 🎬 Animations disponibles

```css
/* Dans le CSS global */
.fade-in { animation: fadeIn 0.6s ease-out; }
.slide-in-left { animation: slideInLeft 0.6s ease-out; }
.slide-in-right { animation: slideInRight 0.6s ease-out; }
.slide-in-up { animation: slideInUp 0.6s ease-out; }
.glow-effect { animation: glow 2s ease-in-out infinite; }
.float-animation { animation: float 3s ease-in-out infinite; }
```

### Utilisation React
```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>
  Contenu animé
</motion.div>
```

## 📱 Responsive Design

Les styles s'adaptent automatiquement pour :
- Desktop (1280px+)
- Tablet (768px - 1024px)
- Mobile (< 768px)

Exemple en CSS personnalisé :
```css
@media (max-width: 768px) {
  .ma-classe {
    font-size: 14px;
    padding: 12px;
  }
}
```

## 🎨 Exemples complets

### Formulaire avec styling
```jsx
<form className="form-section">
  <div className="form-group">
    <label className="form-label">Email</label>
    <input
      type="email"
      className="input-base"
      placeholder="votre@email.com"
    />
  </div>

  <button className="btn-base btn-primary" type="submit">
    Envoyer
  </button>
</form>
```

### Card avec statistiques
```jsx
<div className="card-base">
  <div className="stat-label">Temps total d'étude</div>
  <div className="stat-value">145h 32m</div>
  <div className="stat-icon">📚</div>
</div>
```

### Menu avec badges
```jsx
<div className="sidebar">
  <div className="sidebar-title">Navigation</div>
  <a href="#" className="sidebar-link active">
    Accueil
  </a>
  <a href="#" className="sidebar-link">
    Profil <span className="badge-base badge-primary">Pro</span>
  </a>
</div>
```

## 🌈 Palettes de couleurs

### Mode Clair (par défaut)
- **Primaire**: Vert naturel (#8a9a8f)
- **Accent**: Doré (#cdaa6a)
- **Fond**: Crème (#f4f1ea)
- **Texte**: Gris foncé (#3a3f3b)

### À utiliser pour
- Données positives → `--color-success` (Vert)
- Données négatives → `--color-error` (Rouge)
- Avertissements → `--color-warning` (Orange)
- Informations → `--color-info` (Bleu)

## ✨ Bonnes pratiques

1. **Utilisez les variables CSS** plutôt que les valeurs hardcodées
2. **Appliquez les classes réutilisables** pour la cohérence
3. **Maintenez la hiérarchie typographique** (h1 > h2 > h3, etc.)
4. **Testez en responsive** pour tous les appareils
5. **Variez les shadows** pour créer de la profondeur
6. **Utilisez les animations** avec modération
7. **Gardez les transitions fluides** (base: 300ms)

## 🔍 Checklist de vérification

- [ ] Les boutons ont l'air cohérents
- [ ] Les espaces verticaux/horizontaux sont réguliers
- [ ] Les couleurs suivent la palette définie
- [ ] Les textes sont lisibles (contraste suffisant)
- [ ] Les interactions ont un feedback visuel
- [ ] Design responsive testé sur mobile
- [ ] Animations lisses sans ralentissements
- [ ] Cohérence avec les autres pages

## 🚀 Prochaines étapes

1. Importez tous les fichiers CSS dans `main.jsx`
2. Testez les différentes classes sur une page test
3. Adaptez les composants existants avec les nouvelles classes
4. Vérifiez que tout fonctionne sur mobile et desktop
5. Peaufinez les couleurs si nécessaire selon vos préférences

Bon design ! 🎨
