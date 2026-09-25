import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';

const LABELS = {
  abc: 'ABC',
  numbers: 'Numbers',
  shapes: 'Shapes',
  colors: 'Colors',
  fruits: 'Fruits',
  flags: 'Flags',
  urdu: 'Urdu Alphabet',
  arabic: 'Arabic Qaida',
  islamic: 'Islamic Studies',
  science: 'Science',
  animals: 'Animals',
};

const formatWhen = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const AssignQuiz = ({ studentId }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!studentId) return;
    apiFetch(`/api/teacher/quiz-assignments/${studentId}`)
      .then((res) => res.json())
      .then((data) => {
        const next = data.suggestions || [];
        setSuggestions(next);
        setAssignments(data.assignments || []);
        setCategory((current) => current || next[0] || '');
      })
      .catch(() => setMessage('Could not load quiz assignments.'));
  };

  useEffect(() => {
    setCategory('');
    setMessage('');
    load();
  }, [studentId]);

  const assign = async () => {
    if (!category) return;
    setSaving(true);
    setMessage('');
    try {
      const response = await apiFetch('/api/teacher/assign-quiz', {
        method: 'POST',
        body: JSON.stringify({ user_id: studentId, category }),
      });
      const data = await response.json().catch(() => ({}));
      setMessage(data.message || (response.ok ? 'Quiz assigned.' : 'Could not assign the quiz.'));
      if (response.ok) load();
    } catch {
      setMessage('Could not assign the quiz.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
      <h4 className="text-lg font-bold text-gray-800 mb-2">Assign a quiz</h4>
      <p className="text-sm text-gray-600 mb-4">
        Suggested from finished lessons. A new student with no finished lesson cannot receive a quiz.
      </p>
      {suggestions.length === 0 ? (
        <p className="text-orange-700 font-medium">No lesson is finished yet, so there is no quiz to assign.</p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded-lg px-3 py-2 bg-white">
            {suggestions.map((item) => (
              <option key={item} value={item}>{LABELS[item] || item}</option>
            ))}
          </select>
          <button type="button" onClick={assign} disabled={saving} className="bg-purple-600 text-white font-bold px-4 py-2 rounded-lg disabled:opacity-50">
            {saving ? 'Assigning...' : 'Assign to this student'}
          </button>
        </div>
      )}
      {message && <p className="mt-3 text-sm font-medium text-gray-700">{message}</p>}
      {assignments.length > 0 && (
        <ul className="mt-4 space-y-2">
          {assignments.map((item) => (
            <li key={item._id} className="bg-white rounded-lg px-3 py-2 text-sm">
              <strong>{LABELS[item.category] || item.category}</strong>
              {item.status === 'completed'
                ? ` · Score ${item.score}/${item.total_questions} · Done ${formatWhen(item.completed_at)}`
                : ` · Assigned ${formatWhen(item.assigned_at)} · Waiting`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AssignQuiz;
