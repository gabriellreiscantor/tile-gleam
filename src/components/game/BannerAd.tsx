import React from 'react';
import { cn } from '@/lib/utils';
import { isNativePlatform } from '@/lib/adConfig';

// Standard banner height (50px) + safe area
export const BANNER_HEIGHT = 50;

const BannerAd: React.FC = () => {
  const isNative = isNativePlatform();

  // On native, AdMob renders its own banner - we just reserve space
  // On web, we show a placeholder for development
  return (
    <div 
      className={cn(
        "flex-shrink-0 w-full flex items-center justify-center",
        "bg-muted/80 border-t border-border/50"
      )}
      style={{ 
        height: BANNER_HEIGHT,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {!isNative && (
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span className="px-1.5 py-0.5 bg-muted-foreground/20 rounded text-[10px] font-medium">
            AD
          </span>
          <span>Advertisement Placeholder</span>
        </div>
      )}
    </div>
  );
};

export default BannerAd;
