import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const KEY = 'ai_tutor_cookie_consent';
const PUBLIC_PATHS = ['/', '/login', '/try-classroom', '/privacy', '/terms', '/cookies'];

const readChoice = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return 'unavailable';
  }
};

// Small notice on public pages. The site only uses essential storage today,
// so both choices keep it working; the choice is saved for any future optional cookies.
const CookieBanner = () => {
  const { pathname } = useLocation();
  const [choice, setChoice] = useState(readChoice);

  if (choice || !PUBLIC_PATHS.includes(pathname)) return null;

  const save = (value) => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // Storage blocked: just hide the notice for this visit.
    }
    setChoice(value);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed bottom-4 left-4 right-20 z-50 max-w-md rounded-2xl bg-white p-4 text-sm text-[#4A5578] shadow-[0_6px_0_rgba(30,42,85,0.15),0_12px_30px_rgba(30,42,85,0.18)] sm:right-auto"
    >
      <p className="font-semibold">
        We use only essential cookies and browser storage to keep you signed in and remember your
        settings. No ads or tracking.{' '}
        <Link to="/cookies" className="font-bold text-[#1E88FF] hover:underline">Cookie Policy</Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => save('all')}
          className="rounded-full bg-[#2EC26A] px-3 py-1 text-xs font-bold text-white shadow-[0_3px_0_#1B8A4A]"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => save('essential')}
          className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-bold text-[#1E2A55]"
        >
          Essential only
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
