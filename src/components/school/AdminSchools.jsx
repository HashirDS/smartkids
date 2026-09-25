import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar';
import { apiFetch } from '../../api';
import { Badge, Button, Card, EmptyState, Field, Input, LoginCard, Modal, Notice, Page } from '../ui/Kit';

const EMPTY = { name: '', city: '', country: 'Pakistan', principal_first_name: '', principal_last_name: '', principal_email: '' };

// Admin: list, add, edit and delete schools. Each school opens its own workspace.
const AdminSchools = () => {
  const [schools, setSchools] = useState(null);
  const [notice, setNotice] = useState(null);
  const [modal, setModal] = useState(null);
  const [login, setLogin] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/schools');
      const body = await res.json().catch(() => []);
      if (!res.ok) throw new Error(body.message || 'Could not load schools.');
      setSchools(body);
    } catch (e) {
      setNotice({ tone: 'error', text: e.message });
      setSchools([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (url, method, body) => {
    const res = await apiFetch(url, { method, body: body ? JSON.stringify(body) : undefined });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.message || 'Something went wrong.');
    return out;
  };

  const save = async (values) => {
    try {
      if (modal?.school) {
        const out = await send(`/api/admin/schools/${modal.school._id}`, 'PUT', { name: values.name, city: values.city, country: values.country });
        setNotice({ tone: 'success', text: out.message });
      } else {
        const out = await send('/api/admin/schools', 'POST', values);
        setNotice({ tone: 'success', text: 'School created.' });
        setLogin({ name: `${values.principal_first_name} ${values.principal_last_name}`.trim(), login: out.login });
      }
      setModal(null);
      load();
    } catch (e) {
      setNotice({ tone: 'error', text: e.message });
    }
  };

  const remove = async (school) => {
    if (!window.confirm(`Delete ${school.name}? This also removes its principal account and classes.`)) return;
    try {
      const out = await send(`/api/admin/schools/${school._id}`, 'DELETE');
      setNotice({ tone: 'success', text: out.message });
      load();
    } catch (e) {
      setNotice({ tone: 'error', text: e.message });
    }
  };

  return (
    <>
      <Navbar />
      <Page
        title="Schools"
        subtitle="Add a school and its principal. The principal then adds classes, teachers and students."
        actions={<Button onClick={() => setModal({})}>Add school</Button>}
      >
        <Notice tone={notice?.tone} onClose={() => setNotice(null)}>{notice?.text}</Notice>
        {schools === null ? (
          <p className="font-bold text-[#4A5578]">Loading schools…</p>
        ) : schools.length === 0 ? (
          <EmptyState title="No schools yet" text="Add your first school to get started." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {schools.map((school) => (
              <Card key={school._id}>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="landing-display text-2xl font-bold text-[#1E2A55]">{school.name}</h2>
                  {school.is_default && <Badge color="#FFF1C7">Default</Badge>}
                </div>
                <p className="text-sm font-semibold text-[#4A5578]">{[school.city, school.country].filter(Boolean).join(', ') || '—'}</p>
                <p className="mt-2 text-sm font-semibold text-[#4A5578]">
                  Principal: <span className="font-bold text-[#1E2A55]">
                    {school.principal ? `${school.principal.first_name} ${school.principal.last_name}`.trim() : 'none'}
                  </span>
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[['Classes', school.classes, '#FFF1C7'], ['Teachers', school.teachers, '#E0F1FF'], ['Students', school.students, '#DDF7E6']].map(([label, value, color]) => (
                    <div key={label} className="rounded-2xl py-2" style={{ backgroundColor: color }}>
                      <p className="landing-display text-2xl font-bold text-[#1E2A55]">{value}</p>
                      <p className="text-xs font-bold text-[#4A5578]">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to={`/school/${school._id}`} className="rounded-full bg-[#1E88FF] px-4 py-1.5 text-sm font-bold text-white shadow-[0_4px_0_#1565C0]">Open</Link>
                  <Button variant="light" onClick={() => setModal({ school })}>Edit</Button>
                  {!school.is_default && <Button variant="danger" onClick={() => remove(school)}>Delete</Button>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Page>

      {modal && <SchoolModal school={modal.school} onClose={() => setModal(null)} onSave={save} />}
      {login && (
        <Modal title="Principal account created" onClose={() => setLogin(null)} footer={<Button onClick={() => setLogin(null)}>Done</Button>}>
          <LoginCard title="Principal login" name={login.name} login={login.login} />
        </Modal>
      )}
    </>
  );
};

const SchoolModal = ({ school, onClose, onSave }) => {
  const [values, setValues] = useState(school ? { ...EMPTY, ...school } : EMPTY);
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const valid = values.name.trim() && (school || (values.principal_first_name.trim() && values.principal_email.trim()));
  return (
    <Modal
      title={school ? 'Edit school' : 'Add school'}
      onClose={onClose}
      footer={(
        <>
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(values)} disabled={!valid}>{school ? 'Save' : 'Create school'}</Button>
        </>
      )}
    >
      <div className="space-y-4">
        <Field label="School name"><Input value={values.name} onChange={set('name')} maxLength={120} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City"><Input value={values.city} onChange={set('city')} maxLength={80} /></Field>
          <Field label="Country"><Input value={values.country} onChange={set('country')} maxLength={80} /></Field>
        </div>
        {!school && (
          <>
            <p className="landing-display pt-2 text-lg font-bold text-[#1E2A55]">Principal</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name"><Input value={values.principal_first_name} onChange={set('principal_first_name')} maxLength={60} /></Field>
              <Field label="Last name"><Input value={values.principal_last_name} onChange={set('principal_last_name')} maxLength={60} /></Field>
            </div>
            <Field label="Principal email" hint="A temporary password is created and shown once.">
              <Input type="email" value={values.principal_email} onChange={set('principal_email')} maxLength={254} />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
};

export default AdminSchools;
