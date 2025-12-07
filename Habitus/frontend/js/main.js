import { navigateTo } from "./router.js";
import { initLoginView } from "./views/loginView.js";
import { initResetPasswordView } from "./views/resetPasswordView.js";
import { initHomeView } from "./views/homeView.js";
import { clearAuth, getToken } from "./state.js";
import { initTheme, loadThemePreference, applyTheme } from "./ui.js";
import { applyGlobalTheme } from "./config/seasonalThemes.js";

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
    clearAuth();
    navigateTo("login");
  });
}

window.addEventListener("DOMContentLoaded", () => {
  applyGlobalTheme(); // Apply seasonal theme (will use already-set data-theme)
  initTheme(); // Initialize theme toggle button
  initLoginView(); // Sets up login form listeners
  initResetPasswordView(); // Sets up reset password form
  initHomeView(); // Sets up home view listeners
  initNav();
  initLogout();

  // Initial View
  if (getToken()) {
    navigateTo("home"); // Start at home if logged in
  } else {
    navigateTo("login");
  }
});
