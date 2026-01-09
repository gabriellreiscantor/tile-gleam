import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  duration = 1500 
}) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 300);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300",
        fadeOut ? "opacity-0" : "opacity-100"
      )}
      style={{
        background: 'linear-gradient(145deg, hsl(250 60% 25%) 0%, hsl(220 70% 15%) 50%, hsl(200 80% 12%) 100%)',
      }}
    >
      {/* Animated background glow */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 50% 40%, hsl(200 100% 50% / 0.4) 0%, transparent 50%)',
        }}
      />
      
      {/* Logo container */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Game icon - stylized block grid */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-1 p-3 rounded-2xl bg-white/5 backdrop-blur-sm">
            {[1, 6, 4, 7, 2, 5, 3, 8, 1].map((color, i) => (
              <div
                key={i}
                className={cn(
                  "w-8 h-8 rounded-lg game-tile",
                  `tile-${color}`,
                  "animate-pulse"
                )}
                style={{
                  animationDelay: `${i * 100}ms`,
                  animationDuration: '1.5s',
                }}
              />
            ))}
          </div>
          
          {/* Glow effect behind icon */}
          <div 
            className="absolute inset-0 -z-10 blur-xl opacity-50"
            style={{
              background: 'radial-gradient(circle, hsl(200 100% 60%) 0%, transparent 70%)',
              transform: 'scale(1.5)',
            }}
          />
        </div>

        {/* Game title */}
        <div className="text-center">
          <h1 
            className="text-4xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(to bottom, hsl(0 0% 100%), hsl(200 50% 80%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Block Blast
          </h1>
          <p className="text-muted-foreground text-sm mt-1 opacity-60">
            Puzzle Game
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex gap-1 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary/60"
              style={{
                animation: 'pulse 1s ease-in-out infinite',
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
