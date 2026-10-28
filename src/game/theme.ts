/**
 * Theme Engine for Arrow Puzzle
 * Provides 6 themes that dynamically re-style background, HUD, buttons,
 * badges, and accent highlights while preserving high-contrast arrow visibility and mechanics.
 */

export type ThemeId =
  | 'midnight-blue'
  | 'ocean-cyan'
  | 'emerald-green'
  | 'royal-purple'
  | 'sunset-orange'
  | 'light-minimal';

export interface GameTheme {
  id: ThemeId;
  name: string;
  subtitle: string;
  // Background styling
  appBgClass: string; // Outer viewport frame
  cardBgClass: string; // Mobile container background
  headerBgClass: string; // Header area background
  pillBgClass: string; // Info badges background
  // Accents & buttons
  primaryColor: string;
  primaryBgClass: string;
  primaryTextClass: string;
  borderClass: string;
  // Arrow styling (strictly high-contrast for effortless puzzle readability)
  arrowShaftColor: string;
  arrowHintColor: string;
  arrowGlowColor: string;
  // Preview swatches
  previewColors: string[];
}

export const GAME_THEMES: Record<ThemeId, GameTheme> = {
  'midnight-blue': {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    subtitle: 'Deep Navy & Electric Cyan',
    appBgClass: 'bg-[#080E1E]',
    cardBgClass: 'bg-white',
    headerBgClass: 'bg-slate-50/70',
    pillBgClass: 'bg-slate-100/90 text-slate-700',
    primaryColor: '#2563EB',
    primaryBgClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    primaryTextClass: 'text-blue-600',
    borderClass: 'border-blue-200/80',
    arrowShaftColor: '#0F1935',
    arrowHintColor: '#0284C7',
    arrowGlowColor: '#38BDF8',
    previewColors: ['#080E1E', '#2563EB', '#38BDF8'],
  },
  'ocean-cyan': {
    id: 'ocean-cyan',
    name: 'Ocean Cyan',
    subtitle: 'Aquamarine & Vibrant Azure',
    appBgClass: 'bg-[#041E28]',
    cardBgClass: 'bg-[#F0FDF4]',
    headerBgClass: 'bg-cyan-50/80',
    pillBgClass: 'bg-cyan-100/80 text-cyan-900',
    primaryColor: '#0284C7',
    primaryBgClass: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    primaryTextClass: 'text-cyan-600',
    borderClass: 'border-cyan-300/80',
    arrowShaftColor: '#0B253A',
    arrowHintColor: '#06B6D4',
    arrowGlowColor: '#22D3EE',
    previewColors: ['#041E28', '#0284C7', '#22D3EE'],
  },
  'emerald-green': {
    id: 'emerald-green',
    name: 'Emerald Green',
    subtitle: 'Lush Forest & Mint Glow',
    appBgClass: 'bg-[#061D15]',
    cardBgClass: 'bg-[#F2FBF6]',
    headerBgClass: 'bg-emerald-50/80',
    pillBgClass: 'bg-emerald-100/80 text-emerald-900',
    primaryColor: '#059669',
    primaryBgClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    primaryTextClass: 'text-emerald-600',
    borderClass: 'border-emerald-300/80',
    arrowShaftColor: '#0A291E',
    arrowHintColor: '#10B981',
    arrowGlowColor: '#34D399',
    previewColors: ['#061D15', '#059669', '#34D399'],
  },
  'royal-purple': {
    id: 'royal-purple',
    name: 'Royal Purple',
    subtitle: 'Imperial Violet & Lavender',
    appBgClass: 'bg-[#150B28]',
    cardBgClass: 'bg-[#FAF5FF]',
    headerBgClass: 'bg-purple-50/80',
    pillBgClass: 'bg-purple-100/80 text-purple-900',
    primaryColor: '#7C3AED',
    primaryBgClass: 'bg-purple-600 hover:bg-purple-700 text-white',
    primaryTextClass: 'text-purple-600',
    borderClass: 'border-purple-300/80',
    arrowShaftColor: '#1D1038',
    arrowHintColor: '#9333EA',
    arrowGlowColor: '#C084FC',
    previewColors: ['#150B28', '#7C3AED', '#C084FC'],
  },
  'sunset-orange': {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    subtitle: 'Warm Amber & Terracotta',
    appBgClass: 'bg-[#240E08]',
    cardBgClass: 'bg-[#FFFBF5]',
    headerBgClass: 'bg-amber-50/80',
    pillBgClass: 'bg-amber-100/80 text-amber-950',
    primaryColor: '#EA580C',
    primaryBgClass: 'bg-orange-600 hover:bg-orange-700 text-white',
    primaryTextClass: 'text-orange-600',
    borderClass: 'border-orange-300/80',
    arrowShaftColor: '#2B140A',
    arrowHintColor: '#F97316',
    arrowGlowColor: '#FB923C',
    previewColors: ['#240E08', '#EA580C', '#FB923C'],
  },
  'light-minimal': {
    id: 'light-minimal',
    name: 'Light Minimal',
    subtitle: 'Clean Slate & Porcelain White',
    appBgClass: 'bg-slate-300',
    cardBgClass: 'bg-[#F8FAFC]',
    headerBgClass: 'bg-slate-100/90',
    pillBgClass: 'bg-slate-200/80 text-slate-800',
    primaryColor: '#334155',
    primaryBgClass: 'bg-slate-800 hover:bg-slate-900 text-white',
    primaryTextClass: 'text-slate-800',
    borderClass: 'border-slate-300',
    arrowShaftColor: '#0F172A',
    arrowHintColor: '#2563EB',
    arrowGlowColor: '#60A5FA',
    previewColors: ['#E2E8F0', '#334155', '#0F172A'],
  },
};

const THEME_STORAGE_KEY = 'arrow_puzzle_selected_theme';

export function loadSavedTheme(): GameTheme {
  if (typeof window === 'undefined') return GAME_THEMES['midnight-blue'];
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId;
    if (saved && GAME_THEMES[saved]) {
      return GAME_THEMES[saved];
    }
    return GAME_THEMES['midnight-blue'];
  } catch {
    return GAME_THEMES['midnight-blue'];
  }
}

export function saveSelectedTheme(themeId: ThemeId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch {}
}
