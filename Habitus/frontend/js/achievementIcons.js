/**
 * Achievement Icon Mapping
 * Maps achievement codes to their visual icons and styling
 */

export const ACHIEVEMENT_ICONS = {
    // Streak Achievements
    'STREAK_3': { emoji: '🔥', className: 'ach-icon-fire' },
    'STREAK_5': { emoji: '💼', className: 'ach-icon-briefcase' },
    'STREAK_7': { emoji: '🏅', className: 'ach-icon-medal' },
    'STREAK_10': { emoji: '🔟', className: 'ach-icon-ten' },
    'STREAK_14': { emoji: '⚡', className: 'ach-icon-lightning' },
    'STREAK_21': { emoji: '🧠', className: 'ach-icon-brain' },
    'STREAK_30': { emoji: '🌟', className: 'ach-icon-star' },
    'STREAK_40': { emoji: '⛺', className: 'ach-icon-tent' },
    'STREAK_50': { emoji: '🛡️', className: 'ach-icon-shield' },
    'STREAK_60': { emoji: '👩‍🏫', className: 'ach-icon-teacher' },
    'STREAK_75': { emoji: '💎', className: 'ach-icon-diamond' },
    'STREAK_90': { emoji: '🍂', className: 'ach-icon-leaf' },
    'STREAK_100': { emoji: '👑', className: 'ach-icon-crown' },
    'STREAK_200': { emoji: '⚔️', className: 'ach-icon-swords' },
    'STREAK_365': { emoji: '📅', className: 'ach-icon-calendar' },

    // Total Completion Achievements
    'TOTAL_1': { emoji: '🌱', className: 'ach-icon-seedling' },
    'TOTAL_5': { emoji: '✋', className: 'ach-icon-hand' },
    'TOTAL_10': { emoji: '🎉', className: 'ach-icon-party' },
    'TOTAL_25': { emoji: '🚂', className: 'ach-icon-train' },
    'TOTAL_50': { emoji: '🧱', className: 'ach-icon-brick' },
    'TOTAL_75': { emoji: '🏗️', className: 'ach-icon-building' },
    'TOTAL_100': { emoji: '💯', className: 'ach-icon-hundred' },
    'TOTAL_150': { emoji: '🌊', className: 'ach-icon-wave' },
    'TOTAL_250': { emoji: '🤖', className: 'ach-icon-robot' },
    'TOTAL_500': { emoji: '🏰', className: 'ach-icon-castle' },
    'TOTAL_750': { emoji: '🎻', className: 'ach-icon-violin' },
    'TOTAL_1000': { emoji: '🦄', className: 'ach-icon-unicorn' },
    'TOTAL_1500': { emoji: '🐉', className: 'ach-icon-dragon' },
    'TOTAL_2500': { emoji: '🌌', className: 'ach-icon-milkyway' },
    'TOTAL_5000': { emoji: '🪐', className: 'ach-icon-planet' },

    // Seasonal Achievements (The 100 theme)
    'THE_100_SURVIVOR': { emoji: '🌍', className: 'ach-icon-earth' },
    'THE_100_GROUNDER': { emoji: '🗡️', className: 'ach-icon-sword' },
    'THE_100_SKY_PERSON': { emoji: '🚀', className: 'ach-icon-rocket' },
    'THE_100_COMMANDER': { emoji: '⚔️', className: 'ach-icon-crossed-swords' },
    'THE_100_NIGHT_BLOOD': { emoji: '🩸', className: 'ach-icon-blood' },
    'THE_100_PRAIMFAYA': { emoji: '☢️', className: 'ach-icon-radiation' },
};

// Fallback icon for unmapped achievements
const FALLBACK_ICON = { emoji: '⭐', className: 'ach-icon-default' };

/**
 * Get achievement icon by code
 * @param {string} code - Achievement code
 * @returns {Object} Icon object with emoji and className
 */
export function getAchievementIcon(code) {
    return ACHIEVEMENT_ICONS[code] || FALLBACK_ICON;
}

/**
 * Get achievement tier class
 * @param {string} tier - Achievement tier (BRONZE, SILVER, GOLD, MASTER)
 * @returns {string} CSS class for tier styling
 */
export function getTierIconClass(tier) {
    if (!tier) return 'achievement-icon-bronze';
    return `achievement-icon-${tier.toLowerCase()}`;
}
