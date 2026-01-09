// playerResources.ts - Player consumables & onboarding system

export interface PlayerResources {
  continues: number;
  swaps: number;
  clearCells: number;
  
  // Free continue tracking (one-time only)
  hasUsedFreeContinue: boolean;
  
  // Undo system: 1 free per day + unlimited paid (premium)
  hasPaidUndo: boolean;          // Did user buy premium undo? (one-time purchase)
  freeUndoUsedToday: boolean;    // Used the free daily undo?
  lastFreeUndoDate: string;      // Date of last reset ("2026-01-09")
  
  // Settings
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  tutorialCompleted: boolean;
  
  // Tracking
  totalGamesPlayed: number;
  totalSessionsToday: number;
  lastSessionDate: string;
  highScore: number;
  
  // Per-game limits
  continuesUsedThisGame: number;
  undosUsedThisGame: number;
}

// Initial onboarding resources (generous!)
const INITIAL_RESOURCES: PlayerResources = {
  continues: 2,
  swaps: 2,
  clearCells: 1,
  
  hasUsedFreeContinue: false,
  
  // Undo: starts with free daily, no premium
  hasPaidUndo: false,
  freeUndoUsedToday: false,
  lastFreeUndoDate: '',
  
  // Settings defaults
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  tutorialCompleted: false,
  
  totalGamesPlayed: 0,
  totalSessionsToday: 0,
  lastSessionDate: '',
  highScore: 0,
  
  continuesUsedThisGame: 0,
  undosUsedThisGame: 0,
};

const STORAGE_KEY = 'blockblast_player_resources';

// ========== PERSISTENCE ==========

export function loadResources(): PlayerResources {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const today = new Date().toDateString();
      
      // Check if new day for session tracking
      if (parsed.lastSessionDate !== today) {
        parsed.totalSessionsToday = 1;
        parsed.lastSessionDate = today;
      }
      
      // Reset free undo if new day!
      if (parsed.lastFreeUndoDate !== today) {
        parsed.freeUndoUsedToday = false;
        parsed.lastFreeUndoDate = today;
      }
      
      return { ...INITIAL_RESOURCES, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load resources:', e);
  }
  return { ...INITIAL_RESOURCES };
}

export function saveResources(resources: PlayerResources): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));
  } catch (e) {
    console.error('Failed to save resources:', e);
  }
}

// ========== GAME FLOW ==========

export function startNewGame(resources: PlayerResources): PlayerResources {
  return {
    ...resources,
    totalGamesPlayed: resources.totalGamesPlayed + 1,
    continuesUsedThisGame: 0,
    undosUsedThisGame: 0,
  };
}

// ========== CONTINUE LOGIC ==========

export type ContinueState = 'free' | 'ad' | 'paid-only';

export interface ContinueEligibility {
  canOffer: boolean;
  state: ContinueState;
  hasPaidContinue: boolean;
  canWatchAd: boolean;
}

export function checkContinueEligibility(
  resources: PlayerResources,
  currentScore: number,
  currentCombo: number,
  gridOccupancy: number, // 0-1
  isTutorial: boolean = false
): ContinueEligibility {
  // Never show during tutorial
  if (isTutorial) {
    return {
      canOffer: false,
      state: 'paid-only',
      hasPaidContinue: false,
      canWatchAd: false,
    };
  }
  
  // Rule: Max 1 continue per game
  if (resources.continuesUsedThisGame >= 1) {
    return {
      canOffer: false,
      state: 'paid-only',
      hasPaidContinue: false,
      canWatchAd: false,
    };
  }
  
  // Rule: Only offer if meaningful game
  const isHighScoreAttempt = currentScore > resources.highScore * 0.8;
  const hasActiveCombo = currentCombo >= 2;
  const isGridTense = gridOccupancy >= 0.6;
  const hasPlayedEnough = currentScore >= 100;
  
  const shouldOffer = hasPlayedEnough && (isHighScoreAttempt || hasActiveCombo || isGridTense);
  
  if (!shouldOffer) {
    return {
      canOffer: false,
      state: 'paid-only',
      hasPaidContinue: false,
      canWatchAd: false,
    };
  }
  
  // Determine state based on free continue availability
  const hasFreeContinue = !resources.hasUsedFreeContinue;
  const canWatchAd = true; // Assume ads always available (can be disabled per platform)
  
  let state: ContinueState;
  if (hasFreeContinue) {
    state = 'free';
  } else if (canWatchAd) {
    state = 'ad';
  } else {
    state = 'paid-only';
  }
  
  return {
    canOffer: true,
    state,
    hasPaidContinue: resources.continues > 0,
    canWatchAd: !hasFreeContinue && canWatchAd,
  };
}

export function useContinue(resources: PlayerResources, type: 'free' | 'paid' | 'ad'): PlayerResources {
  const updated = { ...resources };
  updated.continuesUsedThisGame += 1;
  
  if (type === 'free') {
    updated.hasUsedFreeContinue = true;
  } else if (type === 'paid') {
    updated.continues = Math.max(0, updated.continues - 1);
  }
  // 'ad' type doesn't consume any resources
  
  return updated;
}

// ========== UNDO LOGIC ==========
// System: 1 FREE per DAY + UNLIMITED paid (premium purchase)

export interface UndoAvailability {
  canUndo: boolean;
  isFree: boolean;
  hasPaidUndo: boolean;
  reason: string;
}

export function checkUndoAvailability(
  resources: PlayerResources,
  lastMoveHadClear: boolean
): UndoAvailability {
  // Rule: Can't undo if last move cleared lines
  if (lastMoveHadClear) {
    return {
      canUndo: false,
      isFree: false,
      hasPaidUndo: resources.hasPaidUndo,
      reason: 'Cannot undo after clearing lines',
    };
  }
  
  // Check if free daily undo is available
  if (!resources.freeUndoUsedToday) {
    return {
      canUndo: true,
      isFree: true,
      hasPaidUndo: resources.hasPaidUndo,
      reason: 'Free daily undo',
    };
  }
  
  // Free undo used today - check if has premium undo
  if (resources.hasPaidUndo) {
    return {
      canUndo: true,
      isFree: false,
      hasPaidUndo: true,
      reason: 'Unlimited premium undo',
    };
  }
  
  // No undos available
  return {
    canUndo: false,
    isFree: false,
    hasPaidUndo: false,
    reason: 'No undos available',
  };
}

export function useUndo(resources: PlayerResources): PlayerResources {
  const updated = { ...resources };
  updated.undosUsedThisGame += 1;
  
  // If using free daily undo, mark it as used
  if (!updated.freeUndoUsedToday) {
    updated.freeUndoUsedToday = true;
    updated.lastFreeUndoDate = new Date().toDateString();
  }
  // If using paid undo, DON'T decrement - it's unlimited!
  
  return updated;
}

// Purchase premium undo (one-time, unlimited use)
export function purchasePaidUndo(resources: PlayerResources): PlayerResources {
  return { ...resources, hasPaidUndo: true };
}

// ========== HIGH SCORE ==========

export function updateHighScore(resources: PlayerResources, score: number): PlayerResources {
  if (score > resources.highScore) {
    return { ...resources, highScore: score };
  }
  return resources;
}

// ========== ONBOARDING CHECK ==========

export function isOnboarding(resources: PlayerResources): boolean {
  return resources.totalGamesPlayed < 5;
}

export function shouldShowStore(resources: PlayerResources): boolean {
  // Don't show store during onboarding
  return resources.totalGamesPlayed >= 3;
}

// ========== SETTINGS HELPERS ==========

export interface GameSettings {
  personalizedAds: boolean;
  analyticsEnabled: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  personalizedAds: true,
  analyticsEnabled: true,
};

const SETTINGS_KEY = 'blockblast_settings';

export function loadSettings(): GameSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function getAppVersion(): string {
  return '1.0.0';
}

// ========== DEV/DEBUG ==========

export function addResources(
  resources: PlayerResources,
  continues: number,
  _undos: number // Unused now - undo is daily/premium based
): PlayerResources {
  return {
    ...resources,
    continues: resources.continues + continues,
  };
}

export function resetResources(): PlayerResources {
  localStorage.removeItem(STORAGE_KEY);
  return { ...INITIAL_RESOURCES };
}

// Debug: Give premium undo
export function grantPremiumUndo(resources: PlayerResources): PlayerResources {
  return { ...resources, hasPaidUndo: true };
}

// Debug: Reset daily undo (for testing)
export function resetDailyUndo(resources: PlayerResources): PlayerResources {
  return { ...resources, freeUndoUsedToday: false };
}
