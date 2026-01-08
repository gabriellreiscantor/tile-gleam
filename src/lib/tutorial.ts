// tutorial.ts - Invisible onboarding tutorial system

export type TutorialStep = 'pick-piece' | 'drop-piece' | 'reward' | 'complete' | 'done';

export interface TutorialState {
  isActive: boolean;
  currentStep: TutorialStep;
  targetGridPosition: { x: number; y: number } | null;
}

const STORAGE_KEY = 'blockblast_tutorial_complete';

// ========== PERSISTENCE ==========

export function hasCompletedTutorial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markTutorialComplete(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    console.error('Failed to save tutorial state');
  }
}

// For testing only
export function resetTutorial(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ========== INITIAL STATE ==========

export function createTutorialState(): TutorialState {
  const shouldShow = !hasCompletedTutorial();
  
  return {
    isActive: shouldShow,
    currentStep: shouldShow ? 'pick-piece' : 'done',
    targetGridPosition: shouldShow ? { x: 5, y: 7 } : null, // Bottom right area
  };
}

// ========== TUTORIAL GRID ==========
// Pre-filled grid that will create a line clear when piece is placed

export function createTutorialGrid(): number[][] {
  const grid: number[][] = Array.from({ length: 8 }, () => Array(8).fill(0));
  
  // Fill bottom row except positions 5,6,7 (where tutorial piece will complete it)
  // This creates a guaranteed line clear
  grid[7][0] = 3; // Yellow
  grid[7][1] = 3;
  grid[7][2] = 3;
  grid[7][3] = 3;
  grid[7][4] = 3;
  // 5, 6, 7 left empty for the 3-block horizontal piece
  
  return grid;
}

// ========== TUTORIAL PIECE ==========
// Simple 3-block horizontal piece that will complete the bottom row

export function getTutorialPiece() {
  return {
    id: 'tutorial-piece',
    shape: [[1, 1, 1]], // 3-block horizontal
    colorId: 5, // Cyan - vibrant and visible
  };
}

// ========== STEP TRANSITIONS ==========

export function advanceTutorial(state: TutorialState): TutorialState {
  switch (state.currentStep) {
    case 'pick-piece':
      return { ...state, currentStep: 'drop-piece' };
    case 'drop-piece':
      return { ...state, currentStep: 'reward' };
    case 'reward':
      return { ...state, currentStep: 'complete' };
    case 'complete':
      markTutorialComplete();
      return { ...state, isActive: false, currentStep: 'done', targetGridPosition: null };
    default:
      return state;
  }
}

// ========== VALIDATION ==========

export function isValidTutorialDrop(
  state: TutorialState,
  gridX: number,
  gridY: number
): boolean {
  if (!state.isActive || state.currentStep !== 'drop-piece') {
    return true; // Not in tutorial drop step, allow any
  }
  
  // Only allow drop at target position
  const target = state.targetGridPosition;
  if (!target) return true;
  
  return gridX === target.x && gridY === target.y;
}

// ========== HINT TEXT ==========

export function getTutorialHintText(step: TutorialStep): string | null {
  switch (step) {
    case 'pick-piece':
      return 'Arraste o bloco';
    case 'drop-piece':
      return 'Solte aqui';
    case 'reward':
      return 'Nice!';
    case 'complete':
      return 'Continue jogando';
    default:
      return null;
  }
}

export function getTutorialHintPosition(step: TutorialStep): 'piece' | 'grid' | 'center' {
  switch (step) {
    case 'pick-piece':
      return 'piece';
    case 'drop-piece':
      return 'grid';
    case 'reward':
    case 'complete':
      return 'center';
    default:
      return 'center';
  }
}
