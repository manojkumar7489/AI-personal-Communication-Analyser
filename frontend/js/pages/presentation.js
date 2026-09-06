import { requireAuth } from '../services/auth.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { apiRequest } from '../services/api.js';
import { showToast } from '../services/toast.js';
import { SpeechToTextService } from '../services/speechRecognition.js';

async function initPresentation() {
  const user = await requireAuth();
  if (!user) return;

  renderSidebar('presentation');
  renderHeader(user, 'Presentation Practice');

  const transcriptArea = document.getElementById('pres-transcript');
  const micBtn = document.getElementById('pres-mic-btn');
  const submitBtn = document.getElementById('pres-submit-btn');
  const typeSelect = document.getElementById('pres-type');

  const stt = new SpeechToTextService({
    onResult: ({ final, interim }) => {
      transcriptArea.value = final || interim;
    },
    onError: (message) => {
      showToast(message, 'error');
    }
  });

  micBtn.addEventListener('click', () => stt.toggle());

  submitBtn.addEventListener('click', async () => {
    const text = transcriptArea.value.trim();
    if (!text) {
      showToast('Please provide your speech or rehearsal transcript.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Evaluating Presentation...';

    try {
      const response = await apiRequest('/presentation/evaluate', {
        method: 'POST',
        body: {
          speechText: text,
          presentationType: typeSelect.value
        }
      });

      renderPresentationCritique(response.evaluation);
      showToast('Presentation analysis completed!', 'success');
    } catch (err) {
      showToast('Failed to analyze presentation: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Critique Delivery →';
    }
  });
}

function renderPresentationCritique(ev) {
  const container = document.getElementById('pres-evaluation-box');

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3 style="margin: 0;">Presentation Evaluation</h3>
      <span class="badge badge-primary" style="font-size: 1.1rem; padding: 6px 14px;">Score: ${ev.presentationScore}/100</span>
    </div>

    <div style="margin-bottom: 16px;">
      <h4 style="font-size: 0.95rem; margin-bottom: 4px;">Opening Hook (${ev.hookEvaluation.score}/100)</h4>
      <p class="text-sub" style="font-size: 0.85rem;">${ev.hookEvaluation.feedback}</p>
    </div>

    <div style="margin-bottom: 16px;">
      <h4 style="font-size: 0.95rem; margin-bottom: 4px;">Transitions (${ev.transitionsEvaluation.score}/100)</h4>
      <p class="text-sub" style="font-size: 0.85rem;">${ev.transitionsEvaluation.feedback}</p>
    </div>

    <div style="margin-bottom: 16px;">
      <h4 style="font-size: 0.95rem; margin-bottom: 4px;">Conclusion & Call to Action (${ev.conclusionEvaluation.score}/100)</h4>
      <p class="text-sub" style="font-size: 0.85rem;">${ev.conclusionEvaluation.feedback}</p>
    </div>

    <div>
      <h4 style="font-size: 0.95rem; margin-bottom: 6px;">Recommended Outline Blueprint</h4>
      <pre style="background: var(--bg-surface-elevated); padding: 12px; border-radius: 8px; font-size: 0.85rem; white-space: pre-wrap; font-family: var(--font-family-sans);">${ev.recommendedOutline}</pre>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', initPresentation);