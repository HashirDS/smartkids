import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

// Your existing components
import Homepage from './components/Homepage.jsx';
import LoginSignup from './components/LoginSignup.jsx';
import ChildDashboard from './components/ChildDashboard.jsx';
import TeacherDashboard from './components/TeacherDashboard.jsx';
import GeneralCharacter from './components/GeneralCharacter.jsx';
import TeachingInterface from './components/TeachingInterface.jsx';
import { Experience } from './components/Experience.jsx';
import WelcomeMessage from './components/WelcomeMessage.jsx';
import VoiceEnabledWrapper from './components/voice/VoiceEnabledWrapper.jsx';
import PoemsLesson from './components/PoemsLesson.jsx';
import DrawingBoard from './components/DrawingBoard.jsx';
import AbcLesson from './components/AbcLesson.jsx';
import ShapesLesson from './components/ShapesLesson.jsx';
import NumLesson from './components/NumLesson.jsx';
import ColorsLesson from './components/ColorsLesson.jsx';
import AdminDashboard from "./components/AdminDashboard.jsx";
import MyProgress from "./components/MyProgress.jsx";
import ChatBotIcon from './components/ChatBotIcon.jsx';
import ChatBotWindow from './components/ChatBotWindow.jsx';

function ProtectedRoute({ children, allow }) {
  const isLoggedIn = localStorage.getItem("user");
  const userType = localStorage.getItem("user_type");
  if (!isLoggedIn || !allow.includes(userType)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      {showWelcome && <WelcomeMessage />}

      {/* --- CHATBOT APPEARS ON ALL PAGES --- */}
      <ChatBotIcon onOpen={() => setIsChatOpen(true)} />
      {isChatOpen && <ChatBotWindow onClose={() => setIsChatOpen(false)} />}

      <Routes>
        {/* Homepage & Auth */}
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginSignup />} />

        {/* Dashboards */}
        <Route
          path="/child-dashboard"
          element={
            <ProtectedRoute allow={["child", "teacher", "admin"]}>
              <VoiceEnabledWrapper>
                <ChildDashboard />
              </VoiceEnabledWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-progress"
          element={
            <ProtectedRoute allow={["child", "teacher", "admin"]}>
              <MyProgress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute allow={["teacher", "admin"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        {/* Characters & Teaching */}
        <Route
          path="/general-character"
          element={
            <ProtectedRoute allow={["child", "teacher", "admin"]}>
              <VoiceEnabledWrapper>
                <GeneralCharacter />
              </VoiceEnabledWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teaching"
          element={
            <ProtectedRoute allow={["child", "teacher", "admin"]}>
              <VoiceEnabledWrapper>
                <TeachingInterface />
              </VoiceEnabledWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allow={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* AI Teacher */}
        <Route
          path="/ai-teacher"
          element={
            <ProtectedRoute allow={["child", "teacher", "admin"]}>
              <Experience />
            </ProtectedRoute>
          }
        />

        {/* Learning Pages */}
        <Route path="/drawing-board" element={<ProtectedRoute allow={["child", "teacher", "admin"]}><DrawingBoard /></ProtectedRoute>} />
        <Route path="/poems-lesson" element={<ProtectedRoute allow={["child", "teacher", "admin"]}><PoemsLesson /></ProtectedRoute>} />
        <Route path="/abc-lesson" element={<ProtectedRoute allow={["child", "teacher", "admin"]}><AbcLesson /></ProtectedRoute>} />
        <Route path="/shapes-lesson" element={<ProtectedRoute allow={["child", "teacher", "admin"]}><ShapesLesson /></ProtectedRoute>} />
        <Route path="/num-lesson" element={<ProtectedRoute allow={["child", "teacher", "admin"]}><NumLesson /></ProtectedRoute>} />
        <Route path="/colors-lesson" element={<ProtectedRoute allow={["child", "teacher", "admin"]}><ColorsLesson /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;