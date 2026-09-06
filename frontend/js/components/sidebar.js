import { logout } from '../services/auth.js';

export function renderSidebar(activeKey = 'dashboard') {
  const container = document.getElementById('sidebar-mount');
  if (!container) return;

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊', path: '/pages/dashboard.html' },
    { key: 'chat', label: 'AI Friend Chat', icon: '💬', path: '/pages/chat.html' },
    { key: 'context', label: 'Communication Context', icon: '🎭', path: '/pages/context.html' },
    { key: 'story', label: 'Storytelling Mode', icon: '📖', path: '/pages/story.html' },
    { key: 'challenges', label: 'Speaking Challenges', icon: '⚡', path: '/pages/challenges.html' },
    { key: 'interview', label: 'Interview Practice', icon: '💼', path: '/pages/interview.html' },
    { key: 'discussion', label: 'Group Discussion', icon: '👥', path: '/pages/discussion.html' },
    { key: 'presentation', label: 'Presentation Practice', icon: '🎤', path: '/pages/presentation.html' },
    { key: 'vocabulary', label: 'Context Vocabulary', icon: '📚', path: '/pages/vocabulary.html' },
    { key: 'progress', label: 'Analytics & History', icon: '📈', path: '/pages/progress.html' },
    { key: 'goals', label: 'Goals & Badges', icon: '🎯', path: '/pages/goals.html' },
    { key: 'profile', label: 'Profile & Settings', icon: '⚙️', path: '/pages/profile.html' }
  ];

  const html = `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo-icon">V</div>
        <div>
          <h3 style="font-size: 1.1rem; margin: 0;">Vocalis AI</h3>
          <p class="text-subtle" style="font-size: 0.75rem; margin: 0;">Communication Coach</p>
        </div>
      </div>
      <nav class="sidebar-nav">
        ${navItems
          .map(
            (item) => `
          <a href="${item.path}" class="nav-link ${item.key === activeKey ? 'active' : ''}">
            <span class="nav-icon">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        `
          )
          .join('')}
      </nav>
      <div style="padding: 16px; border-top: 1px solid var(--border-light);">
        <button id="logout-btn" class="btn btn-secondary" style="width: 100%; justify-content: flex-start; gap: 8px;">
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  `;

  container.innerHTML = html;

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    logout();
  });
}