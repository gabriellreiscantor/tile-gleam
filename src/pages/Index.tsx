import { useEffect, useState, useCallback } from 'react';
import BlockBlastGame from '@/components/game/BlockBlastGame';
import SplashScreen from '@/components/game/SplashScreen';
import ConsentModal from '@/components/game/ConsentModal';
import { initializeAds, showBanner, preloadRewardedAd } from '@/lib/adService';
import { hasAcceptedTerms, acceptTerms } from '@/lib/consent';

type AppPhase = 'splash' | 'consent' | 'game';

const Index = () => {
  const [phase, setPhase] = useState<AppPhase>('splash');

  // Check consent status after splash
  const handleSplashComplete = useCallback(() => {
    if (hasAcceptedTerms()) {
      setPhase('game');
    } else {
      setPhase('consent');
    }
  }, []);

  // Handle consent acceptance
  const handleAcceptConsent = useCallback(() => {
    acceptTerms();
    setPhase('game');
  }, []);

  // Initialize ads when game phase starts
  useEffect(() => {
    if (phase === 'game') {
      const setupAds = async () => {
        await initializeAds();
        await showBanner();
        preloadRewardedAd();
      };
      setupAds();
    }
  }, [phase]);

  // Render based on current phase
  if (phase === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} duration={1500} />;
  }

  if (phase === 'consent') {
    return <ConsentModal onAccept={handleAcceptConsent} />;
  }

  return <BlockBlastGame />;
};

export default Index;
