import React, { useState, useMemo, useEffect } from 'react';
import {
  Play,
  Settings,
  Gift,
  Palette,
  Edit2,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  Calendar,
  Compass,
  Trophy,
  Lock,
  Star,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { GoldCoin } from './GoldCoin';
import { DailyChallenge3DLogo, SnakeArrow3DLogo } from './FeatureCardLogos';
import {
  AVAILABLE_AVATARS,
  loadDailyRewardState,
  claimDailyReward,
  savePlayerNickname,
  savePlayerAvatar,
} from '../game/playerProfile';
import { sound } from '../game/sound';
import {
  showRewardedAd,
  loadRewardedAd,
  checkRewardedAdReady,
  subscribeToAdState,
  AdLoadState,
  unityAdsService,
} from '../game/adService';
import { getSimplifiedDifficulty } from '../game/completionStats';
import { getMonthCompletedCount } from '../game/dailyChallenge';
import { loadHighestSnakeStage, getSnakeDifficultyLabel } from '../game/snakeArrowLogic';

interface HomeScreenProps {
  coins: number;
  highestLevel: number;
  currentLevelNumber: number;
  playerNickname: string;
  playerAvatar: string;
  onUpdateNickname: (name: string) => void;
  onUpdateAvatar: (avatar: string) => void;
  onPlayArrowPuzzle: (levelToPlay?: number) => void;
  onOpenDailyChallenge: () => void;
  onPlaySnakeArrow: () => void;
  onOpenLevels: () => void;
  onOpenSettings: () => void;
  onOpenThemes?: () => void;
  onClaimDailyCoins: (amount: number) => void;
  isEditingProfile?: boolean;
  onSetIsEditingProfile?: (open: boolean) => void;
  isDailyRewardOpen?: boolean;
  onSetIsDailyRewardOpen?: (open: boolean) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  coins,
  highestLevel,
  currentLevelNumber,
  playerNickname,
  playerAvatar,
  onUpdateNickname,
  onUpdateAvatar,
  onPlayArrowPuzzle,
  onOpenDailyChallenge,
  onPlaySnakeArrow,
  onOpenLevels,
  onOpenSettings,
  onOpenThemes,
  onClaimDailyCoins,
  isEditingProfile: externalIsEditingProfile,
  onSetIsEditingProfile,
  isDailyRewardOpen: externalIsDailyRewardOpen,
  onSetIsDailyRewardOpen,
}) => {
  const [internalIsEditingProfile, setInternalIsEditingProfile] = useState(false);
  const isEditingProfile = externalIsEditingProfile !== undefined ? externalIsEditingProfile : internalIsEditingProfile;
  const setIsEditingProfile = onSetIsEditingProfile || setInternalIsEditingProfile;

  const [editedName, setEditedName] = useState(playerNickname);
  const [selectedAvatar, setSelectedAvatar] = useState(playerAvatar);

  const [internalIsDailyRewardOpen, setInternalIsDailyRewardOpen] = useState(false);
  const isDailyRewardOpen = externalIsDailyRewardOpen !== undefined ? externalIsDailyRewardOpen : internalIsDailyRewardOpen;
  const setIsDailyRewardOpen = onSetIsDailyRewardOpen || setInternalIsDailyRewardOpen;

  const [dailyState, setDailyState] = useState(() => loadDailyRewardState());
  const [adState, setAdState] = useState<AdLoadState>(() => unityAdsService.getAdState());
  const [isAdBonusLoading, setIsAdBonusLoading] = useState(false);
  const [adBonusClaimed, setAdBonusClaimed] = useState(false);
  const [adFeedbackMessage, setAdFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAdState((state, lastErr) => {
      setAdState(state);
      if (state === 'READY') {
        setAdFeedbackMessage(null);
      } else if (state === 'FAILED' && lastErr && isDailyRewardOpen) {
        setAdFeedbackMessage(`Ad unavailable (${lastErr}). Tap button to retry.`);
      }
    });
    return () => unsubscribe();
  }, [isDailyRewardOpen]);

  useEffect(() => {
    if (isDailyRewardOpen) {
      checkRewardedAdReady().then((ready) => {
        if (!ready) {
          loadRewardedAd();
        }
      });
    }
  }, [isDailyRewardOpen]);

  // Stats for active level
  const activeLevel = currentLevelNumber || highestLevel;
  const levelDifficulty = useMemo(() => getSimplifiedDifficulty(activeLevel), [activeLevel]);

  // Daily challenge monthly progress
  const today = useMemo(() => new Date(), []);
  const monthlyChallengeStats = useMemo(() => {
    return getMonthCompletedCount(today.getFullYear(), today.getMonth());
  }, [today]);

  // Snake arrow highest stage & difficulty
  const snakeStage = useMemo(() => loadHighestSnakeStage(), []);
  const snakeDifficulty = useMemo(() => getSnakeDifficultyLabel(snakeStage), [snakeStage]);

  const isAdBusy = isAdBonusLoading || adState === 'LOADING' || adState === 'SHOWING';

  const handleWatchAdBonusCoins = async () => {
    if (isAdBonusLoading || adBonusClaimed || adState === 'SHOWING') return;
    sound.playTap();

    // If ad previously failed, trigger a fresh load first
    if (adState !== 'READY') {
      setIsAdBonusLoading(true);
      setAdFeedbackMessage('Loading advertisement...');
      const loaded = await loadRewardedAd();
      if (!loaded) {
        setIsAdBonusLoading(false);
        const err = unityAdsService.getLastError();
        setAdFeedbackMessage(
          err
            ? `Advertisement unavailable (${err}). Tap to retry.`
            : 'Advertisement unavailable right now. Please check your connection and tap to retry.'
        );
        return;
      }
    }

    setIsAdBonusLoading(true);
    setAdFeedbackMessage(null);

    try {
      const result = await showRewardedAd();
      setIsAdBonusLoading(false);

      if (result.rewardGranted) {
        sound.playDailyClaim();
        onClaimDailyCoins(50);
        setAdBonusClaimed(true);
        setAdFeedbackMessage(null);
        // Allow using the feature again after 3.5 seconds when the next ad is preloaded
        setTimeout(() => {
          setAdBonusClaimed(false);
        }, 3500);
      } else {
        sound.playBump();
        setAdFeedbackMessage(result.message || 'Advertisement could not be completed. Tap to retry.');
      }
    } catch (e: any) {
      setIsAdBonusLoading(false);
      sound.playBump();
      const raw = e?.message || unityAdsService.getLastError() || 'Unknown error';
      setAdFeedbackMessage(`Advertisement failed (${raw}). Tap to retry.`);
    }
  };

  const handleSaveProfile = () => {
    sound.playTap();
    onUpdateNickname(editedName);
    onUpdateAvatar(selectedAvatar);
    savePlayerNickname(editedName);
    savePlayerAvatar(selectedAvatar);
    setIsEditingProfile(false);
  };

  const handleClaimDaily = () => {
    const res = claimDailyReward();
    if (res.coinsAwarded > 0) {
      sound.playDailyClaim();
      onClaimDailyCoins(res.coinsAwarded);
      setDailyState(loadDailyRewardState());
    }
  };

  // Generate a sequence of level nodes around activeLevel
  const levelNodes = useMemo(() => {
    const start = Math.max(1, activeLevel - 2);
    const count = 5;
    const nodes = [];
    for (let i = 0; i < count; i++) {
      const lvl = start + i;
      nodes.push({
        level: lvl,
        isCompleted: lvl < highestLevel,
        isCurrent: lvl === activeLevel,
        isUnlocked: lvl <= highestLevel,
      });
    }
    return nodes;
  }, [activeLevel, highestLevel]);

  return (
    <div
      role="region"
      aria-label="Arrow Master Home Screen"
      className="h-full w-full flex flex-col justify-between p-3 sm:p-4 select-none overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800"
    >
      {/* 1. TOP HEADER: Profile, Coins, Install, Theme, Settings */}
      <header className="shrink-0 flex items-center justify-between gap-1.5 pt-0.5 pb-1">
        {/* Profile Card */}
        <button
          type="button"
          onClick={() => {
            sound.playTap();
            setEditedName(playerNickname);
            setSelectedAvatar(playerAvatar);
            setIsEditingProfile(true);
          }}
          aria-label="Edit Profile"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-sm shadow-2xs">
            <span>{playerAvatar}</span>
          </div>
          <div className="text-left">
            <span className="text-xs font-black text-slate-800 tracking-tight block max-w-[80px] truncate">
              {playerNickname}
            </span>
            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block leading-none">
              Level {highestLevel}
            </span>
          </div>
          <Edit2 className="w-3 h-3 text-slate-400" />
        </button>

        {/* Right side: Coins + Theme + Settings */}
        <div className="flex items-center gap-1.5">
          {/* Coin Balance Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-950 font-black text-xs shadow-2xs">
            <GoldCoin size={14} />
            <span className="tabular-nums">{coins.toLocaleString()}</span>
          </div>

          {/* Theme Palette Button */}
          {onOpenThemes && (
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                onOpenThemes();
              }}
              aria-label="Theme selector"
              className="p-1.5 rounded-full bg-white border border-slate-200 text-purple-600 hover:bg-slate-50 active:scale-95 shadow-2xs transition-all cursor-pointer"
            >
              <Palette className="w-4 h-4" />
            </button>
          )}

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onOpenSettings();
            }}
            aria-label="Open Settings"
            className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 shadow-2xs transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. UPPER SECTION: FEATURE CARDS (Daily Challenge & Snake Arrow Side-by-Side) */}
      <section aria-label="Game Modes" className="shrink-0 grid grid-cols-2 gap-2.5 my-1.5">
        {/* Card 1: Daily Challenge */}
        <button
          type="button"
          onClick={() => {
            sound.playTap();
            onOpenDailyChallenge();
          }}
          className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-50/60 border border-amber-200/90 shadow-2xs hover:shadow-sm hover:border-amber-300 active:scale-98 transition-all flex flex-col justify-between text-left cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between w-full mb-1">
            <DailyChallenge3DLogo className="w-9 h-9 shrink-0" />
            <div className="flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
              <Trophy className="w-3 h-3" />
              <span>
                {monthlyChallengeStats.completed}/{monthlyChallengeStats.totalDays}
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 tracking-tight leading-tight">
              Daily Challenge
            </h3>
            <span className="text-[10px] font-medium text-slate-500 block truncate">
              Solve today's mission
            </span>
          </div>
        </button>

        {/* Card 2: Snake Arrow */}
        <button
          type="button"
          onClick={() => {
            sound.playTap();
            onPlaySnakeArrow();
          }}
          className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50/60 border border-emerald-200/90 shadow-2xs hover:shadow-sm hover:border-emerald-300 active:scale-98 transition-all flex flex-col justify-between text-left cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between w-full mb-1">
            <SnakeArrow3DLogo className="w-9 h-9 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
              Stage {snakeStage} · {snakeDifficulty}
            </span>
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 tracking-tight leading-tight">
              Snake Arrow
            </h3>
            <span className="text-[10px] font-medium text-slate-500 block truncate">
              Winding path labyrinth
            </span>
          </div>
        </button>
      </section>

      {/* 3. CENTER: GAME TITLE (ARROW MASTER / PUZZLE ESCAPE) */}
      <main className="flex-1 flex flex-col items-center justify-center my-auto py-3 px-3 text-center relative">
        {/* Soft background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-radial from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-none drop-shadow-xs">
            ARROW MASTER
          </h1>

          <span className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-blue-600 mt-1.5 drop-shadow-2xs block">
            PUZZLE ESCAPE
          </span>

          <div className="w-16 h-1 bg-gradient-to-r from-blue-500 via-indigo-600 to-amber-400 rounded-full mt-2.5 opacity-90 shadow-xs" />
        </div>
      </main>

      {/* 4. BELOW THE TITLE: LEVEL DIFFICULTY BADGE & PROGRESSION TRACK */}
      <div className="shrink-0 space-y-2 mb-2">
        {/* Level Difficulty Tag */}
        <div className="flex justify-center">
          <span className="px-4 py-1 rounded-full bg-blue-50 text-blue-700 font-extrabold text-xs uppercase tracking-widest border border-blue-200/90 shadow-2xs">
            {levelDifficulty}
          </span>
        </div>

        {/* Level Progression Track */}
        <section
          aria-label="Level Progression"
          className="p-2 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between gap-1.5"
        >
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-1 scrollbar-none w-full justify-between">
            {levelNodes.map((node) => (
              <button
                key={`node-${node.level}`}
                type="button"
                disabled={!node.isUnlocked}
                onClick={() => {
                  if (node.isUnlocked) {
                    sound.playTap();
                    onPlayArrowPuzzle(node.level);
                  }
                }}
                className={`flex-1 min-w-[50px] py-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                  node.isCurrent
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-102 ring-2 ring-blue-400'
                    : node.isCompleted
                    ? 'bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 cursor-pointer'
                    : node.isUnlocked
                    ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer'
                    : 'bg-slate-100/60 text-slate-400 border border-slate-100 cursor-not-allowed opacity-60'
                }`}
              >
                <span className="text-[10px] font-black leading-tight">Lvl {node.level}</span>
                {node.isCompleted ? (
                  <Star className="w-3 h-3 text-amber-500 fill-amber-400 mt-0.5" />
                ) : node.isCurrent ? (
                  <span className="text-[9px] font-extrabold uppercase text-blue-200 mt-0.5">PLAY</span>
                ) : !node.isUnlocked ? (
                  <Lock className="w-3 h-3 text-slate-400 mt-0.5" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />
                )}
              </button>
            ))}
          </div>

          {/* View All Levels shortcut */}
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onOpenLevels();
            }}
            aria-label="View all levels"
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 active:scale-95 transition-all shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>
      </div>

      {/* 5. BOTTOM SECTION: PLAY LEVEL {activeLevel} BUTTON & REWARD BUTTON */}
      <div className="shrink-0 space-y-2">
        <button
          type="button"
          onClick={() => {
            sound.playTap();
            onPlayArrowPuzzle(activeLevel);
          }}
          data-testid="play-arrow-puzzle-btn"
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-base sm:text-lg tracking-wide uppercase shadow-xl shadow-blue-600/35 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-md">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
          <span>PLAY LEVEL {activeLevel}</span>
        </button>

        {/* Daily Reward Button */}
        <button
          type="button"
          onClick={() => {
            sound.playTap();
            setIsDailyRewardOpen(true);
          }}
          className="w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-2xs active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer relative"
        >
          <Gift className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
            CLAIM DAILY REWARD
          </span>
          {dailyState.canClaim && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Player Profile"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/75 p-4"
        >
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                Player Profile
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avatar Picker */}
            <div className="mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Choose Avatar
              </span>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-12 h-12 rounded-2xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                      selectedAvatar === av
                        ? 'bg-blue-100 border-2 border-blue-600 scale-105 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Nickname Input */}
            <div className="mb-5">
              <label
                htmlFor="nickname-input"
                className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5"
              >
                Nickname
              </label>
              <input
                id="nickname-input"
                type="text"
                value={editedName}
                maxLength={14}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter Nickname"
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Reward Modal */}
      {isDailyRewardOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Daily Reward Modal"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/75 p-4"
        >
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Gift className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-1">
              Daily Reward
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Return daily to claim free coins!
            </p>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Day {dailyState.currentStreak} Streak
              </span>
              <div className="flex items-center justify-center gap-2 text-2xl font-black text-amber-600">
                <GoldCoin size={26} />
                <span>+{dailyState.rewardAmounts[dailyState.currentStreak - 1] || 100}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={!dailyState.canClaim}
                onClick={handleClaimDaily}
                className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                  dailyState.canClaim
                    ? 'bg-amber-500 hover:bg-amber-600 active:scale-98 text-white shadow-md shadow-amber-500/25 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {dailyState.canClaim ? 'CLAIM COINS' : 'ALREADY CLAIMED'}
              </button>

              {/* Optional Bonus Coins Rewarded Ad */}
              {adFeedbackMessage && (
                <div
                  role="alert"
                  className="w-full p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center justify-center gap-1.5 text-center"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{adFeedbackMessage}</span>
                </div>
              )}

              {!adBonusClaimed ? (
                <button
                  type="button"
                  disabled={isAdBusy}
                  onClick={handleWatchAdBonusCoins}
                  data-testid="daily-ad-bonus-btn"
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-65 disabled:cursor-wait"
                >
                  {isAdBusy ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading advertisement...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>
                        {adState === 'FAILED'
                          ? 'RETRY AD FOR +50 COINS'
                          : 'WATCH AD FOR +50 COINS'}
                      </span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px] flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+50 Bonus Coins Claimed!</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsDailyRewardOpen(false)}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
