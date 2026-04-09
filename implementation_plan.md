# Page Planning — Calendrier Interactif & Smart Notes

## Objectif
Créer une page `/planning` complète intégrée dans l'application Study avec :
- Un calendrier mensuel interactif avec annotations de couleur
- Un système de notes enrichi (multi-types)
- Upload de tableau de temps (PDF/image/doc) traité via `ocr_hybrid.py`
- Synchronisation automatique avec l'historique du module Raisonnement
- Statistiques de présence et d'étude

---

## User Review Required

> [!IMPORTANT]
> Le traitement OCR de `ocr_hybrid.py` nécessite un **serveur Python séparé** (ex: FastAPI endpoint `/api/ocr/schedule`). Ce backend doit recevoir le fichier, appeler `process_document()`, puis parser le texte extrait pour en déduire des événements calendrier. Confirmez que le serveur backend est déjà en cours d'exécution (port 8000) ou souhaitez-vous que j'ajoute l'endpoint OCR directement au backend existant ?

> [!WARNING]
> La synchronisation avec le module Raisonnement (lecture de `study_ia_history` localStorage) est entièrement côté client — aucune donnée n'est envoyée au serveur.

---

## Architecture de la solution

```
PlanningPage.tsx              ← Page principale /planning
├── CalendarGrid.tsx          ← Grille calendrier mensuelle
├── DayModal.tsx              ← Modal détail d'un jour (notes + historique IA)
├── NoteEditor.tsx            ← Éditeur de note multi-type
├── UploadSchedule.tsx        ← Zone upload + progression OCR
├── PlanningStats.tsx         ← Stats (jours étudiés, etc.)
└── planning-styles.css       ← Styles animés dédiés
```

```
Backend (ajout endpoint)
└── /api/ocr/schedule         ← Reçoit fichier → OCR → retourne événements parsés
```

```
LocalStorage
├── study_planning_events     ← Événements du calendrier
├── study_planning_notes      ← Notes per jour
└── study_ia_history          ← Historique Raisonnement (lecture seule)
```

---

## Proposed Changes

### Frontend — Nouveau composant principal

#### [NEW] PlanningPage.tsx
`c:\Users\jnaye\projet_pfe_study\study\src\components\PlanningPage.tsx`

Page principale avec :
- En-tête avec navigation mois précédent/suivant
- Grille calendrier (7 colonnes × 5-6 lignes)
- Panneau latéral droit (stats + upload + légende couleurs)
- Modal day-detail au clic sur un jour
- Bouton flottant "+ Ajouter note"

**Types de notes supportés :**
| Type | Icône | Couleur |
|------|-------|---------|
| Résumé de cours | 📖 | 🔵 Bleu `#3b82f6` |
| Questions | ❓ | `#8b5cf6` Violet |
| Quiz QCM | 🧠 | 🟢 Vert `#10b981` |
| Objectifs du jour | 🎯 | 🟡 Jaune `#f59e0b` |
| Devoirs à faire | 📝 | 🔴 Rouge `#ef4444` |
| Note libre | 💬 | Gris neutre |

**Types d'événements (catégories couleur) :**
- 🔵 Études `#3b82f6`
- 🟢 Révisions `#10b981`
- 🔴 Examens `#ef4444`
- 🟡 Loisirs `#f59e0b`

---

#### [NEW] planning-styles.css
`c:\Users\jnaye\projet_pfe_study\study\src\components\planning-styles.css`

Animations : 
- `calendarSlide` (transition mois)
- `notePopIn` (apparition notes)
- `dayCellHover` (survol jours)
- `uploadPulse` (zone upload active)
- `badgeFloat` (badges catégorie)

---

#### [NEW] utils/planningStorage.ts
`c:\Users\jnaye\projet_pfe_study\study\src\utils\planningStorage.ts`

Types TypeScript + fonctions localStorage :
```typescript
interface PlanningNote {
  id: string;
  date: string; // "YYYY-MM-DD"
  type: 'resume' | 'question' | 'quiz' | 'objectif' | 'devoir' | 'libre';
  title: string;
  content: string;
  subject?: string;
  color: string; // adaptable au thème
  category: 'etude' | 'revision' | 'examen' | 'loisir';
  checked?: boolean; // pour objectifs/tâches
  createdAt: string;
}

interface PlanningEvent {
  id: string;
  date: string;
  title: string;
  category: 'etude' | 'revision' | 'examen' | 'loisir';
  color: string;
  source: 'manual' | 'ocr'; // provenance
}
```

Fonctions :
- `loadNotes()`, `saveNote()`, `deleteNote()`, `toggleNoteChecked()`
- `loadEvents()`, `saveEvent()`, `deleteEvent()`
- `getNotesForDate(date)`, `getEventsForDate(date)`
- `getRaisonnementForDate(date)` → lit `study_ia_history`
- `getStudiedDaysCount()` → count uniq jours avec notes

---

### Backend — Endpoint OCR Planning

#### [MODIFY] Backend Python (endpoint existant ou nouveau fichier)

Ajouter un endpoint `/api/ocr/schedule` qui :
1. Reçoit un fichier multipart/form-data
2. Sauvegarde temporairement le fichier
3. Appelle `process_document()` depuis `ocr_hybrid.py`
4. Parse le texte extrait avec un prompt Ollama : "Extrais les dates, matières, examens et événements de ce tableau de temps et retourne du JSON"
5. Retourne la liste des événements détectés

```python
# POST /api/ocr/schedule
# Response: { events: [{ date, title, category, time }], raw_text: str }
```

> [!NOTE]
> Si le backend n'est pas disponible, l'upload affichera le texte brut OCR et permettra à l'utilisateur d'ajouter manuellement des événements.

---

### Navigation — Ajout de la route

#### [MODIFY] AnimatedRoutes.tsx
Ajouter la route `/planning` :
```tsx
import PlanningPage from './PlanningPage';
// ...
<Route path="/planning" element={<PlanningPage />} />
```

#### [MODIFY] Dashboard.tsx (optionnel)
Le tab "planning" dans le sidebar navigue vers `/planning` au lieu d'afficher "En construction".

#### [MODIFY] Sidebar.tsx (optionnel)
Vérifier que l'icône Calendar navigue vers `/planning`.

---

## Fonctionnalités détaillées

### 1. Calendrier mensuel
- Navigation mois précédent/suivant avec animation de slide
- Jour actuel mis en évidence (anneau accent)
- Indicateurs colorés par jour (points) selon les catégories des notes
- Click sur un jour → DayModal
- Filtre par catégorie (barre de légende cliquable)

### 2. DayModal — Détail du jour
Trois sections :
1. **Notes du jour** — toutes les notes avec badges type/catégorie
2. **Historique Raisonnement** — ce que l'utilisateur a fait dans le module IA ce jour-là (résumés, QCM, Q/R) — lecture depuis `study_ia_history`
3. **+ Ajouter note** — ouvre NoteEditor inline

### 3. NoteEditor
- Sélecteur type (6 types avec icônes)
- Champ titre + textarea contenu
- Sélecteur matière (autocomplete depuis historique)
- Sélecteur catégorie (couleur) 📚🔵 / 🟢 / 🔴 / 🟡
- Pour type "objectif" / "devoir" : checkbox terminé ✔️

### 4. Upload tableau de temps
- Drag and drop ou clic
- Formats acceptés : PDF, PNG, JPG, JPEG, DOCX
- Progress bar OCR
- Résultat : 
  - Si backend OCR dispo → événements auto dans le calendrier
  - Sinon → texte brut affiché avec bouton "Importer manuellement"

### 5. Statistiques
- "📈 X jours étudiés ce mois"  
- "📚 Y résumés créés"
- "🧠 Z QCM réalisés"  
- "🎯 W objectifs atteints / total"
- Barre de progression de la semaine (mini graphique)

### 6. Synchronisation Raisonnement
Lecture de `localStorage.study_ia_history`, filtrage par date (timestamp `timestamp` ISO), affichage dans DayModal :
```
📖 Résumé — Mathématiques (il y a 2h)
🧠 QCM — Physique (3 questions)
❓ Q/R — Informatique
```

---

## Vérification

### Tests manuels
1. Naviguer vers `/planning` depuis le Dashboard
2. Cliquer sur un jour → vérifier DayModal avec données d'historique IA
3. Créer une note de chaque type → vérifier persistance localStorage
4. Changer de mois → vérifier animation
5. Uploader un PDF (si backend OCR disponible)
6. Vérifier les statistiques

### Build
- `npm run build` sans erreur TypeScript
- Pas de regressions sur les autres routes
