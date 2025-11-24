// api/habitsApi.js
import { getToken } from "../state.js";

/*
  ==========================================================
  MÓDULO DE HÁBITOS (FRONTEND MOCK)
  ==========================================================

  Este archivo SIMULA el comportamiento del backend en Python:

  - Usa una lista de hábitos "mockHabits" definida aquí mismo.
  - Guarda temporalmente los hábitos seleccionados usando localStorage.
  - Genera la Daily Checklist en el frontend a partir de esa selección.

  OBJETIVO:
    Permitir que el frontend se vea completo y demostrable
    (Habit Catalog -> Daily Checklist -> Dashboard) aunque
    el backend real todavía no esté implementado.

  IMPORTANTE PARA BACKEND:
    Más adelante, cuando el backend en Python exista, las funciones
    marcadas con "BACKEND TODO" deben reemplazarse por llamadas
    reales (fetch) a la API:

      - GET  /api/habits
      - POST /api/user-habits
      - GET  /api/daily-checklist
      - GET  /api/stats/weekly
      - GET  /api/achievements
      - GET  /api/user-achievements

    En esa etapa se pueden ELIMINAR los mocks (mockHabits, localStorage)
    si ya no son necesarios.
*/

// URL base esperada para el backend en Python (no usada aún en el mock)
const PY_BASE_URL = "http://localhost:8000/api";

// ----------------------------------------------------------
// Datos de ejemplo: catálago de hábitos
// ----------------------------------------------------------
// category: "wellness" | "health" | "academic" | "work"
const mockHabits = [
  // WELLNESS
  {
    id: 1,
    name: "Drink Water",
    description: "Stay hydrated throughout the day.",
    category: "wellness",
  },
  {
    id: 2,
    name: "Meditate",
    description: "Practice mindfulness for 10 minutes.",
    category: "wellness",
  },
  {
    id: 3,
    name: "Walk Outdoors",
    description: "Take a short walk in nature.",
    category: "wellness",
  },

  // HEALTH
  {
    id: 4,
    name: "Exercise",
    description: "Engage in physical activity for at least 30 minutes.",
    category: "health",
  },
  {
    id: 5,
    name: "Eat Healthy",
    description: "Consume balanced and nutritious meals.",
    category: "health",
  },
  {
    id: 6,
    name: "Meal Prep",
    description: "Prepare healthy meals in advance.",
    category: "health",
  },

  // ACADEMIC
  {
    id: 7,
    name: "Study 45 min",
    description: "Focus on a learning task without distractions.",
    category: "academic",
  },
  {
    id: 8,
    name: "Read Book",
    description: "Read a chapter or for 20 minutes.",
    category: "academic",
  },
  {
    id: 9,
    name: "Code Review",
    description: "Review code or learn new coding concepts.",
    category: "academic",
  },

  // WORK
  {
    id: 10,
    name: "Plan my day",
    description: "Organize your tasks and priorities for the day.",
    category: "work",
  },
  {
    id: 11,
    name: "Journal",
    description: "Write down thoughts and reflections.",
    category: "work",
  },
  {
    id: 12,
    name: "Connect with Loved Ones",
    description: "Spend quality time with family or friends.",
    category: "work",
  },
];

// ----------------------------------------------------------
// Datos de ejemplo: logros para el dashboard
// ----------------------------------------------------------
const mockAchievements = [
  {
    id: 1,
    title: "First Habit Master",
    description: "Completed your first habit 7 days in a row!",
  },
  {
    id: 2,
    title: "Consistent Builder",
    description: "Reached a 14-day habit streak!",
  },
  {
    id: 3,
    title: "Daily Achiever",
    description: "Successfully tracked 30 habits in a month!",
  },
];

// ----------------------------------------------------------
// Simulación de selección guardada (por usuario)
// ----------------------------------------------------------
// NOTA: por ahora esto se guarda en localStorage, únicamente
//       para DEMO frontend. El backend real debería guardar
//       esta relación en tablas como user_habits.
const STORAGE_KEY_SELECTED = "habitus_selected_habits";

// Versión en memoria de los ids seleccionados (se rellena desde localStorage)
let selectedHabitIds = [];

/**
 * Carga los ids seleccionados desde localStorage (si existen).
 * Se usa para inicializar "selectedHabitIds".
 */
function loadSelectedFromStorage() {
  if (selectedHabitIds.length > 0) return; // ya estaban cargados

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SELECTED);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        selectedHabitIds = arr;
      }
    }
  } catch (e) {
    console.warn("Error reading selected habits from storage", e);
  }
}

/**
 * Guarda los ids seleccionados en localStorage.
 * Esto es SOLO PARA DEMO. En producción, el backend debería
 * guardar esta información y devolverla con /user-habits.
 */
function saveSelectedToStorage(ids) {
  try {
    localStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify(ids));
  } catch (e) {
    console.warn("Error saving selected habits to storage", e);
  }
}

// ----------------------------------------------------------
// Funciones expuestas al resto del frontend
// ----------------------------------------------------------

/**
 * BACKEND TODO: implementar GET /api/habits
 *
 * - El backend deberá devolver un JSON como:
 *   [
 *     { "id": 1, "name": "Drink Water", "description": "...", "category": "wellness" },
 *     ...
 *   ]
 *
 * - Cuando el backend esté listo, esta función deberá usar:
 *   const res = await fetch(`${PY_BASE_URL}/habits`, { headers: { Authorization: ... } });
 *   const data = await res.json();
 *   return data;
 */
export async function fetchHabits() {
  const token = getToken();
  if (!token) return [];

  // MOCK FRONTEND: devolvemos la lista local "mockHabits"
  return mockHabits;
}

/**
 * BACKEND TODO: implementar POST /api/user-habits
 *
 * - El frontend enviará algo como:
 *   { "habit_ids": [1, 2, 3] }
 *
 * - El backend debe guardar la selección para el usuario autenticado.
 *   Posteriormente, /user-habits o /daily-checklist usarán esta info.
 */
export async function saveUserHabits(habitIds) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  // MOCK FRONTEND: actualizamos selección en memoria y en localStorage
  selectedHabitIds = habitIds || [];
  saveSelectedToStorage(selectedHabitIds);

  // Aquí, en la versión real:
  // const res = await fetch(`${PY_BASE_URL}/user-habits`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${token}`,
  //   },
  //   body: JSON.stringify({ habit_ids: habitIds }),
  // });
  // if (!res.ok) throw new Error("Error saving user habits");

  alert("Habits saved! (demo)");
}

/**
 * BACKEND TODO: implementar GET /api/daily-checklist
 *
 * - El backend debería devolver los hábitos diarios para el usuario
 *   según lo que tenga almacenado en user_habits / habit_tracker, etc.
 *
 *   Respuesta esperada:
 *   [
 *     { "id": 1, "name": "Drink Water", "completed": false },
 *     { "id": 2, "name": "Meditate", "completed": true },
 *     ...
 *   ]
 *
 * MOCK ACTUAL:
 *   - Toma los ids guardados en localStorage.
 *   - Los cruza con "mockHabits".
 *   - Crea un ítem diario por hábito seleccionado, con completed = false.
 */
export async function fetchDailyChecklist() {
  const token = getToken();
  if (!token) return [];

  // Asegurar que tenemos la selección cargada
  loadSelectedFromStorage();

  if (!selectedHabitIds || selectedHabitIds.length === 0) {
    // Si el usuario no ha elegido hábitos aún, no mostramos nada
    return [];
  }

  // Para cada id seleccionado creamos un ítem diario
  const items = selectedHabitIds
    .map((id) => {
      const habit = mockHabits.find((h) => h.id === id);
      if (!habit) return null;
      return {
        id: habit.id,
        name: habit.name,
        completed: false, // por defecto no completado (el estado se maneja en la vista por ahora)
      };
    })
    .filter(Boolean); // limpia nulls si algún id no existe

  return items;
}

/**
 * BACKEND TODO: implementar POST /api/checkins o similar
 *
 * - El frontend podría enviar:
 *   { "habit_id": 1, "date": "2025-11-23", "completed": true }
 *
 * MOCK ACTUAL:
 *   Solo muestra por consola qué se marcaría como done/missed.
 */
export async function saveDailyStatus(id, completed) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  // MOCK FRONTEND
  console.log("[MOCK] saveDailyStatus -> id:", id, "completed:", completed);

  // Versión real (ejemplo):
  // const res = await fetch(`${PY_BASE_URL}/checkins`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${token}`,
  //   },
  //   body: JSON.stringify({ habit_id: id, completed }),
  // });
  // if (!res.ok) throw new Error("Error saving daily status");
}

/**
 * BACKEND TODO: implementar GET /api/stats/weekly y /api/achievements
 *
 * - El backend debería calcular:
 *   - Porcentaje de cumplimiento semanal.
 *   - Rachas actuales.
 *   - Lista de logros desbloqueados.
 *
 * MOCK ACTUAL:
 *   Devuelve valores fijos para que el Dashboard se vea completo.
 */
export async function fetchWeeklyStatsAndAchievements() {
  const token = getToken();
  if (!token) return { completion: 0, streak: 0, achievements: [] };

  // MOCK FRONTEND: datos estáticos
  return {
    completion: 75,
    streak: 14,
    achievements: mockAchievements,
  };

  // Versión real (ejemplo):
  // const res = await fetch(`${PY_BASE_URL}/stats/weekly`, {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // const stats = await res.json();
  //
  // const resAch = await fetch(`${PY_BASE_URL}/achievements`, {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // const achievements = await resAch.json();
  //
  // return { ...stats, achievements };
}
