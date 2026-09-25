import React, { useEffect, useRef, useState } from 'react';
import useProgressTracker from '../../hooks/useProgressTracker';
import { useT } from '../../i18n';
import { speak, stopSpeaking } from '../../i18n/speak';
import { Button, Tabs } from '../ui/Kit';
import '../landing/landing.css';

// Shared lesson for right-to-left alphabets (Urdu, Arabic Qaida).
// Tap a letter to hear it, "I learned it!" saves progress, "Hear all" goes through every letter.
//
// props:
//   category   progress/lesson key ('urdu' | 'arabic')
//   letters    [{ letter, name, ... }]
//   voice      'ur' | 'ar' (tutor voice language)
//   font       'font-urdu' | 'font-arabic'
//   phrase     letter -> what the tutor says
//   praise     letter -> what the tutor says after "I learned it!"
//   renderDetail(letter) extra content under the big letter (picture word, harakat...)
//   extraTab   optional { key, label, render(letter, select) } second tab (Arabic zabar/zer/pesh)
const LetterLesson = ({ category, titleKey, subtitleKey, praiseKey, letters, voice, font, phrase, praise, renderDetail, extraTab, color }) => {
  const { t, dir } = useT();
  const [selected, setSelected] = useState(letters[0]);
  const [speaking, setSpeaking] = useState(false);
  const [playingAll, setPlayingAll] = useState(false);
  const [tab, setTab] = useState('letters');
  const [message, setMessage] = useState('');
  const playAllRef = useRef(false);
  const isLoggedIn = Boolean(localStorage.getItem('user_id'));
  const { completedItems, isSubmitting, markItemAsComplete } = useProgressTracker(category);

  useEffect(() => () => {
    playAllRef.current = false;
    stopSpeaking();
  }, []);

  const say = (text, onEnd) => speak(text, voice, {
    onStart: () => setSpeaking(true),
    onEnd: () => {
      setSpeaking(false);
      onEnd?.();
    },
  });

  const choose = (item) => {
    playAllRef.current = false;
    setPlayingAll(false);
    setSelected(item);
    setMessage('');
    say(phrase(item));
  };

  const step = (delta) => {
    const i = letters.indexOf(selected);
    choose(letters[(i + delta + letters.length) % letters.length]);
  };

  const playAll = () => {
    if (playingAll) {
      playAllRef.current = false;
      setPlayingAll(false);
      stopSpeaking();
      return;
    }
    playAllRef.current = true;
    setPlayingAll(true);
    const next = (i) => {
      if (!playAllRef.current || i >= letters.length) {
        playAllRef.current = false;
        setPlayingAll(false);
        return;
      }
      setSelected(letters[i]);
      say(phrase(letters[i]), () => setTimeout(() => next(i + 1), 500));
    };
    next(0);
  };

  const learned = completedItems.has(selected.letter);
  const markLearned = () => {
    markItemAsComplete(selected.letter, () => {
      setMessage(t(praiseKey, { name: selected.name }));
      say(praise(selected));
    });
  };

  const tabs = extraTab
    ? [{ key: 'letters', label: t('arabic.letters') }, { key: extraTab.key, label: extraTab.label }]
    : null;

  return (
    <div className="landing min-h-screen px-4 pb-16 pt-8 sm:px-6" dir={dir}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="landing-display text-4xl font-bold text-[#1E2A55] sm:text-5xl">{t(titleKey)}</h1>
            <p className="mt-1 font-semibold text-[#4A5578]">{t(subtitleKey)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#1E2A55] shadow-[0_3px_0_rgba(30,42,85,0.12)]">
              {t('alphabet.learnedCount', { n: letters.filter((l) => completedItems.has(l.letter)).length, total: letters.length })}
            </span>
            <Button variant="blue" onClick={playAll}>{playingAll ? t('alphabet.stop') : t('alphabet.playAll')}</Button>
          </div>
        </div>

        {!isLoggedIn && (
          <p className="mb-4 rounded-2xl bg-[#FFF1C7] px-4 py-2 text-sm font-bold text-[#8A5A00]">{t('alphabet.saveNote')}</p>
        )}

        {tabs && <Tabs tabs={tabs} active={tab} onChange={setTab} />}

        <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          {/* The chosen letter */}
          <div className="rounded-3xl p-6 text-center" style={{ backgroundColor: color, boxShadow: '0 6px 0 rgba(30,42,85,0.12)' }}>
            {tab === 'letters' || !extraTab ? (
              <>
                <button
                  type="button"
                  onClick={() => say(phrase(selected))}
                  className={`mx-auto block w-full rounded-3xl bg-white py-4 text-[7rem] leading-[1.5] text-[#1E2A55] shadow-[0_5px_0_rgba(30,42,85,0.12)] transition hover:-translate-y-0.5 ${font} ${speaking ? 'ring-4 ring-[#FFD23F]' : ''}`}
                  dir="rtl"
                  aria-label={selected.name}
                >
                  {selected.letter}
                </button>
                <p className={`mt-3 text-3xl text-[#1E2A55] ${font}`} dir="rtl">{selected.name}</p>
                {renderDetail?.(selected)}
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button variant="light" onClick={() => step(-1)}>{t('alphabet.previous')}</Button>
                  <Button onClick={markLearned} disabled={learned || isSubmitting || !isLoggedIn}>
                    {learned ? `✓ ${t('alphabet.learned')}` : t('alphabet.markLearned')}
                  </Button>
                  <Button variant="light" onClick={() => step(1)}>{t('alphabet.next')}</Button>
                </div>
                {message && <p className="mt-3 font-bold text-[#14683A]">{message}</p>}
              </>
            ) : (
              extraTab.render(selected, say)
            )}
          </div>

          {/* All letters, read right to left */}
          <div>
            <p className="mb-2 text-sm font-bold text-[#6B7390]">{t('alphabet.tapLetter')}</p>
            <div dir="rtl" className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-7">
              {letters.map((item) => {
                const done = completedItems.has(item.letter);
                const active = item === selected;
                return (
                  <button
                    key={item.letter}
                    type="button"
                    onClick={() => choose(item)}
                    aria-label={item.name}
                    className={`relative aspect-square rounded-2xl text-4xl leading-none transition hover:-translate-y-0.5 ${font} ${
                      active
                        ? 'bg-[#1E2A55] text-white shadow-[0_4px_0_rgba(30,42,85,0.35)]'
                        : done
                          ? 'bg-[#DDF7E6] text-[#14683A] shadow-[0_4px_0_rgba(20,104,58,0.2)]'
                          : 'bg-white text-[#1E2A55] shadow-[0_4px_0_rgba(30,42,85,0.12)]'
                    }`}
                  >
                    {item.letter}
                    {done && !active && <span className="absolute left-1 top-0.5 font-sans text-xs font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetterLesson;
