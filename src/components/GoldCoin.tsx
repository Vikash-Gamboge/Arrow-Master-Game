import React from 'react';

interface GoldCoinProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

export const GoldCoin: React.FC<GoldCoinProps> = ({
  className = '',
  size = 20,
  animate = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${animate ? 'animate-bounce' : ''} ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Outer coin rim gradient */}
        <linearGradient id="coinRimGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="25%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        {/* Inner coin face gradient */}
        <linearGradient id="coinFaceGrad" x1="5" y1="5" x2="27" y2="27" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="35%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Top glossy reflection sheen */}
        <linearGradient id="coinGlossGrad" x1="16" y1="4" x2="16" y2="17" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Subtle bottom shadow */}
      <circle cx="16" cy="17" r="13.5" fill="#78350F" opacity="0.3" />

      {/* Outer Golden Beveled Rim */}
      <circle cx="16" cy="16" r="14" fill="url(#coinRimGrad)" stroke="#B45309" strokeWidth="0.75" />

      {/* Recessed Coin Face */}
      <circle cx="16" cy="16" r="11" fill="url(#coinFaceGrad)" stroke="#92400E" strokeWidth="0.75" />

      {/* Beaded Security Ring */}
      <circle cx="16" cy="16" r="9.2" stroke="#FDE68A" strokeWidth="0.55" strokeDasharray="1.2 1.4" opacity="0.85" />

      {/* Embossed Center Star / Diamond Emblem */}
      <g transform="translate(16, 16)">
        {/* Drop shadow */}
        <polygon
          points="0,-6.5 2,-2 6.5,0 2,2 0,6.5 -2,2 -6.5,0 -2,-2"
          fill="#78350F"
          opacity="0.35"
          transform="translate(0, 0.6)"
        />
        {/* Highlight facet */}
        <polygon
          points="0,-6.5 2,-2 6.5,0 0,0 -2,-2"
          fill="#FEF08A"
        />
        {/* Shadow facet */}
        <polygon
          points="0,6.5 2,2 6.5,0 0,0 -2,2"
          fill="#D97706"
        />
        {/* Left top facet */}
        <polygon
          points="0,-6.5 -2,-2 -6.5,0 0,0"
          fill="#FDE68A"
        />
        {/* Left bottom facet */}
        <polygon
          points="0,6.5 -2,2 -6.5,0 0,0"
          fill="#B45309"
        />
      </g>

      {/* Glossy Curved Glass Reflection */}
      <path
        d="M6 14 C7 8, 12 5, 16 5 C20 5, 25 8, 26 14 C21 10, 11 10, 6 14 Z"
        fill="url(#coinGlossGrad)"
      />
    </svg>
  );
};
