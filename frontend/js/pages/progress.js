import { requireAuth } from '../services/auth.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { apiRequest } from '../services/api.js';
import { showToast } from '../services/toast.js';

let lineChartInstance = null;
let radarChartInstance = null;

async function initProgress() {
  const user = await requireAuth();
  if (!user) return;

  renderSidebar('progress');
  renderHeader(user, 'Communication Analytics');

  const rangeBtns = document.querySelectorAll('.range-btn');

  rangeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      rangeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadAnalytics(btn.dataset.range);
    });
  });

  await loadAnalytics('7d');
  await loadWeaknessProfile();
}

async function loadAnalytics(range = '7d') {
  try {
    const data = await apiRequest(`/progress/analytics?range=${range}`);
    renderLineChart(data.timeline || []);
    renderRadarChart(data.radarSkills || {});
  } catch (err) {
    showToast('Failed to load analytics: ' + err.message, 'error');
  }
}

function renderLineChart(timeline) {
  const ctx = document.getElementById('timelineLineChart');
  if (!ctx) return;

  if (lineChartInstance) lineChartInstance.destroy();

  const labels = timeline.map(t => t.date);
  const dataPoints = timeline.map(t => t.avgOverallScore);

  lineChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length > 0 ? labels : ['Day 1', 'Day 2', 'Day 3'],
      datasets: [{
        label: 'Average Score',
        data: dataPoints.length > 0 ? dataPoints : [70, 72, 75],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { min: 40, max: 100, grid: { color: '#374151' } },
        x: { grid: { color: '#374151' } }
      }
    }
  });
}

function renderRadarChart(skills) {
  const ctx = document.getElementById('analyticsRadarChart');
  if (!ctx) return;

  if (radarChartInstance) radarChartInstance.destroy();

  radarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Grammar', 'Fluency', 'Vocabulary', 'Clarity', 'Confidence', 'Structure'],
      datasets: [{
        label: 'Skills',
        data: [skills.grammar || 70, skills.fluency || 70, skills.vocabulary || 70, skills.clarity || 70, skills.confidence || 70, skills.structure || 70],
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.2)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { r: { min: 0, max: 100, grid: { color: '#374151' }, ticks: { display: false } } },
      plugins: { legend: { display: false } }
    }
  });
}

async function loadWeaknessProfile() {
  try {
    const data = await apiRequest('/weakness/profile');
    const container = document.getElementById('tracked-weaknesses-list');
    const fillers = data.weaknessProfile?.fillerWords || [];

    if (fillers.length === 0) {
      container.innerHTML = '<p class="text-sub">No recurring weaknesses identified yet.</p>';
      return;
    }

    container.innerHTML = fillers.map(f => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-surface-elevated); border-radius: 6px; margin-bottom: 8px;">
        <span style="font-weight: 600;">"${f.word}"</span>
        <span class="badge badge-warning">Observed ${f.count}x</span>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading weaknesses:', err);
  }
}

document.addEventListener('DOMContentLoaded', initProgress);