// starTutorial.ts - Tutorial system for Star feature (first-time users)
// Shows tutorial the FIRST time player collects a star naturally

const STORAGE_KEY = 'blockblast_star_tutorial_complete';

export interface StarTutorialState {
  isActive: boolean;
  step: 'waiting' | 'show-arrow' | 'done';
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
}

// ========== INITIAL STATE ==========

export function createStarTutorialState(): StarTutorialState {
  const shouldShow = !hasCompletedStarTutorial();
  
  return {
    isActive: shouldShow,
    step: shouldShow ? 'waiting' : 'done',
  };
}

// ========== CHECK IF SHOULD TRIGGER ==========

export function shouldShowStarTutorial(state: StarTutorialState): boolean {
  return state.isActive && state.step === 'waiting';
}

// ========== TRIGGER TUTORIAL ==========

export function triggerStarTutorial(state: StarTutorialState): StarTutorialState {
  if (!state.isActive || state.step !== 'waiting') return state;
  return { ...state, step: 'show-arrow' };
}

// ========== COMPLETE TUTORIAL ==========

export function completeStarTutorial(state: StarTutorialState): StarTutorialState {
  if (state.step !== 'show-arrow') return state;
  markStarTutorialComplete();
  return { ...state, isActive: false, step: 'done' };
}
