// Ad Service - Manages banner and rewarded ads
// Uses @capacitor-community/admob on native, placeholder on web

import { getAdUnitId, getPlatform, isNativePlatform, AD_CONFIG } from './adConfig';
import { loadSettings } from './settings';

type AdMobPlugin = {
  initialize: (options: { initializeForTesting?: boolean }) => Promise<void>;
  showBanner: (options: {
    adId: string;
    position: string;
    margin?: number;
    isTesting?: boolean;
  }) => Promise<void>;
  hideBanner: () => Promise<void>;
  prepareRewardVideoAd: (options: { adId: string }) => Promise<void>;
  showRewardVideoAd: () => Promise<{ type: string; amount: number }>;
};

let admobPlugin: AdMobPlugin | null = null;
let isInitialized = false;
let rewardedAdLoaded = false;

// Get AdMob plugin from Capacitor's registered plugins (no import needed)
// The plugin registers itself globally when installed in native builds
function getAdMob(): AdMobPlugin | null {
  if (!isNativePlatform()) return null;
  
  try {
    // Access through Capacitor's plugin registry - avoids build-time import issues
    const Capacitor = (window as any).Capacitor;
    if (Capacitor?.Plugins?.AdMob) {
      return Capacitor.Plugins.AdMob as AdMobPlugin;
    }
    console.warn('[AdService] AdMob plugin not registered');
    return null;
  } catch (e) {
    console.warn('[AdService] AdMob plugin not available:', e);
    return null;
  }
}

export async function initializeAds(): Promise<boolean> {
  if (isInitialized) return true;
  if (!isNativePlatform()) {
    console.log('[AdService] Running on web - using placeholder ads');
    isInitialized = true;
    return true;
  }
  
  try {
    admobPlugin = getAdMob();
    if (!admobPlugin) return false;
    
    await admobPlugin.initialize({
      initializeForTesting: AD_CONFIG.useTestAds,
    });
    
    isInitialized = true;
    console.log('[AdService] AdMob initialized successfully');
    return true;
  } catch (e) {
    console.error('[AdService] Failed to initialize AdMob:', e);
    return false;
  }
}

export async function showBanner(bottomMargin: number = 0): Promise<boolean> {
  if (!isNativePlatform()) {
    console.log('[AdService] Web mode - banner is handled by BannerAd component');
    return true;
  }
  
  if (!admobPlugin) {
    await initializeAds();
    if (!admobPlugin) return false;
  }
  
  try {
    const platform = getPlatform();
    if (platform === 'web') return false;
    
    await admobPlugin.showBanner({
      adId: getAdUnitId('banner', platform),
      position: AD_CONFIG.banner.position,
      margin: bottomMargin,
      isTesting: AD_CONFIG.useTestAds,
    });
    
    console.log('[AdService] Banner shown');
    return true;
  } catch (e) {
    console.error('[AdService] Failed to show banner:', e);
    return false;
  }
}

export async function hideBanner(): Promise<void> {
  if (!isNativePlatform() || !admobPlugin) return;
  
  try {
    await admobPlugin.hideBanner();
    console.log('[AdService] Banner hidden');
  } catch (e) {
    console.error('[AdService] Failed to hide banner:', e);
  }
}

export async function preloadRewardedAd(): Promise<boolean> {
  if (!isNativePlatform()) {
    console.log('[AdService] Web mode - rewarded ads simulated');
    rewardedAdLoaded = true;
    return true;
  }
  
  if (!admobPlugin) {
    await initializeAds();
    if (!admobPlugin) return false;
  }
  
  try {
    const platform = getPlatform();
    if (platform === 'web') return false;
    
    await admobPlugin.prepareRewardVideoAd({
      adId: getAdUnitId('rewarded', platform),
    });
    
    rewardedAdLoaded = true;
    console.log('[AdService] Rewarded ad preloaded');
    return true;
  } catch (e) {
    console.error('[AdService] Failed to preload rewarded ad:', e);
    rewardedAdLoaded = false;
    return false;
  }
}

export interface RewardedAdResult {
  success: boolean;
  reward?: { type: string; amount: number };
  error?: string;
}

export async function showRewardedAd(): Promise<RewardedAdResult> {
  // Web mode - simulate watching an ad
  if (!isNativePlatform()) {
    console.log('[AdService] Web mode - simulating rewarded ad');
    // Simulate ad duration
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, reward: { type: 'continue', amount: 1 } };
  }
  
  if (!admobPlugin) {
    await initializeAds();
    if (!admobPlugin) {
      return { success: false, error: 'AdMob not available' };
    }
  }
  
  try {
    // Load ad if not preloaded
    if (!rewardedAdLoaded) {
      const loaded = await preloadRewardedAd();
      if (!loaded) {
        return { success: false, error: 'Failed to load ad' };
      }
    }
    
    const reward = await admobPlugin.showRewardVideoAd();
    rewardedAdLoaded = false; // Reset for next time
    
    // Preload next ad in background
    preloadRewardedAd().catch(() => {});
    
    return { success: true, reward };
  } catch (e) {
    console.error('[AdService] Failed to show rewarded ad:', e);
    rewardedAdLoaded = false;
    return { success: false, error: 'Ad failed to show' };
  }
}

export function isRewardedAdReady(): boolean {
  return rewardedAdLoaded;
}

// Check if personalized ads are allowed based on settings
export function shouldShowPersonalizedAds(): boolean {
  try {
    const settings = loadSettings();
    return settings.personalizedAds ?? true;
  } catch {
    return true;
  }
}
