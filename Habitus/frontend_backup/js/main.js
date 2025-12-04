import { navigateTo } from "./router.js";
import { initLoginView } from "./views/loginView.js";
import { clearAuth, getToken } from "./state.js";

function initNav() {
  const buttons = document.querySelectorAll(".nav-link");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const dest = btn.getAttribute("data-nav");
      navigateTo(dest);
    });
  });

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
  initLoginView(); // Sets up login form listeners
  initNav();
  initLogout();

  // Initial View
  if (getToken()) {
    navigateTo("profile");
  } else {
    navigateTo("login");
  }
});
