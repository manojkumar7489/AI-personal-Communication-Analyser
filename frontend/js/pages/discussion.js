import { requireAuth } from '../services/auth.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { apiRequest } from '../services/api.js';
import { showToast } from '../services/toast.js';
import { SpeechToTextService } from '../services/speechRecognition.js';

let activeConversationId = null;

async function initDiscussion() {
  const user = await requireAuth();
  if (!user) return;

  renderSidebar('discussion');
  renderHeader(user, 'Group Discussion Room');

  const inputField = document.getElementById('gd-input-field');
  const sendBtn = document.getElementById('gd-send-btn');
  const micBtn = document.getElementById('gd-mic-btn');
  const feedbackBanner = document.getElementById('gd-feedback-banner');

  const stt = new SpeechToTextService({
    onResult: ({ final, interim }) => {
      inputField.value = final || interim;
    },
    onError: (message) => {
      showToast(message, 'error');
    }
  });

  micBtn.addEventListener('click', () => stt.toggle());

  // Launch GD simulation
  try {
    const data = await apiRequest('/discussion/start', { method: 'POST', body: {} });
    activeConversationId = data.conversationId;
    document.getElementById('gd-active-topic').textContent = `Topic: "${data.topic}"`;

    if (data.initialTurns) {
      data.initialTurns.forEach(appendGDMessage);
    }
  } catch (err) {
    showToast('Failed to start group discussion: ' + err.message, 'error');
  }

  async function handleUserEntry() {
    const text = inputField.value.trim();
    if (!text || !activeConversationId) return;

    inputField.value = '';
    stt.stop();

    // Render user statement immediately
    appendGDMessage({
      sender: 'user',
      participantName: user.name,
      text
    });

    try {
      const response = await apiRequest('/discussion/turn', {
        method: 'POST',
        body: {
          conversationId: activeConversationId,
          text
        }
      });

      // Display immediate feedback banner on entry quality
      feedbackBanner.style.display = 'block';
      feedbackBanner.innerHTML = `<strong>Feedback on Entry (Score ${response.evaluation.score}/100):</strong> ${response.evaluation.feedback}`;

      // Append next AI peer response
      if (response.peerResponse) {
        appendGDMessage(response.peerResponse);
      }
    } catch (err) {
      showToast('Error during GD turn: ' + err.message, 'error');
    }
  }

  sendBtn.addEventListener('click', handleUserEntry);
  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleUserEntry();
  });
}

function appendGDMessage(msg) {
  const log = document.getElementById('gd-messages-log');
  const isUser = msg.sender === 'user';

  const group = document.createElement('div');
  group.className = `message-bubble-group ${isUser ? 'message-user' : 'message-assistant'}`;

  group.innerHTML = `
    <span class="message-sender">${msg.participantName || (isUser ? 'You' : 'Peer')}</span>
    <div class="message-bubble">${msg.text}</div>
  `;

  log.appendChild(group);
  log.scrollTop = log.scrollHeight;
}

document.addEventListener('DOMContentLoaded', initDiscussion);