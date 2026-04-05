/**
 * useSpeechSynthesis.ts
 * Custom React hook for text-to-speech using the Web Speech API.
 * Works entirely offline with local system voices.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/---/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitIntoSentences(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  return sentences.map(s => s.trim()).filter(s => s.length > 0);
}

export default function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [mouthState, setMouthState] = useState<'closed' | 'small' | 'open' | 'wide'>('closed');

  const sentencesRef = useRef<string[]>([]);
  const currentIndexRef = useRef(0);
  const mouthIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCancelledRef = useRef(false);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const frenchVoices = allVoices.filter(v => v.lang.startsWith('fr') && v.localService);
      const localVoices = allVoices.filter(v => v.localService);
      const available = frenchVoices.length > 0 ? frenchVoices : localVoices;
      setVoices(available);
      if (available.length > 0 && !selectedVoice) {
        setSelectedVoice(available[0]);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const startMouthAnimation = useCallback(() => {
    const mouthCycle: Array<'closed' | 'small' | 'open' | 'wide'> = ['closed', 'small', 'open', 'wide', 'open', 'small'];
    let frame = 0;
    mouthIntervalRef.current = setInterval(() => {
      setMouthState(mouthCycle[frame % mouthCycle.length]);
      frame++;
    }, 120);
  }, []);

  const stopMouthAnimation = useCallback(() => {
    if (mouthIntervalRef.current) {
      clearInterval(mouthIntervalRef.current);
      mouthIntervalRef.current = null;
    }
    setMouthState('closed');
  }, []);

  const speakSentence = useCallback((index: number) => {
    if (isCancelledRef.current) return;
    if (index >= sentencesRef.current.length) {
      setIsSpeaking(false);
      setProgress(1);
      stopMouthAnimation();
      return;
    }

    currentIndexRef.current = index;
    setCurrentSentenceIndex(index);
    setProgress(index / sentencesRef.current.length);

    const utterance = new SpeechSynthesisUtterance(sentencesRef.current[index]);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.lang = 'fr-FR';

    utterance.onstart = () => { startMouthAnimation(); };
    utterance.onend = () => {
      stopMouthAnimation();
      speakSentence(index + 1);
    };
    utterance.onerror = (e) => {
      if (e.error !== 'canceled') console.warn('TTS error:', e.error);
      stopMouthAnimation();
    };

    window.speechSynthesis.speak(utterance);
  }, [selectedVoice, rate, startMouthAnimation, stopMouthAnimation]);

  const speak = useCallback((rawText: string) => {
    window.speechSynthesis.cancel();
    isCancelledRef.current = false;

    const cleanText = stripMarkdown(rawText);
    const sentences = splitIntoSentences(cleanText);
    sentencesRef.current = sentences;
    currentIndexRef.current = 0;

    setIsSpeaking(true);
    setIsPaused(false);
    setProgress(0);
    setCurrentSentenceIndex(0);
    speakSentence(0);
  }, [speakSentence]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    stopMouthAnimation();
  }, [stopMouthAnimation]);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setIsPaused(false);
    startMouthAnimation();
  }, [startMouthAnimation]);

  const stop = useCallback(() => {
    isCancelledRef.current = true;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentSentenceIndex(0);
    stopMouthAnimation();
  }, [stopMouthAnimation]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      stopMouthAnimation();
    };
  }, [stopMouthAnimation]);

  return {
    voices,
    selectedVoice,
    setSelectedVoice,
    isSpeaking,
    isPaused,
    rate,
    setRate,
    progress,
    currentSentenceIndex,
    currentSentence: sentencesRef.current[currentSentenceIndex] || '',
    mouthState,
    speak,
    pause,
    resume,
    stop,
  };
}
