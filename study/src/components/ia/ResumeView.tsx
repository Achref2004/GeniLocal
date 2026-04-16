import { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../../reutilisable/Themecontext';
import ReactMarkdown from 'react-markdown';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — mark.js has no proper ESM types
import MarkLib from 'mark.js';
import AvatarReader from './AvatarReader';
import useSpeechSynthesis from '../../hooks/useSpeechSynthesis';
import type { AvatarConfig } from '../../utils/avatarConfig';

interface ResumeViewProps {
  content: string;
  isStreaming: boolean;
  subject: string;
  avatarConfig: AvatarConfig;
  onStop?: () => void;
}

export default function ResumeView({ content, isStreaming, subject, avatarConfig, onStop }: ResumeViewProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showReader, setShowReader] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markInstanceRef = useRef<any>(null);

  const { dark, T } = useTheme();
  const speechHandlers = useSpeechSynthesis();
  const { currentSentence, isSpeaking, stop, speak, voices } = speechHandlers;

  // Cleanup on unmount
  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  // Mark.js text highlighting
  useEffect(() => {
    if (!containerRef.current) return;
    if (!markInstanceRef.current) {
      markInstanceRef.current = new MarkLib(containerRef.current);
    }
    const markInstance = markInstanceRef.current;
    markInstance.unmark();
    if (currentSentence && isSpeaking) {
      markInstance.mark(currentSentence, {
        separateWordSearch: false,
        accuracy: 'partially',
        className: 'ia-highlight',
        diacritics: true,
      });
    }
  }, [currentSentence, isSpeaking, content]);

  // Auto-scroll
  useEffect(() => {
    if (isStreaming) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [content, isStreaming]);

  const handleStartReading = () => {
    setShowReader(true);
    setTimeout(() => { speak(content); }, 100);
  };

  const handleCloseReader = () => {
    stop();
    setShowReader(false);
  };

  const renderedContent = useMemo(() => {
    return content ? (
      <ReactMarkdown>{content}</ReactMarkdown>
    ) : (
      <div className="flex items-center gap-3 text-gray-400">
        <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
        <span>Génération du résumé en cours...</span>
      </div>
    );
  }, [content]);

  return (
    <div className="ia-animate-in relative">
      {/* Subject header */}
      {subject && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-sky-400 to-sky-600" />
            <h2 className="text-xl font-bold text-sky-300">📚 {subject}</h2>
          </div>
          {!isStreaming && content && !showReader && voices.length > 0 && (
            <button
              onClick={handleStartReading}
              className="ia-read-btn"
            >
              <span>🔊</span> Lire avec l'avatar
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="ia-glass-card rounded-xl p-6" style={{ background: dark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.94)', color: dark ? '#f8fafc' : '#0f172a' }}>
        <div
          ref={containerRef}
          className={`ia-prose ${isStreaming ? 'ia-streaming' : ''}`}
          style={{ color: dark ? '#f8fafc' : '#0f172a' }}
        >
          {renderedContent}
        </div>
        <div ref={endRef} />
        {isStreaming && onStop && (
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onStop}
              style={{
                padding: '12px 18px',
                borderRadius: 14,
                background: T.accent,
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: `0 12px 26px ${T.accent}40`,
              }}
            >
              Arrêter la génération
            </button>
          </div>
        )}
      </div>

      {/* PIP Avatar Reader */}
      {showReader && avatarConfig && (
        <AvatarReader
          config={avatarConfig}
          onClose={handleCloseReader}
          {...speechHandlers}
        />
      )}
    </div>
  );
}
