/**
 * Google Mobile Ads SDK - AdMob Integration Service
 * Game: Arrow Master : Puzzle Escape
 * Developer: Vikash Gamboge
 *
 * ---------------------------------------------------------------------------------
 * GOOGLE MOBILE ADS SDK SPECIFICATION:
 *
 * Production Rewarded Ad Unit ID:
 * ca-app-pub-1210044624609081/7094400616
 *
 * Policy Enforcement:
 * 1. Test unit IDs used strictly during development to avoid policy violation.
 * 2. Production unit ID used strictly in release/production configuration.
 * 3. Rewarded benefits granted ONLY upon verified completion callback.
 * 4. Frequency-capped interstitials at natural break points only (every 3-5 levels, 150s cooldown).
 * 5. Banners placed only in safe non-gameplay areas.
 * ---------------------------------------------------------------------------------
 */

import {
  getActiveAdMobConfig,
  PRODUCTION_ADMOB_CONFIG,
  TEST_ADMOB_CONFIG,
  isProductionBuild,
} from './admobConfig';

export interface RewardedAdResult {
  success: boolean;
  rewardGranted: boolean;
  errorReason?: 'NOT_READY' | 'LOAD_FAILED' | 'USER_DISMISSED' | 'UNAVAILABLE' | 'ALREADY_CLAIMED';
  message: string;
}

export type AdLoadState = 'UNINITIALIZED' | 'LOADING' | 'READY' | 'SHOWING' | 'FAILED' | 'UNAVAILABLE';

// TypeScript declarations for Native Android bridges
declare global {
  interface Window {
    // Official Android WebView JavascriptInterface bridges
    AndroidAdBridge?: {
      initialize?: () => void;
      loadRewardedAd?: (adUnitId: string) => void;
      showRewardedAd?: (adUnitId: string) => void;
      isRewardedAdLoaded?: (adUnitId: string) => boolean;
      loadInterstitialAd?: (adUnitId: string) => void;
      showInterstitialAd?: (adUnitId: string) => void;
      isInterstitialAdLoaded?: (adUnitId: string) => boolean;
      showBanner?: (adUnitId: string, position: string) => void;
      hideBanner?: () => void;
    };
    AndroidAdMob?: {
      initialize?: () => void;
      loadRewardedAd?: (adUnitId: string) => void;
      showRewardedAd?: (adUnitId: string) => void;
      isRewardedAdLoaded?: (adUnitId: string) => boolean;
      loadInterstitialAd?: (adUnitId: string) => void;
      showInterstitialAd?: (adUnitId: string) => void;
      isInterstitialAdLoaded?: (adUnitId: string) => boolean;
      showBanner?: (adUnitId: string, position: string) => void;
      hideBanner?: () => void;
    };
    admob?: {
      initialize?: () => void;
      loadRewardedAd?: (adUnitId: string) => void;
      showRewardedAd?: (adUnitId: string) => void;
      isRewardedAdLoaded?: (adUnitId: string) => boolean;
      loadInterstitialAd?: (adUnitId: string) => void;
      showInterstitialAd?: (adUnitId: string) => void;
      isInterstitialAdLoaded?: (adUnitId: string) => boolean;
      showBanner?: (adUnitId: string, position: string) => void;
      hideBanner?: () => void;
    };
    // Official Capacitor Google Mobile Ads plugin bridge
    Capacitor?: {
      isNativePlatform?: () => boolean;
      Plugins?: {
        AdMob?: {
          initialize?: (options?: { initializeForTesting?: boolean }) => Promise<void>;
          prepareRewardVideoAd?: (options: { adId: string }) => Promise<void>;
          showRewardVideoAd?: () => Promise<{ type: string; amount: number }>;
          prepareInterstitial?: (options: { adId: string }) => Promise<void>;
          showInterstitial?: () => Promise<void>;
          addListener?: (
            eventName: string,
            listener: (info?: any) => void
          ) => Promise<{ remove: () => void }> | { remove: () => void };
          showBanner?: (options: { adId: string; position?: string }) => Promise<void>;
          hideBanner?: () => Promise<void>;
          removeBanner?: () => Promise<void>;
        };
      };
    };
    // Global AdMob reward & lifecycle listeners
    onRewardedAdLoaded?: () => void;
    onRewardedAdFailedToLoad?: (errorMessage: string) => void;
    onUserEarnedReward?: (amount: number, type: string) => void;
    onRewardedAdDismissed?: () => void;
    onRewardedAdShowFailed?: (errorMessage: string) => void;
    onInterstitialAdLoaded?: () => void;
    onInterstitialAdDismissed?: () => void;
    onBannerAdLoaded?: () => void;
    onBannerAdFailedToLoad?: (errorMessage: string) => void;
  }
}

class GoogleMobileAdsService {
  private adState: AdLoadState = 'UNINITIALIZED';
  private hasLoadedAd: boolean = false;
  private isShowingRewarded: boolean = false;
  private isShowingInterstitial: boolean = false;
  private currentRewardClaimed: boolean = false;
  private listeners: Set<(state: AdLoadState) => void> = new Set();
  private isBrowserSimulationReady: boolean = false;

  // Interstitial frequency capping tracking
  private completedLevelsSinceLastAd: number = 0;
  private lastInterstitialTime: number = 0;
  private lastRewardedTime: number = 0;
  private readonly INTERSTITIAL_COOLDOWN_MS = 150000; // 2.5 minutes between interstitials
  private readonly LEVELS_BETWEEN_INTERSTITIALS = 4; // Every 4 completed levels

  constructor() {
    this.initializeMobileAds();
  }

  /**
   * Determine whether running inside a native Android container (Capacitor or WebView bridge)
   */
  public isNativeBridgePresent(): boolean {
    if (typeof window === 'undefined') return false;
    const hasCapacitorAdMob = Boolean(
      window.Capacitor?.Plugins?.AdMob &&
        typeof window.Capacitor.Plugins.AdMob.showRewardVideoAd === 'function'
    );
    const hasAndroidBridge = Boolean(
      (window.AndroidAdBridge && typeof window.AndroidAdBridge.showRewardedAd === 'function') ||
      (window.AndroidAdMob && typeof window.AndroidAdMob.showRewardedAd === 'function') ||
      (window.admob && typeof window.admob.showRewardedAd === 'function')
    );
    return hasCapacitorAdMob || hasAndroidBridge;
  }

  /**
   * Active Rewarded Ad Unit ID:
   * Real production ID in production builds; test ID in development to comply with AdMob policy.
   */
  public getActiveRewardedUnitId(): string {
    const config = getActiveAdMobConfig();
    return config.REWARDED_AD_UNIT_ID;
  }

  /**
   * Active Interstitial Ad Unit ID:
   */
  public getActiveInterstitialUnitId(): string {
    const config = getActiveAdMobConfig();
    return config.INTERSTITIAL_AD_UNIT_ID;
  }

  /**
   * Active Banner Ad Unit ID:
   */
  public getActiveBannerUnitId(): string {
    const config = getActiveAdMobConfig();
    return config.BANNER_AD_UNIT_ID;
  }

  /**
   * Initialize Google Mobile Ads SDK and hook up Android native / Capacitor callbacks
   */
  public initializeMobileAds(): void {
    if (typeof window === 'undefined') return;

    // 1. Hook WebView JavascriptInterface callbacks
    window.onRewardedAdLoaded = () => {
      this.hasLoadedAd = true;
      this.adState = 'READY';
      this.notifyListeners();
    };

    window.onRewardedAdFailedToLoad = () => {
      this.hasLoadedAd = false;
      this.adState = 'FAILED';
      this.notifyListeners();
    };

    window.onRewardedAdDismissed = () => {
      this.isShowingRewarded = false;
      this.hasLoadedAd = false;
      this.adState = 'UNINITIALIZED';
      this.notifyListeners();
      // Auto-preload the next rewarded ad in background
      this.loadRewardedAd();
    };

    window.onRewardedAdShowFailed = () => {
      this.isShowingRewarded = false;
      this.hasLoadedAd = false;
      this.adState = 'FAILED';
      this.notifyListeners();
      this.loadRewardedAd();
    };

    // 2. Initialize native bridges if available
    const bridge = window.AndroidAdBridge || window.AndroidAdMob || window.admob;
    if (bridge && typeof bridge.initialize === 'function') {
      try {
        bridge.initialize();
      } catch {}
    }

    if (window.Capacitor?.Plugins?.AdMob?.initialize) {
      try {
        window.Capacitor.Plugins.AdMob.initialize({
          initializeForTesting: !isProductionBuild(),
        }).catch(() => {});
      } catch {}
    }

    // 3. Trigger initial background ad preload
    this.loadRewardedAd();
    this.loadInterstitialAd();
  }

  /**
   * Subscribe to ad availability state changes
   */
  public subscribe(listener: (state: AdLoadState) => void): () => void {
    this.listeners.add(listener);
    listener(this.adState);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => fn(this.adState));
  }

  /**
   * Load RewardedAd using the configured Rewarded Ad Unit ID
   */
  public loadRewardedAd(): void {
    if (this.adState === 'LOADING' || (this.adState === 'READY' && this.hasLoadedAd)) {
      return;
    }

    const unitId = this.getActiveRewardedUnitId();
    this.adState = 'LOADING';
    this.hasLoadedAd = false;
    this.notifyListeners();

    // 1. Capacitor Google Mobile Ads plugin
    if (window.Capacitor?.Plugins?.AdMob?.prepareRewardVideoAd) {
      window.Capacitor.Plugins.AdMob.prepareRewardVideoAd({
        adId: unitId,
      })
        .then(() => {
          this.hasLoadedAd = true;
          this.adState = 'READY';
          this.notifyListeners();
        })
        .catch(() => {
          this.hasLoadedAd = false;
          this.adState = 'FAILED';
          this.notifyListeners();
        });
      return;
    }

    // 2. Android WebView JavascriptInterface
    const bridge = window.AndroidAdBridge || window.AndroidAdMob || window.admob;
    if (bridge && typeof bridge.loadRewardedAd === 'function') {
      try {
        bridge.loadRewardedAd(unitId);
        return;
      } catch {
        this.adState = 'FAILED';
        this.notifyListeners();
        return;
      }
    }

    // 3. Web Preview / Browser Development:
    setTimeout(() => {
      this.isBrowserSimulationReady = true;
      this.hasLoadedAd = true;
      this.adState = 'READY';
      this.notifyListeners();
    }, 150);
  }

  /**
   * Check whether a rewarded ad is loaded and ready to present
   */
  public isAdReady(): boolean {
    const bridge = window.AndroidAdBridge || window.AndroidAdMob || window.admob;
    if (bridge && typeof bridge.isRewardedAdLoaded === 'function') {
      try {
        return bridge.isRewardedAdLoaded(this.getActiveRewardedUnitId());
      } catch {
        return false;
      }
    }
    return (this.adState === 'READY' && this.hasLoadedAd) || this.isBrowserSimulationReady;
  }

  public getAdState(): AdLoadState {
    return this.adState;
  }

  /**
   * Show RewardedAd:
   * - Strict enforcement: Reward granted ONLY upon confirmed completion callback
   * - Automatically dismisses upon completion
   * - ZERO fake install, download, or app-store CTAs
   */
  public async showRewardedAd(): Promise<RewardedAdResult> {
    if (this.isShowingRewarded) {
      return {
        success: false,
        rewardGranted: false,
        errorReason: 'NOT_READY',
        message: 'Rewarded ad is already currently showing.',
      };
    }

    const hasNativeBridge = this.isNativeBridgePresent();
    const unitId = this.getActiveRewardedUnitId();

    // -------------------------------------------------------------------------
    // A. WEB PREVIEW / BROWSER DEVELOPMENT SIMULATION
    // -------------------------------------------------------------------------
    if (!hasNativeBridge) {
      return new Promise<RewardedAdResult>((resolve) => {
        this.isShowingRewarded = true;
        this.currentRewardClaimed = false;

        const overlay = document.createElement('div');
        overlay.id = 'admob-rewarded-video-overlay';
        overlay.className =
          'fixed inset-0 z-[9999] flex flex-col justify-between bg-slate-950 text-white select-none font-sans animate-in fade-in duration-200';

        overlay.innerHTML = `
          <!-- Top Ad Bar with Countdown and Early-Close (X) -->
          <div class="w-full relative px-4 py-3 flex items-center justify-between bg-slate-900/90 border-b border-slate-800">
            <div class="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-1000 ease-linear w-0" id="admob-progress-bar"></div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded-sm">
                Ad
              </span>
              <span id="admob-timer-label" class="text-xs font-bold text-slate-300 tabular-nums">
                Reward in 3s
              </span>
            </div>
            <button
              id="admob-dismiss-btn"
              type="button"
              aria-label="Close Ad"
              class="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <!-- Video Playback View -->
          <div class="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div class="w-20 h-20 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4 text-blue-400 shadow-xl shadow-blue-500/10">
              <svg class="w-10 h-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-black text-white tracking-tight mb-1">
              Arrow Master : Puzzle Escape
            </h3>
            <p class="text-xs text-slate-400 max-w-xs leading-relaxed" id="admob-status-sub">
              Watching sponsored rewarded video...
            </p>
            <div id="admob-verified-indicator" class="hidden mt-4 items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold animate-in fade-in">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Reward Verified! Returning to game...</span>
            </div>
          </div>

          <div class="w-full py-2.5 px-4 text-center bg-slate-900/60 border-t border-slate-900 text-[10px] text-slate-500 font-medium">
            Google Mobile Ads Rewarded Video
          </div>
        `;

        document.body.appendChild(overlay);

        let countdown = 3;
        let isClosedEarly = false;

        const timerLabel = overlay.querySelector('#admob-timer-label');
        const progressBar = overlay.querySelector('#admob-progress-bar') as HTMLDivElement | null;
        const verifiedIndicator = overlay.querySelector('#admob-verified-indicator');
        const dismissBtn = overlay.querySelector('#admob-dismiss-btn');

        const handleDismissEarly = () => {
          if (isClosedEarly) return;
          isClosedEarly = true;
          clearInterval(interval);
          this.isShowingRewarded = false;
          overlay.remove();
          resolve({
            success: false,
            rewardGranted: false,
            errorReason: 'USER_DISMISSED',
            message: 'Rewarded ad was closed early. No reward earned.',
          });
        };

        if (dismissBtn) {
          dismissBtn.addEventListener('click', handleDismissEarly);
        }

        const interval = setInterval(() => {
          if (isClosedEarly) return;
          countdown -= 1;

          if (progressBar) {
            const percent = Math.min(100, Math.round(((3 - countdown) / 3) * 100));
            progressBar.style.width = `${percent}%`;
          }

          if (timerLabel && countdown > 0) {
            timerLabel.textContent = `Reward in ${countdown}s`;
          }

          if (countdown <= 0) {
            clearInterval(interval);
            this.currentRewardClaimed = true;
            this.lastRewardedTime = Date.now();

            if (typeof window.onUserEarnedReward === 'function') {
              window.onUserEarnedReward(1, 'reward');
            }

            if (timerLabel) {
              timerLabel.textContent = 'Reward Verified';
            }
            if (verifiedIndicator) {
              verifiedIndicator.classList.remove('hidden');
              verifiedIndicator.classList.add('flex');
            }

            setTimeout(() => {
              this.isShowingRewarded = false;
              overlay.remove();
              this.loadRewardedAd();
              resolve({
                success: true,
                rewardGranted: true,
                message: 'Rewarded ad completed. Reward granted.',
              });
            }, 500);
          }
        }, 1000);
      });
    }

    // -------------------------------------------------------------------------
    // B. NATIVE ANDROID ENVIRONMENT (Capacitor or WebView JavascriptInterface)
    // -------------------------------------------------------------------------
    this.isShowingRewarded = true;
    this.currentRewardClaimed = false;

    const capAdMob = window.Capacitor?.Plugins?.AdMob;
    if (capAdMob && typeof capAdMob.showRewardVideoAd === 'function') {
      return new Promise<RewardedAdResult>(async (resolve) => {
        let earnedReward = false;
        let rewardListener: any = null;
        let dismissListener: any = null;

        try {
          if (typeof capAdMob.addListener === 'function') {
            rewardListener = await capAdMob.addListener('rewardVideoReward', () => {
              earnedReward = true;
              this.currentRewardClaimed = true;
              this.lastRewardedTime = Date.now();
              if (typeof window.onUserEarnedReward === 'function') {
                window.onUserEarnedReward(1, 'reward');
              }
            });

            dismissListener = await capAdMob.addListener('rewardVideoDismissed', () => {
              this.isShowingRewarded = false;
              rewardListener?.remove?.();
              dismissListener?.remove?.();
              this.loadRewardedAd();

              if (earnedReward) {
                resolve({
                  success: true,
                  rewardGranted: true,
                  message: 'Rewarded ad completed. Reward granted.',
                });
              } else {
                resolve({
                  success: false,
                  rewardGranted: false,
                  errorReason: 'USER_DISMISSED',
                  message: 'Rewarded ad was closed before completion. No reward was awarded.',
                });
              }
            });
          }

          if (typeof capAdMob.showRewardVideoAd === 'function') {
            await capAdMob.showRewardVideoAd();
          }
        } catch {
          this.isShowingRewarded = false;
          rewardListener?.remove?.();
          dismissListener?.remove?.();
          this.loadRewardedAd();
          resolve({
            success: false,
            rewardGranted: false,
            errorReason: 'LOAD_FAILED',
            message: 'Rewarded ad is currently unavailable. Please try again.',
          });
        }
      });
    }

    // Native Android WebView JavascriptInterface
    const bridge = window.AndroidAdBridge || window.AndroidAdMob || window.admob;
    return new Promise<RewardedAdResult>((resolve) => {
      let earnedReward = false;

      window.onUserEarnedReward = (_amount: number, _type: string) => {
        if (!this.currentRewardClaimed) {
          this.currentRewardClaimed = true;
          this.lastRewardedTime = Date.now();
          earnedReward = true;
        }
      };

      const originalDismissed = window.onRewardedAdDismissed;
      window.onRewardedAdDismissed = () => {
        this.isShowingRewarded = false;
        this.hasLoadedAd = false;
        this.adState = 'UNINITIALIZED';
        this.notifyListeners();
        window.onRewardedAdDismissed = originalDismissed;

        this.loadRewardedAd();

        if (earnedReward) {
          resolve({
            success: true,
            rewardGranted: true,
            message: 'Rewarded ad completed. Reward granted.',
          });
        } else {
          resolve({
            success: false,
            rewardGranted: false,
            errorReason: 'USER_DISMISSED',
            message: 'Rewarded ad was closed before completion. No reward was awarded.',
          });
        }
      };

      const originalShowFailed = window.onRewardedAdShowFailed;
      window.onRewardedAdShowFailed = () => {
        this.isShowingRewarded = false;
        this.hasLoadedAd = false;
        this.adState = 'FAILED';
        this.notifyListeners();
        window.onRewardedAdShowFailed = originalShowFailed;
        this.loadRewardedAd();
        resolve({
          success: false,
          rewardGranted: false,
          errorReason: 'LOAD_FAILED',
          message: 'Rewarded ad is currently unavailable. Please restart to try again.',
        });
      };

      try {
        bridge?.showRewardedAd?.(unitId);
      } catch {
        this.isShowingRewarded = false;
        resolve({
          success: false,
          rewardGranted: false,
          errorReason: 'LOAD_FAILED',
          message: 'Rewarded ad is currently unavailable. Please restart to try again.',
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // INTERSTITIAL AD MANAGEMENT & STRICT FREQUENCY CAPPING
  // ---------------------------------------------------------------------------

  public loadInterstitialAd(): void {
    const unitId = this.getActiveInterstitialUnitId();
    if (window.Capacitor?.Plugins?.AdMob?.prepareInterstitial) {
      window.Capacitor.Plugins.AdMob.prepareInterstitial({ adId: unitId }).catch(() => {});
    } else {
      const bridge = window.AndroidAdBridge || window.AndroidAdMob || window.admob;
      bridge?.loadInterstitialAd?.(unitId);
    }
  }

  /**
   * Tracks a completed normal level for natural interstitial break progression.
   */
  public recordLevelCompleted(): void {
    this.completedLevelsSinceLastAd += 1;
  }

  /**
   * Check whether an interstitial ad is permitted right now based on frequency caps:
   * - Only after several completed levels (every 4 levels)
   * - At least 150 seconds cooldown since last interstitial
   * - At least 120 seconds cooldown since last rewarded ad
   * - Never during active gameplay
   */
  public canShowInterstitial(): boolean {
    const now = Date.now();
    const timeSinceLastInterstitial = now - this.lastInterstitialTime;
    const timeSinceLastRewarded = now - this.lastRewardedTime;

    if (this.completedLevelsSinceLastAd < this.LEVELS_BETWEEN_INTERSTITIALS) {
      return false;
    }
    if (timeSinceLastInterstitial < this.INTERSTITIAL_COOLDOWN_MS) {
      return false;
    }
    if (timeSinceLastRewarded < 120000) {
      return false;
    }
    if (this.isShowingRewarded || this.isShowingInterstitial) {
      return false;
    }
    return true;
  }

  /**
   * Displays an interstitial at a natural break (e.g. returning to Home after level completion)
   */
  public async showInterstitialAd(): Promise<boolean> {
    if (!this.canShowInterstitial()) {
      return false;
    }

    this.isShowingInterstitial = true;
    this.completedLevelsSinceLastAd = 0;
    this.lastInterstitialTime = Date.now();

    const unitId = this.getActiveInterstitialUnitId();

    // 1. Native Capacitor
    if (window.Capacitor?.Plugins?.AdMob?.showInterstitial) {
      try {
        await window.Capacitor.Plugins.AdMob.showInterstitial();
        this.isShowingInterstitial = false;
        this.loadInterstitialAd();
        return true;
      } catch {
        this.isShowingInterstitial = false;
        return false;
      }
    }

    // 2. Native Android WebView bridge
    const bridge = window.AndroidAdBridge || window.AndroidAdMob || window.admob;
    if (bridge && typeof bridge.showInterstitialAd === 'function') {
      try {
        bridge.showInterstitialAd(unitId);
        this.isShowingInterstitial = false;
        return true;
      } catch {
        this.isShowingInterstitial = false;
        return false;
      }
    }

    // In web preview, interstitials are a silent no-op to keep development clean
    this.isShowingInterstitial = false;
    return true;
  }

  // ---------------------------------------------------------------------------
  // BANNER AD MANAGEMENT
  // ---------------------------------------------------------------------------

  public showBanner(position: 'TOP' | 'BOTTOM' = 'BOTTOM'): void {
    const unitId = this.getActiveBannerUnitId();
    const bridge = window.AndroidAdBridge || window.AndroidAdMob || window.admob;
    if (bridge && typeof bridge.showBanner === 'function') {
      try {
        bridge.showBanner(unitId, position);
      } catch {}
    } else if (window.Capacitor?.Plugins?.AdMob?.showBanner) {
      window.Capacitor.Plugins.AdMob.showBanner({
        adId: unitId,
        position,
      }).catch(() => {});
    }
  }

  public hideBanner(): void {
    const bridge = window.AndroidAdBridge || window.AndroidAdMob || window.admob;
    if (bridge && typeof bridge.hideBanner === 'function') {
      try {
        bridge.hideBanner();
      } catch {}
    } else if (window.Capacitor?.Plugins?.AdMob?.hideBanner) {
      window.Capacitor.Plugins.AdMob.hideBanner().catch(() => {});
    }
  }
}

export const adMobRewardedService = new GoogleMobileAdsService();

// Exported convenience wrappers
export const loadRewardedAd = () => adMobRewardedService.loadRewardedAd();
export const preloadRewardedAd = () => adMobRewardedService.loadRewardedAd();
export const isRewardedAdReady = () => adMobRewardedService.isAdReady();
export const showRewardedAd = () => adMobRewardedService.showRewardedAd();
export const subscribeAdState = (listener: (state: AdLoadState) => void) =>
  adMobRewardedService.subscribe(listener);

export const recordLevelCompletedForAds = () => adMobRewardedService.recordLevelCompleted();
export const canShowInterstitialAd = () => adMobRewardedService.canShowInterstitial();
export const showInterstitialAd = () => adMobRewardedService.showInterstitialAd();
export const loadInterstitialAd = () => adMobRewardedService.loadInterstitialAd();
