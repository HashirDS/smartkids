import { apiFetch } from './api';

const SESSION_KEYS = ['user', 'user_id', 'user_type', 'first_name', 'last_name', 'token'];

export const saveSession = (data) => {
  localStorage.setItem('user', data.user_id);
  localStorage.setItem('user_id', data.user_id);
  localStorage.setItem('user_type', data.user_type);
  localStorage.setItem('first_name', data.first_name || '');
  localStorage.setItem('last_name', data.last_name || '');
  if (data.token) localStorage.setItem('token', data.token);
};

export const isLoggedIn = () => Boolean(localStorage.getItem('user') && localStorage.getItem('token'));

// Ends the session on the server too, so a copied token stops working.
export const logout = async (navigate, to = '/') => {
  try {
    await apiFetch('/api/logout', { method: 'POST' });
  } catch {
    // Signing out locally still works if the server can't be reached.
  }
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  navigate(to);
};
