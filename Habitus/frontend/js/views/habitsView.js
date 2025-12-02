// views/habitsView.js
//
// ==========================================================
// VISTA: HABIT CATALOG
// ==========================================================
//
// RESPONSABILIDADES (FRONTEND):
// - Mostrar el catálogo de hábitos en forma de tarjetas.
// - Permitir filtrar hábitos por categoría (All, Wellness, Health, Academic, Work).
// - Permitir marcar/desmarcar hábitos seleccionados por el usuario.
// - Enviar la lista de hábitos seleccionados a la capa de API (habitsApi.js)
//   cuando se pulsa "Save My Habits".
//
// RELACIÓN CON BACKEND:
// - Esta vista NO llama directamente al backend.
// - Solo usa las funciones del módulo `habitsApi.js`:
//
//     - fetchHabits()       -> obtiene la lista de hábitos.
//     - saveUserHabits(ids) -> guarda la selección del usuario.
//
// - Cuando se integre el backend real en Python, SOLO habrá que
//   modificar `habitsApi.js` para que esas funciones usen `fetch(...)`
//   contra la API. Esta vista (habitsView.js) no debería requerir cambios,
//   siempre que se mantenga el mismo contrato de datos.
//
// NOTA SOBRE MOCKS Y localStorage:
// - En este archivo se usa localStorage únicamente para que, al recargar
//   la página, las casillas de hábitos queden marcadas igual que la vez
//   anterior.
// - El mismo STORAGE_KEY se usa en habitsApi.js para generar la Daily Checklist.
// - Cuando el backend guarde realmente la selección del usuario, se podría:
//     a) mantener este comportamiento como mejora extra, o
//     b) eliminar el uso de localStorage y dejar que todo venga de la API.
//
//   Esto se puede decidir al final del proyecto. Por ahora es útil para la demo.
//

import { fetchUserHabits, fetchHabits, saveUserHabits } from "../api/habitsApi.js";

// ids de hábitos seleccionados (se usa en la sesión actual)
let habitState = new Map();
let selected = new Set();

// lista completa de hábitos cargados desde fetchHabits()
let allHabits = [];

// filtro actual ("all" | "wellness" | "health" | "academic" | "work")
let currentFilter = "all";

// para no volver a registrar los listeners de los tabs más de una vez
let tabsInitialized = false;

// Clave compartida con habitsApi.js para guardar selección en localStorage
const STORAGE_KEY = "habitus_selected_habits";

function loadHabitActivity(userHabits) {
  //proces raw data from backend to list unpackable values 
  let states = userHabits.map(
    (habit) => [ habit.habit_id, habit.is_active ]
  )
  
  //set user habit info into habitState
  for (let habit_info of states) habitState.set(...habit_info)
  //any not returned and not saved assume to not be active
  for (let habit_id of (new Set(allHabits.map((v)=>v.id))).difference(new Set(habitState.keys())))
    habitState.set(habit_id, false);
}

/**
 * Lee de localStorage los ids de hábitos seleccionados previamente
 * y los carga en el Set "selected".
 *
 * Esto es útil para que, al volver al catálogo (o recargar la página),
 * las casillas aparezcan marcadas igual que la última vez que se guardó.
 *
 * IMPORTANTE:
 * - Esto es un apoyo visual de frontend.
 * - El backend real podría proveer lo mismo vía un endpoint /user-habits.
 */
async function loadSelectedFromStorageToSet() {
  // Si ya tenemos algo en el Set, no volvemos a leer
  if (habitState.size > 0) return;
  let userHabits = await fetchUserHabits().catch(
    (reason)=>{
      console.error("Couldn't fetch active habits from user due to:\n", reason);
      return []
    }
  );
  loadHabitActivity(userHabits);
}

/**
 * Muestra la vista de Habit Catalog.
 *
 * Pasos:
 * 1. Obtiene el grid donde van las tarjetas.
 * 2. Carga la lista de hábitos (solo la primera vez) llamando a fetchHabits().
 * 3. Carga la selección previa desde localStorage (si existe).
 * 4. Inicializa los tabs (filtros por categoría) una sola vez.
 * 5. Renderiza las tarjetas según el filtro actual.
 * 6. Configura el botón "Save My Habits" para llamar a saveUserHabits().
 */
export async function showHabitsView() {
  const grid = document.getElementById("habits-grid");
  const btnSave = document.getElementById("save-habits-btn");
  if (!grid) return;

  // 1) Cargar la lista completa de hábitos solo la primera vez
  if (allHabits.length === 0) {
    allHabits = await fetchHabits();
  }

  // 2) Cargar selección previa (si existe) en el Set "selected"
  await loadSelectedFromStorageToSet();

  // 3) Inicializar tabs una sola vez
  if (!tabsInitialized) {
    initTabs();
    tabsInitialized = true;
  }

  // 4) Pintar los hábitos según el filtro actual
  renderHabits(grid);

  // 5) Guardar selección al pulsar "Save My Habits"
  if (btnSave) {
    btnSave.onclick = async () => {
      try {
        let newHabitActivity = await saveUserHabits(
          Array.from(selected).map((v)=>({id: v, active: !habitState.get(v)}))
        );
        loadHabitActivity(newHabitActivity);
      } catch (err) {
        alert("Error saving habits");
        console.error(err);
      }
    };
  }
}

/**
 * Inicializa los botones de las categorías en la barra de tabs.
 *
 * - Cada botón tiene un data-filter: "all", "wellness", "health", etc.
 * - Al hacer clic:
 *    - Marca ese botón como activo (clase .active).
 *    - Cambia el valor de currentFilter.
 *    - Vuelve a renderizar el grid solo con los hábitos de esa categoría.
 */
function initTabs() {
  const tabButtons = document.querySelectorAll(".tabs .tab");

  tabButtons.forEach((btn) => {
    const filter = btn.dataset.filter || "all";

    btn.addEventListener("click", () => {
      // Quitar la selección de todos los tabs
      tabButtons.forEach((b) => b.classList.remove("active"));

      // Marcar el tab actual
      btn.classList.add("active");

      // Cambiar el filtro actual y volver a dibujar
      currentFilter = filter;
      const grid = document.getElementById("habits-grid");
      if (grid) {
        renderHabits(grid);
      }
    });
  });
}

/**
 * Dibuja las tarjetas de hábitos dentro del grid recibido.
 *
 * - Aplica el filtro según currentFilter:
 *    - "all": todos los hábitos.
 *    - otro: solo los de esa categoría.
 *
 * - Cada tarjeta incluye:
 *    - Nombre del hábito.
 *    - Descripción.
 *    - Checkbox para seleccionar/deseleccionar.
 *
 * - El checkbox consulta el Set "selected" para saber si debe iniciar marcado.
 * - Al cambiar, actualiza el Set "selected".
 */
function renderHabits(grid) {
  grid.innerHTML = "";

  // Filtrar hábitos según la categoría actual
  const visibleHabits = allHabits.filter((h) => {
    if (currentFilter === "all") return true;
    return h.category === currentFilter;
  });

  // Crear una tarjeta para cada hábito visible
  visibleHabits.forEach((h) => {
    const card = document.createElement("div");
    card.className = "habit-card";

    const title = document.createElement("div");
    title.className = "habit-title";
    title.textContent = h.name;

    const desc = document.createElement("div");
    desc.className = "habit-desc";
    desc.textContent = h.description;

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.className = "habit-toggle";

    // Si el id está en "selected", marcamos el checkbox al cargar
    toggle.checked = habitState.get(h.id);

    // Cuando el usuario marca o desmarca, se actualiza el Set
    toggle.addEventListener("change", () => {
      if (toggle.checked != habitState.get(h.id)) {
        selected.add(h.id);
      } else {
        selected.delete(h.id);
      }
    });

    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(toggle);
    grid.appendChild(card);
  });
}
