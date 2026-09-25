import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../api';

// Loads a child's stickers, streak and badges, and works out which badges are new since last time.
const seenKey = (userId) => `seen_badges_${userId}`;

const readSeen = (userId) => {
  try {
    const raw = localStorage.getItem(seenKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const useRewards = (userId = localStorage.getItem('user_id')) => {
  const [rewards, setRewards] = useState(null);
  const [newBadges, setNewBadges] = useState([]);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await apiFetch(`/api/rewards/${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      setRewards(data);
      const earned = data.badges.filter((b) => b.earned);
      const seen = readSeen(userId);
      if (seen === null) {
        // First visit: remember what is already earned without a burst of pop-ups.
        localStorage.setItem(seenKey(userId), JSON.stringify(earned.map((b) => b.key)));
      } else {
        setNewBadges(earned.filter((b) => !seen.includes(b.key)));
      }
    } catch {
      // Rewards are extra; lessons keep working without them.
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const dismissNew = () => {
    if (!rewards) return;
    try {
      localStorage.setItem(seenKey(userId), JSON.stringify(rewards.badges.filter((b) => b.earned).map((b) => b.key)));
    } catch {
      // Ignore storage errors.
    }
    setNewBadges([]);
  };

  return { rewards, newBadges, dismissNew, reload: load };
};

export default useRewards;
