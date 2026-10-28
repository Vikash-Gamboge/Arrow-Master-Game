import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Vibrate,
  Music,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Megaphone,
  Info,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { sound } from '../game/sound';
import { LegalDocumentViewer, LegalPageType } from './legal/LegalDocumentViewer';

interface SettingsModalProps {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleVibration: () => void;
  onToggleMusic: () => void;
  onRestartLevel: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  soundEnabled,
  vibrationEnabled,
  musicEnabled,
  onToggleSound,
  onToggleVibration,
  onToggleMusic,
  onRestartLevel,
  onClose,
}) => {
  const [showConfirmRestart, setShowConfirmRestart] = useState(false);
  const [activeLegalPage, setActiveLegalPage] = useState<LegalPageType | null>(null);

  const handleConfirmRestart = () => {
    setShowConfirmRestart(false);
    onRestartLevel();
    onClose();
  };

  const handleOpenLegal = (page: LegalPageType) => {
    sound.playTap();
    setActiveLegalPage(page);
  };

  // If a legal document page is active, show the sub-viewer
  if (activeLegalPage) {
    return (
      <LegalDocumentViewer
        pageType={activeLegalPage}
        onBack={() => setActiveLegalPage(null)}
      />
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3.5 sm:p-4 select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm max-h-[88vh] bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col relative animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2 shrink-0">
          <h3
            id="settings-title"
            className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight"
          >
            Settings
          </h3>
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            aria-label="Close settings"
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer touch-manipulation"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Settings Body */}
        <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-4 touch-pan-y scroll-smooth">
          {/* Audio & Haptics Section */}
          <div className="space-y-3">
            {/* 1. Sound Row */}
            <div className="flex items-center justify-between py-1.5 px-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 shadow-2xs">
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <span className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                  Sound
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleSound}
                role="switch"
                aria-checked={soundEnabled}
                aria-label="Toggle sound"
                className={`w-13 h-7 sm:w-14 sm:h-8 rounded-full transition-colors relative cursor-pointer select-none touch-manipulation shadow-inner focus:outline-hidden ${
                  soundEnabled ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-md transition-transform absolute top-1 ${
                    soundEnabled ? 'translate-x-7 sm:translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 2. Vibration Row */}
            <div className="flex items-center justify-between py-1.5 px-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 shadow-2xs">
                  <Vibrate className="w-5 h-5" />
                </div>
                <span className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                  Vibration
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleVibration}
                role="switch"
                aria-checked={vibrationEnabled}
                aria-label="Toggle vibration"
                className={`w-13 h-7 sm:w-14 sm:h-8 rounded-full transition-colors relative cursor-pointer select-none touch-manipulation shadow-inner focus:outline-hidden ${
                  vibrationEnabled ? 'bg-purple-600' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-md transition-transform absolute top-1 ${
                    vibrationEnabled ? 'translate-x-7 sm:translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 3. Music Row */}
            <div className="flex items-center justify-between py-1.5 px-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 shadow-2xs">
                  <Music className="w-5 h-5" />
                </div>
                <span className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                  Music
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleMusic}
                role="switch"
                aria-checked={musicEnabled}
                aria-label="Toggle music"
                className={`w-13 h-7 sm:w-14 sm:h-8 rounded-full transition-colors relative cursor-pointer select-none touch-manipulation shadow-inner focus:outline-hidden ${
                  musicEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-md transition-transform absolute top-1 ${
                    musicEnabled ? 'translate-x-7 sm:translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Special RESTART LEVEL Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setShowConfirmRestart(true);
              }}
              data-testid="restart-level-btn"
              aria-label="Restart Level"
              className="w-full py-3 sm:py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer select-none touch-manipulation border border-blue-400/20"
            >
              <RotateCcw className="w-4 h-4 text-white/95" />
              <span>RESTART LEVEL</span>
            </button>
          </div>

          {/* LEGAL & INFORMATION Section */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="px-1 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                LEGAL & INFORMATION
              </span>
            </div>

            <div className="space-y-1.5">
              {/* 1. Privacy Policy */}
              <button
                type="button"
                onClick={() => handleOpenLegal('privacy')}
                data-testid="legal-btn-privacy"
                className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 border border-slate-100/90 transition-all cursor-pointer group text-left touch-manipulation"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-slate-900">
                    Privacy Policy
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>

              {/* 2. Terms & Conditions */}
              <button
                type="button"
                onClick={() => handleOpenLegal('terms')}
                data-testid="legal-btn-terms"
                className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 border border-slate-100/90 transition-all cursor-pointer group text-left touch-manipulation"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-slate-900">
                    Terms & Conditions
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>

              {/* 3. Advertising */}
              <button
                type="button"
                onClick={() => handleOpenLegal('advertising')}
                data-testid="legal-btn-advertising"
                className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 border border-slate-100/90 transition-all cursor-pointer group text-left touch-manipulation"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-slate-900">
                    Advertising
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>

              {/* 4. About */}
              <button
                type="button"
                onClick={() => handleOpenLegal('about')}
                data-testid="legal-btn-about"
                className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 border border-slate-100/90 transition-all cursor-pointer group text-left touch-manipulation"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 group-hover:scale-105 transition-transform">
                    <Info className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-slate-900">
                    About
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>

              {/* 5. Contact Us */}
              <button
                type="button"
                onClick={() => handleOpenLegal('contact')}
                data-testid="legal-btn-contact"
                className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 border border-slate-100/90 transition-all cursor-pointer group text-left touch-manipulation"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-slate-900">
                    Contact Us
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Back Button */}
        <div className="pt-3 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            aria-label="Back"
            className="w-full py-2.5 sm:py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm tracking-wide uppercase transition-colors cursor-pointer touch-manipulation flex items-center justify-center gap-2"
          >
            <span>BACK</span>
          </button>
        </div>

        {/* Restart Confirmation Dialog */}
        {showConfirmRestart && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-restart-title"
            aria-describedby="confirm-restart-desc"
            className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-3xl p-6 flex flex-col justify-center items-center text-center z-10 animate-in fade-in duration-150"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3 shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h4
              id="confirm-restart-title"
              className="text-xl font-black text-slate-800 tracking-tight mb-2"
            >
              Restart Level?
            </h4>
            <p
              id="confirm-restart-desc"
              className="text-sm text-slate-500 font-medium mb-6 leading-relaxed max-w-[240px]"
            >
              Your current level progress will be lost.
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setShowConfirmRestart(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm tracking-wide transition-colors cursor-pointer touch-manipulation uppercase"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmRestart}
                data-testid="confirm-restart-btn"
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm tracking-wide shadow-md shadow-rose-500/20 transition-all active:scale-[0.98] cursor-pointer touch-manipulation uppercase"
              >
                RESTART
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
