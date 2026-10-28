/**
 * Player Profile & Daily Reward System
 */

export interface DailyRewardState {
  canClaim: boolean;
  currentStreak: number; // 1 to 7
  lastClaimDate: string | null; // YYYY-MM-DD
  rewardAmounts: number[];
}

export const DAILY_REWARDS = [100, 150, 250, 350, 500, 750, 1200];
export const AVAILABLE_AVATARS = ['🎯', '👑', '⚡', '🦅', '🚀', '💎', '🦁', '🌟'];

const STORAGE_KEYS = {
  NICKNAME: 'arrow_puzzle_player_nickname',
  AVATAR: 'arrow_puzzle_player_avatar',
  DAILY_LAST_CLAIM: 'arrow_puzzle_daily_last_claim',
  DAILY_STREAK: 'arrow_puzzle_daily_streak',
};

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function loadPlayerNickname(): string {
  if (typeof window === 'undefined') return 'ArrowMaster';
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.NICKNAME);
    return saved && saved.trim() ? saved.trim().slice(0, 14) : 'ArrowMaster';
  } catch {
    return 'ArrowMaster';
  }
}

export function savePlayerNickname(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = name.trim().slice(0, 14) || 'ArrowMaster';
    localStorage.setItem(STORAGE_KEYS.NICKNAME, clean);
  } catch {}
}

export function loadPlayerAvatar(): string {
  if (typeof window === 'undefined') return '🎯';
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.AVATAR);
    return saved && AVAILABLE_AVATARS.includes(saved) ? saved : '🎯';
  } catch {
    return '🎯';
  }
}

export function savePlayerAvatar(avatar: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.AVATAR, avatar);
  } catch {}
}

export function loadDailyRewardState(): DailyRewardState {
  if (typeof window === 'undefined') {
    return {
      canClaim: true,
      currentStreak: 1,
      lastClaimDate: null,
      rewardAmounts: DAILY_REWARDS,
    };
  }

  try {
    const today = getTodayString();
    const yesterday = getYesterdayString();
    const lastClaim = localStorage.getItem(STORAGE_KEYS.DAILY_LAST_CLAIM);
    const savedStreak = parseInt(localStorage.getItem(STORAGE_KEYS.DAILY_STREAK) || '1', 10);
    const validStreak = isNaN(savedStreak) || savedStreak < 1 ? 1 : Math.min(7, savedStreak);

    if (!lastClaim) {
      // First time playing
      return {
        canClaim: true,
        currentStreak: 1,
        lastClaimDate: null,
        rewardAmounts: DAILY_REWARDS,
      };
    }

    if (lastClaim === today) {
      // Already claimed today
      return {
        canClaim: false,
        currentStreak: validStreak,
        lastClaimDate: lastClaim,
        rewardAmounts: DAILY_REWARDS,
      };
    }

    if (lastClaim === yesterday) {
      // Streak continues!
      const nextStreak = validStreak >= 7 ? 1 : validStreak + 1;
      return {
        canClaim: true,
        currentStreak: nextStreak,
        lastClaimDate: lastClaim,
        rewardAmounts: DAILY_REWARDS,
      };
    }

    // Missed a day -> reset to Day 1
    return {
      canClaim: true,
      currentStreak: 1,
      lastClaimDate: lastClaim,
      rewardAmounts: DAILY_REWARDS,
    };
  } catch {
    return {
      canClaim: true,
      currentStreak: 1,
      lastClaimDate: null,
      rewardAmounts: DAILY_REWARDS,
    };
  }
}

export function claimDailyReward(): { coinsAwarded: number; newStreak: number } {
  const state = loadDailyRewardState();
  if (!state.canClaim) {
    return { coinsAwarded: 0, newStreak: state.currentStreak };
  }

  const today = getTodayString();
  const streak = state.currentStreak;
  const coinsAwarded = DAILY_REWARDS[streak - 1] || 100;

  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_LAST_CLAIM, today);
    localStorage.setItem(STORAGE_KEYS.DAILY_STREAK, streak.toString());
  } catch {}

  return { coinsAwarded, newStreak: streak };
}
