import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PuzzleLevel, ArrowData, checkArrowEscape, getFreeArrows } from './game/logic';
import {
  getLevel,
  inspectLevel,
  loadCurrentLevel,
  saveCurrentLevel,
  loadHighestUnlocked,
  saveHighestUnlocked,
  loadCoins,
  saveCoins,
  loadSoundEnabled,
  saveSoundEnabled,
  loadVibrationEnabled,
  saveVibrationEnabled,
  loadMusicEnabled,
  saveMusicEnabled,
  calculateLevelCoins,
  StorageKeys,
} from './game/levelManager';
import {
  loadPlayerNickname,
  loadPlayerAvatar,
} from './game/playerProfile';
import {
  GameTheme,
  loadSavedTheme,
  saveSelectedTheme,
} from './game/theme';
import {
  getLevelCompletionStats,
  getSimplifiedDifficulty,
  recordLevelStart,
  recordLevelComplete,
} from './game/completionStats';
import { sound } from './game/sound';
import {
  preloadRewardedAd,
  recordLevelCompletedForAds,
  canShowInterstitialAd,
  showInterstitialAd,
} from './game/adService';
import { SplashScreen } from './components/SplashScreen';
import { HomeScreen } from './components/HomeScreen';
import { HeaderHUD } from './components/HeaderHUD';
import { ArrowBoard } from './components/ArrowBoard';
import { BottomControls } from './components/BottomControls';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { GameOverModal } from './components/GameOverModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { SettingsModal } from './components/SettingsModal';
import { ThemeModal } from './components/ThemeModal';
import { FreeHintsModal } from './components/FreeHintsModal';
import { BannerAd } from './components/BannerAd';
import { DebugPanel } from './components/DebugPanel';
import { DailyChallengeScreen } from './components/DailyChallengeScreen';
import { SnakeArrowMode } from './components/SnakeArrowMode';
import { generateDailyMission, markDailyDateCompleted } from './game/dailyChallenge';
import { LegalDocumentViewer, LegalPageType } from './components/legal/LegalDocumentViewer';
import { AlertCircle } from 'lucide-react';

export type ScreenMode = 'splash' | 'home' | 'arrow-puzzle' | 'daily-challenge' | 'snake-arrow';

export default function App() {
  // Screen navigation state
  const [currentScreen, setCurrentScreen] = useState<ScreenMode>('splash');

  // Check URL pathname or search params for direct legal page access (/privacy-policy, /terms, /contact, /about)
  const initialStandaloneLegalPage = useMemo<LegalPageType | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const queryPage = params.get('page')?.toLowerCase();

      if (path.includes('/privacy-policy') || path.includes('/privacy') || queryPage === 'privacy') {
        return 'privacy';
      }
      if (path.includes('/terms') || queryPage === 'terms') {
        return 'terms';
      }
      if (path.includes('/contact') || queryPage === 'contact') {
        return 'contact';
      }
      if (path.includes('/about') || queryPage === 'about') {
        return 'about';
      }
      if (path.includes('/advertising') || queryPage === 'advertising') {
        return 'advertising';
      }
    }
    return null;
  }, []);

  const [activeStandaloneLegal, setActiveStandaloneLegal] = useState<LegalPageType | null>(
    initialStandaloneLegalPage
  );

  // Player profile state
  const [playerNickname, setPlayerNickname] = useState<string>(() => loadPlayerNickname());
  const [playerAvatar, setPlayerAvatar] = useState<string>(() => loadPlayerAvatar());

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<GameTheme>(() => loadSavedTheme());
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Leave level confirmation dialog
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Check URL query parameters for ?level=X or ?debug=1
  const initialLevelNumber = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const lvl = params.get('level');
      if (lvl) {
        const parsed = parseInt(lvl, 10);
        if (!isNaN(parsed) && parsed >= 1) return parsed;
      }
    }
    return loadCurrentLevel();
  }, []);

  const [currentLevelNumber, setCurrentLevelNumber] = useState<number>(initialLevelNumber);
  const [highestUnlocked, setHighestUnlocked] = useState<number>(() => loadHighestUnlocked());
  const [coins, setCoins] = useState<number>(() => loadCoins());
  const [lastEarnedCoins, setLastEarnedCoins] = useState<number>(0);

  // Daily mission date tracking if in daily mission mode
  const [activeDailyDate, setActiveDailyDate] = useState<string | null>(null);

  // Current level definition
  const currentLevel = useMemo(() => {
    if (activeDailyDate) {
      return generateDailyMission(activeDailyDate);
    }
    return getLevel(currentLevelNumber);
  }, [currentLevelNumber, activeDailyDate]);

  const [arrows, setArrows] = useState<ArrowData[]>(currentLevel.arrows);
  const [originalArrows, setOriginalArrows] = useState<ArrowData[]>(currentLevel.arrows);

  const [lives, setLives] = useState<number>(3);
  const [hintsAvailable, setHintsAvailable] = useState<number>(3);
  const [showGridDots, setShowGridDots] = useState<boolean>(true);
  const [magnifierActive, setMagnifierActive] = useState<boolean>(false);

  // Performance tracking for Level Complete stats (Reference Image 1)
  const [levelStartTime, setLevelStartTime] = useState<number>(() => Date.now());
  const [elapsedLevelSeconds, setElapsedLevelSeconds] = useState<number>(0);
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [hintsUsedCount, setHintsUsedCount] = useState<number>(0);

  // Animations
  const [animatingArrowId, setAnimatingArrowId] = useState<string | null>(null);
  const [animatingDirection, setAnimatingDirection] = useState<ArrowData['dir'] | null>(null);
  const [collidingArrowId, setCollidingArrowId] = useState<string | null>(null);
  const [hintedArrowId, setHintedArrowId] = useState<string | null>(null);
  const isResolvingMoveRef = useRef<boolean>(false);

  // Modals & Panels
  const [isLevelComplete, setIsLevelComplete] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isFreeHintsModalOpen, setIsFreeHintsModalOpen] = useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === '1') return true;
      return localStorage.getItem(StorageKeys.DEBUG_MODE) === 'true';
    }
    return false;
  });

  // Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadSoundEnabled());
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(() => loadVibrationEnabled());
  const [musicEnabled, setMusicEnabled] = useState<boolean>(() => loadMusicEnabled());

  // Record level start for statistics & preload Google AdMob Rewarded Ad
  useEffect(() => {
    if (currentScreen === 'arrow-puzzle') {
      if (!activeDailyDate) {
        recordLevelStart(currentLevelNumber);
      }
      preloadRewardedAd();
      setLevelStartTime(Date.now());
      setMistakesCount(0);
      setHintsUsedCount(0);
    }
  }, [currentScreen, currentLevelNumber, activeDailyDate]);

  // Completion stats query
  const completionStats = useMemo(() => {
    return getLevelCompletionStats(currentLevelNumber);
  }, [currentLevelNumber, isLevelComplete]);

  // Sync sound manager effects & music
  useEffect(() => {
    sound.enabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (musicEnabled) {
      sound.startMusic();
    } else {
      sound.stopMusic();
    }
  }, [musicEnabled, currentScreen]);

  // Start background ambient music on first user gesture if music is enabled
  useEffect(() => {
    const handleFirstGesture = () => {
      if (musicEnabled) {
        sound.startMusic();
      }
    };
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });
    window.addEventListener('click', handleFirstGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
    };
  }, [musicEnabled]);

  // Load a level by sequential number
  const switchLevel = useCallback((lvlNumber: number) => {
    const safeNum = Math.max(1, Math.floor(lvlNumber));
    setActiveDailyDate(null);
    setCurrentLevelNumber(safeNum);
    saveCurrentLevel(safeNum);
    recordLevelStart(safeNum);

    if (typeof window !== 'undefined' && window.location.search.includes('level=')) {
      const url = new URL(window.location.href);
      url.searchParams.set('level', safeNum.toString());
      window.history.replaceState({}, '', url.toString());
    }

    const levelData = getLevel(safeNum);
    setArrows(levelData.arrows);
    setOriginalArrows(levelData.arrows);
    setLives(3);
    setLevelStartTime(Date.now());
    setMistakesCount(0);
    setHintsUsedCount(0);
    isResolvingMoveRef.current = false;
    setAnimatingArrowId(null);
    setCollidingArrowId(null);
    setHintedArrowId(null);
    setIsLevelComplete(false);
    setIsGameOver(false);
    setShowLeaveConfirm(false);
  }, []);

  // Launch a Daily Mission
  const startDailyMission = useCallback((dateStr: string) => {
    setActiveDailyDate(dateStr);
    const mission = generateDailyMission(dateStr);
    setArrows(mission.arrows);
    setOriginalArrows(mission.arrows);
    setLives(3);
    setLevelStartTime(Date.now());
    setMistakesCount(0);
    setHintsUsedCount(0);
    isResolvingMoveRef.current = false;
    setAnimatingArrowId(null);
    setCollidingArrowId(null);
    setHintedArrowId(null);
    setIsLevelComplete(false);
    setIsGameOver(false);
    setCurrentScreen('arrow-puzzle');
  }, []);

  // Handle arrow click with strict atomic lock preventing double life deduction
  const handleArrowClick = useCallback(
    (arrowId: string) => {
      if (
        isGameOver ||
        isLevelComplete ||
        animatingArrowId !== null ||
        collidingArrowId !== null ||
        isResolvingMoveRef.current
      ) {
        return;
      }

      const arrow = arrows.find((a) => a.id === arrowId);
      if (!arrow) return;

      isResolvingMoveRef.current = true;

      if (hintedArrowId === arrowId) {
        setHintedArrowId(null);
      }

      const check = checkArrowEscape(arrowId, arrows);

      if (check.canEscape) {
        // SUCCESS: Free path, exit animation along path, no life deducted
        sound.playSlide();
        setAnimatingArrowId(arrowId);
        setAnimatingDirection(arrow.dir);

        setTimeout(() => {
          setArrows((prev) => {
            const next = prev.filter((a) => a.id !== arrowId);

            if (next.length === 0) {
              // LEVEL COMPLETED
              setTimeout(() => {
                sound.playWin();

                // Compute final elapsed seconds
                const totalSeconds = Math.max(1, Math.round((Date.now() - levelStartTime) / 1000));
                setElapsedLevelSeconds(totalSeconds);

                if (activeDailyDate) {
                  markDailyDateCompleted(activeDailyDate);
                } else {
                  recordLevelComplete(currentLevelNumber);
                }
                recordLevelCompletedForAds();

                // Award coins based on level difficulty
                const earned = calculateLevelCoins(currentLevelNumber, currentLevel.difficulty);
                setLastEarnedCoins(earned);
                setCoins((prevCoins) => {
                  const updated = prevCoins + earned;
                  saveCoins(updated);
                  return updated;
                });

                setIsLevelComplete(true);

                // Update sequential progression if classic mode
                if (!activeDailyDate) {
                  const nextLevelNum = currentLevelNumber + 1;
                  const newHighest = Math.max(highestUnlocked, nextLevelNum);
                  setHighestUnlocked(newHighest);
                  saveHighestUnlocked(newHighest);
                }

                // Add bonus hint
                setHintsAvailable((h) => Math.min(5, h + 1));
                isResolvingMoveRef.current = false;
              }, 220);
            } else {
              isResolvingMoveRef.current = false;
            }
            return next;
          });
          setAnimatingArrowId(null);
          setAnimatingDirection(null);
        }, 330);
      } else {
        // COLLISION: exactly 1 life deducted per mistake
        sound.playBump();
        setMistakesCount((m) => m + 1);

        if (vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([40, 30, 40]);
        }

        setCollidingArrowId(arrowId);

        setLives((prevLives) => {
          const nextLives = Math.max(0, prevLives - 1);
          if (nextLives === 0) {
            setTimeout(() => {
              sound.playGameOver();
              setIsGameOver(true);
              isResolvingMoveRef.current = false;
            }, 300);
          } else {
            sound.playHeartLost();
            setTimeout(() => {
              isResolvingMoveRef.current = false;
            }, 360);
          }
          return nextLives;
        });

        setTimeout(() => {
          setCollidingArrowId(null);
        }, 360);
      }
    },
    [
      arrows,
      isGameOver,
      isLevelComplete,
      animatingArrowId,
      collidingArrowId,
      hintedArrowId,
      currentLevelNumber,
      highestUnlocked,
      vibrationEnabled,
      currentLevel.difficulty,
      activeDailyDate,
      levelStartTime,
    ]
  );

  // Use Hint (or offer rewarded ad for free hints when exhausted)
  const handleUseHint = useCallback(() => {
    if (arrows.length === 0 || isGameOver || isLevelComplete) return;

    if (hintsAvailable <= 0) {
      sound.playTap();
      setIsFreeHintsModalOpen(true);
      return;
    }

    const freeArrows = getFreeArrows(arrows);
    if (freeArrows.length === 0) return;

    sound.playHint();
    const chosen = freeArrows[0];
    setHintedArrowId(chosen.id);
    setHintsAvailable((prev) => Math.max(0, prev - 1));
    setHintsUsedCount((h) => h + 1);
  }, [hintsAvailable, arrows, isGameOver, isLevelComplete]);

  // Rewarded Ad completion handler for Free Hints (+2 Hints)
  const handleRewardFreeHints = useCallback(() => {
    setHintsAvailable((prev) => prev + 2);
    setIsFreeHintsModalOpen(false);

    const freeArrows = getFreeArrows(arrows);
    if (freeArrows.length > 0) {
      sound.playHint();
      setHintedArrowId(freeArrows[0].id);
    }
  }, [arrows]);

  // Restart current level: restores 3 lives and resets starting puzzle
  const handleRestart = useCallback(() => {
    sound.playTap();
    if (activeDailyDate) {
      startDailyMission(activeDailyDate);
    } else {
      switchLevel(currentLevelNumber);
    }
  }, [currentLevelNumber, activeDailyDate, switchLevel, startDailyMission]);

  // Watch Ad & Continue: restores exactly 1 life and preserves the current puzzle state
  const handleWatchAdSuccess = useCallback(() => {
    sound.playTap();
    setLives(1);
    setIsGameOver(false);
    isResolvingMoveRef.current = false;
    setCollidingArrowId(null);
    setAnimatingArrowId(null);
  }, []);

  // Advance to next sequential level
  const handleNextLevel = useCallback(() => {
    sound.playTap();
    setIsLevelComplete(false);
    if (canShowInterstitialAd()) {
      showInterstitialAd();
    }
    if (activeDailyDate) {
      setCurrentScreen('daily-challenge');
    } else {
      const nextLvl = currentLevelNumber + 1;
      switchLevel(nextLvl);
    }
  }, [currentLevelNumber, activeDailyDate, switchLevel]);

  // Award coins helper
  const handleAwardCoins = useCallback((amount: number) => {
    if (amount <= 0) return;
    setCoins((prev) => {
      const next = prev + amount;
      saveCoins(next);
      return next;
    });
  }, []);

  // Back button from Arrow Puzzle gameplay screen
  const handleBackFromArrowPuzzle = useCallback(() => {
    sound.playTap();
    const hasStarted = arrows.length < originalArrows.length && !isLevelComplete && !isGameOver;
    if (hasStarted) {
      setShowLeaveConfirm(true);
    } else {
      if (activeDailyDate) {
        setCurrentScreen('daily-challenge');
      } else {
        setCurrentScreen('home');
      }
    }
  }, [arrows.length, originalArrows.length, isLevelComplete, isGameOver, activeDailyDate]);

  // Debug helper: Auto solve step
  const handleAutoSolveStep = useCallback(() => {
    const free = getFreeArrows(arrows);
    if (free.length > 0) {
      handleArrowClick(free[0].id);
    }
  }, [arrows, handleArrowClick]);

  const debugReport = useMemo(() => {
    return inspectLevel(currentLevelNumber).report;
  }, [currentLevelNumber]);

  if (activeStandaloneLegal) {
    return (
      <LegalDocumentViewer
        pageType={activeStandaloneLegal}
        isStandalone={true}
        onBack={() => {
          setActiveStandaloneLegal(null);
          if (typeof window !== 'undefined' && window.history) {
            window.history.replaceState({}, '', window.location.origin);
          }
        }}
        onLaunchGame={() => {
          setActiveStandaloneLegal(null);
          if (typeof window !== 'undefined' && window.history) {
            window.history.replaceState({}, '', window.location.origin);
          }
        }}
      />
    );
  }

  return (
    <div
      data-testid="app-root"
      className={`h-screen w-full ${currentTheme.appBgClass} flex items-center justify-center p-0 sm:p-3 select-none overflow-hidden font-sans transition-colors duration-300`}
    >
      {/* 1. Cinematic Splash Screen */}
      {currentScreen === 'splash' && (
        <SplashScreen onComplete={() => setCurrentScreen('home')} />
      )}

      {/* Main Mobile Frame Container */}
      <div
        className={`w-full sm:max-w-[420px] h-full sm:h-[94vh] sm:max-h-[840px] ${currentTheme.cardBgClass} sm:rounded-[38px] shadow-2xl flex flex-col justify-between relative overflow-hidden sm:ring-4 sm:ring-slate-800/40 transition-colors duration-300`}
      >
        {/* 2. Professional Home Screen (Reference Image 3) */}
        {currentScreen === 'home' && (
          <HomeScreen
            coins={coins}
            highestLevel={highestUnlocked}
            currentLevelNumber={currentLevelNumber}
            playerNickname={playerNickname}
            playerAvatar={playerAvatar}
            onUpdateNickname={setPlayerNickname}
            onUpdateAvatar={setPlayerAvatar}
            onPlayArrowPuzzle={(lvl) => {
              if (lvl) switchLevel(lvl);
              setCurrentScreen('arrow-puzzle');
            }}
            onOpenDailyChallenge={() => setCurrentScreen('daily-challenge')}
            onPlaySnakeArrow={() => setCurrentScreen('snake-arrow')}
            onOpenLevels={() => setIsLevelSelectOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenThemes={() => setIsThemeModalOpen(true)}
            onClaimDailyCoins={handleAwardCoins}
          />
        )}

        {/* 3. Daily Challenge Screen (Reference Image 4) */}
        {currentScreen === 'daily-challenge' && (
          <DailyChallengeScreen
            onBack={() => setCurrentScreen('home')}
            onPlayMission={startDailyMission}
          />
        )}

        {/* 4. Snake Arrow Mode (Winding serpentine puzzles) */}
        {currentScreen === 'snake-arrow' && (
          <SnakeArrowMode
            theme={currentTheme}
            onBackToHome={() => setCurrentScreen('home')}
            onAwardCoins={handleAwardCoins}
          />
        )}

        {/* 5. Classic Arrow Puzzle Mode */}
        {currentScreen === 'arrow-puzzle' && (
          <>
            {/* Top HUD */}
            <div className="shrink-0 pt-1">
              <HeaderHUD
                levelNumber={currentLevelNumber}
                difficultyScore={currentLevel.difficultyScore}
                remainingArrows={arrows.length}
                lives={lives}
                maxLives={3}
                coins={coins}
                theme={currentTheme}
                completionStats={completionStats}
                onBackClick={handleBackFromArrowPuzzle}
                onSettingsClick={() => {
                  sound.playTap();
                  setIsSettingsOpen(true);
                }}
                onToggleDebug={() => setDebugMode((d) => !d)}
              />
            </div>

            {/* Developer Debug HUD Overlay */}
            {debugMode && (
              <DebugPanel
                levelNumber={currentLevelNumber}
                arrows={arrows}
                report={debugReport}
                onClose={() => setDebugMode(false)}
                onJumpToLevel={(lvl) => switchLevel(lvl)}
                onAutoSolveStep={handleAutoSolveStep}
              />
            )}

            {/* Puzzle Area: Playable Arrow Puzzle */}
            <main className="flex-1 flex items-center justify-center relative w-full my-auto px-2 min-h-0">
              <ArrowBoard
                gridWidth={currentLevel.gridWidth}
                gridHeight={currentLevel.gridHeight}
                arrows={arrows}
                animatingArrowId={animatingArrowId}
                animatingDirection={animatingDirection}
                collidingArrowId={collidingArrowId}
                hintedArrowId={hintedArrowId}
                showGridDots={showGridDots}
                magnifierActive={magnifierActive}
                onArrowClick={handleArrowClick}
                shapeOutline={currentLevel.shapeOutline}
                theme={currentTheme}
              />
            </main>

            {/* Bottom Controls */}
            <div className="shrink-0 pb-1">
              <BottomControls
                hintsAvailable={hintsAvailable}
                showGridDots={showGridDots}
                magnifierActive={magnifierActive}
                theme={currentTheme}
                onHintClick={handleUseHint}
                onToggleGrid={() => {
                  sound.playTap();
                  setShowGridDots((prev) => !prev);
                }}
                onToggleMagnifier={() => {
                  sound.playTap();
                  setMagnifierActive((prev) => !prev);
                }}
                onRestartClick={handleRestart}
                onOpenTheme={() => {
                  sound.playTap();
                  setIsThemeModalOpen(true);
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Leave Level Confirmation Dialog */}
      {showLeaveConfirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="leave-level-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-2.5 shadow-inner">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4
              id="leave-level-title"
              className="text-lg font-black text-slate-800 tracking-tight mb-1"
            >
              Leave Level?
            </h4>
            <p className="text-xs text-slate-500 font-medium mb-5">
              Your current puzzle progress will be lost.
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveConfirm(false);
                  if (activeDailyDate) {
                    setCurrentScreen('daily-challenge');
                  } else {
                    setCurrentScreen('home');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase shadow-sm"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Selection Modal */}
      {isThemeModalOpen && (
        <ThemeModal
          currentTheme={currentTheme}
          onSelectTheme={(theme) => {
            setCurrentTheme(theme);
            saveSelectedTheme(theme.id);
          }}
          onClose={() => setIsThemeModalOpen(false)}
        />
      )}

      {/* Level Completed Modal (Arrow Puzzle - Reference Image 1) */}
      {isLevelComplete && (
        <LevelCompleteModal
          levelNumber={currentLevelNumber}
          originalArrows={originalArrows}
          gridWidth={currentLevel.gridWidth}
          gridHeight={currentLevel.gridHeight}
          coinsEarned={lastEarnedCoins}
          difficulty={getSimplifiedDifficulty(currentLevelNumber)}
          elapsedSeconds={elapsedLevelSeconds}
          mistakesCount={mistakesCount}
          hintsCount={hintsUsedCount}
          onNextLevel={handleNextLevel}
          onDoubleCoinsReward={(bonusCoins) => {
            setCoins((prev) => {
              const next = prev + bonusCoins;
              saveCoins(next);
              return next;
            });
          }}
          onReplayCampaign={() => {
            sound.playTap();
            switchLevel(1);
          }}
          onMainMenu={() => {
            sound.playTap();
            setIsLevelComplete(false);
            if (canShowInterstitialAd()) {
              showInterstitialAd();
            }
            if (activeDailyDate) {
              setCurrentScreen('daily-challenge');
            } else {
              setCurrentScreen('home');
            }
          }}
        />
      )}

      {/* Free Hints Rewarded Ad Modal */}
      {isFreeHintsModalOpen && (
        <FreeHintsModal
          onRewardSuccess={handleRewardFreeHints}
          onClose={() => setIsFreeHintsModalOpen(false)}
        />
      )}

      {/* Game Over Modal (Arrow Puzzle) */}
      {isGameOver && (
        <GameOverModal
          onRestart={handleRestart}
          onWatchAdSuccess={handleWatchAdSuccess}
          onMainMenu={() => {
            sound.playTap();
            setIsGameOver(false);
            if (activeDailyDate) {
              setCurrentScreen('daily-challenge');
            } else {
              setCurrentScreen('home');
            }
          }}
        />
      )}

      {/* Level Select Modal */}
      {isLevelSelectOpen && (
        <LevelSelectModal
          currentLevelId={currentLevelNumber}
          highestUnlockedLevel={highestUnlocked}
          onSelectLevel={(id) => {
            sound.playTap();
            switchLevel(id);
            setIsLevelSelectOpen(false);
            setCurrentScreen('arrow-puzzle');
          }}
          onClose={() => setIsLevelSelectOpen(false)}
        />
      )}

      {/* Global Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          soundEnabled={soundEnabled}
          vibrationEnabled={vibrationEnabled}
          musicEnabled={musicEnabled}
          onToggleSound={() => {
            setSoundEnabled((prev) => {
              const next = !prev;
              sound.enabled = next;
              saveSoundEnabled(next);
              return next;
            });
          }}
          onToggleVibration={() => {
            setVibrationEnabled((prev) => {
              const next = !prev;
              saveVibrationEnabled(next);
              if (next && typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(35);
              }
              return next;
            });
          }}
          onToggleMusic={() => {
            setMusicEnabled((prev) => {
              const next = !prev;
              sound.setMusicEnabled(next);
              saveMusicEnabled(next);
              return next;
            });
          }}
          onRestartLevel={handleRestart}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
