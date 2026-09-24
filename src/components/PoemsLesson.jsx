import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

// ================== STYLE ==================
const style = {
  icon3D: {
    textShadow: '1px 1px 0 #fff, 2px 2px 0 #4ade80',
  },
  button3D: {
    boxShadow:
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06), 0 3px #10b981',
  },
};

// ================== POEMS ==================
const PREDEFINED_POEMS = [
  { title: '🌟 Select a Poem to Learn', text: '', language: 'en' },

  {
    title: '⭐ Twinkle Twinkle Little Star',
    text: `Twinkle, twinkle, little star,
How I wonder what you are!
Up above the world so high,
Like a diamond in the sky.`,
    language: 'en',
  },
  {
    title: '🐑 Baa Baa Black Sheep',
    text: `Baa, baa, black sheep,
Have you any wool?
Yes sir, yes sir,
Three bags full.`,
    language: 'en',
  },
  {
    title: '🌈 Rain Rain Go Away',
    text: `Rain, rain, go away,
Come again another day.
Little children want to play,
Rain, rain, go away.`,
    language: 'en',
  },
  {
    title: '🌞 The Morning Sun',
    text: `The sun comes up to start the day,
Giving light along the way.
Wake up, smile, and learn with fun,
A happy day has just begun.`,
    language: 'en',
  },
  {
    title: '🐦 Little Bird',
    text: `A little bird sings in the tree,
Happy, joyful, wild and free.
It flies around the bright blue sky,
Waving all the kids goodbye.`,
    language: 'en',
  },
  {
    title: '📚 Love to Learn',
    text: `I love books and I love school,
Learning things is really cool.
Read and write and try each day,
Knowledge helps me grow my way.`,
    language: 'en',
  },
  {
    title: '🧼 Good Habits',
    text: `Wash your hands and keep them clean,
Brush your teeth till they shine and gleam.
Say thank you, help, and share with care,
Good habits show how much we care.`,
    language: 'en',
  },
  {
    title: '🌍 My Country',
    text: `My country is my lovely home,
Where peace and kindness freely roam.
We learn, we grow, we help each other,
Together strong like sister, brother.`,
    language: 'en',
  },
];

// ================== COMPONENT ==================
const PoemsLesson = () => {
  const [topic, setTopic] = useState('');
  const [selectedPoemText, setSelectedPoemText] = useState('');
  const [poem, setPoem] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [speechSpeed, setSpeechSpeed] = useState(0.7);

  // ===== VOICE CONTROLS =====
  const [azureVoice, setAzureVoice] = useState('female');
  const [browserVoices, setBrowserVoices] = useState([]);
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState('');

  // ================= LOAD CHILD-FRIENDLY BROWSER VOICES =================
  useEffect(() => {
    if (!window.speechSynthesis) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();

      // ✅ FILTER: ONLY SOFT, CHILD-FRIENDLY ENGLISH VOICES
      const kidFriendly = voices.filter(v =>
        v.lang.startsWith('en') &&
        (
          v.name.toLowerCase().includes('google') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('karen') ||
          v.name.toLowerCase().includes('female')
        )
      );

      setBrowserVoices(kidFriendly);

      if (!selectedBrowserVoice && kidFriendly.length > 0) {
        setSelectedBrowserVoice(kidFriendly[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [selectedBrowserVoice]);

  // ================= GENERATE POEM =================
  const handleGeneratePoem = async () => {
    setError('');
    setPoem('');
    stopAudio();

    if (!topic.trim()) {
      setError('Please enter a topic.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetch('/generate-poem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, language: 'english' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPoem(data.poem);
    } catch {
      setError('Failed to generate poem.');
    } finally {
      setIsLoading(false);
    }
  };

  // ================= SELECT PREDEFINED =================
  const handleSelectPoem = (e) => {
    const selected = PREDEFINED_POEMS.find(p => p.title === e.target.value);
    stopAudio();

    if (selected && selected.text) {
      setPoem(selected.text);
      setSelectedPoemText(selected.title);
      setTopic('');
    } else {
      setPoem('');
      setSelectedPoemText('');
    }
  };

  // ================= AZURE TTS =================
  const handlePlayAzureTTS = async () => {
    if (!poem) {
      setError('Please select or generate a poem.');
      return;
    }

    stopAudio();
    setIsPlaying(true);
    setError('');

    try {
      const res = await apiFetch(
        `/api/tts?text=${encodeURIComponent(poem)}&teacher=${azureVoice}`
      );

      if (!res.ok) throw new Error();

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsPlaying(false);
        setCurrentAudio(null);
      };

      setCurrentAudio(audio);
    } catch {
      setError('Azure voice failed. Try device voice.');
      setIsPlaying(false);
    }
  };

  // ================= BROWSER TTS =================
  const handlePlayBrowserTTS = () => {
    if (!poem || !window.speechSynthesis) {
      setError('Browser TTS not supported.');
      return;
    }

    stopAudio();
    setError('');

    const utter = new SpeechSynthesisUtterance(poem);
    utter.rate = speechSpeed;
    utter.pitch = 1.1; // ✅ child-friendly tone

    const voice = browserVoices.find(v => v.name === selectedBrowserVoice);
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    }

    utter.onstart = () => setIsPlaying(true);
    utter.onend = () => setIsPlaying(false);

    window.speechSynthesis.speak(utter);
    setCurrentAudio({ type: 'browser' });
  };

  const stopAudio = () => {
    if (currentAudio) {
      if (currentAudio.type === 'browser') {
        window.speechSynthesis.cancel();
      } else {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }
    setIsPlaying(false);
    setCurrentAudio(null);
  };

  // ================= UI =================
  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-100 to-green-100">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">

        <h1 className="text-3xl font-bold text-center mb-4">
          <span style={style.icon3D}>📚</span> Poems
        </h1>

        <select
          className="w-full p-4 mb-4 border rounded-lg"
          value={selectedPoemText}
          onChange={handleSelectPoem}
        >
          {PREDEFINED_POEMS.map(p => (
            <option key={p.title} value={p.title} disabled={!p.text}>
              {p.title}
            </option>
          ))}
        </select>

        <textarea
          className="w-full p-4 border rounded-lg mb-4"
          rows="4"
          placeholder="Enter topic to generate poem"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <button
          onClick={handleGeneratePoem}
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-3 rounded-lg mb-4 font-semibold"
          style={style.button3D}
        >
          {isLoading ? 'Generating...' : 'Generate Poem'}
        </button>

        {error && <div className="text-red-600 text-center mb-4">{error}</div>}

        {poem && (
          <>
            <div className="p-4 bg-gray-50 rounded-lg mb-4 whitespace-pre-wrap font-serif text-lg leading-relaxed">
              {poem}
            </div>

            {/* VOICE CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="font-bold block mb-1">Voice-1</label>
                <select
                  className="w-full border p-2 rounded"
                  value={azureVoice}
                  onChange={e => setAzureVoice(e.target.value)}
                >
                  <option value="female">Female (Jenny)</option>
                  <option value="male">Male (Guy)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1"> Voice-2</label>
                <select
                  className="w-full border p-2 rounded"
                  value={selectedBrowserVoice}
                  onChange={e => setSelectedBrowserVoice(e.target.value)}
                >
                  {browserVoices.map(v => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={handlePlayAzureTTS}
                disabled={isPlaying}
                className="bg-green-500 text-white px-4 py-2 rounded-lg"
              >
                🔊 Smart Voice
              </button>

              <button
                onClick={handlePlayBrowserTTS}
                disabled={isPlaying}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
              >
                🗣 Device Voice
              </button>

              {isPlaying && (
                <button
                  onClick={stopAudio}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                  ⏹ Stop
                </button>
              )}
            </div>

            <div className="mt-4">
              <label className="block font-bold mb-1">
                🐢 Speed: {(speechSpeed * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.1"
                value={speechSpeed}
                onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PoemsLesson;
