import React, { useCallback, useEffect, useState } from 'react';
import Navbar from '../Navbar';
import { apiFetch } from '../../api';
import { useT } from '../../i18n';
import { Badge, Button, Card, EmptyState, Field, Input, LoginCard, Modal, Notice, Page } from '../ui/Kit';

const CARD_COLORS = ['#FFF1C7', '#E0F1FF', '#FFE3EC', '#DDF7E6'];

const send = async (url, method = 'GET', body) => {
  const res = await apiFetch(url, { method, body: body ? JSON.stringify(body) : undefined });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.message || 'Something went wrong.');
  return out;
};

const lastSeen = (value, t) => {
  if (!value) return t('parent.notStarted');
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (Number.isNaN(days)) return '';
  if (days <= 0) return t('parent.activeToday');
  if (days === 1) return t('parent.activeYesterday');
  return t('parent.activeDaysAgo', { n: days });
};

const Stat = ({ value, label }) => (
  <div className="rounded-2xl bg-white/80 px-3 py-2">
    <p className="landing-display text-2xl font-bold text-[#1E2A55]">{value}</p>
    <p className="text-xs font-bold text-[#6B7390]">{label}</p>
  </div>
);

const ChildCard = ({ child, color, onNewPassword }) => {
  const { t, lang } = useT();
  const week = child.week || {};
  const learned = Object.entries(child.by_category || {}).filter(([, n]) => n > 0);
  const where = [child.class_name, child.level, child.school_name].filter(Boolean).join(' · ');

  return (
    <Card color={color}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="landing-display text-3xl font-bold text-[#1E2A55]">{child.first_name} {child.last_name}</h2>
          <p className="font-semibold text-[#4A5578]">{where}</p>
          {child.teachers?.length > 0 && (
            <p className="text-sm font-semibold text-[#6B7390]">{t('parent.teacher')}: {child.teachers.join(', ')}</p>
          )}
        </div>
        <Badge color="#fff">{lastSeen(child.last_activity, t)}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat value={child.stars} label={t('parent.stars')} />
        <Stat value={child.items_learned} label={t('parent.thingsLearned')} />
        <Stat
          value={week.speaking_tries ?? 0}
          label={`${t('parent.speakingWeek')}${week.speaking_accuracy != null ? ` · ${t('parent.clear', { n: week.speaking_accuracy })}` : ''}`}
        />
        <Stat
          value={week.quizzes ?? 0}
          label={`${t('parent.quizzesWeek')}${week.quiz_average != null ? ` · ${t('parent.average', { n: week.quiz_average })}` : ''}`}
        />
      </div>

      <div className="mt-4">
        <p className="text-sm font-bold text-[#1E2A55]">{t('parent.learnedSoFar')}</p>
        {learned.length ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {learned.map(([key, n]) => <Badge key={key} color="#fff">{t(`lessons.${key}`)} · {n}</Badge>)}
          </div>
        ) : (
          <p className="text-sm font-semibold text-[#6B7390]">{t('parent.nothingYet')}</p>
        )}
      </div>

      {child.recent_quizzes?.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-bold text-[#1E2A55]">{t('parent.recentQuizzes')}</p>
          <ul className="mt-1 space-y-1">
            {child.recent_quizzes.map((q) => (
              <li key={q.when + q.category} className="flex justify-between rounded-xl bg-white/70 px-3 py-1.5 text-sm font-semibold text-[#1E2A55]">
                <span>{t(`lessons.${q.category}`)}</span>
                <span dir="ltr">{q.score}/{q.total} · {new Date(q.when).toLocaleDateString(lang === 'en' ? undefined : `${lang}-PK`)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#1E2A55]/10 pt-3">
        <p className="text-sm font-semibold text-[#4A5578]">
          {t('parent.login')}: <span dir="ltr" className="select-all font-mono text-[#1E2A55]">{child.username}</span>
        </p>
        <Button variant="light" onClick={() => onNewPassword(child)}>{t('parent.newPassword')}</Button>
      </div>
    </Card>
  );
};

const AddChildModal = ({ onClose, onAdded }) => {
  const { t, dir } = useT();
  const [values, setValues] = useState({ code: '', child_first_name: '', child_last_name: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: key === 'code' ? e.target.value.toUpperCase() : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onAdded(await send('/api/parent/children', 'POST', values), values.child_first_name);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={t('parent.addChild')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3" dir={dir}>
        <Notice tone="error">{error}</Notice>
        <Field label={t('parent.classCode')} hint={t('parent.classCodeHint')}>
          <Input value={values.code} onChange={set('code')} placeholder="KG1-A7F3" maxLength={12} dir="ltr" required />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('parent.childFirst')}><Input value={values.child_first_name} onChange={set('child_first_name')} required /></Field>
          <Field label={t('parent.lastName')}><Input value={values.child_last_name} onChange={set('child_last_name')} /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="light" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={busy}>{busy ? t('parent.adding') : t('parent.addChild')}</Button>
        </div>
      </form>
    </Modal>
  );
};

// /parent: a parent's children, their progress, and email settings.
const ParentDashboard = () => {
  const { t, dir } = useT();
  const [data, setData] = useState(null);
  const [notice, setNotice] = useState(null);
  const [adding, setAdding] = useState(false);
  const [login, setLogin] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await send('/api/parent/children'));
    } catch (e) {
      setNotice({ tone: 'error', text: e.message });
      setData({ parent: {}, children: [] });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const newPassword = async (child) => {
    if (!window.confirm(t('parent.newPasswordConfirm', { name: child.first_name }))) return;
    try {
      const out = await send(`/api/parent/children/${child._id}/reset-password`, 'POST');
      setLogin({ title: t('parent.newLoginTitle', { name: child.first_name }), login: out.login });
    } catch (e) {
      setNotice({ tone: 'error', text: e.message });
    }
  };

  const toggleEmail = async () => {
    const weekly = !data.parent.weekly_email;
    try {
      await send('/api/parent/settings', 'PUT', { weekly_email: weekly });
      setData((d) => ({ ...d, parent: { ...d.parent, weekly_email: weekly } }));
      setNotice({ tone: 'success', text: weekly ? t('parent.emailOn') : t('parent.emailOff') });
    } catch (e) {
      setNotice({ tone: 'error', text: e.message });
    }
  };

  const firstName = data?.parent?.first_name || localStorage.getItem('first_name') || '';

  return (
    <>
      <Navbar />
      <div dir={dir}>
        <Page
          title={firstName ? t('parent.hello', { name: firstName }) : t('nav.myChildren')}
          subtitle={t('parent.subtitle')}
          actions={data && <Button variant="blue" onClick={() => setAdding(true)}>{t('parent.addChild')}</Button>}
        >
          <Notice tone={notice?.tone} onClose={() => setNotice(null)}>{notice?.text}</Notice>

          {login && (
            <div className="mb-6">
              <LoginCard
                title={login.title}
                login={login.login}
                labels={{ login: t('parent.login'), password: t('join.password'), copy: t('common.copy'), copied: t('common.copied'), print: t('common.print') }}
                note={t('join.childLoginNote')}
              />
              <Button variant="light" className="mt-2" onClick={() => setLogin(null)}>{t('common.done')}</Button>
            </div>
          )}

          {!data ? (
            <p className="font-bold text-[#4A5578]">{t('common.loading')}</p>
          ) : data.children.length === 0 ? (
            <EmptyState
              title={t('parent.noChildren')}
              text={t('parent.noChildrenText')}
              action={<Button onClick={() => setAdding(true)}>{t('parent.addChild')}</Button>}
            />
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {data.children.map((child, i) => (
                <ChildCard key={child._id} child={child} color={CARD_COLORS[i % CARD_COLORS.length]} onNewPassword={newPassword} />
              ))}
            </div>
          )}

          {data && (
            <Card className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="landing-display text-xl font-bold text-[#1E2A55]">{t('parent.weeklyEmail')}</p>
                  <p className="text-sm font-semibold text-[#4A5578]">{t('parent.weeklyEmailText', { email: data.parent.email })}</p>
                </div>
                <Button variant={data.parent.weekly_email ? 'light' : 'primary'} onClick={toggleEmail}>
                  {data.parent.weekly_email ? t('parent.turnOff') : t('parent.turnOn')}
                </Button>
              </div>
            </Card>
          )}
        </Page>
      </div>

      {adding && (
        <AddChildModal
          onClose={() => setAdding(false)}
          onAdded={(out, name) => {
            setAdding(false);
            setLogin({ title: t('parent.loginTitle', { name, cls: out.class_name }), login: out.child_login });
            load();
          }}
        />
      )}
    </>
  );
};

export default ParentDashboard;
