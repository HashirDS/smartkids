import { create } from 'zustand';
import { API_URL, apiFetch } from '../api';

const FLASK_BASE_URL = API_URL;

// --- 🛠️ Teachers list (UNCHANGED) ---
export const teachers = ["female", "male", "rpm"];

// ✅ NEW (SAFE): valid TTS voices only
const VALID_TTS_TEACHERS = ["female", "male", "rpm"];

// --- Pre-defined lesson scripts (UNCHANGED) ---
const predefinedLessons = {
  abc: "Let's learn our ABCs! A, B, C, D,! say again A, B, C, D wow nice try can you want again !",
  fruits: "Let's Learn the Fruits Names!  Apples, Bananas, Oranges, and Grapes!",
  days: "Let's learn the days of the week! Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday."
};

export const useAITeacher = create((set, get) => ({
  messages: [],
  currentMessage: null,

  teacher: teachers[0],

  // 🔘 UPDATED (SAFE, MINIMAL)
  setTeacher: (teacher) => {
    const safeTeacher = VALID_TTS_TEACHERS.includes(teacher)
      ? teacher
      : "female"; // default, safe

    set(() => ({
      teacher: safeTeacher,
      messages: get().messages.map((message) => {
        message.audioPlayer = null;
        message.visemes = [];
        return message;
      }),
    }));
  },

  classroom: "default",
  setClassroom: (classroom) => set({ classroom }),

  loading: false,
  furigana: false,
  setFurigana: (furigana) => set({ furigana }),

  english: true,
  setEnglish: (english) => set({ english }),

  speech: "simple",
  setSpeech: (speech) => set({ speech }),

  // ------------------------------------------------
  // 🚀 Ask AI (UNCHANGED)
  // ------------------------------------------------
  askAI: async (question) => {
    if (!question) return;

    const message = { question, id: get().messages.length };
    set({ loading: true });

    try {
      const speechLevel = get().speech;

      const res = await apiFetch(
        `${FLASK_BASE_URL}/api/ai?question=${encodeURIComponent(question)}&speech=${speechLevel}`,
        { headers: { "Accept": "application/json" } }
      );

      if (!res.ok) {
        message.answer = { text: "Sorry, I had a problem thinking. Please try again!" };
        set({ loading: false, currentMessage: message, messages: [...get().messages, message] });
        get().playMessage(message);
        return;
      }

      const data = await res.json();
      message.answer = data;
      message.speech = speechLevel;

      set({
        currentMessage: message,
        messages: [...get().messages, message],
        loading: false,
      });

      get().playMessage(message);
    } catch (err) {
      console.error("AI Request Error:", err);
      set({ loading: false });
    }
  },

  // ------------------------------------------------
  // 🗣️ Play Message (UNCHANGED)
  // ------------------------------------------------
  playMessage: async (message) => {
    set({ currentMessage: message });

    if (!message.audioPlayer) {
      set({ loading: true });

      try {
        const textToSpeak = message.answer.text
          ? message.answer.text
          : message.answer.japanese.map((word) => word.word).join(" ");

        const audioRes = await apiFetch(
          `${FLASK_BASE_URL}/api/tts?teacher=${get().teacher}&text=${encodeURIComponent(textToSpeak)}`,
          { headers: { "Accept": "audio/mpeg" } }
        );

        if (!audioRes.ok) {
          set({ loading: false, currentMessage: null });
          return;
        }

        const visemesHeader = audioRes.headers.get("Visemes");
        let visemes = [];
        try {
          visemes = JSON.parse(visemesHeader || "[]");
        } catch {}

        const audioBlob = await audioRes.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioPlayer = new Audio(audioUrl);

        message.visemes = visemes;
        message.audioPlayer = audioPlayer;

        audioPlayer.onended = () => set({ currentMessage: null });

        set({
          loading: false,
          messages: get().messages.map((m) => (m.id === message.id ? message : m)),
        });
      } catch {
        set({ loading: false, currentMessage: null });
      }
    }

    if (message.audioPlayer) {
      message.audioPlayer.currentTime = 0;
      message.audioPlayer.play();
    }
  },

  // ------------------------------------------------
  // 🛑 Stop Message (UNCHANGED)
  // ------------------------------------------------
  stopMessage: (message) => {
    if (message.audioPlayer) {
      message.audioPlayer.pause();
      message.audioPlayer.currentTime = 0;
    }
    set({ currentMessage: null });
  },

  // ------------------------------------------------
  // 📚 Play Predefined Lesson (UNCHANGED)
  // ------------------------------------------------
  playPredefinedLesson: (lessonKey) => {
    const text = predefinedLessons[lessonKey];
    if (!text) return;

    if (get().currentMessage) {
      get().stopMessage(get().currentMessage);
    }

    const message = {
      id: lessonKey + Date.now(),
      question: `Play lesson: ${lessonKey}`,
      answer: {
        text,
        japanese: [{ word: text, reading: "" }],
        grammarBreakdown: [],
      },
      speech: "simple",
      audioPlayer: null,
      visemes: [],
    };

    get().playMessage(message);
  },
}));
