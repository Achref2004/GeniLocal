import { useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../reutilisable/Themecontext';
import ResumeView from './ia/ResumeView';
import QcmView from './ia/QcmView';
import QrView from './ia/QrView';
import HistoryPanel from './ia/HistoryPanel';
import AvatarCreator from './ia/AvatarCreator';
import AvatarCanvas from './ia/AvatarCanvas';
import {
  fetchStream,
  detectLanguage,
  loadHistory,
  saveToHistory,
  clearHistory,
  type HistoryItem,
} from '../utils/api_ia';
import {
  loadAvatarConfig,
  saveAvatarConfig,
  type AvatarConfig,
} from '../utils/avatarConfig';
import { Plus, Paperclip, Home, FileText, CheckSquare2, HelpCircle, TrendingUp } from 'lucide-react';

// SVG Icons for action cards
const ResumeIcon = () => (
  <FileText size={64} strokeWidth={1.5} color="currentColor" />
);

const QCMIcon = () => (
  <CheckSquare2 size={64} strokeWidth={1.5} color="currentColor" />
);

const QRIcon = () => (
  <HelpCircle size={64} strokeWidth={1.5} color="currentColor" />
);

export default function RaisonnementPage() {
  const navigate = useNavigate();
  const { dark, T } = useTheme();

  const [text, setText] = useState('');
  const [subject, setSubject] = useState('');
  const [showSubjectPrompt, setShowSubjectPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | 'resume' | 'qcm' | 'qr'>(null);

  const [activeMode, setActiveMode] = useState<null | 'resume' | 'qcm' | 'qr' | 'qcm_remedial'>(null);
  const [streamContent, setStreamContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [rawQcmContent, setRawQcmContent] = useState('');
  const [rawRemedialContent, setRawRemedialContent] = useState('');

  const [qrQuestion, setQrQuestion] = useState('');
  const [qrCorrection, setQrCorrection] = useState('');
  const [isStreamingQuestion, setIsStreamingQuestion] = useState(false);
  const [isStreamingCorrection, setIsStreamingCorrection] = useState(false);
  const [remedialWrongTopics, setRemedialWrongTopics] = useState('');

  const [history, setHistory] = useState<HistoryItem[]>(loadHistory());
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(loadAvatarConfig());
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);

  const controllerRef = useRef<AbortController | null>(null);

  // Extraire les matières uniques de l'historique
  const existingSubjects = useMemo(() => {
    const subjects = Array.from(new Set(history.map(item => item.subject).filter((s): s is string => Boolean(s))));
    return subjects;
  }, [history]);

  const cancelStream = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  const resetResults = useCallback(() => {
    cancelStream();
    setStreamContent('');
    setRawQcmContent('');
    setRawRemedialContent('');
    setIsStreaming(false);
    setQrQuestion('');
    setQrCorrection('');
    setIsStreamingQuestion(false);
    setIsStreamingCorrection(false);
  }, [cancelStream]);

  const handleResume = useCallback(() => {
    if (!text.trim()) return;
    setPendingAction('resume');
    setShowSubjectPrompt(true);
  }, [text]);

  const confirmResume = useCallback(() => {
    if (!subject.trim()) return;
    setShowSubjectPrompt(false);
    setPendingAction(null);
    resetResults();
    setActiveMode('resume');
    setIsStreaming(true);

    controllerRef.current = fetchStream(
      { mode: 'resume', text, subject, language: detectLanguage(text) },
      (_token, fullText) => setStreamContent(fullText),
      (fullText) => {
        setIsStreaming(false);
        setStreamContent(fullText);
        const newHistory = saveToHistory({ mode: 'resume', text: text.substring(0, 200), subject, result: fullText });
        setHistory(newHistory);
      },
      (err) => {
        setIsStreaming(false);
        setStreamContent('❌ Erreur: ' + err.message);
      }
    );
  }, [text, subject, resetResults]);

  const handleQcm = useCallback(() => {
    if (!text.trim()) return;
    setPendingAction('qcm');
    setShowSubjectPrompt(true);
  }, [text]);

  const confirmQcm = useCallback(() => {
    if (!subject.trim()) return;
    setShowSubjectPrompt(false);
    setPendingAction(null);
    resetResults();
    setActiveMode('qcm');
    setIsStreaming(true);

    controllerRef.current = fetchStream(
      { mode: 'qcm', text, subject, language: detectLanguage(text) },
      (_token, fullText) => setRawQcmContent(fullText),
      (fullText) => {
        setIsStreaming(false);
        setRawQcmContent(fullText);
        const newHistory = saveToHistory({ mode: 'qcm', text: text.substring(0, 200), subject, result: fullText });
        setHistory(newHistory);
      },
      (err) => {
        setIsStreaming(false);
        setRawQcmContent('❌ Erreur: ' + err.message);
      }
    );
  }, [text, subject, resetResults]);

  const handleQr = useCallback(() => {
    if (!text.trim()) return;
    setPendingAction('qr');
    setShowSubjectPrompt(true);
  }, [text]);

  const confirmQr = useCallback(() => {
    if (!subject.trim()) return;
    setShowSubjectPrompt(false);
    setPendingAction(null);
    resetResults();
    setActiveMode('qr');
    setIsStreamingQuestion(true);

    controllerRef.current = fetchStream(
      { mode: 'qr_question', text, subject },
      (_token, fullText) => setQrQuestion(fullText),
      (fullText) => {
        setIsStreamingQuestion(false);
        setQrQuestion(fullText);
      },
      (err) => {
        setIsStreamingQuestion(false);
        setQrQuestion('❌ Erreur: ' + err.message);
      }
    );
  }, [text, subject, resetResults]);

  const handleQrAnswer = useCallback((userAnswer: string) => {
    setIsStreamingCorrection(true);
    controllerRef.current = fetchStream(
      { mode: 'qr_correct', text, user_answer: userAnswer },
      (_token, fullText) => setQrCorrection(fullText),
      (fullText) => {
        setIsStreamingCorrection(false);
        setQrCorrection(fullText);
        const newHistory = saveToHistory({
          mode: 'qr',
          text: text.substring(0, 200),
          question: qrQuestion,
          userAnswer,
          correction: fullText,
        });
        setHistory(newHistory);
      },
      (err) => {
        setIsStreamingCorrection(false);
        setQrCorrection('❌ Erreur: ' + err.message);
      }
    );
  }, [text, qrQuestion]);

  const handleRemediaq = useCallback((wrongQuestions: any[], wrongIndexes: number[]) => {
    // Créer une description des sujets des questions incorrectes
    const topics = wrongQuestions.map(q => q.question).join(' | ');
    setRemedialWrongTopics(topics);
    setActiveMode('qcm_remedial');
    setIsStreaming(true);

    controllerRef.current = fetchStream(
      { mode: 'qcm_remedial', text, wrongTopics: topics, language: detectLanguage(text) },
      (_token, fullText) => setRawRemedialContent(fullText),
      (fullText) => {
        setIsStreaming(false);
        setRawRemedialContent(fullText);
        const newHistory = saveToHistory({
          mode: 'qcm_remedial',
          text: text.substring(0, 200),
          result: fullText
        });
        setHistory(newHistory);
      },
      (err) => {
        setIsStreaming(false);
        setRawRemedialContent('❌ Erreur: ' + err.message);
      }
    );
  }, [text]);

  const handleHistorySelect = useCallback((item: HistoryItem) => {
    setText(item.text || '');
    if (item.subject) setSubject(item.subject);
  }, []);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  const handleAvatarSave = useCallback((newConfig: AvatarConfig) => {
    setAvatarConfig(newConfig);
    saveAvatarConfig(newConfig);
    setShowAvatarCreator(false);
  }, []);

  const isAnyStreaming = isStreaming || isStreamingQuestion || isStreamingCorrection;

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: T.bg,
    }}>
      {/* Background orbs */}
      <div className="ia-orb ia-orb-blue" />
      <div className="ia-orb ia-orb-purple" />

      {/* SIDEBAR - LEFT */}
      <aside style={{
        width: 288,
        flexShrink: 0,
        background: T.sidebarBg,
        border: `1px solid ${T.sidebarBorder}`,
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(24px)',
      }}>

        {/* New Conversation Button */}
        <div style={{ padding: '24px 24px 16px' }}>
          <button
            onClick={() => { setText(''); setActiveMode(null); }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '14px 20px',
              background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentSoft} 100%)`,
              color: dark ? '#0b2a4a' : '#ffffff',
              fontWeight: 'bold',
              fontSize: 14,
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              boxShadow: `0 6px 20px ${T.accent}50`,
              transition: 'all 0.3s',
              transform: 'scale(1)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            <Plus size={22} strokeWidth={3} />
            <span>Nouvelle conversation</span>
          </button>
        </div>

        {/* Divider */}
        <div style={{ padding: '16px 16px 0', marginBottom: 12 }}>
          <div style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${T.border}, transparent)`,
          }}></div>
        </div>

        {/* History section */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 16px 16px',
        }}>
          <h3 style={{
            fontSize: '0.75rem',
            fontWeight: 'bold',
            color: T.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 16,
            paddingLeft: 8,
          }}>Aujourd'hui</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.slice(0, 5).map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleHistorySelect(item)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  color: T.textOnCard,
                  background: 'transparent',
                  border: `1px solid ${T.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}10`;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = T.accent;
                  (e.currentTarget as HTMLButtonElement).style.color = T.accent;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = T.border;
                  (e.currentTarget as HTMLButtonElement).style.color = T.textOnCard;
                }}
              >
                <span style={{ color: T.accent, fontWeight: 'bold' }}>#{idx + 1}</span> {item.mode}...
              </button>
            ))}
          </div>

          {history.length > 5 && (
            <button
              onClick={handleClearHistory}
              style={{
                width: '100%',
                marginTop: 24,
                padding: '8px 12px',
                fontSize: '0.75rem',
                color: T.textMuted,
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = T.accent; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = T.textMuted; }}
            >
              Effacer l'historique
            </button>
          )}
        </div>

        {/* Avatar section */}
        <div style={{
          padding: 16,
          borderTop: `1px solid ${T.border}`,
        }}>
          <button
            onClick={() => setShowAvatarCreator(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}10`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `2px solid ${T.accent}`,
              flexShrink: 0,
            }}>
              <AvatarCanvas config={avatarConfig} size={40} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, textAlign: 'left' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text }}>Mon Avatar</p>
              <p style={{ fontSize: '0.75rem', color: T.textMuted }}>Personnaliser</p>
            </div>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Buttons - Top Right */}
        <div style={{
          position: 'absolute',
          top: 24,
          right: 24,
          zIndex: 50,
          display: 'flex',
          gap: 12,
        }}>
          <button
            onClick={() => navigate('/progression')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `${T.accentSoft}20`,
              border: `2px solid ${T.accentSoft}`,
              color: T.accentSoft,
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = `${T.accentSoft}40`;
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = `${T.accentSoft}20`;
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
            title="Voir la progression"
          >
            <TrendingUp size={24} strokeWidth={2} />
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `${T.accent}20`,
              border: `2px solid ${T.accent}`,
              color: T.accent,
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}40`;
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}20`;
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
            title="Retour à l'accueil"
          >
            <Home size={24} strokeWidth={2} />
          </button>
        </div>

        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: activeMode ? 0 : 48,
          display: 'flex',
          flexDirection: 'column',
        }}>

          {/* Results area - show when active mode */}
          {activeMode ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', minHeight: '100%' }}>
              {activeMode === 'resume' && (
                <div style={{ width: '100%', padding: '48px', margin: '0 auto' }}>
                  <ResumeView
                    content={streamContent}
                    isStreaming={isStreaming}
                    subject={subject}
                    avatarConfig={avatarConfig}
                  />
                </div>
              )}
              {activeMode === 'qcm' && (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px', minHeight: '100%' }}>
                  <QcmView
                    rawContent={rawQcmContent}
                    isStreaming={isStreaming}
                    onRemedialClick={handleRemediaq}
                  />
                </div>
              )}
              {activeMode === 'qcm_remedial' && (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px', minHeight: '100%' }}>
                  <div style={{ width: '100%', maxWidth: '900px' }}>
                    <div style={{
                      background: 'rgba(168, 85, 247, 0.1)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '20px',
                      backdropFilter: 'blur(32px)',
                    }}>
                      <h3 style={{ color: '#a855f7', fontWeight: 'bold', marginBottom: '8px' }}>
                        🎯 Questions de rattrapage adaptées
                      </h3>
                      <p style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                        Ces questions vous aideront à mieux comprendre les sujets problématiques.
                      </p>
                    </div>
                    <QcmView
                      rawContent={rawRemedialContent}
                      isStreaming={isStreaming}
                    />
                  </div>
                </div>
              )}
              {activeMode === 'qr' && (
                <div style={{ width: '100%', padding: '48px', margin: '0 auto' }}>
                  <QrView
                    text={text}
                    subject={subject}
                    questionContent={qrQuestion}
                    isStreamingQuestion={isStreamingQuestion}
                    correctionContent={qrCorrection}
                    isStreamingCorrection={isStreamingCorrection}
                    onSubmitAnswer={handleQrAnswer}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Input Section */}
              <div style={{ width: '100%', maxWidth: 1024, margin: '0 auto 40px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{
                  background: `linear-gradient(135deg, ${T.card}80 0%, ${T.card}60 100%)`,
                  border: `1px solid ${T.border}`,
                  borderRadius: 24,
                  padding: 40,
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  boxShadow: `0 8px 32px rgba(0, 0, 0, 0.1)`,
                  backdropFilter: 'blur(32px)',
                }}>

                  <div style={{ marginBottom: 24 }}>
                    <h1 style={{
                      fontSize: '2.25rem',
                      fontWeight: 900,
                      background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentSoft} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      marginBottom: 12,
                    }}>Que puis-je faire pour vous ?</h1>
                    <p style={{ fontSize: '1rem', color: T.textMuted }}>Écrivez, collez ou glissez voir ce qui vous préoccupe</p>
                  </div>

                  <textarea
                    id="ia-main-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Tapez vos questions, collez vos cours, explorez vos idées..."
                    style={{
                      flex: 1,
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: T.text,
                      fontSize: '1rem',
                      lineHeight: '1.625',
                      outline: 'none',
                      resize: 'none',
                    } as any}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.border}` }}>
                    <button style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 24px',
                      borderRadius: 12,
                      background: `${T.accent}10`,
                      border: `1px solid ${T.border}`,
                      color: T.accent,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}20`;
                      (e.currentTarget as HTMLButtonElement).style.borderColor = T.accent;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}10`;
                      (e.currentTarget as HTMLButtonElement).style.borderColor = T.border;
                    }}
                    >
                      <Paperclip size={18} style={{ transition: 'transform 0.3s' }} onMouseEnter={(e) => { (e.currentTarget as any).style.transform = 'rotate(12deg)'; }} onMouseLeave={(e) => { (e.currentTarget as any).style.transform = 'rotate(0deg)'; }} />
                      <span>Joindre un fichier</span>
                    </button>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: T.textMuted }}>
                      {text.length > 0 ? `${text.length} caractères` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Cards Section */}
              <div style={{ width: '100%' }}>
                <p style={{ color: T.textMuted, fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 32, paddingLeft: 32 }}>Choisissez une action</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, maxWidth: 1280, margin: '0 auto' }}>

                  {/* Résumé Card */}
                  <button
                    onClick={handleResume}
                    disabled={!text.trim() || isAnyStreaming}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: 32,
                      borderRadius: 16,
                      background: `linear-gradient(135deg, ${T.card}80 0%, ${T.card}60 100%)`,
                      border: `1px solid ${T.border}`,
                      color: T.text,
                      cursor: (!text.trim() || isAnyStreaming) ? 'not-allowed' : 'pointer',
                      opacity: (!text.trim() || isAnyStreaming) ? 0.5 : 1,
                      transition: 'all 0.3s',
                      backdropFilter: 'blur(32px)',
                    }}
                    onMouseEnter={(e) => {
                      if (!text.trim() || isAnyStreaming) return;
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-12px)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 32px ${T.accent}30`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ marginBottom: 24, color: T.accent }}>
                      <ResumeIcon />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: 12, color: T.accent }}>Résumé</h3>
                    <p style={{ fontSize: '0.875rem', color: T.textMuted, marginBottom: 24, lineHeight: 1.5, textAlign: 'center' }}>Générez un résumé structuré et concis</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.accent, fontWeight: 600, fontSize: '0.875rem' }}>
                      <span>Créer maintenant</span>
                      <span style={{ transition: 'transform 0.3s' }}>→</span>
                    </div>
                  </button>

                  {/* QCM Card */}
                  <button
                    onClick={handleQcm}
                    disabled={!text.trim() || isAnyStreaming}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: 32,
                      borderRadius: 16,
                      background: `linear-gradient(135deg, ${T.card}80 0%, ${T.card}60 100%)`,
                      border: `1px solid ${T.border}`,
                      color: T.text,
                      cursor: (!text.trim() || isAnyStreaming) ? 'not-allowed' : 'pointer',
                      opacity: (!text.trim() || isAnyStreaming) ? 0.5 : 1,
                      transition: 'all 0.3s',
                      backdropFilter: 'blur(32px)',
                    }}
                    onMouseEnter={(e) => {
                      if (!text.trim() || isAnyStreaming) return;
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-12px)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 32px rgba(6, 187, 42, 0.42)`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ marginBottom: 24,  color: '#00830d'}}>
                      <QCMIcon />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: 12,  color: '#48ec58' }}>QCM</h3>
                    <p style={{ fontSize: '0.875rem', color: T.textMuted, marginBottom: 24, lineHeight: 1.5, textAlign: 'center' }}>Créez un questionnaire interactif</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8,  color: '#09b640', fontWeight: 600, fontSize: '0.875rem' }}>
                      <span>Générer</span>
                      <span style={{ transition: 'transform 0.3s' }}>→</span>
                    </div>
                  </button>

                  {/* Q/R Card */}
                  <button
                    onClick={handleQr}
                    disabled={!text.trim() || isAnyStreaming}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: 32,
                      borderRadius: 16,
                      background: `linear-gradient(135deg, ${T.card}80 0%, ${T.card}60 100%)`,
                      border: `1px solid ${T.border}`,
                      color: T.text,
                      cursor: (!text.trim() || isAnyStreaming) ? 'not-allowed' : 'pointer',
                      opacity: (!text.trim() || isAnyStreaming) ? 0.5 : 1,
                      transition: 'all 0.3s',
                      backdropFilter: 'blur(32px)',
                    }}
                    onMouseEnter={(e) => {
                      if (!text.trim() || isAnyStreaming) return;
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-12px)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 32px rgba(236, 72, 153, 0.3)`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ marginBottom: 24, color: '#EC4899' }}>
                      <QRIcon />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: 12, color: '#EC4899' }}>Q/R</h3>
                    <p style={{ fontSize: '0.875rem', color: T.textMuted, marginBottom: 24, lineHeight: 1.5, textAlign: 'center' }}>Posez et répondez à des questions</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#EC4899', fontWeight: 600, fontSize: '0.875rem' }}>
                      <span>Commencer</span>
                      <span style={{ transition: 'transform 0.3s' }}>→</span>
                    </div>
                  </button>

                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Subject Selection Modal */}
      {showSubjectPrompt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(16px)',
        }}>
          <div style={{
            background: `linear-gradient(135deg, ${T.card} 0%, ${T.card}80 100%)`,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: 32,
            maxWidth: 480,
            width: 'calc(100% - 32px)',
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: T.text, marginBottom: 8 }}>
               Sélectionnez ou créez une matière
            </h3>
            <p style={{ fontSize: '0.875rem', color: T.textMuted, marginBottom: 24 }}>
              Choisissez parmi vos matières existantes ou créez une nouvelle
            </p>

            {/* Matières existantes */}
            {existingSubjects.length > 0 && (
              <>
                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: T.accent, textTransform: 'uppercase', marginBottom: 12 }}>
                  Matières récentes
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '24px' }}>
                  {existingSubjects.map((subj, i) => (
                    <button
                      key={i}
                      onClick={() => setSubject(subj)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: subject === subj ? `${T.accent}40` : `${T.accent}10`,
                        border: `1px solid ${subject === subj ? T.accent : T.border}`,
                        color: subject === subj ? T.accent : T.text,
                        fontSize: '0.875rem',
                        fontWeight: subject === subj ? 'bold' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = T.accent;
                        (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}20`;
                      }}
                      onMouseLeave={(e) => {
                        if (subject !== subj) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = T.border;
                          (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}10`;
                        }
                      }}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Ou entrer une nouvelle matière */}
            <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: T.accent, textTransform: 'uppercase', marginBottom: '12px' }}>
              {existingSubjects.length > 0 ? 'Ou saisissez une nouvelle matière' : 'Saisissez le nom de la matière'}
            </p>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Mathématiques, Histoire, Biologie..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && subject.trim()) {
                  if (pendingAction === 'resume') confirmResume();
                  else if (pendingAction === 'qcm') confirmQcm();
                  else if (pendingAction === 'qr') confirmQr();
                }
              }}
              autoFocus
              style={{
                width: '100%',
                background: `${T.card}80`,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: 12,
                color: T.text,
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '24px',
              }}
            />

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setShowSubjectPrompt(false);
                  setPendingAction(null);
                  setSubject('');
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  color: T.text,
                  background: 'transparent',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = T.accent;
                  (e.currentTarget as HTMLButtonElement).style.color = T.accent;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = T.border;
                  (e.currentTarget as HTMLButtonElement).style.color = T.text;
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (pendingAction === 'resume') confirmResume();
                  else if (pendingAction === 'qcm') confirmQcm();
                  else if (pendingAction === 'qr') confirmQr();
                }}
                disabled={!subject.trim()}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentSoft} 100%)`,
                  color: dark ? '#0b2a4a' : '#ffffff',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: !subject.trim() ? 'not-allowed' : 'pointer',
                  opacity: !subject.trim() ? 0.5 : 1,
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  if (!subject.trim()) return;
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Creator Modal */}
      {showAvatarCreator && (
        <AvatarCreator
          config={avatarConfig}
          onSave={handleAvatarSave}
          onClose={() => setShowAvatarCreator(false)}
        />
      )}

      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      `}</style>
    </div>
  );
}
