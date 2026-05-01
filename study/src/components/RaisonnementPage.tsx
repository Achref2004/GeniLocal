import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
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
  getDefaultConfig,
  type AvatarConfig,
} from '../utils/avatarConfig';
import { Plus, Paperclip, Home, FileText, CheckSquare2, HelpCircle, TrendingUp, Upload, Loader, Eye, EyeOff, X, Check } from 'lucide-react';
import { useIaTaskContext } from '../context/IaTaskContext';
import { incrementImportedDocuments } from '../utils/documentCounter';

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

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { tasks, startStreamTask, cancelTask: cancelGlobalTask } = useIaTaskContext();
  const [activeTaskIds, setActiveTaskIds] = useState<Record<string, string>>({});

  useEffect(() => {
    const syncState = (tid: string | undefined, setContent: (c: string) => void, setStreaming: (s: boolean) => void) => {
      if (tid && tasks[tid]) {
        if (tasks[tid].content || tasks[tid].status === 'completed') setContent(tasks[tid].content);
        setStreaming(tasks[tid].status === 'streaming');
      }
    };
    syncState(activeTaskIds['resume'], setStreamContent, setIsStreaming);
    syncState(activeTaskIds['qcm'], setRawQcmContent, setIsStreaming);
    syncState(activeTaskIds['qr_question'], setQrQuestion, setIsStreamingQuestion);
    syncState(activeTaskIds['qr_correct'], setQrCorrection, setIsStreamingCorrection);
    syncState(activeTaskIds['qcm_remedial'], setRawRemedialContent, setIsStreaming);
  }, [tasks, activeTaskIds]);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(getDefaultConfig());

  useEffect(() => {
    const reload = () => loadHistory().then(setHistory);
    reload();
    loadAvatarConfig().then(setAvatarConfig);
    
    const handleHistoryUpdate = () => setTimeout(reload, 100);
    window.addEventListener('ia-history-updated', handleHistoryUpdate);
    return () => window.removeEventListener('ia-history-updated', handleHistoryUpdate);
  }, []);
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);

  const controllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload state
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [showOcrReview, setShowOcrReview] = useState(false);
  const [ocrCleanedText, setOcrCleanedText] = useState('');
  const [ocrRawText, setOcrRawText] = useState('');
  const [ocrFilename, setOcrFilename] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [ocrError, setOcrError] = useState('');

  // Extraire les matières uniques de l'historique
  const existingSubjects = useMemo(() => {
    const subjects = Array.from(new Set(history.map(item => item.subject).filter((s): s is string => Boolean(s))));
    return subjects;
  }, [history]);

  const cancelStream = useCallback(() => {
    Object.values(activeTaskIds).forEach(tid => {
        if (tid) cancelGlobalTask(tid);
    });
    setActiveTaskIds({});
    setIsStreaming(false);
    setIsStreamingQuestion(false);
    setIsStreamingCorrection(false);
  }, [activeTaskIds, cancelGlobalTask]);

  const resetResults = useCallback(() => {
    cancelStream();
    setStreamContent('');
    setRawQcmContent('');
    setRawRemedialContent('');
    setQrQuestion('');
    setQrCorrection('');
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
    const tid = startStreamTask('resume', text, subject, detectLanguage(text));
    setActiveTaskIds(prev => ({ ...prev, resume: tid }));
  }, [text, subject, resetResults, startStreamTask]);

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
    const tid = startStreamTask('qcm', text, subject, detectLanguage(text));
    setActiveTaskIds(prev => ({ ...prev, qcm: tid }));
  }, [text, subject, resetResults, startStreamTask]);

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
    const tid = startStreamTask('qr_question', text, subject, detectLanguage(text));
    setActiveTaskIds(prev => ({ ...prev, qr_question: tid }));
  }, [text, subject, resetResults, startStreamTask]);

  const handleQrAnswer = useCallback((userAnswer: string) => {
    const tid = startStreamTask('qr_correct', text, subject, detectLanguage(text), qrQuestion);
    setActiveTaskIds(prev => ({ ...prev, qr_correct: tid }));
  }, [text, subject, qrQuestion, startStreamTask]);

  const handleRemediaq = useCallback((wrongQuestions: any[], wrongIndexes: number[]) => {
    const topics = wrongQuestions
      .map((q, idx) => `${idx + 1}. ${q.question}`)
      .join('\n');
    setRemedialWrongTopics(topics);
    setActiveMode('qcm_remedial');
    const tid = startStreamTask('qcm_remedial', text, subject || 'Remedial', detectLanguage(text), topics);
    setActiveTaskIds(prev => ({ ...prev, qcm_remedial: tid }));
  }, [text, subject, startStreamTask]);

  const handleHistorySelect = useCallback(async (item: HistoryItem) => {
    setText(item.text || '');
    if (item.subject) setSubject(item.subject);

    // Check if item has a valid mode and result to display
    // Important: Always display if mode is recognized (not just if result exists, as empty string is falsy)
    const validModes = ['resume', 'qcm', 'qcm_remedial', 'qr', 'chat', 'qr_question'];
    if (validModes.includes(item.mode) && (item.result !== undefined && item.result !== null)) {
      resetResults();
      if (item.mode === 'resume') {
        setActiveMode('resume');
        setStreamContent(item.result);
      } else if (item.mode === 'qcm') {
        setActiveMode('qcm');
        setRawQcmContent(item.result);
      } else if (item.mode === 'qcm_remedial') {
        setActiveMode('qcm_remedial');
        setRawRemedialContent(item.result);
      } else if (item.mode === 'qr' || item.mode === 'chat' || item.mode === 'qr_question') {
        setActiveMode('qr');
        if (item.mode === 'qr_question') {
          setQrQuestion(item.result || item.question || '');
        } else {
          if (item.question) setQrQuestion(item.question);
          if (item.correction) setQrCorrection(item.correction);
        }
      }
    }
  }, [resetResults]);

  const handleClearHistory = useCallback(async () => {
    const updated = await clearHistory();
    setHistory(updated);
  }, []);

  const handleAvatarSave = useCallback(async (newConfig: AvatarConfig) => {
    setAvatarConfig(newConfig);
    await saveAvatarConfig(newConfig);
    setShowAvatarCreator(false);
  }, []);

  const isAnyStreaming = isStreaming || isStreamingQuestion || isStreamingCorrection;

  // ─── File Upload Handler ──────────────────────────────

  const handleFileAttach = useCallback(async (file: File) => {
    setIsExtractingFile(true);
    setExtractProgress(0);
    setOcrError('');
    setOcrCleanedText('');
    setOcrRawText('');
    setOcrFilename(file.name);

    const formData = new FormData();
    formData.append('file', file);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setExtractProgress(p => {
        if (p >= 85) { clearInterval(progressInterval); return 85; }
        return p + Math.random() * 12;
      });
    }, 400);

    try {
      const resp = await fetch('http://localhost:8000/api/ocr/extract-text', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setExtractProgress(100);

      if (resp.ok) {
        const data = await resp.json();
        if (data.error) {
          setOcrError(data.error);
        } else {
          setOcrCleanedText(data.cleaned_text || data.raw_text || '');
          setOcrRawText(data.raw_text || '');
          setShowOcrReview(true);
        }
      } else {
        setOcrError('Le serveur OCR n\'est pas disponible. Vérifiez que le backend tourne.');
      }
    } catch {
      setOcrError('Impossible de contacter le serveur. Vérifiez que le backend est lancé sur le port 8000.');
    } finally {
      setIsExtractingFile(false);
      clearInterval(progressInterval);
    }
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileAttach(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  }, [handleFileAttach]);

  const confirmOcrText = useCallback(() => {
    setText(ocrCleanedText);
    setShowOcrReview(false);
    // Incrémenter le compteur global de documents importés
    incrementImportedDocuments(1);
  }, [ocrCleanedText]);

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
          {(() => {
            // Group history by date
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const groups: { label: string; items: typeof history }[] = [];
            const todayItems = history.filter(item => item.timestamp?.startsWith(todayStr));
            const yesterdayItems = history.filter(item => item.timestamp?.startsWith(yesterdayStr));
            const olderItems = history.filter(item => {
              if (!item.timestamp) return true;
              return !item.timestamp.startsWith(todayStr) && !item.timestamp.startsWith(yesterdayStr);
            });

            if (todayItems.length > 0) groups.push({ label: "Aujourd'hui", items: todayItems });
            if (yesterdayItems.length > 0) groups.push({ label: 'Hier', items: yesterdayItems });
            if (olderItems.length > 0) groups.push({ label: 'Plus ancien', items: olderItems });

            if (groups.length === 0) {
              return (
                <p style={{ fontSize: '0.8rem', color: T.textMuted, textAlign: 'center', padding: '20px 0' }}>
                  Aucun historique
                </p>
              );
            }

            return groups.map((group, gi) => (
              <div key={gi} style={{ marginBottom: 16 }}>
                <h3 style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: T.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 10,
                  paddingLeft: 8,
                }}>{group.label}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {group.items.map((item, idx) => {
                    const modeLabels: Record<string, string> = { resume: 'Résumé', qcm: 'QCM', qr: 'Q/R', qcm_remedial: 'Rattrapage' };
                    const label = modeLabels[item.mode] || item.mode;
                    const preview = item.subject || (item.text ? item.text.substring(0, 40) + '...' : '');

                    return (
                      <button
                        key={item.id || idx}
                        onClick={() => handleHistorySelect(item)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 12px',
                          borderRadius: 8,
                          fontSize: '0.8rem',
                          color: T.textOnCard,
                          background: 'transparent',
                          border: `1px solid ${T.border}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          overflow: 'hidden',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}10`;
                          (e.currentTarget as HTMLButtonElement).style.borderColor = T.accent;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = T.border;
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.78rem', marginBottom: 2 }}>{label}</div>
                        {preview && (
                          <div style={{ fontSize: '0.7rem', color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {preview}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ));
          })()}

          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '8px 12px',
                fontSize: '0.75rem',
                color: T.textMuted,
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
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
              background: `${T.accent}20`,
              border: `2px solid ${T.accent}`,
              color: T.accent,
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
                    onStop={cancelStream}
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
                        Questions de rattrapage adaptées
                      </h3>
                      <p style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                        Ces questions vous aideront à mieux comprendre les sujets problématiques.
                      </p>
                    </div>
                    <QcmView
                      rawContent={rawRemedialContent}
                      isStreaming={isStreaming}
                      maxQuestions={3}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.docx,.doc,.bmp,.tiff,.webp"
                        style={{ display: 'none' }}
                        onChange={handleFileInputChange}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isExtractingFile}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '12px 24px',
                          borderRadius: 12,
                          background: `${T.accent}10`,
                          border: `1px solid ${T.border}`,
                          color: T.accent,
                          fontWeight: 500,
                          cursor: isExtractingFile ? 'wait' : 'pointer',
                          transition: 'all 0.3s',
                          opacity: isExtractingFile ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!isExtractingFile) {
                            (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}20`;
                            (e.currentTarget as HTMLButtonElement).style.borderColor = T.accent;
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}10`;
                          (e.currentTarget as HTMLButtonElement).style.borderColor = T.border;
                        }}
                      >
                        {isExtractingFile ? (
                          <>
                            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>Extraction... {Math.round(extractProgress)}%</span>
                          </>
                        ) : (
                          <>
                            <Paperclip size={18} style={{ transition: 'transform 0.3s' }} />
                            <span>Joindre un fichier</span>
                          </>
                        )}
                      </button>
                      
                      <p>Seuls les fichiers en français et anglais sont acceptés. Pour l'arabe, veuillez utiliser le copier-coller le temps que nous finalisions la prise en charge.</p>      
                          
                      {/* Error message */}
                      {ocrError && (
                        <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>
                          Erreur: {ocrError}
                        </span>
                      )}
                    </div>
                    
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

      {/* OCR Text Review Modal */}
      {showOcrReview && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(16px)',
        }}
          onClick={() => setShowOcrReview(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: `linear-gradient(135deg, ${T.card} 0%, ${T.card}80 100%)`,
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              width: 680,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: `1px solid ${T.border}`,
              background: `${T.accent}08`,
              flexShrink: 0,
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: T.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={20} color={T.accent} />
                  Texte extrait du document
                </h3>
                <p style={{ fontSize: '0.7rem', color: T.textMuted, margin: '4px 0 0' }}>
                  {ocrFilename} — Vérifiez et modifiez le texte avant de continuer
                </p>
              </div>
              <button onClick={() => setShowOcrReview(false)} style={{
                width: 32, height: 32, borderRadius: 8,
                background: `${T.border}`, border: 'none',
                color: T.text, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.border; e.currentTarget.style.color = T.text; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Toggle raw/cleaned */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 24px',
              borderBottom: `1px solid ${T.border}`,
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: ocrCleanedText !== ocrRawText ? '#10b981' : '#f59e0b',
                }} />
                <span style={{ fontSize: '0.75rem', color: T.textMuted, fontWeight: 600 }}>
                  {ocrCleanedText !== ocrRawText
                    ? 'Texte corrigé par l\'IA — Vous pouvez le modifier'
                    : 'Texte brut (IA non disponible) — Vous pouvez le modifier'
                  }
                </span>
              </div>
              {ocrCleanedText !== ocrRawText && (
                <button
                  onClick={() => setShowRawText(!showRawText)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 6,
                    background: 'transparent', border: `1px solid ${T.border}`,
                    color: T.textMuted, fontSize: '0.65rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
                >
                  {showRawText ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showRawText ? 'Voir corrigé' : 'Voir brut'}
                </button>
              )}
            </div>

            {/* Text area */}
            <div style={{ flex: 1, overflow: 'hidden', padding: '16px 24px' }}>
              {showRawText ? (
                <div style={{
                  width: '100%', height: '100%',
                  padding: '14px',
                  borderRadius: 12, border: `1px solid ${T.border}`,
                  background: `${T.card}60`,
                  color: T.textMuted,
                  fontSize: '0.8rem', lineHeight: 1.7,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap', fontFamily: 'monospace',
                  boxSizing: 'border-box',
                  maxHeight: 'calc(85vh - 260px)',
                }}>
                  {ocrRawText}
                </div>
              ) : (
                <textarea
                  value={ocrCleanedText}
                  onChange={e => setOcrCleanedText(e.target.value)}
                  style={{
                    width: '100%', height: '100%',
                    minHeight: 'calc(85vh - 280px)',
                    padding: '14px',
                    borderRadius: 12, border: `1px solid ${T.border}`,
                    background: `${T.card}60`,
                    color: T.text,
                    fontSize: '0.85rem', lineHeight: 1.7,
                    resize: 'none', outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.3s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
                  onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                />
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '0.7rem', color: T.textMuted }}>
                {ocrCleanedText.length} caractères
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowOcrReview(false)}
                  style={{
                    padding: '10px 20px', borderRadius: 10,
                    background: 'transparent', border: `1px solid ${T.border}`,
                    color: T.textMuted, fontSize: '0.8rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.text; e.currentTarget.style.color = T.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
                >
                  Annuler
                </button>
                <button
                  onClick={confirmOcrText}
                  disabled={!ocrCleanedText.trim()}
                  style={{
                    padding: '10px 24px', borderRadius: 10,
                    background: ocrCleanedText.trim()
                      ? `linear-gradient(135deg, ${T.accent}, ${T.accentSoft})`
                      : T.border,
                    color: ocrCleanedText.trim() ? (dark ? '#0b2a4a' : '#fff') : T.textMuted,
                    fontSize: '0.8rem', fontWeight: 800,
                    border: 'none',
                    cursor: ocrCleanedText.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s',
                    boxShadow: ocrCleanedText.trim() ? `0 6px 20px ${T.accent}40` : 'none',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={e => { if (ocrCleanedText.trim()) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <Check size={16} />
                  Utiliser ce texte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
