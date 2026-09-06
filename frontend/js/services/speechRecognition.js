export class SpeechToTextService {
  constructor({ onResult, onError, onStart, onEnd }) {
    this.onResult = onResult || (() => {});
    this.onError = onError || (() => {});
    this.onStart = onStart || (() => {});
    this.onEnd = onEnd || (() => {});
    this.recognition = null;
    this.isListening = false;
    this.finalTranscript = '';
    this.init();
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[SpeechRecognition] This browser does not support native speech recognition.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStart();
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += `${event.results[i][0].transcript} `;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      this.finalTranscript += finalTranscript;
      this.onResult({
        final: this.finalTranscript.trim(),
        interim: interimTranscript.trim()
      });
    };

    this.recognition.onerror = (event) => {
      const message = this.getErrorMessage(event.error);
      console.error('[SpeechRecognition Error]:', event.error, message);
      this.isListening = false;
      this.onError(message);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEnd();
    };
  }

  isSupported() {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  start() {
    if (!this.isSupported() || !this.recognition) {
      this.onError('Speech recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.');
      return false;
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      this.onError('Speech recognition requires HTTPS or localhost.');
      return false;
    }

    if (this.isListening) return true;

    this.finalTranscript = '';
    try {
      this.recognition.start();
      return true;
    } catch (err) {
      console.warn('[SpeechRecognition] Could not start:', err.message);
      this.onError('Could not start the microphone. Check browser microphone permissions and try again.');
      return false;
    }
  }

  stop() {
    if (!this.recognition || !this.isListening) return;
    this.recognition.stop();
  }

  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  getErrorMessage(error) {
    const messages = {
      'not-allowed': 'Microphone access was blocked. Allow microphone permission for this site, then try again.',
      'service-not-allowed': 'Speech recognition is blocked by this browser or network. Try Chrome or Edge on localhost.',
      network: 'Speech recognition could not reach the browser speech service. Check your internet connection.',
      'audio-capture': 'No microphone was found. Connect a microphone and try again.',
      'no-speech': 'No speech was detected. Speak closer to the microphone and try again.',
      aborted: 'Speech recognition was stopped.'
    };

    return messages[error] || `Speech recognition error: ${error || 'unknown error'}.`;
  }
}