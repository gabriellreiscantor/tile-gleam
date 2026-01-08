import React from 'react';
import { GRID_SIZE, type Grid, type Piece } from '@/lib/gameEngine';
import { cn } from '@/lib/utils';
import { type ItemGrid } from '@/lib/collectibles';
import ItemBadge from './ItemBadge';

interface GhostPosition {
  x: number;
  y: number;
  piece: Piece;
  colorId: number;
  isValid?: boolean; // true = green/valid, false = red/invalid
}

interface GameBoardProps {
  grid: Grid;
  itemGrid?: ItemGrid;
  ghostPosition: GhostPosition | null;
  clearingCells: Set<string>;
  tutorialTargetCells?: Set<string> | null;
  onCellDrop: (x: number, y: number) => void;
  onCellHover: (x: number, y: number) => void;
  onCellLeave: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  itemGrid,
  ghostPosition,
  clearingCells,
  tutorialTargetCells,
  onCellDrop,
  onCellHover,
  onCellLeave,
}) => {
  // Calculate cell size to fit screen - leave room for score (~70px), piece tray (~100px), padding
  // Use min of width-based and height-based calculations, max 48px per cell
  const cellSize = 'min(calc((100vw - 32px) / 8.5), calc((100vh - 200px) / 8.5), 48px)';

  const isGhostCell = (x: number, y: number): boolean => {
    if (!ghostPosition) return false;
    const { piece, x: gx, y: gy } = ghostPosition;
    const localX = x - gx;
    const localY = y - gy;
    if (localY < 0 || localY >= piece.length) return false;
    if (localX < 0 || localX >= piece[localY].length) return false;
    return piece[localY][localX] === 1;
  };

  // Ghost validity comes from the SAME canPlace logic used for drop
  const isValidGhost = ghostPosition?.isValid ?? false;

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
            const showGhost = isGhostCell(x, y) && cell === 0;
            const isTutorialTarget = tutorialTargetCells?.has(key) ?? false;
            const itemInCell = itemGrid?.[y]?.[x] ?? null;

            return (
              <div
                key={key}
                className={cn(
                  'grid-cell flex items-center justify-center',
                  isClearing && 'clearing',
                  isTutorialTarget && 'tutorial-target-cell'
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
                      'game-tile w-full h-full relative',
                      `tile-${cell}`,
                      isClearing && 'clearing'
                    )}
                  >
                    {/* Item badge in top-right corner */}
                    {itemInCell && <ItemBadge itemType={itemInCell} />}
                  </div>
                )}
                {showGhost && ghostPosition && (
                  <div
                    className={cn(
                      'ghost-tile w-full h-full',
                      isValidGhost 
                        ? `tile-${ghostPosition.colorId}` 
                        : 'ghost-invalid'
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
