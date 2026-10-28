import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  Megaphone,
  Info,
  Mail,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Gamepad2,
} from 'lucide-react';
import { sound } from '../../game/sound';

export type LegalPageType = 'privacy' | 'terms' | 'advertising' | 'about' | 'contact';

interface LegalDocumentViewerProps {
  pageType: LegalPageType;
  onBack: () => void;
  isStandalone?: boolean;
  onLaunchGame?: () => void;
}

export const LegalDocumentViewer: React.FC<LegalDocumentViewerProps> = ({
  pageType,
  onBack,
  isStandalone = false,
  onLaunchGame,
}) => {
  const [copied, setCopied] = useState(false);
  const currentYear = new Date().getFullYear();
  const APP_VERSION = '1.0.0';

  const handleBack = () => {
    sound.playTap();
    onBack();
  };

  const handleCopyEmail = () => {
    sound.playTap();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('vikashtopofficial@gmail.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderContent = () => {
    switch (pageType) {
      case 'privacy':
        return (
          <div className="space-y-4 text-slate-600 text-xs leading-relaxed">
            {/* Header Identity Badge */}
            <div className="p-3.5 rounded-2xl bg-blue-50/90 border border-blue-100 text-blue-950">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-1">
                Official Privacy Policy
              </span>
              <p className="text-xs font-semibold leading-normal text-blue-900">
                Arrow Master : Puzzle Escape
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Developer / Publisher: <strong className="text-blue-950">Vikash Gamboge</strong>
              </p>
            </div>

            <section className="space-y-2">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black">1</span>
                <span>Information Collection Practices</span>
              </h4>
              <p>
                <strong>Arrow Master : Puzzle Escape</strong> is engineered to prioritize player privacy. The game does NOT require user account creation, social logins, real names, phone numbers, credit card details, or email addresses to play.
              </p>
              <p>
                We do not collect personal location data (GPS), device contact lists, photos, or microphone audio.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black">2</span>
                <span>Local Storage and Gameplay Data</span>
              </h4>
              <p>
                Non-personal gameplay state and preferences are stored strictly on your local device using standard HTML5 LocalStorage sandboxing:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500 font-medium">
                <li>Classic Campaign level progress and highest level unlocked.</li>
                <li>Virtual coin balances and daily reward streak timestamps.</li>
                <li>Audio settings (Sound effects, Background music volume/toggles, Vibration preferences).</li>
                <li>Selected board color themes.</li>
                <li>Custom player nickname and avatar symbol selected on the home screen.</li>
                <li>Snake Arrow mode highest stage unlocked.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black">3</span>
                <span>Google AdMob Integration & Advertising Disclosures</span>
              </h4>
              <p>
                To offer <strong>Arrow Master : Puzzle Escape</strong> as a free application, we integrate the <strong>Google Mobile Ads SDK (Google AdMob / Google LLC)</strong>.
              </p>
              <p>
                Google AdMob may automatically collect and process certain technical data in accordance with Google's Privacy Policy, including:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500 font-medium">
                <li>Advertising identifiers (such as Google Advertising ID / GAID or Apple IDFA).</li>
                <li>Device model, operating system version, and screen specifications.</li>
                <li>IP address and coarse geographic region derived from IP.</li>
                <li>Ad interaction metrics (impressions, completion callbacks, clicks).</li>
              </ul>
              <p>
                This technical data is processed directly by Google AdMob to deliver relevant ads, prevent ad fraud, and measure ad performance.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black">4</span>
                <span>Rewarded Video Advertisements</span>
              </h4>
              <p>
                Rewarded advertisements in <strong>Arrow Master : Puzzle Escape</strong> are strictly optional:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500 font-medium">
                <li>They appear ONLY when you lose all 3 lives on the "OUT OF LIVES!" screen.</li>
                <li>They are triggered ONLY if you actively tap "WATCH AD & CONTINUE".</li>
                <li>They are NEVER shown automatically upon level start.</li>
                <li>They are NEVER shown upon winning or completing a level.</li>
              </ul>
              <p>
                Watching a rewarded ad grants exactly 1 life, allowing you to resume your current puzzle with all previously cleared arrows intact.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black">5</span>
                <span>Data Retention and Deletion</span>
              </h4>
              <p>
                All gameplay progress remains on your device until you uninstall the app or clear your application cache/data in device settings.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black">6</span>
                <span>Security Practices</span>
              </h4>
              <p>
                We employ operating system level sandboxing and standard data storage protocols to ensure your local preferences remain isolated and secure.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black">7</span>
                <span>Children's Privacy</span>
              </h4>
              <p>
                <strong>Arrow Master : Puzzle Escape</strong> is suitable for general audiences. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black">8</span>
                <span>Privacy Contact</span>
              </h4>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px]">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                    Developer / Publisher:
                  </span>
                  <strong className="text-slate-800 text-xs">Vikash Gamboge</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                    Contact Email:
                  </span>
                  <a
                    href="mailto:vikashtopofficial@gmail.com?subject=Arrow%20Master%20Privacy%20Policy%20Inquiry"
                    className="font-mono text-blue-600 font-bold text-xs hover:underline inline-flex items-center gap-1"
                  >
                    <span>vikashtopofficial@gmail.com</span>
                    <ExternalLink className="w-3 h-3 text-blue-500" />
                  </a>
                </div>
              </div>
            </section>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-4 text-slate-600 text-xs leading-relaxed">
            <div className="p-3.5 rounded-2xl bg-indigo-50/90 border border-indigo-100 text-indigo-950">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block mb-1">
                Terms of Use
              </span>
              <p className="text-xs font-semibold leading-normal text-indigo-900">
                Arrow Master : Puzzle Escape
              </p>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Developer / Publisher: <strong className="text-indigo-950">Vikash Gamboge</strong>
              </p>
            </div>

            <section className="space-y-2">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">1. Agreement to Terms</h4>
              <p>
                By installing, playing, or accessing <strong>Arrow Master : Puzzle Escape</strong>, you agree to these Terms of Use.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">2. License Grant</h4>
              <p>
                <strong>Vikash Gamboge</strong> grants you a personal, revocable, non-exclusive, non-transferable license to play the game on compatible devices for personal entertainment.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">3. Virtual Currency</h4>
              <p>
                In-game coins and hints are virtual items with zero real-world monetary value. They cannot be transferred, sold, or redeemed for cash.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">4. Intellectual Property</h4>
              <p>
                All visual assets, puzzle generation algorithms, sound synthesis code, and branding are the property of <strong>Vikash Gamboge</strong>.
              </p>
            </section>
          </div>
        );

      case 'advertising':
        return (
          <div className="space-y-4 text-slate-600 text-xs leading-relaxed">
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-100 text-amber-950">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block mb-1">
                Advertising Information
              </span>
              <p className="text-xs font-semibold leading-normal text-amber-900">
                Google AdMob SDK Disclosure
              </p>
            </div>

            <section className="space-y-2">
              <p>
                This application uses Google AdMob to deliver banner and optional rewarded video ads.
              </p>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-950">
                <p className="text-[11px] font-bold text-emerald-800">
                  Rewarded ads are 100% voluntary and never forced during puzzle gameplay.
                </p>
              </div>
            </section>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-4 text-slate-600 text-xs leading-relaxed text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-blue-500/25 p-1">
              <div className="w-full h-full rounded-2xl bg-[#0B132B] flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-12 h-12 drop-shadow-md">
                  <path
                    d="M 10 30 L 10 18 L 30 18"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polygon points="34,18 26,13 26,23" fill="#F59E0B" />
                  <circle cx="28" cy="28" r="3.5" fill="#10B981" />
                </svg>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                ARROW MASTER : PUZZLE ESCAPE
              </h3>
              <p className="text-xs font-semibold text-slate-600 max-w-[280px] mx-auto mt-1">
                Tactical arrow labyrinth puzzle game featuring progressive levels, Daily Challenges, and Snake Arrow mode.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Developer</span>
                <strong className="text-slate-800">Vikash Gamboge</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Version</span>
                <span className="font-mono font-bold text-slate-700">{APP_VERSION}</span>
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-4 text-slate-600 text-xs leading-relaxed">
            <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-100 text-emerald-950">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block mb-1">
                Developer Contact & Support
              </span>
              <p className="text-xs font-semibold leading-normal text-emerald-900">
                Arrow Master : Puzzle Escape
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Developer</span>
                <span className="font-black text-slate-800 text-sm">Vikash Gamboge</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Support Email</span>
                <a
                  href="mailto:vikashtopofficial@gmail.com?subject=Arrow%20Master%20Support"
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-between transition-all shadow-sm"
                >
                  <span className="font-mono text-xs">vikashtopofficial@gmail.com</span>
                  <Mail className="w-3.5 h-3.5" />
                </a>
              </div>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied Email Address</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Email Address</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
    }
  };

  const getPageTitle = () => {
    switch (pageType) {
      case 'privacy':
        return 'Privacy Policy';
      case 'terms':
        return 'Terms & Conditions';
      case 'advertising':
        return 'Advertising';
      case 'about':
        return 'About';
      case 'contact':
        return 'Contact Us';
    }
  };

  const getPageIcon = () => {
    switch (pageType) {
      case 'privacy':
        return <ShieldCheck className="w-5 h-5 text-blue-600" />;
      case 'terms':
        return <FileText className="w-5 h-5 text-indigo-600" />;
      case 'advertising':
        return <Megaphone className="w-5 h-5 text-amber-600" />;
      case 'about':
        return <Info className="w-5 h-5 text-cyan-600" />;
      case 'contact':
        return <Mail className="w-5 h-5 text-emerald-600" />;
    }
  };

  if (isStandalone) {
    // Fullscreen public webpage layout for direct URL access (/privacy-policy, /terms, etc.)
    return (
      <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto">
        <header className="w-full max-w-2xl flex items-center justify-between py-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              {getPageIcon()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-slate-400">Arrow Master : Puzzle Escape · Vikash Gamboge</p>
            </div>
          </div>

          {onLaunchGame && (
            <button
              type="button"
              onClick={onLaunchGame}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>PLAY GAME</span>
            </button>
          )}
        </header>

        <main className="w-full max-w-2xl bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 mb-8">
          {renderContent()}
        </main>

        <footer className="w-full max-w-2xl text-center text-xs text-slate-500 pb-8">
          <div>© {currentYear} Vikash Gamboge. All rights reserved.</div>
          <div className="mt-1 text-[11px] text-slate-600">
            Arrow Master : Puzzle Escape · Public Legal Document
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-page-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3.5 sm:p-4 select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm h-full max-h-[88vh] bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <header className="shrink-0 flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
              {getPageIcon()}
            </div>
            <h3
              id="legal-page-title"
              className="text-lg font-black text-slate-800 tracking-tight"
            >
              {getPageTitle()}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleBack}
            aria-label="Back to Settings"
            className="p-2 -mr-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-4 touch-pan-y scroll-smooth">
          {renderContent()}
        </div>

        {/* Bottom Back Button */}
        <footer className="shrink-0 pt-3 border-t border-slate-100 mt-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer touch-manipulation flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO SETTINGS</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
