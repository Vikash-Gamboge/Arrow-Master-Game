import { ArrowData, Direction, Point, getDirVector } from './logic';

/**
 * Calculates the exact sub-polyline and arrowhead direction for an arrow
 * slithering along its real polyline track (including all 90-degree corners).
 *
 * As the arrow moves forward, its tail and head follow the exact path vertices
 * in sequence, preserving every corner and bend until the entire arrow has
 * cleanly exited the board.
 */
export function getSlitherPoints(
  arrow: ArrowData,
  progress: number, // 0 to 1
  gridWidth: number,
  gridHeight: number
): { points: Point[]; dir: Direction } {
  if (arrow.points.length < 2) {
    return { points: arrow.points, dir: arrow.dir };
  }

  const origPoints = arrow.points;
  const tip = origPoints[origPoints.length - 1];
  const v = getDirVector(arrow.dir);

  // Calculate distance from tip to outer board boundary in direction `arrow.dir`
  let distToBoundary = 0;
  if (arrow.dir === 'UP') {
    distToBoundary = tip.y + 1.5;
  } else if (arrow.dir === 'DOWN') {
    distToBoundary = (gridHeight + 1.5) - tip.y;
  } else if (arrow.dir === 'LEFT') {
    distToBoundary = tip.x + 1.5;
  } else if (arrow.dir === 'RIGHT') {
    distToBoundary = (gridWidth + 1.5) - tip.x;
  }
  distToBoundary = Math.max(3, distToBoundary);

  // Total original arrow length
  let arrowLen = 0;
  const origSegLengths: number[] = [];
  for (let i = 0; i < origPoints.length - 1; i++) {
    const d = Math.hypot(
      origPoints[i + 1].x - origPoints[i].x,
      origPoints[i + 1].y - origPoints[i].y
    );
    origSegLengths.push(d);
    arrowLen += d;
  }

  // Total travel distance so the entire tail clears the board plus safety margin
  const totalTravelDist = distToBoundary + arrowLen + 1.5;

  // Extended exit endpoint
  const exitPoint: Point = {
    x: tip.x + v.dx * (totalTravelDist + 4),
    y: tip.y + v.dy * (totalTravelDist + 4),
  };

  // Complete track: original vertices + extended exit segment
  const track: Point[] = [...origPoints, exitPoint];

  // Cumulative distances along complete track
  const segLengths: number[] = [];
  const cumDist: number[] = [0];
  let totalTrackLen = 0;

  for (let i = 0; i < track.length - 1; i++) {
    const d = Math.hypot(
      track[i + 1].x - track[i].x,
      track[i + 1].y - track[i].y
    );
    segLengths.push(d);
    totalTrackLen += d;
    cumDist.push(totalTrackLen);
  }

  // Smooth acceleration curve: snappy and responsive
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const eased = clampedProgress * clampedProgress * 0.35 + clampedProgress * 0.65;
  const currentTravel = eased * totalTravelDist;

  const tailDist = currentTravel;
  const headDist = currentTravel + arrowLen;

  const getPointAndDirAt = (dist: number): { point: Point; dir: Direction } => {
    if (dist <= 0) {
      return {
        point: { ...track[0] },
        dir: getSegmentDir(track[0], track[1]),
      };
    }
    if (dist >= totalTrackLen) {
      return {
        point: { ...track[track.length - 1] },
        dir: arrow.dir,
      };
    }

    for (let i = 0; i < segLengths.length; i++) {
      if (dist <= cumDist[i + 1] || i === segLengths.length - 1) {
        const segLen = segLengths[i];
        const frac = segLen > 0 ? (dist - cumDist[i]) / segLen : 0;
        const clampedFrac = Math.max(0, Math.min(1, frac));
        const p1 = track[i];
        const p2 = track[i + 1];
        return {
          point: {
            x: p1.x + clampedFrac * (p2.x - p1.x),
            y: p1.y + clampedFrac * (p2.y - p1.y),
          },
          dir: getSegmentDir(p1, p2),
        };
      }
    }

    return { point: track[track.length - 1], dir: arrow.dir };
  };

  const headInfo = getPointAndDirAt(headDist);
  const tailInfo = getPointAndDirAt(tailDist);

  const newPoints: Point[] = [tailInfo.point];

  // Include all original intermediate track corners strictly between tailDist and headDist
  for (let i = 1; i < track.length - 1; i++) {
    const ptDist = cumDist[i];
    if (ptDist > tailDist + 0.05 && ptDist < headDist - 0.05) {
      newPoints.push({ ...track[i] });
    }
  }

  newPoints.push(headInfo.point);

  // Simplify any redundant collinear points along straight segments
  return {
    points: simplifyCollinear(newPoints),
    dir: headInfo.dir,
  };
}

function simplifyCollinear(pts: Point[]): Point[] {
  if (pts.length <= 2) return pts;
  const result: Point[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = pts[i];
    const next = pts[i + 1];

    const isCollinearX = Math.abs(prev.x - curr.x) < 0.005 && Math.abs(curr.x - next.x) < 0.005;
    const isCollinearY = Math.abs(prev.y - curr.y) < 0.005 && Math.abs(curr.y - next.y) < 0.005;

    if (!isCollinearX && !isCollinearY) {
      result.push(curr);
    }
  }
  result.push(pts[pts.length - 1]);
  return result;
}

function getSegmentDir(p1: Point, p2: Point): Direction {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'RIGHT' : 'LEFT';
  } else {
    return dy > 0 ? 'DOWN' : 'UP';
  }
}
