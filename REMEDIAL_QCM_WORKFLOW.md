# 🎯 Workflow QCM Interactif de Remédiation

## Vue d'ensemble

Le système de remédiation QCM offre une expérience pédagogique adaptative:
- L'utilisateur répond à un QCM
- S'il a des réponses incorrectes (score < 5/5), un panel bleu l'invite à générer des questions de rattrapage
- 3 questions QCM ciblées sont générées spécifiquement pour les sujets incorrects
- L'utilisateur peut répondre à ces 3 questions de remédiation

## Architecture complète

### 1. Flow Utilisateur (Frontend)

```
RaisonnementPage.tsx
├── User répond au QCM (QcmView.tsx)
├── Score calculé automatiquement
├── Si score < 5/5:
│   └── Panel bleu apparaît: "Besoin d'aide?"
│       ├── User clique "Générer des questions de rattrapage"
│       └── handleRemediaq() appelée avec les mauvaises questions
└── handleRemediaq():
    ├── Crée une description des topics incorrects
    ├── Envoie requête au backend avec mode: 'qcm_remedial'
    ├── Active le mode 'qcm_remedial'
    └── Affiche les 3 questions générées dans QcmView
```

### 2. Backend - Génération des Questions (main.py)

#### Endpoint: `/api/generate`
```python
POST /api/generate
Content-Type: application/json

{
  "mode": "qcm_remedial",
  "text": "Texte de référence original",
  "subject": "Description des sujets incorrects",
  "language": "fr",
  "wrongTopics": "1. Question incorrecte 1\n2. Question incorrecte 2\n..."
}
```

#### Prompt Builder (lignes 737-763)
Le prompt est conçu pour forcer Ollama/Mistral à générer exactement 3 questions QCM valides:

```
Tu es un professeur expert en pédagogie curative. Génère exactement 3 questions QCM 
SIMPLES ET CLAIRES en FRANÇAIS pour aider les étudiants...

FORMAT (OBLIGATOIRE):
[{"question":"Texte de la question?","choices":["Option A","Option B","Option C","Option D"],"correct":0},
 {"question":"Question 2?","choices":["Option A","Option B","Option C","Option D"],"correct":1},
 {"question":"Question 3?","choices":["Option A","Option B","Option C","Option D"],"correct":2}]
```

**Points clés du prompt:**
- Demande **exactement 3 questions** (pas plus, pas moins)
- Format JSON obligatoire avec 4 choix par question
- Répond **UNIQUEMENT** avec le JSON, rien d'autre
- Chaque question doit avoir exactement 4 options

#### Streaming (lignes 900-917)
```python
is_json = (mode == "qcm_remedial")  # Force format JSON
return StreamingResponse(
    stream_ollama_and_cache(prompt, is_json, ...),
    media_type="text/event-stream"
)
```

### 3. Frontend - Parsing et Affichage (QcmView.tsx)

#### Stratégie de parsing JSON robuste

Le composant utilise une approche en 3 étapes:

**Étape 1: Parsing JSON standard**
```typescript
- Cherche [ et ] dans le contenu
- Essaie JSON.parse() directement
- Valide que chaque question a: question, choices[], correct
- Retourne jusqu'à 5 questions
```

**Étape 2: Nettoyage et correction**
```typescript
- Remplace les virgules manquantes avant ] et }
- Convertit les guillemets simples en doubles
- Essaie de parser JSON corrigé
```

**Étape 3: Extraction agressive avec Regex**
```typescript
- Cherche les blocs qui contiennent "question"
- Parse chaque bloc individuellement avec JSON.parse()
- Fallback en cas d'erreur complète
```

#### Affichage des Questions

```typescript
{questions && questions.length > 0 ? (
  questions.map((q, qIndex) => (
    // Affiche chaque question avec ses 4 options
    // L'utilisateur ne peut répondre qu'une seule fois à chaque question
    // Les réponses correctes s'affichent en vert, les incorrectes en rouge
  ))
) : (
  // Affichage du message d'erreur avec détails
)}
```

#### Score Affichage
```typescript
Score: X/5
- 5/5: "🎉 Parfait ! Excellent travail !"
- 3-4/5: "👏 Bien joué ! Continue comme ça !"
- <3/5: "📖 Continue à réviser, tu vas y arriver !"
```

### 4. Intégration du Contexte (IaTaskContext.tsx)

```typescript
startStreamTask('qcm_remedial', text, subject, language, topics)
├── Crée un nouveau task avec id unique
├── Déclenche le fetch streaming vers /api/generate
├── Accumule le contenu dans state
└── Affiche une notification toast de succès/erreur
```

## Flux Complet Étape par Étape

### Scenario 1: QCM avec erreurs → Remédiation réussie

```
1. User: Répond au QCM (5 questions)
   └─ Score: 2/5 (3 réponses incorrectes)

2. Frontend (QcmView):
   └─ showRemedialOffer = true
   └─ Panel bleu s'affiche

3. User: Clique "Générer des questions de rattrapage"
   └─ handleRemediaq() appelée

4. Frontend (RaisonnementPage):
   └─ activeMode = 'qcm_remedial'
   └─ startStreamTask('qcm_remedial', ...)

5. Backend (main.py /api/generate):
   └─ Reçoit mode='qcm_remedial'
   └─ build_ia_prompt() génère le prompt
   └─ stream_ollama_and_cache() appelée
   └─ Ollama génère 3 questions JSON

6. Frontend (QcmView):
   └─ Reçoit le JSON streaming
   └─ Parse et valide les questions
   └─ Affiche 3 questions interactives

7. User: Répond aux 3 questions
   └─ Score calculé
   └─ Résultats affichés
```

### Scenario 2: Erreur de parsing JSON

```
1. Ollama génère du JSON malformé
   └─ Exemple: {"question":"...", "choices":[...], "correct":0, // trailing comma

2. Frontend essaie Attempt 1: Échoue
   └─ JSON.parse() lance une erreur

3. Frontend essaie Attempt 2: Nettoyage
   └─ Remplace le , avant ] par }
   └─ Essaie JSON.parse() → Succès!

4. Si Attempt 2 échoue aussi:
   └─ Frontend essaie Attempt 3: Extraction Regex
   └─ Cherche les blocs individuels et les parse

5. Si tout échoue:
   └─ Affiche le message d'erreur
   └─ Propose d'afficher la réponse brute
   └─ Message: "Vérifiez que le serveur Ollama est en cours d'exécution"
```

## Configuration et Variables Clés

### Backend (`main.py`)

```python
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "mistral"

# Dans stream_ollama_and_cache():
payload = {
    "model": "mistral",
    "prompt": prompt,
    "stream": True,
    "options": {
        "temperature": 0.7,      # Contrôle la créativité
        "num_predict": 2048,     # Longueur max réponse
        "top_k": 40,
        "top_p": 0.9,
        "num_ctx": 4096          # Contexte size
    }
}
if is_json:
    payload["format"] = "json"   # Force format JSON
```

### Frontend (`QcmView.tsx`)

```typescript
interface Question {
  question: string;
  choices: string[];
  correct: number;  // Index (0-3) de la réponse correcte
}

interface QcmViewProps {
  rawContent: string;
  isStreaming: boolean;
  onRemedialClick?: (wrongQuestions: Question[], wrongIndexes: number[]) => void;
}
```

## Performance et Limitations

### Temps de génération (Test)
- **Remédiation QCM (3 questions)**: 8-15 secondes
- Dépend du CPU de l'utilisateur (Mistral 7B local)

### Limitations connues
- **Ollama doit tourner**: `ollama serve` sur port 11434
- **Modèle**: Mistral 7B (4.1 GB de VRAM minimum)
- **Questions**: Max 5 affichées (code forcé à `.slice(0, 5)`)
- **Remédiation**: Toujours 3 questions exactement

## Debugging

### Si les questions ne s'affichent pas:

1. **Vérifier Ollama**:
   ```bash
   curl http://localhost:11434/api/tags
   ```
   Devrait retourner la liste des modèles

2. **Vérifier Mistral**:
   ```bash
   ollama list
   # Devrait montrer: mistral latest ...
   ```

3. **Consulter la console du navigateur**:
   ```javascript
   // Les questions parsées devraient être dans le state
   // Si parsing échoue, un message d'erreur s'affiche
   ```

4. **Vérifier la réponse brute**:
   - Cliquer sur "Afficher la réponse brute"
   - Voir exactement ce qu'Ollama a généré
   - Le JSON peut être malformé ou incomplet

### Logs utiles

```python
# Backend: vérifier le prompt généré
print(f"Prompt for qcm_remedial: {prompt}")

# Frontend: vérifier le parsing
console.log("Raw content:", rawContent);
console.log("Parsed questions:", questions);
```

## Améliorations Futures

- [ ] Ajouter une validation stricte du JSON côté backend
- [ ] Implémenter un cache plus intelligent pour les questions
- [ ] Ajouter des explications pour chaque question
- [ ] Permettre à l'utilisateur de choisir le nombre de questions (3, 5, 10)
- [ ] Intégrer des statistiques de remédiation au dashboard de progression

## Fichiers Modifiés

1. **Backend**:
   - `study_backend/main.py` (lignes 737-763): Prompts améliorés
   - `study_backend/main.py` (lignes 900-917): Streaming JSON

2. **Frontend**:
   - `study/src/components/RaisonnementPage.tsx` (ligne 182-194): handleRemediaq amélioré
   - `study/src/components/ia/QcmView.tsx` (ligne 31-85): Parsing JSON robuste
   - `study/src/components/ia/QcmView.tsx` (ligne 312-327): Message d'erreur amélioré

3. **Context**:
   - `study/src/context/IaTaskContext.tsx`: Gestion du mode 'qcm_remedial'

## Résumé

✅ **QCM interactif de remédiation complet et fonctionnel**
- ✅ Génère exactement 3 questions adaptées aux erreurs
- ✅ Parsing JSON robuste avec fallbacks
- ✅ Meilleur message d'erreur
- ✅ Intégration seamless frontend-backend
- ✅ Cache des résultats pour performance
