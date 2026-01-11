// ColorOverloadAnimation.tsx - Epic color overload combo animation
import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Tile colors matching index.css
const TILE_COLORS: Record<number, string> = {
  1: 'hsl(0, 85%, 55%)',     // red
  2: 'hsl(28, 95%, 52%)',    // orange
  3: 'hsl(48, 100%, 50%)',   // yellow
  4: 'hsl(145, 80%, 45%)',   // green
  5: 'hsl(185, 95%, 48%)',   // cyan
  6: 'hsl(220, 90%, 58%)',   // blue
  7: 'hsl(270, 85%, 60%)',   // purple
  8: 'hsl(330, 90%, 58%)',   // pink
};

interface ColorOverloadAnimationProps {
  isActive: boolean;
  dominantColor: number;
  cellCount: number;
  totalPoints: number;
  onComplete: () => void;
}

type Phase = 'fade-in' | 'title' | 'convert' | 'shake' | 'explode' | 'score' | 'done';

const ColorOverloadAnimation: React.FC<ColorOverloadAnimationProps> = ({
  isActive,
  dominantColor,
  cellCount,
  totalPoints,
  onComplete,
}) => {
  const [phase, setPhase] = useState<Phase>('fade-in');
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  
  const color = TILE_COLORS[dominantColor] || TILE_COLORS[1];
  
  const generateParticles = useCallback(() => {
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color,
      });
    }
    setParticles(newParticles);
  }, [color]);
  
  useEffect(() => {
    if (!isActive) {
      setPhase('fade-in');
      return;
    }
    
    // Phase timeline
    const timeline = [
      { phase: 'title' as Phase, delay: 300 },
      { phase: 'convert' as Phase, delay: 800 },
      { phase: 'shake' as Phase, delay: 1100 },
      { phase: 'explode' as Phase, delay: 1400 },
      { phase: 'score' as Phase, delay: 2000 },
      { phase: 'done' as Phase, delay: 2700 },
    ];
    
    const timeouts: NodeJS.Timeout[] = [];
    
    timeline.forEach(({ phase: p, delay }) => {
      const t = setTimeout(() => {
        setPhase(p);
        if (p === 'explode') {
          generateParticles();
        }
        if (p === 'done') {
          onComplete();
        }
      }, delay);
      timeouts.push(t);
    });
    
    return () => timeouts.forEach(clearTimeout);
  }, [isActive, onComplete, generateParticles]);
  
  if (!isActive) return null;
  
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Dark overlay */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          phase === 'fade-in' ? "opacity-0" : "opacity-70"
        )}
        style={{ background: 'black' }}
      />
      
      {/* Screen shake container */}
      <div className={cn(
        "absolute inset-0",
        phase === 'shake' && "animate-overload-shake"
      )}>
        {/* White flash on explode */}
        {phase === 'explode' && (
          <div 
            className="absolute inset-0 animate-flash-white"
            style={{ background: 'white' }}
          />
        )}
        
        {/* Particles */}
        {phase === 'explode' && particles.map(p => (
          <div
            key={p.id}
            className="absolute w-3 h-3 rounded-full animate-particle-explode"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              backgroundColor: p.color,
              boxShadow: `0 0 20px ${p.color}`,
              animationDelay: `${Math.random() * 0.3}s`,
            }}
          />
        ))}
        
        {/* Title */}
        {(phase === 'title' || phase === 'convert' || phase === 'shake') && (
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div 
              className={cn(
                "text-4xl md:text-6xl font-black tracking-wider text-center w-full",
                "animate-title-pulse"
              )}
              style={{
                color: color,
                textShadow: `0 0 30px ${color}, 0 0 60px ${color}, 0 0 90px ${color}`,
              }}
            >
              🌟 COLOR OVERLOAD 🌟
            </div>
          </div>
        )}
        
        {/* Score display */}
        {phase === 'score' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4">
            <div 
              className="text-6xl md:text-8xl font-black animate-score-pop text-center"
              style={{
                color: color,
                textShadow: `0 0 40px ${color}`,
              }}
            >
              +{totalPoints.toLocaleString()}
            </div>
            <div className="text-2xl text-white/80 font-bold text-center">
              {cellCount} blocks cleared!
            </div>
          </div>
        )}
        
        {/* Glow ring */}
        {(phase === 'title' || phase === 'convert') && (
          <div 
            className="absolute inset-0 flex items-center justify-center"
          >
            <div 
              className="w-64 h-64 rounded-full animate-glow-ring"
              style={{
                background: `radial-gradient(circle, transparent 40%, ${color}40 70%, transparent 100%)`,
                boxShadow: `0 0 100px ${color}`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorOverloadAnimation;
