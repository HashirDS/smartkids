import React, { useState } from 'react';
import { useT } from '../../i18n';
import useRewards from './useRewards';
import { Tabs } from '../ui/Kit';
import { TOPIC_LESSONS } from '../../data/topics';
import { URDU_LETTERS } from '../../data/urdu';
import { FLAGS, flagSrc } from '../../data/flags';
import '../landing/landing.css';

const LESSON_ORDER = ['abc', 'numbers', 'shapes', 'colors', 'fruits', 'flags', 'urdu', 'arabic', 'islamic', 'science', 'animals'];
const STICKER_COLORS = ['#FFD23F', '#FF8FB1', '#7CC8FF', '#8BE3A8', '#C9B6FF', '#FFB36B'];

const topicEmoji = {};
Object.entries(TOPIC_LESSONS).forEach(([lesson, data]) => data.topics.forEach((topic) => topic.items.forEach((item) => {
  topicEmoji[`${lesson}:${topic.key}:${item.id}`] = item.emoji;
})));
const urduEmoji = Object.fromEntries(URDU_LETTERS.map((l) => [l.letter, l.emoji]));
const flagCode = Object.fromEntries(FLAGS.map((f) => [f.name, f.code]));

// What each sticker shows: a picture where we have one, otherwise the item itself.
const Sticker = ({ lesson, item, index }) => {
  let face;
  if (lesson === 'flags' && flagCode[item]) {
    face = <img src={flagSrc(flagCode[item])} alt="" className="h-9 w-12 rounded object-cover" />;
  } else if (topicEmoji[`${lesson}:${item}`]) {
    face = <span className="text-3xl">{topicEmoji[`${lesson}:${item}`]}</span>;
  } else if (lesson === 'urdu') {
    face = <span className="text-3xl">{urduEmoji[item] || item}</span>;
  } else if (lesson === 'arabic') {
    face = <span className="font-arabic text-3xl leading-[1.6]">{item}</span>;
  } else {
    face = <span className="landing-display px-1 text-center text-sm font-bold leading-tight">{item}</span>;
  }
  const label = String(item).split(':').pop();
  return (
    <div
      className="landing-pop flex aspect-square flex-col items-center justify-center rounded-full border-4 border-white text-[#1E2A55] shadow-[0_4px_0_rgba(30,42,85,0.15)]"
      style={{ backgroundColor: STICKER_COLORS[index % STICKER_COLORS.length], animationDelay: `${Math.min(index, 20) * 30}ms` }}
      title={label}
    >
      {face}
    </div>
  );
};

// Student sticker book: every learned item as a sticker, plus all badges (earned and still to win).
const StickerBook = () => {
  const { t, dir } = useT();
  const { rewards } = useRewards();
  const [tab, setTab] = useState('stickers');

  if (!rewards) return <p className="p-10 text-center font-bold text-[#4A5578]">{t('common.loading')}</p>;

  const lessons = LESSON_ORDER.filter((key) => (rewards.completed_items[key] || []).length > 0);

  return (
    <div className="landing min-h-screen px-4 pb-16 pt-8 sm:px-6" dir={dir}>
      <div className="mx-auto max-w-5xl">
        <h1 className="landing-display text-4xl font-bold text-[#1E2A55] sm:text-5xl">{t('rewards.title')}</h1>
        <p className="mb-5 mt-1 font-semibold text-[#4A5578]">
          🔥 {t('rewards.streak', { n: rewards.streak.current })} · {t('rewards.longest', { n: rewards.streak.longest })}
        </p>

        <Tabs
          tabs={[
            { key: 'stickers', label: t('rewards.stickerTab'), count: rewards.stickers },
            { key: 'badges', label: t('rewards.badgeTab'), count: `${rewards.badges_earned}/${rewards.badges.length}` },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'stickers' && (
          lessons.length === 0 ? (
            <p className="rounded-3xl bg-white p-6 text-center font-bold text-[#4A5578] shadow-[0_6px_0_rgba(30,42,85,0.12)]">{t('rewards.noStickers')}</p>
          ) : (
            <div className="space-y-6">
              {lessons.map((lesson) => (
                <section key={lesson}>
                  <h2 className="landing-display mb-2 text-2xl font-bold text-[#1E2A55]">
                    {t(`lessons.${lesson}`)} <span className="text-base text-[#6B7390]">· {rewards.completed_items[lesson].length}</span>
                  </h2>
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
                    {rewards.completed_items[lesson].map((item, i) => (
                      <Sticker key={item} lesson={lesson} item={item} index={i} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
        )}

        {tab === 'badges' && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {rewards.badges.map((b) => (
              <div
                key={b.key}
                className={`rounded-3xl p-4 text-center shadow-[0_6px_0_rgba(30,42,85,0.12)] ${b.earned ? 'bg-[#FFF1C7]' : 'bg-white'}`}
              >
                <p className={`text-5xl ${b.earned ? '' : 'opacity-30 grayscale'}`} aria-hidden="true">{b.emoji}</p>
                <p className="landing-display mt-2 font-bold text-[#1E2A55]" dir="ltr">{b.title}</p>
                {b.earned ? (
                  <p className="text-sm font-bold text-[#14683A]">✓ {t('rewards.earned')}</p>
                ) : (
                  <div className="mt-2">
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2FF]">
                      <div className="h-full rounded-full bg-[#2EC26A]" style={{ width: `${(b.progress / b.goal) * 100}%` }} />
                    </div>
                    <p className="mt-1 text-xs font-bold text-[#6B7390]" dir="ltr">{b.progress} / {b.goal}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StickerBook;
