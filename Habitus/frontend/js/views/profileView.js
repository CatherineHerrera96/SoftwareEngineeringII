import { getProfile, updateProfile, fetchDailyChecklist, saveCheckin, deleteUserHabit, getAchievements } from '../api/habitsApi.js';
import { changePassword, changeEmail, deleteAccount } from '../api/authApi.js';
import { showNotification } from '../ui.js';
import { updateUser, clearAuth } from '../state.js';
import { navigateTo } from '../router.js';
import { updateHeaderProfile } from '../ui.js';
import { setupProfileModal, setupSettingsTabs } from '../components/profileModal.js';
import { getSeasonalTheme, applyGlobalTheme, SEASONAL_THEMES, CURRENT_SEASON } from '../config/seasonalThemes.js';
import { renderDailyChecklist } from './dailyChecklistView.js';

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
    if (editName) editName.value = profile.name || '';
    if (editAvatar) editAvatar.value = profile.avatar_url || '';
}

function setupProfileListeners() {
    // Profile Edit Form (now in modal)
    const form = document.getElementById('profile-edit-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const newName = document.getElementById('edit-name').value;
            const newAvatar = document.getElementById('edit-avatar').value;

            try {
                const updated = await updateProfile({ name: newName, avatar_url: newAvatar });
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
        const achievements = await getAchievements();
        console.log("Achievements fetch result:", achievements); // Debug log

        list.innerHTML = '';
        if (!achievements || achievements.length === 0) {
            list.innerHTML = `
                <div style="text-align:center; color:var(--text-muted); padding:2rem;">
                    <p>No achievements unlocked yet.</p>
                    <small>Keep your streaks going to earn badges!</small>
                </div>
            `;
            return;
        }

        achievements.forEach(a => {
            const div = document.createElement('div');
            div.className = 'achievement-card';
            // Use fallback icon if no image provided
            div.innerHTML = `
                <div class="achievement-icon">🏆</div>
                <div class="achievement-info">
                    <h4>${a.name}</h4>
                    <p>${a.description}</p>
                    <small style="color:var(--primary);">${a.awarded_at ? new Date(a.awarded_at).toLocaleDateString() : 'Unlocked'}</small>
                </div>
            `;
            list.appendChild(div);
        });
    } catch (err) {
        console.error("Failed to render achievements:", err);
        list.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Could not load achievements.</p>';
    }
}

function recalcCompletion(items) {
    const total = items.length;
    if (total === 0) return 0;
    const completed = items.filter(i => i.is_completed).length;
    return completed / total;
}
