import { requireAuth, logout } from '../services/auth.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { apiRequest } from '../services/api.js';
import { showToast } from '../services/toast.js';
import { speechPlayer } from '../services/speechAudio.js';
import { CONFIG } from '../config.js';

let systemVoices = [];

async function initSettings() {
  const user = await requireAuth();
  if (!user) return;

  renderSidebar('profile');
  renderHeader(user, 'Settings');

  const voiceSelect = document.getElementById('voice-select');
  const rateSlider = document.getElementById('setting-voice-rate');
  const pitchSlider = document.getElementById('setting-voice-pitch');
  const rateLabel = document.getElementById('label-voice-rate');
  const pitchLabel = document.getElementById('label-voice-pitch');
  const autoplayCheckbox = document.getElementById('setting-autoplay');
  const previewBtn = document.getElementById('preview-speech-btn');
  const form = document.getElementById('voice-settings-form');
  const clearCacheBtn = document.getElementById('clear-cache-btn');
  const signoutBtn = document.getElementById('global-signout-btn');

  // Populate active user voice settings
  const userPrefs = user.voicePreferences || CONFIG.DEFAULT_VOICE;
  rateSlider.value = userPrefs.rate ?? 1.0;
  pitchSlider.value = userPrefs.pitch ?? 1.0;
  autoplayCheckbox.checked = userPrefs.autoPlayAudio ?? true;
  rateLabel.textContent = `${parseFloat(rateSlider.value).toFixed(2)}x`;
  pitchLabel.textContent = parseFloat(pitchSlider.value).toFixed(2);

  // Update slider indicators on user drag
  rateSlider.addEventListener('input', () => {
    rateLabel.textContent = `${parseFloat(rateSlider.value).toFixed(2)}x`;
  });

  pitchSlider.addEventListener('input', () => {
    pitchLabel.textContent = parseFloat(pitchSlider.value).toFixed(2);
  });

  // Populate available browser TTS voices
  function populateVoiceList() {
    if (!window.speechSynthesis) return;

    systemVoices = window.speechSynthesis.getVoices();
    voiceSelect.innerHTML = '';

    if (systemVoices.length === 0) {
      voiceSelect.innerHTML = '<option value="">Default System Voice</option>';
      return;
    }

    const englishVoices = systemVoices.filter((v) => v.lang.startsWith('en'));
    const voicesToRender = englishVoices.length > 0 ? englishVoices : systemVoices;

    voicesToRender.forEach((voice, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' — System Default' : ''}`;
      voiceSelect.appendChild(option);
    });
  }

  populateVoiceList();
  if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = populateVoiceList;
  }

  // Voice Preview button
  previewBtn.addEventListener('click', () => {
    const selectedVoiceIndex = parseInt(voiceSelect.value, 10);
    const chosenVoice = !isNaN(selectedVoiceIndex) ? systemVoices[selectedVoiceIndex] : null;

    if (chosenVoice) {
      speechPlayer.selectedVoice = chosenVoice;
    }

    const sampleText = "Welcome to Vocalis AI. Good communication is about clarity, intention, and authentic presence.";
    speechPlayer.speak(sampleText, {
      rate: parseFloat(rateSlider.value),
      pitch: parseFloat(pitchSlider.value)
    });
  });

  // Save Settings submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rate = parseFloat(rateSlider.value);
    const pitch = parseFloat(pitchSlider.value);
    const autoPlayAudio = autoplayCheckbox.checked;

    try {
      const res = await apiRequest('/profile', {
        method: 'PUT',
        body: {
          voicePreferences: {
            rate,
            pitch,
            autoPlayAudio
          }
        }
      });

      // Update local storage user profile snapshot
      const cached = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || '{}');
      cached.voicePreferences = res.user.voicePreferences;
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(cached));

      showToast('Voice preferences successfully updated!', 'success');
    } catch (err) {
      showToast(`Failed to save settings: ${err.message}`, 'error');
    }
  });

  // Session clearing buttons
  clearCacheBtn.addEventListener('click', () => {
    sessionStorage.clear();
    showToast('Local session cache cleared successfully.', 'info');
  });

  signoutBtn.addEventListener('click', () => {
    logout();
  });
}

document.addEventListener('DOMContentLoaded', initSettings);