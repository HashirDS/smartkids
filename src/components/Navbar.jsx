import React from 'react';
import { useLocation } from 'react-router-dom';
import AppNavbar from './AppNavbar';

// Navbar for the teacher and admin areas: text tabs only; Log out is inside the ☰ menu.
const Navbar = () => {
  const { pathname } = useLocation();
  const role = localStorage.getItem('user_type') === 'admin' ? 'admin' : 'teacher';

  const tab = (key, label, to) => ({ key, label, to, active: pathname === to });
  const tabs = role === 'admin'
    ? [
        tab('admin', 'Admin', '/admin-dashboard'),
        tab('teacher', 'Teacher view', '/teacher-dashboard'),
        tab('student', 'Student view', '/child-dashboard'),
      ]
    : [
        tab('teacher', 'Dashboard', '/teacher-dashboard'),
        tab('student', 'Student view', '/child-dashboard'),
        { key: 'ai-teacher', label: '3D Teacher', href: '/ai-teacher' },
      ];

  return (
    <AppNavbar
      role={role}
      tabs={tabs}
      homeTo={role === 'admin' ? '/admin-dashboard' : '/teacher-dashboard'}
      logoutTo="/login"
    />
  );
};

export default Navbar;
