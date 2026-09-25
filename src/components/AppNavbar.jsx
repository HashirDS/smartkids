import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import AiTutorLogo, { AiTutorWordmark } from './landing/AiTutorLogo';
import { logout } from '../auth';
import './landing/landing.css';

// Navbar for the logged-in areas (student, teacher, admin), styled like the landing page.
// Tabs are plain text; Log out lives inside the ☰ menu so it is not pressed by accident.
const THEMES = {
  student: { bg: '#FFD23F', light: false, label: null },
  teacher: { bg: '#1E88FF', light: true, label: 'Teacher' },
  admin: { bg: '#8B5CF6', light: true, label: 'Admin' },
};

const TabButton = ({ tab, light, onDone }) => {
  const base = 'landing-display rounded-full px-3.5 py-1.5 text-[15px] font-semibold transition whitespace-nowrap';
  const tone = tab.active
    ? 'bg-white text-[#1E2A55] shadow-[0_3px_0_rgba(30,42,85,0.2)]'
    : light
      ? 'text-white hover:bg-white/20'
      : 'text-[#1E2A55] hover:bg-white/50';
  const className = `${base} ${tone}`;

  if (tab.to) {
    return <Link to={tab.to} className={className} onClick={onDone}>{tab.label}</Link>;
  }
  if (tab.href) {
    return <a href={tab.href} className={className} onClick={onDone}>{tab.label}</a>;
  }
  return (
    <button type="button" className={className} onClick={() => { tab.onClick?.(); onDone?.(); }}>
      {tab.label}
    </button>
  );
};

const DropdownTab = ({ tab, light }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const active = tab.items.some((item) => item.active);
  return (
    <div ref={ref} className="relative">
      <TabButton tab={{ label: `${tab.label} ▾`, active, onClick: () => setOpen((v) => !v) }} light={light} />
      {open && (
        <div className="landing-pop absolute left-0 top-full z-50 mt-3 w-48 rounded-2xl bg-white p-1.5 shadow-[0_8px_0_rgba(30,42,85,0.15),0_12px_30px_rgba(30,42,85,0.15)]">
          {tab.items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => { item.onClick(); setOpen(false); }}
              className={`block w-full rounded-xl px-3 py-2 text-left font-bold ${
                item.active ? 'bg-[#FFF1C7] text-[#1E2A55]' : 'text-[#1E2A55] hover:bg-[#F4F1FF]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AppNavbar = ({ role = 'student', tabs = [], fixed = false, homeTo, onHome, logoutTo = '/' }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const theme = THEMES[role] || THEMES.student;
  const firstName = localStorage.getItem('first_name') || '';
  const lastName = localStorage.getItem('last_name') || '';
  const fullName = `${firstName} ${lastName}`.trim();

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    if (!window.confirm('Do you want to log out?')) return;
    logout(navigate, logoutTo);
  };

  const brand = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_3px_0_rgba(30,42,85,0.2)]">
        <AiTutorLogo className="h-9 w-9" />
      </span>
      <AiTutorWordmark light={theme.light} />
      {theme.label && (
        <span className="landing-display ml-1 hidden rounded-full bg-white/25 px-2.5 py-0.5 text-sm font-semibold text-white sm:inline">
          {theme.label}
        </span>
      )}
    </>
  );

  return (
    <header
      className={`${fixed ? 'fixed left-0 right-0 top-0' : 'sticky top-0'} z-50`}
      style={{ backgroundColor: theme.bg, boxShadow: '0 4px 0 rgba(30,42,85,0.18)' }}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
        {onHome ? (
          <button type="button" onClick={onHome} className="flex items-center gap-2" aria-label="Home">{brand}</button>
        ) : (
          <Link to={homeTo || '/'} className="flex items-center gap-2" aria-label="Home">{brand}</Link>
        )}

        <div className="hidden items-center gap-1 md:flex">
          {tabs.map((tab) =>
            tab.items ? (
              <DropdownTab key={tab.key} tab={tab} light={theme.light} />
            ) : (
              <TabButton key={tab.key} tab={tab} light={theme.light} />
            )
          )}
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1E2A55] shadow-[0_3px_0_rgba(30,42,85,0.2)] transition hover:scale-105"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {menuOpen && (
            <div className="landing-pop absolute right-0 top-full mt-3 max-h-[80vh] w-64 overflow-y-auto rounded-3xl bg-white p-2 shadow-[0_8px_0_rgba(30,42,85,0.18),0_12px_30px_rgba(30,42,85,0.15)]">
              {fullName && (
                <p className="px-4 pb-2 pt-2 text-sm font-semibold text-[#6B7390]">
                  Signed in as <span className="font-bold text-[#1E2A55]">{fullName}</span>
                </p>
              )}

              {/* On small screens the tabs live here too */}
              <div className="md:hidden">
                {tabs.flatMap((tab) => (tab.items ? tab.items : [tab])).map((tab) => {
                  const cls = `block w-full rounded-2xl px-4 py-2 text-left font-bold ${
                    tab.active ? 'bg-[#FFF1C7] text-[#1E2A55]' : 'text-[#1E2A55] hover:bg-[#F4F1FF]'
                  }`;
                  if (tab.to) return <Link key={tab.key} to={tab.to} className={cls} onClick={() => setMenuOpen(false)}>{tab.label}</Link>;
                  if (tab.href) return <a key={tab.key} href={tab.href} className={cls}>{tab.label}</a>;
                  return (
                    <button key={tab.key} type="button" className={cls} onClick={() => { tab.onClick?.(); setMenuOpen(false); }}>
                      {tab.label}
                    </button>
                  );
                })}
                <div className="mx-3 my-2 border-t border-[#EEE9DD]" />
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mx-1 mb-1 mt-1 block w-[calc(100%-0.5rem)] rounded-full bg-[#FFE3E6] px-3 py-1.5 text-center text-sm font-bold text-[#C8283A] hover:bg-[#FFD3D8]"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default AppNavbar;
