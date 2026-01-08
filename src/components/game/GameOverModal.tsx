import React from 'react';
import { RotateCcw, Trophy } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  onRestart: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ score, onRestart }) => {
  return (
    <div className="game-over-overlay animate-fade-in">
      <div className="text-center p-8 rounded-3xl bg-card/90 backdrop-blur-xl border border-border/50 max-w-sm mx-4">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
          <Trophy className="w-10 h-10 text-accent-foreground" />
        </div>
        
        <h2 className="text-3xl font-bold mb-2">Game Over</h2>
        <p className="text-muted-foreground mb-6">Great game!</p>
        
        <div className="mb-8">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
            Final Score
          </p>
          <p className="text-5xl font-bold text-primary">
            {score.toLocaleString()}
          </p>
        </div>
        
        <button
          onClick={onRestart}
          className="btn-game flex items-center justify-center gap-2 w-full"
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;
