import React, { useEffect, useState, useMemo } from 'react';
import { Star, Play, Sparkles, CheckCircle2, Home, AlertCircle, Loader2 } from 'lucide-react';
import { ArrowData } from '../game/logic';
import { GoldCoin } from './GoldCoin';
import {
  showRewardedAd,
  loadRewardedAd,
  checkRewardedAdReady,
  subscribeToAdState,
  AdLoadState,
  unityAdsService,
} from '../game/adService';
import { sound } from '../game/sound';

interface LevelCompleteModalProps {
  levelNumber: number;
  originalArrows: ArrowData[];
  gridWidth: number;
  gridHeight: number;
  coinsEarned: number;
  difficulty?: string;
  elapsedSeconds?: number;
  mistakesCount?: number;
  hintsCount?: number;
  isDailyMission?: boolean;
  dailyDateLabel?: string;
  onNextLevel: () => void;
  onMainMenu: () => void;
  onReplayCampaign?: () => void;
  onDoubleCoinsReward?: (bonusCoins: number) => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  levelNumber,
  coinsEarned,
  difficulty = 'MEDIUM',
  elapsedSeconds = 42,
  mistakesCount = 0,
  hintsCount = 0,
  isDailyMission = false,
  dailyDateLabel,
  onNextLevel,
  onMainMenu,
  onReplayCampaign,
  onDoubleCoinsReward,
}) => {
  const [animatedCoins, setAnimatedCoins] = useState(coinsEarned);
  const [isDoubled, setIsDoubled] = useState(false);
  const [adState, setAdState] = useState<AdLoadState>(() => unityAdsService.getAdState());
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [adFeedbackMessage, setAdFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAdState((state) => {
      setAdState(state);
      if (state === 'READY') {
        setAdFeedbackMessage(null);
      }
    });

    checkRewardedAdReady().then((ready) => {
      if (!ready) {
        loadRewardedAd();
      }
    });

    return () => unsubscribe();
  }, []);

  // 3-star calculation based on mistakes
  const starsEarned = mistakesCount === 0 ? 3 : mistakesCount === 1 ? 2 : 1;

  // Format time as MM:SS
  const formattedTime = useMemo(() => {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [elapsedSeconds]);

  // Dynamic calculated score
  const score = useMemo(() => {
    const diffBonus =
      difficulty === 'EXPERT'
        ? 850
        : difficulty === 'HARD'
        ? 600
        : difficulty === 'MEDIUM' || difficulty === 'NORMAL'
        ? 350
        : 150;
    const timeBonus = Math.max(100, 1200 - elapsedSeconds * 12);
    const penalty = mistakesCount * 200 + hintsCount * 50;
    return Math.max(300, Math.round(diffBonus + timeBonus - penalty));
  }, [difficulty, elapsedSeconds, mistakesCount, hintsCount]);

  // Accuracy percentage
  const accuracy = Math.max(40, 100 - mistakesCount * 20);

  useEffect(() => {
    setAnimatedCoins(coinsEarned);
  }, [coinsEarned]);

  const isAdBusy = isAdLoading || adState === 'LOADING' || adState === 'SHOWING';

  const handleDoubleCoins = async () => {
    if (isDoubled || isAdBusy) return;
    sound.playTap();
    setIsAdLoading(true);
    setAdFeedbackMessage(null);

    try {
      const result = await showRewardedAd();
      setIsAdLoading(false);

      if (result.rewardGranted) {
        sound.playWin();
        setIsDoubled(true);
        setAnimatedCoins(coinsEarned * 2);
        onDoubleCoinsReward?.(coinsEarned);
      } else {
        sound.playBump();
        setAdFeedbackMessage(result.message || 'Ad is currently unavailable. You can continue with your normal reward.');
      }
    } catch (e: any) {
      setIsAdLoading(false);
      sound.playBump();
      const raw = e?.message || unityAdsService.getLastError() || 'Unknown error';
      setAdFeedbackMessage(`Ad failed (${raw}). You can continue with your normal reward.`);
    }
  };

  const isFinalCampaignLevel = !isDailyMission && levelNumber === 200;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="well-done-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/75 p-4 select-none"
    >
      <div className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
        {/* 1. THREE STARS RATING HEADER */}
        <div className="flex items-center justify-center gap-2 mb-2 pt-1">
          {/* Star 1 */}
          <div
            className={`transform ${
              starsEarned >= 1 ? 'scale-100 text-amber-400 -rotate-12' : 'scale-90 text-slate-200 -rotate-12'
            }`}
          >
            <Star
              className={`w-9 h-9 ${
                starsEarned >= 1 ? 'fill-amber-400' : 'fill-slate-200'
              }`}
            />
          </div>

          {/* Star 2 (Center, slightly larger) */}
          <div
            className={`transform -translate-y-2 ${
              starsEarned >= 2 ? 'scale-110 text-amber-400' : 'scale-90 text-slate-200'
            }`}
          >
            <Star
              className={`w-12 h-12 ${
                starsEarned >= 2 ? 'fill-amber-400' : 'fill-slate-200'
              }`}
            />
          </div>

          {/* Star 3 */}
          <div
            className={`transform ${
              starsEarned >= 3 ? 'scale-100 text-amber-400 rotate-12' : 'scale-90 text-slate-200 rotate-12'
            }`}
          >
            <Star
              className={`w-9 h-9 ${
                starsEarned >= 3 ? 'fill-amber-400' : 'fill-slate-200'
              }`}
            />
          </div>
        </div>

        {/* 2. "WELL DONE!" Headline */}
        <h2
          id="well-done-title"
          className="text-3xl font-black text-slate-900 tracking-tight mb-1"
        >
          WELL DONE!
        </h2>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-3">
          {isDailyMission
            ? `Daily Challenge ${dailyDateLabel ? `(${dailyDateLabel})` : ''} Completed`
            : `Level ${levelNumber} Completed`}
        </span>

        {/* 3. COINS EARNED BADGE */}
        <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 rounded-full border border-amber-200 mb-4 shadow-2xs">
          <GoldCoin size={20} />
          <span className="text-sm font-black text-amber-950">
            +{animatedCoins.toLocaleString()} Coins
          </span>
          {isDoubled && (
            <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
              2x
            </span>
          )}
        </div>

        {/* 4. PERFORMANCE STATS GRID */}
        <div className="w-full bg-slate-50 rounded-2xl p-3 border border-slate-200 mb-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left">
            {/* Difficulty */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Difficulty
              </span>
              <span className="text-xs font-black text-blue-700 uppercase">
                {difficulty}
              </span>
            </div>

            {/* Time */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Time
              </span>
              <span className="text-xs font-black text-slate-800 tabular-nums">
                {formattedTime}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Score
              </span>
              <span className="text-xs font-black text-amber-700 tabular-nums">
                {score.toLocaleString()}
              </span>
            </div>

            {/* Level / Mode */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isDailyMission ? 'Mode' : 'Level'}
              </span>
              <span className="text-xs font-black text-slate-800 tabular-nums">
                {isDailyMission ? 'Daily' : levelNumber}
              </span>
            </div>

            {/* Accuracy */}
            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Accuracy
              </span>
              <span className="text-xs font-black text-emerald-700 tabular-nums">
                {accuracy}%
              </span>
            </div>

            {/* Mistakes */}
            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Mistakes
              </span>
              <span className="text-xs font-black text-slate-800 tabular-nums">
                {mistakesCount}
              </span>
            </div>
          </div>
        </div>

        {/* Optional Ad Status Message */}
        {adFeedbackMessage && (
          <div
            role="alert"
            className="w-full mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center justify-center gap-1.5 text-center"
          >
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{adFeedbackMessage}</span>
          </div>
        )}

        {/* 5. ACTION BUTTONS */}
        <div className="w-full flex flex-col gap-2">
          {/* Optional 2x Coins Ad Button */}
          {!isDoubled ? (
            <button
              type="button"
              disabled={isAdBusy}
              onClick={handleDoubleCoins}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-amber-950 font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 disabled:opacity-65 disabled:cursor-wait"
            >
              {isAdBusy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading advertisement...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>WATCH AD FOR 2x COINS</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          ) : (
            <div className="w-full py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Coins Doubled! (+{coinsEarned * 2} Total)</span>
            </div>
          )}

          {/* NEXT LEVEL / CONTINUE Primary Button */}
          <button
            type="button"
            onClick={onNextLevel}
            data-testid="next-level-btn"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-base uppercase tracking-wider shadow-xl shadow-blue-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isDailyMission ? 'CONTINUE' : 'NEXT LEVEL'}</span>
          </button>

          {/* HOME Button */}
          <button
            type="button"
            onClick={onMainMenu}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>HOME</span>
          </button>

          {/* Replay campaign if 200 */}
          {isFinalCampaignLevel && onReplayCampaign && (
            <button
              type="button"
              onClick={onReplayCampaign}
              className="py-1 text-slate-400 hover:text-slate-600 font-semibold text-[11px]"
            >
              Replay from Level 1
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
