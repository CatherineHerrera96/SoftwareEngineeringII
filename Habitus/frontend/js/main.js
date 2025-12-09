import { navigateTo } from "./router.js";
import { initLoginView } from "./views/loginView.js";
import { initResetPasswordView } from "./views/resetPasswordView.js";
import { initHomeView } from "./views/homeView.js";
import { clearAuth, getToken } from "./state.js";
import { initTheme, loadThemePreference, applyTheme } from "./ui.js";
import { applyGlobalTheme } from "./config/seasonalThemes.js";
import { setupConfirmModal } from "./views/habitsView.js";
import { resetProfileViewState } from "./views/profileView.js";

// Apply saved theme IMMEDIATELY to prevent flash
const savedTheme = loadThemePreference();
applyTheme(savedTheme);

function initNav() {
  const buttons = document.querySelectorAll(".nav-link");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const dest = btn.getAttribute("data-nav");
      navigateTo(dest);
    });
  });

  // Logo click handler - navigate to home
  const logoArea = document.querySelector('.logo-area');
  if (logoArea) {
    logoArea.style.cursor = 'pointer';
    logoArea.addEventListener('click', () => {
      const token = getToken();
      if (token) {
        navigateTo('home');
      }
    });
  }

  // Handle Register/Login links
  const goToRegister = document.getElementById("go-to-register");
  if (goToRegister) {
    goToRegister.addEventListener("click", () => navigateTo("register"));
  }

  const goToLogin = document.getElementById("go-to-login");
  if (goToLogin) {
    goToLogin.addEventListener("click", () => navigateTo("login"));
  }
}

function initLogout() {
  const btn = document.getElementById("logout-btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    resetProfileViewState();
    clearAuth();
    navigateTo("login");
  });
}

import { updateCurrentSeason } from "./config/seasonalThemes.js";

// Helper to get API base
function getApiBase() {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  // If not localhost (e.g. Hamachi), assume port 8000 for backend
  if (!isLocalhost) {
    return `http://${window.location.hostname}:8000`; // Dynamically use the same IP as frontend
  }
  return 'http://localhost:8000'; // Default Dev
}

window.addEventListener("DOMContentLoaded", async () => {
  // 0. Fetch Backend Season Configuration (Sync Frontend <-> Backend)
  try {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/api/config/season`);
    if (res.ok) {
      const data = await res.json();
      if (data.season) {
        updateCurrentSeason(data.season);
      }
    }
  } catch (e) {
    console.warn("Could not fetch seasonal config, using default:", e);
  }

  applyGlobalTheme(); // Apply seasonal theme (will use already-set data-theme)
  initTheme(); // Initialize theme toggle button
  setupConfirmModal(); // Setup global confirmation modal
  initLoginView(); // Sets up login form listeners
  initResetPasswordView(); // Sets up reset password form
  initHomeView(); // Sets up home view listeners
  initNav();
  initLogout();

  // Initial View
  if (getToken()) {
    navigateTo("home"); // Start at home if logged in
    startSeasonPolling(); // Start polling
  } else {
    navigateTo("login");
  }
});

// Polling interval (5 seconds for responsive UX during showcase)
function startSeasonPolling() {
  setInterval(async () => {
    try {
      const API_BASE = getApiBase();
      const res = await fetch(`${API_BASE}/api/config/season`);
      if (res.ok) {
        const data = await res.json();
        const { CURRENT_SEASON } = await import("./config/seasonalThemes.js");

        // Only update if changed
        if (data.season !== CURRENT_SEASON) {
          console.log(`[Season Polling] Change detected: ${CURRENT_SEASON} -> ${data.season}`);
          updateCurrentSeason(data.season);
          applyGlobalTheme();

          // Refresh current view to reflect changes (e.g. habits list)
          const currentView = document.querySelector('.view-page:not(.hidden)');
          if (currentView) {
            const viewName = currentView.getAttribute('data-view');
            if (viewName) navigateTo(viewName);
          }

          // Optional: Show toast
          import('./ui.js').then(({ showNotification }) => {
            const seasonName = data.season ? data.season.replace('_', ' ').toUpperCase() : 'DEFAULT';
            showNotification(`Season updated to: ${seasonName}`, 'info');
          });
        }
      }
    } catch (e) {
      console.warn("Season polling failed", e);
    }
  }, 5000);
}
