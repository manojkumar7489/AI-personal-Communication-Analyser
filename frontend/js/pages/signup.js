import { apiRequest } from '../services/api.js';
import { setSession } from '../services/auth.js';
import { showToast } from '../services/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const targetProficiency = document.getElementById('targetProficiency');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const proficiency = targetProficiency.value;

    if (!name || !email || password.length < 8) {
      showToast('Please complete all fields. Password must be at least 8 chars.', 'error');
      return;
    }

    try {
      const data = await apiRequest('/auth/signup', {
        method: 'POST',
        body: {
          name,
          email,
          password,
          targetProficiency: proficiency
        }
      });

      setSession(data.token, data.user);
      showToast('Account created successfully!', 'success');
      setTimeout(() => {
        window.location.href = '/pages/dashboard.html';
      }, 500);
    } catch (err) {
      showToast(err.message || 'Registration failed.', 'error');
    }
  });
});