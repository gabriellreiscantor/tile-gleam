import React from 'react';
import { RotateCcw, Trophy, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameOverModalProps {
  score: number;
  highScore: number;
  onRestart: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ score, highScore, onRestart }) => {
  const isNewRecord = score >= highScore && score > 0;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="text-center p-8 rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 max-w-sm mx-4 shadow-2xl animate-scale-in">
        {/* Trophy Icon */}
        <div className={cn(
          "w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center",
          isNewRecord 
            ? "bg-gradient-to-br from-amber-400 to-orange-500" 
            : "bg-gradient-to-br from-slate-600 to-slate-700"
        )}>
          {isNewRecord ? (
            <Crown className="w-10 h-10 text-white" />
          ) : (
            <Trophy className="w-10 h-10 text-white" />
          )}
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-2">
          {isNewRecord ? 'New Record!' : 'Game Over'}
        </h2>
        <p className="text-white/60 mb-6">
          {isNewRecord ? 'Amazing performance!' : 'Great game!'}
        </p>
        
        {/* Score Display */}
        <div className="mb-6">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-1">
            Final Score
          </p>
          <p className={cn(
            "text-5xl font-black tabular-nums",
            isNewRecord ? "text-amber-400" : "text-white"
          )}
          style={{
            textShadow: isNewRecord 
              ? '0 0 30px #fbbf24, 0 0 60px #f59e0b' 
              : 'none'
          }}
          >
            {score.toLocaleString()}
          </p>
        </div>
        
        {/* Best Score (if not new record) */}
        {!isNewRecord && highScore > 0 && (
          <div className="mb-6 flex items-center justify-center gap-2 text-amber-400/80">
            <Crown className="w-4 h-4" />
            <span className="text-sm font-medium">Best: {highScore.toLocaleString()}</span>
          </div>
        )}
        
        <button
          onClick={onRestart}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl",
            "text-lg font-bold text-white",
            "bg-gradient-to-r from-cyan-500 to-blue-500",
            "shadow-lg shadow-cyan-500/30",
            "transition-all duration-200 active:scale-95"
          )}
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;
