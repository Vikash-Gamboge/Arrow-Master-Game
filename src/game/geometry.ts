import { Point, Direction, ArrowData, getDirVector, checkArrowEscape } from './logic';

/**
 * Calculates Euclidean distance from a point (px, py) to a 2D line segment (x1, y1)-(x2, y2).
 */
export function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq < 1e-6) {
    return Math.hypot(px - x1, py - y1);
  }

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

/**
 * Determines whether two 2D line segments intersect/cross each other.
 */
export function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  // Bounding box pre-check
  if (
    Math.max(p1.x, p2.x) < Math.min(p3.x, p4.x) - 1e-4 ||
    Math.min(p1.x, p2.x) > Math.max(p3.x, p4.x) + 1e-4 ||
    Math.max(p1.y, p2.y) < Math.min(p3.y, p4.y) - 1e-4 ||
    Math.min(p1.y, p2.y) > Math.max(p3.y, p4.y) + 1e-4
  ) {
    return false;
  }

  const ccw = (a: Point, b: Point, c: Point) =>
    (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);

  return (
    ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
    ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  );
}

/**
 * Calculates the exact minimum Euclidean distance between two 2D line segments.
 * Returns 0 if they intersect.
 */
export function segmentDistance(p1: Point, p2: Point, p3: Point, p4: Point): number {
  if (segmentsIntersect(p1, p2, p3, p4)) {
    return 0;
  }
  return Math.min(
    pointToSegmentDistance(p1.x, p1.y, p3.x, p3.y, p4.x, p4.y),
    pointToSegmentDistance(p2.x, p2.y, p3.x, p3.y, p4.x, p4.y),
    pointToSegmentDistance(p3.x, p3.y, p1.x, p1.y, p2.x, p2.y),
    pointToSegmentDistance(p4.x, p4.y, p1.x, p1.y, p2.x, p2.y)
  );
}

/**
 * Calculates the minimum distance between any segment of arrow A and any segment of arrow B.
 * Uses bounding-box pre-filter for high performance.
 */
export function arrowDistance(a1: ArrowData, a2: ArrowData): number {
  let minX1 = Infinity, maxX1 = -Infinity, minY1 = Infinity, maxY1 = -Infinity;
  for (const p of a1.points) {
    if (p.x < minX1) minX1 = p.x;
    if (p.x > maxX1) maxX1 = p.x;
    if (p.y < minY1) minY1 = p.y;
    if (p.y > maxY1) maxY1 = p.y;
  }
  let minX2 = Infinity, maxX2 = -Infinity, minY2 = Infinity, maxY2 = -Infinity;
  for (const p of a2.points) {
    if (p.x < minX2) minX2 = p.x;
    if (p.x > maxX2) maxX2 = p.x;
    if (p.y < minY2) minY2 = p.y;
    if (p.y > maxY2) maxY2 = p.y;
  }

  const dx = Math.max(0, Math.max(minX1 - maxX2, minX2 - maxX1));
  const dy = Math.max(0, Math.max(minY1 - maxY2, minY2 - maxY1));
  const bboxDist = Math.hypot(dx, dy);
  if (bboxDist >= 0.85) {
    return bboxDist;
  }

  let minDist = Infinity;
  for (let i = 0; i < a1.points.length - 1; i++) {
    for (let j = 0; j < a2.points.length - 1; j++) {
      const d = segmentDistance(
        a1.points[i],
        a1.points[i + 1],
        a2.points[j],
        a2.points[j + 1]
      );
      if (d < minDist) {
        minDist = d;
      }
      if (minDist === 0) return 0;
    }
  }
  return minDist;
}

export interface DifficultyMetrics {
  score: number;
  arrowCount: number;
  initialFree: number;
  initiallyBlocked: number;
  turns: number;
  maxChainDepth: number;
}

/**
 * Computes an objective, measurable difficulty score for an arrow puzzle.
 * Uses:
 * - Number of arrows
 * - Number of path turns
 * - Maximum dependency-chain depth (layers of cascading removals)
 * - Number of arrows initially blocked
 */
export function calculateDifficultyMetrics(arrows: ArrowData[]): DifficultyMetrics {
  const arrowCount = arrows.length;
  if (arrowCount === 0) {
    return {
      score: 0,
      arrowCount: 0,
      initialFree: 0,
      initiallyBlocked: 0,
      turns: 0,
      maxChainDepth: 0,
    };
  }

  let turns = 0;
  for (const a of arrows) {
    turns += Math.max(0, a.points.length - 2);
  }

  // Simulate forward layers of clearing to compute dependency chain depth
  let remaining = [...arrows];
  let depth = 0;
  let initialFree = 0;

  while (remaining.length > 0) {
    const free = remaining.filter((a) => checkArrowEscape(a.id, remaining).canEscape);
    if (free.length === 0) break;
    if (depth === 0) {
      initialFree = free.length;
    }
    depth++;
    const freeIds = new Set(free.map((f) => f.id));
    remaining = remaining.filter((a) => !freeIds.has(a.id));
  }

  const initiallyBlocked = arrowCount - initialFree;

  // Calibrated score formula:
  // Level 1: ~1-3
  // Level 10: ~10-15
  // Level 25: ~25-35
  // Level 50: ~50-65
  // Level 100: ~100-120
  // Level 200: ~180-220
  const rawScore =
    arrowCount * 1.6 +
    depth * 4.0 +
    initiallyBlocked * 1.8 +
    turns * 1.2;

  const score = Math.max(1, Math.round(rawScore));

  return {
    score,
    arrowCount,
    initialFree,
    initiallyBlocked,
    turns,
    maxChainDepth: depth,
  };
}
