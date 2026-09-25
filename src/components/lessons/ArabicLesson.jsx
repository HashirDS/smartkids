import React from 'react';
import LetterLesson from './LetterLesson';
import { ARABIC_LETTERS, harakatFor } from '../../data/arabic';
import { useT } from '../../i18n';

const Harakat = ({ letter, say }) => {
  const { t } = useT();
  const labels = [t('arabic.fatha'), t('arabic.kasra'), t('arabic.damma')];
  return (
    <div>
      <p className="mb-3 font-bold text-[#4A5578]">{t('arabic.harakatHint')}</p>
      <div dir="rtl" className="grid grid-cols-3 gap-3">
        {harakatFor(letter.letter).map((form, i) => (
          <button
            key={form}
            type="button"
            onClick={() => say(form)}
            className="rounded-3xl bg-white py-3 shadow-[0_5px_0_rgba(30,42,85,0.12)] transition hover:-translate-y-0.5"
          >
            <span className="font-arabic block text-6xl leading-[1.8] text-[#1E2A55]">{form}</span>
            <span className="block text-sm font-bold text-[#6B7390]">{labels[i]}</span>
          </button>
        ))}
      </div>
      <p className="font-arabic mt-4 text-3xl text-[#1E2A55]" dir="rtl">{letter.name}</p>
    </div>
  );
};

// Arabic Qaida (Noorani Qaida): letters with their names, then zabar / zer / pesh on each letter.
const ArabicLesson = () => {
  const { t } = useT();
  return (
    <LetterLesson
      category="arabic"
      titleKey="arabic.title"
      subtitleKey="arabic.subtitle"
      praiseKey="arabic.praise"
      letters={ARABIC_LETTERS}
      voice="ar"
      font="font-arabic"
      color="#DDF7E6"
      phrase={(l) => l.name}
      praise={(l) => `أَحْسَنْتَ! ${l.name}`}
      renderDetail={(l) => <p className="mt-1 text-sm font-bold text-[#6B7390]">{l.latin}</p>}
      extraTab={{ key: 'harakat', label: t('arabic.harakat'), render: (letter, say) => <Harakat letter={letter} say={say} /> }}
    />
  );
};

export default ArabicLesson;
