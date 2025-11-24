// views/dashboardView.js
//
// ==========================================================
// VISTA: WEEKLY PROGRESS (DASHBOARD)
// ==========================================================
//
// RESPONSABILIDADES (FRONTEND):
// - Mostrar un resumen semanal del progreso del usuario, que incluye:
//     * Porcentaje de cumplimiento semanal (Weekly Completion).
//     * Racha actual de días con hábitos completados (Current Streak).
//     * Lista de logros desbloqueados (Achievements).
//
// RELACIÓN CON BACKEND (PYTHON):
// - Usa la función:
//
//       fetchWeeklyStatsAndAchievements()
//
//   definida en `habitsApi.js`.
//
// - En el MOCK actual, esa función devuelve:
//
//       {
//         completion: 75,
//         streak: 14,
//         achievements: [
//           { id, title, description },
//           ...
//         ]
//       }
//
// - Cuando el backend esté listo, solo hay que cambiar la implementación
//   de fetchWeeklyStatsAndAchievements() para que haga fetch(...) a la API
//   respetando esa misma estructura de datos.
//

import { fetchWeeklyStatsAndAchievements } from "../api/habitsApi.js";

export async function showDashboardView() {
  // Elementos tal como están definidos en index.html
  const completionText = document.getElementById("weekly-completion");
  const streakText = document.getElementById("current-streak");
  const achievementsContainer = document.getElementById("achievements-list");

  if (!completionText || !streakText || !achievementsContainer) {
    console.warn(
      "[Dashboard] Faltan elementos en el DOM (weekly-completion, current-streak o achievements-list)."
    );
    return;
  }

  // 1) Obtener datos (mock o backend real, según habitsApi.js)
  const { completion, streak, achievements } =
    await fetchWeeklyStatsAndAchievements();

  // 2) Actualizar porcentaje semanal (texto grande)
  const safeCompletion =
    typeof completion === "number" && completion >= 0 && completion <= 100
      ? completion
      : 0;

  completionText.textContent = `${safeCompletion}%`;

  // 3) Actualizar racha (solo número, el texto "Days in a row..."
  //    ya está en el HTML como descripción fija)
  const safeStreak = typeof streak === "number" && streak >= 0 ? streak : 0;
  streakText.textContent = `${safeStreak}`;

  // 4) Renderizar lista de logros
  achievementsContainer.innerHTML = "";

  if (!achievements || achievements.length === 0) {
    const empty = document.createElement("div");
    empty.className = "achievement-item empty";
    empty.textContent =
      "No achievements unlocked yet. Keep building your habits!";
    achievementsContainer.appendChild(empty);
    return;
  }

  achievements.forEach((ach) => {
    const card = document.createElement("div");
    card.className = "achievement-item";

    const title = document.createElement("h4");
    title.className = "achievement-title";
    title.textContent = ach.title || "Achievement";

    const desc = document.createElement("p");
    desc.className = "achievement-desc";
    desc.textContent =
      ach.description || "You have unlocked a new achievement.";

    card.appendChild(title);
    card.appendChild(desc);
    achievementsContainer.appendChild(card);
  });
}
