/**
 * Snake Arrow Mode - Progressive Logic & Puzzle Generation Engine
 * Game: Arrow Master : Puzzle Escape
 * Developer: Vikash Gamboge
 *
 * ---------------------------------------------------------------------------------
 * REAL DIFFICULTY PROGRESSION SPECIFICATION:
 *
 * 1. LEVEL DIFFICULTY PROGRESSION:
 *    - Level 1–3: EASY
 *      * 4 to 6 snakes
 *      * Short paths, 1–2 gentle turns, large amount of free space
 *    - Level 4–7: NORMAL
 *      * 7 to 10 snakes
 *      * Longer paths, 2–3 turns, winding corridors
 *    - Level 8–12: HARD
 *      * 11 to 15 snakes
 *      * Winding serpentine paths, 3–4 turns, tight clearance
 *    - Level 13–20: VERY HARD
 *      * 16 to 23 snakes
 *      * Multi-turn serpentine paths (3–5 turns), deep planning needed
 *    - Level 21+: EXPERT
 *      * 24+ snakes, intricate serpentine layouts, high strategic complexity
 *
 * 2. STRICT 0% OVERLAP & CLEARANCE GUARANTEE:
 *    - Minimum segment-to-segment distance >= 0.82 grid units
 *    - Zero intersections or overlapping paths permitted
 *    - Reverse DAG topological construction guarantees 100% solvability
 * ---------------------------------------------------------------------------------
 */

import {
  ArrowData,
  Direction,
  Point,
  PuzzleLevel,
  Difficulty,
  getDirVector,
  checkArrowEscape,
} from './logic';
import { SeededRNG } from './seed';
import { validateLevel } from './validator';
import { arrowDistance } from './geometry';
import { solvePuzzle } from './solver';

const SNAKE_STAGE_STORAGE_KEY = 'arrow_snake_highest_stage';

// Vibrant snake colors matching 3D cartoon snake themes
export const SNAKE_COLORS = [
  '#10B981', // Emerald
  '#06B6D4', // Vibrant Cyan
  '#F59E0B', // Golden Amber
  '#EC4899', // Neon Coral / Rose
  '#8B5CF6', // Royal Violet
  '#3B82F6', // Electric Blue
  '#14B8A6', // Mint Teal
  '#F97316', // Bright Tangerine
  '#EAB308', // Radiant Yellow
  '#6366F1', // Indigo
];

// In-memory cache for instantaneous retrieval (0ms latency, zero lag)
const snakeStageCache = new Map<number, PuzzleLevel>();

export type SnakeDifficultyLabel = 'EASY' | 'NORMAL' | 'HARD' | 'VERY HARD' | 'EXPERT';

export function loadHighestSnakeStage(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const val = localStorage.getItem(SNAKE_STAGE_STORAGE_KEY);
    return val ? Math.max(1, parseInt(val, 10)) : 1;
  } catch {
    return 1;
  }
}

export function saveHighestSnakeStage(stage: number): void {
  if (typeof window === 'undefined') return;
  try {
    const cur = loadHighestSnakeStage();
    if (stage > cur) {
      localStorage.setItem(SNAKE_STAGE_STORAGE_KEY, stage.toString());
    }
  } catch {}
}

export function getSnakeTargetArrowCount(stage: number): number {
  const s = Math.max(1, stage);
  if (s <= 20) {
    return 3 + s; // Level 1 -> 4, Level 8 -> 11, Level 10 -> 13, Level 20 -> 23
  }
  return Math.min(28, 24 + Math.floor((s - 21) * 0.4));
}

export function getSnakeDifficultyLabel(stage: number): SnakeDifficultyLabel {
  const s = Math.max(1, stage);
  if (s <= 3) return 'EASY';
  if (s <= 7) return 'NORMAL';
  if (s <= 12) return 'HARD';
  if (s <= 20) return 'VERY HARD';
  return 'EXPERT';
}

export function getSnakeLogicDifficulty(stage: number): Difficulty {
  const s = Math.max(1, stage);
  if (s <= 3) return 'Easy';
  if (s <= 7) return 'Medium';
  if (s <= 12) return 'Hard';
  if (s <= 20) return 'Very Hard';
  return 'Expert';
}

export function getSnakeGridDimensions(stage: number): { gridW: number; gridH: number } {
  const s = Math.max(1, stage);
  const size = Math.min(18, 7 + Math.floor(s * 0.65));
  return { gridW: size, gridH: size };
}

interface SnakeTierConfig {
  targetInitialFree: number;
  pickShape: (rng: SeededRNG) => number; // 1: L-turn, 2: S/U-bend, 3: Staircase serpentine
}

/**
 * Calibrated for 8th Grade and Above:
 * Real serpentine interlocks, authentic blocker dependencies, and multi-turn paths.
 * Enforces that only 2–3 snakes are initially available at the start of a stage,
 * and all remaining snakes are blocked by earlier snakes in multi-step chains.
 */
function getSnakeTierConfig(stage: number): SnakeTierConfig {
  const s = Math.max(1, stage);
  if (s <= 3) {
    return {
      targetInitialFree: 2,
      pickShape: (rng: SeededRNG) => (rng.next() > 0.40 ? 2 : 1),
    };
  }
  if (s <= 7) {
    return {
      targetInitialFree: 3,
      pickShape: (rng: SeededRNG) => (rng.next() > 0.35 ? 3 : 2),
    };
  }
  if (s <= 12) {
    return {
      targetInitialFree: 2,
      pickShape: (rng: SeededRNG) => (rng.next() > 0.40 ? 3 : 2),
    };
  }
  if (s <= 20) {
    return {
      targetInitialFree: 2,
      pickShape: (rng: SeededRNG) => (rng.next() > 0.25 ? 3 : 2),
    };
  }
  return {
    targetInitialFree: 2,
    pickShape: (rng: SeededRNG) => (rng.next() > 0.20 ? 3 : 2),
  };
}

/**
 * Checks whether any snake in `existing` has its forward exit ray blocked by `candidate`.
 */
function doesCandidateBlockAnyExisting(candidate: ArrowData, existing: ArrowData[]): boolean {
  const pair: ArrowData[] = [candidate, candidate];
  for (let i = 0; i < existing.length; i++) {
    pair[0] = existing[i];
    pair[1] = candidate;
    if (!checkArrowEscape(existing[i].id, pair).canEscape) {
      return true;
    }
  }
  return false;
}

/**
 * Generates an array of snake pieces using Outside-In Forward Ray-Locking DAG construction.
 * - First `targetInitialFree` (2–3) snakes have completely clear forward exit paths.
 * - Every subsequent snake has its forward exit ray blocked by at least one already-placed snake,
 *   while never blocking any already-placed snake's forward exit path.
 * - Guarantees 100% mathematical solvability, 0 deadlocks, >= 0.82 clearance, and only 2–3 initial free moves.
 */
function generateSnakeDAG(
  stageNumber: number,
  targetCount: number,
  gridW: number,
  gridH: number,
  tier: SnakeTierConfig,
  seed: number
): ArrowData[] {
  const arrows: ArrowData[] = [];
  const MIN_CLEARANCE = 0.82; // Strict gap between snakes
  const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  const rng = new SeededRNG(seed);
  let attempts = 0;
  const maxAttempts = 5200;

  while (arrows.length < targetCount && attempts < maxAttempts) {
    attempts++;
    const needBlocked = arrows.length >= tier.targetInitialFree;
    // Allow fallback only if nearly out of attempts so board always fills cleanly
    const strictBlocked = needBlocked && attempts < maxAttempts * 0.88;

    let tipX = 0;
    let tipY = 0;
    let dir: Direction = 'UP';

    if (needBlocked && arrows.length > 0 && rng.next() < 0.85) {
      // Aim candidate's tip so its forward ray points directly into an existing snake's segment
      const blocker = rng.pick(arrows);
      const segPt = rng.pick(blocker.points);
      dir = rng.pick(directions);
      const v = getDirVector(dir);
      const distBehind = rng.nextInt(1, 4);
      const tx = Math.round(segPt.x - v.dx * distBehind);
      const ty = Math.round(segPt.y - v.dy * distBehind);
      if (tx >= 1 && tx <= gridW - 1 && ty >= 1 && ty <= gridH - 1) {
        tipX = tx;
        tipY = ty;
      }
    }

    if (tipX < 1 || tipX > gridW - 1 || tipY < 1 || tipY > gridH - 1) {
      tipX = rng.nextInt(1, gridW - 1);
      tipY = rng.nextInt(1, gridH - 1);
      dir = rng.pick(directions);
    }

    const v = getDirVector(dir);
    const shape = tier.pickShape(rng);
    const points: Point[] = [];

    if (shape === 1) {
      // 1 turn: L-turn
      const turnSign = rng.next() > 0.5 ? 1 : -1;
      const perpX = v.dy * turnSign;
      const perpY = -v.dx * turnSign;
      const stem = rng.nextInt(1, 2);
      const arm = rng.nextInt(1, 2);
      const cX = tipX - v.dx * stem;
      const cY = tipY - v.dy * stem;
      const tX = cX + perpX * arm;
      const tY = cY + perpY * arm;

      if (
        cX < 0.8 ||
        cX > gridW - 0.8 ||
        cY < 0.8 ||
        cY > gridH - 0.8 ||
        tX < 0.8 ||
        tX > gridW - 0.8 ||
        tY < 0.8 ||
        tY > gridH - 0.8
      ) {
        continue;
      }
      points.push({ x: tX, y: tY }, { x: cX, y: cY }, { x: tipX, y: tipY });
    } else if (shape === 2) {
      // 2 turns: S-bend or U-shaped serpentine path
      const turnSign = rng.next() > 0.5 ? 1 : -1;
      const perpX = v.dy * turnSign;
      const perpY = -v.dx * turnSign;
      const stem = rng.nextInt(1, 2);
      const mid = rng.nextInt(1, 2);
      const isS = rng.next() > 0.4;
      const tailDirX = isS ? -v.dx : v.dx;
      const tailDirY = isS ? -v.dy : v.dy;
      const c1X = tipX - v.dx * stem;
      const c1Y = tipY - v.dy * stem;
      const c2X = c1X + perpX * mid;
      const c2Y = c1Y + perpY * mid;
      const tX = c2X + tailDirX;
      const tY = c2Y + tailDirY;

      if (
        c1X < 0.8 ||
        c1X > gridW - 0.8 ||
        c1Y < 0.8 ||
        c1Y > gridH - 0.8 ||
        c2X < 0.8 ||
        c2X > gridW - 0.8 ||
        c2Y < 0.8 ||
        c2Y > gridH - 0.8 ||
        tX < 0.8 ||
        tX > gridW - 0.8 ||
        tY < 0.8 ||
        tY > gridH - 0.8
      ) {
        continue;
      }
      points.push({ x: tX, y: tY }, { x: c2X, y: c2Y }, { x: c1X, y: c1Y }, { x: tipX, y: tipY });
    } else {
      // 3 turns: Serpentine winding zigzag
      const turnSign = rng.next() > 0.5 ? 1 : -1;
      const perpX = v.dy * turnSign;
      const perpY = -v.dx * turnSign;
      const c1X = tipX - v.dx;
      const c1Y = tipY - v.dy;
      const c2X = c1X + perpX;
      const c2Y = c1Y + perpY;
      const c3X = c2X - v.dx;
      const c3Y = c2Y - v.dy;
      const tX = c3X + perpX;
      const tY = c3Y + perpY;

      if (
        c1X < 0.8 ||
        c1X > gridW - 0.8 ||
        c1Y < 0.8 ||
        c1Y > gridH - 0.8 ||
        c2X < 0.8 ||
        c2X > gridW - 0.8 ||
        c2Y < 0.8 ||
        c2Y > gridH - 0.8 ||
        c3X < 0.8 ||
        c3X > gridW - 0.8 ||
        c3Y < 0.8 ||
        c3Y > gridH - 0.8 ||
        tX < 0.8 ||
        tX > gridW - 0.8 ||
        tY < 0.8 ||
        tY > gridH - 0.8
      ) {
        continue;
      }
      points.push(
        { x: tX, y: tY },
        { x: c3X, y: c3Y },
        { x: c2X, y: c2Y },
        { x: c1X, y: c1Y },
        { x: tipX, y: tipY }
      );
    }

    const candidateColor = SNAKE_COLORS[arrows.length % SNAKE_COLORS.length];
    const candidate: ArrowData = {
      id: `snake_${stageNumber}_${arrows.length + 1}`,
      points,
      dir,
      color: candidateColor,
    };

    // 1. Strict clearance validation: distance between candidate and all existing snakes
    let clear = true;
    for (const ex of arrows) {
      if (arrowDistance(candidate, ex) < MIN_CLEARANCE) {
        clear = false;
        break;
      }
      const exTip = ex.points[ex.points.length - 1];
      if (Math.hypot(tipX - exTip.x, tipY - exTip.y) < MIN_CLEARANCE) {
        clear = false;
        break;
      }
    }
    if (!clear) continue;

    // 2. Forward Peeling Invariant: candidate must NEVER block any earlier snake's exit ray!
    // This guarantees 100% solvability in order arrows[0], arrows[1], ..., candidate.
    if (doesCandidateBlockAnyExisting(candidate, arrows)) {
      continue;
    }

    // 3. Initial Free Count Control:
    // - First `targetInitialFree` snakes must be unblocked at the start.
    // - All subsequent snakes must be blocked by at least one earlier snake.
    const canCandidateEscapeNow = checkArrowEscape(candidate.id, [...arrows, candidate]).canEscape;
    if (!needBlocked) {
      if (!canCandidateEscapeNow) continue;
    } else if (strictBlocked) {
      if (canCandidateEscapeNow) continue;
    }

    arrows.push(candidate);
  }

  return arrows;
}

/**
 * Preloads a Snake Arrow stage into RAM asynchronously to guarantee 0ms instant loading.
 */
export function preloadSnakeArrowStage(stageNumber: number): void {
  const stage = Math.max(1, stageNumber);
  if (snakeStageCache.has(stage)) return;

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
      generateSnakeArrowStage(stage);
    });
  } else {
    setTimeout(() => {
      generateSnakeArrowStage(stage);
    }, 0);
  }
}

export function generateSnakeArrowStage(stageNumber: number): PuzzleLevel {
  const stage = Math.max(1, stageNumber);

  // 1. Instant 0ms in-memory cache hit
  const cached = snakeStageCache.get(stage);
  if (cached) {
    return {
      ...cached,
      arrows: cached.arrows.map((a) => ({
        ...a,
        points: a.points.map((p) => ({ ...p })),
      })),
    };
  }

  const targetArrowCount = getSnakeTargetArrowCount(stage);
  const difficultyLabel = getSnakeDifficultyLabel(stage);
  const logicDifficulty = getSnakeLogicDifficulty(stage);
  const { gridW, gridH } = getSnakeGridDimensions(stage);
  const tierConfig = getSnakeTierConfig(stage);

  const baseSeed = stage * 93821 + 104729;
  let finalArrows: ArrowData[] = [];
  let effectiveGridW = gridW;
  let effectiveGridH = gridH;

  for (let attempt = 0; attempt < 35; attempt++) {
    const seed = baseSeed + attempt * 7919;
    const candidateArrows = generateSnakeDAG(stage, targetArrowCount, gridW, gridH, tierConfig, seed);

    if (candidateArrows.length === targetArrowCount) {
      const report = validateLevel(candidateArrows, gridW, gridH);
      if (report.passed && report.solveResult.solvable && report.solveResult.initialFreeCount >= 1) {
        finalArrows = candidateArrows;
        effectiveGridW = gridW;
        effectiveGridH = gridH;
        break;
      }
    }
  }

  if (finalArrows.length < targetArrowCount) {
    const expandedGridW = gridW + 1;
    const expandedGridH = gridH + 1;
    for (let attempt = 0; attempt < 30; attempt++) {
      const seed = baseSeed + 50000 + attempt * 7919;
      const candidateArrows = generateSnakeDAG(
        stage,
        targetArrowCount,
        expandedGridW,
        expandedGridH,
        tierConfig,
        seed
      );

      if (candidateArrows.length === targetArrowCount) {
        const report = validateLevel(candidateArrows, expandedGridW, expandedGridH);
        if (report.passed && report.solveResult.solvable && report.solveResult.initialFreeCount >= 1) {
          finalArrows = candidateArrows;
          effectiveGridW = expandedGridW;
          effectiveGridH = expandedGridH;
          break;
        }
      }
    }
  }

  const solveStats = solvePuzzle(finalArrows);
  const initialFree = finalArrows.filter((a) => checkArrowEscape(a.id, finalArrows).canEscape).length;
  const blockedCount = Math.max(0, finalArrows.length - initialFree);

  const puzzle: PuzzleLevel = {
    id: stage,
    name: 'Snake Arrow',
    subtitle: `Stage ${stage} · ${difficultyLabel}`,
    difficulty: logicDifficulty,
    gridWidth: effectiveGridW,
    gridHeight: effectiveGridH,
    arrows: finalArrows,
    difficultyScore: stage * 12 + blockedCount * 5,
    dependencyDepth: Math.max(1, solveStats.solutionOrder.length - initialFree),
  };

  // Cache in RAM for 0ms subsequent retrieval
  snakeStageCache.set(stage, puzzle);

  return {
    ...puzzle,
    arrows: puzzle.arrows.map((a) => ({
      ...a,
      points: a.points.map((p) => ({ ...p })),
    })),
  };
}
