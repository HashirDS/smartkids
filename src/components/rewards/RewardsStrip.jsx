import React from 'react';
import { useT } from '../../i18n';
import useRewards from './useRewards';
import { Button, Modal } from '../ui/Kit';
import '../landing/landing.css';

// Student home: streak, sticker and badge counts, the last 7 days, and a "New badge!" pop-up.
const RewardsStrip = ({ onOpen }) => {
  const { t } = useT();
  const { rewards, newBadges, dismissNew } = useRewards();
  if (!rewards) return null;
  const { streak } = rewards;

  return (
    <>
      <div className="landing mx-auto mb-8 max-w-3xl rounded-3xl p-4 shadow-[0_6px_0_rgba(30,42,85,0.12)]" style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="landing-display rounded-2xl bg-[#FFE8D6] px-3 py-1.5 text-lg font-bold text-[#C2410C]">
              🔥 {t('rewards.streak', { n: streak.current })}
            </span>
            <span className="landing-display rounded-2xl bg-[#FFF1C7] px-3 py-1.5 text-lg font-bold text-[#8A5A00]">
              ⭐ {t('rewards.stickers', { n: rewards.stickers })}
            </span>
            <span className="landing-display rounded-2xl bg-[#EDE7FF] px-3 py-1.5 text-lg font-bold text-[#5B3CC4]">
              🏅 {t('rewards.badges', { n: rewards.badges_earned })}
            </span>
          </div>
          <Button variant="blue" onClick={onOpen}>{t('rewards.open')}</Button>
        </div>
        <div className="mt-3 flex items-center gap-1.5" aria-label={t('rewards.last7')}>
          <span className="me-1 text-xs font-bold text-[#6B7390]">{t('rewards.last7')}</span>
          {streak.last_7_days.map((done, i) => (
            <span
              key={`day-${i}`}
              className={`h-4 w-4 rounded-full ${done ? 'bg-[#FF8A3D]' : 'bg-[#E6E1F5]'}`}
              title={done ? '✓' : ''}
            />
          ))}
          {!streak.today_done && <span className="ms-2 text-xs font-bold text-[#C2410C]">{t('rewards.learnToday')}</span>}
        </div>
      </div>

      {newBadges.length > 0 && (
        <Modal title={t('rewards.newBadge')} onClose={dismissNew} footer={<Button onClick={dismissNew}>{t('rewards.yay')}</Button>}>
          <div className="grid grid-cols-2 gap-3">
            {newBadges.slice(0, 4).map((b) => (
              <div key={b.key} className="landing-pop rounded-3xl bg-[#FFF1C7] p-4 text-center">
                <p className="text-6xl" aria-hidden="true">{b.emoji}</p>
                <p className="landing-display mt-2 text-lg font-bold text-[#1E2A55]">{b.title}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
};

export default RewardsStrip;
