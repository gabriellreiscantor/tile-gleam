import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimulatedAdOverlayProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip?: () => void;
  duration?: number; // seconds
}

const SimulatedAdOverlay: React.FC<SimulatedAdOverlayProps> = ({
  isOpen,
  onComplete,
  onSkip,
  duration = 5,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(duration);
      setCanSkip(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, duration]);

  const handleClose = () => {
    if (canSkip) {
      onComplete();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {/* Ad content area - 9:16 aspect ratio simulation */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Fake ad content */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          }}
        />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-20"
              style={{
                width: `${60 + i * 30}px`,
                height: `${60 + i * 30}px`,
                background: `hsl(${200 + i * 30} 70% 50%)`,
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animation: `pulse ${2 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Fake ad message */}
        <div className="relative z-10 text-center px-8">
          <div className="text-6xl mb-6">🎮</div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Sponsored Content
          </h2>
          <p className="text-white/60 text-sm max-w-xs mx-auto">
            This is a simulated ad experience. In the real app, a video ad from AdMob will play here.
          </p>
          
          {/* Fake CTA */}
          <div className="mt-8 px-8 py-4 rounded-xl bg-primary/20 border border-primary/30">
            <p className="text-primary font-semibold">Install Now</p>
            <p className="text-white/40 text-xs mt-1">Advertisement</p>
          </div>
        </div>
      </div>

      {/* Close button area */}
      <div className="absolute top-4 right-4 safe-area-inset-top">
        <button
          onClick={handleClose}
          disabled={!canSkip}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "transition-all duration-300",
            canSkip 
              ? "bg-white/20 hover:bg-white/30 cursor-pointer" 
              : "bg-white/10 cursor-not-allowed"
          )}
        >
          {canSkip ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <span className="text-white font-bold text-sm">{timeLeft}</span>
          )}
        </button>
      </div>

      {/* Bottom progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-linear"
          style={{
            width: `${((duration - timeLeft) / duration) * 100}%`,
          }}
        />
      </div>

      {/* Skip hint */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-white/40 text-xs">
          {canSkip ? 'Tap X to close and continue playing' : `Ad closes in ${timeLeft}s`}
        </p>
      </div>
    </div>
  );
};

export default SimulatedAdOverlay;
