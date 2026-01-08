import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { type TutorialStep, getTutorialHintText, getTutorialHintPosition } from '@/lib/tutorial';

interface TutorialOverlayProps {
  step: TutorialStep;
  targetPosition?: { x: number; y: number };
  pieceRef?: React.RefObject<HTMLDivElement>;
  boardRef?: React.RefObject<HTMLDivElement>;
  onRewardComplete?: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  step,
  onRewardComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animateOut, setAnimateOut] = useState(false);
  
  const hintText = getTutorialHintText(step);
  const position = getTutorialHintPosition(step);
  
  // Auto-advance after reward/complete steps
  useEffect(() => {
    if (step === 'reward') {
      const timer = setTimeout(() => {
        setAnimateOut(true);
        setTimeout(() => {
          onRewardComplete?.();
        }, 300);
      }, 1200);
      return () => clearTimeout(timer);
    }
    
    if (step === 'complete') {
      const timer = setTimeout(() => {
        setAnimateOut(true);
        setTimeout(() => {
          onRewardComplete?.();
        }, 300);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, onRewardComplete]);
  
  // Reset animation state on step change
  useEffect(() => {
    setIsVisible(true);
    setAnimateOut(false);
  }, [step]);

  if (step === 'done' || !hintText) return null;

  const isCenter = position === 'center';
  const isReward = step === 'reward';
  const isComplete = step === 'complete';

  return (
    <div 
      className={cn(
        "fixed inset-0 pointer-events-none z-40",
        "flex items-center justify-center"
      )}
    >
      {/* Floating hint text */}
      <div
        className={cn(
          "tutorial-hint transition-all duration-300",
          isCenter ? "tutorial-hint-center" : "",
          isReward && "tutorial-hint-reward",
          isComplete && "tutorial-hint-complete",
          animateOut && "opacity-0 scale-90"
        )}
        style={{
          position: 'absolute',
          ...(position === 'piece' && {
            bottom: '180px',
            left: '50%',
            transform: 'translateX(-50%)',
          }),
          ...(position === 'grid' && {
            bottom: '45%',
            left: '50%',
            transform: 'translateX(-50%)',
          }),
          ...(isCenter && {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }),
        }}
      >
        <span className={cn(
          "text-white font-bold",
          isReward ? "text-4xl" : isComplete ? "text-2xl" : "text-lg",
          "drop-shadow-lg"
        )}>
          {hintText}
        </span>
        
        {/* Animated arrow for piece step */}
        {step === 'pick-piece' && (
          <div className="tutorial-arrow mt-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="animate-bounce">
              <path d="M12 4L12 20M12 20L6 14M12 20L18 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorialOverlay;
