import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import AiTutorLogo, { AiTutorWordmark } from './AiTutorLogo';
import { sectionLinks } from './landingLinks';

// Navbar color for each section, chosen to contrast with that section's background.
const NAV_THEMES = {
  top: { bg: '#FFD23F', light: false },
  who: { bg: '#1E88FF', light: true },
  what: { bg: '#FF4F8B', light: true },
  demo: { bg: '#FFD23F', light: false },
  benefits: { bg: '#FFD23F', light: false },
  how: { bg: '#2EC26A', light: true },
  activities: { bg: '#8B5CF6', light: true },
};
const SECTION_IDS = Object.keys(NAV_THEMES);

const dashboardFor = (userType) => {
  if (userType === 'admin') return '/admin-dashboard';
  if (userType === 'teacher') return '/teacher-dashboard';
  return '/child-dashboard';
};

const LandingNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [current, setCurrent] = useState('top');
  const menuRef = useRef(null);
  const isLoggedIn = Boolean(localStorage.getItem('user'));
  const userType = localStorage.getItem('user_type');

  const closeMenu = () => setIsMenuOpen(false);

  // Track which section sits under the navbar.
  useEffect(() => {
    const update = () => {
      let active = 'top';
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 80) active = id;
      }
      setCurrent(active);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setIsMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isMenuOpen]);

  const theme = NAV_THEMES[current];
  const account = isLoggedIn
    ? { to: dashboardFor(userType), label: 'Go to dashboard' }
    : { to: '/login', label: 'Login / Sign up' };

  return (
    <header
      className="sticky top-0 z-40 transition-colors duration-500"
      style={{ backgroundColor: theme.bg, boxShadow: '0 4px 0 rgba(30,42,85,0.18)' }}
    >
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/#top" className="flex items-center gap-2" onClick={closeMenu} aria-label="AI Tutor home">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_3px_0_rgba(30,42,85,0.2)]">
            <AiTutorLogo className="h-10 w-10" />
          </span>
          <AiTutorWordmark light={theme.light} />
        </a>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-label="Proudly from Azad Jammu and Kashmir, Pakistan">
            <img src="/flags/ajk.svg" alt="Flag of Azad Jammu and Kashmir" title="Azad Jammu and Kashmir" className="h-4 w-6 rounded-[3px] object-cover shadow-[0_1px_2px_rgba(30,42,85,0.35)] sm:h-5 sm:w-7" />
            <img src="/flags/pk.svg" alt="Flag of Pakistan" title="Pakistan" className="h-4 w-6 rounded-[3px] object-cover shadow-[0_1px_2px_rgba(30,42,85,0.35)] sm:h-5 sm:w-7" />
          </div>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1E2A55] shadow-[0_3px_0_rgba(30,42,85,0.2)] transition hover:scale-105"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {isMenuOpen && (
              <div className="landing-pop absolute right-0 top-full mt-3 w-60 rounded-3xl bg-white p-2 shadow-[0_8px_0_rgba(30,42,85,0.18),0_12px_30px_rgba(30,42,85,0.15)]">
                {sectionLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="block rounded-2xl px-4 py-2 font-bold text-[#1E2A55] hover:bg-[#FFF1C7]"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="mx-3 my-2 border-t border-[#EEE9DD]" />
                <Link
                  to={account.to}
                  onClick={closeMenu}
                  className="landing-display mx-1 mb-1 block rounded-full bg-[#2EC26A] px-3 py-1.5 text-center text-base font-semibold text-white shadow-[0_4px_0_#1B8A4A]"
                >
                  {account.label}
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default LandingNavbar;
