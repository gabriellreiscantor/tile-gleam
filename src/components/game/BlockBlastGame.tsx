import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import GameBoard from './GameBoard';
import PieceTray from './PieceTray';
import AnimatedScore from './AnimatedScore';
import GameOverModal from './GameOverModal';
import FeedbackText from './FeedbackText';
import ParticleEffect from './ParticleEffect';
import {
  createInitialState,
  placePiece,
  canPlace,
  anyMoveAvailable,
  pixelToGrid,
  GRID_SIZE,
  type EngineState,
} from '@/lib/gameEngine';
import { generatePieceSet, type GamePiece } from '@/lib/pieces';
import { 
  getClearMessage, 
  getComboMessage, 
  triggerHaptic,
  type FeedbackMessage 
} from '@/lib/feedback';

// ============================================
// ARCHITECTURE: Anti-Bug Pattern
// ============================================
// 1. Grid state is NEVER modified during drag
// 2. Ghost uses EXACT same canPlace logic as drop
// 3. pixelToGrid uses Math.floor, NEVER round
// 4. Drop only succeeds if canPlace returns true
// ============================================

interface DragState {
  piece: GamePiece;
  // Pixel position for visual feedback
  pixelX: number;
  pixelY: number;
}

interface GhostState {
  gridX: number;
  gridY: number;
  piece: number[][];
  colorId: number;
  isValid: boolean; // true = green, false = red
}

const BlockBlastGame: React.FC = () => {
  // ========== GAME STATE (logical) ==========
  const [gameState, setGameState] = useState<EngineState>(createInitialState);
  const [pieces, setPieces] = useState<(GamePiece | null)[]>(() => generatePieceSet());
  const [isGameOver, setIsGameOver] = useState(false);
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
  const [screenShake, setScreenShake] = useState(false);
  
  // ========== DRAG STATE (visual only) ==========
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [ghostState, setGhostState] = useState<GhostState | null>(null);
  
  // ========== FEEDBACK STATE ==========
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);
  const [particleTrigger, setParticleTrigger] = useState<{ x: number; y: number; color: string } | null>(null);
  
  const boardRef = useRef<HTMLDivElement>(null);

  // ========== HELPERS ==========
  const getBoardMetrics = useCallback(() => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      cellSize: rect.width / GRID_SIZE,
    };
  }, []);

  const checkGameOver = useCallback((state: EngineState, currentPieces: (GamePiece | null)[]) => {
    const availablePieces = currentPieces
      .filter((p): p is GamePiece => p !== null)
      .map(p => p.shape);
    
    if (availablePieces.length === 0) return false;
    return !anyMoveAvailable(state.grid, availablePieces);
  }, []);

  // ========== DRAG HANDLERS ==========
  const handleDragStart = useCallback((piece: GamePiece, _element: HTMLElement) => {
    setDragState({
      piece,
      pixelX: 0,
      pixelY: 0,
    });
  }, []);

  // handleDrag receives the BLOCK position (already offset from finger by DraggablePiece)
  const handleDrag = useCallback((blockX: number, blockY: number) => {
    if (!dragState) return;
    
    const metrics = getBoardMetrics();
    if (!metrics) return;
    
    // Update pixel position for visual tracking
    setDragState(prev => prev ? { ...prev, pixelX: blockX, pixelY: blockY } : null);
    
    const piece = dragState.piece;
    const pieceWidthCells = piece.shape[0].length;
    const pieceHeightCells = piece.shape.length;
    
    // Convert BLOCK position (not finger) to grid
    // Center the piece on the block position
    const { gx, gy } = pixelToGrid(
      blockX - (pieceWidthCells * metrics.cellSize) / 2,
      blockY - (pieceHeightCells * metrics.cellSize) / 2,
      metrics.cellSize,
      metrics.left,
      metrics.top
    );
    
    // Check if piece is within board bounds for ghost
    const isNearBoard = 
      gx >= -pieceWidthCells && 
      gx < GRID_SIZE && 
      gy >= -pieceHeightCells && 
      gy < GRID_SIZE;
    
    if (isNearBoard) {
      // Ghost is GRID-SNAPPED - uses same canPlace logic as drop
      const isValid = canPlace(gameState.grid, piece.shape, gx, gy);
      
      setGhostState({
        gridX: gx,
        gridY: gy,
        piece: piece.shape,
        colorId: piece.colorId,
        isValid,
      });
    } else {
      setGhostState(null);
    }
  }, [dragState, gameState.grid, getBoardMetrics]);

  const handleDragEnd = useCallback(() => {
    if (!dragState || !ghostState) {
      // No valid drop position - snap back
      setDragState(null);
      setGhostState(null);
      return;
    }
    
    const { gridX, gridY, isValid } = ghostState;
    const piece = dragState.piece;
    
    // STRICT: Only place if canPlace returns true
    // This is the SAME check used for ghost preview
    if (!isValid) {
      // Invalid placement - snap back with error feedback
      triggerHaptic('light');
      setDragState(null);
      setGhostState(null);
      return;
    }
    
    try {
      const result = placePiece(
        gameState,
        piece.shape,
        gridX,
        gridY,
        piece.colorId
      );
      
      // Success! Handle line clears with animation and feedback
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
        
        // Trigger feedback
        const clearMsg = getClearMessage(result.clear.linesCleared);
        setFeedbackMessage(clearMsg);
        
        // Particles at board center
        const metrics = getBoardMetrics();
        if (metrics) {
          setParticleTrigger({
            x: metrics.left + metrics.width / 2,
            y: metrics.top + metrics.height / 2,
            color: '',
          });
        }
        
        // Haptic feedback
        triggerHaptic(result.clear.linesCleared >= 2 ? 'heavy' : 'medium');
        
        // Screen shake for big clears
        if (result.clear.linesCleared >= 2) {
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 300);
        }
        
        setTimeout(() => {
          setClearingCells(new Set());
          
          // Show combo message after clear message
          const comboMsg = getComboMessage(result.next.combo);
          if (comboMsg) {
            setTimeout(() => setFeedbackMessage(comboMsg), 300);
          }
        }, 300);
      } else {
        // Light haptic for placement without clear
        triggerHaptic('light');
      }
      
      setGameState(result.next);
      
      // Remove used piece
      const newPieces = pieces.map(p => 
        p?.id === piece.id ? null : p
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
      // This should NEVER happen if canPlace logic is correct
      console.error('CRITICAL: Placement failed after canPlace returned true:', e);
    }
    
    // Clear drag state
    setDragState(null);
    setGhostState(null);
  }, [dragState, ghostState, gameState, pieces, checkGameOver, getBoardMetrics]);

  const handleCellHover = useCallback((x: number, y: number) => {
    if (!dragState) return;
    
    const piece = dragState.piece;
    const pieceWidth = piece.shape[0].length;
    const pieceHeight = piece.shape.length;
    
    // Position piece so hovered cell is roughly at top-left
    const gridX = x - Math.floor(pieceWidth / 2);
    const gridY = y - Math.floor(pieceHeight / 2);
    
    // Use EXACT same canPlace logic
    const isValid = canPlace(gameState.grid, piece.shape, gridX, gridY);
    
    setGhostState({
      gridX,
      gridY,
      piece: piece.shape,
      colorId: piece.colorId,
      isValid,
    });
  }, [dragState, gameState.grid]);

  const handleCellLeave = useCallback(() => {
    // Keep ghost visible while dragging - only hide when drag ends
  }, []);

  const handleCellDrop = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleRestart = useCallback(() => {
    setGameState(createInitialState());
    setPieces(generatePieceSet());
    setIsGameOver(false);
    setClearingCells(new Set());
    setDragState(null);
    setGhostState(null);
  }, []);

  // Transform ghostState to GameBoard format
  const ghostPosition = ghostState ? {
    x: ghostState.gridX,
    y: ghostState.gridY,
    piece: ghostState.piece,
    colorId: ghostState.colorId,
    isValid: ghostState.isValid,
  } : null;

  return (
    <>
      {/* Particle effects layer */}
      <ParticleEffect trigger={particleTrigger} count={16} />
      
      {/* Feedback text overlay */}
      <FeedbackText 
        message={feedbackMessage} 
        onComplete={() => setFeedbackMessage(null)} 
      />
      
      <div 
        className={cn(
          "fixed inset-0 flex flex-col items-center overflow-hidden",
          screenShake && "screen-shake"
        )}
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 16px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
          paddingLeft: 'max(env(safe-area-inset-left), 12px)',
          paddingRight: 'max(env(safe-area-inset-right), 12px)',
        }}
      >
        {/* Score - Top */}
        <div className="flex-shrink-0 pt-2">
          <AnimatedScore score={gameState.score} combo={gameState.combo} />
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
    </>
  );
};

export default BlockBlastGame;
