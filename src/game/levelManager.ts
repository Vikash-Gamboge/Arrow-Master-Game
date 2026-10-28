import { PuzzleLevel } from './logic';
import { generateLevel } from './generator';
import { validateLevel, ValidationReport } from './validator';

export interface LevelMetadata {
  levelNumber: number;
  level: PuzzleLevel;
  report: ValidationReport;
}

// In-memory cache to ensure instant loading of previously generated levels
const levelCache = new Map<number, PuzzleLevel>();

/**
 * Retrieves Level N deterministically.
 * Every level from 1 to 200+ is generated using seeded deterministic generation.
 * Level progression is strictly sequential: Level 1 -> Level 2 -> Level 3 ...
 */
export function getLevel(levelNumber: number): PuzzleLevel {
  const safeNumber = Math.max(1, Math.floor(levelNumber));
  let level = levelCache.get(safeNumber);
  if (!level) {
    level = generateLevel(safeNumber);
    levelCache.set(safeNumber, level);
  }

  // Always return fresh clones of arrow objects so gameplay doesn't mutate cached originals
  return {
    ...level,
    arrows: level.arrows.map((a) => ({
      ...a,
      points: a.points.map((p) => ({ ...p })),
    })),
  };
}

/**
 * Validates level and returns complete debug inspection data
 */
export function inspectLevel(levelNumber: number): LevelMetadata {
  const level = getLevel(levelNumber);
  const report = validateLevel(level.arrows, level.gridWidth, level.gridHeight);
  return {
    levelNumber,
    level,
    report,
  };
}

/**
 * Storage helpers for persistent progression
 */
export const StorageKeys = {
  CURRENT_LEVEL: 'arrow_puzzle_current_level',
  HIGHEST_UNLOCKED: 'arrow_puzzle_highest_unlocked',
  COINS: 'arrow_puzzle_coins',
  SOUND_ENABLED: 'arrow_puzzle_sound_enabled',
  VIBRATION_ENABLED: 'arrow_puzzle_vibration_enabled',
  MUSIC_ENABLED: 'arrow_puzzle_music_enabled',
  HAPTICS_ENABLED: 'arrow_puzzle_vibration_enabled',
  DEBUG_MODE: 'arrow_puzzle_debug_mode',
};

export function loadSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(StorageKeys.SOUND_ENABLED) !== 'false';
  } catch {
    return true;
  }
}

export function saveSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(StorageKeys.SOUND_ENABLED, enabled.toString());
  } catch {}
}

export function loadVibrationEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(StorageKeys.VIBRATION_ENABLED) !== 'false';
  } catch {
    return true;
  }
}

export function saveVibrationEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(StorageKeys.VIBRATION_ENABLED, enabled.toString());
  } catch {}
}

export function loadMusicEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(StorageKeys.MUSIC_ENABLED) !== 'false';
  } catch {
    return true;
  }
}

export function saveMusicEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(StorageKeys.MUSIC_ENABLED, enabled.toString());
  } catch {}
}

export function loadCoins(): number {
  if (typeof window === 'undefined') return 250;
  try {
    const saved = localStorage.getItem(StorageKeys.COINS);
    const parsed = saved ? parseInt(saved, 10) : 250;
    return isNaN(parsed) || parsed < 0 ? 250 : parsed;
  } catch {
    return 250;
  }
}

export function saveCoins(amount: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(StorageKeys.COINS, Math.max(0, Math.floor(amount)).toString());
  } catch {}
}

/**
 * Calculates coin reward based on level number and difficulty tier.
 * Progressive scaling ensures harder levels give increasingly large rewards.
 */
export function calculateLevelCoins(levelNumber: number, difficulty: string): number {
  const lvl = Math.max(1, levelNumber);
  if (lvl <= 10) {
    // Beginner: 50 - 100 coins
    return 50 + lvl * 5;
  } else if (lvl <= 25) {
    // Easy: 100 - 220 coins
    return 100 + (lvl - 10) * 8;
  } else if (lvl <= 50) {
    // Medium: 220 - 470 coins
    return 220 + (lvl - 25) * 10;
  } else if (lvl <= 100) {
    // Hard: 470 - 1070 coins
    return 470 + (lvl - 50) * 12;
  } else if (lvl <= 200) {
    // Expert: 1070 - 2570 coins
    return 1070 + (lvl - 100) * 15;
  } else {
    // Master: 2500+ coins
    return 2500 + (lvl - 200) * 20;
  }
}

export function loadCurrentLevel(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const saved = localStorage.getItem(StorageKeys.CURRENT_LEVEL);
    const parsed = saved ? parseInt(saved, 10) : 1;
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  } catch {
    return 1;
  }
}

export function saveCurrentLevel(level: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(StorageKeys.CURRENT_LEVEL, level.toString());
  } catch {}
}

export function loadHighestUnlocked(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const saved = localStorage.getItem(StorageKeys.HIGHEST_UNLOCKED);
    const parsed = saved ? parseInt(saved, 10) : 1;
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  } catch {
    return 1;
  }
}

export function saveHighestUnlocked(level: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(StorageKeys.HIGHEST_UNLOCKED, level.toString());
  } catch {}
}
