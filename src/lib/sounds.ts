// Sound effects management using Web Audio API (iOS compatible)

// Sound URLs
const SOUND_URLS = {
  click: 'https://cdn.freesound.org/previews/171/171671_2437358-lq.mp3',
  drop: 'https://cdn.freesound.org/previews/270/270304_5123851-lq.mp3',
  clear: 'https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3',
  combo: 'https://cdn.freesound.org/previews/270/270545_5123851-lq.mp3',
  gameOver: 'https://cdn.freesound.org/previews/277/277403_4804865-lq.mp3',
  levelUp: 'https://cdn.freesound.org/previews/270/270528_5123851-lq.mp3',
  success: 'https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3',
  error: 'https://cdn.freesound.org/previews/142/142608_1840739-lq.mp3',
} as const;

// BGM URL - calm lofi puzzle game music
const BGM_URL = 'https://cdn.pixabay.com/audio/2024/11/01/audio_073aborfc3.mp3';

type SoundType = keyof typeof SOUND_URLS;

// ========== WEB AUDIO API SETUP ==========

let audioContext: AudioContext | null = null;
let isUnlocked = false;

// AudioBuffer cache
const audioBuffers = new Map<SoundType, AudioBuffer>();

// Get or create AudioContext
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

// Unlock AudioContext for iOS (CRITICAL!)
export function unlockAudioContext(): void {
  const ctx = getAudioContext();
  
  if (ctx.state === 'suspended') {
    // Create and play empty buffer to unlock
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    
    ctx.resume().then(() => {
      isUnlocked = true;
      console.debug('AudioContext unlocked!');
    }).catch(() => {
      // Fallback - still mark as unlocked to try playing sounds
      isUnlocked = true;
    });
  } else {
    isUnlocked = true;
  }
}

// Check if audio is unlocked
export function isAudioUnlocked(): boolean {
  return isUnlocked;
}

// ========== SOUND LOADING ==========

async function loadSound(url: string, key: SoundType): Promise<void> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer);
    audioBuffers.set(key, audioBuffer);
  } catch (e) {
    console.debug('Failed to load sound:', key, e);
  }
}

// Preload all sounds
export async function preloadSounds(): Promise<void> {
  // Initialize AudioContext
  getAudioContext();
  
  // Load all sounds in parallel
  const loadPromises = Object.entries(SOUND_URLS).map(([key, url]) => 
    loadSound(url, key as SoundType)
  );
  
  await Promise.all(loadPromises);
  console.debug('All sounds preloaded');
}

// ========== SOUND PLAYBACK ==========

export function playSound(type: SoundType, volume = 0.5): void {
  // Always try to unlock on any sound attempt
  if (!isUnlocked) {
    unlockAudioContext();
  }
  
  const buffer = audioBuffers.get(type);
  if (!buffer) {
    console.debug('Sound not loaded:', type);
    return;
  }
  
  try {
    const ctx = getAudioContext();
    
    // Ensure context is running
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = Math.max(0, Math.min(1, volume));
    
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    source.start(0);
  } catch (e) {
    console.debug('Sound play error:', e);
  }
}

// Play with sound enabled check
export function playSoundIfEnabled(type: SoundType, soundEnabled: boolean, volume = 0.5): void {
  if (soundEnabled) {
    playSound(type, volume);
  }
}

// ========== BGM FUNCTIONS ==========

let bgmAudio: HTMLAudioElement | null = null;

export function playBGM(): void {
  // Ensure AudioContext is unlocked first
  if (!isUnlocked) {
    unlockAudioContext();
  }
  
  if (!bgmAudio) {
    bgmAudio = new Audio(BGM_URL);
    bgmAudio.loop = true;
    bgmAudio.volume = 0.25;
    bgmAudio.preload = 'auto';
  }
  
  // Ensure AudioContext is running (helps on iOS)
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  
  bgmAudio.play().catch(e => {
    console.debug('BGM play failed:', e);
  });
}

export function stopBGM(): void {
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
  }
}

export function pauseBGM(): void {
  if (bgmAudio) {
    bgmAudio.pause();
  }
}

export function resumeBGM(): void {
  if (bgmAudio && bgmAudio.paused) {
    // Ensure context is running
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    bgmAudio.play().catch(e => {
      console.debug('BGM resume failed:', e);
    });
  }
}

export function setBGMEnabled(enabled: boolean): void {
  if (enabled) {
    playBGM();
  } else {
    stopBGM();
  }
}

// ========== SHORTHAND FUNCTIONS ==========

export const sounds = {
  click: (enabled: boolean) => playSoundIfEnabled('click', enabled, 0.3),
  drop: (enabled: boolean) => playSoundIfEnabled('drop', enabled, 0.4),
  clear: (enabled: boolean) => playSoundIfEnabled('clear', enabled, 0.6),
  combo: (enabled: boolean) => playSoundIfEnabled('combo', enabled, 0.7),
  gameOver: (enabled: boolean) => playSoundIfEnabled('gameOver', enabled, 0.5),
  levelUp: (enabled: boolean) => playSoundIfEnabled('levelUp', enabled, 0.6),
  success: (enabled: boolean) => playSoundIfEnabled('success', enabled, 0.5),
  error: (enabled: boolean) => playSoundIfEnabled('error', enabled, 0.3),
};
