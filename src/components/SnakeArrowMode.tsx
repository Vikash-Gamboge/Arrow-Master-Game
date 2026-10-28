import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Heart,
  RotateCcw,
  Lightbulb,
  Play,
  Trophy,
  Sparkles,
} from 'lucide-react';
import {
  generateSnakeArrowStage,
  loadHighestSnakeStage,
  saveHighestSnakeStage,
  getSnakeDifficultyLabel,
} from '../game/snakeArrowLogic';
import { ArrowData, checkArrowEscape, getFreeArrows } from '../game/logic';
import { ArrowBoard } from './ArrowBoard';
import { GameTheme } from '../game/theme';
import { sound } from '../game/sound';
import { GameOverModal } from './GameOverModal';
import { FreeHintsModal } from './FreeHintsModal';
import { BannerAd } from './BannerAd';

interface SnakeArrowModeProps {
  theme: GameTheme;
  onBackToHome: () => void;
  onAwardCoins: (coins: number) => void;
}

export const SnakeArrowMode: React.FC<SnakeArrowModeProps> = ({
  theme,
  onBackToHome,
  onAwardCoins,
}) => {
  const [currentStage, setCurrentStage] = useState<number>(() => loadHighestSnakeStage());
  const [lives, setLives] = useState<number>(3);
  const [hintsAvailable, setHintsAvailable] = useState<number>(3);
  const [isStageComplete, setIsStageComplete] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isFreeHintsModalOpen, setIsFreeHintsModalOpen] = useState<boolean>(false);

  const stageData = useMemo(() => generateSnakeArrowStage(currentStage), [currentStage]);
  const [arrows, setArrows] = useState<ArrowData[]>(stageData.arrows);
  const difficultyLabel = useMemo(() => getSnakeDifficultyLabel(currentStage), [currentStage]);

  // Animations
  const [animatingArrowId, setAnimatingArrowId] = useState<string | null>(null);
  const [animatingDirection, setAnimatingDirection] = useState<ArrowData['dir'] | null>(null);
  const [collidingArrowId, setCollidingArrowId] = useState<string | null>(null);
  const [hintedArrowId, setHintedArrowId] = useState<string | null>(null);
  const isResolvingRef = useRef(false);

  const loadStage = useCallback((stage: number) => {
    setCurrentStage(stage);
    saveHighestSnakeStage(stage);
    const data = generateSnakeArrowStage(stage);
    setArrows(data.arrows);
    setLives(3);
    setIsStageComplete(false);
    setIsGameOver(false);
    setAnimatingArrowId(null);
    setCollidingArrowId(null);
    setHintedArrowId(null);
    isResolvingRef.current = false;
  }, []);

  const handleArrowClick = useCallback(
    (arrowId: string) => {
      if (
        isGameOver ||
        isStageComplete ||
        animatingArrowId !== null ||
        collidingArrowId !== null ||
        isResolvingRef.current
      ) {
        return;
      }

      const arrow = arrows.find((a) => a.id === arrowId);
      if (!arrow) return;

      isResolvingRef.current = true;
      if (hintedArrowId === arrowId) setHintedArrowId(null);

      const check = checkArrowEscape(arrowId, arrows);

      if (check.canEscape) {
        sound.playSlide();
        setAnimatingArrowId(arrowId);
        setAnimatingDirection(arrow.dir);

        setTimeout(() => {
          setArrows((prev) => {
            const next = prev.filter((a) => a.id !== arrowId);
            if (next.length === 0) {
              setTimeout(() => {
                sound.playWin();
                onAwardCoins(30);
                saveHighestSnakeStage(currentStage + 1);
                setIsStageComplete(true);
                isResolvingRef.current = false;
              }, 200);
            } else {
              isResolvingRef.current = false;
            }
            return next;
          });
          setAnimatingArrowId(null);
          setAnimatingDirection(null);
        }, 420);
      } else {
        sound.playBump();
        setCollidingArrowId(arrowId);

        setLives((prev) => {
          const next = Math.max(0, prev - 1);
          if (next === 0) {
            setTimeout(() => {
              sound.playGameOver();
              setIsGameOver(true);
              isResolvingRef.current = false;
            }, 300);
          } else {
            sound.playHeartLost();
            setTimeout(() => {
              isResolvingRef.current = false;
            }, 350);
          }
          return next;
        });

        setTimeout(() => {
          setCollidingArrowId(null);
        }, 360);
      }
    },
    [arrows, isGameOver, isStageComplete, animatingArrowId, collidingArrowId, hintedArrowId, currentStage, onAwardCoins]
  );

  const handleUseHint = () => {
    if (arrows.length === 0 || isGameOver || isStageComplete) return;
    if (hintsAvailable <= 0) {
      sound.playTap();
      setIsFreeHintsModalOpen(true);
      return;
    }
    const free = getFreeArrows(arrows);
    if (free.length > 0) {
      sound.playHint();
      setHintedArrowId(free[0].id);
      setHintsAvailable((h) => Math.max(0, h - 1));
    }
  };

  const handleRestart = () => {
    sound.playTap();
    loadStage(currentStage);
  };

  const handleNextStage = () => {
    sound.playTap();
    loadStage(currentStage + 1);
  };

  return (
    <div
      role="region"
      aria-label="Snake Arrow Puzzle Arena"
      className="h-full w-full flex flex-col justify-between p-3 select-none overflow-hidden"
    >
      {/* 1. Top HUD */}
      <header className="shrink-0 flex items-center justify-between pb-2 border-b border-slate-200/80">
        <button
          type="button"
          onClick={() => {
            sound.playTap();
            onBackToHome();
          }}
          aria-label="Back to Home"
          className="p-2 rounded-full bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all text-slate-700 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-black tracking-tight text-slate-900 leading-tight">
              Snake Arrow
            </h2>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span className="text-[11px] font-black text-slate-800">
              Stage {currentStage}
            </span>
            <span
              className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs ${
                difficultyLabel === 'EASY'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : difficultyLabel === 'NORMAL'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : difficultyLabel === 'HARD'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : difficultyLabel === 'VERY HARD'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}
            >
              {difficultyLabel}
            </span>
            <span className="text-[10px] font-bold text-slate-400 tabular-nums">
              · {arrows.length} left
            </span>
          </div>
        </div>

        {/* Lives Counter */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={`snake-life-${i}`}
              className={`w-4 h-4 transition-transform ${
                i < lives
                  ? 'text-rose-500 fill-rose-500 scale-100'
                  : 'text-slate-300 fill-slate-200 scale-90'
              }`}
            />
          ))}
        </div>
      </header>

      {/* 2. Playable Arrow Board */}
      <main className="flex-1 flex items-center justify-center relative w-full my-auto px-1 min-h-0">
        <ArrowBoard
          gridWidth={stageData.gridWidth}
          gridHeight={stageData.gridHeight}
          arrows={arrows}
          animatingArrowId={animatingArrowId}
          animatingDirection={animatingDirection}
          collidingArrowId={collidingArrowId}
          hintedArrowId={hintedArrowId}
          showGridDots={true}
          magnifierActive={false}
          onArrowClick={handleArrowClick}
          theme={theme}
          isSnakeMode={true}
        />
      </main>

      {/* 3. Bottom Controls */}
      <footer className="shrink-0 flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleRestart}
          aria-label="Restart Stage"
          className="flex-1 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2 font-black text-xs uppercase text-slate-700 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>RESTART</span>
        </button>

        <button
          type="button"
          onClick={handleUseHint}
          aria-label="Use Hint"
          className="flex-1 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs hover:bg-amber-100 active:scale-95 transition-all flex items-center justify-center gap-2 font-black text-xs uppercase text-amber-900 cursor-pointer"
        >
          <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span>HINT ({hintsAvailable})</span>
        </button>
      </footer>

      {/* Stage Complete Modal */}
      {isStageComplete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Trophy className="w-8 h-8 fill-emerald-500" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
              STAGE CLEARED!
            </h3>
            <p className="text-xs font-semibold text-slate-500 mb-4">
              All winding snake arrows freed cleanly.
            </p>

            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 mb-5 flex items-center justify-center gap-2 text-emerald-800 font-black text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>+30 Coins Earned!</span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleNextStage}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>NEXT STAGE</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setIsStageComplete(false);
                  onBackToHome();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                BACK TO HOME
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <GameOverModal
          onRestart={handleRestart}
          onWatchAdSuccess={() => {
            sound.playTap();
            setLives(1);
            setIsGameOver(false);
            isResolvingRef.current = false;
          }}
          onMainMenu={() => {
            sound.playTap();
            setIsGameOver(false);
            onBackToHome();
          }}
        />
      )}

      {/* Free Hints Modal */}
      {isFreeHintsModalOpen && (
        <FreeHintsModal
          onRewardSuccess={() => {
            setHintsAvailable((h) => h + 2);
            setIsFreeHintsModalOpen(false);
            const free = getFreeArrows(arrows);
            if (free.length > 0) setHintedArrowId(free[0].id);
          }}
          onClose={() => setIsFreeHintsModalOpen(false)}
        />
      )}
    </div>
  );
};
