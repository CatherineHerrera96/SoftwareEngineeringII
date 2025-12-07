import { fetchDailyChecklist, saveCheckin, fetchStreakWindow } from '../api/habitsApi.js';
import { showSuccess, showError } from '../components/notifications.js';
import { getSeasonalTheme } from '../config/seasonalThemes.js';

let timerInterval = null;

export async function renderDailyChecklist() {
  const listContainer = document.getElementById('daily-list');
  if (!listContainer) return;

  // Ensure the parent container is visible if it was hidden by router
  const parentTab = document.getElementById('tab-daily');
  if (parentTab) {
    parentTab.style.display = 'block';
  }

  // Clear any existing content and timers
  if (timerInterval) clearInterval(timerInterval);

  // 1. Setup Basic UI Structure with Header and Timer
  const wrapper = listContainer.parentElement;
  if (wrapper && !wrapper.querySelector('.daily-header')) {
    wrapper.innerHTML = `
            <div class="daily-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0;">Today's Progress</h3>
                <div id="daily-timer" class="daily-timer">
                    Loading...
                </div>
            </div>
            <div style="background: var(--bg-input); border-radius: 10px; height: 8px; overflow: hidden; margin-bottom: 1.5rem;">
                <div id="daily-progress-bar" style="width: 0%; height: 100%; background: var(--success); transition: width 0.5s;"></div>
            </div>
            <ul id="daily-list-ul" class="daily-list"></ul>
        `;
  } else if (wrapper) {
    // Re-use existing structure but reset list
    const ul = document.getElementById('daily-list-ul');
    if (ul) ul.innerHTML = '';
  }

  const ul = document.getElementById('daily-list-ul') || document.getElementById('daily-list');
  if (!ul) return;

  ul.innerHTML = '<p class="text-center text-muted">Loading habits...</p>';

  try {
    // 2. Fetch Data
    const checklist = await fetchDailyChecklist();

    // Fetch window info
    let windowEndAt = null;
    try {
      const winData = await fetchStreakWindow();
      windowEndAt = new Date(winData.window_end_at);
      console.log("Streak Window End:", windowEndAt);
    } catch (e) {
      console.warn("Using fallback window logic", e);
    }

    // Fallback
    if (!windowEndAt && checklist.length > 0 && checklist[0].window_end_at) {
      windowEndAt = new Date(checklist[0].window_end_at);
    }

    // 3. Render Timer
    if (windowEndAt) {
      startTimer(windowEndAt);
    } else {
      const t = document.getElementById('daily-timer');
      if (t) t.textContent = "No active window";
    }

    // 4. Render List
    renderList(checklist, ul);

  } catch (err) {
    console.error(err);
    ul.innerHTML = '<p class="text-danger text-center">Failed to load checklist</p>';
  }
}

function startTimer(endTime) {
  const timerEl = document.getElementById('daily-timer');
  if (!timerEl) return;

  const update = () => {
    const now = new Date();
    const diff = endTime - now;

    if (diff <= 0) {
      timerEl.textContent = "00:00:00";
      timerEl.classList.add('expired');
      if (timerInterval) clearInterval(timerInterval);

      console.log("Timer expired, refreshing data...");
      renderDailyChecklist();
      return;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    const text = `Time left: ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    timerEl.textContent = text;

    // Styling urgency
    if (h === 0 && m < 5) {
      timerEl.style.color = 'var(--error)';
      timerEl.style.borderColor = 'var(--error)';
    } else {
      timerEl.style.color = 'var(--primary)';
      timerEl.style.borderColor = 'var(--primary)';
    }
  };

  update();
  timerInterval = setInterval(update, 1000);
}

function renderList(items, container) {
  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = `
            <div class="text-center" style="padding: 2rem;">
                <p class="text-muted">No active habits for today.</p>
                <button class="btn-primary" onclick="document.querySelector('.nav-link[data-nav=\\'habits\\']').click()">Manage Habits</button>
            </div>
        `;
    updateProgress(0, 0);
    return;
  }

  // Sort
  items.sort((a, b) => a.is_completed === b.is_completed ? 0 : a.is_completed ? 1 : -1);

  let completedCount = 0;
  items.forEach(item => {
    if (item.is_completed) completedCount++;

    const li = document.createElement('li');
    const themeObj = getSeasonalTheme(item.habit_name);
    const themeClass = themeObj ? themeObj.className : '';

    li.className = `daily-item ${item.is_completed ? 'completed' : ''} ${themeClass}`;

    const streak = item.current_streak || 0;
    const streakHtml = streak > 0
      ? `<small style="font-size:0.75rem; color:var(--text-muted);">🔥 ${streak} day streak</small>`
      : '';

    li.innerHTML = `
        <div style="display:flex; flex-direction:column; justify-content:center;">
            <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                <span class="daily-name" style="font-weight:600;">${item.habit_name}</span>
                ${item.is_completed ? '<span style="font-size:0.7rem; background:var(--success); color:white; padding:2px 8px; border-radius:12px; font-weight:bold;">Done</span>' : ''}
            </div>
            <div style="margin-top:0.25rem;">
                ${streakHtml}
            </div>
        </div>
        <div style="display:flex; align-items:center;">
             <button class="btn-check ${item.is_completed ? 'missed' : 'done'}" data-id="${item.id}" data-completed="${item.is_completed}">
                ${item.is_completed ? 'Undo' : '✔ Check'}
             </button>
        </div>
    `;

    container.appendChild(li);

    const btn = li.querySelector('.btn-check');
    btn.onclick = async () => {
      const newState = !item.is_completed;
      item.is_completed = newState; // Optimistic
      try {
        await saveCheckin(item.id, newState);
        renderDailyChecklist();
      } catch (err) {
        console.error(err);
        showError("Failed to update status");
        renderDailyChecklist();
      }
    };
  });

  updateProgress(completedCount, items.length);
}

function updateProgress(completed, total) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const bar = document.getElementById('daily-progress-bar');
  if (bar) bar.style.width = `${percentage}%`;
}
