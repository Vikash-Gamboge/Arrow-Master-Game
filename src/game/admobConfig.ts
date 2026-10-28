/**
 * Google AdMob Centralized Configuration
 * Game: Arrow Master : Puzzle Escape
 * Developer: Vikash Gamboge
 *
 * ---------------------------------------------------------------------------------
 * REAL PRODUCTION REWARDED AD UNIT ID:
 * ca-app-pub-1210044624609081/7094400616
 *
 * OFFICIAL GOOGLE MOBILE ADS TEST AD UNIT IDS (FOR SAFE DEVELOPMENT & POLICY):
 * Rewarded Test ID:     ca-app-pub-3940256099942544/5224354917
 * Interstitial Test ID: ca-app-pub-3940256099942544/1033173712
 * Banner Test ID:       ca-app-pub-3940256099942544/6300978111
 *
 * ADMOB APPLICATION ID:
 * Kept strictly separate from Ad Unit IDs. Configured in AndroidManifest.xml:
 * <meta-data
 *     android:name="com.google.android.gms.ads.APPLICATION_ID"
 *     android:value="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"/>
 * ---------------------------------------------------------------------------------
 */

// Production Configuration: Real AdMob IDs for official Android release builds
export const PRODUCTION_ADMOB_CONFIG = {
  // Real Rewarded Ad Unit ID specified by user
  REWARDED_AD_UNIT_ID: 'ca-app-pub-1210044624609081/7094400616',

  // Production Interstitial Ad Unit ID (configurable via environment variable)
  INTERSTITIAL_AD_UNIT_ID:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMOB_INTERSTITIAL_ID) ||
    'ca-app-pub-1210044624609081/1033173712',

  // Production Banner Ad Unit ID (configurable via environment variable)
  BANNER_AD_UNIT_ID:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMOB_BANNER_ID) ||
    'ca-app-pub-1210044624609081/6300978111',

  // AdMob Application ID configured separately
  APP_ID:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMOB_APP_ID) || '',

  PRELOAD_RETRY_MS: 3000,
} as const;

// Development / Testing Configuration: Official Google Mobile Ads Test Unit IDs
// AdMob Policy Requirement: Never serve or click live ads during development.
export const TEST_ADMOB_CONFIG = {
  REWARDED_AD_UNIT_ID: 'ca-app-pub-3940256099942544/5224354917',
  INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-3940256099942544/1033173712',
  BANNER_AD_UNIT_ID: 'ca-app-pub-3940256099942544/6300978111',
  APP_ID: '',
  PRELOAD_RETRY_MS: 3000,
} as const;

/**
 * Determines whether running in production mode or native Android release.
 */
export function isProductionBuild(): boolean {
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
    return true;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_PRODUCTION_ADS === 'true') {
    return true;
  }
  return false;
}

/**
 * Returns the active AdMob configuration depending on build mode.
 * In production/release builds, uses PRODUCTION_ADMOB_CONFIG with the real Rewarded Ad Unit ID.
 * In development builds, safely uses TEST_ADMOB_CONFIG to comply with Google AdMob self-click policies.
 */
export function getActiveAdMobConfig() {
  return isProductionBuild() ? PRODUCTION_ADMOB_CONFIG : TEST_ADMOB_CONFIG;
}

// Default export mappings for direct access
export const REWARDED_AD_UNIT_ID = PRODUCTION_ADMOB_CONFIG.REWARDED_AD_UNIT_ID;
export const TEST_REWARDED_AD_UNIT_ID = TEST_ADMOB_CONFIG.REWARDED_AD_UNIT_ID;
export const BANNER_AD_UNIT_ID = PRODUCTION_ADMOB_CONFIG.BANNER_AD_UNIT_ID;
export const ADMOB_APP_ID = PRODUCTION_ADMOB_CONFIG.APP_ID;

export const ADMOB_CONFIG = PRODUCTION_ADMOB_CONFIG;
