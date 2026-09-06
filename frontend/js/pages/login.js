import { apiRequest } from '../services/api.js';
import { setSession } from '../services/auth.js';
import { showToast } from '../services/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      setSession(data.token, data.user);
      showToast('Welcome back!', 'success');
      setTimeout(() => {
        window.location.href = '/pages/dashboard.html';
      }, 500);
    } catch (err) {
      showToast(err.message || 'Login failed. Please verify your credentials.', 'error');
    }
  });
});