import React from 'react';

// Mithu: AI Tutor's original mascot, a friendly rose-ringed parakeet.
// Drawn in SVG with soft gradients for a rounded 3D-cartoon look.
// `talking` opens and closes the beak; idle motion (bob, blink, wing) is CSS.
const Mithu = ({ talking = false, className = '' }) => (
  <svg viewBox="0 0 300 340" className={`mithu ${talking ? 'mithu-talking' : ''} ${className}`} role="img" aria-label="Mithu the parrot">
    <defs>
      <radialGradient id="mithu-body" cx="38%" cy="28%" r="75%">
        <stop offset="0" stopColor="#9BF58A" />
        <stop offset="0.45" stopColor="#43D15A" />
        <stop offset="1" stopColor="#15913A" />
      </radialGradient>
      <radialGradient id="mithu-belly" cx="45%" cy="30%" r="70%">
        <stop offset="0" stopColor="#F2FFD6" />
        <stop offset="1" stopColor="#B4EE84" />
      </radialGradient>
      <linearGradient id="mithu-wing" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#3CCB4F" />
        <stop offset="1" stopColor="#0F7A32" />
      </linearGradient>
      <linearGradient id="mithu-tail" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#35D0C0" />
        <stop offset="1" stopColor="#127E8C" />
      </linearGradient>
      <radialGradient id="mithu-beak" cx="35%" cy="25%" r="80%">
        <stop offset="0" stopColor="#FF8A70" />
        <stop offset="1" stopColor="#E0262A" />
      </radialGradient>
      <radialGradient id="mithu-eye" cx="40%" cy="35%" r="70%">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#DDE6F3" />
      </radialGradient>
      <linearGradient id="mithu-branch" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#C98A4E" />
        <stop offset="1" stopColor="#8A5328" />
      </linearGradient>
      <filter id="mithu-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#1E2A55" floodOpacity="0.22" />
      </filter>
    </defs>

    {/* Branch */}
    <path d="M10 286c90-22 190-24 285-8" fill="none" stroke="url(#mithu-branch)" strokeWidth="18" strokeLinecap="round" />
    <path d="M245 280c14-18 32-22 44-18-8 14-26 22-44 18Z" fill="#3DDC84" />
    <path d="M40 282c-12-16-28-18-38-12 8 12 22 16 38 12Z" fill="#3DDC84" />

    <g className="mithu-bob" filter="url(#mithu-shadow)">
      {/* Tail */}
      <path d="M170 250c26 34 44 62 76 78-34 4-66-20-92-60Z" fill="url(#mithu-tail)" />
      <path d="M156 256c10 36 22 60 46 76-30-2-50-30-62-66Z" fill="#23B3A8" />

      {/* Feet */}
      <g fill="#F2A25C">
        <ellipse cx="128" cy="282" rx="13" ry="7" />
        <ellipse cx="170" cy="282" rx="13" ry="7" />
      </g>

      {/* Body */}
      <ellipse cx="150" cy="205" rx="72" ry="80" fill="url(#mithu-body)" />
      <ellipse cx="150" cy="222" rx="46" ry="54" fill="url(#mithu-belly)" />

      {/* Wing */}
      <g className="mithu-wing">
        <path d="M94 168c-38 18-40 82 6 98 18-24 22-70-6-98Z" fill="url(#mithu-wing)" />
        <path d="M84 214c6 14 12 26 22 36M78 196c8 16 16 30 30 40" fill="none" stroke="#0B6A2B" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      </g>
      <path d="M206 168c30 20 32 72-2 92-12-24-16-64 2-92Z" fill="url(#mithu-wing)" />

      {/* Head */}
      <g className="mithu-head">
        <path d="M140 52c2-22 18-30 30-24-10 4-14 12-12 22Z" fill="#43D15A" />
        <path d="M152 50c8-18 24-20 32-12-10 2-16 8-18 16Z" fill="#2FBF4A" />
        <circle cx="150" cy="112" r="64" fill="url(#mithu-body)" />

        {/* Rose ring */}
        <path d="M96 146q54 40 108 0" fill="none" stroke="#1E2A55" strokeWidth="5" strokeLinecap="round" />
        <path d="M98 153q52 38 104 0" fill="none" stroke="#FF5C9A" strokeWidth="6" strokeLinecap="round" />

        {/* Cheeks */}
        <ellipse cx="106" cy="130" rx="13" ry="8" fill="#FF8FB8" opacity="0.7" />
        <ellipse cx="194" cy="130" rx="13" ry="8" fill="#FF8FB8" opacity="0.7" />

        {/* Eyes */}
        <g className="mithu-eyes">
          <circle cx="126" cy="100" r="22" fill="url(#mithu-eye)" stroke="#1E2A55" strokeWidth="3" />
          <circle cx="174" cy="100" r="22" fill="url(#mithu-eye)" stroke="#1E2A55" strokeWidth="3" />
          <circle cx="131" cy="103" r="11" fill="#1E2A55" />
          <circle cx="169" cy="103" r="11" fill="#1E2A55" />
          <circle cx="135" cy="98" r="4.5" fill="#fff" />
          <circle cx="173" cy="98" r="4.5" fill="#fff" />
          <circle cx="128" cy="108" r="2" fill="#fff" opacity="0.8" />
          <circle cx="166" cy="108" r="2" fill="#fff" opacity="0.8" />
        </g>

        {/* Beak: mouth, lower jaw (moves when talking), upper beak */}
        <ellipse cx="150" cy="148" rx="11" ry="8" fill="#7A1B2E" />
        <path className="mithu-jaw" d="M137 142q13 20 26 0q-13 5-26 0Z" fill="#C21F2A" />
        <path d="M130 126q20-16 40 0q-4 22-20 30q-16-8-20-30Z" fill="url(#mithu-beak)" />
        <path d="M140 124q8-5 14-3" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      </g>
    </g>
  </svg>
);

export default Mithu;
