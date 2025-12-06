/**
 * SEASONAL THEMES CONFIGURATION
 * 
 * ----------------------------------------------------------------------
 * GLOBAL SEASON SETTING
 * Change this value to enforce a specific season for the entire app.
 * 
 * SUPPORTED VALUES:
 * - 'christmas'  : Enforce Christmas themes
 * - 'new_year'   : Enforce New Year themes (Gold/Fireworks)
 * - 'halloween'  : Enforce Halloween themes
 * - 'summer'     : Enforce Summer themes
 * - 'valentine'  : Enforce Valentine's Day themes
 * - 'april_fools': Enforce April Fool's themes
 * - 'spring'     : Enforce Spring themes
 * - null         : ALLOW ALL (Automatic detection based on keywords)
 * ----------------------------------------------------------------------
 */
export const CURRENT_SEASON = 'christmas';

/**
 * THEME DEFINITIONS
 * - id: Unique identifier
 * - displayName: The text label to show on the habit card
 * - keywords: Words to trigger this theme
 * - className: CSS class for styling individual cards
 * - themeColors: Global colors for the app header, background, etc.
 */
export const SEASONAL_THEMES = [
    {
        id: 'cosmere',
        displayName: '⚔️ Cosmere RPG',
        keywords: ['stormlight', 'mistborn', 'radiant', 'allomancy', 'shardblade', 'investiture', 'lashing'],
        className: 'theme-cosmere',
        themeColors: {
            '--theme-primary': '#0ea5e9', // Stormlight Blue
            '--theme-secondary': '#94a3b8', // Mistborn Silver
            '--theme-bg': '#0f172a', // Dark Navy
            '--theme-header-bg': 'linear-gradient(135deg, #0c4a6e, #0ea5e9)',
            '--theme-text': '#e0f2fe'
        }
    },
    {
        id: 'the100',
        displayName: '♾️ The 100',
        keywords: ['survival', 'grounder', 'ark', 'skaikru', 'commander', 'warrior', 'mount weather', 'radiation'],
        className: 'theme-the100',
        themeColors: {
            '--theme-primary': '#4ade80', // Radioactive Green
            '--theme-secondary': '#14532d', // Dark Green
            '--theme-bg': '#020617', // Deep Space
            '--theme-header-bg': 'linear-gradient(135deg, #022c22, #14532d)',
            '--theme-text': '#4ade80'
        }
    },
    {
        id: 'new_year',
        displayName: '🎆 New Year',
        keywords: ['resolution', 'year', 'goal', 'january', 'fresh start', 'declutter', 'review'],
        className: 'theme-new-year',
        themeColors: {
            '--theme-primary': '#fbbf24', // Gold
            '--theme-secondary': '#000000', // Black
            '--theme-bg': '#111827', // Dark Slate
            '--theme-header-bg': 'linear-gradient(135deg, #000000, #1f2937)',
            '--theme-text': '#fbbf24' // Gold text
        }
    },
    {
        id: 'christmas',
        displayName: '🎄 Christmas',
        keywords: ['christmas', 'santa', 'cocoa', 'gift', 'snow', 'reindeer', 'december'],
        className: 'theme-christmas',
        themeColors: {
            '--theme-primary': '#d42426', // Red
            '--theme-secondary': '#f57474ff', // Green
            '--theme-bg': '#f0f7f4', // Snowy white/mint
            '--theme-header-bg': 'linear-gradient(135deg, #d42426, #b9f1b7ff)',
            '--theme-text': '#ffffff'
        }
    },
    {
        id: 'halloween',
        displayName: '🎃 Spooky Season',
        keywords: ['halloween', 'pumpkin', 'spooky', 'ghost', 'witch', 'candy', 'october'],
        className: 'theme-halloween',
        themeColors: {
            '--theme-primary': '#ff6b00', // Orange
            '--theme-secondary': '#4a0e4e', // Purple
            '--theme-bg': '#1a1a1a', // Dark
            '--theme-header-bg': 'linear-gradient(135deg, #ff6b00, #4a0e4e)',
            '--theme-text': '#ffffff'
        }
    },
    {
        id: 'summer',
        displayName: '☀️ Summer Vibes',
        keywords: ['summer', 'beach', 'sun', 'swim', 'ocean', 'vacation', 'july', 'august'],
        className: 'theme-summer',
        themeColors: {
            '--theme-primary': '#00b4d8', // Cyan
            '--theme-secondary': '#ffd60a', // Sun Yellow
            '--theme-bg': '#fffbed', // Warm sandy light
            '--theme-header-bg': 'linear-gradient(135deg, #00b4d8, #ffd60a)',
            '--theme-text': '#003e4d'
        }
    },
    {
        id: 'valentine',
        displayName: '💖 Valentine',
        keywords: ['valentine', 'love', 'heart', 'romance', 'date', 'february'],
        className: 'theme-valentine',
        themeColors: {
            '--theme-primary': '#ff4d6d', // Pink
            '--theme-secondary': '#c9184a', // Deep Red
            '--theme-bg': '#fff0f3', // Light pink
            '--theme-header-bg': 'linear-gradient(135deg, #ff4d6d, #c9184a)',
            '--theme-text': '#ffffff'
        }
    },
    {
        id: 'april_fools',
        displayName: '🤡 Prank Time',
        keywords: ['april fools', 'prank', 'joke', 'clown'],
        className: 'theme-april-fools',
        themeColors: {
            '--theme-primary': '#9b5de5', // Purple
            '--theme-secondary': '#f15bb5', // Pink
            '--theme-bg': '#f0efff',
            '--theme-header-bg': 'linear-gradient(135deg, #9b5de5, #f15bb5)',
            '--theme-text': '#ffffff'
        }
    },
    {
        id: 'spring',
        displayName: '🌸 Spring',
        keywords: ['spring', 'flower', 'bloom', 'garden', 'april', 'may'],
        className: 'theme-spring',
        themeColors: {
            '--theme-primary': '#70e000', // Bright Green
            '--theme-secondary': '#38b000', // Darker Green
            '--theme-bg': '#f7fff7',
            '--theme-header-bg': 'linear-gradient(135deg, #70e000, #38b000)',
            '--theme-text': '#0f4d0f'
        }
    }
];

/**
 * Apply the global theme to the document body.
 */
export const applyGlobalTheme = () => {
    const body = document.body;

    // Reset if null
    if (!CURRENT_SEASON) {
        body.removeAttribute('data-season');
        body.style = ''; // Clear inline vars
        return;
    }

    const theme = SEASONAL_THEMES.find(t => t.id === CURRENT_SEASON);
    if (theme && theme.themeColors) {
        body.setAttribute('data-season', theme.id);
        // Apply CSS variables
        for (const [key, val] of Object.entries(theme.themeColors)) {
            body.style.setProperty(key, val);
        }
    }
};

/**
 * Helper function to determine the theme class for a habit.
 * Returns an object { className, displayName } or null.
 */
export const getSeasonalTheme = (name, category = '') => {
    const n = name.toLowerCase();
    const c = category ? category.toLowerCase() : '';

    for (const theme of SEASONAL_THEMES) {
        // STRICT: If a global season is set, ONLY return that theme.
        // Ignore matches for other seasons to prevent "ghost" styles.
        if (CURRENT_SEASON && theme.id !== CURRENT_SEASON) {
            continue;
        }

        // Check keywords in Name or strict Category match
        const isMatch = theme.keywords.some(k => n.includes(k)) || theme.id === c;

        if (isMatch) {
            return { className: theme.className, displayName: theme.displayName };
        }
    }

    // Generic fallback if no specific theme found
    if (c === 'seasonal') return { className: 'theme-seasonal', displayName: 'Seasonal' };

    return null;
};
