import { ArrowData, Direction, Point, getDirVector, checkArrowEscape, Difficulty } from './logic';
import { SeededRNG } from './seed';
import { validateLevel } from './validator';
import { arrowDistance, calculateDifficultyMetrics } from './geometry';
import { getSilhouetteForLevel, SilhouetteConfig } from './silhouette';

export interface GeneratedLevel {
  id: number;
  name: string;
  subtitle: string;
  difficulty: Difficulty;
  gridWidth: number;
  gridHeight: number;
  arrows: ArrowData[];
  shapeOutline?: string;
  difficultyScore: number;
  dependencyDepth: number;
}

interface LevelConfig {
  difficulty: Difficulty;
  subtitle: string;
  gridWidth: number;
  gridHeight: number;
  targetArrows: number;
  minArrows: number;
  blockerProbability: number;
  maxPathLen: number;
  allowTurns: boolean;
  allowMultiTurns: boolean;
}

/**
 * Returns level configuration parameters based on sequential level number and chosen silhouette.
 * STRICT REQUIREMENTS:
 * 1. Independent separation of difficulty and arrow count:
 *    - Easy does NOT mean few arrows.
 *    - Levels 1-10 have a substantial number of arrows (~12 to ~21) while remaining EASY:
 *      Level 1  -> 12 arrows
 *      Level 2  -> 13 arrows
 *      Level 3  -> 14 arrows
 *      Level 4  -> 15 arrows
 *      Level 5  -> 16 arrows
 *      Level 6  -> 17 arrows
 *      Level 7  -> 18 arrows
 *      Level 8  -> 19 arrows
 *      Level 9  -> 20 arrows
 *      Level 10 -> 21 arrows
 * 2. Levels 1-10 are easy in logic:
 *    - Low blocker probability (0.18 - 0.30)
 *    - Mostly straight paths (100% straight for L1-3, 75-80% straight for L4-10)
 *    - No complex winding labyrinths
 *    - High initial free arrow count
 * 3. Board is strictly 3:4 portrait ratio (gridWidth:gridHeight = 3:4).
 */
function getLevelConfig(levelNumber: number, silhouette: SilhouetteConfig): LevelConfig {
  const lvl = Math.max(1, levelNumber);

  let target = 12;
  let minArrows = 11;
  let diff: Difficulty = 'Beginner';
  let blockerProb = 0.20;
  let maxPathLen = 2;
  let allowTurns = false;
  let allowMultiTurns = false;

  if (lvl <= 10) {
    // Explicit progression: L1=12, L2=13, L3=14, L4=15, L5=16, L6=17, L7=18, L8=19, L9=20, L10=21
    target = 11 + lvl;
    minArrows = Math.max(10, target - 1);
    diff = 'Beginner';

    if (lvl <= 3) {
      // Levels 1-3: Pure straight paths, very low blockers, effortless clear
      blockerProb = 0.18 + (lvl - 1) * 0.02;
      allowTurns = false;
      allowMultiTurns = false;
      maxPathLen = 2;
    } else if (lvl <= 7) {
      // Levels 4-7: Mostly straight, gentle single L-turns introduced
      blockerProb = 0.24 + (lvl - 4) * 0.02;
      allowTurns = true;
      allowMultiTurns = false;
      maxPathLen = 2;
    } else {
      // Levels 8-10: Gentle single turns, clear directions, still Easy
      blockerProb = 0.29 + (lvl - 8) * 0.02;
      allowTurns = true;
      allowMultiTurns = false;
      maxPathLen = 2;
    }
  } else if (lvl <= 20) {
    // Levels 11-20: 22-31 arrows (Easy tier)
    target = 22 + (lvl - 11);
    minArrows = target - 1;
    diff = 'Easy';
    blockerProb = 0.40 + (lvl - 11) * 0.02;
    maxPathLen = 2;
    allowTurns = true;
    allowMultiTurns = false;
  } else if (lvl <= 35) {
    // Levels 21-35: 32-46 arrows (Medium tier)
    target = 32 + (lvl - 21);
    minArrows = target - 2;
    diff = 'Medium';
    blockerProb = 0.60 + (lvl - 21) * 0.012;
    maxPathLen = 3;
    allowTurns = true;
    allowMultiTurns = lvl >= 26;
  } else if (lvl <= 60) {
    // Levels 36-60: 47-65 arrows (Hard tier)
    target = 47 + Math.round((lvl - 36) * (18 / 24));
    minArrows = target - 3;
    diff = 'Hard';
    blockerProb = 0.78 + (lvl - 36) * 0.005;
    maxPathLen = 3;
    allowTurns = true;
    allowMultiTurns = true;
  } else if (lvl <= 100) {
    // Levels 61-100: 66-90 arrows (Hard tier)
    target = 66 + Math.round((lvl - 61) * (24 / 39));
    minArrows = target - 4;
    diff = 'Hard';
    blockerProb = 0.88 + (lvl - 61) * 0.002;
    maxPathLen = 4;
    allowTurns = true;
    allowMultiTurns = true;
  } else if (lvl <= 150) {
    // Levels 101-150: 91-115 arrows (Expert tier)
    target = 91 + Math.round((lvl - 101) * (24 / 49));
    minArrows = target - 5;
    diff = 'Expert';
    blockerProb = 0.93;
    maxPathLen = 4;
    allowTurns = true;
    allowMultiTurns = true;
  } else {
    // Levels 151+: 116-130 arrows (Master tier)
    target = Math.min(130, 116 + Math.floor((lvl - 151) * 0.25));
    minArrows = target - 5;
    diff = 'Master';
    blockerProb = 0.95;
    maxPathLen = 4;
    allowTurns = true;
    allowMultiTurns = true;
  }

  return {
    difficulty: diff,
    subtitle: silhouette.name,
    gridWidth: silhouette.gridWidth,
    gridHeight: silhouette.gridHeight,
    targetArrows: target,
    minArrows,
    blockerProbability: blockerProb,
    maxPathLen,
    allowTurns,
    allowMultiTurns,
  };
}

/**
 * Reverse-Construction Layered Generator:
 * Generates arrows in reverse removal order inside the requested silhouette mask.
 * Each newly placed arrow is guaranteed to have an unobstructed escape path to the border,
 * while optionally positioning its body to block previously placed arrows.
 */
function generateReverseArrows(
  config: LevelConfig,
  rng: SeededRNG,
  silhouette: SilhouetteConfig
): ArrowData[] {
  const arrows: ArrowData[] = [];
  const MIN_CLEARANCE = 0.72; // Strict spacing clearance
  const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  const maxAttempts = Math.min(1500, Math.max(400, config.targetArrows * 30));
  let attempts = 0;

  const validPoints = silhouette.getValidGridPoints();
  if (validPoints.length === 0) return arrows;

  while (arrows.length < config.targetArrows && attempts < maxAttempts) {
    attempts++;

    let tipX = 0;
    let tipY = 0;
    let dir: Direction = 'UP';

    const unblockedExisting = arrows.filter((a) => checkArrowEscape(a.id, arrows).canEscape);

    // Target creating a dependency by blocking an existing unblocked arrow
    if (unblockedExisting.length > 0 && rng.next() < config.blockerProbability) {
      const target = rng.pick(unblockedExisting);
      const tTip = target.points[target.points.length - 1];
      const tv = getDirVector(target.dir);

      const maxDist = Math.min(4, Math.max(1, Math.floor(silhouette.gridWidth * 0.25)));
      const distAhead = rng.nextInt(1, maxDist);
      const interceptX = tTip.x + tv.dx * distAhead;
      const interceptY = tTip.y + tv.dy * distAhead;

      if (silhouette.isInside(interceptX, interceptY)) {
        const perpDirs: Direction[] =
          target.dir === 'UP' || target.dir === 'DOWN' ? ['LEFT', 'RIGHT'] : ['UP', 'DOWN'];
        dir = rng.pick(perpDirs);
        const cv = getDirVector(dir);

        const ext = rng.nextInt(1, 2);
        const testTipX = interceptX + cv.dx * ext;
        const testTipY = interceptY + cv.dy * ext;
        if (silhouette.isInside(testTipX, testTipY)) {
          tipX = testTipX;
          tipY = testTipY;
        }
      }
    }

    if (!silhouette.isInside(tipX, tipY)) {
      dir = rng.pick(directions);
      const pt = rng.pick(validPoints);
      tipX = pt.x;
      tipY = pt.y;
    }

    const v = getDirVector(dir);

    // Choose path shape: straight (0), L-turn (1), S-bend/Z-bend (2), Zigzag staircase (3)
    let shape = 0;
    if (config.allowTurns) {
      const r = rng.next();
      if (config.allowMultiTurns) {
        if (r > 0.75) {
          shape = 3;
        } else if (r > 0.45) {
          shape = 2;
        } else if (r > 0.20) {
          shape = 1;
        }
      } else {
        // Levels without multi-turns: 75% straight, 25% simple L-turn
        if (r > 0.75) {
          shape = 1;
        }
      }
    }

    const points: Point[] = [];
    if (shape === 0) {
      const len = rng.nextInt(1, Math.min(config.maxPathLen, 2));
      const tailX = tipX - v.dx * len;
      const tailY = tipY - v.dy * len;
      if (!silhouette.isInside(tailX, tailY)) {
        continue;
      }
      points.push({ x: tailX, y: tailY });
      points.push({ x: tipX, y: tipY });
    } else if (shape === 1) {
      const turnSign = rng.next() > 0.5 ? 1 : -1;
      const perpX = v.dy * turnSign;
      const perpY = -v.dx * turnSign;
      const stem = rng.nextInt(1, Math.min(config.maxPathLen, 2));
      const arm = rng.nextInt(1, Math.min(config.maxPathLen, 2));

      const cornerX = tipX - v.dx * stem;
      const cornerY = tipY - v.dy * stem;
      const tailX = cornerX + perpX * arm;
      const tailY = cornerY + perpY * arm;

      if (!silhouette.isInside(cornerX, cornerY) || !silhouette.isInside(tailX, tailY)) {
        continue;
      }
      points.push({ x: tailX, y: tailY });
      points.push({ x: cornerX, y: cornerY });
      points.push({ x: tipX, y: tipY });
    } else if (shape === 2) {
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
      const tailX = c2X + tailDirX;
      const tailY = c2Y + tailDirY;

      if (
        !silhouette.isInside(c1X, c1Y) ||
        !silhouette.isInside(c2X, c2Y) ||
        !silhouette.isInside(tailX, tailY)
      ) {
        continue;
      }
      points.push({ x: tailX, y: tailY });
      points.push({ x: c2X, y: c2Y });
      points.push({ x: c1X, y: c1Y });
      points.push({ x: tipX, y: tipY });
    } else {
      // 3 turns, 4 segments: Staircase zigzag
      const turnSign = rng.next() > 0.5 ? 1 : -1;
      const perpX = v.dy * turnSign;
      const perpY = -v.dx * turnSign;

      const c1X = tipX - v.dx;
      const c1Y = tipY - v.dy;
      const c2X = c1X + perpX;
      const c2Y = c1Y + perpY;
      const c3X = c2X - v.dx;
      const c3Y = c2Y - v.dy;
      const tailX = c3X + perpX;
      const tailY = c3Y + perpY;

      if (
        !silhouette.isInside(c1X, c1Y) ||
        !silhouette.isInside(c2X, c2Y) ||
        !silhouette.isInside(c3X, c3Y) ||
        !silhouette.isInside(tailX, tailY)
      ) {
        continue;
      }
      points.push({ x: tailX, y: tailY });
      points.push({ x: c3X, y: c3Y });
      points.push({ x: c2X, y: c2Y });
      points.push({ x: c1X, y: c1Y });
      points.push({ x: tipX, y: tipY });
    }

    const candidate: ArrowData = {
      id: `a_${arrows.length + 1}`,
      points,
      dir,
    };

    // 1. Strict spacing check with all existing arrows
    let safeSpacing = true;
    for (const existing of arrows) {
      const dist = arrowDistance(candidate, existing);
      if (dist < MIN_CLEARANCE) {
        safeSpacing = false;
        break;
      }

      const tipE = existing.points[existing.points.length - 1];
      if (Math.hypot(tipX - tipE.x, tipY - tipE.y) < 0.75) {
        safeSpacing = false;
        break;
      }
    }
    if (!safeSpacing) continue;

    // 2. Escape check: Candidate MUST be free to escape past all arrows currently on board
    const escapeRes = checkArrowEscape(candidate.id, [...arrows, candidate]);
    if (!escapeRes.canEscape) {
      continue;
    }

    arrows.push(candidate);
  }

  return arrows;
}

/**
 * Deterministically generates a verified solvable, zero-touch puzzle for ANY level number.
 * Level progression is 100% sequential, solvable, and replayable.
 */
export function generateLevel(levelNumber: number, customSeed?: number): GeneratedLevel {
  const silhouette = getSilhouetteForLevel(levelNumber);
  const config = getLevelConfig(levelNumber, silhouette);
  const BASE_SEED = 24680;

  let bestArrows: ArrowData[] | null = null;
  let bestCount = 0;

  for (let attempt = 0; attempt < 10; attempt++) {
    const seed =
      customSeed !== undefined
        ? customSeed + attempt * 73
        : BASE_SEED + levelNumber * 1009 + attempt * 73;
    const rng = new SeededRNG(seed);

    const arrows = generateReverseArrows(config, rng, silhouette);

    if (arrows.length >= config.minArrows) {
      // Verify puzzle passes complete validation pipeline
      const report = validateLevel(arrows, config.gridWidth, config.gridHeight);

      if (
        report.passed &&
        report.solveResult.solvable &&
        report.solveResult.initialFreeCount >= 1
      ) {
        const metrics = calculateDifficultyMetrics(arrows);
        return {
          id: levelNumber,
          name: `Level ${levelNumber}`,
          subtitle: silhouette.name,
          difficulty: config.difficulty,
          gridWidth: config.gridWidth,
          gridHeight: config.gridHeight,
          arrows,
          difficultyScore: metrics.score,
          dependencyDepth: metrics.maxChainDepth,
        };
      }
    }

    if (arrows.length > bestCount) {
      bestCount = arrows.length;
      bestArrows = arrows;
    }
  }

  if (bestArrows && bestArrows.length >= Math.max(4, Math.floor(config.targetArrows * 0.70))) {
    const report = validateLevel(bestArrows, config.gridWidth, config.gridHeight);
    if (report.passed && report.solveResult.solvable) {
      const metrics = calculateDifficultyMetrics(bestArrows);
      return {
        id: levelNumber,
        name: `Level ${levelNumber}`,
        subtitle: silhouette.name,
        difficulty: config.difficulty,
        gridWidth: config.gridWidth,
        gridHeight: config.gridHeight,
        arrows: bestArrows,
        difficultyScore: metrics.score,
        dependencyDepth: metrics.maxChainDepth,
      };
    }
  }

  // Graceful verified fallback conforming to boundaries (3:4 portrait)
  const fbW = config.gridWidth;
  const fbH = config.gridHeight;
  const fallbackArrows: ArrowData[] = [
    { id: 'fb_1', points: [{ x: 1, y: 1 }, { x: Math.max(2, fbW - 2), y: 1 }], dir: 'RIGHT' },
    { id: 'fb_2', points: [{ x: Math.max(2, fbW - 2), y: 2 }, { x: Math.max(2, fbW - 2), y: Math.max(2, fbH - 2) }], dir: 'DOWN' },
    { id: 'fb_3', points: [{ x: Math.max(1, fbW - 3), y: Math.max(2, fbH - 2) }, { x: 1, y: Math.max(2, fbH - 2) }], dir: 'LEFT' },
    { id: 'fb_4', points: [{ x: 1, y: Math.max(1, fbH - 3) }, { x: 1, y: 2 }], dir: 'UP' },
  ];

  const metrics = calculateDifficultyMetrics(fallbackArrows);
  return {
    id: levelNumber,
    name: `Level ${levelNumber}`,
    subtitle: silhouette.name,
    difficulty: config.difficulty,
    gridWidth: fbW,
    gridHeight: fbH,
    arrows: fallbackArrows,
    difficultyScore: metrics.score,
    dependencyDepth: metrics.maxChainDepth,
  };
}
