import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface QrViewProps {
  questionContent: string;
  isStreamingQuestion: boolean;
  correctionContent: string;
  isStreamingCorrection: boolean;
  onSubmitAnswer: (answer: string) => void;
}

export default function QrView({
  questionContent,
  isStreamingQuestion,
  correctionContent,
  isStreamingCorrection,
  onSubmitAnswer,
}: QrViewProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [questionContent, correctionContent]);

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;
    setSubmitted(true);
    onSubmitAnswer(userAnswer.trim());
  };

  return (
    <div className="ia-animate-in space-y-5">
      {/* Question from AI */}
      <div className="ia-glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-lg">🤔</span>
          <h3 className="font-semibold text-gray-200">Question de l'IA</h3>
        </div>
        <div className={`ia-prose ${isStreamingQuestion ? 'ia-streaming' : ''}`}>
          {questionContent ? (
            <ReactMarkdown>{questionContent}</ReactMarkdown>
          ) : (
            <div className="flex items-center gap-3 text-gray-400">
              <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
              <span>L'IA prépare une question...</span>
            </div>
          )}
        </div>
      </div>

      {/* User answer - only shown when question ready */}
      {!isStreamingQuestion && questionContent && !submitted && (
        <div className="ia-glass-card rounded-xl p-6 ia-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-lg">✍️</span>
            <h3 className="font-semibold text-gray-200">Votre réponse</h3>
          </div>
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Tapez votre réponse ici..."
            className="w-full bg-gray-950/60 border border-gray-700 rounded-lg p-4 text-gray-200
                       placeholder-gray-500 focus:outline-none focus:border-sky-500/50
                       focus:ring-1 focus:ring-sky-500/20 resize-none transition-all"
            rows={4}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">Ctrl + Entrée pour soumettre</span>
            <button
              onClick={handleSubmit}
              disabled={!userAnswer.trim()}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-sky-500
                         text-white font-medium text-sm hover:opacity-90 transition-all
                         disabled:opacity-30 disabled:cursor-not-allowed ia-btn-glow"
            >
              Soumettre ma réponse
            </button>
          </div>
        </div>
      )}

      {/* AI Correction */}
      {submitted && (
        <div className="ia-glass-card rounded-xl p-6 ia-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center text-lg">📝</span>
            <h3 className="font-semibold text-gray-200">Correction de l'IA</h3>
          </div>

          {/* Show user's answer */}
          <div className="mb-4 p-3 rounded-lg bg-gray-900/50 border border-gray-700">
            <span className="text-xs text-gray-500 block mb-1">Votre réponse :</span>
            <span className="text-gray-300">{userAnswer}</span>
          </div>

          <div className={`ia-prose ${isStreamingCorrection ? 'ia-streaming' : ''}`}>
            {correctionContent ? (
              <ReactMarkdown>{correctionContent}</ReactMarkdown>
            ) : (
              <div className="flex items-center gap-3 text-gray-400">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span>Correction en cours...</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
