import React from 'react';
import { cn } from '@/lib/utils';
import { Crown, Settings } from 'lucide-react';

interface GameHUDProps {
  currentScore: number;
  bestScore: number;
  combo: number;
  onOpenSettings: () => void;
}

const GameHUD: React.FC<GameHUDProps> = ({
  currentScore,
  bestScore,
  combo,
  onOpenSettings,
}) => {
  return (
    <div className="w-full max-w-md" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="relative h-[72px]">
        {/* LEFT: Best Score - Absolute left corner */}
        <div className="absolute left-0 top-0 flex flex-col items-start">
          <div className="flex items-center gap-1 text-amber-400 mb-0.5">
            <Crown className="w-4 h-4 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" />
            <span className="text-[10px] uppercase tracking-widest font-semibold opacity-90">Best</span>
          </div>
          <div 
            className="text-xl font-bold text-amber-300 tabular-nums"
            style={{ textShadow: '0 0 8px rgba(251,191,36,0.3)' }}
          >
            {bestScore.toLocaleString()}
          </div>
        </div>
        
        {/* CENTER: Current Score - True center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-0.5">
            Score
          </div>
          <div 
            className={cn(
              "text-4xl font-black text-white tabular-nums transition-transform",
              combo > 1 && "scale-105"
            )}
            style={{
              textShadow: combo > 1 
                ? '0 0 20px hsl(var(--primary) / 0.5)' 
                : 'none'
            }}
          >
            {currentScore.toLocaleString()}
          </div>
          
          {/* Combo indicator - only when combo > 1 */}
          {combo > 1 && (
            <div 
              className={cn(
                "mt-1 px-3 py-0.5 rounded-full text-xs font-bold",
                "bg-gradient-to-r from-orange-500 to-amber-500 text-white",
                combo >= 4 && "animate-pulse",
                combo >= 6 && "ring-2 ring-amber-400 ring-offset-2 ring-offset-background"
              )}
            >
              🔥 x{combo}
            </div>
          )}
        </div>
        
        {/* RIGHT: Settings Button - Absolute right corner */}
        <div className="absolute right-0 top-0">
          <button
            onClick={onOpenSettings}
            className={cn(
              "w-11 h-11 rounded-2xl",
              "bg-white/10 hover:bg-white/20",
              "flex items-center justify-center",
              "transition-all duration-200 active:scale-95",
              "shadow-lg"
            )}
          >
            <Settings className="w-5 h-5 text-white/70" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameHUD;
