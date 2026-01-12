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
  image?: string; // Optional image path for styled feedback
}

// Import place feedback images
import placeNice from '@/assets/feedback/place-nice.png';
import placeGood from '@/assets/feedback/place-good.png';
import placeSmart from '@/assets/feedback/place-smart.png';

// Motivational messages based on action
const PLACE_MESSAGES: FeedbackMessage[] = [
  { text: 'Nice!', emoji: '', intensity: 'low', color: 'primary', image: placeNice },
  { text: 'Good!', emoji: '', intensity: 'low', color: 'primary', image: placeGood },
  { text: 'Smart!', emoji: '', intensity: 'low', color: 'primary', image: placeSmart },
];

// Import feedback images - Line 1
import clearCleaaar from '@/assets/feedback/clear-cleaaar.png';
import clearNice from '@/assets/feedback/clear-nice.png';
import clearBooom from '@/assets/feedback/clear-booom.png';
// Import feedback images - Line 2
import clearDouble from '@/assets/feedback/clear-double.png';
import clearStellar from '@/assets/feedback/clear-stellar.png';
import clearAmazing from '@/assets/feedback/clear-amazing.png';
// Import feedback images - Line 3
import clearInsane from '@/assets/feedback/clear-insane.png';
import clearTriple from '@/assets/feedback/clear-triple.png';
// Import feedback images - Line 4
import clearQuad from '@/assets/feedback/clear-quad.png';
import clearMaster from '@/assets/feedback/clear-master.png';
// Import combo images
import combo2x from '@/assets/feedback/combo-2x.png';
import combo3x from '@/assets/feedback/combo-3x.png';
import combo4x from '@/assets/feedback/combo-4x.png';
import combo5x from '@/assets/feedback/combo-5x.png';
import combo6x from '@/assets/feedback/combo-6x.png';
import combo7x from '@/assets/feedback/combo-7x.png';
import combo8x from '@/assets/feedback/combo-8x.png';
import combo9x from '@/assets/feedback/combo-9x.png';
import combo10x from '@/assets/feedback/combo-10x.png';

const CLEAR_MESSAGES: Record<number, FeedbackMessage[]> = {
  1: [
    { text: 'Cleaaar!', emoji: '', intensity: 'medium', color: 'cyan', image: clearCleaaar },
    { text: 'NICE!', emoji: '', intensity: 'medium', color: 'pink', image: clearNice },
    { text: 'BOOOM!', emoji: '', intensity: 'medium', color: 'orange', image: clearBooom },
  ],
  2: [
    { text: 'DOUBLE!', emoji: '', intensity: 'medium', color: 'yellow', image: clearDouble },
    { text: 'amazing!!', emoji: '', intensity: 'medium', color: 'green', image: clearAmazing },
    { text: 'STELLAR!', emoji: '', intensity: 'medium', color: 'orange', image: clearStellar },
  ],
  3: [
    { text: 'TRIPLE!!', emoji: '', intensity: 'medium', color: 'red', image: clearTriple },
    { text: 'INSAAANE!', emoji: '', intensity: 'medium', color: 'green', image: clearInsane },
  ],
  4: [
    { text: 'QUAD COMBO!!', emoji: '', intensity: 'medium', color: 'cyan', image: clearQuad },
    { text: 'MASTER!!!', emoji: '', intensity: 'medium', color: 'orange', image: clearMaster },
  ],
};

const COMBO_MESSAGES: Record<number, FeedbackMessage[]> = {
  2: [{ text: '2X COMBO!', emoji: '', intensity: 'medium', color: 'accent', image: combo2x }],
  3: [{ text: '3X COMBO!', emoji: '', intensity: 'high', color: 'accent', image: combo3x }],
  4: [{ text: '4X COMBO!', emoji: '', intensity: 'high', color: 'orange', image: combo4x }],
  5: [{ text: '5X COMBO!', emoji: '', intensity: 'epic', color: 'yellow', image: combo5x }],
  6: [{ text: '6X COMBO!', emoji: '', intensity: 'epic', color: 'purple', image: combo6x }],
  7: [{ text: '7X COMBO!', emoji: '', intensity: 'epic', color: 'purple', image: combo7x }],
  8: [{ text: '8X COMBO!', emoji: '', intensity: 'epic', color: 'cyan', image: combo8x }],
  9: [{ text: '9X COMBO!', emoji: '', intensity: 'epic', color: 'cyan', image: combo9x }],
  10: [{ text: '10X COMBO!', emoji: '', intensity: 'epic', color: 'cyan', image: combo10x }],
  // 11+: Use 10x image as fallback
  11: [{ text: '11X COMBO!', emoji: '⚡', intensity: 'epic', color: 'yellow', image: combo10x }],
  12: [{ text: '12X COMBO!', emoji: '⚡', intensity: 'epic', color: 'yellow', image: combo10x }],
  13: [{ text: '13X COMBO!', emoji: '⚡', intensity: 'epic', color: 'yellow', image: combo10x }],
  14: [{ text: '14X COMBO!', emoji: '⚡', intensity: 'epic', color: 'yellow', image: combo10x }],
  15: [{ text: '15X COMBO!', emoji: '⚡', intensity: 'epic', color: 'yellow', image: combo10x }],
  16: [{ text: '16X COMBO!', emoji: '💥', intensity: 'epic', color: 'pink', image: combo10x }],
  17: [{ text: '17X COMBO!', emoji: '💥', intensity: 'epic', color: 'pink', image: combo10x }],
  18: [{ text: '18X COMBO!', emoji: '💥', intensity: 'epic', color: 'pink', image: combo10x }],
  19: [{ text: '19X COMBO!', emoji: '💥', intensity: 'epic', color: 'pink', image: combo10x }],
  20: [{ text: '20X COMBO!', emoji: '💥', intensity: 'epic', color: 'pink', image: combo10x }],
  21: [{ text: '👑 GODLIKE!', emoji: '👑', intensity: 'epic', color: 'rainbow', image: combo10x }],
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
  // COMBO INFINITO: Suporta até 21+, depois usa 21 como fallback
  const key = Math.min(combo, 21);
  const messages = COMBO_MESSAGES[key] || COMBO_MESSAGES[21] || COMBO_MESSAGES[6];
  return getRandomMessage(messages);
}

// COMBO LEVELS para display visual
export interface ComboLevel {
  tier: 'normal' | 'hot' | 'electric' | 'insane' | 'godlike';
  prefix: string;
  emoji: string;
  color: string;
  shake: boolean;
}

export function getComboLevel(combo: number): ComboLevel {
  if (combo >= 21) return { tier: 'godlike', prefix: '👑', emoji: '👑', color: 'rainbow', shake: true };
  if (combo >= 16) return { tier: 'insane', prefix: '💥', emoji: '💥', color: 'pink', shake: true };
  if (combo >= 11) return { tier: 'electric', prefix: '⚡', emoji: '⚡', color: 'yellow', shake: false };
  if (combo >= 6) return { tier: 'hot', prefix: '🔥', emoji: '🔥', color: 'orange', shake: false };
  return { tier: 'normal', prefix: '', emoji: '🔥', color: 'cyan', shake: false };
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
