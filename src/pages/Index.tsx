import { useEffect } from 'react';
import BlockBlastGame from '@/components/game/BlockBlastGame';
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

  return <BlockBlastGame />;
};

export default Index;
