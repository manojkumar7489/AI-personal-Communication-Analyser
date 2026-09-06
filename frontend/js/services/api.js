import { CONFIG } from '../config.js';

/**
 * Standardized HTTP API fetch client with JWT interceptor
 */
export async function apiRequest(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    method,
    headers: requestHeaders
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, fetchOptions);

    // Handle token expiration / unauthorized
    if (response.status === 401) {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
      if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('signup.html')) {
        window.location.href = '/pages/login.html';
      }
      throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API Request Error] ${method} ${endpoint}:`, error.message);
    throw error;
  }
}