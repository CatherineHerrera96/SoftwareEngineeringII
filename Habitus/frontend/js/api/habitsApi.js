import { getToken, clearAuth } from '../state.js';
import { showNotification } from '../ui.js';

// PYTHON API URL - Dynamic Host for Remote/Network Access
const API_HOST = window.location.hostname; // e.g. 'localhost' or '25.x.x.x' or '192.168.x.x'
const PY_BASE_URL = `http://${API_HOST}:8000/api`;

export async function fetchHabits() {
  const token = getToken();
  const response = await fetch(`${PY_BASE_URL}/habits/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearAuth();
      showNotification("Session expired.", "error");
      setTimeout(() => location.reload(), 1000);
      throw new Error("Session expired");
    }
    throw new Error('Failed to fetch habits');
  }
  return await response.json();
}

export async function createCustomHabit(habitData) {
  const token = getToken();
  const response = await fetch(`${PY_BASE_URL}/habits/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(habitData)
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearAuth();
      showNotification("Session expired.", "error");
      setTimeout(() => location.reload(), 1000);
      throw new Error("Session expired");
    }
    throw new Error('Failed to create habit');
  }
  return await response.json();
}

export async function updateHabit(habitId, habitData) {
  const token = getToken();
  const response = await fetch(`${PY_BASE_URL}/habits/${habitId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(habitData)
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearAuth();
      showNotification("Session expired.", "error");
      setTimeout(() => location.reload(), 1000);
      throw new Error("Session expired");
    }
    throw new Error('Failed to update habit');
  }
  return await response.json();
}

export async function deleteHabit(habitId) {
  const token = getToken();
  const response = await fetch(`${PY_BASE_URL}/habits/${habitId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearAuth();
      showNotification("Session expired.", "error");
      setTimeout(() => location.reload(), 1000);
      throw new Error("Session expired");
    }
    throw new Error('Failed to delete habit');
  }
  return true;
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
    if (res.status === 401 || res.status === 403) {
      clearAuth();
      showNotification("Session expired.", "error");
      setTimeout(() => location.reload(), 1000);
      throw new Error("Session expired");
    }
    throw new Error(`Error saving user habits: ${res.statusText}`);
  }

  return await res.json();
}

export async function fetchDailyChecklist() {
  const token = getToken();
  if (!token) return [];

  const res = await fetch(`${PY_BASE_URL}/user-habits/`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      clearAuth();
      showNotification("Session expired.", "error");
      setTimeout(() => location.reload(), 1000);
      return [];
    }
    return [];
  }

  const data = await res.json();

  // We need the habit name. Fetch habits catalog to map names.
  const habits = await fetchHabits();

  return data.map(uh => {
    const habit = habits.find(h => h.id === uh.habit_id);
    return {
      id: uh.id, // user_habit_id
      habit_id: uh.habit_id,
      habit_name: habit ? habit.name : "Unknown Habit",
      habit_category: habit ? habit.category : "",
      is_completed: uh.is_completed, // Backend returns this computed field
      current_streak: uh.current_streak || 0,
      longest_streak: uh.longest_streak || 0,
      total_completions: uh.total_completions || 0,
      lock_until: uh.next_available_checkin_at, // Use standardized name for UI
      is_active: uh.is_active,
      streak_broken: uh.streak_broken,
      previous_streak: uh.previous_streak
    };
  });
}

export async function saveCheckin(userHabitId, completed) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

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

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      clearAuth();
      showNotification("Session expired.", "error");
      setTimeout(() => location.reload(), 1000);
      throw new Error("Session expired");
    }

    // Handle Cooldown (409)
    if (res.status === 409) {
      const errData = await res.json();
      throw new Error(JSON.stringify(errData.detail || errData));
    }

    // Handle other errors (500, 400, etc)
    let errorMessage = "Error saving daily status";
    try {
      const errData = await res.json();
      console.error("[Checkin API Error]", errData);
      if (errData.detail) errorMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
    } catch (e) {
      console.error("Could not parse error response", e);
    }
    throw new Error(errorMessage);
  }
  return await res.json();
}

export async function getProfile() {
  const token = getToken();
  const response = await fetch(`${PY_BASE_URL}/profile/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearAuth();
      showNotification("Session expired.", "error");
      setTimeout(() => location.reload(), 1000);
      throw new Error("Session expired");
    }
    throw new Error('Failed to fetch profile');
  }
  return await response.json();
}

export async function updateProfile(data) {
  const token = getToken();
  const response = await fetch(`${PY_BASE_URL}/profile/`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update profile');
  return await response.json();
}

export async function getAchievements() {
  const token = getToken();
  const response = await fetch(`${PY_BASE_URL}/achievements/mine`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearAuth();
      showNotification("Session expired.", "error");
      setTimeout(() => location.reload(), 1000);
      throw new Error("Session expired");
    }
    throw new Error('Failed to fetch achievements');
  }
  return await response.json();
}

export async function deleteUserHabit(userHabitId, confirm = false) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  // Add confirm flag if true
  const url = `${PY_BASE_URL}/user-habits/${userHabitId}${confirm ? '?confirm=true' : ''}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      clearAuth();
      showNotification("Session expired.", "error");
      setTimeout(() => location.reload(), 1000);
      throw new Error("Session expired");
    }

    // Handle Confirmation Required (409)
    if (res.status === 409) {
      const errorData = await res.json();
      throw new Error(JSON.stringify(errorData));
    }

    throw new Error("Failed to delete habit");
  }

  return true;
}

export async function fetchStreakWindow() {
  const token = getToken();
  if (!token) throw new Error("No token");

  const res = await fetch(`${PY_BASE_URL}/streak-window`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch streak window");
  }
  return await res.json();
}
