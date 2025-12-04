import { getProfile, updateProfile, fetchDailyChecklist, saveCheckin, deleteUserHabit, getAchievements } from '../api/habitsApi.js';
import { showNotification } from '../ui.js';

export async function renderProfile() {
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
        list.innerHTML = '';

        if (habits.length === 0) {
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

        habits.forEach(h => {
            if (h.is_completed) completedCount++;

            const li = document.createElement('li');
            li.className = `daily-item ${h.is_completed ? 'completed' : ''}`;

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
            li.querySelector('.btn-check').onclick = async () => {
                try {
                    await saveCheckin(h.id, !h.is_completed);
                    renderDailyList(); // Re-render to update UI
                } catch (err) {
                    showNotification("Failed to update status", "error");
                }
            };

            // Delete
            li.querySelector('.btn-delete').onclick = async () => {
                if (confirm(`Stop tracking ${h.habit_name}?`)) {
                    try {
                        await deleteUserHabit(h.id);
                        showNotification("Habit removed.");
                        renderDailyList();
                    } catch (err) {
                        showNotification("Failed to delete habit", "error");
                    }
                }
            };

            list.appendChild(li);
        });

        const percent = Math.round((completedCount / habits.length) * 100);
        updateProgressBar(percent);

    } catch (err) {
        console.error(err);
        list.innerHTML = '<p style="color:var(--danger); text-align:center;">Failed to load habits.</p>';
    }
}

function updateProgressBar(percent) {
    const bar = document.getElementById('daily-progress-bar');
    if (bar) bar.style.width = `${percent}%`;
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

        achievements.forEach(ach => {
            const card = document.createElement('div');
            card.className = 'achievement-card';
            card.innerHTML = `
            <div class="achievement-icon-box">🏆</div>
            <div class="achievement-info">
                <h4>${ach.title}</h4>
                <p>${ach.description}</p>
            </div>
            `;
            list.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        list.innerHTML = '<p style="color:var(--danger);">Failed to load achievements.</p>';
    }
}
