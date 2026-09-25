import React from 'react';
import AppNavbar from './AppNavbar';

const LESSONS = [
  { id: 'abc', label: 'ABC' },
  { id: 'numbers', label: 'Numbers' },
  { id: 'shapes', label: 'Shapes' },
  { id: 'colors', label: 'Colors' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'poems', label: 'Poems' },
  { id: 'drawing', label: 'Drawing' },
  { id: 'flags', label: 'Flags' },
];

// Student navbar: text tabs only; Log out is inside the ☰ menu.
const ChildNavbar = ({ onContentSelect, activeContent }) => {
  const select = (id) => onContentSelect?.(id);

  const tabs = [
    { key: 'home', label: 'Home', active: activeContent === 'home', onClick: () => select('home') },
    {
      key: 'lessons',
      label: 'Lessons',
      items: LESSONS.map((lesson) => ({
        key: lesson.id,
        label: lesson.label,
        active: activeContent === lesson.id,
        onClick: () => select(lesson.id),
      })),
    },
    { key: 'ai-teacher', label: '3D Teacher', href: '/ai-teacher' },
    { key: 'progress', label: 'My Progress', to: '/my-progress' },
  ];

  return <AppNavbar role="student" tabs={tabs} fixed onHome={() => select('home')} logoutTo="/" />;
};

export default ChildNavbar;
