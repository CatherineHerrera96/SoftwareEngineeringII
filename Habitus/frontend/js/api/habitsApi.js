// api/habitsApi.js
import { getToken } from "../state.js";

const PY_BASE_URL = "http://localhost:8000/api";

export async function fetchHabits() {
  const token = getToken();
  if (!token) return [];

  const res = await fetch(`${PY_BASE_URL}/habits/`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    console.error("Failed to fetch habits");
    return [];
  }

  return await res.json();
}

export async function saveUserHabits(habitIds) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  // Backend expects { habit_ids: List[str] }
  const habitIdsAsStrings = habitIds.map(id => String(id));

  const res = await fetch(`${PY_BASE_URL}/user-habits/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ habit_ids: habitIdsAsStrings }),
  });

  if (res.status === 422) {
    const errorDetail = await res.json();
    console.error("Validation error (422):", errorDetail);
    throw new Error("Invalid habit data sent to server");
  }

  if (!res.ok) {
    throw new Error(`Error saving user habits: ${res.statusText}`);
  }

  return await res.json();
}

export async function fetchDailyChecklist() {
  const token = getToken();
  if (!token) return [];

  // We use list_my_habits which returns user's habits with completion status for today/week
  const res = await fetch(`${PY_BASE_URL}/user-habits/`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) return [];

  const data = await res.json();
  // Map to format expected by frontend views if necessary
  // Backend returns: { id, user_id, habit_id, is_active, is_completed }
  // Frontend expects: { id (habit_id?), name, completed }

  // We need the habit name. The backend UserHabitRead doesn't include the name directly?
  // Let's check schemas.UserHabitRead. It only has IDs.
  // We might need to fetch habits catalog to map names, or update backend to include name.
  // For now, let's fetch habits catalog too.

  const habits = await fetchHabits();

  return data.map(uh => {
    const habit = habits.find(h => h.id === uh.habit_id);
    return {
      id: uh.id, // This is user_habit_id, needed for checkin
      habit_id: uh.habit_id,
      name: habit ? habit.name : "Unknown Habit",
      completed: uh.is_completed
    };
  });
}

export async function saveDailyStatus(userHabitId, completed) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  // Backend expects: { user_habit_id, date, is_completed }
  const dateStr = new Date().toISOString().slice(0, 10);

  const res = await fetch(`${PY_BASE_URL}/checkins/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      user_habit_id: userHabitId,
      date: dateStr,
      is_completed: completed
    }),
  });

  if (!res.ok) throw new Error("Error saving daily status");
}

export async function fetchWeeklyStatsAndAchievements() {
  const token = getToken();
  if (!token) return { completion: 0, streak: 0, achievements: [] };

  const resStats = await fetch(`${PY_BASE_URL}/stats/weekly`, {
    headers: { "Authorization": `Bearer ${token}` },
  });

  let stats = { completion_rate: 0, streak_global: 0 };
  if (resStats.ok) {
    stats = await resStats.json();
  }

  const resAch = await fetch(`${PY_BASE_URL}/achievements/mine`, {
    headers: { "Authorization": `Bearer ${token}` },
  });

  let achievements = [];
  if (resAch.ok) {
    achievements = await resAch.json();
  }

  return {
    completion: Math.round(stats.completion_rate * 100),
    streak: stats.streak_global,
    achievements: achievements,
  };
}

export async function getProfile() {
  const token = getToken();
  const res = await fetch(`${PY_BASE_URL}/profile/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function updateProfile(data) {
  const token = getToken();
  const res = await fetch(`${PY_BASE_URL}/profile/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}
