import React from 'react';
import { Lightbulb, Hash, Search, RotateCcw, Palette } from 'lucide-react';
import { GameTheme } from '../game/theme';

interface BottomControlsProps {
  hintsAvailable: number;
  showGridDots: boolean;
  magnifierActive: boolean;
  theme: GameTheme;
  onHintClick: () => void;
  onToggleGrid: () => void;
  onToggleMagnifier: () => void;
  onRestartClick: () => void;
  onOpenTheme: () => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  hintsAvailable,
  showGridDots,
  magnifierActive,
  theme,
  onHintClick,
  onToggleGrid,
  onToggleMagnifier,
  onRestartClick,
  onOpenTheme,
}) => {
  return (
    <footer className="w-full max-w-[420px] mx-auto py-3 px-4 flex items-center justify-center gap-3.5 select-none">
      {/* 1. Restart Level Button */}
      <button
        type="button"
        onClick={onRestartClick}
        aria-label="Restart current level"
        title="Restart Level"
        className="w-12 h-12 rounded-full bg-white shadow-md hover:shadow-lg border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-800 active:scale-95 transition-all cursor-pointer touch-manipulation"
      >
        <RotateCcw className="w-5 h-5 stroke-[2.2]" />
      </button>

      {/* 2. Theme Selector Button */}
      <button
        type="button"
        onClick={onOpenTheme}
        aria-label="Change game theme"
        title="Board Theme"
        className="w-12 h-12 rounded-full bg-white shadow-md hover:shadow-lg border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-slate-900 active:scale-95 transition-all cursor-pointer touch-manipulation"
      >
        <Palette className="w-5 h-5 stroke-[2.2]" style={{ color: theme.primaryColor }} />
      </button>

      {/* 3. Hint Button (Center Hero Button) */}
      <button
        type="button"
        onClick={onHintClick}
        aria-label={`Use hint, ${hintsAvailable} remaining`}
        title="Hint: highlights a free path"
        className="relative w-15 h-15 rounded-full bg-white shadow-lg hover:shadow-xl border-2 flex items-center justify-center active:scale-95 transition-all ring-4 ring-slate-100 cursor-pointer touch-manipulation"
        style={{ borderColor: theme.primaryColor }}
      >
        <Lightbulb className="w-7 h-7 stroke-[2.2]" style={{ color: theme.primaryColor }} />
        {/* Count Badge */}
        <span
          data-testid="hint-count-badge"
          className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-md border-2 border-white transition-colors"
          style={{ backgroundColor: hintsAvailable === 0 ? '#10B981' : theme.primaryColor }}
        >
          {hintsAvailable > 0 ? hintsAvailable : '+2'}
        </span>
      </button>

      {/* 4. Grid Helper Toggle Button (#) */}
      <button
        type="button"
        onClick={onToggleGrid}
        aria-label={showGridDots ? 'Hide grid matrix dots' : 'Show grid matrix dots'}
        title="Toggle Grid Dots"
        className={`w-12 h-12 rounded-full shadow-md hover:shadow-lg border-2 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer touch-manipulation ${
          showGridDots
            ? 'text-white border-transparent'
            : 'bg-white text-slate-600 border-slate-200/80'
        }`}
        style={showGridDots ? { backgroundColor: theme.primaryColor } : {}}
      >
        <Hash className="w-5 h-5 stroke-[2.4]" />
      </button>

      {/* 5. Magnifier Lens Toggle Button (🔍) */}
      <button
        type="button"
        onClick={onToggleMagnifier}
        aria-label={magnifierActive ? 'Close magnifying lens' : 'Open magnifying lens'}
        title="Magnifier Detail Lens"
        className={`w-12 h-12 rounded-full shadow-md hover:shadow-lg border flex items-center justify-center active:scale-95 transition-all cursor-pointer touch-manipulation ${
          magnifierActive
            ? 'text-white border-transparent'
            : 'bg-white text-slate-600 hover:text-slate-800 border-slate-200/80'
        }`}
        style={magnifierActive ? { backgroundColor: theme.primaryColor } : {}}
      >
        <Search className="w-5 h-5 stroke-[2.2]" />
      </button>
    </footer>
  );
};
