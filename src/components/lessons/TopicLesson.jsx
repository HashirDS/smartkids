import React, { useEffect, useState } from 'react';
import useProgressTracker from '../../hooks/useProgressTracker';
import { speak, stopSpeaking } from '../../i18n/speak';
import { ISLAMIC_REVIEWED, TOPIC_LESSONS, itemCount } from '../../data/topics';
import { Button, Tabs } from '../ui/Kit';
import '../landing/landing.css';

// Islamic studies, Science and Animals: topic tabs with picture cards.
// Tap a card to hear it; "I learned it!" saves "<topic>:<id>" to progress.
const TopicLesson = ({ lesson }) => {
  const data = TOPIC_LESSONS[lesson];
  const [topicKey, setTopicKey] = useState(data.topics[0].key);
  const [playing, setPlaying] = useState(null);
  const isLoggedIn = Boolean(localStorage.getItem('user_id'));
  const { completedItems, isSubmitting, markItemAsComplete } = useProgressTracker(lesson);

  useEffect(() => () => stopSpeaking(), []);

  const topic = data.topics.find((t) => t.key === topicKey);
  const key = (item) => `${topic.key}:${item.id}`;

  const hear = (item) => {
    setPlaying(item.id);
    speak(item.say, 'en', { onEnd: () => setPlaying((p) => (p === item.id ? null : p)) });
  };

  const learnedInTopic = (t) => t.items.filter((item) => completedItems.has(`${t.key}:${item.id}`)).length;

  return (
    <div className="landing min-h-screen px-4 pb-16 pt-8 sm:px-6" dir="ltr" lang="en">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="landing-display text-4xl font-bold text-[#1E2A55] sm:text-5xl">{data.title}</h1>
            <p className="mt-1 font-semibold text-[#4A5578]">{data.subtitle}</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#1E2A55] shadow-[0_3px_0_rgba(30,42,85,0.12)]">
            {completedItems.size} of {itemCount(lesson)} learned
          </span>
        </div>

        {lesson === 'islamic' && !ISLAMIC_REVIEWED && localStorage.getItem('user_type') !== 'child' && (
          <p className="mb-4 rounded-2xl bg-[#E0F1FF] px-4 py-2 text-sm font-bold text-[#1E2A55]">
            For staff: this lesson is waiting for a scholar's review. You can turn it off in Lesson access until then.
          </p>
        )}

        {!isLoggedIn && (
          <p className="mb-4 rounded-2xl bg-[#FFF1C7] px-4 py-2 text-sm font-bold text-[#8A5A00]">Log in to save your progress.</p>
        )}

        <Tabs
          tabs={data.topics.map((t) => ({ key: t.key, label: t.label, count: `${learnedInTopic(t)}/${t.items.length}` }))}
          active={topicKey}
          onChange={(k) => {
            stopSpeaking();
            setTopicKey(k);
          }}
        />

        <p className="mb-4 text-lg font-bold text-[#4A5578]">{topic.intro}</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topic.items.map((item) => {
            const done = completedItems.has(key(item));
            return (
              <div
                key={item.id}
                className={`flex flex-col rounded-3xl p-4 transition ${playing === item.id ? 'ring-4 ring-[#FFD23F]' : ''}`}
                style={{ backgroundColor: done ? '#DDF7E6' : data.color, boxShadow: '0 6px 0 rgba(30,42,85,0.12)' }}
              >
                <button type="button" onClick={() => hear(item)} className="flex flex-1 items-start gap-3 text-left" aria-label={`Hear ${item.title}`}>
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-4xl shadow-[0_3px_0_rgba(30,42,85,0.1)]" aria-hidden="true">
                    {item.emoji}
                  </span>
                  <span>
                    <span className="landing-display block text-xl font-bold text-[#1E2A55]">{item.title}</span>
                    {item.arabic && <span className="font-arabic block text-2xl leading-[1.8] text-[#1E2A55]" dir="rtl" lang="ar">{item.arabic}</span>}
                    <span className="mt-1 block font-semibold text-[#4A5578]">{item.text}</span>
                  </span>
                </button>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="light" onClick={() => hear(item)}>Listen</Button>
                  <Button
                    onClick={() => markItemAsComplete(key(item), () => speak(`Well done! You learned ${item.title}.`, 'en'))}
                    disabled={done || isSubmitting || !isLoggedIn}
                  >
                    {done ? '✓ Learned' : 'I learned it!'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TopicLesson;
