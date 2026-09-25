import React, { useCallback, useEffect, useState } from 'react';
import Navbar from '../Navbar';
import { apiFetch } from '../../api';
import { Badge, Button, Card, EmptyState, Field, Input, LoginCard, Modal, Notice, Page } from '../ui/Kit';

const CATEGORY_LABELS = { abc: 'ABC', numbers: 'Numbers', shapes: 'Shapes', colors: 'Colours', fruits: 'Fruits', poems: 'Poems', flags: 'Flags' };
const CARD_COLORS = ['#FFF1C7', '#E0F1FF', '#FFE3EC', '#DDF7E6'];

const send = async (url, method = 'GET', body) => {
  const res = await apiFetch(url, { method, body: body ? JSON.stringify(body) : undefined });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.message || 'Something went wrong.');
  return out;
};

const lastSeen = (value) => {
  if (!value) return 'Not started yet';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (Number.isNaN(days)) return '';
  if (days <= 0) return 'Active today';
  if (days === 1) return 'Active yesterday';
  return `Last active ${days} days ago`;
};

const Stat = ({ value, label }) => (
  <div className="rounded-2xl bg-white/80 px-3 py-2">
    <p className="landing-display text-2xl font-bold text-[#1E2A55]">{value}</p>
    <p className="text-xs font-bold text-[#6B7390]">{label}</p>
  </div>
);

const ChildCard = ({ child, color, onNewPassword }) => {
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
            <p className="text-sm font-semibold text-[#6B7390]">Teacher: {child.teachers.join(', ')}</p>
          )}
        </div>
        <Badge color="#fff">{lastSeen(child.last_activity)}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat value={child.stars} label="Stars" />
        <Stat value={child.items_learned} label="Things learned" />
        <Stat
          value={week.speaking_tries ?? 0}
          label={`Speaking tries this week${week.speaking_accuracy != null ? ` · ${week.speaking_accuracy}% clear` : ''}`}
        />
        <Stat
          value={week.quizzes ?? 0}
          label={`Quizzes this week${week.quiz_average != null ? ` · avg ${week.quiz_average}%` : ''}`}
        />
      </div>

      <div className="mt-4">
        <p className="text-sm font-bold text-[#1E2A55]">Learned so far</p>
        {learned.length ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {learned.map(([key, n]) => <Badge key={key} color="#fff">{CATEGORY_LABELS[key] || key} · {n}</Badge>)}
          </div>
        ) : (
          <p className="text-sm font-semibold text-[#6B7390]">Nothing yet. ABC and Numbers are good first lessons.</p>
        )}
      </div>

      {child.recent_quizzes?.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-bold text-[#1E2A55]">Recent quizzes</p>
          <ul className="mt-1 space-y-1">
            {child.recent_quizzes.map((q) => (
              <li key={q.when + q.category} className="flex justify-between rounded-xl bg-white/70 px-3 py-1.5 text-sm font-semibold text-[#1E2A55]">
                <span>{CATEGORY_LABELS[q.category] || q.category}</span>
                <span>{q.score}/{q.total} · {new Date(q.when).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#1E2A55]/10 pt-3">
        <p className="text-sm font-semibold text-[#4A5578]">
          Login: <span className="select-all font-mono text-[#1E2A55]">{child.username}</span>
        </p>
        <Button variant="light" onClick={() => onNewPassword(child)}>New password</Button>
      </div>
    </Card>
  );
};

const AddChildModal = ({ onClose, onAdded }) => {
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
    <Modal title="Add a child" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Notice tone="error">{error}</Notice>
        <Field label="Class code" hint="Ask your child's school for the class code.">
          <Input value={values.code} onChange={set('code')} placeholder="KG1-A7F3" maxLength={12} required />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Child's first name"><Input value={values.child_first_name} onChange={set('child_first_name')} required /></Field>
          <Field label="Last name"><Input value={values.child_last_name} onChange={set('child_last_name')} /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add child'}</Button>
        </div>
      </form>
    </Modal>
  );
};

// /parent: a parent's children, their progress, and email settings.
const ParentDashboard = () => {
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
    if (!window.confirm(`Make a new password for ${child.first_name}? The old one will stop working.`)) return;
    try {
      const out = await send(`/api/parent/children/${child._id}/reset-password`, 'POST');
      setLogin({ title: `${child.first_name}'s new login`, login: out.login });
    } catch (e) {
      setNotice({ tone: 'error', text: e.message });
    }
  };

  const toggleEmail = async () => {
    const weekly = !data.parent.weekly_email;
    try {
      await send('/api/parent/settings', 'PUT', { weekly_email: weekly });
      setData((d) => ({ ...d, parent: { ...d.parent, weekly_email: weekly } }));
      setNotice({ tone: 'success', text: weekly ? 'Weekly email turned on.' : 'Weekly email turned off.' });
    } catch (e) {
      setNotice({ tone: 'error', text: e.message });
    }
  };

  const firstName = data?.parent?.first_name || localStorage.getItem('first_name') || '';

  return (
    <>
      <Navbar />
      <Page
        title={firstName ? `Hello, ${firstName}` : 'My children'}
        subtitle="See what your child is learning at AI Tutor."
        actions={data && <Button variant="blue" onClick={() => setAdding(true)}>Add a child</Button>}
      >
        <Notice tone={notice?.tone} onClose={() => setNotice(null)}>{notice?.text}</Notice>

        {login && (
          <div className="mb-6">
            <LoginCard title={login.title} login={login.login} />
            <Button variant="light" className="mt-2" onClick={() => setLogin(null)}>Done</Button>
          </div>
        )}

        {!data ? (
          <p className="font-bold text-[#4A5578]">Loading…</p>
        ) : data.children.length === 0 ? (
          <EmptyState
            title="No children linked yet"
            text="Add your child with the class code from their school."
            action={<Button onClick={() => setAdding(true)}>Add a child</Button>}
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
                <p className="landing-display text-xl font-bold text-[#1E2A55]">Weekly email</p>
                <p className="text-sm font-semibold text-[#4A5578]">
                  A short progress note every Sunday to {data.parent.email}.
                </p>
              </div>
              <Button variant={data.parent.weekly_email ? 'light' : 'primary'} onClick={toggleEmail}>
                {data.parent.weekly_email ? 'Turn off' : 'Turn on'}
              </Button>
            </div>
          </Card>
        )}
      </Page>

      {adding && (
        <AddChildModal
          onClose={() => setAdding(false)}
          onAdded={(out, name) => {
            setAdding(false);
            setLogin({ title: `${name}'s login (${out.class_name})`, login: out.child_login });
            load();
          }}
        />
      )}
    </>
  );
};

export default ParentDashboard;
