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
    <div className="fixed inset-0 z-[90] pointer-events-none">
      {/* Semi-transparent overlay - pointer-events-auto to block other areas */}
      <div 
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        style={{
          // Cut out the star button area so clicks pass through
          clipPath: starButtonRect 
            ? `polygon(
                0% 0%, 
                100% 0%, 
                100% 100%, 
                0% 100%, 
                0% 0%,
                ${starButtonRect.left - 20}px ${starButtonRect.top - 20}px,
                ${starButtonRect.left - 20}px ${starButtonRect.bottom + 20}px,
                ${starButtonRect.right + 20}px ${starButtonRect.bottom + 20}px,
                ${starButtonRect.right + 20}px ${starButtonRect.top - 20}px,
                ${starButtonRect.left - 20}px ${starButtonRect.top - 20}px
              )`
            : 'none',
        }}
      />
      
      {/* Arrow pointing to star button - positioned to the left */}
      {starButtonRect && (
        <div 
          className="absolute flex items-center gap-2 animate-pulse pointer-events-none"
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
    </div>
  );
};

export default StarTutorialOverlay;
