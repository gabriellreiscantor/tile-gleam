import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface StarConvergenceProps {
  isActive: boolean;
  dominantColor: number;
  affectedCells: { x: number; y: number }[];
  totalPoints: number;
  onComplete: () => void;
}

type AnimationPhase = 'flash' | 'title' | 'blocks-explode' | 'shockwave' | 'score' | 'done';

// Color palette matching game colors (HSL values)
const TILE_COLORS: Record<number, string> = {
  1: 'hsl(217, 91%, 60%)',   // Blue
  2: 'hsl(142, 71%, 45%)',   // Green
  3: 'hsl(48, 96%, 53%)',    // Yellow
  4: 'hsl(0, 84%, 60%)',     // Red
  5: 'hsl(271, 81%, 56%)',   // Purple
  6: 'hsl(330, 81%, 60%)',   // Pink
  7: 'hsl(187, 85%, 53%)',   // Cyan
  8: 'hsl(25, 95%, 53%)',    // Orange
};

interface BlockParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  distance: number;
  delay: number;
  size: number;
  rotation: number;
}

const StarConvergence: React.FC<StarConvergenceProps> = ({
  isActive,
  dominantColor,
  affectedCells,
  totalPoints,
  onComplete,
}) => {
  const [phase, setPhase] = useState<AnimationPhase>('flash');
  
  // Generate block particles for explosion
  const blockParticles = useMemo<BlockParticle[]>(() => {
    if (!isActive) return [];
    
    // Create particles for each cell
    const particles: BlockParticle[] = [];
    let id = 0;
    
    affectedCells.forEach((cell, cellIndex) => {
      // Each cell creates 3-5 particles
      const particleCount = 3 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          id: id++,
          x: 50 + (cell.x - 4) * 8 + Math.random() * 4, // % position
          y: 40 + (cell.y - 4) * 8 + Math.random() * 4,
          color: TILE_COLORS[dominantColor] || TILE_COLORS[1],
          angle: Math.random() * 360,
          distance: 100 + Math.random() * 200,
          delay: cellIndex * 15 + i * 10,
          size: 8 + Math.random() * 16,
          rotation: Math.random() * 720 - 360,
        });
      }
    });
    
    return particles;
  }, [isActive, affectedCells, dominantColor]);

  // Animation sequence - EPIC explosion
  useEffect(() => {
    if (!isActive) {
      setPhase('flash');
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    // Phase 1: White flash (0.15s)
    timers.push(setTimeout(() => setPhase('title'), 150));

    // Phase 2: Title with star (0.6s)
    timers.push(setTimeout(() => setPhase('blocks-explode'), 750));

    // Phase 3: Blocks explode outward (0.8s)
    timers.push(setTimeout(() => setPhase('shockwave'), 1550));

    // Phase 4: Shockwave ring (0.4s)
    timers.push(setTimeout(() => setPhase('score'), 1950));

    // Phase 5: Score display (1s)
    timers.push(setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 2950));

    return () => timers.forEach(clearTimeout);
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* White flash on activation */}
      <div
        className={cn(
          "absolute inset-0 bg-white transition-opacity",
          phase === 'flash' ? 'opacity-80' : 'opacity-0'
        )}
        style={{ transitionDuration: '150ms' }}
      />
      
      {/* Dark overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-black/80 transition-opacity duration-300",
          phase === 'flash' ? 'opacity-0' : 'opacity-100'
        )}
      />

      {/* Star title */}
      {(phase === 'title' || phase === 'blocks-explode' || phase === 'shockwave') && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "text-center transform transition-all",
              phase === 'title' && 'scale-100 opacity-100 animate-star-pulse',
              phase === 'blocks-explode' && 'scale-90 opacity-80',
              phase === 'shockwave' && 'scale-75 opacity-0 -translate-y-10'
            )}
            style={{ transitionDuration: '400ms' }}
          >
            <div className="text-7xl mb-4 animate-spin-slow drop-shadow-[0_0_30px_rgba(234,179,8,0.8)]">
              ⭐
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-orange-500 drop-shadow-lg tracking-wider">
              STAR POWER!
            </h1>
            <p className="text-yellow-200/80 text-lg mt-2 font-medium">
              {affectedCells.length} blocks obliterated!
            </p>
          </div>
        </div>
      )}

      {/* Block explosion particles */}
      {(phase === 'blocks-explode' || phase === 'shockwave' || phase === 'score') && (
        <div className="absolute inset-0">
          {blockParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute rounded-sm shadow-lg"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size}px ${particle.color}`,
                animation: `block-explode 0.8s ease-out forwards`,
                animationDelay: `${particle.delay}ms`,
                '--angle': `${particle.angle}deg`,
                '--distance': `${particle.distance}px`,
                '--rotation': `${particle.rotation}deg`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Central shockwave ring */}
      {phase === 'shockwave' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="rounded-full border-4 border-yellow-400 animate-shockwave"
            style={{
              boxShadow: '0 0 40px 10px rgba(234, 179, 8, 0.6), inset 0 0 40px 10px rgba(234, 179, 8, 0.3)',
            }}
          />
        </div>
      )}

      {/* Sparkle particles */}
      {(phase === 'blocks-explode' || phase === 'shockwave' || phase === 'score') && (
        <div className="absolute inset-0">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute text-2xl animate-sparkle-burst"
              style={{
                left: '50%',
                top: '45%',
                '--angle': `${(i / 40) * 360}deg`,
                '--distance': `${120 + Math.random() * 180}px`,
                animationDelay: `${i * 25}ms`,
              } as React.CSSProperties}
            >
              ✨
            </div>
          ))}
        </div>
      )}

      {/* Final score with epic entrance */}
      {phase === 'score' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center animate-score-entrance">
            <div className="text-5xl mb-2">🌟</div>
            <h2 className="text-2xl md:text-3xl font-black text-amber-300 mb-3 tracking-wide">
              LEGENDARY CLEAR!
            </h2>
            <div 
              className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-orange-500 animate-score-pulse"
              style={{
                textShadow: '0 0 40px rgba(234, 179, 8, 0.8)',
              }}
            >
              +{totalPoints.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Inline keyframes */}
      <style>{`
        @keyframes block-explode {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(cos(var(--angle)) * var(--distance)),
              calc(sin(var(--angle)) * var(--distance))
            ) rotate(var(--rotation)) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes shockwave {
          0% {
            width: 20px;
            height: 20px;
            opacity: 1;
          }
          100% {
            width: 400px;
            height: 400px;
            opacity: 0;
          }
        }
        
        .animate-shockwave {
          animation: shockwave 0.5s ease-out forwards;
        }
        
        @keyframes sparkle-burst {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(
              calc(cos(var(--angle)) * calc(var(--distance) * 0.3)),
              calc(sin(var(--angle)) * calc(var(--distance) * 0.3))
            ) scale(1);
          }
          100% {
            transform: translate(-50%, -50%) translate(
              calc(cos(var(--angle)) * var(--distance)),
              calc(sin(var(--angle)) * var(--distance))
            ) scale(0);
            opacity: 0;
          }
        }
        
        .animate-sparkle-burst {
          animation: sparkle-burst 1s ease-out forwards;
        }
        
        @keyframes star-pulse {
          0%, 100% { 
            transform: scale(1); 
            filter: drop-shadow(0 0 20px rgba(234, 179, 8, 0.8));
          }
          50% { 
            transform: scale(1.05); 
            filter: drop-shadow(0 0 40px rgba(234, 179, 8, 1));
          }
        }
        
        .animate-star-pulse {
          animation: star-pulse 0.4s ease-in-out infinite;
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
        
        @keyframes score-entrance {
          0% {
            transform: scale(0.3) translateY(50px);
            opacity: 0;
          }
          60% {
            transform: scale(1.1) translateY(-10px);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        .animate-score-entrance {
          animation: score-entrance 0.5s ease-out forwards;
        }
        
        @keyframes score-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        
        .animate-score-pulse {
          animation: score-pulse 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default StarConvergence;
