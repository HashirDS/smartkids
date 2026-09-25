import { apiFetch } from '../api';

// Speaks Urdu, Arabic or English. Uses the server's Azure voices (ur-PK / ar-SA) and falls back
// to the browser's own voice when the server has no speech key or can't be reached.
const BROWSER_LANG = { en: 'en-US', ur: 'ur-PK', ar: 'ar-SA' };
let current = null;

export const stopSpeaking = () => {
  if (current) {
    current.pause();
    current = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
};

const browserSpeak = (text, lang, onEnd) => {
  if (!('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = BROWSER_LANG[lang] || 'en-US';
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith(lang));
  if (voice) utterance.voice = voice;
  utterance.rate = 0.75;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
};

export const speak = async (text, lang = 'en', { onStart, onEnd } = {}) => {
  stopSpeaking();
  onStart?.();
  try {
    const res = await apiFetch(`/api/tts?lang=${lang}&text=${encodeURIComponent(text)}`);
    if (!res.ok) throw new Error('tts');
    const url = URL.createObjectURL(await res.blob());
    const audio = new Audio(url);
    current = audio;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (current === audio) current = null;
      onEnd?.();
    };
    await audio.play();
  } catch {
    browserSpeak(text, lang, onEnd);
  }
};
