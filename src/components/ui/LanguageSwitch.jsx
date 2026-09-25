import React from 'react';
import { LANGUAGES, useLangStore, useT } from '../../i18n';

// Small English / اردو / العربية switch, used inside the ☰ menu and on /join.
const LanguageSwitch = ({ className = '' }) => {
  const { t, lang } = useT();
  const setLang = useLangStore((s) => s.setLang);
  return (
    <div className={className}>
      <p className="px-1 pb-1 text-xs font-bold text-[#8A91AD]">{t('common.language')}</p>
      <div className="flex gap-1" role="group" aria-label={t('common.language')}>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            lang={l.code}
            onClick={() => setLang(l.code)}
            aria-pressed={lang === l.code}
            className={`landing-display flex-1 rounded-full px-2 py-1 text-sm font-semibold transition ${
              lang === l.code ? 'bg-[#1E2A55] text-white' : 'bg-[#EEF2FF] text-[#1E2A55] hover:bg-[#E0E6FF]'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitch;
