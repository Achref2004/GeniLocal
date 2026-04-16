# Rapport Technique et Fonctionnel : Application "Study" (Professeur IA)

> [!NOTE]
> Ce rapport offre une vue d'ensemble détaillée de l'application "Study" (aussi appelée Professeur IA), développée dans le cadre de votre PFE. Il met en évidence son architecture technique, ses fonctionnalités intéractives, et surtout sa capacité à fonctionner de manière autonome sans aucune connexion internet.

---

## 1. Vue d'Ensemble du Projet

**Study** est une plateforme éducative innovante qui intègre l'intelligence artificielle pour accompagner l'utilisateur dans ses révisions. L'objectif principal est de fournir un "professeur virtuel" capable de générer des résumés, de faire passer des QCM interactifs, et de stimuler la réflexion, tout en garantissant un contrôle total des données grâce à une architecture 100% locale.

## 2. Architecture Technique

L'application repose sur une architecture moderne séparant clairement l'interface utilisateur (frontend) et la logique serveur/IA (backend).

### 2.1. Frontend (Interface Utilisateur)
L'interface réactive et dynamique est située dans le dossier `study/`.
*   **Technologie Principale :** React 19 propulsé par Vite.js avec TypeScript pour la robustesse du code.
*   **Style et Interface :** Tailwind CSS pour le design, accompagné d'animations fluides via `framer-motion`. Un système de thèmes personnalisés (clair et sombre avec palette de cyan/bleu) est implémenté.
*   **Icônes et Composants :** `lucide-react` pour l'iconographie et `recharts` pour les éventuels graphiques de statistiques.
*   **Stockage de session :** L'historique des discussions et les configurations (thème, avatars) sont sauvegardés localement via le `localStorage` du navigateur.

### 2.2. Backend (Logique Serveur & API)
Le moteur de l'application est situé dans le dossier `study_backend/`.
*   **Technologie Principale :** Python avec le framework web rapide **FastAPI**.
*   **Communication :** Utilisation des événements envoyés par le serveur (Server-Sent Events / SSE) permettant au texte de l'IA d'apparaître progressivement (effet "machine à écrire").

### 2.3. Moteur d'Intelligence Artificielle
*   **Hébergement du Modèle :** Le logiciel **Ollama** tourne en toile de fond pour héberger le modèle de langage (LLM), par exemple *Mistral*.
*   **Avantage :** L'IA tourne directement sur les capacités matérielles de la machine de l'utilisateur, évitant l'envoi de requêtes textuelles vers des serveurs comme ceux d'OpenAI.

---

## 3. Fonctionnalités Pédagogiques Clés

L'application propose des outils conçus spécifiquement pour l'apprentissage :

1.  **Mode "Résumé" :** L'utilisateur fournit un cours, et l'IA génère des synthèses structurées pour faciliter la mémorisation.
2.  **Mode "QCM" interactif :** L'IA propose des questions à choix multiples avec un retour visuel en temps réel (vert pour vrai, rouge pour faux) et un score final sur 5.
3.  **Mode "Questions/Réponses (Q/R)" :** L'IA interroge l'utilisateur sur une notion, l'utilisateur répond, et l'IA corrige ou affine la réponse.
4.  **Mode "Raisonnement" (Nouveau) :** Une page dédiée qui permet de visualiser non seulement la réponse de l'IA, mais aussi l'ensemble de son processus de réflexion et d'analyse.
5.  **Dashboard et Profil :** Un tableau de bord dynamique qui inclut un chronomètre ("Heures d'étude") s'incrémentant en direct.

---

## 4. Expérience Utilisateur et Avatars (Le "Professeur")

Pour rendre l'apprentissage plus humain, un avatar virtuel assiste l'étudiant.

> [!TIP]
> **Avatars Dynamiques avec DiceBear**
> Le profil visuel du professeur est généré par `@dicebear/core` et `@dicebear/collection`. Les SVGs sont injectés dynamiquement pour permettre une animation (*Lip-Sync* ou mouvements des lèvres calqués sur la voix) et le clignement des yeux.

> [!TIP]
> **Synthèse Vocale (Text-To-Speech)**
> Un module personnalisé (`useSpeechSynthesis.ts`) intercepte le texte de l'IA (en nettoyant le code Markdown) et lit les phrases à haute voix grâce à l'API `window.speechSynthesis`.

---

## 5. La Promesse du 100% Hors Ligne

C'est l'un des plus grands atouts du projet. L'application ne dépend d'aucun service cloud :

*   **Texte et Raisonnement :** Totalement isolés du web grâce au duo **FastAPI + Ollama**.
*   **Images :** Aucune image n'est téléchargée à la volée. Les bibliothèques DiceBear sont embarquées dans le code Javascript (bundle final) et dessinent mathématiquement le SVG localement.
*   **Voix :** Le code est explicitement configuré pour filtrer les voix et ne retenir que celles marquées comme `localService`. Cela empêche votre navigateur (comme Chrome ou Edge) d'envoyer le texte sur les serveurs de Google ou Microsoft.
*   **Base de Données Front :** Le frontend utilise le stockage interne du navigateur, nécessitant zéro appel réseau externe.

---

## 6. Prochaines Étapes / Évolutions Possibles

Pistes d'amélioration futures pour votre PFE :
*   **Sauvegarde avancée Backend :** Terminer la liaison entre le Backend (`database.py`) et le Frontend.
*   **RAG (Retrieval-Augmented Generation) :** Importer des PDFs pour que l'IA connaisse les vrais cours.
*   **Amélioration de la fluidité Vocale :** Installer des voix de haute qualité directement sur Windows.

> [!IMPORTANT]
> **Conclusion**
> Le projet "Study" est une implémentation techniquement très valorisante, performante et totalement sécurisée sur le plan de la confidentialité des données.
