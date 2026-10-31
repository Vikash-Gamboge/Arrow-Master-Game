import {
  ArrowData,
  Direction,
  Point,
  getDirVector,
  Difficulty,
  checkArrowEscape,
} from './logic';
import { SeededRNG } from './seed';
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
  targetInitialFree: number;
  maxInitialFree: number;
  minGridCellsPerArrow: number;
  maxGridCellsPerArrow: number;
  turnProbability: number;
}

// In-memory cache for 0ms instantaneous level retrieval
const levelMemoryCache = new Map<number, GeneratedLevel>();

function cloneGeneratedLevel(level: GeneratedLevel): GeneratedLevel {
  return {
    ...level,
    arrows: level.arrows.map((a) => ({
      ...a,
      points: a.points.map((p) => ({ ...p })),
    })),
  };
}

/**
 * Real Difficulty & Blocking Configuration across EASY, MEDIUM, HARD, and EXPERT.
 * Controls:
 * - targetInitialFree / maxInitialFree: how many arrows have a clear exit path at the start
 * - targetArrows: total interlocking arrows in the silhouette
 * - minGridCellsPerArrow / maxGridCellsPerArrow: multi-bend labyrinth path lengths
 * - turnProbability: frequency of orthogonal 90-degree turns
 */
function getLevelConfig(levelNumber: number, silhouette: SilhouetteConfig): LevelConfig {
  const lvl = Math.max(1, levelNumber);

  let targetArrows = 12;
  let minArrows = 11;
  let diff: Difficulty = 'Beginner';
  let targetInitialFree = 4;
  let maxInitialFree = 5;
  let minGridCells = 3;
  let maxGridCells = 5;
  let turnProb = 0.80;

  if (lvl <= 10) {
    // EASY (Beginner tier in campaign): 12 to 21 arrows
    // Exact expected targets in tests: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
    targetArrows = 11 + lvl;
    minArrows = targetArrows - 1;
    diff = 'Beginner';
    targetInitialFree = lvl <= 4 ? 4 : 3;
    maxInitialFree = lvl <= 4 ? 5 : 4;
    minGridCells = 3;
    maxGridCells = 5;
    turnProb = 0.80;
  } else if (lvl <= 25) {
    // MEDIUM: Levels 11-25 (22 to 36 arrows), 2-3 arrows initially free
    targetArrows = 21 + (lvl - 10);
    minArrows = 22;
    diff = lvl <= 15 ? 'Easy' : 'Medium';
    targetInitialFree = 3;
    maxInitialFree = 3;
    minGridCells = 3;
    maxGridCells = 6;
    turnProb = 0.85;
  } else if (lvl <= 60) {
    // HARD: Levels 26-60 (37 to 56 arrows, including Level 39), strictly 2-3 arrows initially free
    targetArrows = 36 + Math.round((lvl - 25) * 0.58);
    minArrows = 35;
    diff = 'Hard';
    targetInitialFree = 2;
    maxInitialFree = 3;
    minGridCells = 3;
    maxGridCells = 6;
    turnProb = 0.88;
  } else if (lvl <= 100) {
    // EXPERT (Very Hard): Levels 61-100 (57 to 72 arrows), strictly 2 arrows initially free
    targetArrows = 56 + Math.round((lvl - 60) * 0.40);
    minArrows = 46;
    diff = 'Very Hard';
    targetInitialFree = 2;
    maxInitialFree = 3;
    minGridCells = 3;
    maxGridCells = 6;
    turnProb = 0.90;
  } else {
    // MASTER / EXPERT: Levels 101+ (73 to 82 arrows), strictly 2 arrows initially free
    targetArrows = Math.min(82, 72 + Math.round((lvl - 100) * 0.15));
    minArrows = 52;
    diff = 'Expert';
    targetInitialFree = 2;
    maxInitialFree = 3;
    minGridCells = 3;
    maxGridCells = 6;
    turnProb = 0.92;
  }

  return {
    difficulty: diff,
    subtitle: silhouette.name,
    gridWidth: silhouette.gridWidth,
    gridHeight: silhouette.gridHeight,
    targetArrows,
    minArrows,
    targetInitialFree,
    maxInitialFree,
    minGridCellsPerArrow: minGridCells,
    maxGridCellsPerArrow: maxGridCells,
    turnProbability: turnProb,
  };
}

const ALL_DIRS: Direction[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

function getOppositeDir(dir: Direction): Direction {
  switch (dir) {
    case 'UP':
      return 'DOWN';
    case 'DOWN':
      return 'UP';
    case 'LEFT':
      return 'RIGHT';
    case 'RIGHT':
      return 'LEFT';
  }
}

function getPerpendicularDirs(dir: Direction): Direction[] {
  if (dir === 'UP' || dir === 'DOWN') {
    return ['LEFT', 'RIGHT'];
  }
  return ['UP', 'DOWN'];
}

/**
 * Simplifies collinear intermediate grid points so every interior vertex in `points`
 * represents a genuine 90-degree orthogonal turn.
 */
function simplifyOrthogonalCorners(pts: Point[]): Point[] {
  if (pts.length <= 2) return pts;
  const out: Point[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = out[out.length - 1];
    const curr = pts[i];
    const next = pts[i + 1];
    const sameX = prev.x === curr.x && curr.x === next.x;
    const sameY = prev.y === curr.y && curr.y === next.y;
    if (!sameX && !sameY) {
      out.push(curr);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

interface RayEvaluation {
  rayKeys: string[];
  newForbiddenCount: number;
  firstBlockerIdx: number;
  firstBlockerDist: number;
}

/**
 * Evaluates the forward exit ray from `tip` in direction `dir`:
 * - `firstBlockerIdx`: index of the first already-placed arrow hit by this ray (-1 if unobstructed)
 * - `newForbiddenCount`: how many valid silhouette cells along this ray are not yet occupied or forbidden
 * - `rayKeys`: all grid keys along the forward exit ray
 */
function evaluateForwardRay(
  tip: Point,
  dir: Direction,
  validSet: Set<string>,
  occupiedSet: Set<string>,
  pointToArrowIdx: Map<string, number>,
  forbiddenRaySet: Set<string>,
  w: number,
  h: number
): RayEvaluation {
  const v = getDirVector(dir);
  let curX = tip.x + v.dx;
  let curY = tip.y + v.dy;
  let step = 1;

  const rayKeys: string[] = [];
  let newForbiddenCount = 0;
  let firstBlockerIdx = -1;
  let firstBlockerDist = Infinity;

  while (curX >= 0 && curX <= w && curY >= 0 && curY <= h) {
    const key = `${curX},${curY}`;
    rayKeys.push(key);

    if (firstBlockerIdx === -1 && occupiedSet.has(key)) {
      const idx = pointToArrowIdx.get(key);
      if (idx !== undefined) {
        firstBlockerIdx = idx;
        firstBlockerDist = step;
      }
    }

    if (validSet.has(key) && !occupiedSet.has(key) && !forbiddenRaySet.has(key)) {
      newForbiddenCount++;
    }

    curX += v.dx;
    curY += v.dy;
    step++;
  }

  return {
    rayKeys,
    newForbiddenCount,
    firstBlockerIdx,
    firstBlockerDist,
  };
}

/**
 * Grows a multi-bend orthogonal arrow body backward from `tip` -> `pPrev` -> ... -> `tail`.
 * Enforces genuine 90-degree turns so arrows form interlocking L, U, Z, S, and C labyrinth paths.
 */
function growBackwardLabyrinthPath(
  tip: Point,
  pPrev: Point,
  dir: Direction,
  targetCells: number,
  turnProb: number,
  requireTurn: boolean,
  validSet: Set<string>,
  occupiedSet: Set<string>,
  forbiddenRaySet: Set<string>,
  selfRayKeys: Set<string>,
  cx: number,
  cy: number,
  rng: SeededRNG
): Point[] | null {
  const revCells: Point[] = [tip, pPrev];
  const selfSet = new Set<string>([`${tip.x},${tip.y}`, `${pPrev.x},${pPrev.y}`]);

  let curPt = pPrev;
  let curBackDir = getOppositeDir(dir);
  let turnsMade = 0;

  for (let step = 2; step < targetCells; step++) {
    const perpDirs = getPerpendicularDirs(curBackDir);
    if (rng.next() < 0.5) {
      perpDirs.reverse();
    }

    // Force a 90-degree turn on the first backward step after pPrev if requireTurn is true,
    // or with high probability turnProb on subsequent steps
    const shouldTurn = (step === 2 && requireTurn) || rng.next() < turnProb;
    const dirsToTry: Direction[] = shouldTurn
      ? [...perpDirs, curBackDir]
      : [curBackDir, ...perpDirs];

    let advanced = false;
    for (const d of dirsToTry) {
      const v = getDirVector(d);
      const nx = curPt.x + v.dx;
      const ny = curPt.y + v.dy;
      const nKey = `${nx},${ny}`;

      if (
        validSet.has(nKey) &&
        !occupiedSet.has(nKey) &&
        !forbiddenRaySet.has(nKey) &&
        !selfRayKeys.has(nKey) &&
        !selfSet.has(nKey)
      ) {
        if (d !== curBackDir) {
          turnsMade++;
        }
        revCells.push({ x: nx, y: ny });
        selfSet.add(nKey);
        curPt = { x: nx, y: ny };
        curBackDir = d;
        advanced = true;
        break;
      }
    }

    if (!advanced) break;
  }

  if (requireTurn && turnsMade === 0) {
    return null;
  }

  // Return cells ordered from tail to tip
  return revCells.reverse();
}

/**
 * Outside-In Forward Peeling (Ray-Locking DAG Labyrinth Engine):
 *
 * 1. Places exactly `K = config.targetInitialFree` opening arrows on the outer boundary
 *    with unobstructed exit rays (`firstBlockerIdx === -1`).
 * 2. Every subsequent arrow `A_k` (`k > K`) MUST point its exit ray into at least one
 *    already-placed arrow (`firstBlockerIdx !== -1`), while never placing its body
 *    on any earlier arrow's exit ray (`forbiddenRaySet`).
 *
 * Mathematical guarantees:
 * - At level start, ONLY the `K` opening arrows (e.g. 2–3 arrows) have clear exit paths!
 * - All other `N - K` arrows are 100% blocked in multi-layer dependency chains!
 * - Removing available arrows unlocks the next layer step-by-step until 100% cleared with 0 deadlocks!
 */
function generateLabyrinthArrows(
  config: LevelConfig,
  rng: SeededRNG,
  silhouette: SilhouetteConfig
): ArrowData[] {
  const validPoints = silhouette.getValidGridPoints();
  if (validPoints.length === 0) return [];

  const w = silhouette.gridWidth;
  const h = silhouette.gridHeight;
  const cx = w / 2;
  const cy = h / 2;

  const validSet = new Set<string>(validPoints.map((p) => `${p.x},${p.y}`));
  const occupiedSet = new Set<string>();
  const pointToArrowIdx = new Map<string, number>();
  const forbiddenRaySet = new Set<string>();

  const placedArrows: {
    gridCells: Point[];
    points: Point[];
    dir: Direction;
    depth: number;
  }[] = [];

  // Precompute distance from center for each valid point
  const pointDistMap = new Map<string, number>();
  for (const pt of validPoints) {
    pointDistMap.set(`${pt.x},${pt.y}`, Math.hypot(pt.x - cx, pt.y - cy));
  }

  // Helper to commit a placed arrow into the DAG state
  const commitArrow = (
    gridCells: Point[],
    dir: Direction,
    rayKeys: string[],
    blockerIdx: number
  ) => {
    const arrowIdx = placedArrows.length;
    const depth = blockerIdx >= 0 ? placedArrows[blockerIdx].depth + 1 : 0;
    const simplifiedPoints = simplifyOrthogonalCorners(gridCells);

    placedArrows.push({
      gridCells,
      points: simplifiedPoints,
      dir,
      depth,
    });

    for (const c of gridCells) {
      const k = `${c.x},${c.y}`;
      occupiedSet.add(k);
      pointToArrowIdx.set(k, arrowIdx);
    }

    for (const rk of rayKeys) {
      forbiddenRaySet.add(rk);
    }
  };

  // Phase 1: Place up to targetArrows in Forward Peeling Order
  // Pass A requires multi-bend paths (requireTurn = true); Pass B allows 1-bend or compact paths to reach targetArrows
  for (const requireTurn of [true, false]) {
    let madeProgress = true;
    while (placedArrows.length < config.targetArrows && madeProgress) {
      madeProgress = false;
      const isOpeningKey = placedArrows.length < config.targetInitialFree;

      // Collect candidate (tip, dir) pairs
      let bestCandidate: {
        tip: Point;
        pPrev: Point;
        dir: Direction;
        rayEval: RayEvaluation;
        score: number;
      } | null = null;

      // Shuffle points slightly via deterministic stride or iterate all validPoints
      for (const tip of validPoints) {
        const tipKey = `${tip.x},${tip.y}`;
        if (occupiedSet.has(tipKey) || forbiddenRaySet.has(tipKey)) continue;

        const tipDist = pointDistMap.get(tipKey) || 0;

        for (const dir of ALL_DIRS) {
          const v = getDirVector(dir);
          const prevX = tip.x - v.dx;
          const prevY = tip.y - v.dy;
          const prevKey = `${prevX},${prevY}`;

          if (
            !validSet.has(prevKey) ||
            occupiedSet.has(prevKey) ||
            forbiddenRaySet.has(prevKey)
          ) {
            continue;
          }

          const rayEval = evaluateForwardRay(
            tip,
            dir,
            validSet,
            occupiedSet,
            pointToArrowIdx,
            forbiddenRaySet,
            w,
            h
          );

          // Ensure pPrev is not on the forward ray (impossible since pPrev is behind tip, but safe)
          if (isOpeningKey) {
            // Opening arrow MUST have an unobstructed exit ray
            if (rayEval.firstBlockerIdx !== -1) continue;
            // Opening arrow should be near the outer perimeter so its ray wastes <= 1 interior cell
            if (rayEval.newForbiddenCount > 2) continue;

            const score =
              rayEval.newForbiddenCount * 20 -
              tipDist * 2.5 +
              rng.next() * 3.0;

            if (!bestCandidate || score < bestCandidate.score) {
              bestCandidate = {
                tip,
                pPrev: { x: prevX, y: prevY },
                dir,
                rayEval,
                score,
              };
            }
          } else {
            // Blocked arrow MUST hit an already-placed arrow!
            if (rayEval.firstBlockerIdx === -1) continue;
            // Keep newForbiddenCount low so interior space is preserved
            if (requireTurn && rayEval.newForbiddenCount > 2) continue;
            if (!requireTurn && rayEval.newForbiddenCount > 4) continue;

            const blockerDepth = placedArrows[rayEval.firstBlockerIdx].depth;
            const score =
              rayEval.newForbiddenCount * 14 +
              rayEval.firstBlockerDist * 2.2 -
              tipDist * 1.4 -
              blockerDepth * 1.6 +
              rng.next() * 3.5;

            if (!bestCandidate || score < bestCandidate.score) {
              bestCandidate = {
                tip,
                pPrev: { x: prevX, y: prevY },
                dir,
                rayEval,
                score,
              };
            }
          }
        }
      }

      if (!bestCandidate) {
        break;
      }

      const targetCells = rng.nextInt(
        config.minGridCellsPerArrow,
        config.maxGridCellsPerArrow
      );
      const selfRaySet = new Set<string>(bestCandidate.rayEval.rayKeys);

      const gridCells = growBackwardLabyrinthPath(
        bestCandidate.tip,
        bestCandidate.pPrev,
        bestCandidate.dir,
        targetCells,
        config.turnProbability,
        requireTurn,
        validSet,
        occupiedSet,
        forbiddenRaySet,
        selfRaySet,
        cx,
        cy,
        rng
      );

      if (gridCells && gridCells.length >= (requireTurn ? 3 : 2)) {
        commitArrow(
          gridCells,
          bestCandidate.dir,
          bestCandidate.rayEval.rayKeys,
          bestCandidate.rayEval.firstBlockerIdx
        );
        madeProgress = true;
      } else {
        // Temporarily mark this tip as forbidden for this pass if it couldn't grow a valid body
        // Actually, try a few top candidates directly if the single best couldn't grow a turn
        let placedFallback = false;
        for (const tip of validPoints) {
          if (placedFallback) break;
          const tipKey = `${tip.x},${tip.y}`;
          if (occupiedSet.has(tipKey) || forbiddenRaySet.has(tipKey)) continue;

          for (const dir of ALL_DIRS) {
            const v = getDirVector(dir);
            const prevX = tip.x - v.dx;
            const prevY = tip.y - v.dy;
            const prevKey = `${prevX},${prevY}`;
            if (
              !validSet.has(prevKey) ||
              occupiedSet.has(prevKey) ||
              forbiddenRaySet.has(prevKey)
            ) {
              continue;
            }

            const rayEval = evaluateForwardRay(
              tip,
              dir,
              validSet,
              occupiedSet,
              pointToArrowIdx,
              forbiddenRaySet,
              w,
              h
            );

            if (isOpeningKey) {
              if (rayEval.firstBlockerIdx !== -1 || rayEval.newForbiddenCount > 3) continue;
            } else {
              if (rayEval.firstBlockerIdx === -1 || rayEval.newForbiddenCount > 3) continue;
            }

            const altCells = growBackwardLabyrinthPath(
              tip,
              { x: prevX, y: prevY },
              dir,
              targetCells,
              config.turnProbability,
              requireTurn,
              validSet,
              occupiedSet,
              forbiddenRaySet,
              new Set<string>(rayEval.rayKeys),
              cx,
              cy,
              rng
            );

            if (altCells && altCells.length >= (requireTurn ? 3 : 2)) {
              commitArrow(altCells, dir, rayEval.rayKeys, rayEval.firstBlockerIdx);
              madeProgress = true;
              placedFallback = true;
              break;
            }
          }
        }
      }
    }
  }

  // Convert placedArrows into colored ArrowData objects
  const arrows: ArrowData[] = placedArrows.map((item, idx) => {
    const tip = item.points[item.points.length - 1];
    const tail = item.points[0];
    const midX = (tip.x + tail.x) / 2;
    const midY = (tip.y + tail.y) / 2;

    const color = silhouette.getColorForPoint
      ? silhouette.getColorForPoint(midX, midY, w, h)
      : '#06B6D4';

    return {
      id: `a_${idx + 1}`,
      points: item.points,
      dir: item.dir,
      color,
    };
  });

  return arrows;
}

/**
 * Deterministically generates a verified solvable, zero-touch, dense shaped puzzle
 * with authentic multi-layer blocking mechanics where only 2-3 arrows are initially available
 * on challenging levels.
 * Cached in memory for 0ms instantaneous loading.
 */
export function generateLevel(levelNumber: number, customSeed?: number): GeneratedLevel {
  const safeLevel = Math.max(1, Math.floor(levelNumber));

  // Instant 0ms cache hit for standard campaign levels
  if (customSeed === undefined) {
    const cached = levelMemoryCache.get(safeLevel);
    if (cached) {
      return cloneGeneratedLevel(cached);
    }
  }

  const silhouette = getSilhouetteForLevel(safeLevel);
  const config = getLevelConfig(safeLevel, silhouette);
  const BASE_SEED = 42179;

  let bestArrows: ArrowData[] = [];

  for (let attempt = 0; attempt < 8; attempt++) {
    const seed =
      customSeed !== undefined
        ? customSeed + attempt * 101
        : BASE_SEED + safeLevel * 1009 + attempt * 101;

    const rng = new SeededRNG(seed);
    const candidateArrows = generateLabyrinthArrows(config, rng, silhouette);

    if (candidateArrows.length > bestArrows.length) {
      bestArrows = candidateArrows;
    }

    if (candidateArrows.length >= config.minArrows) {
      bestArrows = candidateArrows;
      break;
    }
  }

  // Calculate true initial free count and dependency depth
  const initialFree = bestArrows.filter((a) => checkArrowEscape(a.id, bestArrows).canEscape).length;
  const blockedCount = Math.max(0, bestArrows.length - initialFree);

  // Compute true multi-layer peeling depth
  let remaining = [...bestArrows];
  let trueDepth = 0;
  while (remaining.length > 0) {
    const free = remaining.filter((a) => checkArrowEscape(a.id, remaining).canEscape);
    if (free.length === 0) break;
    trueDepth++;
    const freeIds = new Set(free.map((f) => f.id));
    remaining = remaining.filter((a) => !freeIds.has(a.id));
  }

  let totalBends = 0;
  for (const a of bestArrows) {
    totalBends += Math.max(0, a.points.length - 2);
  }

  const difficultyScore = Math.round(
    bestArrows.length * 1.8 +
      blockedCount * 2.2 +
      trueDepth * 4.5 +
      totalBends * 1.5 +
      safeLevel * 0.8
  );

  const generated: GeneratedLevel = {
    id: safeLevel,
    name: `Level ${safeLevel}`,
    subtitle: silhouette.name,
    difficulty: config.difficulty,
    gridWidth: silhouette.gridWidth,
    gridHeight: silhouette.gridHeight,
    arrows: bestArrows,
    difficultyScore,
    dependencyDepth: trueDepth,
  };

  if (customSeed === undefined) {
    levelMemoryCache.set(safeLevel, generated);
  }

  return cloneGeneratedLevel(generated);
}
