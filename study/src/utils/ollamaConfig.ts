/**
 * Configuration Ollama pour le mode hors ligne
 *
 * SETUP REQUIS:
 * 1. Installer Ollama: https://ollama.ai
 * 2. Télécharger Mistral 7B: ollama pull mistral
 * 3. Démarrer Ollama: ollama serve (port 11434 par défaut)
 * 4. Vérifier: curl http://localhost:11434/api/tags
 */

export interface OllamaConfig {
  endpoint: string;
  model: string;
  enabled: boolean;
  temperature: number;
  contextLength: number;
  timeoutMs: number;
}

export const OLLAMA_CONFIG: OllamaConfig = {
  endpoint: 'http://localhost:11434',
  model: 'mistral', // Assurez-vous que mistral est installé
  enabled: true,
  temperature: 0.7, // 0-1: plus bas = plus déterministe
  contextLength: 2000, // Limite du texte d'entrée
  timeoutMs: 120000, // 2 minutes timeout
};

/**
 * Vérifier la disponibilité d'Ollama
 */
export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_CONFIG.endpoint}/api/tags`, {
      method: 'GET',
      timeout: 5000,
    });
    if (!response.ok) return false;
    const data = await response.json() as { models?: Array<{ name: string }> };
    return data.models?.some((m) => m.name.includes('mistral')) ?? false;
  } catch (e) {
    console.warn('❌ Ollama non disponible:', e);
    return false;
  }
}

/**
 * Obtenir info du modèle Mistral
 */
export async function getModelInfo(): Promise<{ name: string; size: string; details?: string } | null> {
  try {
    const response = await fetch(`${OLLAMA_CONFIG.endpoint}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_CONFIG.model }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      name: data.model,
      size: `${(data.details?.parameter_size / 1e9).toFixed(1)}B`,
      details: data.details?.quantization_level,
    };
  } catch (e) {
    console.error('Erreur récupération modèle:', e);
    return null;
  }
}

/**
 * Instructions de setup pour l'utilisateur
 */
export const OLLAMA_SETUP_GUIDE = `
# 🚀 Configuration Ollama - Mode Hors Ligne

## Étape 1: Installation
1. Télécharger Ollama: https://ollama.ai/download
2. Installer et lancer l'application

## Étape 2: Télécharger Mistral 7B
Ouvrir un terminal et exécuter:
\`\`\`bash
ollama pull mistral
\`\`\`
(Téléchargement ~4 GB, dépend de votre connexion)

## Étape 3: Vérifier l'installation
\`\`\`bash
ollama list
\`\`\`
Vous devriez voir:
\`\`\`
NAME            ID              SIZE    MODIFIED
mistral:latest  2e405c...       4.1GB   2 hours ago
\`\`\`

## Étape 4: Démarrer le service
Ollama démarre automatiquement en background.
Vérifier sur http://localhost:11434

## ✅ C'est prêt!
L'app utilisera Ollama automatiquement pour:
- Créer des résumés
- Générer des QCM
- Créer des questions/réponses

Tout fonctionne hors ligne! 🎉
`;
