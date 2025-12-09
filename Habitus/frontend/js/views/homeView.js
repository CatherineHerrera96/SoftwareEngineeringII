import { getCurrentUser } from '../state.js';
import { navigateTo } from '../router.js';
import { CURRENT_SEASON, SEASONAL_THEMES } from '../config/seasonalThemes.js';

export function initHomeView() {
    // Add click handlers to feature cards
    const habitCard = document.querySelector('[data-feature="habits"]');
    const checklistCard = document.querySelector('[data-feature="checklist"]');
    const achievementsCard = document.querySelector('[data-feature="achievements"]');
    const profileCard = document.querySelector('[data-feature="profile"]');

    if (habitCard) {
        habitCard.addEventListener('click', () => navigateTo('habits'));
    }
    if (checklistCard) {
        checklistCard.addEventListener('click', () => navigateTo('checklist'));
    }
    if (achievementsCard) {
        achievementsCard.addEventListener('click', () => navigateTo('achievements'));
    }
    if (profileCard) {
        profileCard.addEventListener('click', () => navigateTo('profile'));
    }
}

export function renderHome() {
    const user = getCurrentUser();
    const userName = user?.name || 'there';

    // Update welcome section
    const welcomeEl = document.getElementById('home-welcome-name');
    if (welcomeEl) {
        welcomeEl.textContent = userName;
    }

    // Update seasonal hero message
    updateSeasonalHero();
}

function updateSeasonalHero() {
    const heroTitle = document.getElementById('home-hero-title');
    const heroSubtitle = document.getElementById('home-hero-subtitle');

    if (!heroTitle || !heroSubtitle) return;

    // Get current season theme
    const currentTheme = CURRENT_SEASON
        ? SEASONAL_THEMES.find(t => t.id === CURRENT_SEASON)
        : null;

    if (currentTheme) {
        // Seasonal messaging
        const messages = getSeasonalMessages(currentTheme.id);
        heroTitle.textContent = messages.title;
        heroSubtitle.textContent = messages.subtitle;
    } else {
        // Default messaging
        heroTitle.textContent = 'Build Better Habits';
        heroSubtitle.textContent = 'Track your progress, unlock achievements, and build lasting habits one day at a time.';
    }
}

function getSeasonalMessages(seasonId) {
    const now = new Date();
    // If we are in the second half of the year (e.g. Dec), we are celebrating the UPCOMING new year.
    const displayYear = now.getMonth() > 6 ? now.getFullYear() + 1 : now.getFullYear();

    const seasonalMessages = {
        'christmas': {
            title: '🎄 Merry Christmas!',
            subtitle: 'Make this holiday season your best yet with healthy habits and festive traditions.'
        },
        'new_year': {
            title: '🎆 Happy New Year ' + displayYear + '!',
            subtitle: 'Start the year strong with fresh goals and powerful habits. Your best year starts now!'
        },
        'halloween': {
            title: '🎃 Spooky Habits Season!',
            subtitle: 'Don\'t let scary goals haunt you. Track your progress and make every day count!'
        },
        'summer': {
            title: '☀️ Summer Vibes!',
            subtitle: 'Stay active, stay healthy, and make the most of those long sunny days!'
        },
        'valentine': {
            title: '💖 Love Yourself!',
            subtitle: 'Build habits that show self-love and care. You deserve the best version of yourself!'
        },
        'april_fools': {
            title: '🤡 No Joke - Build Real Habits!',
            subtitle: 'Unlike pranks, good habits are no laughing matter. Track your progress seriously!'
        },
        'spring': {
            title: '🌸 Spring Into Action!',
            subtitle: 'Just like flowers bloom, let your progress blossom with consistent daily habits.'
        },
        'cosmere': {
            title: '⚔️ Journey Before Destination',
            subtitle: 'Life before death, strength before weakness, journey before destination. Build your Radiant habits.'
        },
        'the100': {
            title: '♾️ Survive and Thrive',
            subtitle: 'In the harsh world, only the disciplined survive. Track your warrior habits!'
        }
    };

    return seasonalMessages[seasonId] || {
        title: 'Build Better Habits',
        subtitle: 'Track your progress, unlock achievements, and build lasting habits one day at a time.'
    };
}
