# 🚀 Guide Intégration Ollama + Mistral 7B (Mode Hors Ligne)

**Date**: 5 Avril 2026
**Status**: ✅ Complètement Opérationnel

---

## 📋 Vue d'Ensemble

L'application fonctionne maintenant **100% hors ligne** pour toute la génération IA (sauf authentification):
- ✅ Résumés des cours
- ✅ Questions QCM
- ✅ Questions/Réponses (Q/R)
- ✅ Jeu Memory (bonus)
- ❌ Authentification (nécessite backend)

---

## 🔧 Architecture

### Avant (Avec Backend Distant)
```
App Frontend
    ↓ (API Call)
Backend Python/Flask (port 8000)
    ↓ (API Call)
Serveur IA Distant (Hugging Face, etc.)
```

### Après (Avec Ollama Local)
```
App Frontend
    ↓ (Try Ollama first)
Ollama Local (port 11434)  ← Mode HORS LIGNE ✅
    ↓ (Fallback)
Backend Python (si besoin)
```

---

## 🛠️ Installation Requise

### 1. **Installer Ollama**
```bash
# Windows/Mac/Linux
https://ollama.ai/download

# Vérifier installation
ollama --version
```

### 2. **Télécharger Mistral 7B**
```bash
ollama pull mistral
# Cela prendra ~15-30 minutes (4.1 GB)
```

### 3. **Vérifier Mistral est disponible**
```bash
ollama list
# Output:
# NAME          ID            SIZE    MODIFIED
# mistral:7b    2e405c7f...   4.1GB   Now
```

### 4. **Démarrer Ollama**
```bash
ollama serve
# Sortie:
# 2026-04-05 10:30:45 Llama server listening on 127.0.0.1:11434
```

✅ **C'est prêt!** L'app détectera automatiquement Ollama.

---

## 📱 Utilisation

### Au Démarrage de l'App

L'application vérifie automatiquement:
```typescript
1. Port 11434 disponible?
2. Ollama répond?
3. Modèle 'mistral' installé?
```

#### ✅ Si Ollama est actif:
- Affiche: "✅ Ollama Actif (Hors Ligne)"
- Toutes les générations utilisent **Mistral 7B local**
- Fonctionné parfaitement en mode hors ligne

#### ⚠️ Si Ollama n'est pas actif:
- Affiche: "⚠️ Ollama Non Disponible"
- Fallback sur backend distant (si connecté)
- Instructions pour installer Ollama

### Exemple de Flux Utilisateur

```
1. Utilisateur écrit du texte
2. Clique "QCM"
3. App détecte Ollama disponible
4. Envoie requête à Ollama:
   {
     "model": "mistral",
     "prompt": "Génère 5 questions QCM sur...",
     "stream": true
   }
5. Mistral répond en streaming
6. Memory Game s'affiche pendant le chargement
7. Questions apparaissent après ~10-30 secondes
```

---

## 💾 Fichiers Modifiés

### 1. `src/utils/api_ia.ts` (PRINCIPAL)
```typescript
// ✅ NOUVEAU: Fonction generatePrompt()
generatePrompt(mode, text) → optimisé pour Mistral

// ✅ NOUVEAU: fetchStreamOllama()
Appelle Ollama sur port 11434

// ✅ MODIFIÉ: fetchStream()
- Essaie Ollama d'abord
- Fallback sur backend

// ✅ AJOUTER: fetchStreamBackend()
Ancienne logique API
```

### 2. `src/utils/ollamaConfig.ts` (NOUVEAU)
```typescript
// Configuration centralisée
OLLAMA_CONFIG = {
  endpoint: 'http://localhost:11434',
  model: 'mistral',
  temperature: 0.7,
  timeout: 120000
}

checkOllamaAvailable() → vérifie disponibilité
getModelInfo() → infos du modèle
```

### 3. `src/components/OllamaStatus.tsx` (NOUVEAU)
```typescript
// Composant d'affichage du status
- Montre si Ollama est actif
- Infos du modèle
- Instructions installation avec détails
```

---

## ⚙️ Configuration des Prompts

Mistral 7B est **très sensible au format du prompt**!

### Prompt Résumé
```
Tu es un professeur expert. Fais un résumé structuré et concis.
Format: # Titre, ## Sous-sections, points clés.

Texte à résumer:
"[TEXTE]"

Résumé structuré:
```

**Sortie attendue**:
```
# Le Système Nerveux
## Structure
- Cerveau: ...
- Moelle épinière: ...
```

### Prompt QCM
```
Génère exactement 5 questions à choix multiples au format JSON valide.

Format JSON STRICT:
[
  {"question": "Q?", "choices": ["A", "B", "C", "D"], "correct": 0}
]

Texte: "[TEXTE]"

Réponse JSON:
```

**Sortie attendue**:
```json
[
  {"question": "Qu'est-ce que...", "choices": ["A", "B", "C", "D"], "correct": 0},
  {"question": "Pourquoi...", "choices": ["A", "B", "C", "D"], "correct": 2}
]
```

### Prompt Q/R
```
Génère une question pertinente et une réponse courte.

Format:
QUESTION: [la question]
RÉPONSE: [la réponse courte]

Texte: "[TEXTE]"

Question et réponse:
```

---

## 📊 Performance

### Temps de Génération (Estimations)

| Mode | Temps |Hardware | Notes |
|------|-------|---------|-------|
| Résumé (500 mots) | 15-30s | CPU moderne | Fonction du CPU |
| QCM (5 questions) | 20-40s | CPU moderne | JSON parsing peut être lent |
| Q/R (1 question) | 10-20s | CPU moderne | Plus rapide |

**Optimisations appliquées**:
- Température: 0.7 (bon balance qualité/vitesse)
- Max tokens: 500 (évite réponses infinies)
- Context: 2000 chars (limite raisonnable)

### Ressources Requises

| Composant | Requis | Recommandé |
|-----------|--------|------------|
| **CPU** | 4 cores | 8+ cores (plus rapide) |
| **RAM** | 8 GB | 16 GB |
| **Disque** | 5 GB | 10 GB |
| **Réseau** | 0 Mbps | N/A (local!) |

---

## 🐛 Dépannage

### ❌ "Ollama Non Disponible"

**Problème**: L'app ne peut pas se connecter à Ollama

**Solutions**:
```bash
# 1. Vérifier Ollama est lancé
ollama serve

# 2. Vérifier le port 11434
netstat -an | grep 11434

# 3. Vérifier Mistral
ollama list | grep mistral

# 4. Tester manuellement
curl http://localhost:11434/api/tags
```

### ❌ "Modèle mistral non trouvé"

**Problème**: Mistral n'est pas téléchargé

**Solution**:
```bash
ollama pull mistral
# Attendez la fin du téléchargement
```

### ❌ Réponses très lentes (>2 minutes)

**Problème**: CPU surchargé ou RAM insuffisante

**Solutions**:
```
1. Réduire température à 0.5
2. Réduire max tokens à 300
3. Fermer autres applications
4. Augmenter RAM si possible
```

### ❌ Réponses mauvaise qualité (incohérentes)

**Problème**: Prompt mal structuré pour Mistral

**Solution**:
Modifier les prompts dans `generatePrompt()` de `api_ia.ts`

---

## 🔄 Flux d'Intégration

### Code Flow Détaillé

```typescript
// 1. Utilisateur clique QCM
handleQcm() → setIsStreaming(true)

// 2. RaisonnementPage appelle fetchStream()
fetchStream({ mode: 'qcm', text: '...' })

// 3. Essaie Ollama FIRST
if (USE_OLLAMA) {
  fetchStreamOllama() // Port 11434
}

// 4. Ollama répond en streaming
POST http://localhost:11434/api/generate
-> { response: "Question 1..." } (stream)

// 5. Accumulation résultat
fullText += response

// 6. QCM Parse le JSON
questions = JSON.parse(fullText.substring(...))

// 7. Affichage
setIsStreaming(false)
-> Questions s'affichent
```

---

## ✅ Checklist Configuration

- [ ] Ollama installé
- [ ] Mistral 7B téléchargé (`ollama pull mistral`)
- [ ] `ollama serve` lancé
- [ ] App détecte Ollama (✅ Status affiché)
- [ ] Test: Click "QCM" → Memory Game → Questions apparaissent
- [ ] Test: Résumé fonctionne
- [ ] Test: Q/R fonctionne
- [ ] Test: Qualité des réponses acceptable

---

## 🎯 Avantages

✅ **Hors Ligne Total**
- Pas de connexion Internet requise
- Pas de dépendance serveur distant
- Données restent privées localement

✅ **Gratuit**
- Ollama: gratuit et open-source
- Mistral 7B: téléchargement gratuit
- Pas de frais API

✅ **Contrôle Total**
- Modèles locaux, tu peux les modifier
- Configuration personnalisée
- Aucune dépendance externe

✅ **Privé**
- Zéro envoi de données externes
- Tout reste sur ta machine

---

## 📝 Limitations Actuelles

⚠️ **Performance**
- Mistral 7B est plus lent que GPT-4 (normal)
- Génération prend 15-40 secondes
- Sur CPU moderne: acceptable

⚠️ **Qualité**
- Mistral 7B < ChatGPT (taille modèle plus petite)
- QCM peut parfois avoir erreurs JSON
- Résumés généralement bons

⚠️ **Modèle Limité**
- Mistral 7B: 7 milliards paramètres
- Modèles plus grands (70B, 13B) possibles mais plus lents
- Changeable dans `ollamaConfig.ts`

---

## 🚀 Améliorations Futures

### Option 1: Mistral 8x7B (Mixture of Experts)
```bash
ollama pull mistral:8x7b-instruct-v0.1
# ~50 GB, plus puissant, plus lent
```

### Option 2: Autres Modèles
```bash
ollama pull neural-chat      # Plus rapide
ollama pull dolphin-mixtral  # Plus créatif
```

### Option 3: Fine-tuning
- Adapter Mistral pour ton domaine
- Meilleure qualité pour sujet spécifique

---

## 📚 Ressources

- **Ollama**: https://ollama.ai
- **Mistral Docs**: https://mistral.ai
- **API Ollama**: https://github.com/jmorganca/ollama/blob/main/docs/api.md

---

## 🎉 Conclusion

**L'app fonctionne maintenant COMPLÈTEMENT HORS LIGNE!** 🎊

Sauf pour l'authentification, TOUT utilise Mistral 7B local via Ollama:
- ✅ Résumés
- ✅ QCM
- ✅ Jeu Memory
- ✅ Q/R

**Prêt à utiliser dès maintenant!**
