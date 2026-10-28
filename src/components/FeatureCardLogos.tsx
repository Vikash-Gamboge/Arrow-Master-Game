import React from 'react';

/**
 * Premium 3D Cartoon Calendar Logo for Daily Challenge
 * Styled with soft 3D depth, metallic binder rings, golden star badge, and glossy highlights.
 */
export const DailyChallenge3DLogo: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} drop-shadow-md transition-transform duration-200 group-hover:scale-105`}
      aria-hidden="true"
    >
      <defs>
        {/* Calendar Body Gradients */}
        <linearGradient id="calHeaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="60%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        <linearGradient id="calPageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="85%" stopColor="#FFFBEB" />
          <stop offset="100%" stopColor="#FEF3C7" />
        </linearGradient>

        <linearGradient id="calBaseDepthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Golden Star Emblem Gradients */}
        <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="40%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        <linearGradient id="starHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Ring metallic gradient */}
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Soft Ambient Shadow */}
        <filter id="calShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#78350F" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter="url(#calShadow)">
        {/* 3D Base Thickness Layer */}
        <rect x="10" y="16" width="44" height="42" rx="10" fill="url(#calBaseDepthGrad)" />

        {/* Calendar Main Page */}
        <rect x="10" y="14" width="44" height="42" rx="10" fill="url(#calPageGrad)" stroke="#FCD34D" strokeWidth="1" />

        {/* Header Block (Amber / Gold 3D Banner) */}
        <path
          d="M 10 24 C 10 18.477 14.477 14 20 14 L 44 14 C 49.523 14 54 18.477 54 24 L 54 28 L 10 28 Z"
          fill="url(#calHeaderGrad)"
        />

        {/* Glossy Reflection Highlight on Header */}
        <path
          d="M 12 16 C 14 15 20 15 28 15 L 42 15 C 47 15 51 16 52 17 L 52 20 L 12 20 Z"
          fill="white"
          opacity="0.25"
        />

        {/* 3D Binder Rings (Left & Right) */}
        {/* Ring 1 */}
        <rect x="18" y="9" width="4" height="10" rx="2" fill="url(#ringGrad)" />
        <rect x="19" y="10" width="1.5" height="4" rx="0.75" fill="white" opacity="0.6" />
        {/* Ring 2 */}
        <rect x="42" y="9" width="4" height="10" rx="2" fill="url(#ringGrad)" />
        <rect x="43" y="10" width="1.5" height="4" rx="0.75" fill="white" opacity="0.6" />

        {/* Date Display (31) */}
        <text
          x="32"
          y="46"
          textAnchor="middle"
          fontSize="18"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#92400E"
          letterSpacing="-0.5"
        >
          31
        </text>

        {/* Subtle grid lines on calendar sheet */}
        <line x1="16" y1="34" x2="48" y2="34" stroke="#FDE68A" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />

        {/* 3D Golden Reward Star (Top-Right Accent) */}
        <g transform="translate(42, 38) scale(0.85)">
          <path
            d="M 0 -10 L 2.8 -3.5 L 9.5 -2.5 L 4.5 2.2 L 5.8 9 L 0 5.5 L -5.8 9 L -4.5 2.2 L -9.5 -2.5 L -2.8 -3.5 Z"
            fill="url(#starGrad)"
            stroke="#B45309"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Star Glint */}
          <path
            d="M 0 -8 L 2 -2.5 L 7 -1.8 L 3.5 1.8 L 0 -5 Z"
            fill="url(#starHighlight)"
          />
        </g>
      </g>
    </svg>
  );
};

/**
 * Premium 3D Cartoon Snake Logo for Snake Arrow Mode
 * Cute, friendly green cartoon snake with expressive eyes and a stylized arrow tail tip.
 */
export const SnakeArrow3DLogo: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} drop-shadow-md transition-transform duration-200 group-hover:scale-105`}
      aria-hidden="true"
    >
      <defs>
        {/* Snake Body 3D Gradients */}
        <linearGradient id="snakeBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="40%" stopColor="#10B981" />
          <stop offset="85%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        <linearGradient id="snakeBellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>

        <linearGradient id="snakeArrowTipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Soft Drop Shadow Filter */}
        <filter id="snakeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#064E3B" floodOpacity="0.3" />
        </filter>
      </defs>

      <g filter="url(#snakeShadow)">
        {/* Coiled Serpentine Body (S-Curve Pipe with 3D Stroke) */}
        {/* Base shadow layer */}
        <path
          d="M 18 48 C 12 44 14 34 22 32 C 30 30 38 24 36 16 C 34 10 24 10 20 16"
          fill="none"
          stroke="#064E3B"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
        />

        {/* Main 3D Green Body Path */}
        <path
          d="M 18 46 C 12 42 14 32 22 30 C 30 28 38 22 36 14 C 34 8 24 8 20 14"
          fill="none"
          stroke="url(#snakeBodyGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glossy Specular Line along snake back */}
        <path
          d="M 18 44 C 13 41 15 33 22 31 C 29 29 37 23 35 15 C 33 10 25 10 22 14"
          fill="none"
          stroke="#A7F3D0"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Cartoon Snake Head (Cute Rounded Bulb at top-right end) */}
        <g transform="translate(38, 14)">
          {/* Head Shape */}
          <ellipse cx="0" cy="0" rx="11" ry="9.5" fill="url(#snakeBodyGrad)" stroke="#047857" strokeWidth="1" />
          {/* Head Glossy Highlight */}
          <ellipse cx="-3" cy="-3.5" rx="5" ry="3" fill="#A7F3D0" opacity="0.5" />

          {/* Left Eye */}
          <circle cx="-4" cy="-1" r="3.2" fill="white" />
          <circle cx="-3.2" cy="-1" r="1.8" fill="#064E3B" />
          <circle cx="-2.6" cy="-1.8" r="0.75" fill="white" />

          {/* Right Eye */}
          <circle cx="4" cy="-1" r="3.2" fill="white" />
          <circle cx="4.8" cy="-1" r="1.8" fill="#064E3B" />
          <circle cx="5.4" cy="-1.8" r="0.75" fill="white" />

          {/* Cute Smile */}
          <path d="M -3 4 Q 0 7 3 4" fill="none" stroke="#064E3B" strokeWidth="1.2" strokeLinecap="round" />

          {/* Cheeks */}
          <circle cx="-6.5" cy="2.5" r="1.5" fill="#F43F5E" opacity="0.4" />
          <circle cx="6.5" cy="2.5" r="1.5" fill="#F43F5E" opacity="0.4" />
        </g>

        {/* Snake Tail Arrowhead (3D Stylized Arrow Tip at bottom-left tail) */}
        <g transform="translate(14, 48) rotate(-25)">
          <path
            d="M 0 -8 L 7 5 L 2 3 L 2 10 L -2 10 L -2 3 L -7 5 Z"
            fill="url(#snakeArrowTipGrad)"
            stroke="#92400E"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Arrow Tip Highlight */}
          <path
            d="M 0 -6 L 5 4 L 1 2.5 L 0 -2 Z"
            fill="white"
            opacity="0.4"
          />
        </g>
      </g>
    </svg>
  );
};
