import React, { useState } from 'react';
import {
  Download,
  X,
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Info,
} from 'lucide-react';
import { usePWAInstall } from '../game/usePWAInstall';
import { sound } from '../game/sound';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, appUrl, install } = usePWAInstall();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    sound.playTap();
    if (isInstallable) {
      const result = await install();
      if (result === 'INSTALLED') {
        sound.playWin();
        setInstallStatus('Installed successfully!');
        setTimeout(() => onClose(), 1200);
      } else if (result === 'CANCELLED') {
        setInstallStatus('Installation cancelled.');
      }
    } else {
      setInstallStatus('Follow the steps below to install in Chrome.');
    }
  };

  const copyLink = () => {
    sound.playTap();
    const urlToCopy = appUrl || window.location.href;
    navigator.clipboard.writeText(urlToCopy);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCapacitorCommands = () => {
    sound.playTap();
    const text = `npm run build\nnpx cap add android\nnpx cap sync\ncd android && ./gradlew assembleDebug`;
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const openDirectLink = () => {
    sound.playTap();
    const targetUrl = appUrl || window.location.href;
    window.open(targetUrl, '_blank');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Install Arrow Master on Mobile"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in select-none"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            sound.playTap();
            onClose();
          }}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center mb-3 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-2 shadow-md shadow-blue-500/25">
            <Smartphone className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
            Mobile Me Install Karein
          </h3>
          <p className="text-xs font-semibold text-slate-500">
            Arrow Master : Puzzle Escape
          </p>
        </div>

        {/* Status notice */}
        {installStatus && (
          <div className="mb-3 p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold text-center">
            {installStatus}
          </div>
        )}

        {/* 1. If Preview Mode / Iframe detected */}
        {isInIframe ? (
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-left">
              <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs mb-1">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Direct Chrome Me Open Karein</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                AI Studio preview panel ke andar browser install prompt block rehta hai. Apne phone me install karne ke liye direct link ko <strong>Chrome</strong> me kholein:
              </p>
            </div>

            <button
              type="button"
              onClick={openDirectLink}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>OPEN DIRECT IN CHROME</span>
            </button>

            <button
              type="button"
              onClick={copyLink}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Game Link'}</span>
            </button>
          </div>
        ) : isInstalled ? (
          /* 2. Already Installed */
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            <span className="text-sm font-black">App Already Installed!</span>
            <p className="text-xs text-emerald-700">
              Aapke phone ki Home Screen par Arrow Master ka icon ban gaya hai. Aap wahan se full-screen offline khel sakte hain!
            </p>
          </div>
        ) : (
          /* 3. Direct Browser View */
          <div className="flex flex-col gap-3">
            {/* Primary 1-Click Install Button if supported */}
            {isInstallable && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                <Download className="w-4 h-4" />
                <span>TAP TO INSTALL APP NOW</span>
              </button>
            )}

            {/* Step-by-Step Chrome Guide */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-left text-xs text-slate-700 flex flex-col gap-2.5">
              <span className="font-black text-slate-900 uppercase text-[10px] tracking-wider block">
                Chrome me Install karne ka tarika:
              </span>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="leading-snug">
                  Chrome browser ke upar right me <strong>3-Dots Menu (⋮)</strong> dabayein.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="leading-snug">
                  Menu me <strong>"Install app"</strong> ya <strong>"Add to Home screen"</strong> par click karein.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <span className="leading-snug">
                  <strong>"Install"</strong> dabayein — game bina kisi download ke aapke mobile me direct install ho jayega!
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={copyLink}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Game Link'}</span>
            </button>
          </div>
        )}

        {/* APK build note & direct GitHub Release Download */}
        <div className="mt-3 pt-3 border-t border-slate-100 text-center space-y-2">
          <a
            href="https://github.com/Vikash-Gamboge/Arrow-master/releases/latest/download/app-debug.apk"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sound.playTap()}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD .APK FILE DIRECTLY</span>
          </a>

          <details className="text-left group">
            <summary className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer list-none flex items-center justify-between">
              <span>Local Build Commands (Capacitor)</span>
              <ArrowRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="mt-2 p-2.5 rounded-xl bg-slate-900 text-slate-300 font-mono text-[10px] leading-relaxed relative">
              <button
                type="button"
                onClick={copyCapacitorCommands}
                className="absolute top-2 right-2 p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white"
                title="Copy commands"
              >
                {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
              npm run build<br />
              npx cap add android<br />
              npx cap sync<br />
              cd android && ./gradlew assembleDebug
            </div>
          </details>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={() => {
            sound.playTap();
            onClose();
          }}
          className="mt-3 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
        >
          OK, Got It
        </button>
      </div>
    </div>
  );
};
