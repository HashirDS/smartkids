import React from 'react';
import { useLocation } from 'react-router-dom';
import AppNavbar from './AppNavbar';
import { useT } from '../i18n';

const HOME = { admin: '/admin-dashboard', principal: '/school', teacher: '/teacher-dashboard', parent: '/parent' };

// Navbar for the admin, principal, teacher and parent areas: text tabs only; Log out is inside the ☰ menu.
const Navbar = () => {
  const { pathname } = useLocation();
  const { t: tr } = useT();
  const stored = localStorage.getItem('user_type');
  const role = HOME[stored] ? stored : 'teacher';

  const tab = (key, label, to, match) => ({ key, label, to, active: match ? match(pathname) : pathname === to });
  const tabs = {
    admin: [
      tab('admin', 'Admin', '/admin-dashboard'),
      tab('schools', 'Schools', '/admin/schools', (p) => p === '/admin/schools' || p.startsWith('/school/')),
      tab('teacher', 'Teacher view', '/teacher-dashboard'),
      tab('student', 'Student view', '/child-dashboard'),
    ],
    principal: [
      tab('school', 'My school', '/school'),
      tab('teacher', 'Progress', '/teacher-dashboard'),
      tab('student', 'Student view', '/child-dashboard'),
    ],
    teacher: [
      tab('teacher', 'Dashboard', '/teacher-dashboard'),
      tab('student', 'Student view', '/child-dashboard'),
      { key: 'ai-teacher', label: '3D Teacher', href: '/ai-teacher' },
    ],
    parent: [tab('parent', tr('nav.myChildren'), '/parent')],
  }[role];

  return <AppNavbar role={role} tabs={tabs} homeTo={HOME[role]} logoutTo={role === 'parent' ? '/' : '/login'} />;
};

export default Navbar;
