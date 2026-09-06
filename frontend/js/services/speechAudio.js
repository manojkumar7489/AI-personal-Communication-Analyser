import { CONFIG } from '../config.js';

export class TextToSpeechService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.selectedVoice = null;
    this.loadVoices();

    if (this.synth && this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
    // Prioritize natural English voices (Google, Natural, or Samantha)
    this.selectedVoice = this.voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
    ) || this.voices.find((v) => v.lang.startsWith('en')) || this.voices[0];
  }

  speak(text, customPreferences = {}) {
    if (!this.synth) return;

    // Cancel ongoing audio before speaking new text
    this.synth.cancel();

    // Remove markdown symbols or code tags for natural speech
    const cleanSpeech = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);

    const user = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || '{}');
    const prefs = user.voicePreferences || CONFIG.DEFAULT_VOICE;

    utterance.voice = this.selectedVoice;
    utterance.rate = customPreferences.rate !== undefined ? customPreferences.rate : prefs.rate;
    utterance.pitch = customPreferences.pitch !== undefined ? customPreferences.pitch : prefs.pitch;

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const speechPlayer = new TextToSpeechService();