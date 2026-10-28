export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Point {
  x: number;
  y: number;
}

export interface ArrowData {
  id: string;
  points: Point[]; // Sequence of grid points forming the arrow line
  dir: Direction;  // Direction of the arrowhead at the last point
}

export type Difficulty = 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Very Hard' | 'Expert' | 'Master';

export interface PuzzleLevel {
  id: number;
  name: string;
  subtitle: string;
  difficulty: Difficulty;
  gridWidth: number;
  gridHeight: number;
  arrows: ArrowData[];
  shapeOutline?: string; // Optional SVG path for decorative shape boundary (e.g. heart/leaf)
  difficultyScore?: number;
  dependencyDepth?: number;
}

/**
 * Returns direction vector for a Direction enum
 */
export function getDirVector(dir: Direction): { dx: number; dy: number } {
  switch (dir) {
    case 'UP':
      return { dx: 0, dy: -1 };
    case 'DOWN':
      return { dx: 0, dy: 1 };
    case 'LEFT':
      return { dx: -1, dy: 0 };
    case 'RIGHT':
      return { dx: 1, dy: 0 };
  }
}

/**
 * Checks if a point (px, py) lies on a segment between p1 and p2 (inclusive)
 * with small epsilon tolerance for float coordinates.
 */
export function isPointOnSegment(
  px: number,
  py: number,
  p1: Point,
  p2: Point,
  epsilon = 0.05
): boolean {
  const minX = Math.min(p1.x, p2.x) - epsilon;
  const maxX = Math.max(p1.x, p2.x) + epsilon;
  const minY = Math.min(p1.y, p2.y) - epsilon;
  const maxY = Math.max(p1.y, p2.y) + epsilon;

  if (px < minX || px > maxX || py < minY || py > maxY) {
    return false;
  }

  // If vertical segment
  if (Math.abs(p1.x - p2.x) < epsilon) {
    return Math.abs(px - p1.x) < epsilon;
  }
  // If horizontal segment
  if (Math.abs(p1.y - p2.y) < epsilon) {
    return Math.abs(py - p1.y) < epsilon;
  }

  const cross = (px - p1.x) * (p2.y - p1.y) - (py - p1.y) * (p2.x - p1.x);
  return Math.abs(cross) < epsilon;
}

/**
 * Checks if two orthogonal line segments overlap with each other along the same track.
 */
export function segmentsOverlap(
  s1a: Point,
  s1b: Point,
  s2a: Point,
  s2b: Point,
  epsilon = 0.08
): boolean {
  const s1IsVert = Math.abs(s1a.x - s1b.x) < epsilon;
  const s2IsVert = Math.abs(s2a.x - s2b.x) < epsilon;
  const s1IsHoriz = Math.abs(s1a.y - s1b.y) < epsilon;
  const s2IsHoriz = Math.abs(s2a.y - s2b.y) < epsilon;

  // Both vertical along the same x
  if (s1IsVert && s2IsVert && Math.abs(s1a.x - s2a.x) < epsilon) {
    const s1MinY = Math.min(s1a.y, s1b.y);
    const s1MaxY = Math.max(s1a.y, s1b.y);
    const s2MinY = Math.min(s2a.y, s2b.y);
    const s2MaxY = Math.max(s2a.y, s2b.y);

    const overlapStart = Math.max(s1MinY, s2MinY);
    const overlapEnd = Math.min(s1MaxY, s2MaxY);
    return overlapEnd - overlapStart > epsilon;
  }

  // Both horizontal along the same y
  if (s1IsHoriz && s2IsHoriz && Math.abs(s1a.y - s2a.y) < epsilon) {
    const s1MinX = Math.min(s1a.x, s1b.x);
    const s1MaxX = Math.max(s1a.x, s1b.x);
    const s2MinX = Math.min(s2a.x, s2b.x);
    const s2MaxX = Math.max(s2a.x, s2b.x);

    const overlapStart = Math.max(s1MinX, s2MinX);
    const overlapEnd = Math.min(s1MaxX, s2MaxX);
    return overlapEnd - overlapStart > epsilon;
  }

  return false;
}

/**
 * Verifies that no two arrows in a list share overlapping tracks.
 */
export function findOverlappingArrows(arrows: ArrowData[]): { a1: string; a2: string }[] {
  const overlaps: { a1: string; a2: string }[] = [];
  for (let i = 0; i < arrows.length; i++) {
    for (let j = i + 1; j < arrows.length; j++) {
      const a1 = arrows[i];
      const a2 = arrows[j];
      let hasOverlap = false;

      for (let s1 = 0; s1 < a1.points.length - 1; s1++) {
        for (let s2 = 0; s2 < a2.points.length - 1; s2++) {
          if (
            segmentsOverlap(
              a1.points[s1],
              a1.points[s1 + 1],
              a2.points[s2],
              a2.points[s2 + 1]
            )
          ) {
            hasOverlap = true;
            break;
          }
        }
        if (hasOverlap) break;
      }

      if (hasOverlap) {
        overlaps.push({ a1: a1.id, a2: a2.id });
      }
    }
  }
  return overlaps;
}

/**
 * Checks if an orthogonal ray starting at (originX, originY) and moving in `dir`
 * intersects segment p1 -> p2.
 * The ray starts strictly ahead: t > 0.05 (excluding the origin point itself).
 */
export function rayIntersectsSegment(
  originX: number,
  originY: number,
  dir: Direction,
  p1: Point,
  p2: Point,
  maxDistance = 100
): { hit: boolean; distance: number } {
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  const isVertical = Math.abs(p1.x - p2.x) < 0.05;
  const isHorizontal = Math.abs(p1.y - p2.y) < 0.05;

  if (dir === 'RIGHT') {
    if (isVertical) {
      if (originY >= minY - 0.05 && originY <= maxY + 0.05) {
        const dist = p1.x - originX;
        if (dist > 0.05 && dist <= maxDistance) {
          return { hit: true, distance: dist };
        }
      }
    } else if (isHorizontal) {
      if (Math.abs(originY - p1.y) < 0.05) {
        if (maxX > originX + 0.05) {
          const dist = Math.max(0.05, minX - originX);
          if (dist <= maxDistance) {
            return { hit: true, distance: dist };
          }
        }
      }
    }
  } else if (dir === 'LEFT') {
    if (isVertical) {
      if (originY >= minY - 0.05 && originY <= maxY + 0.05) {
        const dist = originX - p1.x;
        if (dist > 0.05 && dist <= maxDistance) {
          return { hit: true, distance: dist };
        }
      }
    } else if (isHorizontal) {
      if (Math.abs(originY - p1.y) < 0.05) {
        if (minX < originX - 0.05) {
          const dist = Math.max(0.05, originX - maxX);
          if (dist <= maxDistance) {
            return { hit: true, distance: dist };
          }
        }
      }
    }
  } else if (dir === 'DOWN') {
    if (isHorizontal) {
      if (originX >= minX - 0.05 && originX <= maxX + 0.05) {
        const dist = p1.y - originY;
        if (dist > 0.05 && dist <= maxDistance) {
          return { hit: true, distance: dist };
        }
      }
    } else if (isVertical) {
      if (Math.abs(originX - p1.x) < 0.05) {
        if (maxY > originY + 0.05) {
          const dist = Math.max(0.05, minY - originY);
          if (dist <= maxDistance) {
            return { hit: true, distance: dist };
          }
        }
      }
    }
  } else if (dir === 'UP') {
    if (isHorizontal) {
      if (originX >= minX - 0.05 && originX <= maxX + 0.05) {
        const dist = originY - p1.y;
        if (dist > 0.05 && dist <= maxDistance) {
          return { hit: true, distance: dist };
        }
      }
    } else if (isVertical) {
      if (Math.abs(originX - p1.x) < 0.05) {
        if (minY < originY - 0.05) {
          const dist = Math.max(0.05, originY - maxY);
          if (dist <= maxDistance) {
            return { hit: true, distance: dist };
          }
        }
      }
    }
  }

  return { hit: false, distance: Infinity };
}

/**
 * Checks if an arrow's forward path to freedom is blocked by ANY other active arrow.
 */
export function checkArrowEscape(
  arrowId: string,
  arrows: ArrowData[],
  maxDistance = 100
): { canEscape: boolean; blockerId?: string; distance?: number } {
  const arrow = arrows.find(a => a.id === arrowId);
  if (!arrow || arrow.points.length < 2) {
    return { canEscape: false };
  }

  const tip = arrow.points[arrow.points.length - 1];
  let minHitDist = Infinity;
  let nearestBlockerId: string | undefined = undefined;

  for (const other of arrows) {
    if (other.id === arrowId) continue;

    for (let i = 0; i < other.points.length - 1; i++) {
      const p1 = other.points[i];
      const p2 = other.points[i + 1];
      const res = rayIntersectsSegment(tip.x, tip.y, arrow.dir, p1, p2, maxDistance);
      if (res.hit && res.distance < minHitDist) {
        minHitDist = res.distance;
        nearestBlockerId = other.id;
      }
    }
  }

  if (nearestBlockerId) {
    return { canEscape: false, blockerId: nearestBlockerId, distance: minHitDist };
  }

  return { canEscape: true };
}

/**
 * Finds all arrows that are currently free to escape without hitting any blocker.
 */
export function getFreeArrows(arrows: ArrowData[]): ArrowData[] {
  return arrows.filter(arrow => checkArrowEscape(arrow.id, arrows).canEscape);
}

/**
 * Verifies if a puzzle is solvable (by iteratively removing free arrows).
 */
export function isLevelSolvable(initialArrows: ArrowData[]): boolean {
  let remaining = [...initialArrows];
  while (remaining.length > 0) {
    const free = getFreeArrows(remaining);
    if (free.length === 0) {
      return false;
    }
    // Remove the first free arrow and repeat
    remaining = remaining.filter(a => a.id !== free[0].id);
  }
  return true;
}
