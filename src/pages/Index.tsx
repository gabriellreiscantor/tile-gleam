import BlockBlastGame from '@/components/game/BlockBlastGame';
import BannerAd, { BANNER_TOTAL_HEIGHT } from '@/components/game/BannerAd';
import { SafeAreaProvider, useSafeArea } from '@/components/game/SafeAreaProvider';
import { useEffect } from 'react';
import { initializeAds, showBanner, preloadRewardedAd } from '@/lib/adService';

const GameWithAds = () => {
  const { totalBottomPadding } = useSafeArea();

  useEffect(() => {
    // Initialize ads and show banner on mount
    const setupAds = async () => {
      await initializeAds();
      await showBanner();
      // Preload rewarded ad for faster display when needed
      await preloadRewardedAd();
    };
    
    setupAds();
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Game content with bottom padding for banner */}
      <div 
        className="flex-1 overflow-hidden"
        style={{ paddingBottom: totalBottomPadding }}
      >
        <BlockBlastGame />
      </div>
      
      {/* Fixed banner at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BannerAd />
      </div>
    </main>
  );
};

const Index = () => {
  return (
    <SafeAreaProvider>
      <GameWithAds />
    </SafeAreaProvider>
  );
};

export default Index;
