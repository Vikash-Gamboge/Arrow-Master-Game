import React, { useRef } from 'react';
import { ChevronLeft, Settings, Send, Heart, Info, CheckCircle2 } from 'lucide-react';
import { GoldCoin } from './GoldCoin';
import { GameTheme } from '../game/theme';
import { LevelCompletionStats } from '../game/completionStats';

export type DisplayDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

interface HeaderHUDProps {
  levelNumber: number;
  customTitle?: string;
  customSubtitle?: string;
  difficultyScore?: number;
  remainingArrows: number;
  lives: number;
  maxLives: number;
  coins: number;
  theme: GameTheme;
  completionStats: LevelCompletionStats;
  onBackClick: () => void;
  onSettingsClick: () => void;
  onToggleDebug?: () => void;
}

export function getDifficultyFromScore(score: number = 0, levelNumber: number = 1): DisplayDifficulty {
  if (levelNumber <= 8 && score <= 155) return 'EASY';
  if (levelNumber <= 25 && score <= 275) return 'MEDIUM';
  if (levelNumber <= 60 && score <= 450) return 'HARD';
  if (levelNumber > 60 || score > 450) return 'EXPERT';
  if (levelNumber <= 8) return 'EASY';
  if (levelNumber <= 25) return 'MEDIUM';
  return 'HARD';
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  levelNumber,
  customTitle,
  customSubtitle,
  difficultyScore = 0,
  remainingArrows,
  lives,
  maxLives,
  coins,
  theme,
  completionStats,
  onBackClick,
  onSettingsClick,
  onToggleDebug,
}) => {
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);

  const difficulty = getDifficultyFromScore(difficultyScore, levelNumber);

  const difficultyColors: Record<DisplayDifficulty, { bg: string; text: string; border: string }> = {
    EASY: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    MEDIUM: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    HARD: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    EXPERT: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  };

  const diffStyle = difficultyColors[difficulty];

  const handleLevelClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 450) {
      tapCountRef.current += 1;
      if (tapCountRef.current >= 3) {
        tapCountRef.current = 0;
        onToggleDebug?.();
      }
    } else {
      tapCountRef.current = 1;
    }
    lastTapRef.current = now;
  };

  return (
    <header className="w-full max-w-[420px] mx-auto pt-2 pb-1 px-3.5 flex flex-col items-center select-none">
      {/* 1. TOP ROW: Back button | Level number | Settings button */}
      <div className="w-full flex items-center justify-between mb-1">
        {/* Back Button */}
        <button
          type="button"
          onClick={onBackClick}
          aria-label="Back to Home"
          className="p-2 -ml-2 rounded-full text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer touch-manipulation"
        >
          <ChevronLeft className="w-7 h-7 stroke-[2.6]" style={{ color: theme.primaryColor }} />
        </button>

        {/* Level Number or Mode Title */}
        <button
          type="button"
          onClick={handleLevelClick}
          aria-label={`${customTitle || `Level ${levelNumber}`}, triple-tap for developer debug`}
          className="text-2xl font-black text-slate-900 tracking-tight leading-none hover:opacity-80 transition-opacity cursor-pointer px-2 py-0.5 rounded-lg"
        >
          {customTitle || `Level ${levelNumber}`}
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onSettingsClick}
          aria-label="Open settings"
          className="p-2 -mr-2 rounded-full text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer touch-manipulation"
        >
          <Settings className="w-6 h-6 stroke-[2.2]" style={{ color: theme.primaryColor }} />
        </button>
      </div>

      {/* 2. INFORMATION AREA: Difficulty label directly below the level number */}
      <div className="flex items-center justify-center gap-1.5 mb-1.5">
        {customSubtitle && (
          <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider mr-1">
            {customSubtitle} ·
          </span>
        )}
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Difficulty:
        </span>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${diffStyle.bg} ${diffStyle.text} ${diffStyle.border}`}
        >
          {difficulty}
        </span>
      </div>

      {/* 3. COMPLETION STATISTICS: Real percentage or honest non-fabricated data indicator */}
      <div
        role="status"
        aria-label="Level completion statistics"
        className="w-full max-w-[340px] mb-2 px-2.5 py-1 rounded-xl bg-slate-50/90 border border-slate-200/70 flex items-center justify-center gap-2 shadow-2xs"
      >
        {completionStats.hasRealData && completionStats.percentage !== null ? (
          <>
            {/* Small circular/mini-bar progress indicator */}
            <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex items-center justify-center relative overflow-hidden">
              <div
                className="absolute inset-0 bg-emerald-500 rounded-full"
                style={{ clipPath: `inset(${100 - completionStats.percentage}% 0 0 0)` }}
              />
            </div>
            <span className="text-[11px] font-black text-slate-700">
              {completionStats.percentage}% of players completed this level
            </span>
          </>
        ) : (
          <>
            {completionStats.userHasCompleted ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            )}
            <span className="text-[11px] font-medium text-slate-600 text-center truncate">
              {completionStats.displayMessage}
            </span>
          </>
        )}
      </div>

      {/* 4. Compact Status Row: Remaining Arrows | Lives Hearts | Coins */}
      <div className="w-full flex items-center justify-between gap-2 px-1">
        {/* Remaining arrows count badge */}
        <div
          role="status"
          aria-label={`${remainingArrows} arrows remaining`}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-slate-700 font-bold text-xs shadow-2xs border border-slate-200/70 bg-white"
        >
          <Send className="w-3.5 h-3.5 rotate-45 text-slate-500 fill-slate-400" />
          <span data-testid="remaining-arrows-count" className="font-black">
            {remainingArrows}
          </span>
        </div>

        {/* 3 Lives Hearts with smooth immediate animation */}
        <div
          role="status"
          aria-label={`${lives} of ${maxLives} lives remaining`}
          data-testid="lives-counter"
          className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200/80 shadow-2xs"
        >
          {Array.from({ length: maxLives }).map((_, i) => {
            const isAlive = i < lives;
            return (
              <span
                key={i}
                data-testid={`heart-icon-${i}`}
                className={`transition-all duration-300 transform ${
                  isAlive
                    ? 'scale-100 opacity-100'
                    : 'scale-75 opacity-25 -rotate-12'
                }`}
              >
                <Heart
                  className={`w-5 h-5 transition-all duration-300 ${
                    isAlive
                      ? 'fill-rose-500 text-rose-500 drop-shadow-xs'
                      : 'fill-slate-300 text-slate-300'
                  }`}
                />
              </span>
            );
          })}
        </div>

        {/* Golden Coin Counter Badge */}
        <div
          data-testid="coin-badge"
          role="status"
          aria-label={`${coins.toLocaleString()} coins`}
          className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-b from-amber-50 to-amber-100/95 rounded-full border border-amber-300/80 shadow-2xs"
        >
          <GoldCoin size={15} />
          <span className="font-black text-amber-950 text-xs tracking-tight">
            {coins.toLocaleString()}
          </span>
        </div>
      </div>
    </header>
  );
};
