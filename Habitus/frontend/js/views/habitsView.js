import { fetchHabits, saveUserHabits, createCustomHabit, fetchDailyChecklist, updateHabit, deleteHabit, deleteUserHabit } from '../api/habitsApi.js';
import { showNotification } from '../ui.js';
import { getSeasonalTheme, applyGlobalTheme, SEASONAL_THEMES, CURRENT_SEASON } from '../config/seasonalThemes.js';

let allHabits = [];
let selectedHabitIds = new Set();

// Confirmation modal promise resolver
let confirmResolve = null;

export async function renderHabits() {
  // 0. Apply Global Theme
  applyGlobalTheme();

  // 1. Fetch Data
  try {
    const [habits, userHabits] = await Promise.all([
      fetchHabits(),
      fetchDailyChecklist()
    ]);

    allHabits = habits;

    // Map habit_id -> user_habit_id to support correct De-add (unassign)
    // selectedHabitIds helps for quick "is added" check
    selectedHabitIds = new Set(userHabits.map(uh => uh.habit_id));
    window.userHabitMap = new Map(); // Global or module-scope map
    userHabits.forEach(uh => window.userHabitMap.set(uh.habit_id, uh.id));

    renderHabitsGrid('all');

    // 2. Enforce Seasonal Persistence (Cleanup)
    // Remove any user habit that belongs to an inactive season.
    await cleanupInactiveSeasonalHabits(habits, userHabits);

  } catch (err) {
    console.error('Error loading habits:', err);
    showNotification('Failed to load habits', 'error');
  }

  // 2. Setup Listeners
  setupHabitsListeners();
  // 2. Setup Listeners
  setupHabitsListeners();
}

async function cleanupInactiveSeasonalHabits(allHabits, userHabits) {
  // Collect specific UserHabit IDs to delete
  const toDelete = [];

  // Map habit_id to full habit obj for easy lookup
  const habitMap = new Map();
  allHabits.forEach(h => habitMap.set(h.id, h));

  for (const uh of userHabits) {
    const habit = habitMap.get(uh.habit_id);
    if (!habit) continue;

    // Check if this habit belongs to a season
    const seasonId = SEASONAL_THEMES.find(t => {
      const n = habit.name.toLowerCase();
      const c = habit.category ? habit.category.toLowerCase() : '';
      return t.keywords.some(k => n.includes(k)) || t.id === c;
    })?.id;

    if (seasonId) {
      // It is seasonal.
      // Invalid if:
      // 1. CURRENT_SEASON is null (No seasonal habits allowed)
      // 2. CURRENT_SEASON != seasonId (Wrong season)
      if (!CURRENT_SEASON || CURRENT_SEASON !== seasonId) {
        toDelete.push(uh.id);
      }
    }
  }

  if (toDelete.length > 0) {
    console.log(`Cleaning up ${toDelete.length} inactive seasonal habits...`);
    try {
      // Delete one by one (or batch if API supported, but loop is fine for small numbers)
      await Promise.all(toDelete.map(id => deleteUserHabit(id)));
      // Update local state by removing from sets/maps
      toDelete.forEach(id => {
        // Find habit_id from user_habit_id
        const habitId = [...window.userHabitMap.entries()]
          .find(([hId, uId]) => uId === id)?.[0];
        if (habitId) {
          selectedHabitIds.delete(habitId);
          window.userHabitMap.delete(habitId);
        }
      });
      // Re-render to reflect removal
      renderHabitsGrid('all');
      showNotification(`Cleaned up ${toDelete.length} inactive seasonal habits.`);
    } catch (err) {
      console.error("Cleanup failed:", err);
    }
  }
}

function setupHabitsListeners() {
  // Category Tabs
  document.querySelectorAll('#category-tabs .tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#category-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderHabitsGrid(btn.dataset.filter);
    };
  });

  // Create Custom Habit
  const form = document.getElementById('create-habit-form');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('new-habit-name').value;
      const cat = document.getElementById('new-habit-cat').value;
      const desc = document.getElementById('new-habit-desc')?.value || '';

      const newHabitData = {
        name: name,
        category: cat,
        description: desc || "Custom habit",
        frequency: "daily",
        is_custom: true
      };

      try {
        const created = await createCustomHabit(newHabitData);
        allHabits.push(created);

        // Automatically add to user's profile
        try {
          const addedList = await saveUserHabits([created.id]);
          if (addedList && addedList.length > 0) {
            if (!window.userHabitMap) window.userHabitMap = new Map();
            window.userHabitMap.set(created.id, addedList[0].id);
          }
          selectedHabitIds.add(created.id);
          showNotification(`Created & Added ${name}!`);
        } catch (e) {
          console.error("Auto-add failed", e);
          showNotification(`Created ${name}, but failed to add to profile.`, 'warning');
        }

        form.reset();
        renderHabitsGrid();
      } catch (err) {
        showNotification("Failed to create habit", "error");
      }
    };
  }

  // Edit Habit Modal
  setupEditHabitModal();

  // Confirmation Modal
  setupConfirmModal();
}

function setupConfirmModal() {
  const modal = document.getElementById('confirm-modal');
  const cancelBtn = document.getElementById('confirm-cancel');
  const okBtn = document.getElementById('confirm-ok');

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      modal.style.display = 'none';
      if (confirmResolve) {
        confirmResolve(false);
        confirmResolve = null;
      }
    };
  }

  if (okBtn) {
    okBtn.onclick = () => {
      modal.style.display = 'none';
      if (confirmResolve) {
        confirmResolve(true);
        confirmResolve = null;
      }
    };
  }

  // Close modal on outside click
  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        if (confirmResolve) {
          confirmResolve(false);
          confirmResolve = null;
        }
      }
    };
  }
}

function showConfirmDialog(title, message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;

    confirmResolve = resolve;
    modal.style.display = 'flex';
  });
}

function setupEditHabitModal() {
  const modal = document.getElementById('edit-habit-modal');
  const cancelBtn = document.getElementById('cancel-edit-habit');
  const editForm = document.getElementById('edit-habit-form');

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      modal.style.display = 'none';
    };
  }

  // Close modal on outside click
  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    };
  }

  if (editForm) {
    editForm.onsubmit = async (e) => {
      e.preventDefault();
      const habitId = parseInt(document.getElementById('edit-habit-id').value);
      const updateData = {
        name: document.getElementById('edit-habit-name').value,
        category: document.getElementById('edit-habit-cat').value,
        description: document.getElementById('edit-habit-desc').value || null
      };

      try {
        const updated = await updateHabit(habitId, updateData);
        // Update local array
        const idx = allHabits.findIndex(h => h.id === habitId);
        if (idx !== -1) {
          allHabits[idx] = { ...allHabits[idx], ...updated };
        }
        modal.style.display = 'none';
        showNotification('Habit updated!');
        renderHabitsGrid();
      } catch (err) {
        showNotification('Failed to update habit', 'error');
      }
    };
  }
}

function openEditModal(habit) {
  const modal = document.getElementById('edit-habit-modal');
  document.getElementById('edit-habit-id').value = habit.id;
  document.getElementById('edit-habit-name').value = habit.name;
  document.getElementById('edit-habit-cat').value = habit.category;
  document.getElementById('edit-habit-desc').value = habit.description || '';
  modal.style.display = 'flex';
}

async function handleDeleteHabit(habit) {
  const confirmed = await showConfirmDialog(
    `Delete "${habit.name}"?`,
    'This habit will be permanently removed. This action cannot be undone.'
  );

  if (!confirmed) return;

  try {
    await deleteHabit(habit.id);
    allHabits = allHabits.filter(h => h.id !== habit.id);
    selectedHabitIds.delete(habit.id);
    showNotification('Habit deleted!');
    renderHabitsGrid();
  } catch (err) {
    showNotification('Failed to delete habit', 'error');
  }
}


// Helper to determine if a habit matches the current season
function isCurrentSeasonHabit(habit) {
  if (!CURRENT_SEASON) return false;
  // We can match by category == Season Name (e.g. "Christmas")
  // Or check theme keywords
  const theme = getSeasonalTheme(habit.name, habit.category);
  // getSeasonalTheme now strictly returns null if season mismatches, so existence check is enough
  return !!theme;
}

function renderHabitsGrid(filter = 'all') {
  const grid = document.getElementById('habits-grid');
  if (!grid) return;

  grid.innerHTML = '';

  // FILTERING:
  // 1. Category Filter (Tabs)
  let visible = allHabits.filter(h => filter === 'all' || h.category.toLowerCase() === filter.toLowerCase());

  // 2. Periodic/Seasonal Filter
  // Logic:
  // - If it's a "Seasonal Habit" (matches any defined season):
  //    - If CURRENT_SEASON is null -> HIDE IT.
  //    - If CURRENT_SEASON is set  -> SHOW ONLY IF matches current season.
  // - If it's a "Regular Habit" -> SHOW ALWAYS.

  visible = visible.filter(h => {
    // Check if this habit belongs to ANY season definition
    // We check all themes to find a match, ignoring CURRENT_SEASON for a moment
    const matchedSeasonId = SEASONAL_THEMES.find(t => {
      const n = h.name.toLowerCase();
      const c = h.category ? h.category.toLowerCase() : '';
      return t.keywords.some(k => n.includes(k)) || t.id === c;
    })?.id;

    if (matchedSeasonId) {
      // It IS a seasonal habit.
      // Rule: Show only if CURRENT_SEASON matches strictly.
      if (!CURRENT_SEASON) return false; // "No Seasonal Mode" -> Hide all seasonal
      return CURRENT_SEASON === matchedSeasonId;
    }

    // Not a seasonal habit -> Keep it
    return true;
  });

  // SORTING:
  // 1. Current Season first
  // 2. Alphabetical
  visible.sort((a, b) => {
    const isSeasonA = isCurrentSeasonHabit(a);
    const isSeasonB = isCurrentSeasonHabit(b);

    if (isSeasonA && !isSeasonB) return -1;
    if (!isSeasonA && isSeasonB) return 1;

    // Fallback sort: Alphabetical by Name
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;

    return 0;
  });

  if (visible.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted); grid-column: 1/-1; text-align:center;">No habits found.</p>';
    return;
  }

  // DEDUPLICATION:
  // Prefer System habits (is_custom=false) over Custom habits (is_custom=true) if names match.
  const uniqueMap = new Map();
  visible.forEach(h => {
    // Normalization: Ensure is_custom is boolean
    h.is_custom = !!h.is_custom;

    if (uniqueMap.has(h.name)) {
      const existing = uniqueMap.get(h.name);
      // If we have an existing Custom habit, and the new one is System, overwrite with System.
      if (existing.is_custom && !h.is_custom) {
        uniqueMap.set(h.name, h);
      }
      // If existing is System, and new is Custom, ignore new.
      // If both are same type, keep first (or sort order dependent).
    } else {
      uniqueMap.set(h.name, h);
    }
  });

  const dedupedList = Array.from(uniqueMap.values());

  dedupedList.forEach(h => {
    const isSelected = selectedHabitIds.has(h.id);
    const isCustom = h.is_custom;

    // Use shared helper
    const themeObj = getSeasonalTheme(h.name, h.category);
    // themeObj is strictly null if not current season, so we only get styles for active season
    const themeClass = themeObj ? themeObj.className : '';
    const displayBadge = themeObj ? themeObj.displayName : h.category;

    const card = document.createElement('div');
    card.className = `habit-card ${isSelected ? 'selected' : ''} ${themeClass}`;
    const badgeStyle = themeObj ? 'background: rgba(255,255,255,0.2); font-weight:bold;' : '';

    // Button Logic
    let actionBtnHtml = '';
    if (isSelected) {
      actionBtnHtml = `<button class="btn-selection-toggle added" style="padding: 0.4rem 0.8rem; font-size:0.8rem; border-radius: 20px; background: var(--success); color: white; border: none; cursor:pointer;" title="Click to remove">✓ Added</button>`;
    } else {
      actionBtnHtml = `<button class="btn-selection-toggle" style="padding: 0.4rem 0.8rem; font-size:0.8rem; border-radius: 20px; background: var(--bg-body); border: 1px solid var(--primary); color: var(--primary); cursor:pointer;">+ Add</button>`;
    }

    // Edit/Delete Controls: STRICTLY only for custom habits
    let controlsHtml = '';
    if (isCustom) {
      controlsHtml = `
            <button type="button" class="btn-edit-habit" title="Edit" style="background:none; border:none; cursor:pointer; font-size:1rem; opacity:0.6;">✏️</button>
            <button type="button" class="btn-delete-habit" title="Delete" style="background:none; border:none; cursor:pointer; font-size:1rem; opacity:0.6; color:var(--danger);">🗑️</button>
        `;
    }

    card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <span class="habit-category-badge" style="${badgeStyle}">${displayBadge}</span>
                <div style="display:flex; gap:0.5rem;">${controlsHtml}</div>
            </div>
            <h3 style="margin:0.5rem 0; font-size:1.1rem;">${h.name}</h3>
            <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:1rem; flex:1;">${h.description || ''}</p>
            <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: auto;">
              ${actionBtnHtml}
            </div>
    `;

    // Toggle (Add / De-add)
    const toggleBtn = card.querySelector('.btn-selection-toggle');
    if (toggleBtn) {
      toggleBtn.onclick = async (e) => {
        e.stopPropagation();

        try {
          if (isSelected) {
            // REMOVE (De-add)
            const userHabitId = window.userHabitMap ? window.userHabitMap.get(h.id) : null;

            if (userHabitId) {
              try {
                await deleteUserHabit(userHabitId);
                selectedHabitIds.delete(h.id);
                window.userHabitMap.delete(h.id);
                showNotification("Removed from habits");
              } catch (err) {
                // Check for confirmation requirement
                let errData = {};
                try { errData = JSON.parse(err.message); } catch (e) { }

                if (errData.requires_confirmation) {
                  // Use existing modal helper
                  const confirmed = await showConfirmDialog("Stop Tracking?", `${errData.detail || "You have a streak!"} Remove anyway?`);
                  if (confirmed) {
                    await deleteUserHabit(userHabitId, true);
                    selectedHabitIds.delete(h.id);
                    window.userHabitMap.delete(h.id);
                    showNotification("Removed from habits");
                  } else {
                    return; // Abort
                  }
                } else {
                  throw err; // Unknown error
                }
              }
            } else {
              // Local only cleanup
              selectedHabitIds.delete(h.id);
            }
          } else {
            // ADD
            const res = await saveUserHabits([h.id]);
            if (res && res.length > 0) {
              const uh = res[0];
              selectedHabitIds.add(h.id);
              if (!window.userHabitMap) window.userHabitMap = new Map();
              window.userHabitMap.set(h.id, uh.id);
              showNotification("Added to habits");
            }
          }
          renderHabitsGrid(filter);
        } catch (err) {
          console.error(err);
          showNotification("Failed to update habit", "error");
        }
      };
    }

    // Edit Button
    const editBtn = card.querySelector('.btn-edit-habit');
    if (editBtn) {
      editBtn.onclick = (e) => {
        e.stopPropagation();
        openEditModal(h);
      };
    }

    // Delete Button
    const deleteBtn = card.querySelector('.btn-delete-habit');
    if (deleteBtn) {
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        handleDeleteHabit(h);
      };
    }

    grid.appendChild(card);
  });
}

function toggleSelection(id, isSelected, cardElement) {
  // Deprecated by new logic inside render loop
}
