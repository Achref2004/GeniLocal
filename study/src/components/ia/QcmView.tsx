import { useState, useMemo } from 'react';
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
}

export default function QcmView({ rawContent, isStreaming, onRemedialClick }: QcmViewProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showScore, setShowScore] = useState(false);
  const [showRemedialOffer, setShowRemedialOffer] = useState(false);

  const questions = useMemo((): Question[] | null => {
    if (!rawContent) return null;
    try {
      let jsonStr = rawContent.trim();
      const start = jsonStr.indexOf('[');
      const end = jsonStr.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        jsonStr = jsonStr.substring(start, end + 1);
      }
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 5);
      }
    } catch (e) {
      console.error('Failed to parse QCM JSON:', e, 'rawContent:', rawContent);
    }
    return null;
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

  // Show remedial offer when quiz is complete and score < 5
  useMemo(() => {
    if (showScore && score < 5 && wrongAnswers.questions.length > 0 && !showRemedialOffer) {
      setShowRemedialOffer(true);
    }
  }, [showScore, score, wrongAnswers.questions.length, showRemedialOffer]);

  if (isStreaming || !questions) {
    if (isStreaming) {
      return <MemoryGame isLoading={isStreaming} />;
    }
    // If not streaming but no questions, show loading state
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '500px', gap: '20px', padding: '40px' }}>
        <div style={{
          fontSize: '1rem',
          color: '#cbd5e1',
          textAlign: 'center',
        }}>
          <p style={{ marginBottom: '12px' }}>⏳ Traitement des questions...</p>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Veuillez patienter...</p>
        </div>
        {/* Minimal progress bar */}
        <div style={{
          width: '100%',
          maxWidth: '300px',
          height: '3px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #06b6d4 0%, #0ea5e9 100%)',
            animation: 'pulse 1.5s ease-in-out infinite',
            width: '50%',
          }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', width: '100%', maxWidth: '900px', background: 'transparent', minHeight: 'auto' }}>
      {/* Remedial Offer Panel */}
      {showRemedialOffer && onRemedialClick && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.5)',
          borderRadius: '12px',
          padding: '24px',
          backdropFilter: 'blur(32px)',
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '8px', color: '#3b82f6' }}>
            💡 Besoin d'aide ?
          </h3>
          <p style={{ color: '#cbd5e1', marginBottom: '16px', fontSize: '0.875rem' }}>
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
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          backdropFilter: 'blur(32px)',
        }}>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '8px' }}>
            <span style={{ color: score >= 3 ? '#4ade80' : '#ef4444' }}>{score}</span>
            <span style={{ color: '#94a3b8' }}>/5</span>
          </div>
          <p style={{ color: '#cbd5e1' }}>
            {score === 5 ? '🎉 Parfait ! Excellent travail !' :
             score >= 3 ? '👏 Bien joué ! Continue comme ça !' :
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
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                backdropFilter: 'blur(32px)',
              }}
            >
              <h3 style={{ fontWeight: '600', color: '#e2e8f0', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0,
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: '#06b6d4',
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
              textAlign: 'center',
              padding: '40px',
              color: '#bbb4b4',
            }}>
              <p>Impossible de charger les questions. Veuillez réessayer.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
