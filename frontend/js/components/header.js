export function renderHeader(user, pageTitle = 'Dashboard') {
  const container = document.getElementById('header-mount');
  if (!container) return;

  const gamification = user?.gamification || { streakCount: 0, xp: 0, level: 1 };
  const personality = user?.aiPersonality || 'friend';

  const html = `
    <header class="top-navbar">
      <div>
        <h2 style="font-size: 1.25rem; margin: 0;">${pageTitle}</h2>
      </div>
      <div style="display: flex; align-items: center; gap: 16px;">
        <span class="badge badge-warning" title="Consecutive Practice Streak">
          🔥 ${gamification.streakCount} Day Streak
        </span>
        <span class="badge badge-primary" title="Level & Total XP">
          ⭐ Level ${gamification.level} (${gamification.xp} XP)
        </span>
        <span class="badge" style="background: var(--bg-surface-elevated); color: var(--text-main); border: 1px solid var(--border-color);">
          🤖 Mode: ${personality.toUpperCase()}
        </span>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary); display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff;">
            ${user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span style="font-size: 0.9rem; font-weight: 600;">${user?.name || 'User'}</span>
        </div>
      </div>
    </header>
  `;

  container.innerHTML = html;
}