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
  blockerProb: number;
  pickShape: (rng: SeededRNG) => number; // 1: L-turn, 2: S/U-bend, 3: Staircase serpentine
}

function getSnakeTierConfig(stage: number): SnakeTierConfig {
  const s = Math.max(1, stage);
  if (s <= 3) {
    return {
      blockerProb: 0.35,
      pickShape: (rng: SeededRNG) => (rng.next() > 0.45 ? 1 : 2),
    };
  }
  if (s <= 7) {
    return {
      blockerProb: 0.65,
      pickShape: (rng: SeededRNG) => (rng.next() > 0.40 ? 2 : 3),
    };
  }
  if (s <= 12) {
    return {
      blockerProb: 0.80,
      pickShape: (rng: SeededRNG) => (rng.next() > 0.50 ? 3 : 2),
    };
  }
  if (s <= 20) {
    return {
      blockerProb: 0.88,
      pickShape: (rng: SeededRNG) => (rng.next() > 0.25 ? 3 : 2),
    };
  }
  return {
    blockerProb: 0.92,
    pickShape: (rng: SeededRNG) => (rng.next() > 0.20 ? 3 : 2),
  };
}

/**
 * Generates an array of snake pieces using reverse DAG topological construction.
 * Enforces a strict minimum clearance gap (>= 0.82) to prevent any touching or overlapping.
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
  const maxAttempts = 4000;

  while (arrows.length < targetCount && attempts < maxAttempts) {
    attempts++;
    let tipX = 0;
    let tipY = 0;
    let dir: Direction = 'UP';

    const unblocked = arrows.filter((a) => checkArrowEscape(a.id, arrows).canEscape);

    if (unblocked.length > 0 && rng.next() < tier.blockerProb) {
      const target = rng.pick(unblocked);
      const tTip = target.points[target.points.length - 1];
      const tv = getDirVector(target.dir);
      const distAhead = rng.nextInt(1, 3);
      const ix = tTip.x + tv.dx * distAhead;
      const iy = tTip.y + tv.dy * distAhead;

      if (ix >= 1 && ix <= gridW - 1 && iy >= 1 && iy <= gridH - 1) {
        const perpDirs: Direction[] =
          target.dir === 'UP' || target.dir === 'DOWN' ? ['LEFT', 'RIGHT'] : ['UP', 'DOWN'];
        dir = rng.pick(perpDirs);
        const cv = getDirVector(dir);
        const testX = ix + cv.dx;
        const testY = iy + cv.dy;
        if (testX >= 1 && testX <= gridW - 1 && testY >= 1 && testY <= gridH - 1) {
          tipX = testX;
          tipY = testY;
        }
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

    const candidate: ArrowData = {
      id: `snake_${stageNumber}_${arrows.length + 1}`,
      points,
      dir,
    };

    // Strict clearance validation: distance between candidate and all existing snakes
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

    // DAG reverse escape check: candidate must be currently unblocked
    if (!checkArrowEscape(candidate.id, [...arrows, candidate]).canEscape) {
      continue;
    }

    arrows.push(candidate);
  }

  return arrows;
}

export function generateSnakeArrowStage(stageNumber: number): PuzzleLevel {
  const stage = Math.max(1, stageNumber);
  const targetArrowCount = getSnakeTargetArrowCount(stage);
  const difficultyLabel = getSnakeDifficultyLabel(stage);
  const logicDifficulty = getSnakeLogicDifficulty(stage);
  const { gridW, gridH } = getSnakeGridDimensions(stage);
  const tierConfig = getSnakeTierConfig(stage);

  const baseSeed = stage * 93821 + 104729;
  let finalArrows: ArrowData[] = [];

  for (let attempt = 0; attempt < 30; attempt++) {
    const seed = baseSeed + attempt * 7919;
    const candidateArrows = generateSnakeDAG(stage, targetArrowCount, gridW, gridH, tierConfig, seed);

    if (candidateArrows.length === targetArrowCount) {
      const report = validateLevel(candidateArrows, gridW, gridH);
      if (report.passed && report.solveResult.solvable && report.solveResult.initialFreeCount >= 1) {
        finalArrows = candidateArrows;
        break;
      }
    }
  }

  if (finalArrows.length < targetArrowCount) {
    const expandedGridW = gridW + 1;
    const expandedGridH = gridH + 1;
    for (let attempt = 0; attempt < 25; attempt++) {
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
          break;
        }
      }
    }
  }

  const solveStats = solvePuzzle(finalArrows);
  const initialFree = finalArrows.filter((a) => checkArrowEscape(a.id, finalArrows).canEscape).length;
  const blockedCount = Math.max(0, finalArrows.length - initialFree);

  return {
    id: stage,
    name: 'Snake Arrow',
    subtitle: `Stage ${stage} · ${difficultyLabel}`,
    difficulty: logicDifficulty,
    gridWidth: gridW,
    gridHeight: gridH,
    arrows: finalArrows,
    difficultyScore: stage * 12 + blockedCount * 5,
    dependencyDepth: Math.max(1, solveStats.solutionOrder.length - initialFree),
  };
}
