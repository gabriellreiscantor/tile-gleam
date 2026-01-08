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
        "fixed inset-0 z-50 flex flex-col items-center justify-center",
        "animate-fade-in"
      )}
      style={{
        background: isNewRecord
          ? 'linear-gradient(180deg, #4c1d95 0%, #7c3aed 50%, #5b21b6 100%)'
          : 'linear-gradient(180deg, #0f172a 0%, #1e3a5f 50%, #0c1929 100%)',
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
            className="mb-4 animate-bounce"
            style={{
              animation: 'bounce 1s ease-in-out infinite, pulse 2s ease-in-out infinite',
            }}
          >
            <Crown 
              className="w-20 h-20 text-amber-400" 
              style={{
                filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.6))',
              }}
            />
          </div>
        )}

        {/* Title */}
        <h1 
          className={cn(
            "text-5xl font-black mb-10 text-center",
            isNewRecord ? "text-amber-300" : "text-white"
          )}
          style={{
            textShadow: isNewRecord
              ? '0 4px 0 #b45309, 0 0 40px rgba(251, 191, 36, 0.5)'
              : '0 4px 0 rgba(0, 0, 0, 0.3), 0 0 30px rgba(255, 255, 255, 0.2)',
            letterSpacing: '-0.02em',
          }}
        >
          {isNewRecord ? 'Best Score!' : 'Game Over'}
        </h1>

        {/* Score Section */}
        <div className="flex flex-col items-center mb-8">
          <span className="text-lg text-white/60 uppercase tracking-widest font-medium mb-2">
            Score
          </span>
          <span 
            className="text-7xl font-black text-white tabular-nums"
            style={{
              textShadow: '0 4px 0 rgba(0, 0, 0, 0.2)',
            }}
          >
            {score.toLocaleString()}
          </span>
        </div>

        {/* Best Score Section - Only for Standard State */}
        {!isNewRecord && highScore > 0 && (
          <div className="flex flex-col items-center mb-10">
            <span className="text-sm text-amber-400/80 uppercase tracking-widest font-medium mb-1">
              Best Score
            </span>
            <span 
              className="text-3xl font-bold text-amber-400 tabular-nums"
              style={{
                textShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
              }}
            >
              {highScore.toLocaleString()}
            </span>
          </div>
        )}

        {/* Spacer for new record state */}
        {isNewRecord && <div className="h-10" />}

        {/* Play Again Button */}
        <button
          onClick={onRestart}
          className={cn(
            "flex items-center justify-center",
            "w-20 h-20 rounded-full",
            "transition-all duration-200 active:scale-95",
            isNewRecord
              ? "bg-gradient-to-b from-amber-400 to-amber-500"
              : "bg-gradient-to-b from-emerald-400 to-emerald-500"
          )}
          style={{
            boxShadow: isNewRecord
              ? '0 6px 0 #b45309, 0 10px 30px rgba(251, 191, 36, 0.4)'
              : '0 6px 0 #047857, 0 10px 30px rgba(16, 185, 129, 0.4)',
          }}
        >
          <Play className="w-10 h-10 text-white ml-1" fill="white" />
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;
