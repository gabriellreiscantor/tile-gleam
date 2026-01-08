import React from 'react';
import { Play, RotateCcw, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameOverModalProps {
  score: number;
  highScore: number;
  onRestart: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ score, highScore, onRestart }) => {
  const isNewRecord = score >= highScore && score > 0;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[70] flex flex-col items-center justify-center",
        "animate-fade-in"
      )}
      style={{
        background: isNewRecord
          ? 'linear-gradient(180deg, #581c87 0%, #7e22ce 30%, #6b21a8 70%, #4c1d95 100%)'
          : 'linear-gradient(180deg, #0c1929 0%, #1e3a5f 30%, #1e3a5f 70%, #0c1929 100%)',
      }}
    >
      {/* Restart Button - Top Right */}
      <button
        onClick={onRestart}
        className={cn(
          "absolute top-6 right-6",
          "w-12 h-12 rounded-full",
          "flex items-center justify-center",
          "transition-all duration-200 active:scale-95",
          isNewRecord 
            ? "bg-amber-500/30 text-amber-300" 
            : "bg-white/10 text-white/70"
        )}
        style={{
          marginTop: 'env(safe-area-inset-top)',
          boxShadow: isNewRecord 
            ? '0 4px 20px rgba(251, 191, 36, 0.3)' 
            : '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <RotateCcw className="w-6 h-6" />
      </button>

      {/* Main Content */}
      <div className="flex flex-col items-center px-8 animate-scale-in">
        
        {/* Crown Icon - Only for New Record */}
        {isNewRecord && (
          <div 
            className="mb-6"
            style={{
              animation: 'bounce 2s ease-in-out infinite',
            }}
          >
            <Crown 
              className="w-24 h-24 text-amber-400" 
              style={{
                filter: 'drop-shadow(0 0 30px rgba(251, 191, 36, 0.7))',
              }}
            />
          </div>
        )}

        {/* Title */}
        <h1 
          className={cn(
            "text-4xl font-black mb-8 text-center",
            isNewRecord ? "text-amber-300" : "text-white"
          )}
          style={{
            textShadow: isNewRecord
              ? '0 4px 0 #92400e, 0 0 40px rgba(251, 191, 36, 0.5)'
              : '0 4px 0 rgba(0, 0, 0, 0.3), 0 0 30px rgba(255, 255, 255, 0.2)',
            letterSpacing: '-0.02em',
          }}
        >
          {isNewRecord ? 'Best Score!' : 'Game Over'}
        </h1>

        {/* Score Card */}
        <div 
          className="rounded-3xl px-12 py-8 mb-8 text-center"
          style={{
            background: isNewRecord 
              ? 'linear-gradient(180deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
            border: isNewRecord 
              ? '1px solid rgba(251, 191, 36, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: isNewRecord 
              ? 'inset 0 1px 0 rgba(251, 191, 36, 0.2), 0 20px 40px -10px rgba(0, 0, 0, 0.4)'
              : 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 20px 40px -10px rgba(0, 0, 0, 0.4)',
          }}
        >
          <span className="text-sm text-white/50 uppercase tracking-widest font-medium block mb-2">
            Score
          </span>
          <span 
            className="text-6xl font-black text-white tabular-nums block"
            style={{
              textShadow: '0 4px 0 rgba(0, 0, 0, 0.2)',
            }}
          >
            {score.toLocaleString()}
          </span>
          
          {/* Best Score - Only for Standard State */}
          {!isNewRecord && highScore > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <span className="text-xs text-amber-400/70 uppercase tracking-widest font-medium block mb-1">
                Best Score
              </span>
              <div className="flex items-center justify-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span 
                  className="text-2xl font-bold text-amber-400 tabular-nums"
                  style={{
                    textShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
                  }}
                >
                  {highScore.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Play Again Button */}
        <button
          onClick={onRestart}
          className={cn(
            "flex items-center justify-center gap-3",
            "px-10 py-4 rounded-2xl",
            "font-bold text-lg",
            "transition-all duration-200 active:scale-95",
            isNewRecord
              ? "bg-gradient-to-b from-amber-400 to-amber-500 text-amber-900"
              : "bg-gradient-to-b from-emerald-400 to-emerald-500 text-emerald-900"
          )}
          style={{
            boxShadow: isNewRecord
              ? '0 6px 0 #b45309, 0 10px 30px rgba(251, 191, 36, 0.4)'
              : '0 6px 0 #047857, 0 10px 30px rgba(16, 185, 129, 0.4)',
          }}
        >
          <Play className="w-6 h-6" fill="currentColor" />
          <span>Play Again</span>
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;
