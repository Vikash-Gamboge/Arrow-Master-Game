/**
 * Unity Ads Centralized Configuration
 * Game: Arrow Master : Puzzle Escape
 * Platform: Android
 *
 * ---------------------------------------------------------------------------------
 * DASHBOARD CONFIGURATION:
 * Android Game ID:        800417555
 * Organization Core ID:  13469992649677 (Reporting/Dashboard reference only)
 *
 * AD UNIT / PLACEMENT IDS:
 * Rewarded:     BP_Rewarded_Android
 * Interstitial: BP_Interstitial_Android
 * ---------------------------------------------------------------------------------
 */

export const UNITY_ADS_CONFIG = {
  // Official Unity Ads Android Game ID
  GAME_ID: '800417555',

  // Organization Core ID (Kept strictly for dashboard/reporting reference, not as Game ID)
  ORGANIZATION_CORE_ID: '13469992649677',

  // Valid Placement IDs from Unity Dashboard (Rewarded & Interstitial only)
  PLACEMENTS: {
    REWARDED: 'BP_Rewarded_Android',
    INTERSTITIAL: 'BP_Interstitial_Android',
  },

  // Test mode flag: true during development/testing
  TEST_MODE: true,

  // Shared Frequency Caps & Cooldowns
  RETRY_DELAY_MS: 3000,
  INTERSTITIAL_COOLDOWN_MS: 90000, // 90 seconds minimum cooldown between interstitials
  LEVELS_BETWEEN_INTERSTITIALS: 2,  // Show interstitial after every 2 completed levels
  MAX_INTERSTITIALS_PER_30_MIN: 5,  // Max 5 forced interstitials in rolling 30-min window
  ROLLING_WINDOW_MS: 30 * 60 * 1000, // 30 minutes in milliseconds
  REWARDED_COOLDOWN_FOR_INTERSTITIAL_MS: 60000, // Do not show interstitial within 60s of a rewarded ad
} as const;

export function isUnityTestMode(): boolean {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_UNITY_ADS_TEST_MODE === 'false') {
    return false;
  }
  return UNITY_ADS_CONFIG.TEST_MODE;
}
