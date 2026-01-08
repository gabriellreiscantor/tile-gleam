// feedback.ts - Emotional feedback system for dopamine hits

export type FeedbackType = 
  | 'place'      // Piece placed
  | 'clear'      // Line cleared
  | 'combo'      // Combo achieved
  | 'perfect'    // Perfect clear (all grid empty)
  | 'close'      // Almost game over
  | 'gameover'   // Game ended
  | 'newgame';   // Fresh start

export interface FeedbackMessage {
  text: string;
  emoji: string;
  intensity: 'low' | 'medium' | 'high' | 'epic';
  color: string;
}

// Motivational messages based on action
const PLACE_MESSAGES: FeedbackMessage[] = [
  { text: 'Nice!', emoji: '👍', intensity: 'low', color: 'primary' },
  { text: 'Good!', emoji: '✨', intensity: 'low', color: 'primary' },
  { text: 'Smart!', emoji: '🧠', intensity: 'low', color: 'primary' },
];

const CLEAR_MESSAGES: Record<number, FeedbackMessage[]> = {
  1: [
    { text: 'Clear!', emoji: '💫', intensity: 'medium', color: 'cyan' },
    { text: 'Boom!', emoji: '💥', intensity: 'medium', color: 'cyan' },
    { text: 'Nice!', emoji: '🎯', intensity: 'medium', color: 'cyan' },
  ],
  2: [
    { text: 'Double!', emoji: '⚡', intensity: 'high', color: 'yellow' },
    { text: 'Amazing!', emoji: '🔥', intensity: 'high', color: 'yellow' },
    { text: 'Stellar!', emoji: '🌟', intensity: 'high', color: 'yellow' },
  ],
  3: [
    { text: 'Triple!', emoji: '🚀', intensity: 'high', color: 'orange' },
    { text: 'Insane!', emoji: '💎', intensity: 'high', color: 'orange' },
    { text: 'Legendary!', emoji: '👑', intensity: 'high', color: 'orange' },
  ],
  4: [
    { text: 'QUAD!', emoji: '💜', intensity: 'epic', color: 'purple' },
    { text: 'GODLIKE!', emoji: '🏆', intensity: 'epic', color: 'purple' },
    { text: 'MASTER!', emoji: '🎖️', intensity: 'epic', color: 'purple' },
  ],
};

const COMBO_MESSAGES: Record<number, FeedbackMessage[]> = {
  2: [{ text: 'x2 Combo!', emoji: '🔥', intensity: 'medium', color: 'accent' }],
  3: [{ text: 'x3 Combo!', emoji: '⚡', intensity: 'high', color: 'accent' }],
  4: [{ text: 'x4 COMBO!', emoji: '💥', intensity: 'high', color: 'orange' }],
  5: [{ text: 'x5 MEGA!', emoji: '🌟', intensity: 'epic', color: 'yellow' }],
  6: [{ text: 'x6 ULTRA!', emoji: '👑', intensity: 'epic', color: 'purple' }],
};

const PERFECT_MESSAGE: FeedbackMessage = {
  text: 'PERFECT!',
  emoji: '🏆',
  intensity: 'epic',
  color: 'rainbow',
};

const CLOSE_MESSAGES: FeedbackMessage[] = [
  { text: 'Careful!', emoji: '😰', intensity: 'medium', color: 'destructive' },
  { text: 'Tight!', emoji: '😬', intensity: 'medium', color: 'destructive' },
];

export function getRandomMessage(messages: FeedbackMessage[]): FeedbackMessage {
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getClearMessage(linesCleared: number): FeedbackMessage {
  const key = Math.min(linesCleared, 4);
  const messages = CLEAR_MESSAGES[key] || CLEAR_MESSAGES[1];
  return getRandomMessage(messages);
}

export function getComboMessage(combo: number): FeedbackMessage | null {
  if (combo < 2) return null;
  const key = Math.min(combo, 6);
  const messages = COMBO_MESSAGES[key] || COMBO_MESSAGES[2];
  return getRandomMessage(messages);
}

export function getPlaceMessage(): FeedbackMessage {
  return getRandomMessage(PLACE_MESSAGES);
}

export function getPerfectMessage(): FeedbackMessage {
  return PERFECT_MESSAGE;
}

export function getCloseMessage(): FeedbackMessage {
  return getRandomMessage(CLOSE_MESSAGES);
}

// Haptic patterns for different actions
export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function triggerHaptic(pattern: HapticPattern): void {
  // Check if Haptic API is available (Capacitor or Web)
  if ('vibrate' in navigator) {
    switch (pattern) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(50);
        break;
      case 'success':
        navigator.vibrate([10, 50, 20]);
        break;
      case 'warning':
        navigator.vibrate([30, 30, 30]);
        break;
      case 'error':
        navigator.vibrate([50, 100, 50]);
        break;
    }
  }
}

// Score animation helper
export function animateScore(from: number, to: number, onUpdate: (value: number) => void): void {
  const duration = 400;
  const start = performance.now();
  const diff = to - from;
  
  function step(timestamp: number) {
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out quad
    const eased = 1 - (1 - progress) * (1 - progress);
    const current = Math.round(from + diff * eased);
    
    onUpdate(current);
    
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }
  
  requestAnimationFrame(step);
}
