// Ad Configuration for AdMob
// Uses test ad unit IDs for development, switch to production IDs before release

export const AD_CONFIG = {
  // Set to false in production to use real ad unit IDs
  useTestAds: true,
  
  // Google's official test ad unit IDs
  test: {
    ios: {
      banner: 'ca-app-pub-3940256099942544/2934735716',
      rewarded: 'ca-app-pub-3940256099942544/1712485313',
    },
    android: {
      banner: 'ca-app-pub-3940256099942544/6300978111',
      rewarded: 'ca-app-pub-3940256099942544/5224354917',
    },
  },
  
  // Replace with your production ad unit IDs
  production: {
    ios: {
      banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
      rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ',
    },
    android: {
      banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
      rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ',
    },
  },
  
  // Banner configuration
  banner: {
    position: 'BOTTOM_CENTER' as const,
    margin: 0, // Will be set dynamically based on safe area
  },
};

export function getAdUnitId(type: 'banner' | 'rewarded', platform: 'ios' | 'android'): string {
  const config = AD_CONFIG.useTestAds ? AD_CONFIG.test : AD_CONFIG.production;
  return config[platform][type];
}

export function isNativePlatform(): boolean {
  // Check if running in Capacitor native environment
  return typeof window !== 'undefined' && 
         'Capacitor' in window && 
         (window as any).Capacitor?.isNativePlatform?.() === true;
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  if (!isNativePlatform()) return 'web';
  
  const platform = (window as any).Capacitor?.getPlatform?.();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return 'web';
}
