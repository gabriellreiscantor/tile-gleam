import React from 'react';
import { cn } from '@/lib/utils';
import { isNativePlatform } from '@/lib/adConfig';

interface BannerAdProps {
  className?: string;
}

// Banner height constants
export const BANNER_HEIGHT = 50; // Standard banner height
export const BANNER_TOTAL_HEIGHT = 50; // Total space including padding

const BannerAd: React.FC<BannerAdProps> = ({ className }) => {
  // On native, AdMob handles the banner natively - we just reserve space
  // On web, we show a placeholder banner
  const isNative = isNativePlatform();
  
  if (isNative) {
    // Native: Just reserve space for the native AdMob banner
    return (
      <div 
        className={cn("w-full", className)}
        style={{ 
          height: BANNER_TOTAL_HEIGHT,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      />
    );
  }
  
  // Web: Show placeholder banner
  return (
    <div 
      className={cn(
        "w-full flex items-center justify-center",
        "bg-gradient-to-r from-slate-800/90 via-slate-700/90 to-slate-800/90",
        "border-t border-white/10",
        "backdrop-blur-sm",
        className
      )}
      style={{ 
        height: BANNER_TOTAL_HEIGHT,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">
          Ad
        </span>
        <div className="w-px h-3 bg-white/20" />
        <span className="text-xs text-white/40">
          Advertisement Placeholder
        </span>
      </div>
    </div>
  );
};

export default BannerAd;
