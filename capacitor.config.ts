import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d4f6b2d584ea40148996dada837aa7ab',
  appName: 'tile-gleam',
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
