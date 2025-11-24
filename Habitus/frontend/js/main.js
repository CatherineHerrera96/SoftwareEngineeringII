// main.js
import { showView } from "./router.js";
import { initLoginView } from "./views/loginView.js";
import { showHabitsView } from "./views/habitsView.js";
import { showDailyChecklistView } from "./views/dailyChecklistView.js";
import { showDashboardView } from "./views/dashboardView.js";
import { getCurrentUser, clearAuth } from "./state.js";

function initNav() {
  const buttons = document.querySelectorAll(".nav-link");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const dest = btn.getAttribute("data-nav");
      if (dest === "habits") {
        showView("habits");
        showHabitsView();
      } else if (dest === "daily") {
        showView("daily");
        showDailyChecklistView();
      } else if (dest === "dashboard") {
        showView("dashboard");
        showDashboardView();
      }
    });
  });
}

function initLogout() {
  const btn = document.getElementById("logout-btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    // limpiar sesión en el estado
    clearAuth();

    // quitar selección del menú
    document
      .querySelectorAll(".nav-link")
      .forEach((b) => b.classList.remove("active"));

    // volver al login (el router ocultará el header)
    showView("login");
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initLoginView();
  initNav();
  initLogout();

  // vista inicial
  if (getCurrentUser()) {
    showView("habits");
    showHabitsView();
  } else {
    showView("login");
  }
});
