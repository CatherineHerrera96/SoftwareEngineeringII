// api/habitsApi.js
import { getCurrentUser, getToken } from "../state.js";

/*
  ==========================================================
  MÓDULO DE HÁBITOS (FRONTEND MOCK)
  ==========================================================

  Este archivo SIMULA el comportamiento del backend en Python:

  - Usa una lista de hábitos "mockHabits" definida aquí mismo.
  - Guarda temporalmente los hábitos seleccionados usando localStorage.
  - Genera la Daily Checklist en el frontend a partir de esa selección.
  - Guarda el estado Done/Missed del día en localStorage para que
    no se reinicie al cambiar de vista.

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
      - POST /api/checkins
      - GET  /api/stats/weekly
      - GET  /api/achievements

    En esa etapa se pueden ELIMINAR los mocks (mockHabits, localStorage)
    si ya no son necesarios.
*/

// URL base esperada para el backend en Python
const PY_BASE_URL = "http://localhost:8000/";

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
// Estado diario (Daily Checklist) guardado por día en localStorage
// ----------------------------------------------------------
//
// Esto es solo para que, en modo demo, los cambios Done/Missed
// no se pierdan al cambiar de vista. El backend real se encargará
// de persistir los checkins en base de datos.
//

// Clave para guardar el estado diario de los hábitos.
const DAILY_STATUS_KEY = "habitus_daily_status";

/**
 * Devuelve la fecha de hoy en formato YYYY-MM-DD.
 * Se usa para que el estado Done/Missed se resetee cada día.
 */
function getTodayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Lee de localStorage el estado diario de los hábitos SOLO si es del día de hoy.
 *
 * Estructura almacenada:
 * {
 *   date: "2025-11-23",
 *   statuses: {
 *     "1": true,   // habit_id 1 completado
 *     "2": false
 *   }
 * }
 */
async function loadTodayDailyStatus() {
  let habits = await fetch(`${PY_BASE_URL}user-habits/active/${getCurrentUser().id}`).then(
    async (res) => {
      if (!res.ok) {
        console.error("Couldn't fetch user's active habits")
        return [];
      }
      return (await res.json()).reduce((prev, cur)=> {
        prev[cur.habit_id] = cur.is_completed;
        return prev;
      }, {})
    },
    (res) => {
      console.error("Couldn't fetch user's active habits")
      return [];  
    }
  );

  return habits;
}

/**
 * Actualiza en localStorage el estado diario de un hábito para el día de hoy.
 */
function saveTodayDailyStatus(habitId, completed) {
  try {
    const today = getTodayDateStr();
    let data = {
      date: today,
      statuses: {},
    };

    const raw = localStorage.getItem(DAILY_STATUS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.date === today && parsed.statuses) {
        data = parsed;
      }
    }

    data.statuses[String(habitId)] = !!completed;
    localStorage.setItem(DAILY_STATUS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("[MOCK] Error saving DAILY_STATUS to storage", e);
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
  let res = await fetch(`${PY_BASE_URL}habits/`);
  if (res.ok) return res.json();
  return mockHabits;
}

let activeHabits = null;
export async function fetchUserHabits() {
  if (activeHabits !== null) return activeHabits;
  const user_id = getCurrentUser().id;
  
  let res = await fetch(`${PY_BASE_URL}user-habits/${user_id}/`);
  if (res.ok) {
    activeHabits = await res.json();
    return activeHabits;
  }
  throw new Error("Unexpected response");
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
export async function saveUserHabits(modifiedHabits) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const user = getCurrentUser().id;

  // MOCK FRONTEND: actualizamos selección en memoria y en localStorage
  // selectedHabitIds = habitIds || [];
  // saveSelectedToStorage(selectedHabitIds);

  // Aquí, en la versión real:
  let res = await fetch(`${PY_BASE_URL}user-habits/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(modifiedHabits.map((v) => ({ habit_id: v.id, user_id: `${user}`, is_active: v.active }))),
  });
  
  if (!res.ok) {
    throw new Error("Error saving user habits");
  }

  let data = await res.json();
  alert("Habits saved! (demo)");
  return data;
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
 *   - Crea un ítem diario por hábito seleccionado.
 *   - Usa DAILY_STATUS_KEY para saber si hoy está marcado como completed.
 */
export async function fetchDailyChecklist() {
  const token = getToken();
  if (!token) return [];
  const user = getCurrentUser().id;

  // Asegurar que tenemos la selección cargada
  loadSelectedFromStorage();

  if (!selectedHabitIds || selectedHabitIds.length === 0) {
    // Si el usuario no ha elegido hábitos aún, no mostramos nada
    return [];
  }

  selectedHabitIds = await fetch(`${PY_BASE_URL}user-habits/active/${user}`)
    .then(
      async (res) => {
        if (!res.ok) {
          console.error("Couldn't fetch user's active habits")
          return [];
        }
        return (await res.json()).map((v)=> ({
          id: v.habit_id,
          name: v.name,
          completed: v.is_completed,
          userHabitId: v.id
        }))
      },
      (res) => {
        console.error("Couldn't fetch user's active habits")
        return [];  
      }
    )

  return selectedHabitIds;
}

/**
 * BACKEND TODO: implementar POST /api/checkins o similar
 *
 * - El frontend podría enviar:
 *   { "habit_id": 1, "date": "2025-11-23", "completed": true }
 *
 * MOCK ACTUAL:
 *   - Actualiza localStorage para el día actual (para que no se
 *     reinicie al cambiar de vista).
 *   - Muestra por consola qué se marcaría como done/missed.
 */
export async function saveDailyStatus(id, completed) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  // MOCK FRONTEND: guardar estado para HOY
  // console.log("[MOCK] saveDailyStatus -> id:", id, "completed:", completed);
  // saveTodayDailyStatus(id, completed);

  // Versión real (ejemplo):
  const res = await fetch(`${PY_BASE_URL}checkins/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_habit_id: id, date: getTodayDateStr(), is_completed: completed }),
  });
  if (!res.ok) throw new Error("Error saving daily status");
  return await res.json()
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
  const user = getCurrentUser().id
  // MOCK FRONTEND: datos estáticos
  // return {
  //   completion: 75,
  //   streak: 14,
  //   achievements: mockAchievements,
  // };

  let data = fetch(`${PY_BASE_URL}stats/weekly/${user}`)
    .then(
      async (res) => {
        if (!res.ok) {
          console.error("Couldn't fetch weekly stats");
          return {};
        }
        let res_data =  await res.json();
        return { completion: res_data.completion_rate, streak: res_data.streak_global }
      },
      (res) => {
        console.error("Couldn't fetch weekly stats");
        return {};

      }
    )
  
  data["achievements"] = await fetch(`${PY_BASE_URL}achievements/${user}`)
    .then(
      async (res) => {
        if (!res.ok) {
          console.error("Couldn't fetch achievements");
          return {};
        }
        return await res.json();
      },
      (res) => {
        if (!res.ok) {
          console.error("Couldn't fetch achievements");
          return {};
        }
      }
    )
  return data;
}
