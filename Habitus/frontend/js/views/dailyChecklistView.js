// views/dailyChecklistView.js
//
// ==========================================================
// VISTA: DAILY CHECKLIST
// ==========================================================
//
// RESPONSABILIDADES (FRONTEND):
// - Pedir la lista de hábitos diarios al módulo de API (habitsApi.js).
// - Mostrar cada hábito diario como un ítem con botones:
//      * "Done"   -> marcar como completado.
//      * "Missed" -> marcar como no completado.
// - Actualizar visualmente el estado del ítem (clase .completed).
// - Actualizar la barra de progreso horizontal según el número
//   de hábitos completados.
//
// RELACIÓN CON BACKEND (PYTHON):
// - Esta vista NO llama directamente al backend.
// - Usa las funciones definidas en `habitsApi.js`:
//
//     - fetchDailyChecklist() -> obtiene la lista de hábitos diarios.
//     - saveDailyStatus(id, completed) -> notifica cambios de estado.
//
// - En la implementación actual (MOCK):
//     * fetchDailyChecklist() construye la lista a partir de los hábitos
//       seleccionados en Habit Catalog (guardados en localStorage).
//     * saveDailyStatus(...) solo hace console.log.
//
// - CUANDO EL BACKEND ESTÉ LISTO:
//     * fetchDailyChecklist() deberá hacer una petición real, por ejemplo:
//           GET /api/daily-checklist
//       que devuelva un JSON como:
//           [ { id, name, completed }, ... ]
//     * saveDailyStatus(id, completed) podría llamar a un endpoint como:
//           POST /api/checkins
//       con el nuevo estado.
//
//   Esta vista (dailyChecklistView.js) debería seguir funcionando sin cambios
//   mientras se mantenga el mismo contrato de datos.
//

import { fetchDailyChecklist, saveDailyStatus } from "../api/habitsApi.js";

/**
 * Muestra la vista de Daily Checklist.
 *
 * Pasos:
 * 1. Obtiene las referencias al <ul> y a la barra de progreso.
 * 2. Pide los ítems diarios a fetchDailyChecklist().
 * 3. Si no hay ítems, muestra un mensaje y pone la barra en 0%.
 * 4. Si hay ítems:
 *      - Crea un <li> por cada hábito.
 *      - Añade botones "Done" y "Missed".
 *      - Conecta esos botones con saveDailyStatus(...) y con la
 *        actualización visual (clase .completed).
 * 5. Calcula el porcentaje completado y ajusta el ancho de la barra.
 */
export async function showDailyChecklistView() {
  const list = document.getElementById("daily-list");
  const bar = document.getElementById("daily-progress-bar");
  if (!list || !bar) return;

  // 1) Pedir la lista de hábitos diarios (mock o backend, según habitsApi.js)
  const items = await fetchDailyChecklist();

  // Limpiar la lista actual
  list.innerHTML = "";

  // 2) Si no hay ítems, mostramos un mensaje y dejamos la barra en 0%
  if (!items || items.length === 0) {
    const li = document.createElement("li");
    li.className = "daily-item empty";

    const msg = document.createElement("span");
    msg.className = "daily-name";
    msg.textContent =
      "You don't have daily habits yet. Go to Habit Catalog to select some.";

    li.appendChild(msg);
    list.appendChild(li);

    bar.style.width = "0%";
    return;
  }

  // 3) Crear los ítems de la lista
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "daily-item";

    // Si viene marcado como completado desde la API/mock
    if (item.completed) {
      li.classList.add("completed");
    }

    const name = document.createElement("span");
    name.className = "daily-name";
    name.textContent = item.name;

    const actions = document.createElement("div");
    actions.className = "daily-actions";

    const btnDone = document.createElement("button");
    btnDone.className = "btn-done";
    btnDone.textContent = "Done";

    const btnMissed = document.createElement("button");
    btnMissed.className = "btn-missed";
    btnMissed.textContent = "Missed";

    // Al pulsar "Done":
    // - Avisamos a la API (mock o backend).
    // - Cambiamos el estado en el array "items".
    // - Marcamos visualmente el ítem como completado.
    // - Recalculamos la barra de progreso.
    btnDone.onclick = async () => {
      await saveDailyStatus(item.id, true);
      item.completed = true;
      li.classList.add("completed");
      updateProgress();
    };

    // Al pulsar "Missed":
    // - Avisamos a la API.
    // - Cambiamos el estado en el array.
    // - Quitamos la marca visual de completado.
    // - Recalculamos la barra de progreso.
    btnMissed.onclick = async () => {
      await saveDailyStatus(item.id, false);
      item.completed = false;
      li.classList.remove("completed");
      updateProgress();
    };

    actions.appendChild(btnDone);
    actions.appendChild(btnMissed);

    li.appendChild(name);
    li.appendChild(actions);
    list.appendChild(li);
  });

  /**
   * Recalcula el porcentaje de hábitos completados y ajusta
   * el ancho de la barra de progreso (elemento bar).
   *
   * - Porcentaje = (completados / total) * 100
   * - El estilo de la barra está definido en base.css
   *   con la clase .progress-bar-fill.
   */
  function updateProgress() {
    const total = items.length || 1;
    const done = items.filter((i) => i.completed).length;
    const percent = Math.round((done / total) * 100);
    bar.style.width = `${percent}%`;
  }

  // Calcular estado inicial de la barra
  updateProgress();
}
