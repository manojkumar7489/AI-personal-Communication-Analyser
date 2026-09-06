import { CONFIG } from '../config.js';
import { apiRequest } from './api.js';

export function isAuthenticated() {
  return Boolean(localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN));
}

export function getCurrentUser() {
  const user = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
  return user ? JSON.parse(user) : null;
}

export function setSession(token, user) {
  localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
  localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
  window.location.href = '/pages/login.html';
}

/**
 * Route protection guard for authenticated views
 */
export async function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/pages/login.html';
    return null;
  }

  try {
    const data = await apiRequest('/auth/me');
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.user));
    return data.user;
  } catch (err) {
    logout();
    return null;
  }
}