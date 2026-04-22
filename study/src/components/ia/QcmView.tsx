import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../reutilisable/Themecontext';
import './qcm-loading.css';
import MemoryGame from './MemoryGame';

interface Question {
  question: string;
  choices: string[];
  correct: number;
}

interface QcmViewProps {
  rawContent: string;
  isStreaming: boolean;
  onRemedialClick?: (wrongQuestions: Question[], wrongIndexes: number[]) => void;
  /** Nombre max de questions affichées (5 pour QCM principal, 3 pour remédiation). */
  maxQuestions?: number;
}

function stripCodeFences(s: string): string {
  let t = s.trim();
  if (!t.startsWith('```')) return t;
  t = t.replace(/^```(?:json)?\s*/i, '');
  const fence = t.lastIndexOf('```');
  if (fence !== -1) t = t.slice(0, fence).trim();
  return t;
}

function normalizeCorrect(raw: unknown, numChoices: number): number {
  let c = 0;
  if (typeof raw === 'string') {
    const n = parseInt(raw.trim(), 10);
    if (Number.isFinite(n)) c = n;
  } else if (typeof raw === 'number' && !Number.isNaN(raw)) {
    c = Math.floor(raw);
  }
  if (numChoices <= 0) return 0;
  return Math.max(0, Math.min(numChoices - 1, c));
}

function validateQuestion(raw: unknown): Question | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const qText = o.question ?? o.Q ?? o.q;
  const choicesRaw = o.choices ?? o.options ?? o.reponses;
  if (typeof qText !== 'string' || !Array.isArray(choicesRaw) || choicesRaw.length < 2) return null;
  const choices = choicesRaw.map((c) => String(c));
  const correct = normalizeCorrect(o.correct, choices.length);
  return { question: qText, choices, correct };
}

function extractArrayCandidate(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (!parsed || typeof parsed !== 'object') return null;
  const o = parsed as Record<string, unknown>;
  for (const k of ['questions', 'qcm', 'items', 'data', 'quiz', 'responses']) {
    if (Array.isArray(o[k])) return o[k] as unknown[];
  }
  for (const key of Object.keys(o)) {
    const ks = key.trim();
    if (ks.startsWith('[')) {
      try {
        const inner = JSON.parse(ks);
        if (Array.isArray(inner)) return inner;
      } catch {
        try {
          const inner = JSON.parse(ks.replace(/,\s*([\]}])/g, '$1'));
          if (Array.isArray(inner)) return inner;
        } catch {
          /* ignore */
        }
      }
    }
  }
  for (const val of Object.values(o)) {
    if (typeof val === 'string') {
      const st = val.trim();
      if (st.startsWith('[')) {
        try {
          const inner = JSON.parse(st);
          if (Array.isArray(inner)) return inner;
        } catch {
          /* ignore */
        }
      }
    }
  }
  return null;
}

function tryParseBracketArrays(text: string): unknown[] | null {
  const start = text.indexOf('[');
  if (start === -1) return null;
  let pos = text.length;
  while ((pos = text.lastIndexOf(']', pos - 1)) > start) {
    const slice = text.slice(start, pos + 1);
    const cleaned = slice.replace(/,\s*([\]}])/g, '$1');
    try {
      const arr = JSON.parse(cleaned);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch {
      /* try next ] */
    }
  }
  return null;
}

function parseQuestionsFromRaw(raw: string, maxQuestions: number): Question[] | null {
  if (!raw?.trim()) return null;
  let text = stripCodeFences(raw.trim());

  const tryCoerce = (arr: unknown[] | null): Question[] | null => {
    if (!arr) return null;
    const out: Question[] = [];
    for (const item of arr) {
      const q = validateQuestion(item);
      if (q) out.push(q);
    }
    return out.length > 0 ? out.slice(0, maxQuestions) : null;
  };

  const attempts: unknown[] = [];
  try {
    attempts.push(JSON.parse(text));
  } catch {
    /* ignore */
  }
  if (attempts[0] !== undefined && typeof attempts[0] === 'string') {
    try {
      attempts.push(JSON.parse(attempts[0] as string));
    } catch {
      /* ignore */
    }
  }

  for (const parsed of attempts) {
    if (parsed === undefined || parsed === null) continue;
    const arr = extractArrayCandidate(parsed);
    const coerced = tryCoerce(arr);
    if (coerced) return coerced;
  }

  try {
    const arr = tryParseBracketArrays(text);
    const coerced = tryCoerce(arr);
    if (coerced) return coerced;
  } catch {
    /* ignore */
  }

  const fallbackQuestions: Question[] = [];
  const blocks = text.match(/\{[^{}]+\}/g);
  if (blocks) {
    for (const block of blocks) {
      try {
        // eslint-disable-next-line no-new-func
        const q = new Function(`return ${block}`)();
        const v = validateQuestion(q);
        if (v) fallbackQuestions.push(v);
      } catch {
        /* ignore */
      }
    }
  }
  if (fallbackQuestions.length > 0) return fallbackQuestions.slice(0, maxQuestions);

  return null;
}

export default function QcmView({ rawContent, isStreaming, onRemedialClick, maxQuestions = 5 }: QcmViewProps) {
  const { dark, T } = useTheme();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showScore, setShowScore] = useState(false);
  const [showRemedialOffer, setShowRemedialOffer] = useState(false);

  const questions = useMemo((): Question[] | null => {
    return parseQuestionsFromRaw(rawContent, maxQuestions);
  }, [rawContent, maxQuestions]);

  const totalQuestions = questions?.length ?? 0;

  useEffect(() => {
    setAnswers({});
    setShowScore(false);
    setShowRemedialOffer(false);
  }, [rawContent]);

  const handleAnswer = (qIndex: number, choiceIndex: number) => {
    if (answers[qIndex] !== undefined) return;
    setAnswers(prev => ({ ...prev, [qIndex]: choiceIndex }));
    const newAnswers = { ...answers, [qIndex]: choiceIndex };
    if (questions && Object.keys(newAnswers).length === questions.length) {
      setTimeout(() => setShowScore(true), 600);
    }
  };

  const score = useMemo(() => {
    if (!questions) return 0;
    return questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0);
  }, [answers, questions]);

  const wrongAnswers = useMemo(() => {
    if (!questions) return { questions: [], indexes: [] };
    const wrongIndexes = questions
      .map((q, i) => ({ q, i }))
      .filter(({ q, i }) => answers[i] !== undefined && answers[i] !== q.correct)
      .map(({ i }) => i);
    const wrongQuestions = wrongIndexes.map(i => questions[i]);
    return { questions: wrongQuestions, indexes: wrongIndexes };
  }, [answers, questions]);

  useEffect(() => {
    if (
      showScore &&
      totalQuestions > 0 &&
      score < totalQuestions &&
      wrongAnswers.questions.length > 0 &&
      !showRemedialOffer
    ) {
      setShowRemedialOffer(true);
    }
  }, [showScore, score, wrongAnswers.questions.length, showRemedialOffer, totalQuestions]);

  if (isStreaming) {
    return <MemoryGame isLoading={isStreaming} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', width: '100%', maxWidth: '900px', background: 'transparent', minHeight: 'auto', color: dark ? '#f8fafc' : '#0f172a' }}>
      {/* Remedial Offer Panel */}
      {showRemedialOffer && onRemedialClick && (
        <div style={{
          background: dark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(240, 249, 255, 0.92)',
          border: `1px solid ${dark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(56, 189, 248, 0.35)'}`,
          borderRadius: '12px',
          padding: '24px',
          backdropFilter: 'blur(32px)',
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '8px', color: T.accent }}>
            💡 Besoin d'aide ?
          </h3>
          <p style={{ color: dark ? '#e2e8f0' : '#334155', marginBottom: '16px', fontSize: '0.875rem' }}>
            Vous avez des difficultés sur {wrongAnswers.questions.length} question{wrongAnswers.questions.length > 1 ? 's' : ''}.
            Laissez-nous générer des questions adaptées pour mieux comprendre.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => onRemedialClick(wrongAnswers.questions, wrongAnswers.indexes)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontSize: '0.875rem',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
              }}
            >
              🎯 Générer des questions de rattrapage
            </button>
            <button
              onClick={() => setShowRemedialOffer(false)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'transparent',
                color: '#cbd5e1',
                border: '1px solid rgba(71, 85, 105, 0.5)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontSize: '0.875rem',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6';
                (e.currentTarget as HTMLButtonElement).style.color = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(71, 85, 105, 0.5)';
                (e.currentTarget as HTMLButtonElement).style.color = '#cbd5e1';
              }}
            >
              Passer
            </button>
          </div>
        </div>
      )}

      {/* Score panel */}
      {showScore && (
        <div style={{
          background: dark ? 'rgba(15, 23, 42, 0.86)' : '#f8fafc',
          border: `1px solid ${dark ? 'rgba(14, 165, 233, 0.3)' : 'rgba(14, 165, 233, 0.18)'}`,
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          backdropFilter: 'blur(32px)',
        }}>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '8px' }}>
            <span style={{ color: score >= Math.ceil(totalQuestions * 0.6) ? '#4ade80' : '#ef4444' }}>{score}</span>
            <span style={{ color: dark ? '#94a3b8' : '#64748b' }}>/{totalQuestions || maxQuestions}</span>
          </div>
          <p style={{ color: dark ? '#e2e8f0' : '#0f172a' }}>
            {score === totalQuestions ? '🎉 Parfait ! Excellent travail !' :
             score >= Math.ceil(totalQuestions * 0.6) ? '👏 Bien joué ! Continue comme ça !' :
             '📖 Continue à réviser, tu vas y arriver !'}
          </p>
        </div>
      )}

      {/* Questions Container - Always visible */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {questions && questions.length > 0 ? (
          questions.map((q, qIndex) => (
            <div
              key={qIndex}
              style={{
                background: dark ? 'rgba(15, 23, 42, 0.88)' : '#ffffff',
                border: `1px solid ${dark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.18)'}`,
                borderRadius: '12px',
                padding: '20px',
                backdropFilter: 'blur(32px)',
                boxShadow: dark ? '0 10px 30px rgba(15, 23, 42, 0.25)' : '0 10px 30px rgba(15, 23, 42, 0.08)',
              }}
            >
              <h3 style={{ fontWeight: '600', color: dark ? '#e2e8f0' : '#0f172a', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0,
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: dark ? 'rgba(6, 182, 212, 0.18)' : 'rgba(56, 189, 248, 0.16)',
                  color: dark ? '#38bdf8' : '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                }}>
                  {qIndex + 1}
                </span>
                <span>{q.question}</span>
              </h3>

              <div style={{ display: 'grid', gap: '8px' }}>
                {q.choices.map((choice, cIndex) => {
                  const isAnswered = answers[qIndex] !== undefined;
                  const isSelected = answers[qIndex] === cIndex;
                  const isCorrect = q.correct === cIndex;

                  let bgColor = 'rgba(15, 23, 42, 0.5)';
                  let borderColor = 'rgba(71, 85, 105, 0.5)';
                  let textColor = '#cbd5e1';

                  if (!isAnswered) {
                    borderColor = 'rgba(71, 85, 105, 0.5)';
                  } else if (isCorrect) {
                    bgColor = 'rgba(34, 197, 94, 0.1)';
                    borderColor = 'rgba(34, 197, 94, 0.5)';
                    textColor = '#22c55e';
                  } else if (isSelected) {
                    bgColor = 'rgba(239, 68, 68, 0.1)';
                    borderColor = 'rgba(239, 68, 68, 0.5)';
                    textColor = '#ef4444';
                  }

                  return (
                    <button
                      key={cIndex}
                      onClick={() => handleAnswer(qIndex, cIndex)}
                      disabled={isAnswered}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px',
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        background: bgColor,
                        color: textColor,
                        fontSize: '0.875rem',
                        cursor: isAnswered ? 'default' : 'pointer',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isAnswered) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(6, 182, 212, 0.8)';
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(6, 182, 212, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isAnswered) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = borderColor;
                          (e.currentTarget as HTMLButtonElement).style.background = bgColor;
                        }
                      }}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          !isStreaming && (
            <div style={{
              textAlign: 'left',
              padding: '24px',
              color: dark ? '#e2e8f0' : '#0f172a',
              background: dark ? 'rgba(15, 23, 42, 0.8)' : '#f8fafc',
              border: `1px solid ${dark ? 'rgba(71, 85, 105, 0.35)' : 'rgba(148, 163, 184, 0.3)'}`,
              borderRadius: '12px',
            }}>
              <h3 style={{ color: '#ef4444', marginBottom: '12px', fontWeight: 'bold' }}>⚠️ QCM non interactif</h3>
              <p style={{ marginBottom: '16px', color: dark ? '#cbd5e1' : '#475569', fontSize: '0.875rem' }}>L'IA a généré des questions, mais le format est invalide pour être interactif. Voici la réponse générée :</p>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85rem', background: dark ? 'rgba(0,0,0,0.3)' : '#e2e8f0', padding: '16px', borderRadius: '8px', border: `1px solid ${dark ? '#334155' : '#cbd5e1'}` }}>
                {rawContent || "Aucune réponse générée."}
              </pre>
            </div>
          )
        )}
      </div>
    </div>
  );
}
