import React, { useState, useCallback, useRef, useEffect } from 'react';
import GameBoard from './GameBoard';
import PieceTray from './PieceTray';
import ScoreDisplay from './ScoreDisplay';
import GameOverModal from './GameOverModal';
import {
  createInitialState,
  placePiece,
  canPlace,
  anyMoveAvailable,
  GRID_SIZE,
  type EngineState,
  type Piece,
} from '@/lib/gameEngine';
import { generatePieceSet, type GamePiece } from '@/lib/pieces';

const BlockBlastGame: React.FC = () => {
  const [gameState, setGameState] = useState<EngineState>(createInitialState);
  const [pieces, setPieces] = useState<(GamePiece | null)[]>(() => generatePieceSet());
  const [isGameOver, setIsGameOver] = useState(false);
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
  
  const [draggingPiece, setDraggingPiece] = useState<GamePiece | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{
    x: number;
    y: number;
    piece: Piece;
    colorId: number;
  } | null>(null);
  
  const boardRef = useRef<HTMLDivElement>(null);
  const dragPositionRef = useRef({ x: 0, y: 0 });

  const checkGameOver = useCallback((state: EngineState, currentPieces: (GamePiece | null)[]) => {
    const availablePieces = currentPieces
      .filter((p): p is GamePiece => p !== null)
      .map(p => p.shape);
    
    if (availablePieces.length === 0) return false;
    return !anyMoveAvailable(state.grid, availablePieces);
  }, []);

  const handleDragStart = useCallback((piece: GamePiece, element: HTMLElement) => {
    setDraggingPiece(piece);
  }, []);

  const handleDrag = useCallback((clientX: number, clientY: number) => {
    dragPositionRef.current = { x: clientX, y: clientY };
    
    if (!draggingPiece || !boardRef.current) return;
    
    const boardRect = boardRef.current.getBoundingClientRect();
    const cellSize = boardRect.width / GRID_SIZE;
    
    const relX = clientX - boardRect.left;
    const relY = clientY - boardRect.top;
    
    // Center the piece on cursor
    const pieceWidth = draggingPiece.shape[0].length;
    const pieceHeight = draggingPiece.shape.length;
    
    const gridX = Math.round((relX - (pieceWidth * cellSize) / 2) / cellSize);
    const gridY = Math.round((relY - (pieceHeight * cellSize) / 2) / cellSize);
    
    if (gridX >= -pieceWidth && gridX < GRID_SIZE && gridY >= -pieceHeight && gridY < GRID_SIZE) {
      setGhostPosition({
        x: gridX,
        y: gridY,
        piece: draggingPiece.shape,
        colorId: draggingPiece.colorId,
      });
    } else {
      setGhostPosition(null);
    }
  }, [draggingPiece]);

  const handleDragEnd = useCallback(() => {
    if (!draggingPiece || !ghostPosition) {
      setDraggingPiece(null);
      setGhostPosition(null);
      return;
    }
    
    const { x, y } = ghostPosition;
    
    if (canPlace(gameState.grid, draggingPiece.shape, x, y)) {
      try {
        const result = placePiece(
          gameState,
          draggingPiece.shape,
          x,
          y,
          draggingPiece.colorId
        );
        
        // Handle line clears with animation
        if (result.clear.linesCleared > 0) {
          const cellsToAnimate = new Set<string>();
          result.clear.clearedRows.forEach(row => {
            for (let col = 0; col < GRID_SIZE; col++) {
              cellsToAnimate.add(`${col}-${row}`);
            }
          });
          result.clear.clearedCols.forEach(col => {
            for (let row = 0; row < GRID_SIZE; row++) {
              cellsToAnimate.add(`${col}-${row}`);
            }
          });
          setClearingCells(cellsToAnimate);
          
          setTimeout(() => {
            setClearingCells(new Set());
          }, 300);
        }
        
        setGameState(result.next);
        
        // Remove used piece
        const newPieces = pieces.map(p => 
          p?.id === draggingPiece.id ? null : p
        );
        
        // Check if all pieces used
        const remainingPieces = newPieces.filter(p => p !== null);
        
        if (remainingPieces.length === 0) {
          const freshPieces = generatePieceSet();
          setPieces(freshPieces);
          
          // Check game over with new pieces
          setTimeout(() => {
            if (checkGameOver(result.next, freshPieces)) {
              setIsGameOver(true);
            }
          }, 100);
        } else {
          setPieces(newPieces);
          
          // Check game over with remaining pieces
          if (checkGameOver(result.next, newPieces)) {
            setIsGameOver(true);
          }
        }
      } catch (e) {
        console.error('Invalid placement:', e);
      }
    }
    
    setDraggingPiece(null);
    setGhostPosition(null);
  }, [draggingPiece, ghostPosition, gameState, pieces, checkGameOver]);

  const handleCellHover = useCallback((x: number, y: number) => {
    if (!draggingPiece) return;
    
    const pieceWidth = draggingPiece.shape[0].length;
    const pieceHeight = draggingPiece.shape.length;
    
    // Position piece so clicked cell is roughly centered in it
    const gridX = x - Math.floor(pieceWidth / 2);
    const gridY = y - Math.floor(pieceHeight / 2);
    
    setGhostPosition({
      x: gridX,
      y: gridY,
      piece: draggingPiece.shape,
      colorId: draggingPiece.colorId,
    });
  }, [draggingPiece]);

  const handleCellLeave = useCallback(() => {
    // Keep ghost visible while dragging
  }, []);

  const handleCellDrop = useCallback((x: number, y: number) => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleRestart = useCallback(() => {
    setGameState(createInitialState());
    setPieces(generatePieceSet());
    setIsGameOver(false);
    setClearingCells(new Set());
    setDraggingPiece(null);
    setGhostPosition(null);
  }, []);

  return (
    <div 
      className="fixed inset-0 flex flex-col items-center overflow-hidden"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
        paddingLeft: 'max(env(safe-area-inset-left), 12px)',
        paddingRight: 'max(env(safe-area-inset-right), 12px)',
      }}
    >
      {/* Score - Top */}
      <div className="flex-shrink-0 pt-2">
        <ScoreDisplay score={gameState.score} combo={gameState.combo} />
      </div>
      
      {/* Board - Center, fills available space */}
      <div className="flex-1 flex items-center justify-center w-full min-h-0 py-3">
        <div ref={boardRef}>
          <GameBoard
            grid={gameState.grid}
            ghostPosition={ghostPosition}
            clearingCells={clearingCells}
            onCellDrop={handleCellDrop}
            onCellHover={handleCellHover}
            onCellLeave={handleCellLeave}
          />
        </div>
      </div>
      
      {/* Piece Tray - Bottom, fixed height */}
      <div className="flex-shrink-0 w-full pb-2">
        <PieceTray
          pieces={pieces}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrag={handleDrag}
        />
      </div>
      
      {isGameOver && (
        <GameOverModal score={gameState.score} onRestart={handleRestart} />
      )}
    </div>
  );
};

export default BlockBlastGame;
