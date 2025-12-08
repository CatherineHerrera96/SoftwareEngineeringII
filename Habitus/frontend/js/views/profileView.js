import { getProfile, updateProfile, fetchDailyChecklist, saveCheckin, deleteUserHabit, getAchievements } from '../api/habitsApi.js';
import { changePassword, changeEmail, deleteAccount } from '../api/authApi.js';
import { showNotification, updateHeaderProfile, showFormError, clearFormErrors } from '../ui.js';
import { updateUser, clearAuth } from '../state.js';
import { navigateTo } from '../router.js';

import { setupProfileModal, setupSettingsTabs } from '../components/profileModal.js';
import { getSeasonalTheme, applyGlobalTheme, SEASONAL_THEMES, CURRENT_SEASON } from '../config/seasonalThemes.js';
import { renderDailyChecklist } from './dailyChecklistView.js';
import { getAchievementIcon, getTierIconClass } from '../achievementIcons.js';

export async function renderProfile(activeTab = 'daily') {
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

    // 2. Setup Modal and Settings Tabs
    setupProfileModal();
    setupSettingsTabs();

    // 3. Setup Event Listeners (Forms, Tabs)
    setupProfileListeners();

    // 4. Render Sub-views
    // DELEGATE to external dailyChecklistView which handles the global timer
    renderDailyChecklist();
    renderAchievementsList();

    // 5. Switch to requested tab
    switchTab(activeTab);
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
    const editTimezone = document.getElementById('edit-timezone');

    if (editName) editName.value = profile.name || '';
    if (editAvatar) editAvatar.value = profile.avatar_url || '';
    if (editTimezone && profile.timezone) editTimezone.value = profile.timezone;
}

function setupProfileListeners() {
    // Profile Edit Form (now in modal)
    const form = document.getElementById('profile-edit-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const newName = document.getElementById('edit-name').value;
            const newAvatar = document.getElementById('edit-avatar').value;
            const newTimezone = document.getElementById('edit-timezone').value;

            try {
                const updated = await updateProfile({
                    name: newName,
                    avatar_url: newAvatar,
                    timezone: newTimezone
                });
                updateProfileUI(updated);
                showNotification("Profile updated!");
            } catch (err) {
                showNotification("Failed to update profile", "error");
            }
        };
    }

    // Daily/Stats Tabs
    const tabDaily = document.getElementById('tab-btn-daily');
    const tabStats = document.getElementById('tab-btn-stats');

    if (tabDaily) {
        tabDaily.onclick = () => switchTab('daily');
    }
    if (tabStats) {
        tabStats.onclick = () => switchTab('stats');
    }

    // Real-time achievement updates
    window.addEventListener('achievementUnlocked', () => {
        // Only refresh if we are currently on the stats tab
        const statsContent = document.getElementById('tab-stats');
        if (statsContent && statsContent.style.display !== 'none') {
            console.log("Real-time achievement update...");
            renderAchievementsList();
        }
    });

    // Account Settings Forms

    // Change Email Form
    const changeEmailForm = document.getElementById('change-email-form');
    if (changeEmailForm) {
        changeEmailForm.onsubmit = async (e) => {
            e.preventDefault();
            clearFormErrors();

            const currentPassword = document.getElementById('email-current-password').value;
            const newEmail = document.getElementById('new-email').value;

            // Basic validation
            if (!currentPassword || !newEmail) {
                showFormError('new-email-error', 'Please fill in all fields');
                return;
            }

            if (!newEmail.includes('@')) {
                showFormError('new-email-error', 'Please enter a valid email');
                return;
            }

            try {
                const updatedUser = await changeEmail(currentPassword, newEmail);

                // Clear form
                changeEmailForm.reset();

                // Show success message
                showNotification('Email updated! Please log in with your new email.');

                // Log out user (JWT token is now invalid with old email)
                clearAuth();

                // Close modal
                const modal = document.getElementById('edit-profile-modal');
                if (modal) modal.style.display = 'none';

                // Redirect to login after a delay
                setTimeout(() => {
                    navigateTo('login');
                }, 2000);
            } catch (err) {
                showFormError('email-current-password-error', err.message || 'Failed to change email');
            }
        };
    }

    // Change Password Form
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.onsubmit = async (e) => {
            e.preventDefault();
            clearFormErrors();

            const currentPassword = document.getElementById('password-current').value;
            const newPassword = document.getElementById('password-new').value;
            const confirmPassword = document.getElementById('password-confirm').value;

            // Client-side validation
            if (!currentPassword || !newPassword || !confirmPassword) {
                showFormError('password-confirm-error', 'Please fill in all fields');
                return;
            }

            if (newPassword.length < 8) {
                showFormError('password-new-error', 'Password must be at least 8 characters');
                return;
            }

            if (newPassword !== confirmPassword) {
                showFormError('password-confirm-error', 'Passwords do not match');
                return;
            }

            try {
                await changePassword(currentPassword, newPassword);

                // Clear form
                changePasswordForm.reset();

                showNotification('Password changed successfully!');
            } catch (err) {
                showFormError('password-current-error', err.message || 'Failed to change password');
            }
        };
    }

    // Delete Account Form
    const deleteAccountForm = document.getElementById('delete-account-form');
    const deleteConfirmationInput = document.getElementById('delete-confirmation');
    const deleteAccountBtn = document.getElementById('delete-account-btn');

    // Enable delete button only when "DELETE" is typed
    if (deleteConfirmationInput && deleteAccountBtn) {
        deleteConfirmationInput.oninput = () => {
            deleteAccountBtn.disabled = deleteConfirmationInput.value !== 'DELETE';
        };
    }

    if (deleteAccountForm) {
        deleteAccountForm.onsubmit = async (e) => {
            e.preventDefault();
            clearFormErrors();

            const currentPassword = document.getElementById('delete-current-password').value;
            // Note: 'confirmation' var was undefined in original code too, assuming it refers to input value or global scope
            const confirmation = deleteConfirmationInput.value;

            if (confirmation !== 'DELETE') {
                showFormError('delete-confirmation-error', 'You must type DELETE to confirm');
                return;
            }

            const deleteModal = document.getElementById('delete-confirm-modal');
            const deleteCancelBtn = document.getElementById('delete-cancel-btn');
            const deleteFinalBtn = document.getElementById('delete-final-btn');

            if (deleteModal) {
                deleteModal.style.display = 'flex';
                deleteCancelBtn.onclick = () => deleteModal.style.display = 'none';
                deleteFinalBtn.onclick = async () => {
                    try {
                        await deleteAccount(currentPassword);
                        clearAuth();
                        showNotification('Account deleted.');
                        setTimeout(() => navigateTo('login'), 2000);
                    } catch (err) {
                        showFormError('delete-current-password-error', err.message || 'Failed to delete account');
                    }
                };
            }
        };
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

    // Trigger refresh if daily tab is activated
    if (tabName === 'daily') {
        renderDailyChecklist();
    } else if (tabName === 'stats') {
        renderAchievementsList();
    }
}

async function renderDailyList() {
    // Deprecated: Now handled by dailyChecklistView.js
    console.warn("renderDailyList is deprecated. Use renderDailyChecklist instead.");
}

function updateProgressBar(fraction) {
    const fill = document.getElementById('daily-progress-bar');
    // const text = document.getElementById('progress-text'); // Element not in HTML
    if (fill) fill.style.width = (fraction * 100) + '%';
    // if (text) text.textContent = Math.round(fraction * 100) + '% Completed';
}

async function renderAchievementsList() {
    const list = document.getElementById('achievements-list');
    if (!list) return;

    try {
        const response = await getAchievements(); // Returns { stats, unlocked, locked }
        console.log("Achievements fetch result:", response);

        list.innerHTML = '';

        // 1. Stats Row (Top)
        const stats = response.stats;
        if (stats) {
            const statsContainer = document.createElement('div');
            statsContainer.className = 'achievements-header-stats'; // New class for top row
            statsContainer.innerHTML = `
                <div class="stat-card compact">
                    <h3>Completion Rate</h3>
                    <div class="stat-value">${stats.weekly_completion_rate}%</div>
                    <div class="stat-label">This Week</div>
                </div>
                <div class="stat-card compact">
                    <h3>Total Streak</h3>
                    <div class="stat-value">${stats.total_streak_days}</div>
                    <div class="stat-label">Days</div>
                </div>
            `;
            list.appendChild(statsContainer);
        }

        // 2. Process Unlocked Achievements (Sort & Extract Recent)
        const unlocked = response.unlocked || [];

        let mostRecent = null;
        let remainingUnlocked = [];

        if (unlocked.length > 0) {
            // Sort all by date desc first to find most recent
            const byDate = [...unlocked].sort((a, b) =>
                new Date(b.unlocked_at) - new Date(a.unlocked_at)
            );
            mostRecent = byDate[0];

            // Remove most recent from list to avoid duplicate
            const others = unlocked.filter(a => a !== mostRecent &&
                !(a.id === mostRecent.id && a.habit_id === mostRecent.habit_id)); // Safety check unique ID+Habit

            // Sort others by Tier then Date
            remainingUnlocked = sortAchievements(others);
        }

        // 3. Render Unlocked Section
        const unlockedHeader = document.createElement('h3');
        unlockedHeader.textContent = "Unlocked Achievements";
        unlockedHeader.className = "section-header";
        list.appendChild(unlockedHeader);

        if (unlocked.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state-card';
            emptyState.innerHTML = `
                <p>No achievements unlocked yet.</p>
                <small>Keep your streaks going to earn badges!</small>
            `;
            list.appendChild(emptyState);
        } else {
            // Render Highlighted Card
            if (mostRecent) {
                const highlightCard = createAchievementCard(mostRecent, true);
                list.appendChild(highlightCard);
            }

            // Render Grid for Remaining
            if (remainingUnlocked.length > 0) {
                const grid = document.createElement('div');
                grid.className = 'achievements-grid';
                remainingUnlocked.forEach(a => {
                    grid.appendChild(createAchievementCard(a, false));
                });
                list.appendChild(grid);
            }
        }

        // 4. Render Locked Section
        if (response.locked && response.locked.length > 0) {
            const lockedHeader = document.createElement('h3');
            lockedHeader.textContent = "Locked Achievements";
            lockedHeader.className = "section-header locked-header";
            list.appendChild(lockedHeader);

            const lockedContainer = document.createElement('div');
            lockedContainer.className = 'achievements-grid';

            response.locked.forEach(a => {
                lockedContainer.appendChild(createLockedCard(a));
            });
            list.appendChild(lockedContainer);
        }

    } catch (err) {
        console.error("Failed to render achievements:", err);
        list.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Could not load achievements.</p>';
    }
}

// Helper: Sort Achievements
function sortAchievements(list) {
    const tierWeight = { 'master': 4, 'gold': 3, 'silver': 2, 'bronze': 1 };

    return list.sort((a, b) => {
        const wA = tierWeight[(a.tier || '').toLowerCase()] || 0;
        const wB = tierWeight[(b.tier || '').toLowerCase()] || 0;

        if (wA !== wB) return wB - wA; // Higher tier first

        // If same tier, recent first
        return new Date(b.unlocked_at) - new Date(a.unlocked_at);
    });
}

// Helper: Create Unlocked Card contents
function createAchievementCard(a, isHighlight) {
    const div = document.createElement('div');
    div.className = isHighlight ? 'achievement-card highlighted' : 'achievement-card';

    // Get icon from mapping
    const iconData = getAchievementIcon(a.code);
    const tierClass = getTierIconClass(a.tier);

    const habitInfo = a.habit_name ? `<div class="achievement-pill">Habit: ${a.habit_name}</div>` : '';
    const dateStr = a.unlocked_at ? new Date(a.unlocked_at).toLocaleDateString() : 'Unlocked';

    div.innerHTML = `
        <div class="achievement-icon ${tierClass}">
            <span class="${iconData.className}">${iconData.emoji}</span>
        </div>
        <div class="achievement-content">
            <div class="achievement-title-row">
                <span class="achievement-title">${a.name}</span>
                ${a.tier ? `<span class="achievement-tier ${a.tier.toLowerCase()}">${a.tier.toUpperCase()}</span>` : ''}
            </div>
            <p class="achievement-description">${a.description}</p>
            <div class="achievement-meta">
                ${habitInfo}
                <small class="achievement-date">Unlocked on ${dateStr}</small>
            </div>
        </div>
    `;
    return div;
}

// Helper: Create Locked Card contents
function createLockedCard(a) {
    const div = document.createElement('div');
    div.className = 'achievement-card locked';

    // Get icon from mapping
    const iconData = getAchievementIcon(a.code);
    const tierClass = getTierIconClass(a.tier);

    let progressHtml = '';
    if (a.progress) {
        const pct = Math.min(100, Math.round((a.progress.current / a.progress.target) * 100));
        progressHtml = `
            <div class="achievement-progress">
                <div class="progress-text">Progress: ${a.progress.current} / ${a.progress.target}</div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    }

    div.innerHTML = `
        <div class="achievement-icon ${tierClass} locked">
            <span class="${iconData.className}">${iconData.emoji}</span>
        </div>
        <div class="achievement-content">
            <div class="achievement-title-row">
                <span class="achievement-title">${a.name}</span>
                ${a.tier ? `<span class="achievement-tier ${a.tier.toLowerCase()}">${a.tier.toUpperCase()}</span>` : ''}
            </div>
            <p class="achievement-description">${a.description}</p>
            ${progressHtml}
        </div>
    `;
    return div;
}

function recalcCompletion(items) {
    // ... kept for compatibility if used elsewhere, though not used here
    const total = items.length;
    if (total === 0) return 0;
    const completed = items.filter(i => i.is_completed).length;
    return completed / total;
}
