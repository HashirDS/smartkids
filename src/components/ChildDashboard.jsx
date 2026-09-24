import React, { useEffect, useState } from 'react';
import DrawingBoard from './DrawingBoard';
import ChildNavbar from './ChildNavbar';
import DashboardHome from './DashboardHome';
import AbcLesson from './AbcLesson';
import NumLesson from './NumLesson';
import ShapesLesson from './ShapesLesson';
import ColorsLesson from './ColorsLesson';
import PoemsLesson from './PoemsLesson';
import FruitLesson from './FruitLesson';
import ChildQuiz from './ChildQuiz';
import { API_URL, apiFetch } from '../api';

const ChildDashboard = () => {
  const [activeContent, setActiveContent] = useState('home');
  const [restrictedLessons, setRestrictedLessons] = useState([]);

  // ===============================
  // FETCH RESTRICTED LESSONS
  // ===============================
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    apiFetch(`${API_URL}/api/user/lesson-access/${userId}`)
      .then(res => res.json())
      .then(data => {
        setRestrictedLessons(data.restricted_lessons || []);
      })
      .catch(() => {
        setRestrictedLessons([]);
      });
  }, []);

  // ===============================
  // CHECK IF LESSON IS RESTRICTED
  // ===============================
  const isRestricted = (lessonKey) => {
    return restrictedLessons.includes(lessonKey);
  };

  // ===============================
  // SAFE CONTENT SWITCH
  // ===============================
  const handleContentSelect = (contentKey) => {
    if (isRestricted(contentKey)) {
      alert(
        "🔒 This lesson is temporarily unavailable.\n\nPlease contact your teacher or parent."
      );
      setActiveContent("home");
      return;
    }
    setActiveContent(contentKey);
  };

  // ===============================
  // RENDER CONTENT
  // ===============================
  const renderContent = () => {
    // 🚫 Double safety: block even if forced
    if (isRestricted(activeContent)) {
      return <DashboardHome onSelectContent={handleContentSelect} />;
    }

    switch (activeContent) {
      case 'drawing':
        return (
          <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
            <DrawingBoard />
          </div>
        );
      case 'abc':
        return <AbcLesson />;
      case 'numbers':
        return <NumLesson />;
      case 'shapes':
        return <ShapesLesson />;
      case 'colors':
        return <ColorsLesson />;
      case 'poems':
        return (
          <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
            <PoemsLesson />
          </div>
        );
      case 'fruits':
        return <FruitLesson />;
      case 'quiz':
        return <ChildQuiz kind="recommendation" />;
      case 'quiz-teacher':
        return <ChildQuiz kind="teacher" />;
      case 'home':
      default:
        return <DashboardHome onSelectContent={handleContentSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navbar always visible */}
      <ChildNavbar
        onContentSelect={handleContentSelect}
        activeContent={activeContent}
        restrictedLessons={restrictedLessons} // optional (for icon/disable later)
      />

      <div className="pt-16">
        {renderContent()}
      </div>
    </div>
  );
};

export default ChildDashboard;
