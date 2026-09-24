import React, { useId } from 'react';

// AI Tutor mark: a friendly robot face wearing a graduation cap.
// Pure SVG (no tile/background) so it sits cleanly on any navbar or footer.
export default function AiTutorLogo({ className = 'h-10 w-10', title = 'AI Tutor' }) {
  const id = useId().replace(/:/g, '');
  const face = `face-${id}`;
  const cap = `cap-${id}`;

  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id={face} x1="8" y1="16" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6D5DFC" />
          <stop offset="1" stopColor="#B04BF0" />
        </linearGradient>
        <linearGradient id={cap} x1="4" y1="4" x2="44" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1F1A4D" />
          <stop offset="1" stopColor="#3A2F86" />
        </linearGradient>
      </defs>

      {/* Face */}
      <circle cx="24" cy="29" r="15" fill={`url(#${face})`} />
      {/* Cheeks */}
      <circle cx="15.5" cy="33" r="2.2" fill="#FF8FB1" opacity="0.85" />
      <circle cx="32.5" cy="33" r="2.2" fill="#FF8FB1" opacity="0.85" />
      {/* Eyes */}
      <ellipse cx="18.5" cy="28" rx="2.6" ry="3.1" fill="#fff" />
      <ellipse cx="29.5" cy="28" rx="2.6" ry="3.1" fill="#fff" />
      <circle cx="19" cy="28.6" r="1.3" fill="#1F1A4D" />
      <circle cx="30" cy="28.6" r="1.3" fill="#1F1A4D" />
      {/* Smile */}
      <path d="M19 34.2c1.4 1.9 3.1 2.8 5 2.8s3.6-.9 5-2.8" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />

      {/* Graduation cap */}
      <path d="M24 4.5 43 12 24 19.5 5 12Z" fill={`url(#${cap})`} />
      <path d="M13 15.6v4.2c0 1.8 5 3.7 11 3.7s11-1.9 11-3.7v-4.2L24 19.9Z" fill="#2B2468" />
      {/* Tassel */}
      <path d="M38.5 13.8v8.4" stroke="#FFC940" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="38.5" cy="23.4" r="2" fill="#FFC940" />
      {/* Spark */}
      <path d="M43.5 2.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z" fill="#FFC940" />
    </svg>
  );
}

export function AiTutorWordmark({ light = false }) {
  return (
    <span
      className={`landing-display text-2xl font-bold transition-colors duration-500 sm:text-3xl ${light ? 'text-white' : 'text-[#1E2A55]'}`}
      style={{ textShadow: light ? '0 2px 0 rgba(30,42,85,0.35)' : 'none' }}
    >
      AI Tutor
    </span>
  );
}
