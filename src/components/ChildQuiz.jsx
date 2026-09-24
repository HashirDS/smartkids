import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Mic, PencilLine } from 'lucide-react';
import { apiFetch } from '../api';

const QUIZZES = {
  abc: {
    title: 'ABC Quiz',
    questions: [
      { question: 'A is for...?', options: ['Apple', 'Ball', 'Cat', 'Dog'], answer: 'Apple' },
      { question: 'Which letter is B?', options: ['D', 'B', 'P', 'R'], answer: 'B' },
      { question: 'C is for...?', options: ['Sun', 'Cat', 'Moon', 'Tree'], answer: 'Cat' },
      { question: 'Which letter comes after A?', options: ['C', 'Z', 'B', 'M'], answer: 'B' },
    ],
  },
  numbers: {
    title: 'Numbers Quiz',
    questions: [
      { question: 'How many stars? ⭐⭐', options: ['1', '2', '3', '4'], answer: '2' },
      { question: 'What number is this? 5', options: ['3', '5', '8', '10'], answer: '5' },
      { question: 'What comes after 2?', options: ['1', '4', '3', '6'], answer: '3' },
      { question: 'Which is ten?', options: ['1', '7', '10', '4'], answer: '10' },
    ],
  },
  shapes: {
    title: 'Shapes Quiz',
    questions: [
      { question: 'Which shape is round?', options: ['Square', 'Triangle', 'Circle', 'Star'], answer: 'Circle' },
      { question: 'A square has how many sides?', options: ['3', '4', '5', '6'], answer: '4' },
      { question: 'Which shape has 3 sides?', options: ['Circle', 'Square', 'Triangle', 'Star'], answer: 'Triangle' },
      { question: 'Which one is a star?', options: ['⭐', '🔴', '🟦', '🔺'], answer: '⭐' },
    ],
  },
  colors: {
    title: 'Colors Quiz',
    questions: [
      { question: 'What color is a banana?', options: ['Blue', 'Yellow', 'Red', 'Black'], answer: 'Yellow' },
      { question: 'What color is the sky?', options: ['Green', 'Orange', 'Blue', 'Pink'], answer: 'Blue' },
      { question: 'What color is grass?', options: ['Green', 'Purple', 'White', 'Gray'], answer: 'Green' },
      { question: 'What color is an apple?', options: ['Red', 'Blue', 'Yellow', 'Black'], answer: 'Red' },
    ],
  },
  fruits: {
    title: 'Fruits Quiz',
    questions: [
      { question: 'Which one is a fruit?', options: ['Apple', 'Car', 'Shoe', 'Book'], answer: 'Apple' },
      { question: 'Which fruit is yellow and long?', options: ['Grapes', 'Banana', 'Apple', 'Cherry'], answer: 'Banana' },
      { question: 'Which fruit is a bunch of small rounds?', options: ['Mango', 'Banana', 'Grapes', 'Pear'], answer: 'Grapes' },
      { question: 'Which fruit is orange?', options: ['Blueberry', 'Orange', 'Kiwi', 'Apple'], answer: 'Orange' },
    ],
  },
};

const formatWhen = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const clean = (value) => String(value || '').toLowerCase().replace(/[.,!?]/g, '').trim();

const answerIsRight = (given, question) => {
  const heard = clean(given);
  const expected = clean(question.answer);
  if (!heard || !expected) return false;
  if (heard === expected) return true;
  const option = (question.options || []).find((item) => clean(item) === heard);
  if (option) return clean(option) === expected;
  return heard.length >= 3 && (heard.includes(expected) || expected.includes(heard));
};

const ChildQuiz = ({ kind = 'recommendation' }) => {
  const [recommendation, setRecommendation] = useState(null);
  const [teacherQuiz, setTeacherQuiz] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState('');
  const [written, setWritten] = useState('');
  const [listening, setListening] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(null);

  const loadAssignments = () => {
    setLoading(true);
    apiFetch('/api/quizzes/mine')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Could not load your quizzes.');
        setRecommendation(data.recommendation || null);
        setTeacherQuiz(data.teacher_quiz || null);
        setHistory(data.history || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAssignments();
    if (kind === 'teacher') {
      apiFetch('/api/quizzes/seen', { method: 'POST' }).catch(() => {});
    }
  }, [kind]);

  const builtQuiz = () => {
    if (kind === 'teacher' && teacherQuiz?.can_start) {
      const stored = teacherQuiz.questions || [];
      const fallback = QUIZZES[teacherQuiz.category];
      return {
        category: teacherQuiz.category,
        title: teacherQuiz.title || fallback?.title || 'Teacher quiz',
        questions: stored.length ? stored : (fallback?.questions || []),
      };
    }
    if (recommendation?.can_start && QUIZZES[recommendation.category]) {
      return { category: recommendation.category, ...QUIZZES[recommendation.category] };
    }
    return null;
  };

  const quiz = active
    ? { category: active.category, title: active.title, questions: active.questions }
    : null;
  const question = quiz?.questions[index];

  useEffect(() => {
    if (!question?.question || !window.speechSynthesis) return undefined;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question.question);
    utterance.rate = 0.85;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [question?.question, index]);

  const chooseAnswer = (option) => {
    if (!question || picked) return;
    const isCorrect = answerIsRight(option, question);
    const nextScore = correctCount + (isCorrect ? 1 : 0);
    setPicked(option);
    setCorrectCount(nextScore);
    const isLast = index + 1 >= quiz.questions.length;
    window.setTimeout(async () => {
      if (!isLast) {
        setIndex((current) => current + 1);
        setPicked('');
        setWritten('');
        return;
      }
      let message = 'Your score was saved.';
      try {
        const response = await apiFetch('/api/assessments/submit', {
          method: 'POST',
          body: JSON.stringify({
            category: active.category,
            questions: quiz.questions.map((item) => ({ question: item.question, correct: item.answer })),
            score: nextScore,
            total_questions: quiz.questions.length,
            percentage: Math.round((nextScore / quiz.questions.length) * 100),
            timeElapsed: 0,
            completedAt: new Date().toISOString(),
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          message = data.message || 'The score could not be saved.';
        }
      } catch {
        message = 'The score could not be saved.';
      }
      setFinished({ score: nextScore, total: quiz.questions.length, message, when: new Date().toISOString() });
      loadAssignments();
    }, 700);
  };

  if (finished) {
    return (
      <div className="max-w-xl mx-auto p-6 pt-20">
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-purple-800">{quiz?.title}</h2>
          <p className="text-5xl font-extrabold text-green-600 my-6">{finished.score}/{finished.total}</p>
          <p className="text-gray-600">Finished {formatWhen(finished.when)}</p>
          <p className="text-gray-500 mt-2">{finished.message}</p>
          <button type="button" onClick={() => { setFinished(null); setActive(null); }} className="mt-6 inline-flex items-center gap-2 bg-purple-600 text-white font-bold px-6 py-3 rounded-full">
            <RotateCcw className="w-4 h-4" />
            Back to my quizzes
          </button>
        </div>
      </div>
    );
  }

  if (active && question) {
    return (
      <div className="max-w-xl mx-auto p-6 pt-20">
        <p className="text-sm font-semibold text-purple-600 mb-2">{quiz.title} · Question {index + 1} of {quiz.questions.length}</p>
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{question.question}</h2>
          <div className="space-y-3">
            {(question.options || []).map((option) => {
              const showResult = Boolean(picked);
              const isAnswer = option === question.answer;
              const isPicked = option === picked;
              let style = 'bg-purple-50 text-purple-800 hover:bg-purple-100';
              if (showResult && isAnswer) style = 'bg-green-100 text-green-800';
              else if (showResult && isPicked) style = 'bg-red-100 text-red-800';
              return (
                <button key={option} type="button" disabled={showResult} onClick={() => chooseAnswer(option)} className={`w-full text-left font-bold px-4 py-3 rounded-2xl flex items-center justify-between ${style}`}>
                  {option}
                  {showResult && isAnswer && <CheckCircle2 className="w-5 h-5" />}
                  {showResult && isPicked && !isAnswer && <XCircle className="w-5 h-5" />}
                </button>
              );
            })}
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={Boolean(picked) || listening}
              onClick={() => {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SpeechRecognition) return;
                const recognition = new SpeechRecognition();
                recognition.lang = 'en-US';
                recognition.onstart = () => setListening(true);
                recognition.onend = () => setListening(false);
                recognition.onerror = () => setListening(false);
                recognition.onresult = (event) => {
                  const heard = event.results[0][0].transcript.replace(/[.,!?]/g, '').trim();
                  const match = (question.options || []).find((option) => clean(option) === clean(heard));
                  chooseAnswer(match || heard);
                };
                recognition.start();
              }}
              className="flex items-center justify-center gap-2 bg-pink-500 text-white font-bold px-4 py-3 rounded-2xl disabled:opacity-50"
            >
              <Mic className="w-5 h-5" />
              {listening ? 'Listening...' : 'Say the answer'}
            </button>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (written.trim()) chooseAnswer(written.trim());
              }}
            >
              <input
                value={written}
                onChange={(event) => setWritten(event.target.value)}
                placeholder="Write it"
                disabled={Boolean(picked)}
                className="flex-1 border-2 border-purple-200 rounded-2xl px-4 py-3 font-bold"
              />
              <button type="submit" disabled={Boolean(picked) || !written.trim()} className="bg-purple-600 text-white rounded-2xl px-4 disabled:opacity-50" aria-label="Send written answer">
                <PencilLine className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const readyQuiz = builtQuiz();

  return (
    <div className="max-w-3xl mx-auto p-6 pt-20">
      <h1 className="text-3xl font-bold text-purple-800 mb-2">{kind === 'teacher' ? 'Quiz from your teacher' : 'Recommended quiz'}</h1>
      <p className="text-gray-600 mb-6">Tap a picture, say the word, or write it. You do not pick the topic.</p>
      {loading && <p className="text-gray-500">Checking what you have learned...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !readyQuiz && (
        <div className="bg-white rounded-2xl shadow p-6 text-gray-600">
          {kind === 'teacher'
            ? 'Your teacher has not sent a quiz yet.'
            : 'Finish a lesson first. Your tutor will give you the matching quiz after that.'}
        </div>
      )}
      {readyQuiz && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800">{readyQuiz.title}</h2>
          <p className="text-purple-700 mt-2">{kind === 'teacher' ? 'Your teacher sent this one.' : recommendation?.reason}</p>
          <button type="button" onClick={() => { setActive(readyQuiz); setIndex(0); setPicked(''); setWritten(''); setCorrectCount(0); }} className="mt-5 bg-purple-600 text-white font-bold px-5 py-2 rounded-full">
            Start
          </button>
        </div>
      )}
      {history.length > 0 && (
        <ul className="mt-6 space-y-2 text-sm text-gray-700">
          {history.map((item, index) => (
            <li key={`${item.category}-${index}`} className="bg-white rounded-xl px-4 py-2">
              {QUIZZES[item.category]?.title || item.category}: {item.score}/{item.total_questions}
              {item.completed_at ? ` · ${formatWhen(item.completed_at)}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChildQuiz;
