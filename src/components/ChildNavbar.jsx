import React from 'react';
import AppNavbar from './AppNavbar';
import { useT } from '../i18n';

const LESSONS = ['abc', 'numbers', 'shapes', 'colors', 'fruits', 'poems', 'drawing', 'flags', 'urdu', 'arabic', 'islamic', 'science', 'animals'];

// Student navbar: text tabs only; Log out and the language switch are inside the ☰ menu.
const ChildNavbar = ({ onContentSelect, activeContent }) => {
  const { t } = useT();
  const select = (id) => onContentSelect?.(id);

  const tabs = [
    { key: 'home', label: t('nav.home'), active: activeContent === 'home', onClick: () => select('home') },
    {
      key: 'lessons',
      label: t('nav.lessons'),
      items: LESSONS.map((id) => ({
        key: id,
        label: t(`lessons.${id}`),
        active: activeContent === id,
        onClick: () => select(id),
      })),
    },
    { key: 'ai-teacher', label: t('nav.teacher3d'), href: '/ai-teacher' },
    { key: 'rewards', label: t('nav.rewards'), active: activeContent === 'rewards', onClick: () => select('rewards') },
    { key: 'progress', label: t('nav.myProgress'), to: '/my-progress' },
  ];

  return <AppNavbar role="student" tabs={tabs} fixed onHome={() => select('home')} logoutTo="/" />;
};

export default ChildNavbar;
