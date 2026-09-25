import { create } from 'zustand';
import { STRINGS } from './strings';

// App language: English, Urdu or Arabic. Saved in this browser; Urdu and Arabic read right to left.
export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ur', label: 'اردو', dir: 'rtl' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
];
const CODES = LANGUAGES.map((l) => l.code);

const readSaved = () => {
  try {
    const saved = localStorage.getItem('lang');
    return CODES.includes(saved) ? saved : 'en';
  } catch {
    return 'en';
  }
};

const applyToDocument = (lang) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
};

export const useLangStore = create((set) => ({
  lang: readSaved(),
  setLang: (lang) => {
    if (!CODES.includes(lang)) return;
    try {
      localStorage.setItem('lang', lang);
    } catch {
      // The choice still applies for this visit.
    }
    applyToDocument(lang);
    set({ lang });
  },
}));

applyToDocument(useLangStore.getState().lang);

// t('nav.home') or t('parent.hello', { name: 'Ayesha' }); falls back to English, then the key.
export const translate = (lang, key, vars) => {
  const pick = (table) => key.split('.').reduce((node, part) => (node == null ? node : node[part]), table);
  let text = pick(STRINGS[lang]) ?? pick(STRINGS.en) ?? key;
  if (vars && typeof text === 'string') {
    text = text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? `{${name}}`));
  }
  return text;
};

export const useT = () => {
  const lang = useLangStore((s) => s.lang);
  const dir = LANGUAGES.find((l) => l.code === lang)?.dir || 'ltr';
  return { lang, dir, t: (key, vars) => translate(lang, key, vars) };
};
