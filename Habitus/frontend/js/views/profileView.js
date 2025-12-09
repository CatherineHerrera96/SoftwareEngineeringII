import { getProfile, updateProfile, fetchDailyChecklist, saveCheckin, deleteUserHabit, getAchievements } from '../api/habitsApi.js';
import { changePassword, changeEmail, deleteAccount } from '../api/authApi.js';
import { showNotification, updateHeaderProfile, showFormError, clearFormErrors } from '../ui.js';
import { updateUser, clearAuth } from '../state.js';
import { navigateTo } from '../router.js';

import { setupProfileModal, setupSettingsTabs } from '../components/profileModal.js';
import { getSeasonalTheme, applyGlobalTheme, SEASONAL_THEMES, CURRENT_SEASON } from '../config/seasonalThemes.js';
import { renderDailyChecklist } from './dailyChecklistView.js';
import { getAchievementIcon, getTierIconClass } from '../achievementIcons.js';

let achievementsViewMode = 'overview';

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
    if (editTimezone && profile.timezone) {
        // Map legacy NY to Bogota (Merged in UI)
        if (profile.timezone === 'America/New_York') {
            editTimezone.value = 'America/Bogota';
        } else {
            editTimezone.value = profile.timezone;
        }
    }
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
                updateProfileUI(updated);
                showNotification("Profile updated!");

                // Refresh Daily Checklist to reflect new timezone immediately
                renderDailyChecklist();
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
                resetProfileViewState();
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
                        resetProfileViewState();
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

export function resetProfileViewState() {
    achievementsViewMode = 'overview'; // Reset achievements view

    // Close Modals
    const editModal = document.getElementById('edit-profile-modal');
    if (editModal) editModal.style.display = 'none';

    const deleteModal = document.getElementById('delete-confirm-modal');
    if (deleteModal) deleteModal.style.display = 'none';

    // Clear Forms
    const forms = [
        'profile-edit-form',
        'change-email-form',
        'change-password-form',
        'delete-account-form'
    ];
    forms.forEach(id => {
        const f = document.getElementById(id);
        if (f) f.reset();
    });

    // Reset Settings Tabs (Default to first tab)
    const tabs = document.querySelectorAll('.profile-tab');
    const contents = document.querySelectorAll('.profile-tab-content');
    if (tabs.length > 0) {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        tabs[0].classList.add('active');
        // Activate corresponding content
        const firstTabName = tabs[0].getAttribute('data-settings-tab');
        const firstContent = document.getElementById(`tab-${firstTabName}`);
        if (firstContent) firstContent.classList.add('active');
    }

    // Collapse any separate details/accordions if they exist in the DOM
    document.querySelectorAll('details').forEach(d => d.open = false);

    // Clear any error messages
    document.querySelectorAll('.form-error').forEach(e => e.style.display = 'none');
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

        // Fix: Remove 'achievements-grid' class which constrains width to a single column
        list.className = '';
        list.innerHTML = '';

        // --- 1. Layout Container ---
        const layout = document.createElement('div');
        layout.className = 'achievements-layout';

        // --- 2. Top Row: Stats Block ---
        const topRow = document.createElement('div');
        topRow.className = 'achievements-top-row';

        const stats = response.stats || {};
        const weeklyRate = stats.weekly_completion_rate || 0;
        const streakTotal = stats.total_streak_days || 0;

        // Dynamic Styles for Weekly Rate
        let rateClass = 'neutral';
        if (weeklyRate >= 80) { rateClass = 'gold'; }
        else if (weeklyRate >= 50) { rateClass = 'silver'; }
        else { rateClass = 'bronze'; }

        // Dynamic Styles for Streak
        let streakClass = 'neutral';
        if (streakTotal >= 14) { streakClass = 'gold'; }
        else if (streakTotal >= 7) { streakClass = 'silver'; }
        else if (streakTotal >= 3) { streakClass = 'bronze'; }

        // Generate circles HTML for Weekly Consistency (Fixed Sun-Sat Window)
        const trend = stats.trend || [];
        let circlesHtml = '<div class="stats-trend-circles">';

        trend.forEach(day => {
            // day.status came from backend: 'completed', 'lost', 'cold', 'future', 'pre_exist'
            // Map statuses to CSS classes
            // completed -> .completed (Green)
            // lost -> .lost (Red)
            // others (cold, future, pre_exist) -> default (Gray)

            let cssClass = '';
            if (day.status === 'completed') cssClass = 'completed';
            else if (day.status === 'lost') cssClass = 'lost';

            // Get Day Letter (safe parsing)
            // Append T12:00:00 to avoid timezone shift on plain dates
            const dateObj = new Date(day.date + 'T12:00:00');
            const letter = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });

            const fullDate = dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

            circlesHtml += `<div class="trend-circle ${cssClass}" title="${fullDate}: ${day.status}">${letter}</div>`;
        });
        circlesHtml += '</div>';

        topRow.innerHTML = `
            <div class="stat-card">
                ${circlesHtml}
                <div class="stat-value" style="font-size: 1.5rem;">${weeklyRate}%</div>
                <div class="stat-label">Weekly Consistency</div>
            </div>
            <div class="stat-card ${streakClass}">
                <div class="stat-value">${streakTotal}</div>
                <div class="stat-label">Total Streak</div>
            </div>
        `;
        layout.appendChild(topRow);

        // Data Prep
        const unlocked = response.unlocked || [];
        // Sort by Date Descending
        const sortedUnlocked = [...unlocked].sort((a, b) => new Date(b.unlocked_at) - new Date(a.unlocked_at));

        const locked = response.locked || [];
        // Sort by Progress Ratio Descending
        const sortedLocked = [...locked].sort((a, b) => {
            const pA = a.progress ? (a.progress.current / a.progress.target) : 0;
            const pB = b.progress ? (b.progress.current / b.progress.target) : 0;
            return pB - pA;
        });


        // --- 3. Render Based on View Mode ---
        if (achievementsViewMode === 'overview') {
            const bottomRow = document.createElement('div');
            bottomRow.className = 'achievements-bottom-row';

            // --- Left Column: Unlocked ---
            const unlockedCol = document.createElement('section');
            unlockedCol.className = 'achievements-col achievements-col-unlocked';

            const unlockedHeader = document.createElement('header');
            unlockedHeader.className = 'achievements-column-header';
            unlockedHeader.innerHTML = `<h3>Unlocked Achievements</h3>`;
            unlockedCol.appendChild(unlockedHeader);

            const unlockedList = document.createElement('div');
            unlockedList.className = 'achievements-list achievements-list-unlocked';

            if (sortedUnlocked.length === 0) {
                unlockedList.innerHTML = `<div class="empty-state-card"><p>No unlocked achievements yet.</p></div>`;
            } else {
                // Show first 3
                const limit = 3;
                sortedUnlocked.slice(0, limit).forEach((a, idx) => {
                    // Feature the first one if it's the very top of the list
                    const isFeatured = idx === 0;
                    unlockedList.appendChild(createAchievementCard(a, isFeatured));
                });
            }
            unlockedCol.appendChild(unlockedList);

            // View All Control
            if (sortedUnlocked.length > 3) {
                const toggleDiv = document.createElement('div');
                toggleDiv.className = 'achievements-view-toggle';
                const btn = document.createElement('button');
                btn.className = 'link-button';
                btn.innerHTML = 'View all unlocked ➜';
                btn.onclick = () => {
                    achievementsViewMode = 'unlocked-all';
                    renderAchievementsList();
                };
                toggleDiv.appendChild(btn);
                unlockedCol.appendChild(toggleDiv);
            }
            bottomRow.appendChild(unlockedCol);

            // --- Right Column: Locked ---
            const lockedCol = document.createElement('section');
            lockedCol.className = 'achievements-col achievements-col-locked';

            const lockedHeader = document.createElement('header');
            lockedHeader.className = 'achievements-column-header';
            lockedHeader.innerHTML = `<h3>Locked Achievements</h3>`;
            lockedCol.appendChild(lockedHeader);

            const lockedList = document.createElement('div');
            lockedList.className = 'achievements-list achievements-list-locked';

            if (sortedLocked.length === 0) {
                lockedList.innerHTML = `<div class="empty-state-card"><p>All achievements unlocked! 🎉</p></div>`;
            } else {
                // Revert to 3 items as requested
                const limit = 3;
                sortedLocked.slice(0, limit).forEach((a) => {
                    lockedList.appendChild(createLockedCard(a));
                });
            }
            lockedCol.appendChild(lockedList);

            // View All Control
            if (sortedLocked.length > 3) {
                const toggleDiv = document.createElement('div');
                toggleDiv.className = 'achievements-view-toggle';
                const btn = document.createElement('button');
                btn.className = 'link-button';
                btn.innerHTML = 'View all locked ➜';
                btn.onclick = () => {
                    achievementsViewMode = 'locked-all';
                    renderAchievementsList();
                };
                toggleDiv.appendChild(btn);
                lockedCol.appendChild(toggleDiv);
            }
            bottomRow.appendChild(lockedCol);

            layout.appendChild(bottomRow);

        } else if (achievementsViewMode === 'unlocked-all') {
            // Back Link
            const backLink = document.createElement('div');
            backLink.className = 'achievements-back-link';
            const backBtn = document.createElement('button');
            backBtn.className = 'link-button';
            backBtn.innerHTML = '← Back to overview';
            backBtn.onclick = () => {
                achievementsViewMode = 'overview';
                renderAchievementsList();
            };
            backLink.appendChild(backBtn);
            layout.appendChild(backLink);

            // Title
            const title = document.createElement('h3');
            title.className = 'achievements-full-title';
            title.textContent = 'Achievements – Unlocked';
            layout.appendChild(title);

            // Full List - Sorted by Tier
            const fullList = document.createElement('div');
            fullList.className = 'achievements-full-list';

            // Sort by Tier Order (Master -> Gold -> Silver -> Bronze)
            const tierOrder = { 'master': 4, 'gold': 3, 'silver': 2, 'bronze': 1 };
            const tierSorted = [...sortedUnlocked].sort((a, b) => {
                const tA = tierOrder[(a.tier || '').toLowerCase()] || 0;
                const tB = tierOrder[(b.tier || '').toLowerCase()] || 0;
                return tB - tA; // Descending
            });

            tierSorted.forEach((a) => {
                // In full grid view, we don't need 'featured' style logic, just standard cards
                fullList.appendChild(createAchievementCard(a, false));
            });

            layout.appendChild(fullList);

        } else if (achievementsViewMode === 'locked-all') {
            // Back Link
            const backLink = document.createElement('div');
            backLink.className = 'achievements-back-link';
            const backBtn = document.createElement('button');
            backBtn.className = 'link-button';
            backBtn.innerHTML = '← Back to overview';
            backBtn.onclick = () => {
                achievementsViewMode = 'overview';
                renderAchievementsList();
            };
            backLink.appendChild(backBtn);
            layout.appendChild(backLink);

            // Title
            const title = document.createElement('h3');
            title.className = 'achievements-full-title';
            title.textContent = 'Achievements – Locked';
            layout.appendChild(title);

            // Full List - Sorted by Tier
            const fullList = document.createElement('div');
            fullList.className = 'achievements-full-list';

            // Sort by Tier Order (Master -> Gold -> Silver -> Bronze)
            const tierOrder = { 'master': 4, 'gold': 3, 'silver': 2, 'bronze': 1 };
            const tierSorted = [...sortedLocked].sort((a, b) => {
                const tA = tierOrder[(a.tier || '').toLowerCase()] || 0;
                const tB = tierOrder[(b.tier || '').toLowerCase()] || 0;
                return tB - tA; // Descending
            });

            tierSorted.forEach(a => {
                fullList.appendChild(createLockedCard(a));
            });

            layout.appendChild(fullList);
        }

        list.appendChild(layout);

    } catch (err) {
        console.error("Failed to render achievements:", err);
        list.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Could not load achievements.</p>';
    }
}

// Helper: Create Unlocked Card contents
function createAchievementCard(a, isFeatured) {
    const div = document.createElement('div');
    div.className = isFeatured ? 'achievement-card featured' : 'achievement-card';

    const iconData = getAchievementIcon(a.code);
    const tierClass = getTierIconClass(a.tier);
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
                ${a.habit_name ? `<span class="achievement-pill">Habit: ${a.habit_name}</span>` : ''}
                <small class="achievement-date">Unlocked on ${dateStr}</small>
            </div>
        </div>
    `;
    return div;
}

// Helper: Create Locked Card contents
function createLockedCard(a, isFeatured) {
    const div = document.createElement('div');
    // Ensure 'locked' class is preserved along with potentially 'featured'
    div.className = isFeatured ? 'achievement-card locked featured' : 'achievement-card locked';

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
