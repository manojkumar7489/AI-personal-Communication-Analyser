import { isAuthenticated } from '../services/auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // If the user already holds an active token, route directly into the application
  if (isAuthenticated()) {
    window.location.href = '/pages/dashboard.html';
    return;
  }

  // Smooth scroll behavior for landing page anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Dynamic interactive hover glow on feature showcase cards
  const featureCards = document.querySelectorAll('.card-hover');
  featureCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      card.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
      card.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
    });

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-4px)';
      card.style.boxShadow = 'var(--shadow-lg), 0 0 30px -5px var(--primary-glow)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'var(--shadow-glass)';
    });
  });
});