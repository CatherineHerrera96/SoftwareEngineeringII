import { renderHabits } from './views/habitsView.js';
import { renderProfile } from './views/profileView.js';
import { renderLogin } from './views/loginView.js';
import { getToken } from './state.js';

export function navigateTo(viewName) {
  // 1. Check Auth
  const token = getToken();
  if (!token && viewName !== 'login' && viewName !== 'register') {
    viewName = 'login';
  } else if (token && (viewName === 'login' || viewName === 'register')) {
    viewName = 'profile'; // Default to profile (checklist)
  }

  // 2. Hide all views
  document.querySelectorAll('.view-card, .view-page').forEach(el => {
    el.style.display = 'none';
  });

  // 3. Show target view
  const target = document.querySelector(`[data-view="${viewName}"]`);
  if (target) {
    target.style.display = 'block';
  }

  // 4. Render logic
  switch (viewName) {
    case 'habits':
      renderHabits();
      break;
    case 'profile':
      renderProfile();
      break;
    case 'login':
      renderLogin();
      break;
    // case 'register': renderRegister(); break;
  }

  // 5. Update Nav Active State
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === viewName);
  });

  // 6. Show/Hide Header
  const header = document.getElementById("app-header");
  if (header) {
    header.style.display = (token && viewName !== 'login' && viewName !== 'register') ? 'flex' : 'none';

    if (header.style.display === 'flex') {
      import('./ui.js').then(ui => ui.updateHeaderProfile());
    }
  }
}
