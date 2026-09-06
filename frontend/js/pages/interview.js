import { requireAuth } from '../services/auth.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { apiRequest } from '../services/api.js';
import { showToast } from '../services/toast.js';
import { SpeechToTextService } from '../services/speechRecognition.js';

let activeInterviewId = null;
let currentTrack = 'hr';
let totalQuestions = 5;

async function initInterview() {
  const user = await requireAuth();
  if (!user) return;

  renderSidebar('interview');
  renderHeader(user, 'Interview Simulation');

  const hrBtn = document.getElementById('track-hr-btn');
  const techBtn = document.getElementById('track-tech-btn');
  const answerInput = document.getElementById('interview-answer-input');
  const submitBtn = document.getElementById('submit-answer-btn');
  const micBtn = document.getElementById('interview-mic-btn');

  const stt = new SpeechToTextService({
    onResult: ({ final, interim }) => {
      answerInput.value = final || interim;
    },
    onError: (message) => {
      showToast(message, 'error');
    }
  });

  micBtn.addEventListener('click', () => stt.toggle());

  hrBtn.addEventListener('click', () => switchTrack('hr'));
  techBtn.addEventListener('click', () => switchTrack('technical'));

  async function switchTrack(track) {
    currentTrack = track;
    if (track === 'hr') {
      hrBtn.className = 'btn btn-primary';
      techBtn.className = 'btn btn-secondary';
      document.getElementById('track-badge').textContent = 'HR Behavioral Track';
    } else {
      techBtn.className = 'btn btn-primary';
      hrBtn.className = 'btn btn-secondary';
      document.getElementById('track-badge').textContent = 'Technical Track';
    }
    await startSession();
  }

  async function startSession() {
    try {
      const data = await apiRequest('/interview/start', {
        method: 'POST',
        body: { track: currentTrack }
      });

      activeInterviewId = data.interviewSessionId;
      totalQuestions = data.totalQuestions;
      updateQuestionUI(data.currentQuestionIndex, data.question);
      document.getElementById('answer-feedback-box').style.display = 'none';
      answerInput.value = '';
    } catch (err) {
      showToast('Could not start interview: ' + err.message, 'error');
    }
  }

  function updateQuestionUI(index, questionText) {
    document.getElementById('question-progress-label').textContent = `Question ${index + 1} of ${totalQuestions}`;
    document.getElementById('current-question-text').textContent = questionText;
  }

  submitBtn.addEventListener('click', async () => {
    const answer = answerInput.value.trim();
    if (!answer || !activeInterviewId) {
      showToast('Please formulate an answer before proceeding.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Evaluating...';

    try {
      const response = await apiRequest('/interview/answer', {
        method: 'POST',
        body: {
          interviewSessionId: activeInterviewId,
          answerText: answer
        }
      });

      renderFeedback(response);
      answerInput.value = '';

      if (response.isCompleted) {
        document.getElementById('current-question-text').textContent = '🎉 Interview Simulation Completed!';
        submitBtn.style.display = 'none';
        showToast('Full interview complete! Overall score logged.', 'success');
      } else {
        updateQuestionUI(response.nextQuestionIndex, response.nextQuestion);
      }
    } catch (err) {
      showToast('Failed to submit answer: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Answer & Continue →';
    }
  });

  await startSession();
}

function renderFeedback(res) {
  const box = document.getElementById('answer-feedback-box');
  box.style.display = 'block';

  const star = res.starEvaluation || {};

  box.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h4>Previous Answer Feedback</h4>
      <span class="badge badge-primary">Score: ${res.score}/100</span>
    </div>
    <p class="text-sub" style="margin-bottom: 16px;">${res.feedback}</p>

    ${star.situation !== undefined ? `
      <div style="display: flex; gap: 8px;">
        <span class="badge ${star.situation ? 'badge-success' : 'badge-warning'}">S: ${star.situation ? '✓' : '✗'}</span>
        <span class="badge ${star.task ? 'badge-success' : 'badge-warning'}">T: ${star.task ? '✓' : '✗'}</span>
        <span class="badge ${star.action ? 'badge-success' : 'badge-warning'}">A: ${star.action ? '✓' : '✗'}</span>
        <span class="badge ${star.result ? 'badge-success' : 'badge-warning'}">R: ${star.result ? '✓' : '✗'}</span>
      </div>
    ` : ''}
  `;
}

document.addEventListener('DOMContentLoaded', initInterview);