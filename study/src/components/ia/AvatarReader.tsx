import { useEffect, useState, useRef } from 'react';
import AvatarCanvas from './AvatarCanvas';
import type { AvatarConfig } from '../../utils/avatarConfig';

interface AvatarReaderProps {
  config: AvatarConfig;
  onClose: () => void;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (v: SpeechSynthesisVoice) => void;
  isSpeaking: boolean;
  isPaused: boolean;
  rate: number;
  setRate: (r: number) => void;
  progress: number;
  mouthState: 'closed' | 'small' | 'open' | 'wide';
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export default function AvatarReader({
  config,
  onClose,
  voices,
  selectedVoice,
  setSelectedVoice,
  isSpeaking,
  isPaused,
  progress,
  mouthState,
  speak,
  pause,
  resume,
  stop,
}: AvatarReaderProps) {
  const [blinkState, setBlinkState] = useState(false);
  const blinkRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Eye blink every 3-5s
  useEffect(() => {
    const scheduleBlink = () => {
      blinkRef.current = setTimeout(() => {
        setBlinkState(true);
        setTimeout(() => { setBlinkState(false); scheduleBlink(); }, 150);
      }, 3000 + Math.random() * 2000);
    };
    scheduleBlink();
    return () => { if (blinkRef.current) clearTimeout(blinkRef.current); };
  }, []);

  useEffect(() => { return () => stop(); }, [stop]);

  const handleClose = () => { stop(); onClose(); };
  const handlePlayPause = () => {
    if (!isSpeaking) speak('');
    else if (isPaused) resume();
    else pause();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[80] shadow-2xl" style={{ animation: 'slideUp 0.3s ease-out' }}>
      <div className="ia-pip-modal overflow-hidden hover:scale-[1.02] transition-transform duration-300">
        <button onClick={handleClose} className="ia-pip-close">✕</button>

        {/* Avatar with dynamic animation */}
        <div className="ia-pip-avatar-area">
          <div className={`ia-pip-body ${isSpeaking && !isPaused ? 'ia-pip-speaking' : ''}`}>
            <AvatarCanvas
              config={config}
              mouthState={mouthState}
              blinkState={blinkState}
              size={180}
              className="drop-shadow-2xl"
            />
          </div>
          {isSpeaking && !isPaused && (
            <div style={{ marginTop: '1rem' }}>
              <div className="ia-sound-wave">
                <span /><span /><span /><span /><span />
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="ia-progress-track">
          <div className="ia-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>

        {/* Controls */}
        <div className="ia-pip-controls">
          <button
            onClick={handlePlayPause}
            className="ia-ctrl-btn ia-ctrl-play"
            title={isSpeaking && !isPaused ? 'Pause' : 'Lecture'}
          >
            {isSpeaking && !isPaused ? '⏸️' : '▶️'}
          </button>
          <button
            onClick={() => stop()}
            className="ia-ctrl-btn"
            title="Stop"
            disabled={!isSpeaking}
          >
            ⏹️
          </button>
        </div>

        {/* Voice selector */}
        {voices.length > 1 && (
          <div className="ia-voice-selector">
            <select
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const v = voices.find(v => v.name === e.target.value);
                if (v) setSelectedVoice(v);
              }}
              className="ia-voice-select"
            >
              {voices.map(v => (
                <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
