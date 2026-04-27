import { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../reutilisable/Themecontext';
import { fetchStream, detectLanguage, saveToHistory } from '../../utils/api_ia';
import { getMessageCount, incrementMessageCount, canSendMessage, getRemainingMessages, getTimeUntilReset, MAX_MESSAGES_PER_DAY } from '../../utils/chatCounter';
import { Send, Lock } from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatViewProps {
  text: string;
  subject: string;
  onMessagesSent?: (newMessages: ChatMessage[]) => void;
}

const MAX_MESSAGES_PER_DAY_CONST = MAX_MESSAGES_PER_DAY;

// Save chat message to database
async function saveChatMessageToDatabase(message: ChatMessage, sessionId: string): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    await fetch(`${API_BASE_URL}/chat/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        session_id: sessionId,
        role: message.role,
        content: message.content
      })
    });
  } catch (err) {
    console.warn('⚠️ Failed to save chat message to database:', err);
  }
}

// Load chat history from database
async function loadChatHistoryFromDatabase(sessionId: string): Promise<ChatMessage[]> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return [];

    const response = await fetch(
      `${API_BASE_URL}/chat/messages?session_id=${sessionId}&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.messages.map((msg: any) => ({
      id: Math.random() * 10000,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }));
  } catch (err) {
    console.warn('⚠️ Failed to load chat history:', err);
    return [];
  }
}

export default function ChatView({ text, subject, onMessagesSent }: ChatViewProps) {
  const { dark, T } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem('chat_session_id');
    return stored || `session_${Date.now()}`;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const stopRequestedRef = useRef(false);
  const assistantMessageIdRef = useRef<number | null>(null);

  // Initialiser le compteur + charger historique
  useEffect(() => {
    setUserMessageCount(getMessageCount());

    // Try to load from database first
    loadChatHistoryFromDatabase(sessionId).then(dbMessages => {
      if (dbMessages.length > 0) {
        setMessages(dbMessages);
      } else if (messages.length === 0) {
        // Only show greeting if no messages
        const salut: ChatMessage = {
          id: Date.now(),
          role: 'assistant',
          content: ` Salut Mon amis ! Je suis là pour discuter de ${subject}. Tu peux me poser tes questions!`,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([salut]);
      }
    });
  }, []);

  // Auto-scroll vers le dernier message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    stopRequestedRef.current = false;

    // Vérifier la limite
    if (!canSendMessage()) {
      alert(` Limite atteinte! Vous avez utilisé vos ${MAX_MESSAGES_PER_DAY_CONST} messages. Réessayez dans ${getTimeUntilReset()}.`);
      return;
    }

    // Ajouter le message utilisateur
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    // Créer un message assistant vide pour le streaming
    const assistantMessageId = Date.now() + 1;
    assistantMessageIdRef.current = assistantMessageId;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    const userInput = inputValue;
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputValue('');
    setIsLoading(true);

    // Save user message to database
    saveChatMessageToDatabase(userMessage, sessionId).catch(err =>
      console.warn('Failed to save user message:', err)
    );

    // Incrémenter le compteur
    const newCount = incrementMessageCount();
    setUserMessageCount(newCount);

    // Historique minimal pour vitesse (seulement les 2 derniers échanges)
    const recentMessages = messages
      .filter(m => m.role === 'user' || (m.role === 'assistant' && m.content.trim()))
      .slice(-4); // 2 échanges = 4 messages

    const conversationHistory = recentMessages
      .map(m => `${m.role === 'user' ? 'Étudiant' : 'Professeur'}: ${m.content}`)
      .join('\n');

    // Détecter la langue du message utilisateur
    const detectedLang = detectLanguage(userInput);

    // Utiliser mode 'qr_correct' optimisé avec nicknames et réponses rapides
    controllerRef.current = fetchStream(
      { mode: 'qr_correct', text, user_answer: userInput, subject, conversationHistory, language: detectedLang },
      (_token, fullText) => {
        // STREAMING: Mise à jour en temps réel du contenu
        setMessages(prev => prev.map(m =>
          m.id === assistantMessageId ? { ...m, content: fullText } : m
        ));
      },
      async (fullText) => {
        if (stopRequestedRef.current) {
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        // Finaliser le message
        setMessages(prev => prev.map(m =>
          m.id === assistantMessageId ? { ...m, content: fullText } : m
        ));

        // Save assistant message to database
        const finalMessage: ChatMessage = { ...assistantMessage, content: fullText };
        saveChatMessageToDatabase(finalMessage, sessionId).catch(err =>
          console.warn('Failed to save assistant message:', err)
        );

        // Sauvegarder dans histoire
        await saveToHistory({
          mode: 'qr',
          text: userInput.substring(0, 100),
          subject,
          userAnswer: userInput,
          correction: fullText,
        });
        onMessagesSent?.([userMessage, { ...assistantMessage, content: fullText }]);
      },
      (err) => {
        if (stopRequestedRef.current) {
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        const errorMessage: ChatMessage = {
          id: Date.now() + 2,
          role: 'assistant',
          content: ` Erreur: ${err.message}`,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    );
  }, [inputValue, isLoading, messages, text, subject, onMessagesSent, sessionId]);

  const remainingMessages = getRemainingMessages();
  const canSend = canSendMessage();

  const handleStop = () => {
    stopRequestedRef.current = true;
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    setIsLoading(false);
    if (assistantMessageIdRef.current) {
      setMessages(prev => prev.map(m =>
        m.id === assistantMessageIdRef.current
          ? { ...m, content: `${m.content}\n
*Génération arrêtée par l'utilisateur.*` }
          : m
      ));
      assistantMessageIdRef.current = null;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '600px',
      background: `linear-gradient(135deg, ${T.card}80 0%, ${T.card}60 100%)`,
      border: `1px solid ${T.border}`,
      borderRadius: '16px',
      overflow: 'hidden',
      backdropFilter: 'blur(32px)',
      boxShadow: `0 8px 32px ${T.accent}20`,
    }}>
      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {messages.map((msg) => {
          const isCurrentlyLoading = isLoading && msg === messages[messages.length - 1] && msg.role === 'assistant' && msg.content === '';

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: msg.role === 'user'
                    ? `${T.accent}15`
                    : dark
                    ? '#1a1a2e'
                    : '#f0f4ff',
                  color: dark
                    ? '#ffffff'
                    : '#001f3f',
                  border: msg.role === 'user'
                    ? `2px solid ${T.accent}`
                    : `2px solid ${dark ? '#9333ea' : '#667eea'}`,
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  boxShadow: `0 4px 12px ${msg.role === 'user' ? T.accent : '#d946ef'}40`,
                  transition: 'all 0.3s ease',
                }}
              >
                {isCurrentlyLoading ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: dark ? '#ffffff' : '#001f3f',
                  }}>
                    {/* Creative Loading Animation */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${T.accent}, ${T.accentSoft})`,
                            animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                            boxShadow: `0 0 12px ${T.accent}60`,
                          }}
                        />
                      ))}
                      <style>{`
                        @keyframes dotPulse {
                          0%, 100% {
                            opacity: 0.3;
                            transform: scale(0.8);
                          }
                          50% {
                            opacity: 1;
                            transform: scale(1.2);
                          }
                        }
                      `}</style>
                    </div>
                    <span style={{ fontSize: '0.95rem', fontStyle: 'italic', opacity: 0.8 }}>Réponse en cours...</span>
                  </div>
                ) : (
                  <>
                    <p style={{ margin: '0 0 4px 0', whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: T.textMuted, textAlign: 'right' }}>
                      {msg.timestamp}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Counter Warning */}
      {!canSend && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
            <Lock size={20} />
            <span style={{ fontWeight: 'bold' }}>Limite atteinte pour aujourd'hui</span>
          </div>
          <p style={{ margin: 0, color: T.textMuted, fontSize: '0.875rem' }}>
             Vous avez utilisé vos 20 messages. Réessayez dans {getTimeUntilReset()}
          </p>
          <div style={{
            background: `linear-gradient(135deg, ${'#ef4444'} 0%, ${'#f77f7f'} 100%)`,
            padding: '12px',
            borderRadius: '8px',
            color: dark ? '#ffffff' : '#ffffff',
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          }}
          >
             Passer à Premium pour discussions illimitées
          </div>
        </div>
      )}

      {/* Message Counter Info */}
      {canSend && (
        <div style={{
          background: `${T.accent}10`,
          borderTop: `1px solid ${T.border}`,
          padding: '12px 16px',
          fontSize: '0.75rem',
          color: T.textMuted,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span> Messages: {MAX_MESSAGES_PER_DAY_CONST - userMessageCount} restants</span>
          <span style={{ color: remainingMessages <= 5 ? '#ef4444' : T.accent }}>
            {remainingMessages <= 5 && ' '}{remainingMessages <= 5 ? 'Bientôt limité' : 'Dans les limites'}
          </span>
        </div>
      )}

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        style={{
          display: 'flex',
          gap: '8px',
          padding: '16px',
          borderTop: `1px solid ${T.border}`,
          background: `${T.card}40`,
          backdropFilter: 'blur(24px)',
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={canSend ? "Écrivez votre message..." : "Limite atteinte"}
          disabled={isLoading || !canSend}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: '8px',
            border: `1px solid ${T.border}`,
            background: `${T.card}80`,
            color: T.text,
            fontSize: '0.875rem',
            outline: 'none',
            transition: 'all 0.2s',
            opacity: canSend ? 1 : 0.5,
            cursor: canSend ? 'text' : 'not-allowed',
          }}
          onFocus={(e) => {
            if (canSend) {
              (e.currentTarget as HTMLInputElement).style.borderColor = T.accent;
            }
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = T.border;
          }}
        />
        <button
          type={isLoading ? 'button' : 'submit'}
          onClick={isLoading ? handleStop : undefined}
          disabled={!isLoading && (!canSend || !inputValue.trim())}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            background: (!isLoading && (!canSend || !inputValue.trim()))
              ? `${T.textMuted}40`
              : isLoading
                ? '#ef4444'
                : `linear-gradient(135deg, ${T.accent} 0%, ${T.accentSoft} 100%)`,
            border: 'none',
            color: !isLoading && (!canSend || !inputValue.trim())
              ? T.textMuted
              : '#ffffff',
            cursor: (!isLoading && (!canSend || !inputValue.trim())) ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => {
            if (!isLoading && canSend && inputValue.trim()) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
        >
          {isLoading ? 'Stop' : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
