import { requireAuth } from '../services/auth.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { apiRequest } from '../services/api.js';
import { showToast } from '../services/toast.js';
import { speechPlayer } from '../services/speechAudio.js';

async function initProfile() {
  const user = await requireAuth();
  if (!user) return;

  renderSidebar('profile');
  renderHeader(user, 'Profile & Preferences');

  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const profSelect = document.getElementById('profile-proficiency');
  const personalitySelect = document.getElementById('ai-personality-select');
  const voiceRate = document.getElementById('voice-rate');
  const voicePitch = document.getElementById('voice-pitch');
  const rateVal = document.getElementById('voice-rate-val');
  const pitchVal = document.getElementById('voice-pitch-val');

  nameInput.value = user.name || '';
  emailInput.value = user.email || '';
  profSelect.value = user.targetProficiency || 'intermediate';
  personalitySelect.value = user.aiPersonality || 'friend';

  const prefs = user.voicePreferences || { rate: 1.0, pitch: 1.0 };
  voiceRate.value = prefs.rate || 1.0;
  voicePitch.value = prefs.pitch || 1.0;
  rateVal.textContent = voiceRate.value;
  pitchVal.textContent = voicePitch.value;

  voiceRate.addEventListener('input', () => { rateVal.textContent = voiceRate.value; });
  voicePitch.addEventListener('input', () => { pitchVal.textContent = voicePitch.value; });

  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/profile', {
        method: 'PUT',
        body: {
          name: nameInput.value.trim(),
          targetProficiency: profSelect.value
        }
      });
      showToast('Profile updated!', 'success');
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    }
  });

  document.getElementById('save-settings-btn').addEventListener('click', async () => {
    try {
      await apiRequest('/profile/personality', {
        method: 'PUT',
        body: { aiPersonality: personalitySelect.value }
      });

      await apiRequest('/profile', {
        method: 'PUT',
        body: {
          voicePreferences: {
            rate: parseFloat(voiceRate.value),
            pitch: parseFloat(voicePitch.value)
          }
        }
      });

      showToast('AI personality and voice preferences saved!', 'success');
    } catch (err) {
      showToast('Failed to save settings: ' + err.message, 'error');
    }
  });

  document.getElementById('test-voice-btn').addEventListener('click', () => {
    speechPlayer.speak("Hello! I'm your communication partner. Let's make today's practice count.", {
      rate: parseFloat(voiceRate.value),
      pitch: parseFloat(voicePitch.value)
    });
  });
}

document.addEventListener('DOMContentLoaded', initProfile);