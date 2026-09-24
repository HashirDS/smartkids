import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Experience } from './Experience.jsx';
import { useAITeacher } from '../hooks/useAITeacher';
import Mithu from './landing/Mithu.jsx';

// Free, no-login demo of the 3D classroom, limited to a few minutes per visitor.
// The limit is kept in this browser's storage, so it resets after a day.
const DEMO_SECONDS = 180;
const STORAGE_KEY = 'ai_tutor_demo_started_at';
const RESET_AFTER_MS = 24 * 60 * 60 * 1000;

const readStart = () => {
  const now = Date.now();
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    if (saved && now - saved < RESET_AFTER_MS) return saved;
    localStorage.setItem(STORAGE_KEY, String(now));
  } catch {
    // Storage unavailable: the timer still works for this visit.
  }
  return now;
};

const secondsLeft = (start) => Math.max(0, DEMO_SECONDS - Math.floor((Date.now() - start) / 1000));

const stopTeacher = () => {
  const { currentMessage, stopMessage } = useAITeacher.getState();
  if (currentMessage) stopMessage(currentMessage);
};

const ClassroomDemo = () => {
  const [start] = useState(readStart);
  const [left, setLeft] = useState(() => secondsLeft(start));
  const ended = left <= 0;

  useEffect(() => {
    if (ended) {
      stopTeacher();
      return undefined;
    }
    const id = setInterval(() => setLeft(secondsLeft(start)), 1000);
    return () => clearInterval(id);
  }, [ended, start]);

  // Stop any speech when leaving the page.
  useEffect(() => stopTeacher, []);

  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');

  if (ended) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#4FC3FF] to-[#DDF4FF] p-6">
        <title>AI Tutor | 3D classroom demo</title>
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_8px_0_rgba(30,42,85,0.18)]">
          <Mithu className="mx-auto w-32" />
          <h1 className="mt-2 text-3xl font-extrabold text-[#1E2A55]" style={{ fontFamily: "'Fredoka', 'Nunito', sans-serif" }}>
            That was fun!
          </h1>
          <p className="mt-2 font-semibold text-[#4A5578]">
            Your free 3-minute classroom demo has ended. Create an account to keep learning with your 3D teacher.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/login" className="rounded-full bg-[#2EC26A] px-4 py-1.5 text-sm font-bold text-white shadow-[0_4px_0_#1B8A4A]">
              Login / Sign up
            </Link>
            <Link to="/" className="rounded-full bg-[#EEF2FF] px-4 py-1.5 text-sm font-bold text-[#1E2A55]">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <title>AI Tutor | 3D classroom demo</title>
      <div className="fixed left-4 right-4 top-4 z-20 flex items-center justify-between gap-3">
        <Link to="/" className="rounded-full bg-white/90 px-3 py-1.5 text-sm font-bold text-[#1E2A55] shadow">
          ← AI Tutor
        </Link>
        <div className="rounded-full bg-[#1E2A55]/85 px-3 py-1.5 text-sm font-bold text-white shadow" aria-live="polite">
          Free demo · {mm}:{ss} left
        </div>
      </div>
      <Experience />
    </div>
  );
};

export default ClassroomDemo;
