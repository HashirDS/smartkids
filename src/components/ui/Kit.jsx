import React, { useEffect, useState } from 'react';
import '../landing/landing.css';

// Small UI kit for the logged-in staff pages, matching the landing page:
// cream background, Fredoka headings, chunky rounded cards with a solid bottom edge.

export const Page = ({ title, subtitle, actions, children }) => (
  <div className="landing min-h-screen bg-[#FFF9EC]">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {(title || actions) && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            {title && <h1 className="landing-display text-3xl font-bold text-[#1E2A55] sm:text-4xl">{title}</h1>}
            {subtitle && <p className="mt-1 font-semibold text-[#4A5578]">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  </div>
);

export const Card = ({ className = '', color = '#fff', children }) => (
  <div className={`rounded-3xl p-5 ${className}`} style={{ backgroundColor: color, boxShadow: '0 6px 0 rgba(30,42,85,0.12)' }}>
    {children}
  </div>
);

const BUTTONS = {
  primary: 'bg-[#2EC26A] text-white shadow-[0_4px_0_#1B8A4A]',
  blue: 'bg-[#1E88FF] text-white shadow-[0_4px_0_#1565C0]',
  light: 'bg-[#EEF2FF] text-[#1E2A55] shadow-[0_3px_0_rgba(30,42,85,0.15)]',
  danger: 'bg-[#FFE3E6] text-[#C8283A] shadow-[0_3px_0_rgba(200,40,58,0.2)]',
};

export const Button = ({ variant = 'primary', className = '', type = 'button', ...props }) => (
  <button
    type={type}
    className={`rounded-full px-4 py-1.5 text-sm font-bold transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50 ${BUTTONS[variant]} ${className}`}
    {...props}
  />
);

// `group` renders a <fieldset> for several controls (e.g. a checkbox list) instead of one <label>.
export const Field = ({ label, hint, group = false, children }) => {
  const Tag = group ? 'fieldset' : 'label';
  const Title = group ? 'legend' : 'span';
  return (
    <Tag className="block">
      <Title className="text-sm font-bold text-[#1E2A55]">{label}</Title>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs font-semibold text-[#8A91AD]">{hint}</span>}
    </Tag>
  );
};

const inputClass = 'w-full rounded-2xl border-2 border-[#E6E1F5] bg-white px-3 py-2 font-semibold text-[#1E2A55] outline-none focus:border-[#1E88FF]';

export const Input = (props) => <input className={inputClass} {...props} />;

export const Select = ({ children, ...props }) => (
  <select className={inputClass} {...props}>{children}</select>
);

export const Badge = ({ color = '#EEF2FF', text = '#1E2A55', children }) => (
  <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: color, color: text }}>
    {children}
  </span>
);

export const Notice = ({ tone = 'info', children, onClose }) => {
  if (!children) return null;
  const tones = {
    info: 'bg-[#E0F1FF] text-[#1E2A55]',
    success: 'bg-[#DDF7E6] text-[#14683A]',
    error: 'bg-[#FFE3E6] text-[#A3202F]',
  };
  return (
    <div className={`mb-4 flex items-start justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold ${tones[tone]}`} role="status">
      <span>{children}</span>
      {onClose && (
        <button type="button" onClick={onClose} className="opacity-60 hover:opacity-100" aria-label="Dismiss">✕</button>
      )}
    </div>
  );
};

export const Tabs = ({ tabs, active, onChange }) => (
  <div className="mb-6 flex flex-wrap gap-2" role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        type="button"
        role="tab"
        aria-selected={active === tab.key}
        onClick={() => onChange(tab.key)}
        className={`landing-display rounded-full px-4 py-1.5 text-[15px] font-semibold transition ${
          active === tab.key
            ? 'bg-[#1E2A55] text-white shadow-[0_3px_0_rgba(30,42,85,0.35)]'
            : 'bg-white text-[#1E2A55] shadow-[0_3px_0_rgba(30,42,85,0.12)] hover:-translate-y-0.5'
        }`}
      >
        {tab.label}
        {tab.count != null && <span className="ml-1.5 opacity-70">{tab.count}</span>}
      </button>
    ))}
  </div>
);

export const Modal = ({ title, onClose, children, footer }) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    // `.landing` sits on the dialog, not the backdrop: its cream background would hide the dimmed page.
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1E2A55]/40 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="landing landing-pop max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 shadow-[0_10px_0_rgba(30,42,85,0.15)]"
        style={{ backgroundColor: '#fff' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="landing-display text-2xl font-bold text-[#1E2A55]">{title}</h2>
          <button type="button" onClick={onClose} className="text-xl text-[#8A91AD] hover:text-[#1E2A55]" aria-label="Close">✕</button>
        </div>
        {children}
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

export const EmptyState = ({ title, text, action }) => (
  <Card className="text-center">
    <p className="landing-display text-xl font-bold text-[#1E2A55]">{title}</p>
    {text && <p className="mt-1 font-semibold text-[#4A5578]">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </Card>
);

// Shows a login (username + password) once, with copy and print.
// `labels` lets parent pages show Login / Password / Copy / Print in Urdu or Arabic.
export const LoginCard = ({ title, name, login, note, labels = {} }) => {
  const L = { login: 'Login', password: 'Password', copy: 'Copy', copied: 'Copied!', print: 'Print', ...labels };
  const [copied, setCopied] = useState(false);
  const text = `${name ? `${name}\n` : ''}${L.login}: ${login.username}\n${L.password}: ${login.password}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="rounded-3xl border-2 border-dashed border-[#2EC26A] bg-[#F1FCF5] p-5">
      <p className="landing-display text-lg font-bold text-[#1E2A55]">{title}</p>
      {name && <p className="font-bold text-[#4A5578]">{name}</p>}
      <dl className="mt-3 space-y-1 font-mono text-sm text-[#1E2A55]">
        <div><dt className="inline font-sans font-bold">{L.login}: </dt><dd className="inline select-all" dir="ltr">{login.username}</dd></div>
        <div><dt className="inline font-sans font-bold">{L.password}: </dt><dd className="inline select-all" dir="ltr">{login.password}</dd></div>
      </dl>
      <p className="mt-3 text-xs font-bold text-[#A3202F]">{note || 'This password is shown only once. Copy or print it now.'}</p>
      <div className="mt-3 flex gap-2">
        <Button variant="blue" onClick={copy}>{copied ? L.copied : L.copy}</Button>
        <Button variant="light" onClick={() => window.print()}>{L.print}</Button>
      </div>
    </div>
  );
};
