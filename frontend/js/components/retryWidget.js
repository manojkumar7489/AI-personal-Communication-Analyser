export function renderRetryComparison(containerId, deltaData) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const isPositive = deltaData.scoreDelta >= 0;
  const deltaBadgeClass = isPositive ? 'badge-success' : 'badge-danger';
  const deltaPrefix = isPositive ? '+' : '';

  container.innerHTML = `
    <div class="card" style="border: 2px solid var(--color-primary); background: var(--bg-surface-elevated); margin-top: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0; font-size: 1.2rem;">Iterative Attempt Comparison</h3>
        <span class="badge ${deltaBadgeClass}" style="font-size: 1rem; padding: 6px 14px;">
          Delta: ${deltaPrefix}${deltaData.scoreDelta} Pts (New Score: ${deltaData.newOverallScore})
        </span>
      </div>

      <p style="font-size: 0.95rem; color: var(--text-main); margin-bottom: 16px;">
        ${deltaData.improvementSummary}
      </p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
        <div style="background: var(--bg-body); padding: 12px; border-radius: 8px;">
          <h4 style="color: var(--color-success); font-size: 0.9rem; margin-bottom: 8px;">Improvements Made</h4>
          <ul style="list-style: disc; padding-left: 18px; font-size: 0.85rem; color: var(--text-muted);">
            ${(deltaData.strengthsInNewAttempt || []).map((s) => `<li>${s}</li>`).join('')}
          </ul>
        </div>
        <div style="background: var(--bg-body); padding: 12px; border-radius: 8px;">
          <h4 style="color: var(--color-warning); font-size: 0.9rem; margin-bottom: 8px;">Remaining Focus</h4>
          <ul style="list-style: disc; padding-left: 18px; font-size: 0.85rem; color: var(--text-muted);">
            ${(deltaData.remainingWeaknesses || []).map((w) => `<li>${w}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;
}