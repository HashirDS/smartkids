import React from 'react';
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
        </div>

        <div className="md:text-right">
          <p className="font-bold text-white">Location</p>
          <p className="mt-1">STP, University of Kotli, AJK, Pakistan</p>
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
        <p className="mx-auto max-w-7xl px-4 py-3 text-center text-xs sm:px-6 md:text-left lg:px-8">
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
      </div>
    </footer>
  );
};

export default LandingFooter;
