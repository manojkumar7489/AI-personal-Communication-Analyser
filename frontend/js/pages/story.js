import { requireAuth } from '../services/auth.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { apiRequest } from '../services/api.js';
import { showToast } from '../services/toast.js';
import { SpeechToTextService } from '../services/speechRecognition.js';

let promptsList = [];
let currentPrompt = null;
let lastStoryId = null;

async function initStory() {
  const user = await requireAuth();
  if (!user) return;

  renderSidebar('story');
  renderHeader(user, 'Storytelling Mode');

  const storyInput = document.getElementById('story-textarea');
  const micBtn = document.getElementById('story-mic-btn');
  const micText = document.getElementById('mic-status-text');
  const submitBtn = document.getElementById('submit-story-btn');
  const randomBtn = document.getElementById('refresh-topic-btn');

  // Initialize Speech Recognition
  const stt = new SpeechToTextService({
    onStart: () => {
      micText.textContent = 'Listening...';
      micBtn.classList.add('recording');
    },
    onResult: ({ final, interim }) => {
      storyInput.value = final || interim;
    },
    onEnd: () => {
      micText.textContent = 'Speak Story';
      micBtn.classList.remove('recording');
    },
    onError: (message) => {
      micText.textContent = 'Speak Story';
      micBtn.classList.remove('recording');
      showToast(message, 'error');
    }
  });

  micBtn.addEventListener('click', () => stt.toggle());

  // Load prompts
  try {
    const data = await apiRequest('/story/prompts');
    promptsList = data.prompts || [];
    selectRandomPrompt();
  } catch (err) {
    showToast('Failed to load prompts: ' + err.message, 'error');
  }

  function selectRandomPrompt() {
    if (promptsList.length === 0) return;
    currentPrompt = promptsList[Math.floor(Math.random() * promptsList.length)];
    document.getElementById('topic-title').textContent = currentPrompt.title;
    document.getElementById('topic-desc').textContent = currentPrompt.description;
  }

  randomBtn.addEventListener('click', selectRandomPrompt);

  // Submit story evaluation
  submitBtn.addEventListener('click', async () => {
    const text = storyInput.value.trim();
    if (!text || !currentPrompt) {
      showToast('Please type or speak your story before submitting.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Analyzing Arc...';

    try {
      const response = await apiRequest('/story/submit', {
        method: 'POST',
        body: {
          promptTopic: currentPrompt.title,
          storyText: text,
          parentStoryId: lastStoryId
        }
      });

      lastStoryId = response.story._id;
      renderStoryReview(response.story);
      showToast(`Story analyzed! +${response.gamification?.currentXP ? '60' : '0'} XP earned.`, 'success');
    } catch (err) {
      showToast('Evaluation failed: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Analyze Story Arc →';
    }
  });
}

function renderStoryReview(story) {
  const container = document.getElementById('story-review-card');
  const b = story.breakdown;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3 style="margin: 0;">Story Analysis (Attempt ${story.attempt})</h3>
      <span class="badge badge-primary" style="font-size: 1.1rem; padding: 6px 14px;">Score: ${story.storyScore}/100</span>
    </div>

    <!-- 6-Axis Rubric Grid -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
      <div class="card" style="padding: 10px; text-align: center;"><span class="text-subtle" style="font-size: 0.75rem;">Structure</span><div style="font-weight: 700;">${b.structure}</div></div>
      <div class="card" style="padding: 10px; text-align: center;"><span class="text-subtle" style="font-size: 0.75rem;">Clarity</span><div style="font-weight: 700;">${b.clarity}</div></div>
      <div class="card" style="padding: 10px; text-align: center;"><span class="text-subtle" style="font-size: 0.75rem;">Fluency</span><div style="font-weight: 700;">${b.fluency}</div></div>
      <div class="card" style="padding: 10px; text-align: center;"><span class="text-subtle" style="font-size: 0.75rem;">Vocabulary</span><div style="font-weight: 700;">${b.vocabulary}</div></div>
      <div class="card" style="padding: 10px; text-align: center;"><span class="text-subtle" style="font-size: 0.75rem;">Grammar</span><div style="font-weight: 700;">${b.grammar}</div></div>
      <div class="card" style="padding: 10px; text-align: center;"><span class="text-subtle" style="font-size: 0.75rem;">Engagement</span><div style="font-weight: 700;">${b.engagement}</div></div>
    </div>

    <div style="margin-bottom: 16px;">
      <h4 style="color: var(--color-success); margin-bottom: 6px;">✓ Strengths</h4>
      <ul style="list-style: disc; padding-left: 18px; font-size: 0.85rem; color: var(--text-muted);">
        ${(story.strengths || []).map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>

    <div style="margin-bottom: 16px;">
      <h4 style="color: var(--color-warning); margin-bottom: 6px;">Growth Areas</h4>
      <ul style="list-style: disc; padding-left: 18px; font-size: 0.85rem; color: var(--text-muted);">
        ${(story.improvements || []).map(i => `<li>${i}</li>`).join('')}
      </ul>
    </div>

    <div>
      <h4 style="margin-bottom: 6px;">Better Narrative Structure</h4>
      <pre style="background: var(--bg-surface-elevated); padding: 12px; border-radius: 8px; font-size: 0.85rem; white-space: pre-wrap; font-family: var(--font-family-sans);">${story.betterStructure}</pre>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', initStory);