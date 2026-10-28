import React from 'react';
import { X, CheckCircle, AlertTriangle, Play, FastForward } from 'lucide-react';
import { ValidationReport } from '../game/validator';
import { ArrowData, checkArrowEscape } from '../game/logic';

interface DebugPanelProps {
  levelNumber: number;
  arrows: ArrowData[];
  report: ValidationReport;
  onClose: () => void;
  onJumpToLevel: (lvl: number) => void;
  onAutoSolveStep: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  levelNumber,
  arrows,
  report,
  onClose,
  onJumpToLevel,
  onAutoSolveStep,
}) => {
  const currentlyAvailable = arrows.filter((a) => checkArrowEscape(a.id, arrows).canEscape);

  return (
    <div
      role="region"
      aria-label="Developer Debug Panel"
      className="absolute top-14 left-2 right-2 z-40 bg-slate-900/95 text-slate-100 rounded-2xl p-4 shadow-2xl border border-slate-700/80 backdrop-blur-md text-xs font-mono select-text"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 font-bold text-amber-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>DEVELOPER DEBUG HUD</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close debug mode"
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 text-[11px]">
        <div>
          <span className="text-slate-400">Level: </span>
          <span className="font-bold text-white">{levelNumber}</span>
        </div>
        <div>
          <span className="text-slate-400">Arrows: </span>
          <span className="font-bold text-white">{arrows.length}</span>
        </div>
        <div>
          <span className="text-slate-400">Available: </span>
          <span className="font-bold text-sky-400">{currentlyAvailable.length}</span>
        </div>
        <div>
          <span className="text-slate-400">Solvable: </span>
          <span className={report.solveResult.solvable ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            {report.solveResult.solvable ? 'TRUE' : 'FALSE'}
          </span>
        </div>
        <div>
          <span className="text-slate-400">Deadlock: </span>
          <span className={report.solveResult.deadlock ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
            {report.solveResult.deadlock ? 'TRUE' : 'FALSE'}
          </span>
        </div>
        <div>
          <span className="text-slate-400">Validation: </span>
          <span className={report.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            {report.passed ? 'PASS' : 'FAIL'}
          </span>
        </div>
        <div>
          <span className="text-slate-400">Diff Score: </span>
          <span className="font-bold text-amber-300">
            {report.difficultyMetrics?.score ?? 'N/A'}
          </span>
        </div>
        <div>
          <span className="text-slate-400">Chain Depth: </span>
          <span className="font-bold text-violet-300">
            {report.difficultyMetrics?.maxChainDepth ?? 'N/A'}
          </span>
        </div>
      </div>

      {/* Available Removable Arrows List */}
      <div className="mb-2 bg-slate-950/60 p-2 rounded-lg">
        <span className="text-slate-400 block mb-1">Currently Removable:</span>
        <div className="flex flex-wrap gap-1">
          {currentlyAvailable.length > 0 ? (
            currentlyAvailable.map((a) => (
              <span key={a.id} className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 text-[10px]">
                {a.id} ({a.dir})
              </span>
            ))
          ) : (
            <span className="text-rose-400 text-[10px]">None (Deadlocked or empty)</span>
          )}
        </div>
      </div>

      {/* Solution Sequence Preview */}
      <div className="mb-3 bg-slate-950/60 p-2 rounded-lg max-h-16 overflow-y-auto text-[10px] text-slate-300">
        <span className="text-slate-400 block mb-0.5">Solution Order:</span>
        <span className="break-all">{report.solveResult.solutionOrder.join(' → ')}</span>
      </div>

      {/* Fast Level Jump Buttons for testing 1, 50, 100, 150, 200 */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-[10px]">Jump:</span>
          {[1, 2, 42, 100, 150, 200].map((num) => (
            <button
              key={num}
              onClick={() => onJumpToLevel(num)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px]"
            >
              L{num}
            </button>
          ))}
        </div>

        <div>
          {currentlyAvailable.length > 0 && (
            <button
              onClick={onAutoSolveStep}
              className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] flex items-center gap-1"
            >
              <Play className="w-2.5 h-2.5 fill-white" />
              <span>Step</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
