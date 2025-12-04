import { fetchDailyChecklist, saveCheckin } from '../api/habitsApi.js';
import { showSuccess, showError } from '../components/notifications.js';

export async function renderDailyChecklist() {
  // Target the specific list container within the profile view
  const container = document.getElementById('daily-list');
  if (!container) return;

  container.innerHTML = '<p class="text-center text-muted">Loading...</p>';

  try {
    const checklist = await fetchDailyChecklist();
    renderList(checklist, container);
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="text-danger text-center">Failed to load checklist</p>';
  }
}

function renderList(items, container) {
  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = `
            <div class="text-center" style="padding: 2rem;">
                <p class="text-muted">No active habits for today.</p>
                <a href="#" class="btn-primary" id="btn-manage-habits" style="display: inline-block; margin-top: 1rem; width: auto;">Manage Habits</a>
            </div>
        `;
    // Add listener to the link to navigate to habits
    const btn = container.querySelector('#btn-manage-habits');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.nav-link[data-nav="habits"]').click();
      });
    }
    updateProgress(0, 0);
    return;
  }

  // Sort: Incomplete first, then completed
  items.sort((a, b) => a.is_completed === b.is_completed ? 0 : a.is_completed ? 1 : -1);

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = `daily-item ${item.is_completed ? 'completed' : ''}`;

    // Streak badge logic
    const streak = item.current_streak || 0;
    const streakHtml = streak > 0
      ? `<span class="streak-badge">🔥 ${streak} day${streak > 1 ? 's' : ''}</span>`
      : '';

    div.innerHTML = `
            <div class="daily-info">
                <button class="check-btn" data-id="${item.id}" data-completed="${item.is_completed}">
                    ✓
                </button>
                <div>
                    <div style="font-weight: 600; font-size: 1rem;">${item.habit_name || 'Habit'}</div>
                    ${streakHtml}
                </div>
            </div>
        `;
    container.appendChild(div);
  });

  // Add Event Listeners
  container.querySelectorAll('.check-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const userHabitId = e.target.dataset.id;
      const isCompleted = e.target.dataset.completed === 'true';
      const newState = !isCompleted;

      // Optimistic UI update
      const itemDiv = e.target.closest('.daily-item');
      itemDiv.classList.toggle('completed');
      e.target.dataset.completed = newState;

      try {
        await saveCheckin(userHabitId, newState);
        // Reload to get updated streaks/stats
        const updatedList = await fetchDailyChecklist();
        renderList(updatedList, container);

        if (newState) showSuccess('Great job!');
      } catch (err) {
        showError('Failed to update status');
        // Revert UI
        itemDiv.classList.toggle('completed');
      }
    });
  });

  // Update Progress
  const completedCount = items.filter(i => i.is_completed).length;
  updateProgress(completedCount, items.length);
}

function updateProgress(completed, total) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const bar = document.getElementById('daily-progress-bar'); // Fixed ID match with profileView
  if (bar) bar.style.width = `${percentage}%`;
}
