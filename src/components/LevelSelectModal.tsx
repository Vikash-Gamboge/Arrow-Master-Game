import React, { useState } from 'react';
import { X, Lock, CheckCircle2, Play, Search } from 'lucide-react';

interface LevelSelectModalProps {
  currentLevelId: number;
  highestUnlockedLevel: number;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  currentLevelId,
  highestUnlockedLevel,
  onSelectLevel,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const totalLevels = Math.max(200, highestUnlockedLevel + 10);

  // Generate levels array [1..totalLevels]
  const allLevels = Array.from({ length: totalLevels }, (_, i) => i + 1);

  const filteredLevels = searchQuery.trim()
    ? allLevels.filter((lvl) => lvl.toString().includes(searchQuery.trim()))
    : allLevels;

  const getDifficulty = (lvl: number) => {
    if (lvl <= 10) return 'Beginner';
    if (lvl <= 25) return 'Easy';
    if (lvl <= 50) return 'Medium';
    if (lvl <= 100) return 'Hard';
    if (lvl <= 200) return 'Expert';
    return 'Master';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-select-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3
              id="level-select-title"
              className="text-2xl font-black text-slate-800 tracking-tight"
            >
              Select Level
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Sequential 1 → 200+ (Unlocked: {highestUnlockedLevel})
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close level select"
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Jump */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="number"
            min="1"
            max={totalLevels}
            placeholder="Search level (e.g. 42, 100, 200)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        {/* Scrollable Levels Grid */}
        <div className="flex-1 overflow-y-auto py-3 pr-1 mt-2">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {filteredLevels.map((lvl) => {
              const isSelected = lvl === currentLevelId;
              const isUnlocked = lvl <= highestUnlockedLevel;
              const isCompleted = lvl < highestUnlockedLevel;

              return (
                <button
                  key={lvl}
                  disabled={!isUnlocked}
                  onClick={() => {
                    if (isUnlocked) onSelectLevel(lvl);
                  }}
                  className={`aspect-square p-1 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500 text-white font-black shadow-md ring-2 ring-blue-300'
                      : isCompleted
                      ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800 font-bold hover:bg-emerald-100'
                      : isUnlocked
                      ? 'border-slate-200 bg-white text-slate-700 font-bold hover:border-blue-300 hover:bg-blue-50/40'
                      : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span className="text-sm leading-none">{lvl}</span>
                  <div className="mt-1">
                    {isSelected ? (
                      <Play className="w-2.5 h-2.5 fill-white text-white" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                    ) : !isUnlocked ? (
                      <Lock className="w-2.5 h-2.5 text-slate-300" />
                    ) : (
                      <span className="text-[9px] text-slate-400 font-medium">
                        {getDifficulty(lvl).slice(0, 3)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
