export function showScoreModal({ analysis, onRetry }) {
  let modalBackdrop = document.getElementById('vocalis-score-modal');
  if (modalBackdrop) {
    modalBackdrop.remove();
  }

  modalBackdrop = document.createElement('div');
  modalBackdrop.id = 'vocalis-score-modal';
  modalBackdrop.className = 'modal-backdrop show';

  const metrics = analysis.metrics || {
    grammar: 70,
    fluency: 70,
    vocabulary: 70,
    clarity: 70,
    confidence: 70,
    structure: 70
  };

  const mistakesList = analysis.importantMistakes || [];

  modalBackdrop.innerHTML = `
    <div class="modal-dialog">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0;">Session Diagnostic Scorecard</h3>
        <button id="close-modal-btn" class="btn btn-secondary" style="padding: 4px 10px;">✕</button>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <div class="score-dial" style="--score-pct: ${analysis.overallScore};">
          <div class="score-dial-inner">
            <span class="score-dial-number">${analysis.overallScore}</span>
            <span class="text-subtle" style="font-size: 0.75rem;">OVERALL</span>
          </div>
        </div>
        <p class="text-lead" style="font-weight: 600; color: var(--color-primary-light);">
          Next Focus: ${analysis.nextFocus || 'Keep answers concise and well structured.'}
        </p>
      </div>

      <!-- 6-Axis Rubric Grid -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
        <div class="card" style="padding: 12px; text-align: center;">
          <span class="text-subtle" style="font-size: 0.75rem;">Grammar</span>
          <div style="font-size: 1.2rem; font-weight: 700;">${metrics.grammar}</div>
        </div>
        <div class="card" style="padding: 12px; text-align: center;">
          <span class="text-subtle" style="font-size: 0.75rem;">Fluency</span>
          <div style="font-size: 1.2rem; font-weight: 700;">${metrics.fluency}</div>
        </div>
        <div class="card" style="padding: 12px; text-align: center;">
          <span class="text-subtle" style="font-size: 0.75rem;">Vocabulary</span>
          <div style="font-size: 1.2rem; font-weight: 700;">${metrics.vocabulary}</div>
        </div>
        <div class="card" style="padding: 12px; text-align: center;">
          <span class="text-subtle" style="font-size: 0.75rem;">Clarity</span>
          <div style="font-size: 1.2rem; font-weight: 700;">${metrics.clarity}</div>
        </div>
        <div class="card" style="padding: 12px; text-align: center;">
          <span class="text-subtle" style="font-size: 0.75rem;">Confidence</span>
          <div style="font-size: 1.2rem; font-weight: 700;">${metrics.confidence}</div>
        </div>
        <div class="card" style="padding: 12px; text-align: center;">
          <span class="text-subtle" style="font-size: 0.75rem;">Structure</span>
          <div style="font-size: 1.2rem; font-weight: 700;">${metrics.structure}</div>
        </div>
      </div>

      <!-- Strengths -->
      <div style="margin-bottom: 16px;">
        <h4 style="color: var(--color-success); margin-bottom: 8px;">✓ What You Did Well</h4>
        <ul style="list-style: disc; padding-left: 20px; color: var(--text-muted);">
          ${(analysis.strengths || []).map((s) => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
        </ul>
      </div>

      <!-- Specific Mistakes & Alternatives -->
      ${
        mistakesList.length > 0
          ? `
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--color-warning); margin-bottom: 8px;">Key Mistakes & Better Phrasing</h4>
          ${mistakesList
            .map(
              (m) => `
            <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; margin-bottom: 8px;">
              <p style="color: var(--color-danger); font-size: 0.85rem; margin-bottom: 4px;"><strong>Original:</strong> "${m.originalText}"</p>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 4px;"><strong>Why:</strong> ${m.explanation}</p>
              <p style="color: var(--color-success); font-size: 0.85rem;"><strong>Try instead:</strong> "${m.betterAlternative}"</p>
            </div>
          `
            )
            .join('')}
        </div>
      `
          : ''
      }

      <!-- Suggested Strategy -->
      <div style="margin-bottom: 24px;">
        <h4 style="margin-bottom: 8px;">Better Approach</h4>
        <p style="background: var(--bg-surface-elevated); padding: 12px; border-radius: 8px; font-size: 0.9rem; line-height: 1.5;">
          ${analysis.betterApproach}
        </p>
      </div>

      <!-- Actions -->
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="modal-close-action" class="btn btn-secondary">Done</button>
        ${
          onRetry
            ? `<button id="modal-retry-action" class="btn btn-primary">🔄 Try Again (Improve Score)</button>`
            : ''
        }
      </div>
    </div>
  `;

  document.body.appendChild(modalBackdrop);

  const closeModal = () => modalBackdrop.remove();

  document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-close-action')?.addEventListener('click', closeModal);
  document.getElementById('modal-retry-action')?.addEventListener('click', () => {
    closeModal();
    onRetry();
  });
}