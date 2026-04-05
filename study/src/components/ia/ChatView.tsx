import { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../reutilisable/Themecontext';
import { fetchStream, detectLanguage } from '../../utils/api_ia';
import { getMessageCount, incrementMessageCount, canSendMessage, getRemainingMessages, getTimeUntilReset, MAX_MESSAGES_PER_DAY } from '../../utils/chatCounter';
import { Send, Lock } from 'lucide-react';

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

export default function ChatView({ text, subject, onMessagesSent }: ChatViewProps) {
  const { dark, T } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // Initialiser avec le premier message d'introduction
  useEffect(() => {
    setUserMessageCount(getMessageCount());
    if (messages.length === 0) {
      const intro: ChatMessage = {
        id: Date.now(),
        role: 'assistant',
        content: `Bonjour! Je suis votre assistant pour discuter de ${subject}. Vous avez ${MAX_MESSAGES_PER_DAY - getMessageCount()} messages disponibles aujourd'hui.`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([intro]);
    }
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

    // Vérifier la limite
    if (!canSendMessage()) {
      alert(`⏳ Limite atteinte! Vous avez utilisé vos ${MAX_MESSAGES_PER_DAY_CONST} messages. Réessayez dans ${getTimeUntilReset()}.`);
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
      (fullText) => {
        setIsLoading(false);
        // Finaliser le message
        setMessages(prev => prev.map(m =>
          m.id === assistantMessageId ? { ...m, content: fullText } : m
        ));
        onMessagesSent?.([userMessage, { ...assistantMessage, content: fullText }]);
      },
      (err) => {
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
  }, [inputValue, isLoading, text, subject, onMessagesSent]);

  const remainingMessages = getRemainingMessages();
  const canSend = canSendMessage();

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
                  background: 'transparent',
                  color: dark
                    ? '#ffffff'
                    : '#001f3f',
                  border: msg.role === 'user'
                    ? `2px solid ${T.accent}`
                    : '2px solid #f09dfd',
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
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '16px' }}>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: '3px',
                            height: '100%',
                            background: `linear-gradient(180deg, ${T.accent} 0%, ${T.accentSoft} 100%)`,
                            borderRadius: '2px',
                            animation: `wave 1.2s ease-in-out ${i * 0.1}s infinite`,
                          }}
                        />
                      ))}
                      <style>{`
                        @keyframes wave {
                          0%, 100% { height: 4px; opacity: 0.5; }
                          50% { height: 14px; opacity: 1; }
                        }
                      `}</style>
                    </div>
                    <span style={{ fontSize: '1rem', fontStyle: 'italic' }}>Professeur réfléchit...</span>
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
            background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentSoft} 100%)`,
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
            {remainingMessages <= 5 && '⚠️ '}{remainingMessages <= 5 ? 'Bientôt limité' : 'Dans les limites'}
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
          type="submit"
          disabled={isLoading || !canSend || !inputValue.trim()}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            background: (isLoading || !canSend || !inputValue.trim())
              ? `${T.textMuted}40`
              : `linear-gradient(135deg, ${T.accent} 0%, ${T.accentSoft} 100%)`,
            border: 'none',
            color: (isLoading || !canSend || !inputValue.trim())
              ? T.textMuted
              : dark ? '#0b2a4a' : '#ffffff',
            cursor: (isLoading || !canSend || !inputValue.trim()) ? 'not-allowed' : 'pointer',
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
          {isLoading ? '...' : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
