import React from 'react';
import { Link } from 'react-router-dom';

// Each section after the hero gets its own pure color and a wavy top edge.
const sectionColors = {
  who: '#FFD23F',
  what: '#FFF9EC',
  demo: '#8B5CF6',
  benefits: '#1E88FF',
  how: '#FFF9EC',
  activities: '#2EC26A',
};

const Wave = ({ color }) => (
  <svg
    viewBox="0 0 1440 60"
    preserveAspectRatio="none"
    className="absolute -top-[39px] left-0 block h-10 w-full"
    aria-hidden="true"
  >
    <path d="M0 34C160 6 320 6 480 30s320 26 480 0 320-26 480 4v26H0Z" fill={color} />
  </svg>
);

const Section = ({ id, children, className = '' }) => (
  <section id={id} className={`relative py-16 lg:py-24 ${className}`} style={{ backgroundColor: sectionColors[id] }}>
    <Wave color={sectionColors[id]} />
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
  </section>
);

const SectionHeading = ({ title, subtitle, onColor = false }) => (
  <div className="mx-auto max-w-3xl text-center">
    <h2
      className={`landing-display text-4xl font-bold leading-tight sm:text-5xl ${
        onColor ? 'landing-outline text-white' : 'text-[#1E2A55]'
      }`}
    >
      {title}
    </h2>
    {subtitle && (
      <p className={`mt-4 text-lg font-semibold leading-relaxed ${onColor ? 'text-white' : 'text-[#4A5578]'}`}>
        {subtitle}
      </p>
    )}
  </div>
);

// Chunky "3D" card: solid fill with a darker bottom edge, like a toy block.
const Card = ({ color = '#fff', className = '', children }) => (
  <div
    className={`rounded-3xl p-6 ${className}`}
    style={{ backgroundColor: color, boxShadow: '0 8px 0 rgba(30,42,85,0.18)' }}
  >
    {children}
  </div>
);

/* ---------- Who it's for ---------- */

const audiences = [
  {
    accent: '#1E88FF',
    emoji: '🏫',
    title: 'Schools & kindergartens',
    text: 'Give every teacher an AI co-teacher, so each child gets individual practice even in a full classroom.',
    points: ['A dashboard for every class', 'Assign quizzes and practice papers', "Follow each student's progress"],
  },
  {
    accent: '#FF4F8B',
    emoji: '🎓',
    title: 'Academies & learning centers',
    text: 'Offer a modern early-learning program that children look forward to and parents notice.',
    points: ['3D avatars of your own teachers', 'Ready-made early-learning lessons', 'Admin tools for your team'],
  },
  {
    accent: '#2EC26A',
    emoji: '👨‍👩‍👧',
    title: 'Parents & families',
    text: 'Turn screen time into learning time with a cartoon tutor that is there whenever your child is.',
    points: ['Learn at home, at their own pace', 'Voice-first, so no reading is needed', 'See what your child has learned'],
  },
];

export const AudienceSection = () => (
  <Section id="who">
    <SectionHeading
      onColor
      title="Who it's for"
      subtitle="Whether you teach thirty children or one, AI Tutor gives every child the attention they need."
    />
    <div className="mt-12 grid gap-7 md:grid-cols-3">
      {audiences.map(({ accent, emoji, title, text, points }) => (
        <Card key={title}>
          <div className="text-4xl" aria-hidden="true">{emoji}</div>
          <h3 className="landing-display mt-3 text-2xl font-bold" style={{ color: accent }}>{title}</h3>
          <p className="mt-2 font-semibold leading-relaxed text-[#4A5578]">{text}</p>
          <ul className="mt-4 space-y-2">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 font-bold text-[#1E2A55]">
                <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                {point}
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  </Section>
);

/* ---------- What it is ---------- */

const features = [
  { color: '#FFE3E6', title: 'Talking cartoon teachers', text: 'Friendly animated teachers explain, react and cheer, just like a real teacher.' },
  { color: '#DDF0FF', title: 'Talk and listen', text: 'Children learn by speaking and listening, so they can start before they can read.' },
  { color: '#FFF1C7', title: 'Your own teacher avatar', text: 'Teachers upload a photo to create a 3D avatar, so a familiar face leads the lesson.' },
  { color: '#DDF7E6', title: 'Quizzes & practice papers', text: 'Assign quizzes and generate printable practice papers in a few clicks.' },
  { color: '#ECE4FF', title: 'Progress tracking', text: 'See what each child has mastered and what to work on next.' },
  { color: '#FFE0EE', title: 'Learning assistant', text: 'A built-in chat helper answers questions for children and grown-ups alike.' },
];

export const WhatSection = () => (
  <Section id="what">
    <SectionHeading
      title="What is AI Tutor?"
      subtitle="A web-based learning platform for early childhood. Cartoon teachers guide children through interactive lessons, while schools and parents get simple tools to assign work and follow progress."
    />
    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map(({ color, title, text }) => (
        <Card key={title} color={color}>
          <h3 className="landing-display text-2xl font-bold text-[#1E2A55]">{title}</h3>
          <p className="mt-2 font-semibold leading-relaxed text-[#4A5578]">{text}</p>
        </Card>
      ))}
    </div>
  </Section>
);

/* ---------- Free 3D classroom demo ---------- */

const ClassroomPreview = () => (
  <svg viewBox="0 0 480 320" className="h-auto w-full" role="img" aria-label="3D classroom preview">
    <defs>
      <linearGradient id="demo-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFD9B8" />
        <stop offset="1" stopColor="#F4B78E" />
      </linearGradient>
      <linearGradient id="demo-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#E8C9A6" />
        <stop offset="1" stopColor="#D2A77C" />
      </linearGradient>
    </defs>
    <rect width="480" height="320" rx="24" fill="url(#demo-wall)" />
    <path d="M0 236h480v60a24 24 0 0 1-24 24H24A24 24 0 0 1 0 296Z" fill="url(#demo-floor)" />
    {/* Board */}
    <rect x="130" y="46" width="220" height="130" rx="10" fill="#8A5A34" />
    <rect x="140" y="56" width="200" height="110" rx="6" fill="#23583F" />
    <text x="240" y="104" textAnchor="middle" fontFamily="Fredoka, Nunito, sans-serif" fontWeight="700" fontSize="30" fill="#fff">A B C</text>
    <text x="240" y="140" textAnchor="middle" fontFamily="Fredoka, Nunito, sans-serif" fontWeight="600" fontSize="18" fill="#FFD23F">Hello, friends!</text>
    {/* Window */}
    <rect x="378" y="56" width="74" height="96" rx="8" fill="#9ED8FF" stroke="#fff" strokeWidth="6" />
    <path d="M415 56v96M378 104h74" stroke="#fff" strokeWidth="5" />
    {/* Clock */}
    <circle cx="72" cy="78" r="24" fill="#fff" stroke="#1E2A55" strokeWidth="4" />
    <path d="M72 78V64M72 78l10 6" stroke="#1E2A55" strokeWidth="4" strokeLinecap="round" />
    {/* Teacher */}
    <g transform="translate(92 150)">
      <rect x="-16" y="40" width="32" height="54" rx="12" fill="#3D55C9" />
      <circle cx="0" cy="22" r="22" fill="#FFD6B8" />
      <path d="M-24 20c0-22 48-22 48 0 0-6-10-18-24-18S-24 14-24 20Z" fill="#3B2A22" />
      <circle cx="-8" cy="24" r="3" fill="#1E2A55" />
      <circle cx="8" cy="24" r="3" fill="#1E2A55" />
      <path d="M-6 32q6 6 12 0" fill="none" stroke="#1E2A55" strokeWidth="2.5" strokeLinecap="round" />
    </g>
    {/* Desks */}
    <rect x="200" y="226" width="110" height="16" rx="6" fill="#C9763F" />
    <rect x="330" y="226" width="110" height="16" rx="6" fill="#C9763F" />
    <path d="M210 242v48M300 242v48M340 242v48M430 242v48" stroke="#8A5A34" strokeWidth="8" strokeLinecap="round" />
    {/* Play button */}
    <circle cx="240" cy="200" r="34" fill="#FF4F5E" stroke="#fff" strokeWidth="5" />
    <path d="M230 184v32l26-16Z" fill="#fff" />
  </svg>
);

export const DemoSection = () => (
  <Section id="demo">
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div className="text-center lg:text-left">
        <h2 className="landing-display landing-outline text-4xl font-bold leading-tight text-white sm:text-5xl">
          Try our 3D classroom free
        </h2>
        <p className="mt-4 text-lg font-semibold leading-relaxed text-white">
          Step into a real 3D classroom and meet a talking 3D teacher. Type any question and watch the
          teacher answer out loud. No sign-up needed for the 3-minute demo.
        </p>
        <Link
          to="/try-classroom"
          className="landing-display mt-7 inline-block rounded-full bg-[#FFD23F] px-6 py-2 text-lg font-semibold text-[#1E2A55] shadow-[0_5px_0_#C99A00] transition hover:-translate-y-0.5"
        >
          Start free demo
        </Link>
      </div>
      <Link
        to="/try-classroom"
        className="block overflow-hidden rounded-3xl bg-white p-2 shadow-[0_8px_0_rgba(30,42,85,0.25)] transition hover:-translate-y-1"
        aria-label="Start the free 3D classroom demo"
      >
        <ClassroomPreview />
      </Link>
    </div>
  </Section>
);

/* ---------- How it helps kids learn ---------- */

const benefits = [
  { emoji: '🎈', title: 'Learning through play', text: 'Games, songs and drawing turn practice into something children ask for.' },
  { emoji: '🐢', title: 'At their own pace', text: 'The tutor never rushes and never tires of repeating, so every child takes their time.' },
  { emoji: '👀', title: 'See, hear and do', text: 'Cartoons, voice and hands-on activities together help new ideas stick.' },
  { emoji: '⭐', title: 'Confidence that grows', text: 'Warm cheers after every answer build a love of learning from day one.' },
];

export const BenefitsSection = () => (
  <Section id="benefits">
    <SectionHeading
      onColor
      title="How it helps kids learn"
      subtitle="Little learners need play, repetition and encouragement. AI Tutor gives them all three."
    />
    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {benefits.map(({ emoji, title, text }) => (
        <Card key={title} className="text-center">
          <div className="text-5xl" aria-hidden="true">{emoji}</div>
          <h3 className="landing-display mt-3 text-2xl font-bold text-[#1E88FF]">{title}</h3>
          <p className="mt-2 font-semibold leading-relaxed text-[#4A5578]">{text}</p>
        </Card>
      ))}
    </div>
  </Section>
);

/* ---------- How it works ---------- */

const steps = [
  { color: '#FF4F5E', title: 'Create an account', text: 'Sign up as a school, teacher or parent and add your learners.' },
  { color: '#FF8A1F', title: 'Pick a tutor', text: 'Choose a cartoon teacher, or create an avatar of a real teacher.' },
  { color: '#1E88FF', title: 'Start learning', text: 'Children explore lessons and activities by talking with their tutor.' },
  { color: '#8B5CF6', title: 'Track progress', text: 'Review results, assign quizzes and celebrate every milestone.' },
];

export const HowItWorksSection = () => (
  <Section id="how">
    <SectionHeading title="How it works" />
    <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {steps.map(({ color, title, text }, i) => (
        <li key={title}>
          <Card className="h-full">
            <span
              className="landing-display flex h-14 w-14 items-center justify-center rounded-2xl text-3xl font-bold text-white"
              style={{ backgroundColor: color, boxShadow: '0 5px 0 rgba(30,42,85,0.25)' }}
            >
              {i + 1}
            </span>
            <h3 className="landing-display mt-4 text-2xl font-bold" style={{ color }}>{title}</h3>
            <p className="mt-1.5 font-semibold leading-relaxed text-[#4A5578]">{text}</p>
          </Card>
        </li>
      ))}
    </ol>
  </Section>
);

/* ---------- Activities ---------- */

const activities = [
  { emoji: '🔤', color: '#FF4F5E', title: "ABC's", text: 'Learn the alphabet with talking, animated lessons.' },
  { emoji: '🔢', color: '#1E88FF', title: 'Numbers', text: 'Count, add and subtract with colorful number friends.' },
  { emoji: '🔺', color: '#FF8A1F', title: 'Shapes', text: 'Discover shapes through games and visuals.' },
  { emoji: '🎨', color: '#8B5CF6', title: 'Colors', text: 'Identify and name colors with playful activities.' },
  { emoji: '🖍️', color: '#FF4F8B', title: 'Drawing board', text: 'Free drawing for creativity and imagination.' },
  { emoji: '🎵', color: '#2EC26A', title: 'Poems', text: 'Fun poems to listen to and sing along with.' },
];

export const ActivitiesSection = () => (
  <Section id="activities" className="pb-20 lg:pb-28">
    <SectionHeading
      onColor
      title="What children learn"
      subtitle="The core early-years topics, taught by a tutor that makes every lesson feel like play."
    />
    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {activities.map(({ emoji, color, title, text }) => (
        <Card key={title} className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl"
            style={{ backgroundColor: color, boxShadow: '0 5px 0 rgba(30,42,85,0.25)' }}
            aria-hidden="true"
          >
            {emoji}
          </div>
          <div>
            <h3 className="landing-display text-2xl font-bold" style={{ color }}>{title}</h3>
            <p className="font-semibold leading-snug text-[#4A5578]">{text}</p>
          </div>
        </Card>
      ))}
    </div>
  </Section>
);

