import React from 'react';
import { GRID_SIZE, type Grid, type Piece, canPlace } from '@/lib/gameEngine';
import { cn } from '@/lib/utils';

interface GameBoardProps {
  grid: Grid;
  ghostPosition: { x: number; y: number; piece: Piece; colorId: number } | null;
  clearingCells: Set<string>;
  onCellDrop: (x: number, y: number) => void;
  onCellHover: (x: number, y: number) => void;
  onCellLeave: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  ghostPosition,
  clearingCells,
  onCellDrop,
  onCellHover,
  onCellLeave,
}) => {
  const cellSize = 'min(10vw, 44px)';

  const isGhostCell = (x: number, y: number): boolean => {
    if (!ghostPosition) return false;
    const { piece, x: gx, y: gy } = ghostPosition;
    const localX = x - gx;
    const localY = y - gy;
    if (localY < 0 || localY >= piece.length) return false;
    if (localX < 0 || localX >= piece[localY].length) return false;
    return piece[localY][localX] === 1;
  };

  const isValidGhost = ghostPosition
    ? canPlace(grid, ghostPosition.piece, ghostPosition.x, ghostPosition.y)
    : false;

  return (
    <div className="game-grid">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize})`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize})`,
        }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => {
            const key = `${x}-${y}`;
            const isClearing = clearingCells.has(key);
            const showGhost = isGhostCell(x, y) && isValidGhost && cell === 0;

            return (
              <div
                key={key}
                className={cn(
                  'grid-cell flex items-center justify-center',
                  isClearing && 'clearing'
                )}
                style={{ width: cellSize, height: cellSize }}
                onMouseUp={() => onCellDrop(x, y)}
                onMouseEnter={() => onCellHover(x, y)}
                onMouseLeave={onCellLeave}
                onTouchEnd={() => onCellDrop(x, y)}
              >
                {cell !== 0 && (
                  <div
                    className={cn(
                      'game-tile w-full h-full',
                      `tile-${cell}`,
                      isClearing && 'clearing'
                    )}
                  />
                )}
                {showGhost && ghostPosition && (
                  <div
                    className={cn(
                      'ghost-tile w-full h-full',
                      `tile-${ghostPosition.colorId}`
                    )}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GameBoard;
