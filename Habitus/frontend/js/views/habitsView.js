import { fetchHabits, saveUserHabits, createCustomHabit, fetchDailyChecklist, updateHabit, deleteHabit } from '../api/habitsApi.js';
import { showNotification } from '../ui.js';

let allHabits = [];
let selectedHabitIds = new Set();

// Confirmation modal promise resolver
let confirmResolve = null;

export async function renderHabits() {
  // 1. Fetch Data
  try {
    const [habits, userHabits] = await Promise.all([
      fetchHabits(),
      fetchDailyChecklist()
    ]);

    allHabits = habits;
    selectedHabitIds = new Set(userHabits.map(uh => uh.habit_id));

    renderHabitsGrid('all');
  } catch (err) {
    console.error('Error loading habits:', err);
    showNotification('Failed to load habits', 'error');
  }

  // 2. Setup Listeners
  setupHabitsListeners();
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

  // Save Selection
  const saveBtn = document.getElementById('save-habits-btn');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      try {
        await saveUserHabits(Array.from(selectedHabitIds));
        showNotification("Habit selection saved!");
      } catch (err) {
        showNotification("Failed to save selection", "error");
      }
    };
  }

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
        selectedHabitIds.add(created.id);

        showNotification(`Created ${name}!`);
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

function renderHabitsGrid(filter = 'all') {
  const grid = document.getElementById('habits-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const visible = allHabits.filter(h => filter === 'all' || h.category.toLowerCase() === filter.toLowerCase());

  if (visible.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted); grid-column: 1/-1; text-align:center;">No habits found.</p>';
    return;
  }

  visible.forEach(h => {
    const isSelected = selectedHabitIds.has(h.id);
    const isCustom = h.is_custom || h.user_id !== null;
    const card = document.createElement('div');
    card.className = `habit-card ${isSelected ? 'selected' : ''}`;

    card.innerHTML = `
            <span class="habit-category-badge">${h.category}</span>
            <h3 style="margin-bottom:0.5rem; font-size:1.1rem;">${h.name}</h3>
            <p style="font-size:0.9rem; color:var(--text-muted); flex:1;">${h.description || ''}</p>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
              <input type="checkbox" class="habit-checkbox" style="position:relative; top:0; right:0;" ${isSelected ? 'checked' : ''}>
              ${isCustom ? `
                <button type="button" class="btn-edit-habit" title="Edit" style="background:none; border:1px solid var(--border); border-radius:4px; padding:0.25rem 0.5rem; cursor:pointer; color:var(--text-muted); font-size:0.8rem;">✏️</button>
                <button type="button" class="btn-delete-habit" title="Delete" style="background:none; border:1px solid var(--border); border-radius:4px; padding:0.25rem 0.5rem; cursor:pointer; color:var(--danger); font-size:0.8rem;">🗑️</button>
              ` : ''}
            </div>
        `;

    // Card Click -> Toggle Selection (only on card area, not buttons)
    card.onclick = (e) => {
      if (e.target.type !== 'checkbox' && !e.target.classList.contains('btn-edit-habit') && !e.target.classList.contains('btn-delete-habit')) {
        const checkbox = card.querySelector('input');
        checkbox.checked = !checkbox.checked;
        toggleSelection(h.id, checkbox.checked, card);
      }
    };

    // Checkbox Click
    card.querySelector('input').onclick = (e) => {
      e.stopPropagation();
      toggleSelection(h.id, e.target.checked, card);
    };

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
  if (isSelected) {
    selectedHabitIds.add(id);
    cardElement.classList.add('selected');
  } else {
    selectedHabitIds.delete(id);
    cardElement.classList.remove('selected');
  }
}
