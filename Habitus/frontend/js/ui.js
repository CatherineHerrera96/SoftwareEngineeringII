
import { getProfile } from './api/habitsApi.js';
import { applyGlobalTheme } from './config/seasonalThemes.js';

export async function updateHeaderProfile() {
    const avatarEl = document.getElementById('header-avatar');
    const nameEl = document.getElementById('header-username');

    if (!avatarEl || !nameEl) return;

    try {
        const profile = await getProfile();
        nameEl.textContent = profile.name || 'User';
        if (profile.avatar_url) {
            avatarEl.innerHTML = `<img src="${profile.avatar_url}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            avatarEl.innerHTML = (profile.name || 'U')[0].toUpperCase();
        }
    } catch (err) {
        console.warn("Header profile fetch failed", err);
    }
}

export function showNotification(msg, type = 'success') {
    const container = document.getElementById('notification-area');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.textContent = msg;
    container.appendChild(el);

    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(100%)';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

/**
 * Load saved theme preference from localStorage
 * @returns {string} - 'light' or 'dark'
 */
export function loadThemePreference() {
    const stored = localStorage.getItem('theme-preference');
    if (stored) return stored;

    // Fallback to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

/**
 * Save theme preference to localStorage
 * @param {string} theme - 'light' or 'dark'
 */
export function saveThemePreference(theme) {
    localStorage.setItem('theme-preference', theme);
}

/**
 * Apply theme immediately (called before DOM loads to prevent flash)
 * @param {string} theme - 'light' or 'dark'
 */
export function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    // Reapply seasonal theme with new mode
    applyGlobalTheme(theme);
}

/**
 * Initialize theme toggle button with persistence
 */
export function initTheme() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    // Load saved preference and apply
    const savedTheme = loadThemePreference();
    console.log('[initTheme] Loaded saved theme:', savedTheme);
    applyTheme(savedTheme);

    // Toggle handler
    btn.onclick = () => {
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        console.log('[initTheme] Toggling from', current, 'to', next);

        // Apply new theme
        applyTheme(next);

        // Save preference
        saveThemePreference(next);
        console.log('[initTheme] Theme preference saved');
    };
}

/**
 * Show error message for a specific form field
 * @param {string} errorElementId - ID of the error span
 * @param {string} message - Error message
 */
export function showFormError(errorElementId, message) {
    const el = document.getElementById(errorElementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        el.style.color = 'var(--danger)';
        el.style.fontSize = '0.8rem';
        el.style.marginTop = '0.25rem';
    }
}

/**
 * Clear all form errors
 */
export function clearFormErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}
