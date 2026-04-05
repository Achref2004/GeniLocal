const API_BASE = 'http://localhost:8000/api';
const OLLAMA_API = 'http://localhost:11434/api/generate'; // Ollama local
const USE_OLLAMA = true; // Toggle pour utiliser Ollama hors ligne

/**
 * Génère des prompts optimisés pour Mistral 7B
 */
function generatePrompt(mode: string, text: string, subject?: string, user_answer?: string, wrongTopics?: string): string {
  const cleanText = text.substring(0, 2000); // Limite pour performance

  switch (mode) {
    case 'resume':
      return `Tu es un professeur expert en français. Fais un résumé structuré et concis du texte suivant. IMPORTANT: Réponds UNIQUEMENT en FRANÇAIS. Format: # Titre, ## Sous-sections, points clés.

Texte à résumer:
"${cleanText}"

Résumé structuré EN FRANÇAIS:`;

    case 'qcm':
      return `Tu es un créateur de quiz QCM en FRANÇAIS. IMPORTANT: Génère une réponse EXCLUSIVEMENT en FRANÇAIS. Génère exactement 5 questions à choix multiples au format JSON valide basé sur ce texte. Les questions ET les réponses doivent TOUTES être en FRANÇAIS.

Format JSON STRICT:
[
  {"question": "Question en français?", "choices": ["Option A en français", "Option B en français", "Option C en français", "Option D en français"], "correct": 0},
  ...
]

Texte:
"${cleanText}"

Génère maintenant les questions EN FRANÇAIS uniquement. Réponse JSON (commencing with [):`;

    case 'qcm_remedial':
      return `Tu es un professeur expert en pédagogie EN FRANÇAIS. IMPORTANT: Réponds UNIQUEMENT en FRANÇAIS. L'utilisateur a échoué sur ces sujets: ${wrongTopics}

Génère exactement 3 questions à choix multiples SIMPLES ET EXPLICATIVES pour aider à comprendre. Les questions ET les réponses DOIVENT être en FRANÇAIS. Format JSON STRICT:
[
  {"question": "Question en français?", "choices": ["Option A en français", "Option B en français", "Option C en français", "Option D en français"], "correct": 0},
  ...
]

Texte de référence:
"${cleanText}"

Réponds EN FRANÇAIS UNIQUEMENT. Réponse JSON:`;

    case 'qr':
      return `Tu es un professeur expert EN FRANÇAIS. IMPORTANT: Réponds UNIQUEMENT en FRANÇAIS. Basé sur ce texte, génère une question pertinente et une réponse courte en FRANÇAIS.

Texte:
"${cleanText}"

Réponds EN FRANÇAIS UNIQUEMENT au format:
QUESTION: [la question en français]
RÉPONSE: [la réponse courte en français]

Question et réponse EN FRANÇAIS:`;

    case 'qr_correct':
      return `Tu es un professeur qui corrige. IMPORTANT: Réponds UNIQUEMENT en FRANÇAIS. Évalue cette réponse d'étudiant de manière pédagogique et en FRANÇAIS.

Texte de référence:
"${cleanText}"

Réponse de l'étudiant:
"${user_answer}"

Évaluation EN FRANÇAIS UNIQUEMENT:`;

    default:
      return cleanText;
  }
}

/**
 * Stream response from Ollama (local, hors ligne)
 */
function fetchStreamOllama(
  { mode, text, subject = '', user_answer = '', wrongTopics = '' }: { mode: string; text: string; subject?: string; user_answer?: string; wrongTopics?: string },
  onToken: (token: string, fullText: string) => void,
  onDone: (fullText: string) => void,
  onError: (err: Error) => void
): AbortController {
  const controller = new AbortController();
  const prompt = generatePrompt(mode, text, subject, user_answer, wrongTopics);

  fetch(OLLAMA_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mistral', // Votre modèle Ollama
      prompt: prompt,
      stream: true,
      temperature: 0.7,
      num_predict: 500,
    }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Ollama Error: HTTP ${response.status}`);
      }
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                fullText += data.response;
                onToken(data.response, fullText);
              }
              if (data.done) {
                onDone(fullText);
                return;
              }
            } catch (_e) {
              // Skip malformed JSON
            }
          }
        }
      }
    })
    .catch((err) => {
      onError(err instanceof Error ? err : new Error('Erreur Ollama'));
    });

  return controller;
}

/**
 * Stream a response from the IA backend
 * Utilise Ollama (hors ligne) en priorité, fallback sur backend si disponible
 */
export function fetchStream(
  { mode, text, subject = '', user_answer = '', wrongTopics = '' }: { mode: string; text: string; subject?: string; user_answer?: string; wrongTopics?: string },
  onToken: (token: string, fullText: string) => void,
  onDone: (fullText: string) => void,
  onError: (err: Error) => void
): AbortController {
  // Essaie Ollama d'abord (hors ligne)
  if (USE_OLLAMA) {
    console.log('🔄 Utilisation de Ollama (hors ligne)');
    return fetchStreamOllama({ mode, text, subject, user_answer, wrongTopics }, onToken, onDone, (err) => {
      console.warn('⚠️ Ollama indisponible, tentative backend...', err.message);
      // Fallback sur backend si Ollama échoue
      return fetchStreamBackend({ mode, text, subject, user_answer, wrongTopics }, onToken, onDone, onError);
    });
  }

  // Fallback sur backend
  return fetchStreamBackend({ mode, text, subject, user_answer, wrongTopics }, onToken, onDone, onError);
}

/**
 * Connexion au backend distant (pour authentification et fallback)
 */
function fetchStreamBackend(
  { mode, text, subject = '', user_answer = '', wrongTopics = '' }: { mode: string; text: string; subject?: string; user_answer?: string; wrongTopics?: string },
  onToken: (token: string, fullText: string) => void,
  onDone: (fullText: string) => void,
  onError: (err: Error) => void
): AbortController {
  const controller = new AbortController();

  fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, text, subject, user_answer, wrongTopics }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                fullText += data.token;
                onToken(data.token, fullText);
              }
              if (data.done && data.full_text) {
                onDone(data.full_text);
                return;
              }
            } catch (_e) {
              // skip malformed JSON
            }
          }
        }
      }
      onDone(fullText);
    })
    .catch((err: Error) => {
      if (err.name !== 'AbortError') {
        onError(err);
      }
    });

  return controller;
}

// --- LocalStorage History ---

const HISTORY_KEY = 'study_ia_history';
const MAX_HISTORY = 50;

export interface HistoryItem {
  id: number;
  timestamp: string;
  mode: string;
  text?: string;
  subject?: string;
  result?: string;
  question?: string;
  userAnswer?: string;
  correction?: string;
}

export function loadHistory(): HistoryItem[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(entry: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem[] {
  const history = loadHistory();
  history.unshift({
    ...entry,
    id: Date.now(),
    timestamp: new Date().toISOString(),
  });
  if (history.length > MAX_HISTORY) history.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function clearHistory(): HistoryItem[] {
  localStorage.removeItem(HISTORY_KEY);
  return [];
}
