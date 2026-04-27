import {
  API_BASE_URL as API_BASE,
  OLLAMA_API_GENERATE as OLLAMA_API,
  USE_OLLAMA,
  OLLAMA_MODEL,
  OLLAMA_TEMPERATURE,
  OLLAMA_NUM_PREDICT,
  OLLAMA_CONTEXT_LENGTH,
} from '../config';


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
  const cleanText = text.substring(0, OLLAMA_CONTEXT_LENGTH); // Limite pour performance
  const lang = language || detectLanguage(text);

  // Textes multilingues
  const labels: Record<string, { teacher: string; french_only: string; summarize: string; answer: string }> = {
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


    case 'qr_correct': {
      const nicknames = ['mon ami', 'mon cher', 'sweety', 'mon petit', 'mon cher', '5ouya', 'mon chouchou', 'ma chère'];
      const randomNick = nicknames[Math.floor(Math.random() * nicknames.length)];
      const isFirstMessage = !conversationHistory || conversationHistory.trim().split('\n').filter(l => l.startsWith('Étudiant:') || l.startsWith('Student:') || l.startsWith('طالب:')).length <= 1;

      if (lang === 'en') {
        if (isFirstMessage) {
          return `You are a kind, expert teacher. Say "Hello ${randomNick}!" and start a conversation about "${subject}".

Be clear, friendly, and helpful. Answer ONLY in ENGLISH, and keep the tone natural.

Student: ${user_answer}

Your answer in ENGLISH:`;
        }
        return `You are a kind, expert teacher. Discuss the subject: "${subject}".

Recent conversation:
${conversationHistory}

Student: ${user_answer}

Answer ONLY in ENGLISH to this message:`;
      }

      if (lang === 'ar') {
        if (isFirstMessage) {
          return `أنت معلم خبير وودود. قل "مرحباً ${randomNick}!" وابدأ حديثاً حول "${subject}".

كن واضحاً، ودوداً، ومساعداً. أجب باللغة العربية فقط.

الطالب: ${user_answer}

إجابتك باللغة العربية:`;
        }
        return `أنت معلم خبير وودود. ناقش الموضوع: "${subject}".

المحادثة الأخيرة:
${conversationHistory}

الطالب: ${user_answer}

أجب باللغة العربية فقط على هذه الرسالة:`;
      }

      if (isFirstMessage) {
        return `Tu es un professeur expert et bienveillant. Dis "Bonjour ${randomNick}!" et commence à discuter du sujet : "${subject}".

Sois clair, amical et pédagogique. Réponds UNIQUEMENT en FRANÇAIS.

Étudiant : ${user_answer}

Ta réponse EN FRANÇAIS :`;
      }

      return `Tu es un professeur expert et bienveillant. Discute du sujet : "${subject}".

Historique récent :
${conversationHistory}

Étudiant : ${user_answer}

Réponds UNIQUEMENT en FRANÇAIS à ce message :`;
    }


    default:
      return cleanText;
  }
}

/**
 * Stream response from Ollama (local, hors ligne)
 */
function fetchStreamOllama(
  { mode, text, subject = '', question = '', user_answer = '', wrongTopics = '', conversationHistory = '', language = '' }: { mode: string; text: string; subject?: string; question?: string; user_answer?: string; wrongTopics?: string; conversationHistory?: string; language?: string },
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
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: true,
      temperature: OLLAMA_TEMPERATURE,
      num_predict: OLLAMA_NUM_PREDICT,
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
 * 1. Try backend first (checks DB cache — instant if already generated)
 * 2. Fallback to Ollama local streaming
 * 3. Fallback to backend streaming
 */
export function fetchStream(
  { mode, text, subject = '', question = '', user_answer = '', wrongTopics = '', conversationHistory = '', language = '' }: { mode: string; text: string; subject?: string; question?: string; user_answer?: string; wrongTopics?: string; conversationHistory?: string; language?: string },
  onToken: (token: string, fullText: string) => void,
  onDone: (fullText: string) => void,
  onError: (err: Error) => void
): AbortController {
  const controller = new AbortController();

  // Cacheable modes: résumé, QCM, qr_question (not chat/correction)
  const cacheableModes = ['resume', 'qcm', 'qr_question', 'qcm_remedial'];
  const isCacheable = cacheableModes.includes(mode) && !user_answer;

  if (isCacheable) {
    // Try backend first — it checks the DB cache and returns JSON instantly on hit
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mode, text, subject, question, user_answer, wrongTopics, conversationHistory, language }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          // ✅ CACHE HIT — backend returned JSON directly
          const data = await response.json();
          if (data.cached && data.full_text) {
            console.log('⚡ Cache HIT — affichage instantané');
            // Simulate a quick "typing" effect for UX
            onToken(data.full_text, data.full_text);
            onDone(data.full_text);
            return;
          }
        }

        // CACHE MISS — backend is streaming SSE, parse normally
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
                const eventData = JSON.parse(line.slice(6));
                if (eventData.token) {
                  fullText += eventData.token;
                  onToken(eventData.token, fullText);
                }
                if (eventData.done && eventData.full_text) {
                  onDone(eventData.full_text);
                  return;
                }
              } catch (_e) { /* skip */ }
            }
          }
        }
        onDone(fullText);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.warn('⚠️ Backend cache/stream failed, trying Ollama...', err.message);
        // Fallback: try Ollama directly
        fetchStreamOllama({ mode, text, subject, question, user_answer, wrongTopics, conversationHistory, language }, onToken, onDone, onError);
      });

    return controller;
  }

  // Non-cacheable modes: use Ollama directly
  if (USE_OLLAMA) {
    console.log('🔄 Utilisation de Ollama (hors ligne)');
    return fetchStreamOllama({ mode, text, subject, question, user_answer, wrongTopics, conversationHistory, language }, onToken, onDone, (err) => {
      console.warn('⚠️ Ollama indisponible, tentative backend...', err.message);
      return fetchStreamBackend({ mode, text, subject, question, user_answer, wrongTopics, conversationHistory, language }, onToken, onDone, onError);
    });
  }

  // Fallback sur backend
  return fetchStreamBackend({ mode, text, subject, question, user_answer, wrongTopics, conversationHistory, language }, onToken, onDone, onError);
}

/**
 * Connexion au backend distant (pour authentification et fallback)
 */
function fetchStreamBackend(
  { mode, text, subject = '', question = '', user_answer = '', wrongTopics = '', conversationHistory = '', language = '' }: { mode: string; text: string; subject?: string; question?: string; user_answer?: string; wrongTopics?: string; conversationHistory?: string; language?: string },
  onToken: (token: string, fullText: string) => void,
  onDone: (fullText: string) => void,
  onError: (err: Error) => void
): AbortController {
  const controller = new AbortController();

  fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, text, subject, question, user_answer, wrongTopics, conversationHistory, language }),
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

export async function loadHistory(): Promise<HistoryItem[]> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return [];
    const res = await fetch(`${API_BASE}/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      // Map backend field names to frontend HistoryItem
      return data.map((item: any) => ({
        id: item.id,
        timestamp: item.timestamp,
        mode: item.mode,
        text: item.input_text || item.text || '',
        subject: item.subject || '',
        result: item.result || '',
        question: item.question || '',
        userAnswer: item.user_answer || item.userAnswer || '',
        correction: item.correction || '',
      }));
    }
  } catch (err) {
    console.warn("Failed to load history from db", err);
  }
  return [];
}

export async function saveToHistory(entry: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<HistoryItem[]> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return [];
    await fetch(`${API_BASE}/history`, {
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
      })
    });
    window.dispatchEvent(new Event('ia-history-updated'));
  } catch (err) {
    console.error('❌ Error saving history to database:', err);
  }
  return await loadHistory();
}

export async function clearHistory(): Promise<HistoryItem[]> {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      await fetch(`${API_BASE}/history`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  } catch (e) {
    console.warn("Error clearing history", e);
  }
  return [];
}
