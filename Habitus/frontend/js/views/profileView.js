import { getProfile, updateProfile } from '../api/habitsApi.js';
import { renderDailyChecklist } from './dailyChecklistView.js';
import { renderDashboard } from './dashboardView.js';

export async function renderProfile() {
    const profileSection = document.querySelector('[data-view="profile"]');
    if (!profileSection) return;

    // 1. Fetch Profile Data
    try {
        const profile = await getProfile();
        renderProfileHeader(profile);
    } catch (err) {
        console.error('Failed to load profile:', err);
    }

    // 2. Setup Sub-tabs
    setupProfileTabs();

    // 3. Default to Daily View
    switchProfileTab('daily');
}

function renderProfileHeader(profile) {
    const nameInput = document.getElementById('profile-name');
    const avatarInput = document.getElementById('profile-avatar');
    const timezoneInput = document.getElementById('profile-timezone');
    const emailDisplay = document.getElementById('profile-email-display');

    if (nameInput) nameInput.value = profile.name || '';
    if (avatarInput) avatarInput.value = profile.avatar_url || '';
    if (timezoneInput) timezoneInput.value = profile.timezone || '';
    if (emailDisplay) emailDisplay.textContent = profile.email;

    // Handle Save
    const saveBtn = document.getElementById('save-profile-btn');
    if (saveBtn) {
        saveBtn.onclick = async () => {
            try {
                const updated = {
                    name: nameInput.value,
                    avatar_url: avatarInput.value,
                    timezone: timezoneInput.value
                };
                await updateProfile(updated);
                alert('Profile saved!');
            } catch (err) {
                alert('Error saving profile');
                console.error(err);
            }
        };
    }
}

function setupProfileTabs() {
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(tab => {
        tab.onclick = () => {
            const target = tab.dataset.tab;
            switchProfileTab(target);
        };
    });
}

function switchProfileTab(tabName) {
    // Update Tab UI
    document.querySelectorAll('.profile-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tabName);
    });

    // Hide all content
    document.querySelectorAll('.profile-tab-content').forEach(c => {
        c.style.display = 'none';
    });

    // Show target content
    const targetContent = document.getElementById(`profile-content-${tabName}`);
    if (targetContent) {
        targetContent.style.display = 'block';
    }

    // Render content if needed
    if (tabName === 'daily') {
        renderDailyChecklist();
    } else if (tabName === 'weekly') {
        renderDashboard();
    }
}
