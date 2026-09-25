import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';

// Your existing components
import Homepage from './components/Homepage.jsx';
import LoginSignup from './components/LoginSignup.jsx';
import ChildDashboard from './components/ChildDashboard.jsx';
import TeacherDashboard from './components/TeacherDashboard.jsx';
import GeneralCharacter from './components/GeneralCharacter.jsx';
import TeachingInterface from './components/TeachingInterface.jsx';
import { Experience } from './components/Experience.jsx';
import VoiceEnabledWrapper from './components/voice/VoiceEnabledWrapper.jsx';
import PoemsLesson from './components/PoemsLesson.jsx';
import DrawingBoard from './components/DrawingBoard.jsx';
import AbcLesson from './components/AbcLesson.jsx';
import ShapesLesson from './components/ShapesLesson.jsx';
import NumLesson from './components/NumLesson.jsx';
import ColorsLesson from './components/ColorsLesson.jsx';
import FlagsLesson from './components/FlagsLesson.jsx';
import UrduLesson from './components/lessons/UrduLesson.jsx';
import ArabicLesson from './components/lessons/ArabicLesson.jsx';
import TopicLesson from './components/lessons/TopicLesson.jsx';
import AdminDashboard from "./components/AdminDashboard.jsx";
import MyProgress from "./components/MyProgress.jsx";
import WhatsAppButton from './components/WhatsAppButton.jsx';
import ClassroomDemo from './components/ClassroomDemo.jsx';
import CookieBanner from './components/CookieBanner.jsx';
import PrivacyPolicy from './components/legal/PrivacyPolicy.jsx';
import TermsOfService from './components/legal/TermsOfService.jsx';
import CookiePolicy from './components/legal/CookiePolicy.jsx';
import AdminSchools from './components/school/AdminSchools.jsx';
import SchoolPage from './components/school/SchoolPage.jsx';
import JoinPage from './components/parent/JoinPage.jsx';
import ParentDashboard from './components/parent/ParentDashboard.jsx';

function ProtectedRoute({ children, allow }) {
  const isLoggedIn = localStorage.getItem("user");
  const userType = localStorage.getItem("user_type");
  if (!isLoggedIn || !allow.includes(userType)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      {/* WhatsApp button (landing page only) and cookie notice (public pages only) */}
      <WhatsAppButton />
      <CookieBanner />

      <Routes>
        {/* Homepage & Auth */}
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginSignup />} />
        {/* Free 3D classroom demo (no login needed) */}
        <Route path="/try-classroom" element={<ClassroomDemo />} />
        {/* Legal pages */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/parent" element={<ProtectedRoute allow={["parent"]}><ParentDashboard /></ProtectedRoute>} />

        {/* Dashboards */}
        <Route
          path="/child-dashboard"
          element={
            <ProtectedRoute allow={["child", "teacher", "principal", "admin"]}>
              <VoiceEnabledWrapper>
                <ChildDashboard />
              </VoiceEnabledWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-progress"
          element={
            <ProtectedRoute allow={["child", "teacher", "principal", "admin"]}>
              <MyProgress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute allow={["teacher", "principal", "admin"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        {/* Characters & Teaching */}
        <Route
          path="/general-character"
          element={
            <ProtectedRoute allow={["child", "teacher", "principal", "admin"]}>
              <VoiceEnabledWrapper>
                <GeneralCharacter />
              </VoiceEnabledWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teaching"
          element={
            <ProtectedRoute allow={["child", "teacher", "principal", "admin"]}>
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
            <ProtectedRoute allow={["child", "teacher", "principal", "admin"]}>
              <Experience />
            </ProtectedRoute>
          }
        />

        {/* Learning Pages */}
        <Route path="/drawing-board" element={<ProtectedRoute allow={["child", "teacher", "principal", "admin"]}><DrawingBoard /></ProtectedRoute>} />
        <Route path="/poems-lesson" element={<ProtectedRoute allow={["child", "teacher", "principal", "admin"]}><PoemsLesson /></ProtectedRoute>} />
        <Route path="/abc-lesson" element={<ProtectedRoute allow={["child", "teacher", "principal", "admin"]}><AbcLesson /></ProtectedRoute>} />
        <Route path="/shapes-lesson" element={<ProtectedRoute allow={["child", "teacher", "principal", "admin"]}><ShapesLesson /></ProtectedRoute>} />
        <Route path="/num-lesson" element={<ProtectedRoute allow={["child", "teacher", "principal", "admin"]}><NumLesson /></ProtectedRoute>} />
        <Route path="/colors-lesson" element={<ProtectedRoute allow={["child", "teacher", "principal", "admin"]}><ColorsLesson /></ProtectedRoute>} />
        <Route path="/flags-lesson" element={<ProtectedRoute allow={["child", "teacher", "principal", "admin"]}><FlagsLesson /></ProtectedRoute>} />
        <Route path="/urdu-lesson" element={<ProtectedRoute allow={["child", "teacher", "principal", "admin"]}><UrduLesson /></ProtectedRoute>} />
        <Route path="/arabic-lesson" element={<ProtectedRoute allow={["child", "teacher", "principal", "admin"]}><ArabicLesson /></ProtectedRoute>} />
        {['islamic', 'science', 'animals'].map((lesson) => (
          <Route key={lesson} path={`/${lesson}-lesson`} element={<ProtectedRoute allow={["child", "teacher", "principal", "admin"]}><TopicLesson lesson={lesson} /></ProtectedRoute>} />
        ))}

        {/* Schools */}
        <Route path="/admin/schools" element={<ProtectedRoute allow={["admin"]}><AdminSchools /></ProtectedRoute>} />
        <Route path="/school" element={<ProtectedRoute allow={["principal"]}><SchoolPage /></ProtectedRoute>} />
        <Route path="/school/:schoolId" element={<ProtectedRoute allow={["admin"]}><SchoolPage /></ProtectedRoute>} />

        {/* Unknown addresses go back to the landing page instead of a blank screen */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;