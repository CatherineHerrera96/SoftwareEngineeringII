import { getProfile, updateProfile, fetchDailyChecklist, saveCheckin, deleteUserHabit, getAchievements } from '../api/habitsApi.js';
import { showNotification } from '../ui.js';
import { getSeasonalTheme, applyGlobalTheme, SEASONAL_THEMES, CURRENT_SEASON } from '../config/seasonalThemes.js';

export async function renderProfile() {
    // 0. Apply Global Theme
    applyGlobalTheme();

    // 1. Load Profile Data
    try {
        const profile = await getProfile();
        updateProfileUI(profile);
    } catch (err) {
        console.error(err);
        showNotification('Failed to load profile', 'error');
    }

    // 2. Setup Event Listeners (Edit Profile, Tabs)
    setupProfileListeners();

    // 3. Render Sub-views
    renderDailyList();
    renderAchievementsList();
}

function updateProfileUI(profile) {
    const nameDisplay = document.getElementById('profile-name-display');
    const emailDisplay = document.getElementById('profile-email-display');
    const avatarDisplay = document.getElementById('profile-avatar-display');

    if (nameDisplay) nameDisplay.textContent = profile.name || 'User';
    if (emailDisplay) emailDisplay.textContent = profile.email;

    if (avatarDisplay) {
        if (profile.avatar_url) {
            avatarDisplay.innerHTML = `<img src="${profile.avatar_url}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            avatarDisplay.innerHTML = (profile.name || 'U')[0].toUpperCase();
        }
    }

    // Update Edit Form inputs
    const editName = document.getElementById('edit-name');
    const editAvatar = document.getElementById('edit-avatar');
    if (editName) editName.value = profile.name || '';
    if (editAvatar) editAvatar.value = profile.avatar_url || '';
}

function setupProfileListeners() {
    // Edit Profile Toggle
    const section = document.getElementById('edit-profile-section');
    const toggle = document.getElementById('toggle-edit-profile');
    const cancel = document.getElementById('cancel-edit-profile');
    const form = document.getElementById('profile-edit-form');

    if (toggle && section) toggle.onclick = () => section.style.display = 'block';
    if (cancel && section) cancel.onclick = () => section.style.display = 'none';

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const newName = document.getElementById('edit-name').value;
            const newAvatar = document.getElementById('edit-avatar').value;

            try {
                const updated = await updateProfile({ name: newName, avatar_url: newAvatar });
                updateProfileUI(updated);
                showNotification("Profile updated!");
                if (section) section.style.display = 'none';
            } catch (err) {
                showNotification("Failed to update profile", "error");
            }
        };
    }

    // Tabs
    const tabDaily = document.getElementById('tab-btn-daily');
    const tabStats = document.getElementById('tab-btn-stats');

    if (tabDaily) {
        tabDaily.onclick = () => switchTab('daily');
    }
    if (tabStats) {
        tabStats.onclick = () => switchTab('stats');
    }
}

function switchTab(tabName) {
    const dailyContent = document.getElementById('tab-daily');
    const statsContent = document.getElementById('tab-stats');
    const tabDaily = document.getElementById('tab-btn-daily');
    const tabStats = document.getElementById('tab-btn-stats');

    if (dailyContent) dailyContent.style.display = tabName === 'daily' ? 'block' : 'none';
    if (statsContent) statsContent.style.display = tabName === 'stats' ? 'block' : 'none';

    if (tabDaily) tabDaily.classList.toggle('active', tabName === 'daily');
    if (tabStats) tabStats.classList.toggle('active', tabName === 'stats');
}

async function renderDailyList() {
    const list = document.getElementById('daily-list');
    if (!list) return;

    list.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Loading...</p>';

    try {
        const habits = await fetchDailyChecklist();

        // --- SEASONAL CLEANUP ENFORCEMENT ---
        // Iterate over fetched habits. If any belongs to an inactive season, delete it immediately.
        const activeHabits = [];
        let cleanupCount = 0;

        for (const h of habits) {
            // Check if habit is seasonal
            const seasonId = SEASONAL_THEMES.find(t => {
                const n = h.habit_name.toLowerCase();
                const c = h.habit_category ? h.habit_category.toLowerCase() : '';
                return t.keywords.some(k => n.includes(k)) || t.id === c;
            })?.id;

            if (seasonId) {
                // It is seasonal. Strict check.
                if (!CURRENT_SEASON || CURRENT_SEASON !== seasonId) {
                    // Invalid season -> Delete
                    console.log(`Cleaning up invalid seasonal habit: ${h.habit_name} (${seasonId})`);
                    try {
                        await deleteUserHabit(h.id);
                        cleanupCount++;
                    } catch (e) { console.error("Cleanup failed for", h.id, e); }
                    continue; // Skip adding to list
                }
            }
            activeHabits.push(h);
        }

        if (cleanupCount > 0) {
            showNotification(`Cleaned up ${cleanupCount} expired seasonal habits.`);
        }

        const listItems = activeHabits;
        list.innerHTML = '';

        if (listItems.length === 0) {
            list.innerHTML = `
                <div style="text-align:center; color:var(--text-muted);">
                    <p>No habits selected.</p>
                    <button id="btn-go-habits" class="btn-secondary" style="margin-top:1rem;">Browse Habits</button>
                </div>
            `;
            const btnGo = document.getElementById('btn-go-habits');
            if (btnGo) {
                btnGo.onclick = () => {
                    const navBtn = document.querySelector('.nav-link[data-nav="habits"]');
                    if (navBtn) navBtn.click();
                };
            }
            updateProgressBar(0);
            return;
        }

        let completedCount = 0;



        listItems.forEach(h => {
            if (h.is_completed) completedCount++;

            const li = document.createElement('li');

            // Use shared seasonal helper - RETURNS OBJECT
            const themeObj = getSeasonalTheme(h.habit_name);
            const themeClass = themeObj ? themeObj.className : '';

            li.className = `daily-item ${h.is_completed ? 'completed' : ''} ${themeClass}`;

            li.innerHTML = `
                <span class="daily-name">${h.habit_name}</span>
                <div style="display:flex; align-items:center;">
                    <button class="btn-check ${h.is_completed ? 'missed' : 'done'}">
                    ${h.is_completed ? 'Undo' : '✔ Done'}
                    </button>
                    <button class="btn-delete" title="Remove">🗑</button>
                </div>
            `;

            // Check/Uncheck
            const checkBtn = li.querySelector('.btn-check');
            checkBtn.onclick = async () => {
                const newStatus = !h.is_completed;

                // Optimistic Update
                h.is_completed = newStatus;
                checkBtn.className = `btn-check ${newStatus ? 'missed' : 'done'}`; // 'missed' style used for Undo? or 'done'?
                // Actually looking at style classes: 'done' usually green, 'missed' red? 
                // Existing code: ${h.is_completed ? 'missed' : 'done'} -> Undo has 'missed' class? 
                // Let's stick to existing logic: if completed, show UNDO (style 'missed' maybe meant 'destructive/red'?)
                // wait, if is_completed is true, text is "Undo", class is "missed". 

                checkBtn.textContent = newStatus ? 'Undo' : '✔ Done';
                li.className = `daily-item ${newStatus ? 'completed' : ''} ${themeClass}`;

                try {
                    await saveCheckin(h.id, newStatus);
                    // No need to full re-render, we updated UI
                    updateProgressBar(recalcCompletion(listItems));
                } catch (err) {
                    console.error("Checkin failed", err);
                    showNotification("Failed to save status", "error");
                    // Revert
                    h.is_completed = !newStatus;
                    renderDailyList(); // Full re-render on error to be safe
                }
            };

            // Delete with Custom Modal
            li.querySelector('.btn-delete').onclick = () => {
                const modal = document.getElementById('confirm-modal');
                const title = document.getElementById('confirm-title');
                const msg = document.getElementById('confirm-message');
                const btnOk = document.getElementById('confirm-ok');
                const btnCancel = document.getElementById('confirm-cancel');

                if (modal && title && msg && btnOk && btnCancel) {
                    title.textContent = "Stop Tracking?";
                    msg.textContent = `Are you sure you want to stop tracking "${h.habit_name}"?`;

                    modal.style.display = 'flex';

                    // Handler for Confirm
                    const onConfirm = async () => {
                        try {
                            cleanup();
                            await deleteUserHabit(h.id);
                            showNotification("Habit removed.");
                            renderDailyList();
                        } catch (err) {
                            showNotification("Failed to delete habit", "error");
                        }
                    };

                    // Handler for Cancel
                    const onCancel = () => {
                        cleanup();
                    };

                    // Cleanup event listeners to avoid duplicates
                    const cleanup = () => {
                        modal.style.display = 'none';
                        btnOk.removeEventListener('click', onConfirm);
                        btnCancel.removeEventListener('click', onCancel);
                    };

                    btnOk.addEventListener('click', onConfirm);
                    btnCancel.addEventListener('click', onCancel);
                }
            };

            list.appendChild(li);
        });

        updateProgressBar(completedCount / listItems.length);

    } catch (err) {
        console.error('Error loading daily list:', err);
        list.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Failed to load habits.</p>';
    }
}

function updateProgressBar(fraction) {
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    if (fill) fill.style.width = (fraction * 100) + '%';
    if (text) text.textContent = Math.round(fraction * 100) + '% Completed';
}

async function renderAchievementsList() {
    const list = document.getElementById('achievements-list');
    if (!list) return;

    try {
        const achievements = await getAchievements();
        list.innerHTML = '';
        if (achievements.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted);">No achievements yet. Keep going!</p>';
            return;
        }
        achievements.forEach(a => {
            const div = document.createElement('div');
            div.className = 'achievement-card';
            div.innerHTML = `<h4>${a.name}</h4><p>${a.description}</p>`;
            list.appendChild(div);
        });
    } catch (err) {
        // Silent fail or minimal text
        list.innerHTML = '<p style="color:var(--text-muted);">Synced.</p>';
    }
}


function recalcCompletion(items) {
    const total = items.length;
    if (total === 0) return 0;
    const completed = items.filter(i => i.is_completed).length;
    return completed / total;
}
