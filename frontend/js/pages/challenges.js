import { requireAuth } from '../services/auth.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { apiRequest } from '../services/api.js';
import { showToast } from '../services/toast.js';
import { SpeechToTextService } from '../services/speechRecognition.js';

let targetDuration = 60;
let remainingSeconds = 60;
let countdownTimer = null;
let activeTopic = '';
let stt = null;

async function initChallenges() {
  const user = await requireAuth();
  if (!user) return;

  renderSidebar('challenges');
  renderHeader(user, 'Speaking Challenges');

  const timerDisplay = document.getElementById('timer-display');
  const startBtn = document.getElementById('start-sprint-btn');
  const stopBtn = document.getElementById('stop-sprint-btn');
  const transcriptArea = document.getElementById('sprint-transcript');
  const sprintBtns = document.querySelectorAll('.sprint-btn');

  stt = new SpeechToTextService({
    onResult: ({ final, interim }) => {
      transcriptArea.value = final || interim;
    },
    onError: (message) => {
      showToast(message, 'error');
    }
  });

  sprintBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sprintBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      targetDuration = Number(btn.dataset.duration);
      remainingSeconds = targetDuration;
      updateTimerDisplay();
      fetchPrompt();
    });
  });

  async function fetchPrompt() {
    try {
      const data = await apiRequest(`/challenges/prompt?duration=${targetDuration}`);
      activeTopic = data.topic;
      document.getElementById('sprint-topic').textContent = activeTopic;
    } catch (err) {
      showToast('Could not load sprint prompt: ' + err.message, 'error');
    }
  }

  function updateTimerDisplay() {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-flex';
    transcriptArea.value = '';
    remainingSeconds = targetDuration;
    updateTimerDisplay();
    stt.start();

    countdownTimer = setInterval(() => {
      remainingSeconds -= 1;
      updateTimerDisplay();

      if (remainingSeconds <= 0) {
        clearInterval(countdownTimer);
        finishSprint();
      }
    }, 1000);
  });

  stopBtn.addEventListener('click', () => {
    clearInterval(countdownTimer);
    finishSprint();
  });

  async function finishSprint() {
    stt.stop();
    startBtn.style.display = 'inline-flex';
    stopBtn.style.display = 'none';

    const transcript = transcriptArea.value.trim();
    if (!transcript) {
      showToast('No speech was detected during the sprint. Try again!', 'error');
      return;
    }

    try {
      showToast('Evaluating speaking sprint...', 'info');
      const response = await apiRequest('/challenges/evaluate', {
        method: 'POST',
        body: {
          topic: activeTopic,
          durationSeconds: targetDuration,
          transcript
        }
      });

      renderEvaluation(response.evaluation);
    } catch (err) {
      showToast('Sprint evaluation error: ' + err.message, 'error');
    }
  }

  fetchPrompt();
}

function renderEvaluation(evalData) {
  const container = document.getElementById('sprint-result-box');

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3 style="margin: 0;">Sprint Diagnostic</h3>
      <span class="badge badge-primary" style="font-size: 1.1rem; padding: 6px 14px;">Score: ${evalData.overallScore}/100</span>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
      <div class="card" style="padding: 12px; text-align: center;">
        <span class="text-subtle" style="font-size: 0.75rem;">SPEAKING PACE</span>
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">${evalData.wpm} WPM</div>
      </div>
      <div class="card" style="padding: 12px; text-align: center;">
        <span class="text-subtle" style="font-size: 0.75rem;">CONFIDENCE</span>
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-success);">${evalData.confidenceScore}/100</div>
      </div>
    </div>

    <p style="background: var(--bg-surface-elevated); padding: 12px; border-radius: 8px; font-size: 0.9rem; margin-bottom: 16px;">
      <strong>Pacing Feedback:</strong> ${evalData.pacingFeedback}
    </p>

    <div style="margin-bottom: 12px;">
      <h4 style="color: var(--color-success); font-size: 0.9rem; margin-bottom: 4px;">Strengths</h4>
      <ul style="list-style: disc; padding-left: 18px; font-size: 0.85rem; color: var(--text-muted);">
        ${(evalData.strengths || []).map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>

    <div>
      <h4 style="color: var(--color-warning); font-size: 0.9rem; margin-bottom: 4px;">Areas to Improve</h4>
      <ul style="list-style: disc; padding-left: 18px; font-size: 0.85rem; color: var(--text-muted);">
        ${(evalData.areasToImprove || []).map(a => `<li>${a}</li>`).join('')}
      </ul>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', initChallenges);