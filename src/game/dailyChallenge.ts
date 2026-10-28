import { PuzzleLevel } from './logic';
import { generateLevel } from './generator';

const DAILY_STORAGE_KEY = 'arrow_daily_completed_dates';
const DAILY_PUZZLE_CACHE_PREFIX = 'arrow_daily_puzzle_cache_';

// In-memory cache for instantaneous retrieval (0ms latency)
const dailyMemoryCache = new Map<string, PuzzleLevel>();

// In-memory completed dates fallback for non-browser or test environments
const completedDatesMemoryFallback = new Set<string>();

export function getCompletedDailyDates(): string[] {
  if (typeof window === 'undefined') return Array.from(completedDatesMemoryFallback);
  try {
    const raw = localStorage.getItem(DAILY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : Array.from(completedDatesMemoryFallback);
  } catch {
    return Array.from(completedDatesMemoryFallback);
  }
}

export function isDailyDateCompleted(dateStr: string): boolean {
  const dates = getCompletedDailyDates();
  return dates.includes(dateStr);
}

export function markDailyDateCompleted(dateStr: string): void {
  completedDatesMemoryFallback.add(dateStr);
  if (typeof window === 'undefined') return;
  try {
    const dates = new Set(getCompletedDailyDates());
    dates.add(dateStr);
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(Array.from(dates)));
  } catch {}
}

export function getMonthDaysCount(year: number, month: number): number {
  // month is 0-indexed (0 for Jan, 11 for Dec)
  return new Date(year, month + 1, 0).getDate();
}

export function getMonthCompletedCount(
  year: number,
  month: number
): { completed: number; totalDays: number } {
  const totalDays = getMonthDaysCount(year, month);
  const completedList = getCompletedDailyDates();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;

  const completedInMonth = completedList.filter((d) => d.startsWith(prefix)).length;
  return {
    completed: completedInMonth,
    totalDays,
  };
}

/**
 * Creates a deterministic 32-bit positive hash from a date string (e.g. '2026-10-27')
 */
export function hashDateString(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Checks whether the puzzle for dateStr is already cached in RAM or LocalStorage
 */
export function isDailyMissionCached(dateStr: string): boolean {
  if (dailyMemoryCache.has(dateStr)) return true;
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(DAILY_PUZZLE_CACHE_PREFIX + dateStr) !== null;
  } catch {
    return false;
  }
}

/**
 * Clones a PuzzleLevel so gameplay movements do not mutate the cached original
 */
function clonePuzzleLevel(level: PuzzleLevel): PuzzleLevel {
  return {
    ...level,
    arrows: level.arrows.map((a) => ({
      ...a,
      points: a.points.map((p) => ({ ...p })),
    })),
  };
}

/**
 * Generates or retrieves a Daily Mission level deterministically based on date string.
 * Strictly optimized:
 * 1. Checks in-memory cache (0ms latency)
 * 2. Checks localStorage cache (instant)
 * 3. If uncached, deterministically generates a balanced 3:4 portrait puzzle (~17-25 arrows)
 *    and immediately persists to both memory and localStorage.
 */
export function generateDailyMission(dateStr: string): PuzzleLevel {
  // 1. In-memory cache hit
  const memCached = dailyMemoryCache.get(dateStr);
  if (memCached) {
    return clonePuzzleLevel(memCached);
  }

  // 2. Persistent storage cache hit
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(DAILY_PUZZLE_CACHE_PREFIX + dateStr);
      if (stored) {
        const parsed: PuzzleLevel = JSON.parse(stored);
        dailyMemoryCache.set(dateStr, parsed);
        return clonePuzzleLevel(parsed);
      }
    } catch {}
  }

  // 3. Deterministic generation for this specific date:
  // Maps each date to an engaging daily challenge (17-25 arrows on 12x16 portrait grid)
  const dateHash = hashDateString(dateStr);
  const levelEquivalent = 6 + (dateHash % 9); // Levels 6-14 (17 to 25 arrows)
  const customSeed = 100000 + (dateHash % 899999);

  const baseLevel = generateLevel(levelEquivalent, customSeed);

  const mission: PuzzleLevel = {
    ...baseLevel,
    id: 900000 + (dateHash % 99999),
    name: 'Daily Mission',
    subtitle: dateStr,
    arrows: baseLevel.arrows.map((a) => ({
      ...a,
      points: a.points.map((p) => ({ ...p })),
    })),
  };

  // Cache in RAM
  dailyMemoryCache.set(dateStr, mission);

  // Cache in localStorage asynchronously to keep main thread completely unblocked
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DAILY_PUZZLE_CACHE_PREFIX + dateStr, JSON.stringify(mission));
    } catch {}
  }

  return clonePuzzleLevel(mission);
}

/**
 * Asynchronously preloads/generates a Daily Mission in the background
 * without blocking the main UI thread.
 */
export function preloadDailyMission(dateStr: string): void {
  if (dailyMemoryCache.has(dateStr)) return;

  // Use requestIdleCallback if available, otherwise setTimeout 0
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
      generateDailyMission(dateStr);
    });
  } else {
    setTimeout(() => {
      generateDailyMission(dateStr);
    }, 0);
  }
}
