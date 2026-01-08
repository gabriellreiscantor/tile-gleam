// playerResources.ts - Player consumables & onboarding system

export interface PlayerResources {
  continues: number;
  undos: number;
  swaps: number;
  clearCells: number;
  
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

export interface ContinueEligibility {
  canOffer: boolean;
  reason: string;
  hasPaidContinue: boolean;
  canWatchAd: boolean;
}

export function checkContinueEligibility(
  resources: PlayerResources,
  currentScore: number,
  currentCombo: number,
  gridOccupancy: number // 0-1
): ContinueEligibility {
  // Rule: Max 1 continue per game
  if (resources.continuesUsedThisGame >= 1) {
    return {
      canOffer: false,
      reason: 'Já usou continue nesta partida',
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
      reason: 'Partida muito curta',
      hasPaidContinue: false,
      canWatchAd: false,
    };
  }
  
  return {
    canOffer: true,
    reason: isHighScoreAttempt ? 'Quase batendo recorde!' : 
            hasActiveCombo ? 'Combo ativo!' : 'Você estava indo bem!',
    hasPaidContinue: resources.continues > 0,
    canWatchAd: true, // Always allow ad option
  };
}

export function useContinue(resources: PlayerResources, type: 'paid' | 'ad'): PlayerResources {
  const updated = { ...resources };
  updated.continuesUsedThisGame += 1;
  
  if (type === 'paid') {
    updated.continues = Math.max(0, updated.continues - 1);
  }
  
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
      reason: 'Não pode desfazer após limpar linhas',
    };
  }
  
  // First undo is free per game
  if (!resources.freeUndoUsedThisGame) {
    return {
      canUndo: true,
      isFree: true,
      hasPaidUndo: resources.undos > 0,
      reason: 'Desfazer grátis',
    };
  }
  
  // After free undo, need paid
  if (resources.undos > 0) {
    return {
      canUndo: true,
      isFree: false,
      hasPaidUndo: true,
      reason: `${resources.undos} restantes`,
    };
  }
  
  return {
    canUndo: false,
    isFree: false,
    hasPaidUndo: false,
    reason: 'Sem undos disponíveis',
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
