import React from 'react';
import { useLocation } from 'react-router-dom';
import { isLoggedIn } from '../auth';

const WHATSAPP_URL = 'https://wa.me/923049111104';

export function WhatsAppIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}

// Floating WhatsApp contact button: landing page only, and only for visitors who are not logged in.
export default function WhatsAppButton() {
  const { pathname } = useLocation();
  if (pathname !== '/' || isLoggedIn()) return null;
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_5px_0_#128C7E,0_10px_24px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 md:bottom-6 md:right-6"
    >
      <WhatsAppIcon className="h-8 w-8" />
    </a>
  );
}
