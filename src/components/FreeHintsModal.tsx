import React, { useState, useEffect } from 'react';
import { Lightbulb, Play, X, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import {
  showRewardedAd,
  loadRewardedAd,
  checkRewardedAdReady,
  subscribeToAdState,
  AdLoadState,
  unityAdsService,
} from '../game/adService';
import { sound } from '../game/sound';

interface FreeHintsModalProps {
  onRewardSuccess: () => void;
  onClose: () => void;
}

export const FreeHintsModal: React.FC<FreeHintsModalProps> = ({
  onRewardSuccess,
  onClose,
}) => {
  const [adState, setAdState] = useState<AdLoadState>(() => unityAdsService.getAdState());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAdState((state, lastErr) => {
      setAdState(state);
      if (state === 'READY') {
        setErrorMessage(null);
      } else if (state === 'FAILED' && lastErr) {
        setErrorMessage(`Ad unavailable (${lastErr}). Tap button to retry.`);
      }
    });

    checkRewardedAdReady().then((ready) => {
      if (!ready) {
        loadRewardedAd();
      }
    });

    return () => unsubscribe();
  }, []);

  const isBusy = isLoading || adState === 'LOADING' || adState === 'SHOWING';

  const handleWatchAd = async () => {
    if (isBusy) return;
    sound.playTap();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await showRewardedAd();
      setIsLoading(false);

      if (result.rewardGranted) {
        sound.playWin();
        onRewardSuccess();
      } else {
        sound.playBump();
        setErrorMessage(
          result.message || 'Rewarded ad could not be completed. Please try again.'
        );
      }
    } catch (e: any) {
      setIsLoading(false);
      sound.playBump();
      const raw = e?.message || unityAdsService.getLastError() || 'Unknown error';
      setErrorMessage(`Rewarded ad failed (${raw}). Please try again.`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hints-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/75 p-4 select-none"
    >
      <div className="w-full max-w-xs bg-white rounded-3xl p-6 text-center shadow-2xl border border-slate-100 flex flex-col items-center relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            sound.playTap();
            onClose();
          }}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer touch-manipulation"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Radiant Lightbulb Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3 ring-8 ring-amber-50/70 shadow-inner">
          <Lightbulb className="w-8 h-8 stroke-[2.2]" />
        </div>

        {/* Heading */}
        <h3
          id="hints-modal-title"
          className="text-xl font-black text-slate-800 tracking-tight mb-1 uppercase"
        >
          OUT OF HINTS!
        </h3>

        {/* Description */}
        <p className="text-xs font-medium text-slate-500 mb-4 px-2 leading-relaxed">
          Stuck on this arrow puzzle? Watch a short ad to get <strong className="text-amber-600 font-black">+2 Free Hints</strong>!
        </p>

        {/* Error message */}
        {errorMessage && (
          <div
            role="alert"
            className="w-full mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2 text-left"
          >
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2">
          {/* Watch Ad Button */}
          <button
            type="button"
            disabled={isBusy}
            onClick={handleWatchAd}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation ${
              isBusy
                ? 'bg-amber-400 text-white cursor-wait'
                : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-amber-500/30'
            }`}
          >
            {isBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading advertisement...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>WATCH AD (+2 HINTS)</span>
                <Sparkles className="w-3.5 h-3.5 text-yellow-100" />
              </>
            )}
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer touch-manipulation"
          >
            Keep Trying
          </button>
        </div>
      </div>
    </div>
  );
};
