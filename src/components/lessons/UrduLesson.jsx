import React from 'react';
import LetterLesson from './LetterLesson';
import { URDU_LETTERS, urduPhrase } from '../../data/urdu';

// Urdu alphabet (حروفِ تہجی): each letter with a picture word, spoken "بے سے بلی".
const UrduLesson = () => (
  <LetterLesson
    category="urdu"
    titleKey="urdu.title"
    subtitleKey="urdu.subtitle"
    praiseKey="urdu.praise"
    letters={URDU_LETTERS}
    voice="ur"
    font="font-urdu"
    color="#E0F1FF"
    phrase={urduPhrase}
    praise={(l) => `شاباش! ${urduPhrase(l)}`}
    renderDetail={(l) => (
      <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3">
        <span className="text-6xl" aria-hidden="true">{l.emoji}</span>
        <p className="font-urdu mt-1 text-3xl leading-[2] text-[#1E2A55]" dir="rtl">{l.word}</p>
        <p className="text-sm font-bold text-[#6B7390]">{l.meaning}</p>
      </div>
    )}
  />
);

export default UrduLesson;
