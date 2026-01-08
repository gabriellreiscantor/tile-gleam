// Sound effects management using free online audio files

// Free sound URLs from various CDNs/sources
const SOUND_URLS = {
  // UI sounds
  click: 'https://cdn.freesound.org/previews/171/171671_2437358-lq.mp3',
  drop: 'https://cdn.freesound.org/previews/270/270304_5123851-lq.mp3',
  
  // Clear sounds
  clear: 'https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3',
  combo: 'https://cdn.freesound.org/previews/270/270545_5123851-lq.mp3',
  
  // Game events
  gameOver: 'https://cdn.freesound.org/previews/277/277403_4804865-lq.mp3',
  levelUp: 'https://cdn.freesound.org/previews/270/270528_5123851-lq.mp3',
  success: 'https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3',
  
  // Error/invalid
  error: 'https://cdn.freesound.org/previews/142/142608_1840739-lq.mp3',
} as const;

// BGM URL - calm puzzle game music
const BGM_URL = 'https://cdn.freesound.org/previews/612/612095_5674468-lq.mp3';

type SoundType = keyof typeof SOUND_URLS;

// Audio cache to avoid re-downloading
const audioCache = new Map<SoundType, HTMLAudioElement>();

// BGM audio instance
let bgmAudio: HTMLAudioElement | null = null;

// Preload all sounds
export function preloadSounds(): void {
  Object.entries(SOUND_URLS).forEach(([key, url]) => {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = 0.5;
    audioCache.set(key as SoundType, audio);
  });
  
  // Preload BGM
  bgmAudio = new Audio(BGM_URL);
  bgmAudio.preload = 'auto';
  bgmAudio.loop = true;
  bgmAudio.volume = 0.25;
}

// Play a sound effect
export function playSound(type: SoundType, volume = 0.5): void {
  try {
    let audio = audioCache.get(type);
    
    if (!audio) {
      audio = new Audio(SOUND_URLS[type]);
      audioCache.set(type, audio);
    }
    
    // Clone for overlapping sounds
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = Math.max(0, Math.min(1, volume));
    clone.play().catch(e => {
      // Silently fail - user may not have interacted yet
      console.debug('Sound play failed:', e);
    });
  } catch (e) {
    console.debug('Sound error:', e);
  }
}

// Play with sound enabled check
export function playSoundIfEnabled(type: SoundType, soundEnabled: boolean, volume = 0.5): void {
  if (soundEnabled) {
    playSound(type, volume);
  }
}

// ========== BGM FUNCTIONS ==========

export function playBGM(): void {
  if (!bgmAudio) {
    bgmAudio = new Audio(BGM_URL);
    bgmAudio.loop = true;
    bgmAudio.volume = 0.25;
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

// Shorthand functions for common sounds
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
