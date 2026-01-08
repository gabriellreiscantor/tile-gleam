import React, { createContext, useContext, useState, useEffect } from 'react';
import { BANNER_TOTAL_HEIGHT } from './BannerAd';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface SafeAreaContextValue {
  insets: SafeAreaInsets;
  bannerHeight: number;
  totalBottomPadding: number;
}

const SafeAreaContext = createContext<SafeAreaContextValue>({
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
  bannerHeight: BANNER_TOTAL_HEIGHT,
  totalBottomPadding: BANNER_TOTAL_HEIGHT,
});

export const useSafeArea = () => useContext(SafeAreaContext);

interface SafeAreaProviderProps {
  children: React.ReactNode;
}

export const SafeAreaProvider: React.FC<SafeAreaProviderProps> = ({ children }) => {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    // Read CSS environment variables for safe area
    const computeInsets = () => {
      const style = getComputedStyle(document.documentElement);
      
      // Create a temporary element to measure env() values
      const div = document.createElement('div');
      div.style.cssText = `
        position: fixed;
        top: env(safe-area-inset-top, 0px);
        bottom: env(safe-area-inset-bottom, 0px);
        left: env(safe-area-inset-left, 0px);
        right: env(safe-area-inset-right, 0px);
        pointer-events: none;
        visibility: hidden;
      `;
      document.body.appendChild(div);
      
      const rect = div.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      
      setInsets({
        top: rect.top,
        bottom: windowHeight - rect.bottom,
        left: rect.left,
        right: windowWidth - rect.right,
      });
      
      document.body.removeChild(div);
    };

    computeInsets();
    window.addEventListener('resize', computeInsets);
    
    return () => window.removeEventListener('resize', computeInsets);
  }, []);

  const totalBottomPadding = BANNER_TOTAL_HEIGHT + insets.bottom;

  return (
    <SafeAreaContext.Provider value={{ 
      insets, 
      bannerHeight: BANNER_TOTAL_HEIGHT,
      totalBottomPadding,
    }}>
      {children}
    </SafeAreaContext.Provider>
  );
};

export default SafeAreaProvider;
