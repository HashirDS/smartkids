import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import AiTutorLogo, { AiTutorWordmark } from './AiTutorLogo';
import { WhatsAppIcon } from '../WhatsAppButton';

const contactBtn =
  'inline-flex items-center gap-1 rounded-full border border-white/25 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-white/10';

const LandingFooter = () => {
  return (
    <footer className="relative z-10 bg-[#1E2A55] text-sm text-[#D5DBF0]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            <AiTutorLogo className="h-9 w-9" />
            <span className="text-xl"><AiTutorWordmark light /></span>
          </div>
          <p className="mt-3 leading-relaxed">
            AI Tutor helps young children learn letters, numbers, shapes and colors with friendly
            animated teachers, built for schools, academies and parents.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#AEB6D6]">
            Serving schools and families in Pakistan, Azad Jammu and Kashmir, Europe, the United States
            and Canada.
          </p>
        </div>

        <div className="md:text-right">
          <p className="font-bold text-white">Location</p>
          <div className="mt-1 flex items-center gap-2 md:justify-end">
            <img src="/flags/ajk.svg" alt="Flag of Azad Jammu and Kashmir" title="Azad Jammu and Kashmir" className="h-4 w-6 rounded-[3px] object-cover shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
            <img src="/flags/pk.svg" alt="Flag of Pakistan" title="Pakistan" className="h-4 w-6 rounded-[3px] object-cover shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
            <p>STP, University of Kotli, AJK, Pakistan</p>
          </div>
          <div className="mt-3 flex gap-2 md:justify-end">
            <a href="mailto:contact@datixai.com" className={contactBtn}>
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
            <a
              href="https://wa.me/923049111104"
              target="_blank"
              rel="noopener noreferrer"
              className={contactBtn}
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-3 text-xs sm:flex-row sm:px-6 lg:px-8">
          <p>
            A product of <span className="font-bold text-white">XactGen</span> and{' '}
            <a
              href="https://datixai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#FFC940] underline-offset-4 hover:underline"
            >
              Datix AI
            </a>
          </p>
          <nav aria-label="Legal" className="flex gap-4">
            <Link to="/privacy" className="hover:text-white hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white hover:underline">Terms &amp; Conditions</Link>
            <Link to="/cookies" className="hover:text-white hover:underline">Cookie Policy</Link>
            <Link to="/child-safety" className="hover:text-white hover:underline">Child Safety</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
