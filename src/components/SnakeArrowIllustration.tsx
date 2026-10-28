import React, { useState } from 'react';
import { sound } from '../game/sound';

interface SnakeArrowIllustrationProps {
  onTapToPlay?: () => void;
}

export const SnakeArrowIllustration: React.FC<SnakeArrowIllustrationProps> = ({
  onTapToPlay,
}) => {
  const [activeTapId, setActiveTapId] = useState<string | null>(null);
  const [escaped, setEscaped] = useState(false);

  // Handle tapping on arrows in the illustration for tactile discovery
  const handleArrowTap = (id: string, isFree: boolean) => {
    setActiveTapId(id);
    if (isFree) {
      sound.playSlide();
      setEscaped(true);
      setTimeout(() => {
        setEscaped(false);
      }, 1200);
    } else {
      sound.playBump();
      setTimeout(() => {
        setActiveTapId(null);
      }, 350);
    }
  };

  // Generate background dot matrix (16 cols x 10 rows)
  const dots: { cx: number; cy: number }[] = [];
  for (let x = 20; x <= 300; x += 20) {
    for (let y = 20; y <= 180; y += 20) {
      dots.push({ cx: x, cy: y });
    }
  }

  return (
    <div
      role="region"
      aria-label="Interactive Snake Arrow Puzzle Illustration"
      className="relative w-full aspect-[16/10] max-w-[320px] mx-auto rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/90 border border-slate-200/90 p-2 shadow-inner select-none overflow-hidden cursor-pointer"
      onClick={() => {
        if (!escaped) {
          handleArrowTap('free-snake', true);
        }
      }}
    >
      <svg
        viewBox="0 0 320 200"
        className="w-full h-full drop-shadow-xs"
        aria-hidden="true"
      >
        <defs>
          {/* Subtle linear gradients for dark navy arrows */}
          <linearGradient id="navyShaft" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Electric Cyan gradient for the free escaping arrow */}
          <linearGradient id="cyanEscapeShaft" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>

          {/* Gold accent gradient */}
          <linearGradient id="goldShaft" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Soft shadow filter */}
          <filter id="arrowShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
          </filter>

          <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#38BDF8" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* 1. Subtle Dot Matrix Grid */}
        <g opacity="0.35">
          {dots.map((d, i) => (
            <circle key={i} cx={d.cx} cy={d.cy} r="1.5" fill="#94A3B8" />
          ))}
        </g>

        {/* 2. Arrow 1: Snake A (Winding Navy Snake, Top-Left to Mid-Center) */}
        {/* Path: (40,40) -> (140,40) -> (140,80) -> (80,80) -> (80,120) -> (120,120) -> Arrow pointing RIGHT */}
        <g
          filter="url(#arrowShadow)"
          className={`transition-transform duration-150 ${
            activeTapId === 'snake-1' ? 'scale-[1.03] origin-center' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleArrowTap('snake-1', false);
          }}
        >
          {/* Tail base bulb */}
          <circle cx="40" cy="40" r="5" fill="#0F172A" />
          {/* Winding 90° Shaft */}
          <path
            d="M 40 40 L 140 40 L 140 80 L 80 80 L 80 120 L 120 120"
            fill="none"
            stroke="url(#navyShaft)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner highlight line */}
          <path
            d="M 40 40 L 140 40 L 140 80 L 80 80 L 80 120 L 116 120"
            fill="none"
            stroke="#334155"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
          {/* Sharp Arrowhead pointing RIGHT at (120, 120) */}
          <polygon
            points="132,120 118,112 118,128"
            fill="#0F172A"
            stroke="#334155"
            strokeWidth="1"
          />
        </g>

        {/* 3. Arrow 2: Snake B (Winding Navy Snake, Right Arm to Center) */}
        {/* Path: (280,40) -> (200,40) -> (200,80) -> (260,80) -> (260,120) -> (180,120) -> Arrow pointing LEFT */}
        <g
          filter="url(#arrowShadow)"
          className={`transition-transform duration-150 ${
            activeTapId === 'snake-2' ? 'scale-[1.03] origin-center' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleArrowTap('snake-2', false);
          }}
        >
          {/* Tail bulb */}
          <circle cx="280" cy="40" r="5" fill="#0F172A" />
          {/* Winding Shaft */}
          <path
            d="M 280 40 L 200 40 L 200 80 L 260 80 L 260 120 L 175 120"
            fill="none"
            stroke="url(#navyShaft)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 280 40 L 200 40 L 200 80 L 260 80 L 260 120 L 178 120"
            fill="none"
            stroke="#334155"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
          {/* Sharp Arrowhead pointing LEFT at (175, 120) */}
          <polygon
            points="164,120 178,112 178,128"
            fill="#0F172A"
            stroke="#334155"
            strokeWidth="1"
          />
        </g>

        {/* 4. Arrow 3: Snake C (Bottom-Left Winding Snake) */}
        {/* Path: (40,80) -> (40,160) -> (140,160) -> (140,140) -> Arrow pointing UP */}
        <g
          filter="url(#arrowShadow)"
          className={`transition-transform duration-150 ${
            activeTapId === 'snake-3' ? 'scale-[1.03] origin-center' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleArrowTap('snake-3', false);
          }}
        >
          {/* Tail bulb */}
          <circle cx="40" cy="80" r="5" fill="#0F172A" />
          {/* Winding Shaft */}
          <path
            d="M 40 80 L 40 160 L 130 160"
            fill="none"
            stroke="url(#navyShaft)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 40 80 L 40 160 L 126 160"
            fill="none"
            stroke="#334155"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
          {/* Sharp Arrowhead pointing RIGHT at (130, 160) */}
          <polygon
            points="142,160 128,152 128,168"
            fill="#0F172A"
            stroke="#334155"
            strokeWidth="1"
          />
        </g>

        {/* 5. Arrow 4: Snake D (Bottom-Right Winding Snake) */}
        {/* Path: (280,80) -> (280,160) -> (200,160) -> Arrow pointing LEFT */}
        <g
          filter="url(#arrowShadow)"
          className={`transition-transform duration-150 ${
            activeTapId === 'snake-4' ? 'scale-[1.03] origin-center' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleArrowTap('snake-4', false);
          }}
        >
          {/* Tail bulb */}
          <circle cx="280" cy="80" r="5" fill="#0F172A" />
          {/* Winding Shaft */}
          <path
            d="M 280 80 L 280 160 L 205 160"
            fill="none"
            stroke="url(#navyShaft)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 280 80 L 280 160 L 208 160"
            fill="none"
            stroke="#334155"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
          {/* Sharp Arrowhead pointing LEFT at (205, 160) */}
          <polygon
            points="193,160 207,152 207,168"
            fill="#0F172A"
            stroke="#334155"
            strokeWidth="1"
          />
        </g>

        {/* 6. Arrow 5: FREE ESCAPING SNAKE ARROW (Highlighted Hero Arrow) */}
        {/* Clear path that exits down without collision! */}
        <g
          filter="url(#glowCyan)"
          className={`transition-all duration-700 ease-out cursor-pointer ${
            escaped ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleArrowTap('free-snake', true);
          }}
        >
          {/* Pulsing indicator circle behind head */}
          <circle
            cx="160"
            cy="176"
            r="10"
            fill="#38BDF8"
            opacity="0.25"
            className="animate-ping origin-center"
          />

          {/* Tail bulb */}
          <circle cx="160" cy="20" r="5.5" fill="#0284C7" />

          {/* Distinct winding snake path with 90° bends */}
          <path
            d="M 160 20 L 160 60 L 170 60 L 170 100 L 160 100 L 160 176"
            fill="none"
            stroke="url(#cyanEscapeShaft)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Vibrant highlight core */}
          <path
            d="M 160 20 L 160 60 L 170 60 L 170 100 L 160 100 L 170 176"
            fill="none"
            stroke="#BAE6FD"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
          {/* Sharp Arrowhead pointing DOWN toward exit */}
          <polygon
            points="160,190 152,176 168,176"
            fill="#0284C7"
            stroke="#BAE6FD"
            strokeWidth="1.2"
          />
        </g>

        {/* 7. Exit Indicator Gate Marker */}
        <line
          x1="140"
          y1="198"
          x2="180"
          y2="198"
          stroke="#0284C7"
          strokeWidth="2"
          strokeDasharray="3 3"
          opacity="0.6"
        />
      </svg>

      {/* Floating subtle guide badge */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 border border-slate-200/80 shadow-2xs backdrop-blur-xs pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
        <span className="text-[10px] font-black tracking-wider text-slate-700 uppercase">
          {escaped ? 'Escaping Path!' : 'Tap Free Arrow'}
        </span>
      </div>
    </div>
  );
};
