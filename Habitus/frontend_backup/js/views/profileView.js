import { getProfile, updateProfile } from '../api/habitsApi.js';
import { showSuccess, showError } from '../components/notifications.js';
import { renderDailyChecklist } from './dailyChecklistView.js';
import { renderDashboard } from './dashboardView.js';

export async function renderProfile() {
    const app = document.querySelector('[data-view="profile"]');
    if (!app) return;

    // Render Skeleton
    app.innerHTML = `
        <div class="view-page">
            <div class="profile-header">
              <div class="profile-info">
                <h2 class="page-title">My Profile</h2>
                <p id="profile-email-display" class="view-subtitle">Loading...</p>
              </div>
            </div>

            <!-- User Info Card -->
            <div class="view-card" style="margin: 0 auto 2rem; max-width: 600px;">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div style="width: 80px; height: 80px; background: #e0e7ff; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                        👤
                    </div>
                    <h3 id="profile-name" style="font-size: 1.25rem; font-weight: 700;">Loading...</h3>
                </div>

                <form id="profile-form">
                    <div class="form-group">
                        <label class="form-label">Display Name</label>
                        <input type="text" id="input-name" class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Avatar URL</label>
                        <input type="text" id="input-avatar" class="form-input" placeholder="https://...">
                    </div>
                    <button type="submit" class="btn-primary">Save Changes</button>
                </form>
            </div>

            <div class="profile-tabs">
                <button class="profile-tab active" data-tab="daily">Daily Checklist</button>
                <button class="profile-tab" data-tab="weekly">Weekly Progress</button>
            </div>

            <div class="profile-content">
                <!-- DAILY CHECKLIST SUB-VIEW -->
                <div id="profile-content-daily" class="profile-tab-content">
                    <h3 class="section-title">Today's Habits</h3>
                    <div class="progress-bar-wrapper">
                      <div class="progress-bar-track">
                        <div class="progress-bar-fill" id="daily-progress-bar" style="width: 0%"></div>
                      </div>
                    </div>
                    <div id="daily-list" class="daily-list">
                      <!-- Filled by dailyChecklistView.js -->
                    </div>
                </div>

                <!-- WEEKLY PROGRESS SUB-VIEW -->
                <div id="profile-content-weekly" class="profile-tab-content" style="display: none;">
                    <h3 class="section-title">Weekly Stats</h3>
                    <div class="stats-row">
                      <div class="stat-card">
                        <p class="stat-value" id="weekly-completion">--</p>
                        <p class="stat-label">Weekly Completion</p>
                      </div>
            
                      <div class="stat-card">
                        <p class="stat-value" id="current-streak">--</p>
                        <p class="stat-label">Current Streak</p>
                      </div>
                    </div>
            
                    <h3 class="section-title">Achievements</h3>
                    <div id="achievements-list" class="achievements-grid">
                      <!-- Filled by dashboardView.js -->
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load Data
    try {
        const profile = await getProfile();

        // Fill Profile Data
        document.getElementById('profile-name').textContent = profile.name || 'User';
        document.getElementById('profile-email-display').textContent = profile.email;
        document.getElementById('input-name').value = profile.name || '';
        document.getElementById('input-avatar').value = profile.avatar_url || '';

        // Initial Render of Sub-views
        renderDailyChecklist();
        renderDashboard(); // Pre-load dashboard data too

    } catch (err) {
        console.error(err);
        showError('Failed to load profile data');
    }

    // Handle Form Submit
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const updates = {
            name: document.getElementById('input-name').value,
            avatar_url: document.getElementById('input-avatar').value
        };

        try {
            await updateProfile(updates);
            showSuccess('Profile updated!');
            document.getElementById('profile-name').textContent = updates.name;
        } catch (err) {
            showError('Failed to update profile');
        }
    });

    // Handle Tabs
    document.querySelectorAll('.profile-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Toggle active tab
            document.querySelectorAll('.profile-tab').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Toggle content
            const tabName = e.target.dataset.tab;
            document.getElementById('profile-content-daily').style.display = tabName === 'daily' ? 'block' : 'none';
            document.getElementById('profile-content-weekly').style.display = tabName === 'weekly' ? 'block' : 'none';
        });
    });
}
