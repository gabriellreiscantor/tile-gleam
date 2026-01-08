// playerResources.ts - Player consumables & onboarding system

export interface PlayerResources {
  continues: number;
  undos: number;
  swaps: number;
  clearCells: number;
  
  // Free continue tracking (one-time only)
  hasUsedFreeContinue: boolean;
  
  // Settings
  soundEnabled: boolean;
  musicEnabled: boolean;
  tutorialCompleted: boolean;
  
  // Tracking
  totalGamesPlayed: number;
  totalSessionsToday: number;
  lastSessionDate: string;
  highScore: number;
  
  // Per-game limits
  continuesUsedThisGame: number;
  undosUsedThisGame: number;
  freeUndoUsedThisGame: boolean;
}

// Initial onboarding resources (generous!)
const INITIAL_RESOURCES: PlayerResources = {
  continues: 2,
  undos: 3,
  swaps: 2,
  clearCells: 1,
  
  hasUsedFreeContinue: false,
  
  // Settings defaults
  soundEnabled: true,
  musicEnabled: true,
  tutorialCompleted: false,
  
  totalGamesPlayed: 0,
  totalSessionsToday: 0,
  lastSessionDate: '',
  highScore: 0,
  
  continuesUsedThisGame: 0,
  undosUsedThisGame: 0,
  freeUndoUsedThisGame: false,
};

const STORAGE_KEY = 'blockblast_player_resources';

// ========== PERSISTENCE ==========

export function loadResources(): PlayerResources {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if new day for session tracking
      const today = new Date().toDateString();
      if (parsed.lastSessionDate !== today) {
        parsed.totalSessionsToday = 1;
        parsed.lastSessionDate = today;
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
    freeUndoUsedThisGame: false,
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
      hasPaidUndo: false,
      reason: 'Cannot undo after clearing lines',
    };
  }
  
  // First undo is free per game
  if (!resources.freeUndoUsedThisGame) {
    return {
      canUndo: true,
      isFree: true,
      hasPaidUndo: resources.undos > 0,
      reason: 'Free undo',
    };
  }
  
  // After free undo, need paid
  if (resources.undos > 0) {
    return {
      canUndo: true,
      isFree: false,
      hasPaidUndo: true,
      reason: `${resources.undos} remaining`,
    };
  }
  
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
  
  if (!updated.freeUndoUsedThisGame) {
    updated.freeUndoUsedThisGame = true;
  } else {
    updated.undos = Math.max(0, updated.undos - 1);
  }
  
  return updated;
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

// ========== DEV/DEBUG ==========

export function addResources(
  resources: PlayerResources,
  continues: number,
  undos: number
): PlayerResources {
  return {
    ...resources,
    continues: resources.continues + continues,
    undos: resources.undos + undos,
  };
}

export function resetResources(): PlayerResources {
  localStorage.removeItem(STORAGE_KEY);
  return { ...INITIAL_RESOURCES };
}
