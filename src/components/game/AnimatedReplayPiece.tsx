import React from 'react';
import { cn } from '@/lib/utils';
import { type Piece } from '@/lib/gameEngine';

interface AnimatedReplayPieceProps {
  piece: Piece;
  colorId: number;
  x: number;
  y: number;
  cellSize: number;
  opacity?: number;
  scale?: number;
}

const AnimatedReplayPiece: React.FC<AnimatedReplayPieceProps> = ({
  piece,
  colorId,
  x,
  y,
  cellSize,
  opacity = 1,
  scale = 1.15,
}) => {
  // Calculate piece dimensions
  const pieceWidth = piece[0].length * cellSize;
  const pieceHeight = piece.length * cellSize;
  
  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        left: x - pieceWidth / 2,
        top: y - pieceHeight / 2,
        opacity,
        transform: `scale(${scale})`,
        transition: 'opacity 150ms ease-out',
      }}
    >
      <div
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${piece[0].length}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${piece.length}, ${cellSize}px)`,
        }}
      >
        {piece.flatMap((row, rowIdx) =>
          row.map((cell, colIdx) => (
            <div
              key={`${rowIdx}-${colIdx}`}
              style={{
                width: cellSize,
                height: cellSize,
              }}
              className={cn(
                'rounded-sm',
                cell === 1 && `game-tile tile-${colorId}`
              )}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AnimatedReplayPiece;
