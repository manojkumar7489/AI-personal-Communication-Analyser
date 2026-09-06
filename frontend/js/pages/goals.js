import { requireAuth } from '../services/auth.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { apiRequest } from '../services/api.js';
import { showToast } from '../services/toast.js';

async function initGoals() {
  const user = await requireAuth();
  if (!user) return;

  renderSidebar('goals');
  renderHeader(user, 'Goals & Badges');

  const createForm = document.getElementById('create-goal-form');

  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetArea = document.getElementById('goal-target-area').value;
    const title = document.getElementById('goal-title').value.trim();
    const targetMetricScore = document.getElementById('goal-metric').value;

    try {
      await apiRequest('/goals', {
        method: 'POST',
        body: { targetArea, title, targetMetricScore }
      });

      showToast('Goal created successfully!', 'success');
      document.getElementById('goal-title').value = '';
      loadGoals();
    } catch (err) {
      showToast('Failed to create goal: ' + err.message, 'error');
    }
  });

  async function loadGoals() {
    try {
      const data = await apiRequest('/goals');
      const container = document.getElementById('goals-list-container');
      const goals = data.goals || [];

      if (goals.length === 0) {
        container.innerHTML = '<p class="text-sub">No goals active. Set one using the form!</p>';
        return;
      }

      container.innerHTML = goals.map(g => `
        <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="font-size: 1rem;">${g.title}</h4>
            <span class="badge ${g.isCompleted ? 'badge-success' : 'badge-primary'}">${g.isCompleted ? 'Completed' : 'In Progress'}</span>
          </div>
          <p class="text-subtle" style="font-size: 0.75rem; margin: 4px 0 8px;">Target: ${g.targetMetricScore}/100</p>
          <div style="background: var(--bg-body); border-radius: 4px; height: 8px; overflow: hidden;">
            <div style="width: ${Math.min(100, (g.currentScore / g.targetMetricScore) * 100)}%; background: var(--color-primary); height: 100%;"></div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      showToast('Failed to load goals: ' + err.message, 'error');
    }
  }

  async function loadAchievements() {
    try {
      const data = await apiRequest('/goals/achievements');
      const container = document.getElementById('achievements-catalog-grid');
      const badges = data.achievements || [];

      container.innerHTML = badges.map(b => `
        <div class="badge-card ${b.isUnlocked ? '' : 'locked'}">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🏆</div>
          <h4 style="font-size: 0.95rem; margin-bottom: 4px;">${b.title}</h4>
          <p class="text-subtle" style="font-size: 0.75rem;">${b.description}</p>
          ${b.isUnlocked ? '<span class="badge badge-success" style="margin-top: 8px;">Unlocked</span>' : '<span class="badge" style="margin-top: 8px; background: #374151;">Locked</span>'}
        </div>
      `).join('');
    } catch (err) {
      showToast('Failed to load badges: ' + err.message, 'error');
    }
  }

  loadGoals();
  loadAchievements();
}

document.addEventListener('DOMContentLoaded', initGoals);