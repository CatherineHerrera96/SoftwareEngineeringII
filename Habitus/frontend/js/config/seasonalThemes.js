// Config managed by backend_python/seasonal_config.py
export let CURRENT_SEASON = null;
export const updateCurrentSeason = (newSeason) => {
    console.log('[Season Config] Updating current season to:', newSeason);
    CURRENT_SEASON = newSeason ? newSeason.toLowerCase() : null;
    applyGlobalTheme();
};

/** 
 * THEME DEFINITIONS
 * - id: Unique identifier
 * - displayName: The text label to show on the habit card
 * - keywords: Words to trigger this theme
 * - className: CSS class for styling individual cards
 * - lightColors: Colors for light mode
 * - darkColors: Colors for dark mode
 */
export const SEASONAL_THEMES = [
    {
        id: 'cosmere',
        displayName: '⚔️ Cosmere RPG',
        keywords: ['stormlight', 'mistborn', 'radiant', 'allomancy', 'shardblade', 'investiture', 'lashing'],
        className: 'theme-cosmere',
        lightColors: {
            '--theme-primary': '#0ea5e9',
            '--theme-secondary': '#0c4a6e',
            '--theme-bg': '#e0f2fe',
            '--theme-header-bg': 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
            '--theme-text': '#0c4a6e'
        },
        darkColors: {
            '--theme-primary': '#38bdf8',
            '--theme-secondary': '#94a3b8',
            '--theme-bg': '#0f172a',
            '--theme-header-bg': 'linear-gradient(135deg, #0c4a6e, #0ea5e9)',
            '--theme-text': '#e0f2fe'
        }
    },
    {
        id: 'the100',
        displayName: '♾️ The 100',
        keywords: ['survival', 'grounder', 'ark', 'skaikru', 'commander', 'warrior', 'mount weather', 'radiation'],
        className: 'theme-the100',
        lightColors: {
            '--theme-primary': '#22c55e',
            '--theme-secondary': '#16a34a',
            '--theme-bg': '#f0fdf4',
            '--theme-header-bg': 'linear-gradient(135deg, #22c55e, #16a34a)',
            '--theme-text': '#14532d'
        },
        darkColors: {
            '--theme-primary': '#4ade80',
            '--theme-secondary': '#14532d',
            '--theme-bg': '#020617',
            '--theme-header-bg': 'linear-gradient(135deg, #022c22, #14532d)',
            '--theme-text': '#4ade80'
        }
    },
    {
        id: 'new_year',
        displayName: '🎆 New Year',
        keywords: ['resolution', 'year', 'goal', 'january', 'fresh start', 'declutter', 'review'],
        className: 'theme-new-year',
        lightColors: {
            '--theme-primary': '#f59e0b',
            '--theme-secondary': '#d97706',
            '--theme-bg': '#fffbeb',
            '--theme-header-bg': 'linear-gradient(135deg, #fbbf24, #d97706)',
            '--theme-text': '#78350f'
        },
        darkColors: {
            '--theme-primary': '#fbbf24',
            '--theme-secondary': '#000000',
            '--theme-bg': '#111827',
            '--theme-header-bg': 'linear-gradient(135deg, #000000, #1f2937)',
            '--theme-text': '#fbbf24'
        }
    },
    {
        id: 'christmas',
        displayName: '❄️ Winter Holidays',
        keywords: ['christmas', 'santa', 'cocoa', 'gift', 'snow', 'reindeer', 'december', 'winter', 'holiday'],
        className: 'theme-christmas',
        lightColors: {
            '--theme-primary': '#0ea5e9',   /* Sky Blue */
            '--theme-secondary': '#ef4444', /* Holiday Red Accent */
            '--theme-bg': '#f0f9ff',        /* Alice Blue / Snowy */
            '--theme-header-bg': 'linear-gradient(135deg, #0ea5e9, #cbd5e1)', /* Blue to Silver */
            '--theme-text': '#0c4a6e'       /* Dark Navy */
        },
        darkColors: {
            '--theme-primary': '#38bdf8',   /* Bright Ice Blue */
            '--theme-secondary': '#f87171', /* Soft Red */
            '--theme-bg': '#0f172a',        /* Deep Winter Night */
            '--theme-header-bg': 'linear-gradient(135deg, #0f172a, #1e40af)', /* Night Sky */
            '--theme-text': '#e0f2fe'       /* Pale Ice */
        }
    },
    {
        id: 'halloween',
        displayName: '🎃 Spooky Season',
        keywords: ['halloween', 'pumpkin', 'spooky', 'ghost', 'witch', 'candy', 'october'],
        className: 'theme-halloween',
        lightColors: {
            '--theme-primary': '#f97316',
            '--theme-secondary': '#a855f7',
            '--theme-bg': '#fff7ed',
            '--theme-header-bg': 'linear-gradient(135deg, #f97316, #a855f7)',
            '--theme-text': '#7c2d12'
        },
        darkColors: {
            '--theme-primary': '#fb923c',
            '--theme-secondary': '#c084fc',
            '--theme-bg': '#1a0f0a',
            '--theme-header-bg': 'linear-gradient(135deg, #ea580c, #9333ea)',
            '--theme-text': '#fed7aa'
        }
    },
    {
        id: 'summer',
        displayName: '☀️ Summer Vibes',
        keywords: ['summer', 'beach', 'sun', 'swim', 'ocean', 'vacation', 'july', 'august'],
        className: 'theme-summer',
        lightColors: {
            '--theme-primary': '#06b6d4',
            '--theme-secondary': '#fbbf24',
            '--theme-bg': '#f0fdfa',
            '--theme-header-bg': 'linear-gradient(135deg, #06b6d4, #fbbf24)',
            '--theme-text': '#134e4a'
        },
        darkColors: {
            '--theme-primary': '#22d3ee',
            '--theme-secondary': '#fde047',
            '--theme-bg': '#0a2420',
            '--theme-header-bg': 'linear-gradient(135deg, #0e7490, #ca8a04)',
            '--theme-text': '#ccfbf1'
        }
    },
    {
        id: 'valentine',
        displayName: '💖 Valentine',
        keywords: ['valentine', 'love', 'heart', 'romance', 'date', 'february'],
        className: 'theme-valentine',
        lightColors: {
            '--theme-primary': '#ec4899',
            '--theme-secondary': '#f43f5e',
            '--theme-bg': '#fdf2f8',
            '--theme-header-bg': 'linear-gradient(135deg, #ec4899, #f43f5e)',
            '--theme-text': '#831843'
        },
        darkColors: {
            '--theme-primary': '#f472b6',
            '--theme-secondary': '#fb7185',
            '--theme-bg': '#1f0a14',
            '--theme-header-bg': 'linear-gradient(135deg, #be185d, #e11d48)',
            '--theme-text': '#fce7f3'
        }
    },
    {
        id: 'april_fools',
        displayName: '🤡 Prank Time',
        keywords: ['april fools', 'prank', 'joke', 'clown'],
        className: 'theme-april-fools',
        lightColors: {
            '--theme-primary': '#a855f7',
            '--theme-secondary': '#ec4899',
            '--theme-bg': '#faf5ff',
            '--theme-header-bg': 'linear-gradient(135deg, #a855f7, #ec4899)',
            '--theme-text': '#581c87'
        },
        darkColors: {
            '--theme-primary': '#c084fc',
            '--theme-secondary': '#f472b6',
            '--theme-bg': '#1a0a1f',
            '--theme-header-bg': 'linear-gradient(135deg, #7e22ce, #be185d)',
            '--theme-text': '#f3e8ff'
        }
    },
    {
        id: 'spring',
        displayName: '🌸 Spring',
        keywords: ['spring', 'flower', 'bloom', 'garden', 'april', 'may'],
        className: 'theme-spring',
        lightColors: {
            '--theme-primary': '#22c55e',
            '--theme-secondary': '#84cc16',
            '--theme-bg': '#f7fee7',
            '--theme-header-bg': 'linear-gradient(135deg, #22c55e, #84cc16)',
            '--theme-text': '#14532d'
        },
        darkColors: {
            '--theme-primary': '#4ade80',
            '--theme-secondary': '#a3e635',
            '--theme-bg': '#0f1a0a',
            '--theme-header-bg': 'linear-gradient(135deg, #15803d, #4d7c0f)',
            '--theme-text': '#d9f99d'
        }
    }
];

/**
 * Apply the global theme to the document body based on current season and dark/light mode.
 * @param {string} mode - 'light' or 'dark' (optional, will read from body if not provided)
 */
export const applyGlobalTheme = (mode) => {
    const body = document.body;

    // Determine current mode
    const currentMode = mode || body.getAttribute('data-theme') || 'light';

    // Reset if null
    if (!CURRENT_SEASON) {
        body.removeAttribute('data-season');
        // Clear only theme-specific vars, keep data-theme
        const themeVars = ['--theme-primary', '--theme-secondary', '--theme-bg', '--theme-header-bg', '--theme-text'];
        themeVars.forEach(v => body.style.removeProperty(v));
        return;
    }

    const theme = SEASONAL_THEMES.find(t => t.id === CURRENT_SEASON);
    if (theme) {
        body.setAttribute('data-season', theme.id);

        // Choose color set based on mode
        const colors = currentMode === 'dark' ? theme.darkColors : theme.lightColors;

        // Apply CSS variables
        if (colors) {
            for (const [key, val] of Object.entries(colors)) {
                body.style.setProperty(key, val);
            }
        }
    }
};

/**
 * Helper function to determine the theme class for a habit.
 * Returns an object { className, displayName } or null.
 */
export const getSeasonalTheme = (name, category = '') => {
    const n = name.toLowerCase();
    const c = category ? category.toLowerCase().replace(/\s+/g, '') : '';

    for (const theme of SEASONAL_THEMES) {
        // STRICT: If a global season is set, ONLY return that theme.
        // Ignore matches for other seasons to prevent "ghost" styles.
        if (CURRENT_SEASON && theme.id !== CURRENT_SEASON) {
            continue;
        }

        // Check keywords in Name or strict Category match
        const isMatch = theme.keywords.some(k => n.includes(k)) || theme.id === c;

        if (isMatch) {
            // console.log(`[Theme Match] ${name} (${c}) -> ${theme.id}`);
            return { className: theme.className, displayName: theme.displayName };
        }
    }

    // Generic fallback if no specific theme found
    if (c === 'seasonal') return { className: 'theme-seasonal', displayName: 'Seasonal' };

    return null;
};
