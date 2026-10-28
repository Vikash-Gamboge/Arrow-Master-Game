import React from 'react';
import { X, Check, Palette } from 'lucide-react';
import { GameTheme, GAME_THEMES, ThemeId } from '../game/theme';
import { sound } from '../game/sound';

interface ThemeModalProps {
  currentTheme: GameTheme;
  onSelectTheme: (theme: GameTheme) => void;
  onClose: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  currentTheme,
  onSelectTheme,
  onClose,
}) => {
  const themeList = Object.values(GAME_THEMES);

  const handlePick = (theme: GameTheme) => {
    sound.playTap();
    onSelectTheme(theme);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="theme-modal-title"
                className="text-xl font-black text-slate-800 tracking-tight"
              >
                Board Theme
              </h3>
              <p className="text-[11px] font-medium text-slate-400">
                Choose your visual style
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close theme selector"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 Theme Cards Grid */}
        <div className="space-y-2.5 mb-5 max-h-[360px] overflow-y-auto pr-0.5">
          {themeList.map((theme) => {
            const isSelected = currentTheme.id === theme.id;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handlePick(theme)}
                className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none touch-manipulation ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50/50 shadow-sm'
                    : 'border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Swatch Previews */}
                  <div className="flex items-center -space-x-1.5">
                    {theme.previewColors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-5 h-5 rounded-full border-2 border-white shadow-xs"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {/* Theme Names */}
                  <div className="text-left">
                    <span className="text-sm font-extrabold text-slate-800 block">
                      {theme.name}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 block">
                      {theme.subtitle}
                    </span>
                  </div>
                </div>

                {/* Selected Checkmark Indicator */}
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer touch-manipulation"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
