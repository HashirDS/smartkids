import React, { useRef, useState } from 'react';
import { AlertCircle, Loader2, Mic, Volume2, X, Star } from 'lucide-react';
import useProgressTracker from '../hooks/useProgressTracker';
import { apiFetch } from '../api';
import { FLAGS, flagSrc } from '../data/flags';

// Flags lesson: tap a flag to hear the country name, mark it learned,
// and practise saying it into the microphone (same flow as Colors).
const FlagsLesson = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const chunksRef = useRef([]);

  const isLoggedIn = Boolean(localStorage.getItem('user_id'));

  const {
    completedItems: completedFlags,
    isSubmitting,
    isLoading: isLoadingProgress,
    markItemAsComplete,
  } = useProgressTracker('flags');

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.pitch = 1.2;
    utterance.rate = 0.75;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleFlagClick = (flag) => {
    setSelected(flag);
    setFeedback(null);
    setLastResult(null);
    speakText(flag.name);
  };

  const handleMarkComplete = (flagName) => {
    markItemAsComplete(flagName, () => {
      speakText(`Great! You learned the flag of ${flagName}!`);
    });
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToBackend = async (blob, expectedText) => {
    setIsAnalyzing(true);
    setFeedback('Listening to you...');

    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');
    formData.append('expected_text', expectedText);
    formData.append('lesson_type', 'flags');

    try {
      const response = await apiFetch('/analyze_speech', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Server error');
      const result = await response.json();
      setLastResult(result);
      setFeedback(result.reward);
      setShowModal(true);

      if (result.accuracy >= 75 && selected && !completedFlags.has(selected.name)) {
        markItemAsComplete(selected.name);
      }
      if (result.reward_audio) {
        new Audio(`data:audio/mp3;base64,${result.reward_audio}`).play();
      } else {
        speakText(result.reward);
      }
    } catch {
      setFeedback('Could not reach the server. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startRecording = async () => {
    if (!selected) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        if (blob.size < 2000) {
          setFeedback('I did not hear anything. Speak a little louder!');
          return;
        }
        sendAudioToBackend(blob, selected.name);
      };
      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setFeedback(null);
      recordingTimerRef.current = setTimeout(() => {
        if (mediaRecorder.state === 'recording') stopRecording();
      }, 4000);
    } catch {
      setFeedback('Please allow microphone access to practise speaking.');
    }
  };

  const renderStars = (stars) => (
    <div className="flex justify-center gap-2">
      {[1, 2, 3].map((i) => (
        <Star key={i} className={`h-8 w-8 ${i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-teal-50 p-4 font-sans sm:p-8">
      <h1 className="mb-4 mt-10 text-center text-4xl font-extrabold text-teal-800 sm:text-5xl">
        Flags of the World
      </h1>
      <p className="mb-8 max-w-2xl px-2 text-center text-lg text-gray-700">
        Tap a flag to hear the country name, then press the mic and say it!
      </p>

      {!isLoggedIn && (
        <div className="mb-6 rounded-xl border border-yellow-400 bg-yellow-100 px-4 py-3 text-center text-yellow-800">
          <AlertCircle className="mr-2 inline h-5 w-5" />
          <strong>Note:</strong> Login to save your progress.
        </div>
      )}

      {!isLoadingProgress && (
        <div className="mb-6 grid w-full max-w-6xl grid-cols-2 gap-4 rounded-3xl bg-white p-4 shadow-2xl sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {FLAGS.map((flag) => {
            const isCompleted = completedFlags.has(flag.name);
            const isSelected = selected?.code === flag.code;
            return (
              <div
                key={flag.code}
                className={`group relative flex flex-col items-center justify-between rounded-xl bg-teal-50 p-3 shadow-md transition-all duration-300 hover:-translate-y-1
                  ${isCompleted ? 'ring-4 ring-green-500 ring-offset-2' : ''}
                  ${isSelected ? 'ring-4 ring-teal-500 ring-offset-2' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => handleFlagClick(flag)}
                  className="flex w-full flex-col items-center"
                  aria-label={`Hear ${flag.name}`}
                >
                  <img
                    src={flagSrc(flag.code)}
                    alt={`Flag of ${flag.name}`}
                    loading="lazy"
                    className="aspect-[4/3] w-full rounded-md border border-gray-200 object-cover shadow-sm"
                  />
                  <p className="mt-2 text-center text-sm font-bold leading-tight text-gray-800 sm:text-base">{flag.name}</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkComplete(flag.name)}
                  disabled={isCompleted || isSubmitting}
                  className={`mt-2 w-full rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm
                    ${isCompleted
                      ? 'bg-green-600 text-white'
                      : isSubmitting
                        ? 'cursor-not-allowed bg-gray-400 text-gray-800'
                        : 'bg-white text-gray-800 opacity-0 group-hover:opacity-100'}`}
                >
                  {isCompleted ? 'Done ✓' : 'Learned!'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="mb-6 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-800">Selected flag</h3>
            <button
              type="button"
              onClick={() => speakText(selected.name)}
              className="rounded-full bg-teal-100 p-2 transition-colors hover:bg-teal-200"
              aria-label="Hear it again"
            >
              <Volume2 className="h-5 w-5 text-teal-600" />
            </button>
          </div>
          <img
            src={flagSrc(selected.code)}
            alt={`Flag of ${selected.name}`}
            className="mx-auto mb-4 aspect-[4/3] w-48 rounded-lg border border-gray-200 object-cover shadow-lg"
          />
          <div className="text-center text-3xl font-semibold text-gray-700">{selected.name}</div>
        </div>
      )}

      <div className="mb-6 flex flex-col items-center space-y-4">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing || !selected}
          className={`flex items-center space-x-3 rounded-full px-8 py-4 text-lg font-bold text-white disabled:opacity-60
            ${isRecording
              ? 'scale-110 animate-pulse bg-red-500'
              : isAnalyzing
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:scale-105'}`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Mic className={`h-6 w-6 ${isRecording ? 'animate-pulse' : ''}`} />
              <span>{isRecording ? 'Recording...' : 'Press & Speak'}</span>
            </>
          )}
        </button>
      </div>

      {feedback && !showModal && (
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-4 text-white shadow-lg">
            <p>{feedback}</p>
          </div>
        </div>
      )}

      {showModal && lastResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
            <div className="text-center">
              {selected && (
                <img
                  src={flagSrc(selected.code)}
                  alt=""
                  className="mx-auto mb-4 aspect-[4/3] w-32 rounded-lg border border-gray-200 object-cover shadow"
                />
              )}
              <h2 className="mb-4 text-3xl font-bold text-gray-800">{lastResult.reward}</h2>
              {renderStars(lastResult.stars)}
              <div className="mt-4 space-y-2 rounded-xl bg-gray-100 p-4">
                <div className="flex justify-between">
                  <span>You said:</span>
                  <span className="font-bold">{lastResult.recognized_text}</span>
                </div>
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span className="font-bold text-teal-600">{lastResult.accuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Points:</span>
                  <span className="font-bold text-teal-600">+{lastResult.points_added}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  if (selected) speakText(selected.name);
                }}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 py-3 font-bold text-white"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {isSpeaking && (
        <div className="fixed bottom-8 right-8 animate-pulse rounded-full bg-teal-600 px-6 py-3 text-white shadow-lg">
          <Volume2 className="mr-2 inline h-5 w-5" /> Speaking...
        </div>
      )}
    </div>
  );
};

export default FlagsLesson;
