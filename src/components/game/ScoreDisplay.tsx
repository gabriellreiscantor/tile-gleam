import React from 'react';
import { Zap } from 'lucide-react';

interface ScoreDisplayProps {
  score: number;
  combo: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, combo }) => {
  return (
    <div className="score-display">
      <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-1">
        Score
      </p>
      <p className="score-value">{score.toLocaleString()}</p>
      {combo > 0 && (
        <div className="mt-3">
          <span className="combo-badge">
            <Zap className="w-4 h-4" />
            Combo x{combo}
          </span>
        </div>
      )}
    </div>
  );
};

export default ScoreDisplay;
