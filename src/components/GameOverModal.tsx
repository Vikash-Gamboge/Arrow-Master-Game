import React, { useState, useEffect } from 'react';
import { HeartCrack, Play, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import {
  showRewardedAd,
  isRewardedAdReady,
  subscribeAdState,
  AdLoadState,
  adMobRewardedService,
} from '../game/adService';
import { sound } from '../game/sound';

interface GameOverModalProps {
  onRestart: () => void;
  onWatchAdSuccess: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  onRestart,
  onWatchAdSuccess,
  onMainMenu,
}) => {
  const [adState, setAdState] = useState<AdLoadState>(() => adMobRewardedService.getAdState());
  const [isRequestingAd, setIsRequestingAd] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Subscribe to AdMob state changes
  useEffect(() => {
    const unsubscribe = subscribeAdState((state) => {
      setAdState(state);
      if (state === 'READY') {
        setErrorMessage(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const hasNativeBridge = adMobRewardedService.isNativeBridgePresent();
  const isReady = isRewardedAdReady();
  const isLoading = adState === 'LOADING' || isRequestingAd;

  const handleWatchAdClick = async () => {
    if (isLoading || isRequestingAd) return;
    sound.playTap();
    setIsRequestingAd(true);
    setErrorMessage(null);

    try {
      const result = await showRewardedAd();
      setIsRequestingAd(false);

      if (result.rewardGranted) {
        sound.playWin();
        // ONLY grant +1 Life after verified AdMob reward callback
        onWatchAdSuccess();
      } else {
        sound.playBump();
        setErrorMessage(
          result.message || 'Rewarded ad could not be completed. You can restart the level freely to continue playing.'
        );
      }
    } catch {
      setIsRequestingAd(false);
      sound.playBump();
      setErrorMessage('Rewarded ad is currently unavailable. Please restart the level to continue.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4 animate-in fade-in duration-200 select-none"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border border-slate-100 flex flex-col items-center animate-in zoom-in-95 duration-150 relative">
        {/* Heartbreak Graphic */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3 ring-8 ring-rose-50/60 shadow-inner">
          <HeartCrack className="w-9 h-9 stroke-[2.2]" />
        </div>

        {/* 1. Clear "OUT OF LIVES!" Heading with Extra Chance Badge */}
        <h3
          id="gameover-title"
          className="text-2xl font-black text-slate-800 tracking-tight mb-0.5 uppercase"
        >
          OUT OF LIVES!
        </h3>
        <span className="inline-block px-3 py-0.5 rounded-full bg-rose-100 text-rose-700 font-black text-[10px] uppercase tracking-wider mb-2">
          EXTRA CHANCE AVAILABLE
        </span>

        {/* 2. Short Explanatory Message */}
        <p className="text-xs font-medium text-slate-500 mb-4 px-2">
          Watch a rewarded ad to get an extra chance (+1 Life) and resume this puzzle, or restart.
        </p>

        {/* Informative Status / Error Feedback Message */}
        {errorMessage && (
          <div
            role="alert"
            className="w-full mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-2 animate-in fade-in text-left"
          >
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        <div className="w-full flex flex-col gap-2.5">
          {/* 3. Primary Button: "WATCH AD & CONTINUE" (+1 Life Extra Chance) */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleWatchAdClick}
            data-testid="watch-ad-continue-btn"
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2.5 touch-manipulation cursor-pointer ${
              isLoading
                ? 'bg-blue-400 text-white cursor-wait shadow-blue-400/20'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-blue-600/30'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ad is loading...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>WATCH AD & CONTINUE (+1 Life)</span>
              </>
            )}
          </button>

          {/* 4. Secondary Button directly below: "RESTART LEVEL" */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              sound.playTap();
              onRestart();
            }}
            data-testid="restart-level-gameover-btn"
            className="w-full py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation border border-slate-200/60"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.4]" />
            <span>RESTART LEVEL</span>
          </button>

          {/* 5. Return Home Link */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              sound.playTap();
              onMainMenu();
            }}
            aria-label="Return to Home Screen"
            className="py-2 text-slate-400 hover:text-slate-600 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation mt-1"
          >
            <span>HOME</span>
          </button>
        </div>
      </div>
    </div>
  );
};
