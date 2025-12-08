import { fetchDailyChecklist, saveCheckin, fetchStreakWindow, deleteUserHabit } from '../api/habitsApi.js';
import { showSuccess, showError } from '../components/notifications.js';
import { getSeasonalTheme } from '../config/seasonalThemes.js';
import { showConfirmDialog } from './habitsView.js';

// Module-level variables for robust timer control
let streakTimerInterval = null;
let hasRefreshedAfterExpiry = false;

export async function renderDailyChecklist() {
  console.log('[renderDailyChecklist] START');

  // 1. Clear any existing timer immediately
  if (streakTimerInterval) {
    clearInterval(streakTimerInterval);
    streakTimerInterval = null;
  }

  // Find the container
  const wrapper = document.getElementById('daily-list');
  if (!wrapper) {
    return;
  }

  // Replace content
  wrapper.innerHTML = `
    <div class="daily-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h3 style="margin: 0;">Today's Progress</h3>
        <div id="daily-timer" class="daily-timer">Loading...</div>
    </div>
    <div style="background: var(--bg-input); border-radius: 10px; height: 8px; overflow: hidden; margin-bottom: 1.5rem;">
        <div id="daily-progress-bar" style="width: 0%; height: 100%; background: var(--success); transition: width 0.5s;"></div>
    </div>
    <div id="daily-list-ul" class="daily-list" style="display: flex; flex-direction: column; gap: 1rem;">
        <p class="text-center text-muted">Loading habits...</p>
    </div>
  `;

  const container = document.getElementById('daily-list-ul');
  if (!container) return;

  try {
    const checklist = await fetchDailyChecklist();
    console.log('[renderDailyChecklist] Received', checklist.length, 'habits');

    // Fetch window info
    let windowEndAt = null;
    try {
      const winData = await fetchStreakWindow();
      windowEndAt = new Date(winData.window_end_at);
    } catch (e) {
      console.warn("Streak window fetch failed", e);
    }

    // Fallback if needed
    if (!windowEndAt && checklist.length > 0 && checklist[0].window_end_at) {
      windowEndAt = new Date(checklist[0].window_end_at);
    }

    // Timer Logic
    const now = new Date();
    const timeUntilEnd = windowEndAt ? (windowEndAt - now) : 0;

    if (windowEndAt && timeUntilEnd > 1000) {
      // Valid future window (at least 1s away)
      console.log('[renderDailyChecklist] Starting timer - ends in', Math.floor(timeUntilEnd / 1000), 's');
      hasRefreshedAfterExpiry = false; // Reset flag so next expiry triggers refresh
      startTimer(windowEndAt);
    } else if (windowEndAt) {
      // Expired or very close
      console.warn('[renderDailyChecklist] Window expired. Backend rotation might be pending.');

      const t = document.getElementById('daily-timer');
      if (t) {
        t.textContent = "Updating cycle...";
        t.classList.add('expired');
      }

      // Retry fetching after a short delay to allow backend to rotate
      // Prevent infinite rapid loops with a reasonable delay (e.g. 3s)
      console.log('[renderDailyChecklist] Retrying in 3s...');
      if (streakTimerInterval) clearInterval(streakTimerInterval);
      streakTimerInterval = setTimeout(() => {
        renderDailyChecklist();
      }, 3000);

    } else {
      const t = document.getElementById('daily-timer');
      if (t) t.textContent = "No active window";
    }

    renderList(checklist, container);
    console.log('[renderDailyChecklist] COMPLETE');

  } catch (err) {
    console.error('[renderDailyChecklist] ERROR:', err);
    container.innerHTML = '<p class="text-danger text-center">Failed to load checklist</p>';
  }
}

function startTimer(endTime) {
  const timerEl = document.getElementById('daily-timer');
  if (!timerEl) return;

  if (streakTimerInterval) {
    clearInterval(streakTimerInterval);
    streakTimerInterval = null;
  }

  // Timer update function
  const update = () => {
    const now = new Date();
    const diff = endTime - now;

    if (diff <= 0) {
      console.log('[Timer] EXPIRED');
      if (timerEl) {
        timerEl.textContent = "00:00:00";
        timerEl.classList.add('expired');
      }

      if (streakTimerInterval) {
        clearInterval(streakTimerInterval);
        streakTimerInterval = null;
      }

      // Trigger refresh ONE time per expiry event
      if (!hasRefreshedAfterExpiry) {
        hasRefreshedAfterExpiry = true;
        console.log("[Timer] Scheduling refresh...");
        setTimeout(() => {
          renderDailyChecklist();
        }, 1500); // 1.5s delay to let backend finish any maintenance
      }
      return;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    timerEl.textContent = `Time left: ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    if (h === 0 && m < 5) {
      timerEl.style.color = 'var(--error)';
      timerEl.style.borderColor = 'var(--error)';
    } else {
      timerEl.style.color = 'var(--primary)';
      timerEl.style.borderColor = 'var(--primary)';
    }
  };

  update();
  streakTimerInterval = setInterval(update, 1000);
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

  items.sort((a, b) => a.is_completed === b.is_completed ? 0 : a.is_completed ? 1 : -1);

  let completedCount = 0;
  items.forEach(item => {
    if (item.is_completed) completedCount++;

    const li = document.createElement('div');
    li.className = `daily-item ${item.is_completed ? 'completed' : ''}`;

    // Seasonal Theme
    const themeObj = getSeasonalTheme(item.habit_name);
    if (themeObj) li.classList.add(themeObj.className);

    li.dataset.id = item.id;

    // Apply Streak Visuals (Levels & Broken)
    applyStreakClasses(li, item.current_streak, item.streak_broken);

    // Streak Text Logic
    let streakHtml = '';
    const streak = item.current_streak || 0;
    const best = item.longest_streak || 0;

    if (item.streak_broken && item.previous_streak) {
      streakHtml = `<small class="streak-msg" style="font-size:0.75rem; color:var(--danger);">💔 You lost your ${item.previous_streak}-day streak!</small>`;
    } else if (streak > 0) {
      // Show Best Streak alongside current if Best > streak
      let bestInfo = "";
      if (best > streak) {
        bestInfo = ` · <span title="Best Streak">🏅 Best: ${best}</span>`;
      }
      streakHtml = `<small class="streak-msg" style="font-size:0.75rem; color:var(--text-muted);">🔥 ${streak} day streak${bestInfo}</small>`;
    } else if (best > 0) {
      // Show Best even if current is 0
      streakHtml = `<small class="streak-msg" style="font-size:0.75rem; color:var(--text-muted);">🏅 Best streak: ${best}</small>`;
    } else {
      streakHtml = `<small class="streak-msg" style="font-size:0.75rem; color:var(--text-muted);">Start a streak!</small>`;
    }

    li.innerHTML = `
      <div style="display:flex; flex-direction:column; justify-content:center;">
        <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
          <span class="daily-name" style="font-weight:600;">${item.habit_name}</span>
          ${item.is_completed ? '<span class="status-pill" style="font-size:0.7rem; background:var(--success); color:white; padding:2px 8px; border-radius:12px; font-weight:bold;">Done</span>' : ''}
        </div>
        <div style="margin-top:0.25rem;">
          ${streakHtml}
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <button class="btn-check ${item.is_completed ? 'missed' : 'done'}" data-id="${item.id}" data-completed="${item.is_completed}">
          ${item.is_completed ? 'Undo' : '✔ Check'}
        </button>
        <button class="btn-delete" title="Remove from today" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1rem; padding:0.5rem;">🗑️</button>
      </div>
    `;

    container.appendChild(li);

    const btnCheck = li.querySelector('.btn-check');
    const btnDelete = li.querySelector('.btn-delete');

    // Check/Undo Handler
    btnCheck.onclick = async () => {
      const newState = !item.is_completed;

      // Optimistic UI Update (Toggle styles only)
      item.is_completed = newState;
      updateItemUI(li, newState);

      const currentCompleted = items.filter(i => i.is_completed).length;
      updateProgress(currentCompleted, items.length);

      try {
        const result = await saveCheckin(item.id, newState);
        console.log('[Checkin Response]', result);

        if (result.debug) {
          console.log('%c[Streak Debug]', 'color: #f59e0b; font-weight: bold;', result.debug);
          console.table(result.debug);
        }

        // Update Data from Backend
        item.current_streak = result.current_streak;
        item.longest_streak = result.longest_streak;
        item.total_completions = result.total_completions;
        item.streak_broken = result.streak_broken;
        item.previous_streak = result.previous_streak;

        // Show Achievement Toasts
        if (result.new_achievements && result.new_achievements.length > 0) {
          result.new_achievements.forEach(ach => {
            showNotification(`🎉 Achievement Unlocked: ${ach.name}`, 'success');
          });
          // Notify other views (e.g. Profile > Achievements tab)
          window.dispatchEvent(new CustomEvent('achievementUnlocked'));
        }

        // Apply updated visuals (IMPORTANT: Using real backend values)
        applyStreakClasses(li, item.current_streak, item.streak_broken);

        // Update Text
        const streakSpan = li.querySelector('.streak-msg');
        if (streakSpan) {
          streakSpan.style.color = 'var(--text-muted)';

          if (result.status === 'streak_started') {
            streakSpan.innerHTML = `🎉 ${result.user_message || "Streak started!"}`;
            streakSpan.style.color = 'var(--primary)';
          } else if (result.status === 'streak_continues') {
            streakSpan.innerHTML = `🔥 ${result.user_message || (result.current_streak + " day streak!")}`;
            streakSpan.style.color = 'var(--text-muted)';
          } else if (result.status === 'streak_reset') {
            // Only show "Streak reset" if it was actually a loss of a LONG streak, not just 1->0
            if (result.previous_streak > 1) {
              streakSpan.innerHTML = `💔 ${result.user_message || "Streak reset"}`;
              streakSpan.style.color = 'var(--danger)';
            } else {
              streakSpan.innerHTML = '';
            }
          } else if (result.streak_broken && item.current_streak === 0) {
            streakSpan.innerHTML = `💔 You lost your ${result.previous_streak || 0}-day streak!`;
            streakSpan.style.color = 'var(--danger)';
          } else if (item.current_streak > 0) {
            let bestInfo = "";
            if (item.longest_streak > item.current_streak) {
              bestInfo = ` · 🏅 ${item.longest_streak}`;
            }
            streakSpan.innerHTML = `🔥 ${item.current_streak} day streak${bestInfo}`;
            streakSpan.style.color = 'var(--text-muted)';
          } else {
            streakSpan.innerHTML = '';
          }
        }

      } catch (err) {
        console.error("Checkin failed", err);
        showError("Failed to save progress");
        await renderDailyChecklist();
      }
    };

    // Delete Handler
    // Delete Handler
    btnDelete.onclick = async () => {
      const confirmed = await showConfirmDialog(
        `Delete ${item.habit_name} from today?`,
        "This will remove it from today's list and may affect your streak."
      );
      if (confirmed) {
        try {
          await deleteUserHabit(item.id, true);
          showSuccess("Habit removed");
          renderDailyChecklist();
        } catch (e) {
          showError(e.message || "Failed to delete");
        }
      }
    };
  });

  updateProgress(completedCount, items.length);
}

// HELPER: Apply Streak Level Classes
function applyStreakClasses(li, streak, isBroken) {
  // Remove all previous levels
  li.classList.remove(
    'streak-level-0',
    'streak-level-1',
    'streak-level-2',
    'streak-level-3',
    'streak-level-4',
    'streak-broken'
  );

  // Broken Streak
  if (isBroken && streak === 0) {
    li.classList.add('streak-broken', 'streak-level-0');
    return;
  }

  // Active Streak Levels
  if (streak === 0) li.classList.add('streak-level-0');
  else if (streak <= 3) li.classList.add('streak-level-1');   // 1-3
  else if (streak <= 7) li.classList.add('streak-level-2');   // 4-7
  else if (streak <= 14) li.classList.add('streak-level-3');  // 8-14
  else li.classList.add('streak-level-4');                    // 15+
}

function updateItemUI(li, isCompleted) {
  const btn = li.querySelector('.btn-check');
  const pill = li.querySelector('.status-pill');

  if (isCompleted) {
    li.classList.add('completed');
    btn.textContent = "Undo";
    btn.classList.add('missed');
    btn.classList.remove('done');

    if (!pill) {
      const nameSpan = li.querySelector('.daily-name');
      const newPill = document.createElement('span');
      newPill.className = 'status-pill';
      newPill.style.cssText = 'font-size:0.7rem; background:var(--success); color:white; padding:2px 8px; border-radius:12px; font-weight:bold; margin-left:0.5rem;';
      newPill.textContent = 'Done';
      nameSpan.parentNode.appendChild(newPill);
    }
  } else {
    li.classList.remove('completed');
    btn.textContent = "✔ Check";
    btn.classList.add('done');
    btn.classList.remove('missed');
    if (pill) pill.remove();
  }
}

function updateProgress(completed, total) {
  const bar = document.getElementById('daily-progress-bar');
  if (!bar) return;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  bar.style.width = `${pct}%`;
}
