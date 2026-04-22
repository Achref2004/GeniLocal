# 📚 Guide d'Utilisation - QCM Interactif de Remédiation

## ✅ Qu'est-ce qui a été corrigé/amélioré?

### 1. Backend - Prompts Améliorés
**Avant**: Prompts génériques qui pouvaient produire du JSON malformé
**Après**: Prompts strictes qui forcent:
- Exactement 3 questions QCM
- Format JSON valide et structuré
- 4 options par question
- Rien d'autre que le JSON en réponse

### 2. Frontend - Parsing Robuste
**Avant**: Parsing basique qui échouait sur JSON malformé
**Après**: 3 stratégies de parsing en cascade:
1. Parse JSON standard (fallback si échoue)
2. Nettoie et corrige les erreurs courantes
3. Extraction agressive avec regex si autres échouent

### 3. Messages d'Erreur Clairs
**Avant**: Message génériques "QCM non interactif"
**Après**: Message détaillé avec conseil pour déboguer
- Affiche la réponse brute en détails
- Suggère de vérifier Ollama
- Collapsible pour plus d'infos

### 4. Meilleure Gestion des Topics Incorrects
**Avant**: Topics concaténés simplement avec " | "
**Après**: Description numérotée et structurée des questions incorrectes

## 🚀 Comment Utiliser

### Prérequis
```bash
# Terminal 1: Démarrer Ollama
ollama serve

# Terminal 2: Assurez-vous que Mistral est téléchargé
ollama pull mistral  # ~4.1 GB

# Terminal 3: Démarrer le backend
cd study_backend
python -m uvicorn main:app --reload --port 8000

# Terminal 4: Démarrer le frontend
cd study
npm run dev
```

### Workflow Utilisateur

```
1. Accédez à l'application
   └─ http://localhost:5173

2. Page Raisonnement
   └─ Collez votre cours/texte
   └─ Cliquez "QCM"

3. Répondez aux 5 questions
   └─ Choisissez vos réponses
   └─ Les réponses se valident automatiquement

4. Voyez votre score
   └─ Si score < 5/5:
   └─ Un panel bleu apparaît

5. Cliquez "🎯 Générer des questions de rattrapage"
   └─ 3 questions ciblées sont générées
   └─ Basées sur vos erreurs

6. Répondez aux 3 questions de remédiation
   └─ Les résultats s'affichent
   └─ Recommencez si besoin
```

## 🔍 Validation

### Pour vérifier que tout fonctionne:

1. **Console navigateur** (F12 → Console):
```javascript
// Les questions devraient être parsées correctement
// Si parsing échoue, un message d'erreur s'affiche
```

2. **Vérifier Ollama**:
```bash
# Dans un terminal
curl http://localhost:11434/api/tags
# Devrait retourner: {"models":[{"name":"mistral:latest",...}]}
```

3. **Logs Backend**:
```bash
# Voir les prompts générés et les réponses Ollama
# Devrait afficher: "Prompt for qcm_remedial: ..."
```

## 🐛 Troubleshooting

### Problème: Les questions de remédiation ne s'affichent pas

**Solution 1: Vérifier Ollama**
```bash
# Terminal 1
ollama serve

# Terminal 2
ollama list  # Devrait montrer: mistral latest ...
```

**Solution 2: Vérifier le backend**
```bash
# Vérifier que le backend tourne sur port 8000
curl http://localhost:8000/api/health
# Devrait retourner: {"status":"ok","ollama":true,"models":["mistral:latest"]}
```

**Solution 3: Voir la réponse brute**
- Cliquez sur "Afficher la réponse brute"
- Copiez la réponse complète
- Vérifiez qu'c'est du JSON valide

### Problème: Erreur "Module not found: ocr_hybrid"
**Solution**: L'OCR est optionnel. Ignorer l'erreur ou commenter la ligne d'import.

### Problème: Questions ne sont pas les correctes
**Cause possibles**:
1. Ollama ne génère pas exactement 3 questions → Fallback à Attempt 2-3
2. Format JSON invalide → Parsing échoue, message d'erreur s'affiche
3. CPU trop lent → Attendre plus longtemps

## 📊 Performance Attendue

| Opération | Temps | Dépend de |
|-----------|-------|----------|
| Génération QCM (5 Q) | 15-30s | CPU, RAM |
| Génération Remédiation (3 Q) | 8-15s | CPU, RAM |
| Parsing JSON | <1ms | Complexité JSON |
| Affichage | <1ms | Nombre questions |

**Recommandé**: 
- CPU: 4 cores minimum (8+ idéal)
- RAM: 8GB minimum
- GPU: Optionnel mais accélère Ollama

## 📝 Fichiers Clés à Connaître

```
study/
├── src/
│   ├── components/
│   │   ├── RaisonnementPage.tsx (L182-194: handleRemediaq)
│   │   └── ia/
│   │       └── QcmView.tsx (L31-85: parsing JSON)
│   └── context/
│       └── IaTaskContext.tsx (L127: mode qcm_remedial)

study_backend/
└── main.py
    ├── L737-763: Prompts qcm_remedial
    ├── L900-917: Streaming JSON
    └── L844-917: Endpoint /api/generate

REMEDIAL_QCM_WORKFLOW.md (cette documentation)
TEST_QCM_PARSING.js (tests de validation)
```

## 🎯 Cas d'Usage

### Cas 1: Étudiant avec 2/5 au QCM
```
1. Score: 2/5 (Questions 1, 3, 5 incorrectes)
2. Panel bleu: "Besoin d'aide?"
3. Topics: 
   - "1. Qu'est-ce que la photosynthèse?"
   - "3. Quel est le rôle des mitochondries?"
   - "5. Comment la cellule produit-elle de l'énergie?"
4. Génération: 3 questions SIMPLES et CLAIRES basées sur ces sujets
5. Résultats: 3/3 ✓ "Bravo! Tu as progressé!"
```

### Cas 2: QCM parfait (5/5)
```
1. Score: 5/5 ✓
2. Panel de score: "🎉 Parfait ! Excellent travail !"
3. Pas de panel de remédiation
4. Utilisateur peut continuer vers d'autres activités
```

## 🔧 Configuration Avancée

### Modifier le nombre de questions générées

**Backend** (`main.py` L757):
```python
# Changer "3 questions" par le nombre voulu
f"Génère exactement {NUM_QUESTIONS} questions QCM..."
```

**Frontend** (`QcmView.tsx` L84):
```typescript
.slice(0, 5)  // Affiche jusqu'à 5 questions
```

### Modifier la température (créativité Ollama)

**Backend** (`main.py` L773):
```python
"temperature": 0.7  # Entre 0 (déterministe) et 1 (créatif)
```

### Modifier le modèle

**Backend** (`main.py` L647):
```python
OLLAMA_MODEL = "mistral"  # Changer par "neural-chat", "orca", etc.
```

## ✨ Fonctionnalités Futures

- [ ] Statistiques de remédiation par sujet
- [ ] Suggestions d'études basées sur performances
- [ ] Export des résultats de remédiation
- [ ] Mode compétition: QCM vs remédiation
- [ ] Intégration avec le dashboard de progression
- [ ] Questions générées avec explications détaillées
- [ ] Historique des sessions de remédiation

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez les prérequis (Ollama, Mistral, backend)
2. Consultez les logs (voir Troubleshooting)
3. Testez le parsing (exécutez TEST_QCM_PARSING.js)
4. Vérifiez la réponse brute du JSON
5. Consultez REMEDIAL_QCM_WORKFLOW.md pour l'architecture

---

**Version**: 1.0 - 2026-04-21
**Status**: ✅ Production Ready
**Tested**: Windows 11, Mistral 7B, Ollama 0.x
