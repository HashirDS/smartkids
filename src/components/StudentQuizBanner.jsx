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
  manual: 'Lesson quiz',
  ai: 'AI quiz',
  recommendation: 'Recommended quiz',
};

const StudentQuizBanner = ({ onOpen }) => {
  const [recommendation, setRecommendation] = useState(null);
  const [teacherQuiz, setTeacherQuiz] = useState(null);
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    apiFetch('/api/quizzes/mine')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        setRecommendation(data.recommendation || null);
        setTeacherQuiz(data.teacher_quiz || null);
        setNotice(data.notice || '');
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  const recommendationTitle = recommendation ? (LABELS[recommendation.category] || recommendation.category) : '';
  const teacherTitle = teacherQuiz ? (teacherQuiz.title || LABELS[teacherQuiz.category] || teacherQuiz.category) : '';

  return (
    <div className="mt-8 space-y-3">
      {notice && (
        <div className="rounded-2xl bg-pink-600 text-white px-5 py-3 font-bold shadow">
          {notice}
        </div>
      )}
      {recommendation?.can_start && (
        <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide">Recommendation</p>
            <h3 className="text-2xl font-extrabold">{recommendationTitle}</h3>
            <p className="text-sm mt-1">{recommendation.reason}</p>
          </div>
          <button type="button" onClick={() => onOpen('recommendation')} className="bg-white text-indigo-600 font-extrabold px-6 py-3 rounded-full shadow">
            Start quiz
          </button>
        </div>
      )}
      {teacherQuiz?.can_start && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide">{LABELS[teacherQuiz.source] || 'From your teacher'}</p>
            <h3 className="text-2xl font-extrabold">{teacherTitle}</h3>
            <p className="text-sm mt-1">Your teacher sent this quiz. Tap, say, or write the answer.</p>
          </div>
          <button type="button" onClick={() => onOpen('teacher')} className="bg-white text-orange-600 font-extrabold px-6 py-3 rounded-full shadow">
            Start quiz
          </button>
        </div>
      )}
      {!recommendation?.can_start && !teacherQuiz?.can_start && (
        <div className="rounded-2xl bg-white/80 text-purple-800 p-5 shadow">
          Finish a lesson first. Your quiz will show up here.
        </div>
      )}
    </div>
  );
};

export default StudentQuizBanner;
