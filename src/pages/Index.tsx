import { useEffect } from 'react';
import BlockBlastGame from '@/components/game/BlockBlastGame';
import BannerAd from '@/components/game/BannerAd';
import { initializeAds, showBanner, preloadRewardedAd } from '@/lib/adService';

const Index = () => {
  useEffect(() => {
    const setupAds = async () => {
      await initializeAds();
      await showBanner();
      preloadRewardedAd();
    };
    setupAds();
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      {/* Game takes all available space */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <BlockBlastGame />
      </div>
      
      {/* Banner Ad - immediately below game content */}
      <BannerAd />
    </div>
  );
};

export default Index;
