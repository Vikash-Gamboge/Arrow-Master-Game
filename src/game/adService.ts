/**
 * Unity Ads - Official Native Android Integration Service
 * Game: Arrow Master : Puzzle Escape
 *
 * ---------------------------------------------------------------------------------
 * UNITY DASHBOARD CONFIGURATION:
 * Android Game ID:        800417555
 * Organization Core ID:  13469992649677 (Dashboard reference only)
 *
 * AD UNIT / PLACEMENT IDS (Only Rewarded & Interstitial):
 * Rewarded:     BP_Rewarded_Android
 * Interstitial: BP_Interstitial_Android
 * ---------------------------------------------------------------------------------
 */

import { Capacitor, PluginListenerHandle, registerPlugin } from '@capacitor/core';
import { UNITY_ADS_CONFIG, isUnityTestMode } from './unityAdsConfig';

export interface RewardedAdResult {
  success: boolean;
  rewardGranted: boolean;
  errorReason?: 'NOT_READY' | 'LOAD_FAILED' | 'USER_DISMISSED' | 'SKIPPED' | 'UNAVAILABLE' | 'ALREADY_CLAIMED';
  errorCode?: string;
  message: string;
}

export type AdLoadState = 'UNINITIALIZED' | 'LOADING' | 'READY' | 'SHOWING' | 'FAILED' | 'UNAVAILABLE';

export interface UnityAdsNativePlugin {
  initialize(options: { gameId: string; testMode: boolean }): Promise<{
    success: boolean;
    alreadyInitialized?: boolean;
    inProgress?: boolean;
    sdkVersion?: string;
  }>;
  isInitialized(): Promise<{
    initialized: boolean;
    initializing?: boolean;
    sdkVersion?: string;
    error?: string;
  }>;
  loadAd(options: { placementId: string }): Promise<{
    success: boolean;
    placementId: string;
    resolvedPlacementId?: string;
    alreadyLoaded?: boolean;
    inProgress?: boolean;
  }>;
  isAdLoaded(options: { placementId: string }): Promise<{
    loaded: boolean;
    loading?: boolean;
    initialized?: boolean;
    initializing?: boolean;
    resolvedPlacementId?: string;
    lastError?: string;
  }>;
  showAd(options: { placementId: string }): Promise<{
    placementId: string;
    resolvedPlacementId?: string;
    state: string;
    completed: boolean;
    skipped: boolean;
  }>;
  addListener(
    eventName: 'adLoaded' | 'adLoadFailed' | 'sdkInitialized' | 'sdkInitFailed',
    listenerFunc: (data: any) => void
  ): Promise<PluginListenerHandle>;
}

export const UnityAdsNative = registerPlugin<UnityAdsNativePlugin>('UnityAdsPlugin');

class UnityAdsService {
  private adState: AdLoadState = 'UNINITIALIZED';
  private lastError: string | null = null;
  private isShowingRewarded: boolean = false;
  private isShowingInterstitial: boolean = false;
  private loadRewardedPromise: Promise<boolean> | null = null;
  private loadInterstitialPromise: Promise<boolean> | null = null;
  private listeners: Set<(state: AdLoadState, lastError: string | null) => void> = new Set();

  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  // Shared Interstitial Frequency & Cooldown Tracking
  private completedLevelsSinceLastAd: number = 0;
  private lastInterstitialTime: number = 0;
  private lastRewardedTime: number = 0;
  private recentInterstitialTimestamps: number[] = [];

  constructor() {
    this.setupNativeEventListeners();
    this.initializeUnityAds()
      .then(() => {
        this.loadRewardedAd();
        this.loadInterstitialAd();
      })
      .catch((err) => {
        console.error('[UnityAds] Preload after init failed:', err);
      });
  }

  private setupNativeEventListeners(): void {
    if (!this.isNativeBridgePresent()) return;

    try {
      UnityAdsNative.addListener('adLoaded', (data: { placementId?: string; resolvedPlacementId?: string }) => {
        const rewardedId = this.getRewardedPlacement();
        if (
          data?.placementId === rewardedId ||
          data?.resolvedPlacementId === rewardedId
        ) {
          console.log('[UnityAds] Native adLoaded event received for Rewarded Ad:', data);
          this.lastError = null;
          if (!this.isShowingRewarded) {
            this.setAdState('READY');
          }
        }
      }).catch(() => {});

      UnityAdsNative.addListener(
        'adLoadFailed',
        (data: { placementId?: string; errorCode?: string; message?: string }) => {
          const rewardedId = this.getRewardedPlacement();
          if (data?.placementId === rewardedId) {
            const detail = data.errorCode ? `[${data.errorCode}] ${data.message || ''}`.trim() : data.message || 'Load failed';
            console.error('[UnityAds] Native adLoadFailed event received for Rewarded Ad:', detail);
            this.lastError = detail;
            if (!this.isShowingRewarded) {
              this.setAdState('FAILED');
            }
          }
        }
      ).catch(() => {});

      UnityAdsNative.addListener(
        'sdkInitFailed',
        (data: { errorCode?: string; message?: string }) => {
          const detail = data?.errorCode ? `[${data.errorCode}] ${data.message || ''}`.trim() : data?.message || 'SDK init failed';
          console.error('[UnityAds] Native sdkInitFailed event received:', detail);
          this.lastError = detail;
          this.setAdState('FAILED');
        }
      ).catch(() => {});
    } catch (e) {
      console.warn('[UnityAds] Could not attach native event listeners:', e);
    }
  }

  public isNativeBridgePresent(): boolean {
    if (typeof window === 'undefined') return false;
    return Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android';
  }

  public getGameId(): string {
    return UNITY_ADS_CONFIG.GAME_ID;
  }

  public getRewardedPlacement(): string {
    return UNITY_ADS_CONFIG.PLACEMENTS.REWARDED;
  }

  public getInterstitialPlacement(): string {
    return UNITY_ADS_CONFIG.PLACEMENTS.INTERSTITIAL;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  /**
   * Step 1 & 2: Initialize Unity Ads and wait for the official SDK initialization callback.
   */
  public async initializeUnityAds(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (!this.isNativeBridgePresent()) {
        console.log('[UnityAds] Web preview detected - Native Unity Ads active on Android device.');
        this.isInitialized = true;
        this.setAdState('UNAVAILABLE');
        return;
      }

      try {
        this.setAdState('LOADING');
        const testMode = isUnityTestMode();
        console.log(
          `[UnityAds] Step 1: Initializing native Unity Ads SDK with Game ID: ${UNITY_ADS_CONFIG.GAME_ID}, testMode: ${testMode}`
        );

        const result = await UnityAdsNative.initialize({
          gameId: UNITY_ADS_CONFIG.GAME_ID,
          testMode,
        });

        this.isInitialized = Boolean(result && result.success);
        this.lastError = null;
        console.log('[UnityAds] Step 2: Unity Ads SDK initialization callback succeeded:', result);
      } catch (err: any) {
        const rawErr = err?.message || String(err);
        console.error('[UnityAds] Native initialization failed:', rawErr);
        this.lastError = rawErr;
        this.initPromise = null;
        this.setAdState('FAILED');
        throw err;
      }
    })();

    return this.initPromise;
  }

  /**
   * Step 3 & 4: Request the Rewarded Ad and wait for the actual ad load success callback.
   * Deduplicates concurrent calls via a shared promise.
   */
  public async loadRewardedAd(): Promise<boolean> {
    if (!this.isNativeBridgePresent()) {
      return false;
    }

    if (this.loadRewardedPromise) {
      return this.loadRewardedPromise;
    }

    this.loadRewardedPromise = (async () => {
      try {
        await this.initializeUnityAds();
        const placementId = this.getRewardedPlacement();

        const currentStatus = await UnityAdsNative.isAdLoaded({ placementId }).catch(() => ({
          loaded: false,
          loading: false,
          lastError: undefined,
        }));

        if (currentStatus && currentStatus.loaded) {
          this.lastError = null;
          this.setAdState('READY');
          return true;
        }

        this.setAdState('LOADING');
        console.log('[UnityAds] Step 3: Requesting Rewarded Ad for placement:', placementId);

        const res = await UnityAdsNative.loadAd({ placementId });

        if (res && res.success) {
          console.log('[UnityAds] Step 4: Rewarded Ad load success callback received:', res);
          this.lastError = null;
          this.setAdState('READY');
          return true;
        }

        const fallbackStatus = await UnityAdsNative.isAdLoaded({ placementId }).catch(() => ({
          loaded: false,
          lastError: 'Ad load returned unsuccessful response',
        }));
        this.lastError = fallbackStatus.lastError || 'Rewarded Ad failed to load.';
        console.error('[UnityAds] Rewarded Ad failed to load:', this.lastError);
        this.setAdState('FAILED');
        return false;
      } catch (err: any) {
        const rawErr = err?.message || String(err);
        console.error('[UnityAds] loadRewardedAd failed with Unity error:', rawErr);
        this.lastError = rawErr;
        this.setAdState('FAILED');
        return false;
      } finally {
        this.loadRewardedPromise = null;
      }
    })();

    return this.loadRewardedPromise;
  }

  /**
   * Synchronize JS state with native plugin readiness
   */
  public async checkRewardedAdReady(): Promise<boolean> {
    if (!this.isNativeBridgePresent()) return false;
    try {
      const placementId = this.getRewardedPlacement();
      const res = await UnityAdsNative.isAdLoaded({ placementId });
      if (res && res.loaded) {
        this.lastError = null;
        this.setAdState('READY');
        return true;
      }
      if (res && res.loading) {
        this.setAdState('LOADING');
        this.loadRewardedAd();
        return false;
      }
      if (res && res.lastError) {
        this.lastError = res.lastError;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Step 6, 7, 8:
   * - Show the ad when the player taps the button.
   * - Grant reward (+50 coins / +1 life / +2 hints / 2x coins) ONLY after official reward-completion callback.
   * - Load the next Rewarded Ad after the previous ad finishes or fails.
   */
  public async showRewardedAd(): Promise<RewardedAdResult> {
    if (this.isShowingRewarded) {
      return {
        success: false,
        rewardGranted: false,
        errorReason: 'ALREADY_CLAIMED',
        message: 'An advertisement is already displaying.',
      };
    }

    if (!this.isNativeBridgePresent()) {
      console.warn('[UnityAds] Native bridge not present (Running in Web Browser).');
      return {
        success: false,
        rewardGranted: false,
        errorReason: 'UNAVAILABLE',
        message: 'Unity Ads are only available in the native Android application.',
      };
    }

    try {
      await this.initializeUnityAds();
      const placementId = this.getRewardedPlacement();

      // Verify ad readiness before requesting show
      let status = await UnityAdsNative.isAdLoaded({ placementId }).catch(() => ({
        loaded: false,
        loading: false,
        lastError: undefined,
      }));

      // If not ready yet, await loadRewardedAd() up to 8.5 seconds so an in-flight load can finish cleanly
      if (!status || !status.loaded) {
        console.log('[UnityAds] Rewarded ad not ready yet; awaiting load completion...');
        this.setAdState('LOADING');

        const loadedInTime = await Promise.race<boolean>([
          this.loadRewardedAd(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 8500)),
        ]);

        if (loadedInTime) {
          status = { loaded: true, loading: false, lastError: undefined };
        } else {
          status = await UnityAdsNative.isAdLoaded({ placementId }).catch(() => ({
            loaded: false,
            loading: false,
            lastError: this.lastError || undefined,
          }));
        }
      }

      if (!status || !status.loaded) {
        const detailedReason = status?.lastError || this.lastError;
        console.error('[UnityAds] Rewarded ad unavailable after waiting. Error:', detailedReason || 'Timeout');
        setTimeout(() => this.loadRewardedAd(), 1500);

        if (status?.loading) {
          return {
            success: false,
            rewardGranted: false,
            errorReason: 'NOT_READY',
            message: 'Loading advertisement... Please wait a moment and tap again.',
          };
        }

        return {
          success: false,
          rewardGranted: false,
          errorReason: 'LOAD_FAILED',
          errorCode: detailedReason || 'UNAVAILABLE',
          message: detailedReason
            ? `Advertisement unavailable (${detailedReason}). Tap to retry.`
            : 'Advertisement unavailable right now. Please check your connection and tap to retry.',
        };
      }

      this.isShowingRewarded = true;
      this.setAdState('SHOWING');
      console.log('[UnityAds] Step 6: Showing Rewarded Ad for placement:', placementId);

      const showResult = await UnityAdsNative.showAd({ placementId });
      console.log('[UnityAds] Show callback received:', showResult);

      this.isShowingRewarded = false;
      this.lastRewardedTime = Date.now();

      // Step 7: Grant reward ONLY after official COMPLETED callback
      if (showResult && showResult.completed) {
        console.log('[UnityAds] Step 7: Verified COMPLETED reward callback from official Unity Ads SDK.');
        this.lastError = null;
        this.setAdState('LOADING');
        // Step 8: Reload the next Rewarded Ad
        setTimeout(() => this.loadRewardedAd(), 600);

        return {
          success: true,
          rewardGranted: true,
          message: 'Reward verified and granted!',
        };
      }

      if (showResult && showResult.skipped) {
        console.warn('[UnityAds] Ad was skipped by user before completion. No reward granted.');
        this.setAdState('LOADING');
        setTimeout(() => this.loadRewardedAd(), 600);

        return {
          success: true,
          rewardGranted: false,
          errorReason: 'SKIPPED',
          message: 'Advertisement was skipped before completion. Watch the full ad to earn the reward.',
        };
      }

      this.setAdState('LOADING');
      setTimeout(() => this.loadRewardedAd(), 1000);
      return {
        success: false,
        rewardGranted: false,
        errorReason: 'USER_DISMISSED',
        message: 'Advertisement closed before completion.',
      };
    } catch (err: any) {
      const rawMsg = err?.message || String(err);
      console.error('[UnityAds] showRewardedAd failed with Unity error:', rawMsg);
      this.isShowingRewarded = false;
      this.lastError = rawMsg;
      this.setAdState('FAILED');

      // Step 8: Reload the next Rewarded Ad after failure
      setTimeout(() => this.loadRewardedAd(), UNITY_ADS_CONFIG.RETRY_DELAY_MS);

      return {
        success: false,
        rewardGranted: false,
        errorReason: 'LOAD_FAILED',
        errorCode: rawMsg,
        message: `Advertisement failed (${rawMsg}). Tap to retry.`,
      };
    }
  }

  /**
   * Load Interstitial Ad using official native Unity Ads SDK
   */
  public async loadInterstitialAd(): Promise<boolean> {
    if (!this.isNativeBridgePresent()) return false;
    if (this.loadInterstitialPromise) return this.loadInterstitialPromise;

    this.loadInterstitialPromise = (async () => {
      try {
        await this.initializeUnityAds();
        const placementId = this.getInterstitialPlacement();
        const currentStatus = await UnityAdsNative.isAdLoaded({ placementId }).catch(() => ({ loaded: false }));
        if (currentStatus && currentStatus.loaded) {
          return true;
        }

        console.log('[UnityAds] Loading Interstitial Ad placement:', placementId);
        const res = await UnityAdsNative.loadAd({ placementId });
        return Boolean(res && res.success);
      } catch (err) {
        console.warn('[UnityAds] loadInterstitialAd error:', err);
        return false;
      } finally {
        this.loadInterstitialPromise = null;
      }
    })();

    return this.loadInterstitialPromise;
  }

  public canShowInterstitial(): boolean {
    if (!this.isNativeBridgePresent()) return false;
    if (this.isShowingInterstitial || this.isShowingRewarded) return false;

    const now = Date.now();

    const timeSinceLastInterstitial = now - this.lastInterstitialTime;
    if (timeSinceLastInterstitial < UNITY_ADS_CONFIG.INTERSTITIAL_COOLDOWN_MS) {
      return false;
    }

    const timeSinceLastRewarded = now - this.lastRewardedTime;
    if (timeSinceLastRewarded < UNITY_ADS_CONFIG.REWARDED_COOLDOWN_FOR_INTERSTITIAL_MS) {
      return false;
    }

    const windowStart = now - UNITY_ADS_CONFIG.ROLLING_WINDOW_MS;
    this.recentInterstitialTimestamps = this.recentInterstitialTimestamps.filter((t) => t > windowStart);
    if (this.recentInterstitialTimestamps.length >= UNITY_ADS_CONFIG.MAX_INTERSTITIALS_PER_30_MIN) {
      return false;
    }

    return this.completedLevelsSinceLastAd >= UNITY_ADS_CONFIG.LEVELS_BETWEEN_INTERSTITIALS;
  }

  public recordLevelCompleted(): void {
    this.completedLevelsSinceLastAd += 1;
  }

  public async showInterstitialAd(): Promise<boolean> {
    if (this.isShowingInterstitial || this.isShowingRewarded) return false;
    if (!this.isNativeBridgePresent()) return false;

    try {
      await this.initializeUnityAds();
      const placementId = this.getInterstitialPlacement();

      const status = await UnityAdsNative.isAdLoaded({ placementId }).catch(() => ({ loaded: false }));
      if (!status || !status.loaded) {
        this.loadInterstitialAd();
        return false;
      }

      this.isShowingInterstitial = true;
      console.log('[UnityAds] Showing Interstitial Ad:', placementId);

      const res = await UnityAdsNative.showAd({ placementId });
      const now = Date.now();
      this.lastInterstitialTime = now;
      this.recentInterstitialTimestamps.push(now);
      this.completedLevelsSinceLastAd = 0;
      this.isShowingInterstitial = false;

      setTimeout(() => this.loadInterstitialAd(), 1000);
      return Boolean(res && res.completed);
    } catch (err) {
      console.warn('[UnityAds] showInterstitialAd error:', err);
      this.isShowingInterstitial = false;
      setTimeout(() => this.loadInterstitialAd(), UNITY_ADS_CONFIG.RETRY_DELAY_MS);
      return false;
    }
  }

  public getAdState(): AdLoadState {
    return this.adState;
  }

  public isAdReady(): boolean {
    return this.adState === 'READY';
  }

  public subscribe(listener: (state: AdLoadState, lastError: string | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.adState, this.lastError);
    return () => this.listeners.delete(listener);
  }

  private setAdState(state: AdLoadState) {
    this.adState = state;
    this.listeners.forEach((l) => l(state, this.lastError));
  }
}

export const unityAdsService = new UnityAdsService();

export const loadRewardedAd = () => unityAdsService.loadRewardedAd();
export const preloadRewardedAd = () => unityAdsService.loadRewardedAd();
export const isRewardedAdReady = () => unityAdsService.isAdReady();
export const checkRewardedAdReady = () => unityAdsService.checkRewardedAdReady();
export const showRewardedAd = () => unityAdsService.showRewardedAd();
export const subscribeToAdState = (listener: (state: AdLoadState, lastError?: string | null) => void) =>
  unityAdsService.subscribe(listener);
export const recordLevelCompletedForAds = () => unityAdsService.recordLevelCompleted();
export const canShowInterstitialAd = () => unityAdsService.canShowInterstitial();
export const showInterstitialAd = () => unityAdsService.showInterstitialAd();
export const loadInterstitialAd = () => unityAdsService.loadInterstitialAd();
