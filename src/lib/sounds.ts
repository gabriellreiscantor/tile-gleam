// Sound effects management with Native Audio (Capacitor) + Web Audio fallback

import { NativeAudio } from '@capacitor-community/native-audio';
import { Capacitor } from '@capacitor/core';

// Check if running on native platform
const isNative = Capacitor.isNativePlatform();

// Sound asset paths (for native) and URLs (for web fallback)
const SOUND_ASSETS = {
  click: { path: 'public/assets/sounds/click.mp3', url: 'https://cdn.freesound.org/previews/171/171671_2437358-lq.mp3' },
  drop: { path: 'public/assets/sounds/drop.mp3', url: 'https://cdn.freesound.org/previews/270/270304_5123851-lq.mp3' },
  clear: { path: 'public/assets/sounds/clear.mp3', url: 'https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3' },
  combo: { path: 'public/assets/sounds/combo.mp3', url: 'https://cdn.freesound.org/previews/270/270545_5123851-lq.mp3' },
  gameOver: { path: 'public/assets/sounds/gameover.mp3', url: 'https://cdn.freesound.org/previews/277/277403_4804865-lq.mp3' },
  levelUp: { path: 'public/assets/sounds/levelup.mp3', url: 'https://cdn.freesound.org/previews/270/270528_5123851-lq.mp3' },
  success: { path: 'public/assets/sounds/success.mp3', url: 'https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3' },
  error: { path: 'public/assets/sounds/error.mp3', url: 'https://cdn.freesound.org/previews/142/142608_1840739-lq.mp3' },
} as const;

const BGM_ASSET = {
  path: 'public/assets/sounds/bgm.mp3',
  url: 'https://cdn.pixabay.com/audio/2024/11/01/audio_073aborfc3.mp3'
};

type SoundType = keyof typeof SOUND_ASSETS;

// ========== NATIVE AUDIO (CAPACITOR) ==========

let nativeAudioReady = false;

async function preloadNativeAudio(): Promise<void> {
  try {
    // Preload all sound effects
    const preloadPromises = Object.entries(SOUND_ASSETS).map(([key, asset]) =>
      NativeAudio.preload({
        assetId: key,
        assetPath: asset.path,
        audioChannelNum: 1,
        isUrl: false
      }).catch(e => console.debug(`Failed to preload ${key}:`, e))
    );

    // Preload BGM
    preloadPromises.push(
      NativeAudio.preload({
        assetId: 'bgm',
        assetPath: BGM_ASSET.path,
        audioChannelNum: 1,
        isUrl: false
      }).catch(e => console.debug('Failed to preload BGM:', e))
    );

    await Promise.all(preloadPromises);
    nativeAudioReady = true;
    console.debug('Native audio preloaded');
  } catch (e) {
    console.debug('Native audio preload failed:', e);
  }
}

function playNativeSound(type: SoundType, volume: number): void {
  if (!nativeAudioReady) return;
  
  NativeAudio.play({ assetId: type, time: 0 }).catch(() => {});
  NativeAudio.setVolume({ assetId: type, volume }).catch(() => {});
}

function playNativeBGM(): void {
  if (!nativeAudioReady) return;
  
  NativeAudio.loop({ assetId: 'bgm' }).catch(e => console.debug('BGM loop failed:', e));
  NativeAudio.setVolume({ assetId: 'bgm', volume: 0.25 }).catch(() => {});
}

function stopNativeBGM(): void {
  if (!nativeAudioReady) return;
  NativeAudio.stop({ assetId: 'bgm' }).catch(() => {});
}

// ========== WEB AUDIO API FALLBACK ==========

let audioContext: AudioContext | null = null;
let isUnlocked = false;
const audioBuffers = new Map<SoundType, AudioBuffer>();

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function unlockAudioContext(): void {
  if (isNative) {
    isUnlocked = true;
    return;
  }
  
  const ctx = getAudioContext();
  
  if (ctx.state === 'suspended') {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    
    ctx.resume().then(() => {
      isUnlocked = true;
      console.debug('AudioContext unlocked!');
    }).catch(() => {
      isUnlocked = true;
    });
  } else {
    isUnlocked = true;
  }
}

export function isAudioUnlocked(): boolean {
  return isUnlocked || isNative;
}

async function loadWebSound(url: string, key: SoundType): Promise<void> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer);
    audioBuffers.set(key, audioBuffer);
  } catch (e) {
    console.debug('Failed to load sound:', key, e);
  }
}

async function preloadWebAudio(): Promise<void> {
  getAudioContext();
  
  const loadPromises = Object.entries(SOUND_ASSETS).map(([key, asset]) => 
    loadWebSound(asset.url, key as SoundType)
  );
  
  await Promise.all(loadPromises);
  console.debug('Web audio preloaded');
}

function playWebSound(type: SoundType, volume: number): void {
  if (!isUnlocked) {
    unlockAudioContext();
  }
  
  const buffer = audioBuffers.get(type);
  if (!buffer) return;
  
  try {
    const ctx = getAudioContext();
    
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

// Web BGM
let bgmAudio: HTMLAudioElement | null = null;

function playWebBGM(): void {
  if (!isUnlocked) {
    unlockAudioContext();
  }
  
  if (!bgmAudio) {
    bgmAudio = new Audio(BGM_ASSET.url);
    bgmAudio.loop = true;
    bgmAudio.volume = 0.25;
    bgmAudio.preload = 'auto';
  }
  
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  
  bgmAudio.play().catch(e => console.debug('BGM play failed:', e));
}

function stopWebBGM(): void {
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
  }
}

function pauseWebBGM(): void {
  if (bgmAudio) {
    bgmAudio.pause();
  }
}

function resumeWebBGM(): void {
  if (bgmAudio && bgmAudio.paused) {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    bgmAudio.play().catch(e => console.debug('BGM resume failed:', e));
  }
}

// ========== PUBLIC API (HYBRID) ==========

export async function preloadSounds(): Promise<void> {
  if (isNative) {
    await preloadNativeAudio();
  } else {
    await preloadWebAudio();
  }
}

export function playSound(type: SoundType, volume = 0.5): void {
  if (isNative) {
    playNativeSound(type, volume);
  } else {
    playWebSound(type, volume);
  }
}

export function playSoundIfEnabled(type: SoundType, soundEnabled: boolean, volume = 0.5): void {
  if (soundEnabled) {
    playSound(type, volume);
  }
}

export function playBGM(): void {
  if (isNative) {
    playNativeBGM();
  } else {
    playWebBGM();
  }
}

export function stopBGM(): void {
  if (isNative) {
    stopNativeBGM();
  } else {
    stopWebBGM();
  }
}

export function pauseBGM(): void {
  if (isNative) {
    // Native audio doesn't have pause, use stop
    stopNativeBGM();
  } else {
    pauseWebBGM();
  }
}

export function resumeBGM(): void {
  if (isNative) {
    playNativeBGM();
  } else {
    resumeWebBGM();
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
