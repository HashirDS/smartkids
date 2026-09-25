import React, { useEffect } from 'react';
import LandingNavbar from '../landing/LandingNavbar';
import LandingFooter from '../landing/LandingFooter';
import '../landing/landing.css';

const LEGAL_UPDATED = '25 September 2026';

export const Section = ({ title, children }) => (
  <section className="mt-8">
    <h2 className="landing-display text-2xl font-bold text-[#1E2A55]">{title}</h2>
    <div className="mt-2 space-y-3 font-semibold leading-relaxed text-[#4A5578]">{children}</div>
  </section>
);

export const List = ({ items }) => (
  <ul className="list-disc space-y-1.5 pl-6">
    {items.map((item) => <li key={item}>{item}</li>)}
  </ul>
);

// Shared page frame for Privacy, Terms and Cookies.
const LegalLayout = ({ title, description, intro, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing min-h-screen">
      <title>{`${title} | AI Tutor`}</title>
      <meta name="description" content={description} />
      <LandingNavbar />
      <main className="px-4 py-12 sm:px-6 lg:py-16">
        <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-[0_8px_0_rgba(30,42,85,0.12)] sm:p-10">
          <h1 className="landing-display text-4xl font-bold text-[#1E2A55] sm:text-5xl">{title}</h1>
          <p className="mt-2 text-sm font-bold text-[#8A91AD]">Last updated: {LEGAL_UPDATED}</p>
          <p className="mt-5 text-lg font-semibold leading-relaxed text-[#4A5578]">{intro}</p>
          {children}
          <Section title="Contact us">
            <p>
              AI Tutor is a product of XactGen and Datix AI, STP, University of Kotli, Azad Jammu and
              Kashmir, Pakistan. Email{' '}
              <a href="mailto:contact@datixai.com" className="font-bold text-[#1E88FF] hover:underline">
                contact@datixai.com
              </a>
              .
            </p>
          </Section>
        </article>
      </main>
      <LandingFooter />
    </div>
  );
};

export default LegalLayout;
