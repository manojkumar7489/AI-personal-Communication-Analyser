import { requireAuth } from '../services/auth.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { apiRequest } from '../services/api.js';
import { showToast } from '../services/toast.js';

let radarChartInstance = null;

async function initDashboard() {
  const user = await requireAuth();
  if (!user) return;

  renderSidebar('dashboard');
  renderHeader(user, 'Dashboard');

  try {
    const data = await apiRequest('/progress/dashboard');
    const { dashboard } = data;

    // Set high-level numbers
    const overallEl = document.getElementById('dashboard-overall-score');
    const scoreDial = document.getElementById('dashboard-score-dial');
    const overallScore = dashboard.overallScore || 70;

    overallEl.textContent = overallScore;
    scoreDial.style.setProperty('--score-pct', overallScore);

    document.getElementById('metric-sessions').textContent = dashboard.lifetimeSessions || 0;
    document.getElementById('metric-minutes').textContent = dashboard.lifetimeMinutes || 0;
    document.getElementById('metric-streak').textContent = `${dashboard.gamification?.streakCount || 0}d`;

    // Render Daily Workout Tasks
    renderWorkout(dashboard.dailyWorkout);

    // Initialize Skills Radar Chart
    renderRadarChart(dashboard.skillAverages);
  } catch (err) {
    showToast('Failed to load dashboard metrics: ' + err.message, 'error');
  }
}

function renderWorkout(workout) {
  const container = document.getElementById('workout-tasks-list');
  if (!workout || !workout.tasks || workout.tasks.length === 0) {
    container.innerHTML = '<p class="text-sub">No workout assigned for today yet.</p>';
    return;
  }

  const moduleRouteMap = {
    chat: '/pages/chat.html',
    storytelling: '/pages/story.html',
    vocabulary: '/pages/vocabulary.html',
    interview: '/pages/interview.html',
    challenge: '/pages/challenges.html'
  };

  container.innerHTML = workout.tasks.map(task => `
    <div class="workout-item ${task.completed ? 'done' : ''}">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 1.1rem;">${task.completed ? '✅' : '⏳'}</span>
        <div>
          <span style="font-weight: 600; font-size: 0.95rem; display: block; text-decoration: ${task.completed ? 'line-through' : 'none'};">
            ${task.title}
          </span>
          <span class="text-subtle" style="font-size: 0.75rem;">Focus: ${task.targetWeakness.replace(/_/g, ' ')}</span>
        </div>
      </div>
      <div>
        ${task.completed 
          ? '<span class="badge badge-success">Completed</span>'
          : `<a href="${moduleRouteMap[task.moduleType] || '/pages/chat.html'}" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;">Start Drill</a>`
        }
      </div>
    </div>
  `).join('');
}

function renderRadarChart(skills = {}) {
  const ctx = document.getElementById('skillsRadarChart');
  if (!ctx) return;

  if (radarChartInstance) {
    radarChartInstance.destroy();
  }

  const labels = ['Grammar', 'Fluency', 'Vocabulary', 'Clarity', 'Confidence', 'Structure'];
  const values = [
    skills.grammar || 70,
    skills.fluency || 70,
    skills.vocabulary || 70,
    skills.clarity || 70,
    skills.confidence || 70,
    skills.structure || 70
  ];

  radarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: 'Skill Proficiency',
        data: values,
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        borderColor: '#6366f1',
        pointBackgroundColor: '#06b6d4',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false },
          grid: { color: '#374151' },
          angleLines: { color: '#374151' },
          pointLabels: { color: '#9ca3af', font: { size: 11 } }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', initDashboard);