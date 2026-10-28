import { Point } from './logic';

export type SilhouetteType =
  | 'compact-portrait'
  | 'tall-pillar'
  | 'diamond'
  | 'triangle'
  | 'cross-plus'
  | 'staircase-zigzag'
  | 'donut-ring'
  | 'pinwheel-spiral'
  | 'asymmetric-t'
  | 'asymmetric-l'
  | 'hexagon-shield'
  | 'oval-arch';

export interface SilhouetteConfig {
  type: SilhouetteType;
  name: string;
  subtitle: string;
  gridWidth: number;
  gridHeight: number;
  isInside: (x: number, y: number) => boolean;
  getValidGridPoints: () => Point[];
  shapeOutlineSvg?: string;
}

/**
 * Returns a deterministic, visually distinct silhouette configuration for any level.
 * STRICT REQUIREMENT: Every board is strictly a portrait 3:4 aspect ratio (gridWidth:gridHeight = 3:4).
 * Never generates landscape/horizontal boards.
 * Higher arrow counts scale dimensions proportionally: 9x12, 12x16, 15x20, 18x24, 21x28, 24x32.
 */
export function getSilhouetteForLevel(levelNumber: number): SilhouetteConfig {
  const safeLevel = Math.max(1, Math.floor(levelNumber));

  // Sequence of 12 distinct silhouettes designed specifically for portrait 3:4 aspect ratio
  const silhouetteCycle: SilhouetteType[] = [
    'compact-portrait', // 1: Clean 3:4 portrait grid
    'oval-arch',        // 2: Rounded portrait arch
    'tall-pillar',      // 3: Tall vertical pillar with side wings
    'diamond',          // 4: Portrait rhombus
    'triangle',         // 5: Pyramid peak
    'cross-plus',       // 6: Wide-armed cross
    'staircase-zigzag', // 7: Stepped diagonal cascade
    'donut-ring',       // 8: Oval perimeter ring
    'pinwheel-spiral',  // 9: Spiral vortex
    'asymmetric-t',     // 10: T-Junction
    'asymmetric-l',     // 11: L-Corridor
    'hexagon-shield',   // 12: Hexagonal crest
  ];

  const type = silhouetteCycle[(safeLevel - 1) % silhouetteCycle.length];

  // Proportional scale factor k where width = 3 * k and height = 4 * k (Strict 3:4 ratio):
  // Levels 1-4: k = 3 -> 9x12 (holds 12-15 arrows comfortably with spacious clearance)
  // Levels 5-15: k = 4 -> 12x16 (holds 16-26 arrows)
  // Levels 16-30: k = 5 -> 15x20 (holds 27-42 arrows)
  // Levels 31-50: k = 6 -> 18x24 (holds 43-60 arrows)
  // Levels 51-100: k = 7 -> 21x28 (holds 61-85 arrows)
  // Levels 101+: k = 8 -> 24x32 (holds 86-120 arrows)
  let k = 3;
  if (safeLevel <= 4) {
    k = 3; // 9x12
  } else if (safeLevel <= 15) {
    k = 4; // 12x16
  } else if (safeLevel <= 30) {
    k = 5; // 15x20
  } else if (safeLevel <= 50) {
    k = 6; // 18x24
  } else if (safeLevel <= 100) {
    k = 7; // 21x28
  } else {
    k = 8; // 24x32
  }

  const w = 3 * k;
  const h = 4 * k;
  const cx = w / 2;
  const cy = h / 2;

  switch (type) {
    case 'tall-pillar': {
      // Slender vertical pillar with side wings centered inside 3:4 portrait
      const pillarHalfW = Math.max(2.5, Math.floor(w * 0.38));
      const isInside = (x: number, y: number) => {
        if (x < 1 || x > w - 1 || y < 1 || y > h - 1) return false;
        return Math.abs(x - cx) <= pillarHalfW;
      };
      return {
        type,
        name: 'Vertical Pillar',
        subtitle: 'Tall Portrait Structure',
        gridWidth: w,
        gridHeight: h,
        isInside,
        getValidGridPoints: () => collectPoints(w, h, isInside),
      };
    }

    case 'oval-arch': {
      // Arch / rounded capsule in portrait 3:4
      const rx = w * 0.46;
      const ry = h * 0.46;
      const isInside = (x: number, y: number) => {
        if (x < 1 || x > w - 1 || y < 1 || y > h - 1) return false;
        // Upper dome + lower body
        if (y < cy) {
          const dx = (x - cx) / rx;
          const dy = (y - cy) / ry;
          return dx * dx + dy * dy <= 1.05;
        }
        return true;
      };
      return {
        type,
        name: 'Arched Portal',
        subtitle: 'Rounded Vault Silhouette',
        gridWidth: w,
        gridHeight: h,
        isInside,
        getValidGridPoints: () => collectPoints(w, h, isInside),
      };
    }

    case 'diamond': {
      // Diamond rhombus scaled to 3:4 portrait
      const rx = w * 0.48;
      const ry = h * 0.48;
      const isInside = (x: number, y: number) => {
        if (x < 1 || x > w - 1 || y < 1 || y > h - 1) return false;
        const dist = Math.abs(x - cx) / rx + Math.abs(y - cy) / ry;
        return dist <= 1.15;
      };
      return {
        type,
        name: 'Diamond Nexus',
        subtitle: 'Rhombus Portrait Formation',
        gridWidth: w,
        gridHeight: h,
        isInside,
        getValidGridPoints: () => collectPoints(w, h, isInside),
      };
    }

    case 'triangle': {
      // Pyramid peak tapering upwards inside 3:4 portrait
      const isInside = (x: number, y: number) => {
        if (x < 1 || x > w - 1 || y < 1 || y > h - 1) return false;
        const halfWidthAtY = 1.0 + ((y - 0.5) / (h - 1)) * (w * 0.46);
        return Math.abs(x - cx) <= halfWidthAtY;
      };
      return {
        type,
        name: 'Pyramid Peak',
        subtitle: 'Triangular Formation',
        gridWidth: w,
        gridHeight: h,
        isInside,
        getValidGridPoints: () => collectPoints(w, h, isInside),
      };
    }

    case 'cross-plus': {
      // Plus / Cross with wide arms in portrait 3:4
      const armX = Math.max(2, Math.floor(w * 0.32));
      const armY = Math.max(2, Math.floor(h * 0.28));
      const isInside = (x: number, y: number) => {
        if (x < 1 || x > w - 1 || y < 1 || y > h - 1) return false;
        const inHoriz = Math.abs(y - cy) <= armY;
        const inVert = Math.abs(x - cx) <= armX;
        return inHoriz || inVert;
      };
      return {
        type,
        name: 'Crossroads Matrix',
        subtitle: 'Plus-Shaped Geometric Maze',
        gridWidth: w,
        gridHeight: h,
        isInside,
        getValidGridPoints: () => collectPoints(w, h, isInside),
      };
    }

    case 'staircase-zigzag': {
      // Diagonal stepped corridor inside 3:4 portrait
      const isInside = (x: number, y: number) => {
        if (x < 1 || x > w - 1 || y < 1 || y > h - 1) return false;
        const normX = x / w;
        const normY = y / h;
        return Math.abs(normY - normX) <= 0.42;
      };
      return {
        type,
        name: 'Staircase Cascade',
        subtitle: 'Zigzag Stepped Labyrinth',
        gridWidth: w,
        gridHeight: h,
        isInside,
        getValidGridPoints: () => collectPoints(w, h, isInside),
      };
    }

    case 'donut-ring': {
      // Oval hollow ring perimeter in 3:4 portrait
      const holeW = Math.max(1.5, w * 0.18);
      const holeH = Math.max(2, h * 0.18);
      const isInside = (x: number, y: number) => {
        if (x < 1 || x > w - 1 || y < 1 || y > h - 1) return false;
        const inHole = Math.abs(x - cx) < holeW && Math.abs(y - cy) < holeH;
        return !inHole;
      };
      return {
        type,
        name: 'Hollow Courtyard',
        subtitle: 'Perimeter Ring Formation',
        gridWidth: w,
        gridHeight: h,
        isInside,
        getValidGridPoints: () => collectPoints(w, h, isInside),
      };
    }

    case 'pinwheel-spiral': {
      // Swirling arrangement inside 3:4 portrait
      const armW = Math.max(2, Math.floor(w * 0.26));
      const isInside = (x: number, y: number) => {
        if (x < 1 || x > w - 1 || y < 1 || y > h - 1) return false;
        // Central hub
        if (Math.abs(x - cx) <= armW && Math.abs(y - cy) <= armW) return true;
        // 4 arms
        const topArm = y <= cy && x >= cx - 1 && x <= w - 2;
        const rightArm = x >= cx && y >= cy - 1 && y <= h - 2;
        const bottomArm = y >= cy && x >= 2 && x <= cx + 1;
        const leftArm = x <= cx && y >= 2 && y <= cy + 1;
        return topArm || rightArm || bottomArm || leftArm;
      };
      return {
        type,
        name: 'Spiral Vortex',
        subtitle: 'Pinwheel Swirling Arrangement',
        gridWidth: w,
        gridHeight: h,
        isInside,
        getValidGridPoints: () => collectPoints(w, h, isInside),
      };
    }

    case 'asymmetric-t': {
      // T-junction inside 3:4 portrait
      const stemHalf = Math.max(2, Math.floor(w * 0.30));
      const topBarH = Math.max(3, Math.floor(h * 0.36));
      const isInside = (x: number, y: number) => {
        if (x < 1 || x > w - 1 || y < 1 || y > h - 1) return false;
        const inTopBar = y <= topBarH;
        const inStem = Math.abs(x - cx) <= stemHalf;
        return inTopBar || inStem;
      };
      return {
        type,
        name: 'T-Junction',
        subtitle: 'T-Shaped Branching Maze',
        gridWidth: w,
        gridHeight: h,
        isInside,
        getValidGridPoints: () => collectPoints(w, h, isInside),
      };
    }

    case 'asymmetric-l': {
      // L-corridor inside 3:4 portrait
      const leftColW = Math.max(3, Math.floor(w * 0.42));
      const bottomBarH = Math.max(3, Math.floor(h * 0.38));
      const isInside = (x: number, y: number) => {
        if (x < 1 || x > w - 1 || y < 1 || y > h - 1) return false;
        const inLeftCol = x <= leftColW;
        const inBottomBar = y >= h - bottomBarH;
        return inLeftCol || inBottomBar;
      };
      return {
        type,
        name: 'L-Corridor',
        subtitle: 'Asymmetric Corner Path',
        gridWidth: w,
        gridHeight: h,
        isInside,
        getValidGridPoints: () => collectPoints(w, h, isInside),
      };
    }

    case 'hexagon-shield': {
      // Hexagonal crest shield inside 3:4 portrait
      const rx = w * 0.50;
      const ry = h * 0.50;
      const isInside = (x: number, y: number) => {
        if (x < 1 || x > w - 1 || y < 1 || y > h - 1) return false;
        const dx = Math.abs(x - cx) / rx;
        const dy = Math.abs(y - cy) / ry;
        return dx + dy <= 1.45;
      };
      return {
        type,
        name: 'Hexagonal Shield',
        subtitle: 'Crest Geometric Silhouette',
        gridWidth: w,
        gridHeight: h,
        isInside,
        getValidGridPoints: () => collectPoints(w, h, isInside),
      };
    }

    case 'compact-portrait':
    default: {
      // Clean 3:4 portrait rectangle
      const isInside = (x: number, y: number) =>
        x >= 1 && x <= w - 1 && y >= 1 && y <= h - 1;
      return {
        type: 'compact-portrait',
        name: 'Portrait Matrix',
        subtitle: 'Classic 3:4 Grid',
        gridWidth: w,
        gridHeight: h,
        isInside,
        getValidGridPoints: () => collectPoints(w, h, isInside),
      };
    }
  }
}

function collectPoints(
  width: number,
  height: number,
  isInside: (x: number, y: number) => boolean
): Point[] {
  const pts: Point[] = [];
  for (let x = 1; x < width; x++) {
    for (let y = 1; y < height; y++) {
      if (isInside(x, y)) {
        pts.push({ x, y });
      }
    }
  }
  return pts;
}
