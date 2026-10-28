import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ArrowData, Direction, Point, getDirVector } from '../game/logic';
import { getSlitherPoints } from '../game/slither';
import { GameTheme } from '../game/theme';

interface ArrowBoardProps {
  gridWidth: number;
  gridHeight: number;
  arrows: ArrowData[];
  animatingArrowId: string | null;
  animatingDirection: Direction | null;
  collidingArrowId: string | null;
  hintedArrowId: string | null;
  showGridDots: boolean;
  magnifierActive: boolean;
  onArrowClick: (arrowId: string) => void;
  shapeOutline?: string;
  theme?: GameTheme;
  isSnakeMode?: boolean;
}

/**
 * Vibrant 3D Cartoon Snake Color Palettes for Snake Arrow Mode
 */
const SNAKE_PALETTES = [
  { name: 'Emerald', body: '#10B981', dark: '#047857', light: '#34D399', specular: '#A7F3D0' },
  { name: 'Cyan',    body: '#06B6D4', dark: '#0E7490', light: '#38BDF8', specular: '#CFFAFE' },
  { name: 'Amber',   body: '#F59E0B', dark: '#B45309', light: '#FBBF24', specular: '#FEF3C7' },
  { name: 'Violet',  body: '#8B5CF6', dark: '#5B21B6', light: '#A78BFA', specular: '#F3E8FF' },
  { name: 'Rose',    body: '#F43F5E', dark: '#9F1239', light: '#FB7185', specular: '#FFE4E6' },
];

/**
 * Generates a smooth curved SVG path string for a multi-point snake.
 * Replaces sharp right-angle corners with smooth rounded arcs (radius r ~ 0.38).
 */
function getCurvedSnakePath(points: Point[], PAD_X: number, PAD_Y: number): string {
  if (points.length < 2) return '';
  const r = 0.38; // corner fillet radius

  let d = `M ${points[0].x + PAD_X} ${points[0].y + PAD_Y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const v1x = prev.x - curr.x;
    const v1y = prev.y - curr.y;
    const len1 = Math.hypot(v1x, v1y);

    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const len2 = Math.hypot(v2x, v2y);

    if (len1 < 1e-4 || len2 < 1e-4) {
      d += ` L ${curr.x + PAD_X} ${curr.y + PAD_Y}`;
      continue;
    }

    const clampedR = Math.min(r, len1 * 0.45, len2 * 0.45);

    const startX = curr.x + (v1x / len1) * clampedR + PAD_X;
    const startY = curr.y + (v1y / len1) * clampedR + PAD_Y;

    const endX = curr.x + (v2x / len2) * clampedR + PAD_X;
    const endY = curr.y + (v2y / len2) * clampedR + PAD_Y;

    d += ` L ${startX} ${startY}`;
    d += ` Q ${curr.x + PAD_X} ${curr.y + PAD_Y} ${endX} ${endY}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x + PAD_X} ${last.y + PAD_Y}`;

  return d;
}

export const ArrowBoard: React.FC<ArrowBoardProps> = ({
  gridWidth,
  gridHeight,
  arrows,
  animatingArrowId,
  animatingDirection,
  collidingArrowId,
  hintedArrowId,
  showGridDots,
  magnifierActive,
  onArrowClick,
  shapeOutline,
  theme,
  isSnakeMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation progress (0 to 1) for the escaping arrow/snake slithering along its track
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    if (!animatingArrowId) {
      setAnimProgress(0);
      return;
    }

    const DURATION = 320; // 320ms smooth exit
    const startTime = performance.now();
    let rafId: number;

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / DURATION);
      setAnimProgress(p);

      if (p < 1) {
        rafId = requestAnimationFrame(frame);
      }
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [animatingArrowId]);

  // Magnifier position (0 to 1 normalized)
  const [lensPos, setLensPos] = useState<{ x: number; y: number }>({ x: 0.68, y: 0.64 });
  const [isDraggingLens, setIsDraggingLens] = useState(false);

  // SVG viewBox coordinate space - strictly enforcing 3:4 portrait aspect ratio
  const PAD_X = 1.2;
  const PAD_Y = PAD_X * (4 / 3); // 1.6
  const vbWidth = gridWidth + PAD_X * 2;
  const vbHeight = gridHeight + PAD_Y * 2;

  // Grid dots
  const gridDots = useMemo(() => {
    const dots: Point[] = [];
    const step = 1;
    for (let x = 1; x <= gridWidth; x += step) {
      for (let y = 1; y <= gridHeight; y += step) {
        dots.push({ x, y });
      }
    }
    return dots;
  }, [gridWidth, gridHeight]);

  // Handle dragging the magnifying lens
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingLens || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const normX = Math.max(0.12, Math.min(0.88, (e.clientX - rect.left) / rect.width));
      const normY = Math.max(0.12, Math.min(0.88, (e.clientY - rect.top) / rect.height));
      setLensPos({ x: normX, y: normY });
    };

    const handlePointerUp = () => {
      setIsDraggingLens(false);
    };

    if (isDraggingLens) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingLens]);

  // Proportional stroke width
  const STROKE_WIDTH = useMemo(() => {
    return Math.max(0.12, (3.5 / 380) * vbWidth);
  }, [vbWidth]);

  // Classic Arrow Head dimensions
  const HEAD_LEN = STROKE_WIDTH * 2.55;
  const HEAD_HALF_WIDTH = STROKE_WIDTH * 1.36;
  const HITBOX_WIDTH = Math.max(0.75, 0.055 * vbWidth);
  const DOT_RADIUS = Math.max(0.045, (1.8 / 380) * vbWidth);

  // Shaft path generator for Classic Arrow Mode
  const getShaftPath = (points: Point[], dir: Direction): string => {
    if (points.length < 2) return '';
    const v = getDirVector(dir);
    const tip = points[points.length - 1];

    const stopOffset = HEAD_LEN - 0.02;
    const endX = tip.x + PAD_X - v.dx * stopOffset;
    const endY = tip.y + PAD_Y - v.dy * stopOffset;

    let d = `M ${points[0].x + PAD_X} ${points[0].y + PAD_Y}`;
    for (let i = 1; i < points.length - 1; i++) {
      d += ` L ${points[i].x + PAD_X} ${points[i].y + PAD_Y}`;
    }
    d += ` L ${endX} ${endY}`;
    return d;
  };

  // Triangular Arrowhead generator for Classic Arrow Mode
  const getArrowHeadPoints = (tip: Point, dir: Direction): string => {
    const v = getDirVector(dir);
    const perpX = -v.dy;
    const perpY = v.dx;

    const apexX = tip.x + PAD_X;
    const apexY = tip.y + PAD_Y;

    const baseCenterX = apexX - v.dx * HEAD_LEN;
    const baseCenterY = apexY - v.dy * HEAD_LEN;

    const w1X = baseCenterX + perpX * HEAD_HALF_WIDTH;
    const w1Y = baseCenterY + perpY * HEAD_HALF_WIDTH;

    const w2X = baseCenterX - perpX * HEAD_HALF_WIDTH;
    const w2Y = baseCenterY - perpY * HEAD_HALF_WIDTH;

    return `${apexX},${apexY} ${w1X},${w1Y} ${w2X},${w2Y}`;
  };

  // Pre-calculate static geometry for resting pieces
  const staticGeometries = useMemo(() => {
    const map = new Map<string, { shaftPath: string; headPoints: string; curvedSnakePath: string }>();
    for (const arrow of arrows) {
      const tip = arrow.points[arrow.points.length - 1];
      map.set(arrow.id, {
        shaftPath: getShaftPath(arrow.points, arrow.dir),
        headPoints: getArrowHeadPoints(tip, arrow.dir),
        curvedSnakePath: getCurvedSnakePath(arrow.points, PAD_X, PAD_Y),
      });
    }
    return map;
  }, [arrows, vbWidth, vbHeight, STROKE_WIDTH, HEAD_LEN, HEAD_HALF_WIDTH, PAD_X, PAD_Y]);

  // Render SVG representation of all pieces (Arrows OR 3D Snakes)
  const renderPiecesSvg = (isInsideMagnifier = false) => {
    const sorted = !animatingArrowId
      ? arrows
      : [...arrows].sort((a, b) => (a.id === animatingArrowId ? 1 : b.id === animatingArrowId ? -1 : 0));

    return sorted.map((arrow, idx) => {
      const isAnimating = arrow.id === animatingArrowId;
      const isColliding = arrow.id === collidingArrowId;
      const isHinted = arrow.id === hintedArrowId;
      const isSnakePiece = isSnakeMode || arrow.id.startsWith('snake_');

      if (isSnakePiece) {
        // --- 3D CARTOON SNAKE RENDERING ---
        let currentPoints = arrow.points;
        let currentDir = arrow.dir;

        if (isAnimating) {
          const slither = getSlitherPoints(arrow, animProgress, gridWidth, gridHeight);
          currentPoints = slither.points;
          currentDir = slither.dir;
        }

        const snakePath = isAnimating
          ? getCurvedSnakePath(currentPoints, PAD_X, PAD_Y)
          : staticGeometries.get(arrow.id)?.curvedSnakePath || getCurvedSnakePath(currentPoints, PAD_X, PAD_Y);

        const headTip = currentPoints[currentPoints.length - 1];
        const tailTip = currentPoints[0];

        // Snake palette selection
        const palIndex = Math.abs(
          arrow.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + idx
        ) % SNAKE_PALETTES.length;

        const basePal = SNAKE_PALETTES[palIndex];
        const pal = isColliding
          ? { name: 'RedAlert', body: '#F43F5E', dark: '#9F1239', light: '#FB7185', specular: '#FFE4E6' }
          : isHinted
          ? { name: 'HintGlow', body: '#38BDF8', dark: '#0284C7', light: '#7DD3FC', specular: '#E0F2FE' }
          : basePal;

        // Rotation angle for the snake head based on direction
        const headAngle =
          currentDir === 'UP'
            ? -90
            : currentDir === 'DOWN'
            ? 90
            : currentDir === 'LEFT'
            ? 180
            : 0;

        const snakeWidth = STROKE_WIDTH * 2.2;
        const outerWidth = STROKE_WIDTH * 2.9;
        const headRadiusX = STROKE_WIDTH * 2.4;
        const headRadiusY = STROKE_WIDTH * 2.0;

        return (
          <g
            key={arrow.id}
            id={`snake-${arrow.id}`}
            data-testid={`arrow-${arrow.id}`}
            onClick={(e) => {
              if (isAnimating) return;
              e.stopPropagation();
              onArrowClick(arrow.id);
            }}
            className={`cursor-pointer ${
              isColliding
                ? 'animate-shake'
                : !isAnimating
                ? 'hover:opacity-90 duration-150'
                : ''
            } ${isHinted ? 'animate-pulse-glow' : ''}`}
          >
            <defs>
              <linearGradient id={`snakeGrad_${arrow.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={pal.light} />
                <stop offset="60%" stopColor={pal.body} />
                <stop offset="100%" stopColor={pal.dark} />
              </linearGradient>
            </defs>

            {/* Invisible Tap Hitbox */}
            {!isInsideMagnifier && !isAnimating && (
              <path
                d={snakePath}
                fill="none"
                stroke="transparent"
                strokeWidth={HITBOX_WIDTH}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pointerEvents: 'stroke' }}
              />
            )}

            {/* Neon Glow for Hinted Snake */}
            {isHinted && (
              <path
                d={snakePath}
                fill="none"
                stroke="#38BDF8"
                strokeWidth={outerWidth + 0.16}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.75"
                style={{ pointerEvents: 'none' }}
              />
            )}

            {/* 1. Outer Dark Silhouette / 3D Shadow Layer */}
            <path
              d={snakePath}
              fill="none"
              stroke={pal.dark}
              strokeWidth={outerWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: 'none' }}
            />

            {/* 2. Main Glossy 3D Snake Body */}
            <path
              d={snakePath}
              fill="none"
              stroke={`url(#snakeGrad_${arrow.id})`}
              strokeWidth={snakeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: isAnimating ? 'none' : 'stroke' }}
            />

            {/* 3. Glossy Top Specular Highlight Line */}
            <path
              d={snakePath}
              fill="none"
              stroke={pal.specular}
              strokeWidth={STROKE_WIDTH * 0.65}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.65"
              style={{ pointerEvents: 'none' }}
            />

            {/* 4. Tapered Snake Tail Cap at start point */}
            <circle
              cx={tailTip.x + PAD_X}
              cy={tailTip.y + PAD_Y}
              r={snakeWidth * 0.45}
              fill={pal.dark}
              style={{ pointerEvents: 'none' }}
            />

            {/* 5. CUTE 3D CARTOON SNAKE HEAD at tip */}
            <g
              transform={`translate(${headTip.x + PAD_X}, ${headTip.y + PAD_Y}) rotate(${headAngle})`}
              style={{ pointerEvents: isAnimating ? 'none' : 'all' }}
            >
              {/* Head Base Outer Outline */}
              <ellipse
                cx="0"
                cy="0"
                rx={headRadiusX + 0.04}
                ry={headRadiusY + 0.04}
                fill={pal.dark}
              />

              {/* Head Gradient Base */}
              <ellipse
                cx="0"
                cy="0"
                rx={headRadiusX}
                ry={headRadiusY}
                fill={`url(#snakeGrad_${arrow.id})`}
              />

              {/* Head Glossy Reflection */}
              <ellipse
                cx={-headRadiusX * 0.25}
                cy={-headRadiusY * 0.25}
                rx={headRadiusX * 0.45}
                ry={headRadiusY * 0.45}
                fill="white"
                opacity="0.45"
              />

              {/* Left Eye */}
              <circle
                cx={headRadiusX * 0.25}
                cy={-headRadiusY * 0.55}
                r={headRadiusY * 0.45}
                fill="white"
                stroke={pal.dark}
                strokeWidth="0.01"
              />
              <circle
                cx={headRadiusX * 0.38}
                cy={-headRadiusY * 0.55}
                r={headRadiusY * 0.26}
                fill="#064E3B"
              />
              <circle
                cx={headRadiusX * 0.46}
                cy={-headRadiusY * 0.66}
                r={headRadiusY * 0.12}
                fill="white"
              />

              {/* Right Eye */}
              <circle
                cx={headRadiusX * 0.25}
                cy={headRadiusY * 0.55}
                r={headRadiusY * 0.45}
                fill="white"
                stroke={pal.dark}
                strokeWidth="0.01"
              />
              <circle
                cx={headRadiusX * 0.38}
                cy={headRadiusY * 0.55}
                r={headRadiusY * 0.26}
                fill="#064E3B"
              />
              <circle
                cx={headRadiusX * 0.46}
                cy={headRadiusY * 0.66}
                r={headRadiusY * 0.12}
                fill="white"
              />

              {/* Cute Smile / Mouth */}
              <path
                d={`M ${headRadiusX * 0.5} ${-headRadiusY * 0.2} Q ${headRadiusX * 0.75} 0 ${headRadiusX * 0.5} ${headRadiusY * 0.2}`}
                fill="none"
                stroke={pal.dark}
                strokeWidth="0.025"
                strokeLinecap="round"
              />

              {/* Directional Exit Arrow Badge on top of head */}
              <polygon
                points={`0,${-headRadiusY * 0.3} ${headRadiusX * 0.55},0 0,${headRadiusY * 0.3}`}
                fill="#FBBF24"
                stroke="#B45309"
                strokeWidth="0.015"
                opacity="0.9"
              />
            </g>
          </g>
        );
      }

      // --- CLASSIC ARROW RENDERING ---
      let shaftPath = '';
      let headPoints = '';

      if (isAnimating) {
        const slither = getSlitherPoints(arrow, animProgress, gridWidth, gridHeight);
        const tip = slither.points[slither.points.length - 1];
        shaftPath = getShaftPath(slither.points, slither.dir);
        headPoints = getArrowHeadPoints(tip, slither.dir);
      } else {
        const cached = staticGeometries.get(arrow.id);
        if (cached) {
          shaftPath = cached.shaftPath;
          headPoints = cached.headPoints;
        } else {
          const tip = arrow.points[arrow.points.length - 1];
          shaftPath = getShaftPath(arrow.points, arrow.dir);
          headPoints = getArrowHeadPoints(tip, arrow.dir);
        }
      }

      const color = isColliding
        ? '#EF4444'
        : isHinted
        ? theme?.arrowHintColor || '#0284C7'
        : theme?.arrowShaftColor || '#0F1935';

      const glowColor = theme?.arrowGlowColor || '#38BDF8';

      return (
        <g
          key={arrow.id}
          id={`arrow-${arrow.id}`}
          data-testid={`arrow-${arrow.id}`}
          onClick={(e) => {
            if (isAnimating) return;
            e.stopPropagation();
            onArrowClick(arrow.id);
          }}
          className={`cursor-pointer ${
            isColliding
              ? 'animate-shake'
              : !isAnimating
              ? 'hover:opacity-85 duration-150'
              : ''
          } ${isHinted ? 'animate-pulse-glow' : ''}`}
        >
          {/* Hitbox */}
          {!isInsideMagnifier && !isAnimating && (
            <path
              d={shaftPath}
              fill="none"
              stroke="transparent"
              strokeWidth={HITBOX_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: 'stroke' }}
            />
          )}

          {/* Neon Glow for Hinted Arrow */}
          {isHinted && (
            <>
              <path
                d={shaftPath}
                fill="none"
                stroke={glowColor}
                strokeWidth={STROKE_WIDTH + 0.12}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.65"
                style={{ pointerEvents: 'none' }}
              />
              <polygon
                points={headPoints}
                fill={glowColor}
                stroke={glowColor}
                strokeWidth="0.06"
                strokeLinejoin="round"
                opacity="0.65"
                style={{ pointerEvents: 'none' }}
              />
            </>
          )}

          {/* Arrow Line Shaft */}
          <path
            d={shaftPath}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pointerEvents: isAnimating ? 'none' : 'stroke' }}
          />

          {/* Triangular Arrowhead */}
          <polygon
            points={headPoints}
            fill={color}
            stroke={color}
            strokeWidth="0.015"
            strokeLinejoin="round"
            style={{ pointerEvents: isAnimating ? 'none' : 'all' }}
          />
        </g>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[390px] max-h-[68vh] aspect-[3/4] mx-auto flex items-center justify-center p-2 select-none"
      style={{ aspectRatio: '3 / 4' }}
    >
      <svg
        viewBox={`0 0 ${vbWidth} ${vbHeight}`}
        className="w-full h-full drop-shadow-xs overflow-visible"
        aria-label="Arrow Puzzle Board"
      >
        {shapeOutline && (
          <path
            d={shapeOutline}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="0.08"
            strokeDasharray="0.25 0.25"
            transform={`translate(${PAD_X}, ${PAD_Y}) scale(${gridWidth / 15})`}
          />
        )}

        {showGridDots &&
          gridDots.map((pt: Point) => (
            <circle
              key={`${pt.x}-${pt.y}`}
              cx={pt.x + PAD_X}
              cy={pt.y + PAD_Y}
              r={DOT_RADIUS}
              fill="#94A3B8"
              opacity="0.45"
            />
          ))}

        {renderPiecesSvg(false)}
      </svg>

      {magnifierActive && (
        <div
          role="region"
          aria-label="Magnifying Glass Tool"
          onPointerDown={() => setIsDraggingLens(true)}
          className="absolute z-20 w-36 h-36 rounded-full border-4 border-white shadow-2xl bg-white overflow-hidden cursor-move ring-2 ring-slate-200/60 backdrop-blur-sm pointer-events-auto"
          style={{
            left: `calc(${lensPos.x * 100}% - 72px)`,
            top: `calc(${lensPos.y * 100}% - 72px)`,
          }}
        >
          <div
            className="w-full h-full relative"
            style={{
              transform: `scale(2.2)`,
              transformOrigin: `${lensPos.x * 100}% ${lensPos.y * 100}%`,
            }}
          >
            <svg
              viewBox={`0 0 ${vbWidth} ${vbHeight}`}
              className="w-full h-full pointer-events-none"
            >
              {showGridDots &&
                gridDots.map((pt: Point) => (
                  <circle
                    key={`mag-${pt.x}-${pt.y}`}
                    cx={pt.x + PAD_X}
                    cy={pt.y + PAD_Y}
                    r={DOT_RADIUS}
                    fill="#94A3B8"
                    opacity="0.5"
                  />
                ))}
              {renderPiecesSvg(true)}
            </svg>
          </div>

          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/40 pointer-events-none" />
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-400 bg-white/90 px-2 py-0.5 rounded-full pointer-events-none shadow-xs">
            DRAG
          </div>
        </div>
      )}
    </div>
  );
};
