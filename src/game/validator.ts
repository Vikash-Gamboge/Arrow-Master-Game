import { ArrowData, Direction, Point, isPointOnSegment, checkArrowEscape } from './logic';
import { solvePuzzle, SolveResult } from './solver';
import {
  segmentsIntersect,
  segmentDistance,
  calculateDifficultyMetrics,
  DifficultyMetrics,
} from './geometry';

export interface ValidationReport {
  passed: boolean;
  errors: string[];
  solveResult: SolveResult;
  difficultyMetrics?: DifficultyMetrics;
}

/**
 * Validates a level against all geometric, spacing, boundary, and solvability requirements.
 * Enforces strict non-touching, non-intersecting geometry with dedicated visual clearance.
 */
export function validateLevel(
  arrows: ArrowData[],
  gridWidth: number,
  gridHeight: number
): ValidationReport {
  const errors: string[] = [];

  if (arrows.length === 0) {
    errors.push('Puzzle has no arrows');
    return {
      passed: false,
      errors,
      solveResult: { solvable: false, deadlock: true, solutionOrder: [], initialFreeCount: 0 },
    };
  }

  // 1. Boundary Check
  for (const arrow of arrows) {
    for (const p of arrow.points) {
      if (p.x < 0.2 || p.x > gridWidth - 0.2 || p.y < 0.2 || p.y > gridHeight - 0.2) {
        errors.push(`Arrow ${arrow.id} is out of bounds at (${p.x}, ${p.y})`);
      }
    }
  }

  // 2. Strict Non-Touching & Non-Intersecting Geometry Check
  const MIN_SEGMENT_CLEARANCE = 0.72; // Guaranteed clearance between any two arrow shafts

  for (let i = 0; i < arrows.length; i++) {
    const a1 = arrows[i];
    const tip1 = a1.points[a1.points.length - 1];

    for (let j = i + 1; j < arrows.length; j++) {
      const a2 = arrows[j];
      const tip2 = a2.points[a2.points.length - 1];

      // Check all segment pairs
      for (let s1 = 0; s1 < a1.points.length - 1; s1++) {
        const p1 = a1.points[s1];
        const p2 = a1.points[s1 + 1];

        for (let s2 = 0; s2 < a2.points.length - 1; s2++) {
          const q1 = a2.points[s2];
          const q2 = a2.points[s2 + 1];

          if (segmentsIntersect(p1, p2, q1, q2)) {
            errors.push(`Arrow ${a1.id} and ${a2.id} intersect each other`);
            break;
          }

          const dist = segmentDistance(p1, p2, q1, q2);
          if (dist < MIN_SEGMENT_CLEARANCE) {
            errors.push(
              `Arrows ${a1.id} and ${a2.id} are too close (${dist.toFixed(2)} < ${MIN_SEGMENT_CLEARANCE})`
            );
            break;
          }
        }
      }

      // Check arrowhead tip-to-tip clearance
      const tipTipDist = Math.hypot(tip1.x - tip2.x, tip1.y - tip2.y);
      if (tipTipDist < 0.75) {
        errors.push(`Arrowheads ${a1.id} and ${a2.id} are too close (${tipTipDist.toFixed(2)} < 0.75)`);
      }
    }
  }

  // 3. Arrowhead Touching/Clearance Check
  // Ensure no arrowhead touches the body of any other arrow
  for (let i = 0; i < arrows.length; i++) {
    const a1 = arrows[i];
    const tip1 = a1.points[a1.points.length - 1];

    for (let j = 0; j < arrows.length; j++) {
      if (i === j) continue;
      const a2 = arrows[j];

      for (let s = 0; s < a2.points.length - 1; s++) {
        if (isPointOnSegment(tip1.x, tip1.y, a2.points[s], a2.points[s + 1], 0.2)) {
          errors.push(`Arrowhead ${a1.id} is touching body of arrow ${a2.id}`);
        }
      }
    }
  }

  // 4. Direction & Geometry Consistency
  for (const arrow of arrows) {
    if (arrow.points.length < 2) {
      errors.push(`Arrow ${arrow.id} has fewer than 2 points`);
      continue;
    }
    const pPrev = arrow.points[arrow.points.length - 2];
    const pTip = arrow.points[arrow.points.length - 1];

    if (arrow.dir === 'RIGHT' && (pTip.x <= pPrev.x || Math.abs(pTip.y - pPrev.y) > 0.01)) {
      errors.push(`Arrow ${arrow.id} direction RIGHT does not match final segment`);
    } else if (arrow.dir === 'LEFT' && (pTip.x >= pPrev.x || Math.abs(pTip.y - pPrev.y) > 0.01)) {
      errors.push(`Arrow ${arrow.id} direction LEFT does not match final segment`);
    } else if (arrow.dir === 'DOWN' && (pTip.y <= pPrev.y || Math.abs(pTip.x - pPrev.x) > 0.01)) {
      errors.push(`Arrow ${arrow.id} direction DOWN does not match final segment`);
    } else if (arrow.dir === 'UP' && (pTip.y >= pPrev.y || Math.abs(pTip.x - pPrev.x) > 0.01)) {
      errors.push(`Arrow ${arrow.id} direction UP does not match final segment`);
    }
  }

  // 5. Complete Solvability Simulation
  const solveResult = solvePuzzle(arrows);

  if (!solveResult.solvable) {
    errors.push('Puzzle is not mathematically solvable to completion');
  }
  if (solveResult.deadlock) {
    errors.push('Puzzle contains a deadlock state');
  }
  if (solveResult.initialFreeCount < 1) {
    errors.push('Puzzle has zero valid opening moves');
  }

  const difficultyMetrics = calculateDifficultyMetrics(arrows);

  return {
    passed: errors.length === 0,
    errors,
    solveResult,
    difficultyMetrics,
  };
}
