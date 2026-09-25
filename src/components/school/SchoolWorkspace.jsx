import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../api';
import { LEVELS, LESSONS, levelLabel } from '../../data/school';
import { Badge, Button, Card, EmptyState, Field, Input, LoginCard, Modal, Notice, Page, Select, Tabs } from '../ui/Kit';

const LEVEL_COLORS = { preschool: '#FFE0EE', nursery: '#DDF7E6', prep: '#E0F1FF', kg1: '#FFF1C7' };

// School workspace shared by the principal (/school), the admin (/school/:schoolId)
// and teachers (My Classes tab). The server decides what each role may see and change.
const SchoolWorkspace = ({ schoolId, embedded = false }) => {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState('classes');
  const [notice, setNotice] = useState(null);
  const [modal, setModal] = useState(null);
  const [login, setLogin] = useState(null);
  const [classFilter, setClassFilter] = useState('');

  const query = schoolId ? `?school_id=${encodeURIComponent(schoolId)}` : '';

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/school${query}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(body.message || 'Could not load the school.');
        return;
      }
      setLoadError('');
      setData(body);
    } catch {
      setLoadError('Could not reach the server.');
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const call = async (url, method = 'POST', body) => {
    const res = await apiFetch(url, {
      method,
      body: body ? JSON.stringify({ ...body, ...(schoolId ? { school_id: schoolId } : {}) }) : undefined,
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.message || 'Something went wrong.');
    return out;
  };

  const run = async (fn, successMessage) => {
    try {
      const out = await fn();
      setNotice({ tone: 'success', text: successMessage || out.message });
      setModal(null);
      await load();
      return out;
    } catch (e) {
      setNotice({ tone: 'error', text: e.message });
      return null;
    }
  };

  const isTeacher = data?.role === 'teacher';
  const classes = useMemo(() => data?.classes || [], [data]);
  const teachers = useMemo(() => data?.teachers || [], [data]);
  const students = useMemo(() => data?.students || [], [data]);
  const shownStudents = classFilter ? students.filter((s) => s.class_id === classFilter) : students;

  if (loadError) {
    const content = <EmptyState title="Nothing to show yet" text={loadError} />;
    return embedded ? content : <Page title="School">{content}</Page>;
  }
  if (!data) {
    const content = <p className="font-bold text-[#4A5578]">Loading school…</p>;
    return embedded ? content : <Page>{content}</Page>;
  }

  const tabs = [
    { key: 'classes', label: 'Classes', count: classes.length },
    ...(isTeacher ? [] : [{ key: 'teachers', label: 'Teachers', count: teachers.length }]),
    { key: 'students', label: 'Students', count: students.length },
    ...(isTeacher ? [] : [{ key: 'lessons', label: 'Lesson access' }]),
  ];

  const place = [data.school.city, data.school.country].filter(Boolean).join(', ');
  const header = embedded
    ? null
    : { title: data.school.name, subtitle: place || (data.school.is_default ? 'Accounts that are not in a school yet' : '') };

  const body = (
    <>
      {embedded && (
        <div className="mb-4">
          <h2 className="landing-display text-2xl font-bold text-[#1E2A55]">My classes · {data.school.name}</h2>
          <p className="font-semibold text-[#4A5578]">Share a class code with parents so they can add their child to your class.</p>
        </div>
      )}
      <Notice tone={notice?.tone} onClose={() => setNotice(null)}>{notice?.text}</Notice>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'classes' && (
        <ClassesTab
          classes={classes}
          canManage={!isTeacher}
          onAdd={() => setModal({ type: 'class' })}
          onEdit={(cls) => setModal({ type: 'class', item: cls })}
          onDelete={(cls) => window.confirm(`Delete class ${cls.name}?`) && run(() => call(`/api/school/classes/${cls._id}`, 'DELETE'))}
          onNewCode={(cls) => window.confirm('Make a new code? The old code will stop working.') && run(() => call(`/api/school/classes/${cls._id}/new-code`))}
          onAddStudent={(cls) => setModal({ type: 'student', item: { class_id: cls._id } })}
        />
      )}

      {tab === 'teachers' && !isTeacher && (
        <TeachersTab
          teachers={teachers}
          classes={classes}
          onAdd={() => setModal({ type: 'teacher' })}
          onRemove={(t) => window.confirm(`Remove ${t.first_name} from this school?`) && run(() => call(`/api/school/teachers/${t._id}`, 'DELETE'))}
        />
      )}

      {tab === 'students' && (
        <StudentsTab
          students={shownStudents}
          classes={classes}
          classFilter={classFilter}
          setClassFilter={setClassFilter}
          onAdd={() => setModal({ type: 'student', item: { class_id: classFilter || classes[0]?._id } })}
          onMove={(s) => setModal({ type: 'move', item: s })}
          onParent={(s) => setModal({ type: 'parent', item: s })}
          onReset={async (s) => {
            if (!window.confirm(`Make a new password for ${s.first_name}? The old one will stop working.`)) return;
            const out = await run(() => call(`/api/school/students/${s._id}/reset-password`));
            if (out?.login) setLogin({ title: 'New student login', name: `${s.first_name} ${s.last_name}`.trim(), login: out.login });
          }}
        />
      )}

      {tab === 'lessons' && !isTeacher && (
        <LessonsTab
          restricted={data.school.restricted_lessons || []}
          onSave={(list) => run(() => call('/api/school/lesson-restrictions', 'PUT', { restricted_lessons: list }), 'Lesson access saved.')}
        />
      )}

      {modal?.type === 'class' && (
        <ClassModal
          cls={modal.item}
          teachers={teachers}
          onClose={() => setModal(null)}
          onSave={(values) => run(() => (modal.item
            ? call(`/api/school/classes/${modal.item._id}`, 'PUT', values)
            : call('/api/school/classes', 'POST', values)))}
        />
      )}
      {modal?.type === 'teacher' && (
        <TeacherModal
          onClose={() => setModal(null)}
          onSave={async (values) => {
            const out = await run(() => call('/api/school/teachers', 'POST', values));
            if (out?.login) setLogin({ title: 'Teacher login', name: `${values.first_name} ${values.last_name}`.trim(), login: out.login });
          }}
        />
      )}
      {modal?.type === 'student' && (
        <StudentModal
          classes={classes}
          defaultClass={modal.item?.class_id}
          onClose={() => setModal(null)}
          onSave={async (values) => {
            const out = await run(() => call('/api/school/students', 'POST', values));
            if (out?.login) {
              setLogin({
                title: 'Student login', name: `${values.first_name} ${values.last_name}`.trim(), login: out.login,
                parent: out.parent_login, parentName: values.parent?.name, parentNote: out.parent_note,
              });
            }
          }}
        />
      )}
      {modal?.type === 'move' && (
        <MoveModal
          student={modal.item}
          classes={classes}
          onClose={() => setModal(null)}
          onSave={(classId) => run(() => call(`/api/school/students/${modal.item._id}`, 'PUT', { class_id: classId }), 'Student moved.')}
        />
      )}
      {modal?.type === 'parent' && (
        <ParentModal
          student={modal.item}
          onClose={() => setModal(null)}
          onSave={async (parent) => {
            const out = await run(() => call(`/api/school/students/${modal.item._id}`, 'PUT', { parent }),
              'Parent details saved.');
            if (out?.parent_login) setLogin({ parentOnly: true, parent: out.parent_login, parentName: parent.name });
            else if (out?.parent_note) setNotice({ tone: 'info', text: `Parent details saved. ${out.parent_note}` });
          }}
        />
      )}
      {login && (
        <Modal title="Account created" onClose={() => setLogin(null)} footer={<Button onClick={() => setLogin(null)}>Done</Button>}>
          <div className="space-y-4">
            {!login.parentOnly && <LoginCard title={login.title} name={login.name} login={login.login} />}
            {login.parent && (
              <LoginCard
                title="Parent login"
                name={login.parentName}
                login={login.parent}
                note="The parent logs in with this to see their child's progress and get the weekly email. Shown only once."
              />
            )}
            {login.parentNote && <p className="text-sm font-bold text-[#4A5578]">{login.parentNote}</p>}
          </div>
        </Modal>
      )}
    </>
  );

  return embedded ? body : <Page {...header}>{body}</Page>;
};

/* ---------------- Tabs ---------------- */

// Parents open this link to sign up straight into the class.
const CopyJoinLink = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/join?code=${code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link for parents:', `${window.location.origin}/join?code=${code}`);
    }
  };
  return (
    <button type="button" onClick={copy} className="mt-1 text-xs font-bold text-[#1E88FF] hover:underline">
      {copied ? 'Link copied' : 'Copy parent sign-up link'}
    </button>
  );
};

const ClassesTab = ({ classes, canManage, onAdd, onEdit, onDelete, onNewCode, onAddStudent }) => (
  <>
    {canManage && (
      <div className="mb-4">
        <Button onClick={onAdd}>Add class</Button>
      </div>
    )}
    {classes.length === 0 ? (
      <EmptyState
        title="No classes yet"
        text={canManage ? 'Create your first class, then add teachers and students.' : 'Your principal has not given you a class yet.'}
      />
    ) : (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <Card key={cls._id} color={LEVEL_COLORS[cls.level] || '#fff'}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="landing-display text-2xl font-bold text-[#1E2A55]">{cls.name}</h3>
                <Badge color="#fff">{levelLabel(cls.level)}</Badge>
              </div>
              <div className="text-right text-sm font-bold text-[#4A5578]">{cls.students} students</div>
            </div>
            <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3">
              <p className="text-xs font-bold uppercase text-[#8A91AD]">Class code</p>
              <p className="landing-display select-all text-2xl font-bold tracking-wider text-[#1E2A55]">{cls.code}</p>
              <CopyJoinLink code={cls.code} />
            </div>
            <p className="mt-3 text-sm font-semibold text-[#4A5578]">
              Teachers: {cls.teachers.length ? cls.teachers.join(', ') : 'none yet'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="blue" onClick={() => onAddStudent(cls)}>Add student</Button>
              <Button variant="light" onClick={() => onNewCode(cls)}>New code</Button>
              {canManage && <Button variant="light" onClick={() => onEdit(cls)}>Edit</Button>}
              {canManage && !cls.is_default && <Button variant="danger" onClick={() => onDelete(cls)}>Delete</Button>}
            </div>
          </Card>
        ))}
      </div>
    )}
  </>
);

const TeachersTab = ({ teachers, classes, onAdd, onRemove }) => {
  const classNames = (ids) => classes.filter((c) => ids.includes(c._id)).map((c) => c.name).join(', ') || 'No class yet';
  return (
    <>
      <div className="mb-4">
        <Button onClick={onAdd}>Add teacher</Button>
      </div>
      {teachers.length === 0 ? (
        <EmptyState title="No teachers yet" text="Add a teacher, then give them a class under Classes → Edit." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((t) => (
            <Card key={t._id}>
              <p className="landing-display text-xl font-bold text-[#1E2A55]">{`${t.first_name} ${t.last_name}`.trim()}</p>
              <p className="break-all text-sm font-semibold text-[#4A5578]">{t.email}</p>
              <p className="mt-2 text-sm font-bold text-[#1E2A55]">{classNames(t.class_ids)}</p>
              {t.restricted && <Badge color="#FFE3E6" text="#A3202F">Restricted</Badge>}
              <div className="mt-3">
                <Button variant="danger" onClick={() => onRemove(t)}>Remove from school</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

const StudentsTab = ({ students, classes, classFilter, setClassFilter, onAdd, onMove, onParent, onReset }) => (
  <>
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <Button onClick={onAdd} disabled={!classes.length}>Add student</Button>
      <div className="w-56">
        <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} aria-label="Filter by class">
          <option value="">All classes</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select>
      </div>
    </div>
    {students.length === 0 ? (
      <EmptyState title="No students here yet" text="Add a student, or share the class code with parents." />
    ) : (
      <div className="overflow-x-auto rounded-3xl bg-white shadow-[0_6px_0_rgba(30,42,85,0.12)]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[#FFF1C7] text-[#1E2A55]">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Parent</th>
              <th className="px-4 py-3">Learned</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id} className="border-t border-[#F3EFE6] align-top">
                <td className="px-4 py-3">
                  <p className="font-bold text-[#1E2A55]">{`${s.first_name} ${s.last_name}`.trim()}</p>
                  <p className="break-all text-xs font-semibold text-[#8A91AD]">{s.email}</p>
                  {s.joined_with_code && <Badge color="#E0F1FF">Joined with code</Badge>}
                </td>
                <td className="px-4 py-3 font-semibold text-[#4A5578]">{s.class_name || '—'}</td>
                <td className="px-4 py-3 font-semibold text-[#4A5578]">
                  {s.parent?.name || s.parent?.email || s.parent?.phone ? (
                    <>
                      <p className="font-bold text-[#1E2A55]">{s.parent.name}</p>
                      <p className="break-all">{s.parent.email}</p>
                      <p>{s.parent.phone}</p>
                      {s.has_parent_login && <Badge color="#DDF7E6" text="#14683A">Parent login</Badge>}
                    </>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 font-bold text-[#1E2A55]">{s.items_learned}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Button variant="light" onClick={() => onMove(s)}>Move</Button>
                    <Button variant="light" onClick={() => onParent(s)}>Parent</Button>
                    <Button variant="light" onClick={() => onReset(s)}>New password</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </>
);

const LessonsTab = ({ restricted, onSave }) => {
  const [list, setList] = useState(restricted);
  const toggle = (key) => setList((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  return (
    <Card>
      <p className="font-semibold text-[#4A5578]">Turn off lessons for every student in this school. Children see them as locked.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {LESSONS.map((lesson) => {
          const off = list.includes(lesson.key);
          return (
            <button
              key={lesson.key}
              type="button"
              onClick={() => toggle(lesson.key)}
              aria-pressed={off}
              className={`rounded-2xl px-3 py-3 text-left font-bold transition ${off ? 'bg-[#FFE3E6] text-[#A3202F]' : 'bg-[#DDF7E6] text-[#14683A]'}`}
            >
              {lesson.label}
              <span className="block text-xs">{off ? 'Off' : 'On'}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-5">
        <Button onClick={() => onSave(list)}>Save lesson access</Button>
      </div>
    </Card>
  );
};

/* ---------------- Modals ---------------- */

const ClassModal = ({ cls, teachers, onClose, onSave }) => {
  const [name, setName] = useState(cls?.name || '');
  const [level, setLevel] = useState(cls?.level || 'kg1');
  const [teacherIds, setTeacherIds] = useState(cls?.teacher_ids || []);
  const toggle = (id) => setTeacherIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  return (
    <Modal
      title={cls ? 'Edit class' : 'Add class'}
      onClose={onClose}
      footer={(
        <>
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ name, level, teacher_ids: teacherIds })} disabled={!name.trim()}>Save</Button>
        </>
      )}
    >
      <div className="space-y-4">
        <Field label="Class name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. KG1 Blue" maxLength={60} /></Field>
        <Field label="Level">
          <Select value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
          </Select>
        </Field>
        <Field group label="Teachers" hint={teachers.length ? '' : 'Add teachers first under the Teachers tab.'}>
          <div className="space-y-1.5">
            {teachers.map((t) => (
              <label key={t._id} className="flex items-center gap-2 font-semibold text-[#1E2A55]">
                <input type="checkbox" checked={teacherIds.includes(t._id)} onChange={() => toggle(t._id)} className="h-4 w-4" />
                {`${t.first_name} ${t.last_name}`.trim()}
              </label>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
};

const TeacherModal = ({ onClose, onSave }) => {
  const [values, setValues] = useState({ first_name: '', last_name: '', email: '' });
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  return (
    <Modal
      title="Add teacher"
      onClose={onClose}
      footer={(
        <>
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(values)} disabled={!values.email.trim()}>Add teacher</Button>
        </>
      )}
    >
      <p className="mb-4 text-sm font-semibold text-[#4A5578]">
        We create the account and show a temporary password once. If the email already has a teacher account, it simply joins your school.
      </p>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name"><Input value={values.first_name} onChange={set('first_name')} maxLength={60} /></Field>
          <Field label="Last name"><Input value={values.last_name} onChange={set('last_name')} maxLength={60} /></Field>
        </div>
        <Field label="Email"><Input type="email" value={values.email} onChange={set('email')} maxLength={254} /></Field>
      </div>
    </Modal>
  );
};

const ParentFields = ({ values, set }) => (
  <div className="space-y-4">
    <Field label="Parent / guardian name"><Input value={values.name} onChange={set('name')} maxLength={120} /></Field>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Parent email" hint="Weekly progress emails go here."><Input type="email" value={values.email} onChange={set('email')} maxLength={254} /></Field>
      <Field label="Parent phone"><Input type="tel" value={values.phone} onChange={set('phone')} maxLength={30} /></Field>
    </div>
  </div>
);

const StudentModal = ({ classes, defaultClass, onClose, onSave }) => {
  const [values, setValues] = useState({ first_name: '', last_name: '', class_id: defaultClass || classes[0]?._id || '' });
  const [parent, setParent] = useState({ name: '', email: '', phone: '' });
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const setP = (key) => (e) => setParent((v) => ({ ...v, [key]: e.target.value }));
  return (
    <Modal
      title="Add student"
      onClose={onClose}
      footer={(
        <>
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ ...values, parent })} disabled={!values.first_name.trim() || !values.class_id}>Add student</Button>
        </>
      )}
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Child's first name"><Input value={values.first_name} onChange={set('first_name')} maxLength={60} /></Field>
          <Field label="Child's last name"><Input value={values.last_name} onChange={set('last_name')} maxLength={60} /></Field>
        </div>
        <Field label="Class">
          <Select value={values.class_id} onChange={set('class_id')}>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name} ({levelLabel(c.level)})</option>)}
          </Select>
        </Field>
        <ParentFields values={parent} set={setP} />
        <p className="text-xs font-semibold text-[#8A91AD]">A child login and a simple password are created and shown once. With a parent email, the parent also gets their own login to follow progress.</p>
      </div>
    </Modal>
  );
};

const MoveModal = ({ student, classes, onClose, onSave }) => {
  const [classId, setClassId] = useState(student.class_id || classes[0]?._id || '');
  return (
    <Modal
      title={`Move ${student.first_name}`}
      onClose={onClose}
      footer={(
        <>
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(classId)}>Move</Button>
        </>
      )}
    >
      <Field label="New class">
        <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name} ({levelLabel(c.level)})</option>)}
        </Select>
      </Field>
    </Modal>
  );
};

const ParentModal = ({ student, onClose, onSave }) => {
  const [parent, setParent] = useState({ name: '', email: '', phone: '', ...(student.parent || {}) });
  const set = (key) => (e) => setParent((v) => ({ ...v, [key]: e.target.value }));
  return (
    <Modal
      title={`Parent of ${student.first_name}`}
      onClose={onClose}
      footer={(
        <>
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(parent)}>Save</Button>
        </>
      )}
    >
      <ParentFields values={parent} set={set} />
    </Modal>
  );
};

export default SchoolWorkspace;
