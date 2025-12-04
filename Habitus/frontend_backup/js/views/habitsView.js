import { fetchHabits, saveUserHabits, createCustomHabit } from '../api/habitsApi.js';
import { showSuccess, showError } from '../components/notifications.js';

export async function renderHabits() {
  const app = document.querySelector('[data-view="habits"]');
  if (!app) return;

  app.innerHTML = `
        <div class="view-page">
            <div class="habit-header">
                <h2 class="view-title">Habit Catalog</h2>
                <button id="btn-create-habit" class="btn-secondary">+ Create Custom Habit</button>
            </div>
            
            <!-- Create Habit Form (Hidden by default) -->
            <div id="create-habit-form" class="view-card hidden" style="margin: 1rem 0; max-width: 100%;">
                <h3>Create New Habit</h3>
                <form id="form-custom-habit" class="mt-4">
                    <div class="form-group">
                        <label class="form-label">Habit Name</label>
                        <input type="text" id="habit-name" class="form-input" required placeholder="e.g., Read 30 mins">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <input type="text" id="habit-desc" class="form-input" placeholder="Optional description">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select id="habit-category" class="form-input">
                            <option value="Wellness">Wellness</option>
                            <option value="Health">Health</option>
                            <option value="Academic">Academic</option>
                            <option value="Work">Work</option>
                            <option value="Personal">Personal</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Frequency</label>
                        <select id="habit-freq" class="form-input">
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" class="btn-primary" style="width: auto;">Save Habit</button>
                        <button type="button" id="btn-cancel-create" class="btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>

            <div class="tabs">
                <button class="tab-btn active" data-cat="all">All</button>
                <button class="tab-btn" data-cat="Wellness">Wellness</button>
                <button class="tab-btn" data-cat="Health">Health</button>
                <button class="tab-btn" data-cat="Academic">Academic</button>
                <button class="tab-btn" data-cat="Work">Work</button>
                <button class="tab-btn" data-cat="Personal">Personal</button>
            </div>

            <div id="habits-container" class="habits-grid">
                <!-- Habits loaded here -->
            </div>

            <div class="mt-4 text-center">
                <button id="btn-save-habits" class="btn-primary" style="max-width: 300px;">
                    Update My Habits
                </button>
            </div>
        </div>
    `;

  // Load habits
  let allHabits = [];
  try {
    allHabits = await fetchHabits();
    renderHabitsGrid(allHabits, 'all');
  } catch (err) {
    showError('Failed to load habits');
  }

  // Event Listeners

  // 1. Filter Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderHabitsGrid(allHabits, e.target.dataset.cat);
    });
  });

  // 2. Toggle Selection
  document.getElementById('habits-container').addEventListener('change', (e) => {
    if (e.target.classList.contains('habit-checkbox')) {
      const card = e.target.closest('.habit-card');
      if (e.target.checked) {
        card.style.borderColor = 'var(--primary)';
        card.style.backgroundColor = '#eef2ff';
      } else {
        card.style.borderColor = 'var(--border)';
        card.style.backgroundColor = 'white';
      }
    }
  });

  // 3. Save Selection
  document.getElementById('btn-save-habits').addEventListener('click', async () => {
    const selectedIds = Array.from(document.querySelectorAll('.habit-checkbox:checked'))
      .map(cb => cb.value);

    try {
      await saveUserHabits(selectedIds);
      showSuccess('Habits updated successfully!');
    } catch (err) {
      showError('Failed to save habits');
    }
  });

  // 4. Create Custom Habit Logic
  const formContainer = document.getElementById('create-habit-form');

  document.getElementById('btn-create-habit').addEventListener('click', () => {
    formContainer.classList.remove('hidden');
  });

  document.getElementById('btn-cancel-create').addEventListener('click', () => {
    formContainer.classList.add('hidden');
  });

  document.getElementById('form-custom-habit').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newHabit = {
      name: document.getElementById('habit-name').value,
      description: document.getElementById('habit-desc').value,
      category: document.getElementById('habit-category').value,
      frequency: document.getElementById('habit-freq').value,
      is_custom: true
    };

    try {
      await createCustomHabit(newHabit);
      showSuccess('Custom habit created!');
      formContainer.classList.add('hidden');
      // Reload habits
      allHabits = await fetchHabits();
      renderHabitsGrid(allHabits, 'all');
    } catch (err) {
      showError('Failed to create habit');
    }
  });
}

function renderHabitsGrid(habits, category) {
  const container = document.getElementById('habits-container');
  container.innerHTML = '';

  const filtered = category === 'all'
    ? habits
    : habits.filter(h => h.category === category);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-muted">No habits found in this category.</p>';
    return;
  }

  filtered.forEach(h => {
    const isCustom = h.is_custom ? '<span class="habit-badge">Custom</span>' : '';
    const card = document.createElement('div');
    card.className = 'habit-card';
    card.innerHTML = `
            <div>
                <div class="habit-header">
                    <span class="habit-title">${h.name}</span>
                    ${isCustom}
                </div>
                <p class="habit-desc">${h.description || 'No description'}</p>
                <div style="font-size: 0.8rem; color: var(--text-muted);">
                    ${h.frequency} • ${h.category}
                </div>
            </div>
            <div class="mt-4" style="text-align: right;">
                <label style="cursor: pointer; display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                    <input type="checkbox" class="habit-checkbox" value="${h.id}">
                    <span style="font-size: 0.9rem; font-weight: 500;">Track this</span>
                </label>
            </div>
        `;
    container.appendChild(card);
  });
}
