import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import LandingNavbar from '../landing/LandingNavbar';
import { apiFetch } from '../../api';
import { saveSession } from '../../auth';
import { useT } from '../../i18n';
import LanguageSwitch from '../ui/LanguageSwitch';
import { Button, Card, Field, Input, LoginCard, Notice } from '../ui/Kit';
import '../landing/landing.css';

const EMPTY = {
  first_name: '', last_name: '', email: '', phone: '', password: '',
  child_first_name: '', child_last_name: '', consent: false,
};

// /join: a parent signs up with the class code their school gave them.
// Step 1 checks the code, step 2 makes the parent + child accounts, step 3 shows the child's login.
const JoinPage = () => {
  const navigate = useNavigate();
  const { t, dir } = useT();
  const [params] = useSearchParams();
  const [code, setCode] = useState((params.get('code') || '').toUpperCase());
  const [found, setFound] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const checkCode = async (value = code) => {
    const clean = value.trim().toUpperCase();
    if (!clean) return;
    setBusy(true);
    setError('');
    try {
      const res = await apiFetch(`/api/join/${encodeURIComponent(clean)}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || 'We could not find that class code.');
      setCode(clean);
      setFound(body);
    } catch (e) {
      setFound(null);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (params.get('code')) checkCode(params.get('code'));
    // Only on first load, for links like /join?code=KG1-A7F3.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError(t('join.shortPassword'));
    if (!form.consent) return setError(t('join.needConsent'));
    setBusy(true);
    try {
      const res = await apiFetch('/api/join', { method: 'POST', body: JSON.stringify({ ...form, code }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || 'Something went wrong. Please try again.');
      saveSession(body);
      setDone(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const place = found && [found.class_name, found.level, found.school_name, found.school_city].filter(Boolean).join(' · ');

  return (
    <div className="landing min-h-screen">
      <title>Join your child's class | AI Tutor</title>
      <meta name="description" content="Parents: use the class code from your child's school to set up AI Tutor at home." />
      <LandingNavbar />
      <main className="px-4 py-10 sm:px-6 lg:py-14" dir={dir}>
        <div className="mx-auto max-w-xl">
          <LanguageSwitch className="mb-6 max-w-xs" />
          <h1 className="landing-display text-4xl font-bold text-[#1E2A55] sm:text-5xl">
            {done ? t('join.welcome', { name: done.first_name }) : t('join.title')}
          </h1>
          <p className="mt-2 text-lg font-semibold text-[#4A5578]">
            {done ? t('join.nowIn', { child: form.child_first_name, cls: done.class_name }) : t('join.intro')}
          </p>

          <div className="mt-6">
            <Notice tone="error" onClose={() => setError('')}>{error}</Notice>
          </div>

          {done ? (
            <div className="space-y-4">
              <LoginCard
                title={t('join.childLogin', { name: form.child_first_name })}
                login={done.child_login}
                note={t('join.childLoginNote')}
                labels={{ login: t('parent.login'), password: t('join.password'), copy: t('common.copy'), copied: t('common.copied'), print: t('common.print') }}
              />
              <Button onClick={() => navigate('/parent')}>{t('join.goParent')}</Button>
            </div>
          ) : (
            <Card>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  checkCode();
                }}
                className="flex flex-wrap items-end gap-2"
              >
                <div className="min-w-[180px] flex-1">
                  <Field label={t('join.classCode')}>
                    <Input
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setFound(null);
                      }}
                      placeholder="KG1-A7F3"
                      autoComplete="off"
                      maxLength={12}
                      dir="ltr"
                      required
                    />
                  </Field>
                </div>
                {!found && <Button type="submit" variant="blue" disabled={busy}>{busy ? t('join.checking') : t('join.find')}</Button>}
              </form>

              {found && (
                <>
                  <p className="mt-3 rounded-2xl bg-[#DDF7E6] px-4 py-2 text-sm font-bold text-[#14683A]">{place}</p>
                  <form onSubmit={submit} className="mt-5 space-y-4">
                    <p className="landing-display text-xl font-bold text-[#1E2A55]">{t('join.aboutYou')}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label={t('join.firstName')}><Input value={form.first_name} onChange={set('first_name')} autoComplete="given-name" required /></Field>
                      <Field label={t('join.lastName')}><Input value={form.last_name} onChange={set('last_name')} autoComplete="family-name" /></Field>
                    </div>
                    <Field label={t('join.email')} hint={t('join.emailHint')}>
                      <Input type="email" dir="ltr" value={form.email} onChange={set('email')} autoComplete="email" required />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label={t('join.phone')}><Input type="tel" dir="ltr" value={form.phone} onChange={set('phone')} autoComplete="tel" /></Field>
                      <Field label={t('join.password')} hint={t('join.passwordHint')}>
                        <Input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" minLength={8} required />
                      </Field>
                    </div>

                    <p className="landing-display pt-2 text-xl font-bold text-[#1E2A55]">{t('join.yourChild')}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label={t('join.firstName')}><Input value={form.child_first_name} onChange={set('child_first_name')} autoComplete="off" required /></Field>
                      <Field label={t('join.lastName')}><Input value={form.child_last_name} onChange={set('child_last_name')} autoComplete="off" /></Field>
                    </div>

                    <label className="flex items-start gap-2 text-sm font-semibold text-[#4A5578]">
                      <input type="checkbox" checked={form.consent} onChange={set('consent')} className="mt-1 h-4 w-4 accent-[#2EC26A]" />
                      <span>
                        {t('join.consentA')}{' '}
                        <Link to="/terms" className="font-bold text-[#1E88FF] underline">{t('join.terms')}</Link> {t('join.and')}{' '}
                        <Link to="/privacy" className="font-bold text-[#1E88FF] underline">{t('join.privacy')}</Link>.
                      </span>
                    </label>

                    <Button type="submit" disabled={busy}>{busy ? t('join.creating') : t('join.create')}</Button>
                  </form>
                </>
              )}
            </Card>
          )}

          {!done && (
            <p className="mt-6 text-sm font-semibold text-[#4A5578]">
              {t('join.haveAccount')} <Link to="/login" className="font-bold text-[#1E88FF]">{t('join.logIn')}</Link>{' '}
              {t('join.haveAccountTail')}
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default JoinPage;
