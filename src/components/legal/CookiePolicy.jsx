import React from 'react';
import LegalLayout, { Section } from './LegalLayout';

const ROWS = [
  ['Login session (token, user ID, name, account type)', 'Keeps you signed in and opens the right dashboard.', 'Until you log out (the server session ends after 30 days)'],
  ['Free demo timer', 'Remembers when your free 3D classroom demo started.', '24 hours'],
  ['Cookie choice', 'Remembers your choice on the cookie notice.', 'Until you clear it'],
];

const CookiePolicy = () => (
  <LegalLayout
    title="Cookie Policy"
    description="The cookies and browser storage AI Tutor uses, and how to control them."
    intro="AI Tutor does not use advertising or tracking cookies. We only store the small amount of information the site needs to work, mostly in your browser's local storage, which works like a cookie."
  >
    <Section title="What we store">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-[#EEE9DD] text-[#1E2A55]">
              <th className="py-2 pr-3">Item</th>
              <th className="py-2 pr-3">Why</th>
              <th className="py-2">How long</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([item, why, time]) => (
              <tr key={item} className="border-b border-[#F3EFE6] align-top">
                <td className="py-2 pr-3 font-bold text-[#1E2A55]">{item}</td>
                <td className="py-2 pr-3">{why}</td>
                <td className="py-2">{time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>These items are strictly necessary, so the site does not ask for consent before using them.</p>
    </Section>

    <Section title="Third-party services">
      <p>
        Our pages load fonts from Google Fonts, which means your browser connects to Google and shares
        your IP address with it. We do not use analytics, advertising or social-media cookies. If we add
        any in the future, we will ask for your consent first and update this page.
      </p>
    </Section>

    <Section title="Controlling storage">
      <p>
        You can delete cookies and site data at any time in your browser settings. If you do, you will be
        logged out and the cookie notice will appear again.
      </p>
    </Section>
  </LegalLayout>
);

export default CookiePolicy;
