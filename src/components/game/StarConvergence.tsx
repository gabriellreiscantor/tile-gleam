import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface StarConvergenceProps {
  isActive: boolean;
  dominantColor: number;
  affectedCells: { x: number; y: number }[];
  totalPoints: number;
  onComplete: () => void;
}

type AnimationPhase = 'fade-in' | 'title' | 'glow' | 'explosion' | 'score' | 'done';

// Color palette matching game colors
const COLOR_CLASSES: Record<number, string> = {
  1: 'bg-blue-500',
  2: 'bg-green-500',
  3: 'bg-yellow-500',
  4: 'bg-red-500',
  5: 'bg-purple-500',
  6: 'bg-pink-500',
  7: 'bg-cyan-500',
  8: 'bg-orange-500',
};

const StarConvergence: React.FC<StarConvergenceProps> = ({
  isActive,
  dominantColor,
  affectedCells,
  totalPoints,
  onComplete,
}) => {
  const [phase, setPhase] = useState<AnimationPhase>('fade-in');
  const [showParticles, setShowParticles] = useState(false);

  // Animation sequence
  useEffect(() => {
    if (!isActive) return;

    const timers: NodeJS.Timeout[] = [];

    // Phase 1: Fade in overlay (0.3s)
    timers.push(setTimeout(() => setPhase('title'), 300));

    // Phase 2: Title appears (0.5s)
    timers.push(setTimeout(() => setPhase('glow'), 800));

    // Phase 3: Cells glow (0.8s)
    timers.push(setTimeout(() => {
      setPhase('explosion');
      setShowParticles(true);
    }, 1600));

    // Phase 4: Explosion (0.5s)
    timers.push(setTimeout(() => setPhase('score'), 2100));

    // Phase 5: Score display (0.7s)
    timers.push(setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 2800));

    return () => timers.forEach(clearTimeout);
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Dark overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-black/70 transition-opacity duration-300",
          phase === 'fade-in' ? 'opacity-0' : 'opacity-100'
        )}
      />

      {/* Main title */}
      {(phase === 'title' || phase === 'glow' || phase === 'explosion' || phase === 'score') && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "text-center transform transition-all duration-500",
              phase === 'title' ? 'scale-100 opacity-100' : '',
              phase === 'glow' || phase === 'explosion' ? 'scale-110 opacity-90' : '',
              phase === 'score' ? 'scale-90 opacity-0 -translate-y-20' : ''
            )}
          >
            <div className="text-6xl mb-4 animate-pulse">⭐</div>
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 drop-shadow-lg">
              STAR CONVERGENCE!
            </h1>
          </div>
        </div>
      )}

      {/* Glowing cells indicator */}
      {phase === 'glow' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-yellow-200 font-medium animate-pulse">
              {affectedCells.length} blocks converging...
            </p>
          </div>
        </div>
      )}

      {/* Explosion particles */}
      {showParticles && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-yellow-400 shadow-lg shadow-yellow-500/50"
              style={{
                animation: `particle-burst 0.8s ease-out forwards`,
                animationDelay: `${i * 20}ms`,
                '--angle': `${(i / 30) * 360}deg`,
                '--distance': `${150 + Math.random() * 100}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Final score */}
      {phase === 'score' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center animate-scale-in">
            <h2 className="text-2xl md:text-3xl font-black text-amber-300 mb-2">
              LEGENDARY STAR COMBO!
            </h2>
            <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-orange-500">
              +{totalPoints.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Inline keyframes for particles */}
      <style>{`
        @keyframes particle-burst {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(cos(var(--angle)) * var(--distance)),
              calc(sin(var(--angle)) * var(--distance))
            ) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes scale-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default StarConvergence;
