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
    >
      {/* Background image */}
      <img
        src="/splash.jpg"
        alt="Block Blast"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Content overlay */}
      <div className="relative flex flex-col items-center gap-4 mt-[45%]">
        {/* Game title */}
        <div className="text-center">
          <h1 
            className="text-4xl font-bold tracking-tight drop-shadow-lg"
            style={{
              background: 'linear-gradient(to bottom, hsl(0 0% 100%), hsl(200 50% 80%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Block Blast
          </h1>
          <p className="text-white/60 text-sm mt-1 drop-shadow">
            Puzzle Game
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-white/70"
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
