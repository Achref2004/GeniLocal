const API_BASE = 'http://localhost:8000/api';
const OLLAMA_API = 'http://localhost:11434/api/generate'; // Ollama local
const USE_OLLAMA = true; // Toggle pour utiliser Ollama hors ligne

/**
 * Détecte la langue du texte (FR, EN, AR)
 */
export function detectLanguage(text: string): string {
  const frenchWords = ['est', 'le', 'de', 'et', 'la', 'que', 'à', 'en', 'les', 'pour', 'du', 'par', 'que', 'qui'];
  const englishWords = ['is', 'the', 'of', 'and', 'to', 'for', 'in', 'with', 'this', 'that', 'be', 'was', 'are'];
  const arabicChars = /[\u0600-\u06FF]/g;

  const lowerText = text.toLowerCase();
  const arabicCount = (text.match(arabicChars) || []).length;

  if (arabicCount > 10) return 'ar';

  let frenchCount = frenchWords.filter(w => lowerText.includes(w.toLowerCase())).length;
  let englishCount = englishWords.filter(w => lowerText.includes(w.toLowerCase())).length;

  if (englishCount > frenchCount) return 'en';
  if (frenchCount > 0) return 'fr';
  return 'fr'; // Default
}

/**
 * Génère des prompts multilingues optimisés pour Mistral 7B
 */
function generatePrompt(mode: string, text: string, subject?: string, user_answer?: string, wrongTopics?: string, conversationHistory?: string, language?: string): string {
  const cleanText = text.substring(0, 2000); // Limite pour performance
  const lang = language || detectLanguage(text);

  // Textes multilingues
  const labels = {
    fr: {
      teacher: 'Tu es un professeur expert',
      french_only: 'Réponds UNIQUEMENT en FRANÇAIS',
      summarize: 'Fais un résumé structuré et concis',
      answer: 'Réponds',
    },
    en: {
      teacher: 'You are an expert teacher',
      french_only: 'Respond ONLY in ENGLISH',
      summarize: 'Create a structured and concise summary',
      answer: 'Answer',
    },
    ar: {
      teacher: 'أنت معلم خبير',
      french_only: 'رد باللغة العربية فقط',
      summarize: 'قدم ملخص منظم وموجز',
      answer: 'أجب',
    }
  };

  const l = labels[lang] || labels['fr'];


  switch (mode) {
    case 'resume':
      if (lang === 'en') {
        return `${l.teacher}. Create a structured and concise summary of the following text. Respond ONLY in ENGLISH. Format: # Title, ## Subsections, key points.

Text to summarize:
"${cleanText}"

Structured summary in ENGLISH:`;
      } else if (lang === 'ar') {
        return `${l.teacher}. ${l.summarize} للنص التالي. ${l.french_only}. الصيغة: # العنوان، ## الأقسام الفرعية، النقاط الرئيسية.

النص المراد تلخيصه:
"${cleanText}"

ملخص منظم باللغة العربية:`;
      }
      return `${l.teacher}. Fais un résumé structuré et concis du texte suivant. Réponds UNIQUEMENT en FRANÇAIS. Format: # Titre, ## Sous-sections, points clés.

Texte à résumer:
"${cleanText}"

Résumé structuré EN FRANÇAIS:`;

    case 'qcm':
      if (lang === 'en') {
        return `You are an expert quiz creator. Generate exactly 5 multiple choice questions in ENGLISH. Respond ONLY in ENGLISH. Generate valid JSON format based on this text. Questions AND answers must ALL be in ENGLISH.

JSON FORMAT STRICT:
[
  {"question": "Question in English?", "choices": ["Option A", "Option B", "Option C", "Option D"], "correct": 0},
  ...
]

Text:
"${cleanText}"

Generate now the questions in ENGLISH only. Response JSON (starting with [):`;
      } else if (lang === 'ar') {
        return `أنت خبير في إنشاء الاختبارات. أنشئ 5 أسئلة متعددة الاختيار باللغة العربية. صيغة JSON صارمة:
[
  {"question": "السؤال بالعربية؟", "choices": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"], "correct": 0},
  ...
]

النص:
"${cleanText}"

أنشئ الأسئلة الآن بصيغة JSON:`;
      }
      return `Tu es un créateur de quiz QCM. Génère exactement 5 questions à choix multiples en FRANÇAIS au format JSON valide basé sur ce texte. Les questions ET les réponses doivent TOUTES être en FRANÇAIS.

Format JSON STRICT:
[
  {"question": "Question en français?", "choices": ["Option A en français", "Option B en français", "Option C en français", "Option D en français"], "correct": 0},
  ...
]

Texte:
"${cleanText}"

Génère maintenant les questions EN FRANÇAIS uniquement. Réponse JSON (commencing with [):`;

    case 'qcm_remedial':
      if (lang === 'en') {
        return `You are an expert teacher. The student failed on these topics: ${wrongTopics}

Generate exactly 3 SIMPLE AND CLEAR multiple choice questions in ENGLISH to help understand. Questions AND answers MUST be in ENGLISH. Strict JSON format:
[
  {"question": "Question in English?", "choices": ["Option A", "Option B", "Option C", "Option D"], "correct": 0},
  ...
]

Reference text:
"${cleanText}"

Respond ONLY in ENGLISH. JSON response:`;
      } else if (lang === 'ar') {
        return `أنت معلم خبير. الطالب فشل في هذه المواضيع: ${wrongTopics}

أنشئ 3 أسئلة متعددة الاختيار بسيطة وواضحة باللغة العربية. صيغة JSON:
[
  {"question": "السؤال بالعربية؟", "choices": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"], "correct": 0},
  ...
]

النص المرجعي:
"${cleanText}"

رد باللغة العربية فقط. استجابة JSON:`;
      }
      return `Tu es un professeur expert en pédagogie. L'utilisateur a échoué sur ces sujets: ${wrongTopics}

Génère exactement 3 questions à choix multiples SIMPLES ET EXPLICATIVES en FRANÇAIS pour aider à comprendre. Les questions ET les réponses DOIVENT être en FRANÇAIS. Format JSON STRICT:
[
  {"question": "Question en français?", "choices": ["Option A en français", "Option B en français", "Option C en français", "Option D en français"], "correct": 0},
  ...
]

Texte de référence:
"${cleanText}"

Réponds EN FRANÇAIS UNIQUEMENT. Réponse JSON:`;

    case 'qr':
      // Support dialogue continu + détection langue
      const hasConversation = conversationHistory && conversationHistory.trim().length > 10;

      if (lang === 'en') {
        if (hasConversation) {
          return `You are a helpful expert teacher. Discuss naturally the subject: "${subject}".

Recent conversation:
${conversationHistory}

Student just said: "${user_answer}"

Respond directly to what they said. Be friendly, clear, and pedagogical. Answer ONLY in ENGLISH.`;
        }
        return `You are an expert teacher. The student wants to discuss: "${subject}".

Text context: "${cleanText}"

Student starts with: "${user_answer}"

Greet them warmly and start a natural discussion. Respond ONLY in ENGLISH.`;
      } else if (lang === 'ar') {
        if (hasConversation) {
          return `أنت معلم خبير. ناقش الموضوع بشكل طبيعي: "${subject}".

المحادثة الأخيرة:
${conversationHistory}

قال الطالب للتو: "${user_answer}"

رد مباشرة على ما قالوه. كن ودوداً وواضحاً وتربوياً. رد باللغة العربية فقط.`;
        }
        return `أنت معلم خبير. يريد الطالب مناقشة الموضوع: "${subject}".

سياق النص: "${cleanText}"

بدأ الطالب بـ: "${user_answer}"

رحب به بدفء وابدأ مناقشة طبيعية. رد باللغة العربية فقط.`;
      }

      if (hasConversation) {
        return `Tu es un professeur expert et bienveillant. Discute naturellement du sujet: "${subject}".

Conversation récente:
${conversationHistory}

L'étudiant vient de dire: "${user_answer}"

Répondez directement à ce qu'il a dit. Soyez amical, clair et pédagogique. Répondez UNIQUEMENT en FRANÇAIS.`;
      }
      return `Tu es un professeur expert bienveillant. L'étudiant veut discuter du sujet: "${subject}".

Contexte du texte: "${cleanText}"

L'étudiant commence par: "${user_answer}"

Saluez-le chaleureusement et commencez une discussion naturelle. Répondez UNIQUEMENT en FRANÇAIS.`;


    case 'qr_correct':
      const nicknames = ['mon amis', 'mon cherie', 'sweety', 'mon petit', 'mon cher','5ouya' ,'mon chouchou', 'ma chère'];
      const randomNick = nicknames[Math.floor(Math.random() * nicknames.length)];
      const isFirstMessage = !conversationHistory || conversationHistory.trim().split('\n').filter(l => l.startsWith('Étudiant:')).length === 1;

      // Optimiser: prompt plus court pour vitesse
      if (isFirstMessage) {
        return `Tu es un professeur expert et bienveillant EN FRANÇAIS. Salue l'étudiant avec "Bonjour ${randomNick}!" et commence à discuter du sujet: "${subject}".

Sois clair, amical, pédagogique. Réponds UNIQUEMENT en FRANÇAIS. Ne sois pas trop formel.

Étudiant: ${user_answer}

Ta réponse EN FRANÇAIS:`;
      }

      return `Tu es un professeur expert et bienveillant EN FRANÇAIS. Discute du sujet: "${subject}".

Historique récent:
${conversationHistory}

Étudiant: ${user_answer}

Réponds UNIQUEMENT en FRANÇAIS à ce message:`;


    default:
      return cleanText;
  }
}

/**
 * Stream response from Ollama (local, hors ligne)
 */
function fetchStreamOllama(
  { mode, text, subject = '', user_answer = '', wrongTopics = '', conversationHistory = '', language = '' }: { mode: string; text: string; subject?: string; user_answer?: string; wrongTopics?: string; conversationHistory?: string; language?: string },
  onToken: (token: string, fullText: string) => void,
  onDone: (fullText: string) => void,
  onError: (err: Error) => void
): AbortController {
  const controller = new AbortController();
  const prompt = generatePrompt(mode, text, subject, user_answer, wrongTopics, conversationHistory, language);

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
  { mode, text, subject = '', user_answer = '', wrongTopics = '', conversationHistory = '', language = '' }: { mode: string; text: string; subject?: string; user_answer?: string; wrongTopics?: string; conversationHistory?: string; language?: string },
  onToken: (token: string, fullText: string) => void,
  onDone: (fullText: string) => void,
  onError: (err: Error) => void
): AbortController {
  // Essaie Ollama d'abord (hors ligne)
  if (USE_OLLAMA) {
    console.log('🔄 Utilisation de Ollama (hors ligne)');
    return fetchStreamOllama({ mode, text, subject, user_answer, wrongTopics, conversationHistory, language }, onToken, onDone, (err) => {
      console.warn('⚠️ Ollama indisponible, tentative backend...', err.message);
      // Fallback sur backend si Ollama échoue
      return fetchStreamBackend({ mode, text, subject, user_answer, wrongTopics, conversationHistory, language }, onToken, onDone, onError);
    });
  }

  // Fallback sur backend
  return fetchStreamBackend({ mode, text, subject, user_answer, wrongTopics, conversationHistory, language }, onToken, onDone, onError);
}

/**
 * Connexion au backend distant (pour authentification et fallback)
 */
function fetchStreamBackend(
  { mode, text, subject = '', user_answer = '', wrongTopics = '', conversationHistory = '', language = '' }: { mode: string; text: string; subject?: string; user_answer?: string; wrongTopics?: string; conversationHistory?: string; language?: string },
  onToken: (token: string, fullText: string) => void,
  onDone: (fullText: string) => void,
  onError: (err: Error) => void
): AbortController {
  const controller = new AbortController();

  fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, text, subject, user_answer, wrongTopics, conversationHistory, language }),
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
  const newEntry: HistoryItem = {
    ...entry,
    id: Date.now(),
    timestamp: new Date().toISOString(),
  };

  history.unshift(newEntry);
  if (history.length > MAX_HISTORY) history.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

  // Save to SQLite database asynchronously
  saveToDatabaseAsync(newEntry).catch(err =>
    console.warn('⚠️ Failed to save to database:', err)
  );

  return history;
}

/**
 * Save IA history entry to SQLite database via API
 */
async function saveToDatabaseAsync(entry: HistoryItem): Promise<void> {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('⚠️ No auth token, skipping database save');
      return;
    }

    const response = await fetch(`${API_BASE}/ia-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        mode: entry.mode,
        input_text: entry.text || '',
        subject: entry.subject || '',
        result: entry.result || '',
        question: entry.question,
        user_answer: entry.userAnswer,
        correction: entry.correction,
        metadata: {
          saved_from: 'frontend',
          timestamp: entry.timestamp
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Database save failed: ${response.status}`);
    }

    console.log('✅ IA history saved to database');
  } catch (err) {
    console.error('❌ Error saving to database:', err);
    // Silently fail - localStorage is available anyway
  }
}

export function clearHistory(): HistoryItem[] {
  localStorage.removeItem(HISTORY_KEY);
  return [];
}
