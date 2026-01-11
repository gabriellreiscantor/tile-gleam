import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.blockexplosion',
  appName: 'Block Explosion',
  webDir: 'dist',
  server: {
    url: 'https://d4f6b2d5-84ea-4014-8996-dada837aa7ab.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
