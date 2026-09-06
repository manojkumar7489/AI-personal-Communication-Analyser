import { requireAuth } from '../services/auth.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { apiRequest } from '../services/api.js';
import { showToast } from '../services/toast.js';
import { SpeechToTextService } from '../services/speechRecognition.js';
import { speechPlayer } from '../services/speechAudio.js';
import { showScoreModal } from '../components/scoreModal.js';
import { renderRetryComparison } from '../components/retryWidget.js';

let activeConversationId = null;
let autoPlayTTS = true;
let sttEngine = null;

async function initChat() {
  const user = await requireAuth();
  if (!user) return;

  renderSidebar('chat');
  renderHeader(user, 'AI Friend Chat');

  autoPlayTTS = user.voicePreferences?.autoPlayAudio ?? true;

  const ttsBtn = document.getElementById('tts-toggle-btn');
  const micBtn = document.getElementById('mic-toggle-btn');
  const textInput = document.getElementById('chat-text-input');
  const sendBtn = document.getElementById('send-msg-btn');
  const endSessionBtn = document.getElementById('end-session-btn');

  // Initialize Speech-to-Text
  sttEngine = new SpeechToTextService({
    onStart: () => {
      micBtn.classList.add('recording');
      showToast('Microphone active. Speak naturally...', 'info');
    },
    onResult: ({ final, interim }) => {
      textInput.value = final || interim;
    },
    onEnd: () => {
      micBtn.classList.remove('recording');
    },
    onError: (err) => {
      micBtn.classList.remove('recording');
      showToast(`Mic error: ${err}`, 'error');
    }
  });

  micBtn.addEventListener('click', () => {
    sttEngine.toggle();
  });

  ttsBtn.addEventListener('click', () => {
    autoPlayTTS = !autoPlayTTS;
    ttsBtn.textContent = autoPlayTTS ? '🔊 Audio: ON' : '🔈 Audio: OFF';
    if (!autoPlayTTS) speechPlayer.stop();
  });

  // Start or restore conversation thread
  try {
    const data = await apiRequest('/chat/conversation', {
      method: 'POST',
      body: { mode: 'friend_chat', title: 'Casual Chat Session' }
    });

    activeConversationId = data.conversation._id;
    if (data.messages) {
      data.messages.forEach(appendMessage);
    }
  } catch (err) {
    showToast('Failed to initialize conversation: ' + err.message, 'error');
  }

  // Handle message sending
  const handleSend = async () => {
    const text = textInput.value.trim();
    if (!text || !activeConversationId) return;

    textInput.value = '';
    sttEngine.stop();

    // Render user message instantly
    appendMessage({
      sender: 'user',
      participantName: user.name,
      text
    });

    try {
      const response = await apiRequest('/chat/message', {
        method: 'POST',
        body: {
          conversationId: activeConversationId,
          text
        }
      });

      appendMessage(response.aiMessage);

      if (autoPlayTTS && response.aiMessage?.text) {
        speechPlayer.speak(response.aiMessage.text);
      }
    } catch (err) {
      showToast(err.message || 'Error communicating with AI Friend.', 'error');
    }
  };

  sendBtn.addEventListener('click', handleSend);
  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  // End and score current practice session
  endSessionBtn.addEventListener('click', async () => {
    try {
      showToast('Evaluating communication session...', 'info');
      const result = await apiRequest('/analysis/session', {
        method: 'POST',
        body: { conversationId: activeConversationId }
      });

      showScoreModal({
        analysis: result.analysis,
        onRetry: () => {
          showToast('Retry mode activated: deliver your thoughts again with the feedback in mind!', 'info');
          textInput.focus();
        }
      });
    } catch (err) {
      showToast(err.message || 'Failed to complete session analysis.', 'error');
    }
  });
}

function appendMessage(msg) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const isUser = msg.sender === 'user';
  const group = document.createElement('div');
  group.className = `message-bubble-group ${isUser ? 'message-user' : 'message-assistant'}`;

  group.innerHTML = `
    <span class="message-sender">${msg.participantName || (isUser ? 'You' : 'AI Friend')}</span>
    <div class="message-bubble">${msg.text}</div>
  `;

  container.appendChild(group);
  container.scrollTop = container.scrollHeight;
}

document.addEventListener('DOMContentLoaded', initChat);