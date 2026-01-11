import React from 'react';
import { cn } from '@/lib/utils';
import type { StarTutorialState } from '@/lib/starTutorial';

interface StarTutorialOverlayProps {
  state: StarTutorialState;
  starButtonRef?: React.RefObject<HTMLButtonElement>;
}

const StarTutorialOverlay: React.FC<StarTutorialOverlayProps> = ({
  state,
  starButtonRef,
}) => {
  if (!state.isActive || state.step !== 'show-arrow') {
    return null;
  }

  // Get star button position for arrow
  const starButtonRect = starButtonRef?.current?.getBoundingClientRect();
  
  return (
    <div className="fixed inset-0 z-[90] pointer-events-auto">
      {/* Semi-transparent overlay to block interactions */}
      <div 
        className="absolute inset-0 bg-black/50"
        style={{
          // Cut out the star button area
          maskImage: starButtonRect 
            ? `radial-gradient(circle at ${starButtonRect.left + starButtonRect.width / 2}px ${starButtonRect.top + starButtonRect.height / 2}px, transparent 40px, black 60px)`
            : 'none',
          WebkitMaskImage: starButtonRect 
            ? `radial-gradient(circle at ${starButtonRect.left + starButtonRect.width / 2}px ${starButtonRect.top + starButtonRect.height / 2}px, transparent 40px, black 60px)`
            : 'none',
        }}
      />
      
      {/* Arrow pointing to star button - positioned to the left */}
      {starButtonRect && (
        <div 
          className="absolute flex items-center gap-2 animate-pulse"
          style={{
            right: window.innerWidth - starButtonRect.left + 12,
            top: starButtonRect.top + starButtonRect.height / 2,
            transform: 'translateY(-50%)',
          }}
        >
          {/* Hint text */}
          <div className={cn(
            "px-4 py-2 rounded-xl",
            "bg-gradient-to-r from-yellow-500 to-amber-500",
            "text-white font-bold text-sm",
            "shadow-lg shadow-yellow-500/30",
            "whitespace-nowrap"
          )}>
            Tap to activate! ⭐
          </div>
          
          {/* Arrow pointing right */}
          <div className="text-3xl drop-shadow-lg animate-bounce">
            👉
          </div>
        </div>
      )}
      
      {/* Glow effect around star button */}
      {starButtonRect && (
        <div 
          className="absolute rounded-full animate-pulse"
          style={{
            left: starButtonRect.left - 8,
            top: starButtonRect.top - 8,
            width: starButtonRect.width + 16,
            height: starButtonRect.height + 16,
            boxShadow: '0 0 20px 8px rgba(234, 179, 8, 0.5), 0 0 40px 16px rgba(234, 179, 8, 0.3)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

export default StarTutorialOverlay;
