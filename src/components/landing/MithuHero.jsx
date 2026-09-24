import React, { useCallback, useEffect, useRef, useState } from 'react';
import Mithu from './Mithu';
import AnimatedBackdrop from './AnimatedBackdrop';

const ABC = [
  ['A', 'Apple', '🍎'], ['B', 'Ball', '⚽'], ['C', 'Cat', '🐱'], ['D', 'Dog', '🐶'],
  ['E', 'Elephant', '🐘'], ['F', 'Fish', '🐟'], ['G', 'Grapes', '🍇'], ['H', 'House', '🏠'],
  ['I', 'Ice cream', '🍦'], ['J', 'Juice', '🧃'], ['K', 'Kite', '🪁'], ['L', 'Lion', '🦁'],
  ['M', 'Mango', '🥭'], ['N', 'Nest', '🪺'], ['O', 'Orange', '🍊'], ['P', 'Parrot', '🦜'],
  ['Q', 'Queen', '👑'], ['R', 'Rainbow', '🌈'], ['S', 'Sun', '☀️'], ['T', 'Tiger', '🐯'],
  ['U', 'Umbrella', '☂️'], ['V', 'Van', '🚐'], ['W', 'Watermelon', '🍉'], ['X', 'Xylophone', '🎶'],
  ['Y', 'Yo-yo', '🪀'], ['Z', 'Zebra', '🦓'],
];

const TILE_COLORS = ['#FF4F5E', '#FF8A1F', '#FFC21A', '#2EC26A', '#1E88FF', '#8B5CF6', '#FF4F8B'];

const pickVoice = () => {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  return (
    english.find((v) => /female|zira|samantha|aria|jenny|google us english/i.test(v.name)) ||
    english[0] ||
    null
  );
};

const MithuHero = () => {
  const [index, setIndex] = useState(0);
  const [talking, setTalking] = useState(false);
  const pauseUntil = useRef(0);
  const talkTimer = useRef(null);

  const pulseTalk = useCallback((ms) => {
    setTalking(true);
    clearTimeout(talkTimer.current);
    talkTimer.current = setTimeout(() => setTalking(false), ms);
  }, []);

  // Silent auto-play: Mithu shows a new letter every few seconds until a child taps one.
  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() < pauseUntil.current) return;
      setIndex((i) => (i + 1) % ABC.length);
      pulseTalk(1100);
    }, 3200);
    return () => {
      clearInterval(id);
      clearTimeout(talkTimer.current);
      window.speechSynthesis?.cancel();
    };
  }, [pulseTalk]);

  const say = (i) => {
    pauseUntil.current = Date.now() + 10000;
    setIndex(i);
    const [letter, word] = ABC[i];
    const synth = window.speechSynthesis;
    if (!synth) {
      pulseTalk(1500);
      return;
    }
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(`${letter}. ${letter} is for ${word}!`);
    const voice = pickVoice();
    if (voice) utter.voice = voice;
    utter.rate = 0.85;
    utter.pitch = 1.5;
    utter.onstart = () => {
      clearTimeout(talkTimer.current);
      setTalking(true);
    };
    utter.onend = () => setTalking(false);
    utter.onerror = () => setTalking(false);
    pulseTalk(2500); // fallback in case speech events don't fire
    synth.speak(utter);
  };

  const [letter, word, emoji] = ABC[index];

  return (
    <section id="top" className="relative overflow-hidden">
      <AnimatedBackdrop />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-40 pt-10 sm:px-6 sm:pb-48 lg:px-8 lg:pt-14">
        <div className="grid items-center gap-6 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <h1 className="landing-display landing-fade-up text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl landing-outline">
              Learning that feels like cartoon time!
            </h1>
            <p className="landing-fade-up-delay mx-auto mt-5 max-w-xl text-lg font-semibold leading-relaxed text-[#1E2A55] sm:text-xl lg:mx-0">
              AI Tutor brings friendly talking cartoon teachers to schools, academies and homes, so
              little learners pick up letters, numbers, shapes and colors while having fun.
            </p>
            <p className="mt-5 text-base font-bold text-[#1E2A55]">
              Tap a letter and Mithu will say it! 🔊
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            {/* Speech bubble */}
            <div
              key={index}
              className="landing-pop absolute -top-2 left-0 z-10 rounded-3xl bg-white px-5 py-3 shadow-[0_6px_0_rgba(30,42,85,0.15)] sm:-left-6"
            >
              <p className="landing-display text-3xl font-bold leading-none text-[#1E2A55] sm:text-4xl">
                <span style={{ color: TILE_COLORS[index % TILE_COLORS.length] }}>{letter}</span>
                <span className="text-xl sm:text-2xl"> is for </span>
                {word} <span aria-hidden="true">{emoji}</span>
              </p>
              <span className="absolute -bottom-3 right-16 h-6 w-6 rotate-45 rounded-sm bg-white" />
            </div>
            <Mithu talking={talking} className="mx-auto mt-16 w-64 sm:w-80" />
          </div>
        </div>

        {/* A to Z tiles */}
        <div className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2 sm:gap-2.5">
          {ABC.map(([l], i) => {
            const color = TILE_COLORS[i % TILE_COLORS.length];
            const active = i === index;
            return (
              <button
                key={l}
                type="button"
                onClick={() => say(i)}
                aria-label={`Say ${l}`}
                className={`landing-display h-10 w-10 rounded-xl text-xl font-bold text-white transition sm:h-12 sm:w-12 sm:text-2xl ${
                  active ? '-translate-y-1.5 scale-110' : 'hover:-translate-y-1'
                }`}
                style={{
                  backgroundColor: color,
                  boxShadow: `0 5px 0 rgba(30,42,85,0.28), inset 0 3px 0 rgba(255,255,255,0.35)`,
                }}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MithuHero;
