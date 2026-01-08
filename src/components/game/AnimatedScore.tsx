import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedScoreProps {
  score: number;
  combo: number;
}

const AnimatedScore: React.FC<AnimatedScoreProps> = ({ score, combo }) => {
  const [displayScore, setDisplayScore] = useState(score);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPop, setShowPop] = useState(false);
  const prevScoreRef = useRef(score);

  useEffect(() => {
    if (score === prevScoreRef.current) return;

    const from = prevScoreRef.current;
    const to = score;
    const diff = to - from;
    
    if (diff > 0) {
      setIsAnimating(true);
      setShowPop(true);
      
      const duration = Math.min(400, diff * 10);
      const start = performance.now();

      const animate = (timestamp: number) => {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.round(from + diff * eased));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
      
      setTimeout(() => setShowPop(false), 200);
    }
    
    prevScoreRef.current = score;
  }, [score]);

  return (
    <div className="score-display flex flex-col items-center gap-1">
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
        Score
      </div>
      <div
        className={cn(
          'score-value transition-transform duration-150',
          isAnimating && 'scale-110',
          showPop && 'animate-score-pop'
        )}
      >
        {displayScore.toLocaleString()}
      </div>
      
      {combo > 0 && (
        <div 
          className={cn(
            'combo-badge mt-1 transition-all duration-200',
            combo >= 4 && 'animate-pulse scale-110',
            combo >= 6 && 'ring-2 ring-accent ring-offset-2 ring-offset-background'
          )}
        >
          <span className="text-xs">🔥</span>
          <span>x{combo} Combo</span>
        </div>
      )}
    </div>
  );
};

export default AnimatedScore;
