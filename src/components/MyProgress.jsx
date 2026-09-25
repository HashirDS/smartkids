import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, UserCheck } from 'lucide-react';
import { API_URL, apiFetch } from '../api';

const QUIZ_LABELS = {
  abc: 'ABC',
  numbers: 'Numbers',
  shapes: 'Shapes',
  colors: 'Colors',
  fruits: 'Fruits',
};

const QUIZ_COLORS = {
  abc: 'from-red-400 to-rose-500',
  numbers: 'from-blue-400 to-indigo-500',
  shapes: 'from-amber-400 to-yellow-500',
  colors: 'from-purple-400 to-fuchsia-500',
  fruits: 'from-green-400 to-emerald-500',
};

const formatWhen = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

const CATEGORIES = [
  { key: 'abc', label: 'ABC', color: '#8884d8' },
  { key: 'numbers', label: 'Numbers', color: '#82ca9d' },
  { key: 'shapes', label: 'Shapes', color: '#ffc658' },
  { key: 'colors', label: 'Colors', color: '#ff8042' },
  { key: 'poems', label: 'Poems', color: '#8dd1e1' },
  { key: 'fruits', label: 'Fruits', color: '#d0ed57' },
  { key: 'flags', label: 'Flags', color: '#14b8a6' },
  { key: 'urdu', label: 'Urdu', color: '#1E88FF' },
  { key: 'arabic', label: 'Arabic Qaida', color: '#2EC26A' },
  { key: 'islamic', label: 'Islamic Studies', color: '#0F9D58' },
  { key: 'science', label: 'Science', color: '#8B5CF6' },
  { key: 'animals', label: 'Animals', color: '#FF8A3D' },
];

const MyProgress = () => {
  const [progress, setProgress] = useState(null);
  const [learned, setLearned] = useState([]);
  const [history, setHistory] = useState([]);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const firstName = localStorage.getItem('first_name') || 'there';

  useEffect(() => {
    apiFetch(`${API_URL}/api/progress/me`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Could not load progress.');
        setProgress(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    apiFetch('/api/quizzes/mine')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        setLearned(data.learned || []);
        setHistory(data.history || []);
      })
      .catch(() => {})
      .finally(() => setStatsLoaded(true));
  }, []);

  const chartData = useMemo(() => {
    const items = progress?.completed_items || {};
    return CATEGORIES.map((category) => ({
      name: category.label,
      Items: Array.isArray(items[category.key]) ? items[category.key].length : 0,
      fill: category.color,
    }));
  }, [progress]);

  const completedLists = useMemo(() => {
    const items = progress?.completed_items || {};
    return CATEGORIES
      .map((category) => ({
        ...category,
        items: Array.isArray(items[category.key]) ? items[category.key] : [],
      }))
      .filter((category) => category.items.length > 0);
  }, [progress]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/child-dashboard"
          className="inline-flex items-center gap-2 text-purple-700 font-semibold mb-6 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to lessons
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-green-600" />
            My Progress
          </h1>
          <p className="text-gray-600 mt-2">Hi {progress?.child_name || firstName}. Here is what you have finished.</p>

          {loading && <p className="mt-8 text-gray-500">Loading your progress...</p>}
          {error && <p className="mt-8 text-red-600">{error}</p>}

          {progress && (
            <>
              <p className="text-lg text-gray-700 mt-6">
                Total score:{' '}
                <span className="font-bold text-purple-600">{progress.total_score || 0}</span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-700 mb-3">Finished in each lesson</h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="Items" radius={[0, 5, 5, 0]}>
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-700 mb-3">What you completed</h2>
                  {completedLists.length > 0 ? (
                    <div className="space-y-3 max-h-[260px] overflow-y-auto border rounded-lg p-3 bg-gray-50">
                      {completedLists.map((category) => (
                        <div key={category.key}>
                          <strong style={{ color: category.color }} className="block border-b pb-1 mb-1">
                            {category.label} ({category.items.length})
                          </strong>
                          <p className="text-gray-600 break-words">{category.items.join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[260px] flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 text-center px-4">
                      Nothing finished yet. Open a lesson and say the words to earn a check.
                    </div>
                  )}
                </div>
              </div>

              <h2 className="text-lg font-semibold text-gray-700 mt-8 mb-3">Lesson stats</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {learned.filter((item) => item.lesson_count > 0).map((item) => (
                  <div key={item.category} className={`rounded-2xl text-white p-4 bg-gradient-to-br ${QUIZ_COLORS[item.category]} shadow-md`}>
                    <p className="font-extrabold text-lg">{QUIZ_LABELS[item.category]}</p>
                    <p className="text-sm">{item.lesson_count} learned</p>
                    <p className="text-sm">
                      {item.quiz_attempts > 0 ? `Quiz ${item.last_score}/${item.last_total}` : 'Quiz not taken'}
                    </p>
                    {item.speech_accuracy != null && (
                      <p className="text-sm">Speech {item.speech_accuracy}%</p>
                    )}
                  </div>
                ))}
              </div>
              {statsLoaded && learned.filter((item) => item.lesson_count > 0).length === 0 && (
                <p className="text-gray-500">No lesson finished yet.</p>
              )}

              {history.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">Past quizzes</h2>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {history.map((item, index) => (
                      <li key={`${item.category}-${item.completed_at}-${index}`}>
                        {QUIZ_LABELS[item.category] || item.category}: {item.score}/{item.total_questions}
                        {item.completed_at ? ` · ${formatWhen(item.completed_at)}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProgress;
