import React, { useEffect, useState } from 'react';
import { sound } from '../game/sound';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Play cinematic sound on mount
    sound.playSplashIntro();
    const DURATION = 1800; // 1.8s snappy intro animation
    const startTime = performance.now();
    let rafId: number;

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / DURATION);
      setProgress(p);

      if (p < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        setExiting(true);
        setTimeout(onComplete, 350);
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [onComplete]);

  const handleSkip = () => {
    sound.playTap();
    setExiting(true);
    setTimeout(onComplete, 200);
  };

  return (
    <div
      role="region"
      aria-label="Game Splash Screen"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#080E1E] text-white p-6 overflow-hidden select-none transition-opacity duration-300 ${
        exiting ? 'opacity-0 scale-102' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Radiance & Particle Sparks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Ambient radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-radial from-cyan-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-radial from-amber-400/10 via-transparent to-transparent rounded-full blur-2xl" />

        {/* Diagonal stylized beam lines */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute -top-40 -left-40 w-96 h-[800px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent rotate-45 transform" />
          <div className="absolute -bottom-40 -right-40 w-96 h-[800px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent rotate-45 transform" />
        </div>
      </div>

      {/* Top Bar with Skip Button */}
      <div className="relative z-10 w-full flex justify-end">
        <button
          type="button"
          onClick={handleSkip}
          className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-black tracking-wider uppercase text-cyan-200 border border-cyan-400/30 backdrop-blur-md shadow-xs transition-all cursor-pointer touch-manipulation"
        >
          SKIP
        </button>
      </div>

      {/* Center Cinematic Emblem & Title */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto">
        {/* Animated Arrow Emblem */}
        <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
          {/* Outer glowing diamond ring */}
          <div className="absolute inset-0 rounded-3xl border-2 border-cyan-400/40 rotate-45 animate-spin-slow shadow-[0_0_25px_rgba(34,211,238,0.35)]" />
          <div className="absolute inset-2 rounded-2xl border border-amber-400/30 -rotate-45" />

          {/* Central Stylized Arrow Vectors */}
          <svg
            viewBox="0 0 100 100"
            className="w-16 h-16 drop-shadow-[0_0_12px_rgba(56,189,248,0.8)] transform transition-transform"
          >
            <defs>
              <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>

            {/* L-Shaped Pathfinder Arrow */}
            <path
              d="M 22 75 L 22 45 L 75 45"
              fill="none"
              stroke="url(#arrowGrad)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Sharp Arrowhead pointing right */}
            <polygon
              points="82,45 68,36 68,54"
              fill="#F59E0B"
              stroke="#F59E0B"
              strokeWidth="1"
              strokeLinejoin="round"
            />

            {/* Opposing counter-arrow */}
            <path
              d="M 78 25 L 78 55 L 25 55"
              fill="none"
              stroke="#0284C7"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.45"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-2 leading-none drop-shadow-md">
          <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
            ARROW
          </span>{' '}
          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            MASTER
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm font-black tracking-[0.25em] text-cyan-200/90 uppercase">
          PUZZLE ESCAPE
        </p>
      </div>

      {/* Bottom Progress Bar & Loading Indicator */}
      <div className="relative z-10 w-full max-w-xs flex flex-col items-center gap-2.5 pb-4">
        <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-cyan-500/20 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-amber-400 rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(34,211,238,0.7)]"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Loading Puzzle Escape...
        </span>
      </div>
    </div>
  );
};
