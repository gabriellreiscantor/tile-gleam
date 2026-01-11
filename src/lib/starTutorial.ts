// starTutorial.ts - Tutorial system for Star feature (first-time users)

const STORAGE_KEY = 'blockblast_star_tutorial_complete';
const GAME_START_KEY = 'blockblast_game_start_time';

export interface StarTutorialState {
  isActive: boolean;
  step: 'waiting' | 'spawn-star' | 'collect-star' | 'show-arrow' | 'done';
  hasSpawnedStar: boolean;
}

// ========== PERSISTENCE ==========

export function hasCompletedStarTutorial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markStarTutorialComplete(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    console.error('Failed to save star tutorial state');
  }
}

// For testing only
export function resetStarTutorial(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(GAME_START_KEY);
}

// ========== GAME START TIME ==========

export function recordGameStartTime(): void {
  try {
    if (!localStorage.getItem(GAME_START_KEY)) {
      localStorage.setItem(GAME_START_KEY, Date.now().toString());
    }
  } catch {
    console.error('Failed to record game start time');
  }
}

export function getSecondsSinceGameStart(): number {
  try {
    const startTime = localStorage.getItem(GAME_START_KEY);
    if (!startTime) return 0;
    return Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
  } catch {
    return 0;
  }
}

export function clearGameStartTime(): void {
  try {
    localStorage.removeItem(GAME_START_KEY);
  } catch {
    console.error('Failed to clear game start time');
  }
}

// ========== INITIAL STATE ==========

export function createStarTutorialState(): StarTutorialState {
  const shouldShow = !hasCompletedStarTutorial();
  
  return {
    isActive: shouldShow,
    step: shouldShow ? 'waiting' : 'done',
    hasSpawnedStar: false,
  };
}

// ========== CHECK IF SHOULD TRIGGER ==========

export function shouldTriggerStarTutorial(
  state: StarTutorialState,
  secondsPlayed: number
): boolean {
  if (!state.isActive) return false;
  if (state.step !== 'waiting') return false;
  
  // Trigger after 30 seconds of play
  return secondsPlayed >= 30;
}

// ========== STEP TRANSITIONS ==========

export function advanceStarTutorial(state: StarTutorialState): StarTutorialState {
  switch (state.step) {
    case 'waiting':
      return { ...state, step: 'spawn-star' };
    case 'spawn-star':
      return { ...state, step: 'collect-star', hasSpawnedStar: true };
    case 'collect-star':
      return { ...state, step: 'show-arrow' };
    case 'show-arrow':
      markStarTutorialComplete();
      return { ...state, isActive: false, step: 'done' };
    default:
      return state;
  }
}

// ========== HINT TEXT ==========

export function getStarTutorialHintText(step: StarTutorialState['step']): string | null {
  switch (step) {
    case 'show-arrow':
      return 'Tap to activate!';
    default:
      return null;
  }
}
