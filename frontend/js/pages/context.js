import { requireAuth } from '../services/auth.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { apiRequest } from '../services/api.js';
import { showToast } from '../services/toast.js';

let allContexts = [];

async function initContext() {
  const user = await requireAuth();
  if (!user) return;

  renderSidebar('context');
  renderHeader(user, 'Communication Contexts');

  const container = document.getElementById('context-cards-container');
  const filterBtns = document.querySelectorAll('.filter-btn');

  try {
    const data = await apiRequest('/context/list');
    allContexts = data.contexts || [];
    renderCards(allContexts);
  } catch (err) {
    showToast('Failed to load contexts: ' + err.message, 'error');
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.dataset.category;

      if (category === 'all') {
        renderCards(allContexts);
      } else {
        renderCards(allContexts.filter(c => c.category.toLowerCase() === category.toLowerCase()));
      }
    });
  });
}

function renderCards(contexts) {
  const container = document.getElementById('context-cards-container');
  if (!container) return;

  container.innerHTML = contexts.map(c => `
    <div class="card context-card card-hover">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <span class="badge badge-primary">${c.category}</span>
          <span class="badge ${c.difficulty === 'Hard' ? 'badge-warning' : 'badge-success'}">${c.difficulty}</span>
        </div>
        <h3 style="font-size: 1.2rem; margin-bottom: 8px;">${c.title}</h3>
        <p class="text-sub" style="font-size: 0.9rem; margin-bottom: 16px;">${c.description}</p>
      </div>
      <button class="btn btn-primary start-context-btn" data-type="${c.type}" style="width: 100%;">
        Enter Scenario →
      </button>
    </div>
  `).join('');

  document.querySelectorAll('.start-context-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const type = btn.dataset.type;
      try {
        await apiRequest('/context/start', {
          method: 'POST',
          body: { contextType: type }
        });
        window.location.href = '/pages/chat.html';
      } catch (err) {
        showToast('Error entering context: ' + err.message, 'error');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', initContext);