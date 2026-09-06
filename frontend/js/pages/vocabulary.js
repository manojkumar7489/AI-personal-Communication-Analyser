import { requireAuth } from '../services/auth.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { apiRequest } from '../services/api.js';
import { showToast } from '../services/toast.js';

async function initVocabulary() {
  const user = await requireAuth();
  if (!user) return;

  renderSidebar('vocabulary');
  renderHeader(user, 'Context Vocabulary');

  const container = document.getElementById('vocab-cards-container');

  try {
    const data = await apiRequest('/vocabulary/recommendations');
    const words = data.vocabularyList || [];

    if (words.length === 0) {
      container.innerHTML = '<p class="text-sub">No vocabulary recommendations available yet.</p>';
      return;
    }

    container.innerHTML = words.map(w => `
      <div class="card card-hover" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <h3 style="font-size: 1.3rem; color: var(--color-primary-light);">${w.word}</h3>
            <span class="badge badge-primary">${w.partOfSpeech}</span>
          </div>
          <p style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 12px;"><strong>Meaning:</strong> ${w.definition}</p>
          <div style="background: var(--bg-surface-elevated); padding: 10px; border-radius: 6px; font-size: 0.85rem; color: var(--text-muted); font-style: italic; margin-bottom: 16px;">
            "${w.contextExample}"
          </div>
        </div>
        <button class="btn btn-secondary mark-vocab-btn" data-word="${w.word}" style="width: 100%;">
          Mark Practiced (+20 XP)
        </button>
      </div>
    `).join('');

    document.querySelectorAll('.mark-vocab-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const word = btn.dataset.word;
        try {
          await apiRequest('/vocabulary/mark-practiced', {
            method: 'POST',
            body: { word }
          });
          btn.textContent = '✓ Practiced';
          btn.classList.add('btn-success');
          btn.disabled = true;
          showToast(`+20 XP awarded for practicing "${word}"!`, 'success');
        } catch (err) {
          showToast('Error marking word: ' + err.message, 'error');
        }
      });
    });
  } catch (err) {
    showToast('Failed to load vocabulary: ' + err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', initVocabulary);