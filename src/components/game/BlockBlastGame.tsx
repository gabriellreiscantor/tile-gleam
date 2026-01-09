import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import GameBoard from './GameBoard';
import PieceTray from './PieceTray';
import GameHUD from './GameHUD';
import SettingsModal from './SettingsModal';
import GameOverModal from './GameOverModal';
import ContinueModal from './ContinueModal';
import UndoButton from './UndoButton';
import FeedbackText from './FeedbackText';
import ParticleEffect from './ParticleEffect';
import TutorialOverlay from './TutorialOverlay';
import CollectAnimation from './CollectAnimation';
import BannerAd, { BANNER_HEIGHT } from './BannerAd';
import {
  createInitialState,
  createEmptyGrid,
  placePiece,
  canPlace,
  anyMoveAvailable,
  pixelToGrid,
  GRID_SIZE,
  type EngineState,
} from '@/lib/gameEngine';
import { 
  generateTrio, 
  createInitialRngState, 
  onGameOver as rngOnGameOver,
  onGoodRun,
  type RngState,
  type GeneratedPiece,
} from '@/lib/pieceRng';
import { 
  getClearMessage, 
  getComboMessage, 
  triggerHaptic,
  type FeedbackMessage 
} from '@/lib/feedback';
import {
  loadResources,
  saveResources,
  startNewGame,
  checkContinueEligibility,
  useContinue,
  checkUndoAvailability,
  useUndo,
  updateHighScore,
  type PlayerResources,
} from '@/lib/playerResources';
import {
  createTutorialState,
  createTutorialGrid,
  getTutorialPiece,
  advanceTutorial,
  isValidTutorialDrop,
  type TutorialState,
} from '@/lib/tutorial';
import {
  createEmptyItemGrid,
  spawnItemsForPiece,
  collectItemsFromClears,
  loadItemResources,
  saveItemResources,
  addCollectedItems,
  spendCrystalsForContinue,
  canAffordCrystalContinue,
  type ItemGrid,
  type ItemResources,
  type CollectedItem,
} from '@/lib/collectibles';
import { preloadSounds, sounds, playBGM, stopBGM, setBGMEnabled, unlockAudioContext } from '@/lib/sounds';

// Convert RNG piece to GamePiece format
interface GamePiece {
  shape: number[][];
  colorId: number;
  id: string;
}

function rngPiecesToGamePieces(rngPieces: GeneratedPiece[]): GamePiece[] {
  return rngPieces.map((p, i) => ({
    shape: p.shape,
    colorId: p.colorId,
    id: `piece-${Date.now()}-${i}-${p.id}`,
  }));
}

// Calculate grid occupancy (0-1)
function getGridOccupancy(grid: number[][]): number {
  let filled = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== 0) filled++;
    }
  }
  return filled / (GRID_SIZE * GRID_SIZE);
}

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
  // ========== TUTORIAL STATE ==========
  const [tutorial, setTutorial] = useState<TutorialState>(createTutorialState);
  
  // ========== RNG STATE ==========
  const rngStateRef = useRef<RngState>(createInitialRngState());
  
  // ========== PLAYER RESOURCES ==========
  const [playerResources, setPlayerResources] = useState<PlayerResources>(() => {
    const resources = loadResources();
    return startNewGame(resources);
  });
  
  // ========== ITEM RESOURCES ==========
  const [itemResources, setItemResources] = useState<ItemResources>(loadItemResources);
  const [itemGrid, setItemGrid] = useState<ItemGrid>(() => createEmptyItemGrid());
  const [pendingCollection, setPendingCollection] = useState<CollectedItem[]>([]);
  
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [lastMoveHadClear, setLastMoveHadClear] = useState(false);
  
  // History for undo
  const historyRef = useRef<{ state: EngineState; pieces: (GamePiece | null)[]; itemGrid: ItemGrid }[]>([]);
  
  // Track if user has interacted (for autoplay policy)
  const hasInteractedRef = useRef(false);
  
  // Board ref for collection animation
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Preload sounds on mount
  useEffect(() => {
    preloadSounds();
    
    // Unlock audio and start BGM on first interaction (CRITICAL for iOS!)
    const handleInteraction = () => {
      // Always try to unlock AudioContext on every interaction
      unlockAudioContext();
      
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true;
        // Try to start BGM immediately after interaction
        setBGMEnabled(playerResources.musicEnabled);
      }
    };
    
    // Use passive: false for touchstart to ensure it fires reliably on iOS
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('touchend', handleInteraction, { passive: true });
    
    return () => {
      stopBGM();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('touchend', handleInteraction);
    };
  }, [playerResources.musicEnabled]);
  
  // Sync BGM with musicEnabled setting (only after user interaction)
  useEffect(() => {
    if (hasInteractedRef.current) {
      setBGMEnabled(playerResources.musicEnabled);
    }
  }, [playerResources.musicEnabled]);
  
  // Save resources on change
  useEffect(() => {
    saveResources(playerResources);
  }, [playerResources]);
  
  // Save item resources on change
  useEffect(() => {
    saveItemResources(itemResources);
  }, [itemResources]);
  
  // Helper to generate pieces using RNG system
  const generatePiecesWithRng = useCallback((state: EngineState) => {
    const trio = generateTrio(
      { score: state.score, movesSinceClear: state.movesSinceClear, grid: state.grid },
      rngStateRef.current
    );
    console.log('[RNG Debug]', trio.debug);
    return rngPiecesToGamePieces(trio.pieces);
  }, []);

  // ========== GAME STATE (logical) ==========
  // Initialize with tutorial grid if in tutorial mode
  const [gameState, setGameState] = useState<EngineState>(() => {
    if (createTutorialState().isActive) {
      return {
        grid: createTutorialGrid(),
        score: 0,
        combo: 0,
        movesSinceClear: 0,
      };
    }
    return createInitialState();
  });
  
  // Initialize with tutorial piece or normal pieces
  const [pieces, setPieces] = useState<(GamePiece | null)[]>(() => {
    if (createTutorialState().isActive) {
      const tutorialPiece = getTutorialPiece();
      return [tutorialPiece, null, null]; // Only one piece for tutorial
    }
    const initialState = createInitialState();
    return generatePiecesWithRng(initialState);
  });
  
  const [isGameOver, setIsGameOver] = useState(false);
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
  const [screenShake, setScreenShake] = useState(false);
  
  // ========== DRAG STATE (visual only) ==========
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [ghostState, setGhostState] = useState<GhostState | null>(null);
  
  // ========== FEEDBACK STATE ==========
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [particleTrigger, setParticleTrigger] = useState<{ x: number; y: number; color: string } | null>(null);
  
  // Helper to show feedback - clears previous and sets new with unique key
  const showFeedback = useCallback((msg: FeedbackMessage) => {
    setFeedbackMessage(null); // Clear first
    setTimeout(() => {
      setFeedbackMessage(msg);
      setFeedbackKey(k => k + 1);
    }, 50);
  }, []);

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
    // Advance tutorial when piece is picked
    if (tutorial.isActive && tutorial.currentStep === 'pick-piece') {
      setTutorial(advanceTutorial);
    }
    
    setDragState({
      piece,
      pixelX: 0,
      pixelY: 0,
    });
  }, [tutorial]);

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
    if (!isValid) {
      triggerHaptic('light');
      sounds.error(playerResources.soundEnabled);
      setDragState(null);
      setGhostState(null);
      return;
    }
    
    // Tutorial: Check if drop is at target position
    if (tutorial.isActive && tutorial.currentStep === 'drop-piece') {
      if (!isValidTutorialDrop(tutorial, gridX, gridY)) {
        // Wrong position in tutorial - snap back with gentle feedback
        triggerHaptic('light');
        setDragState(null);
        setGhostState(null);
        return;
      }
    }
    
    // Save state for undo BEFORE placing (skip in tutorial)
    if (!tutorial.isActive) {
      historyRef.current.push({
        state: { ...gameState },
        pieces: [...pieces],
        itemGrid: itemGrid.map(row => [...row]),
      });
      if (historyRef.current.length > 3) {
        historyRef.current.shift();
      }
    }
    
    try {
      const result = placePiece(
        gameState,
        piece.shape,
        gridX,
        gridY,
        piece.colorId
      );
      
      const hadClear = result.clear.linesCleared > 0;
      setLastMoveHadClear(hadClear);
      
      // Tutorial: Advance to reward step after successful drop
      if (tutorial.isActive && tutorial.currentStep === 'drop-piece') {
        setTutorial(advanceTutorial); // -> 'reward'
      }
      
      // Spawn items on placed blocks (skip in tutorial)
      let newItemGrid = itemGrid;
      if (!tutorial.isActive) {
        const gridOccupancy = getGridOccupancy(result.next.grid);
        const isTilt = playerResources.totalGamesPlayed > 3 && result.next.score < 50;
        newItemGrid = spawnItemsForPiece(
          itemGrid,
          piece.shape,
          gridX,
          gridY,
          { gridOccupancy, isTilt }
        );
      }
      
      if (hadClear) {
        // Collect items from cleared lines
        if (!tutorial.isActive) {
          const collectionResult = collectItemsFromClears(
            newItemGrid,
            result.clear.clearedRows,
            result.clear.clearedCols
          );
          
          if (collectionResult.collected.length > 0) {
            // Trigger collection animation
            setPendingCollection(collectionResult.collected);
            // Update item resources
            setItemResources(prev => addCollectedItems(prev, collectionResult.collected));
            // Update item grid
            newItemGrid = collectionResult.newItemGrid;
            // Play collection sound
            sounds.success(playerResources.soundEnabled);
          }
        }
        
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
        
        // Skip normal feedback in tutorial - the overlay handles it
        if (!tutorial.isActive) {
          const clearMsg = getClearMessage(result.clear.linesCleared);
          // Add multi-line bonus info to feedback
          if (result.score.multiLineBonus > 0) {
            showFeedback({
              ...clearMsg,
              text: `${clearMsg.text} +${result.score.multiLineBonus}`,
            });
          } else {
            showFeedback(clearMsg);
          }
          
          // Play clear/combo sound
          if (result.next.combo > 1) {
            sounds.combo(playerResources.soundEnabled);
          } else {
            sounds.clear(playerResources.soundEnabled);
          }
        }
        
        const metrics = getBoardMetrics();
        if (metrics) {
          setParticleTrigger({
            x: metrics.left + metrics.width / 2,
            y: metrics.top + metrics.height / 2,
            color: '',
          });
        }
        
        triggerHaptic(result.clear.linesCleared >= 2 ? 'heavy' : 'medium');
        
        if (result.clear.linesCleared >= 2) {
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 300);
        }
        
        setTimeout(() => {
          setClearingCells(new Set());
          
          if (!tutorial.isActive) {
            const comboMsg = getComboMessage(result.next.combo);
            if (comboMsg) {
              setTimeout(() => showFeedback(comboMsg), 300);
            }
          }
        }, 300);
      } else {
        triggerHaptic('light');
        sounds.drop(playerResources.soundEnabled);
      }
      
      setGameState(result.next);
      setItemGrid(newItemGrid);
      
      // Remove used piece
      const newPieces = pieces.map(p => 
        p?.id === piece.id ? null : p
      );
      
      const remainingPieces = newPieces.filter(p => p !== null);
      
      // Tutorial: Don't generate new pieces, just wait for tutorial to end
      if (tutorial.isActive) {
        setPieces(newPieces);
      } else if (remainingPieces.length === 0) {
        const freshPieces = generatePiecesWithRng(result.next);
        setPieces(freshPieces);
        
        setTimeout(() => {
          if (checkGameOver(result.next, freshPieces)) {
            handleGameOver(result.next);
          }
        }, 100);
      } else {
        setPieces(newPieces);
        
        if (checkGameOver(result.next, newPieces)) {
          handleGameOver(result.next);
        }
      }
    } catch (e) {
      console.error('CRITICAL: Placement failed after canPlace returned true:', e);
    }
    
    setDragState(null);
    setGhostState(null);
  }, [dragState, ghostState, gameState, pieces, itemGrid, tutorial, checkGameOver, getBoardMetrics, generatePiecesWithRng, playerResources, showFeedback]);

  // ========== GAME OVER FLOW ==========
  const handleGameOver = useCallback((finalState: EngineState) => {
    const gridOccupancy = getGridOccupancy(finalState.grid);
    const eligibility = checkContinueEligibility(
      playerResources,
      finalState.score,
      finalState.combo,
      gridOccupancy
    );
    
    // Update high score
    setPlayerResources(prev => updateHighScore(prev, finalState.score));
    
    if (eligibility.canOffer || canAffordCrystalContinue(itemResources)) {
      // Show continue modal instead of game over
      setShowContinueModal(true);
    } else {
      // Direct game over
      rngOnGameOver(rngStateRef.current);
      sounds.gameOver(playerResources.soundEnabled);
      setIsGameOver(true);
    }
  }, [playerResources, itemResources]);

  const handleContinueFree = useCallback(() => {
    setPlayerResources(prev => useContinue(prev, 'free'));
    setShowContinueModal(false);
    const freshPieces = generatePiecesWithRng(gameState);
    setPieces(freshPieces);
    triggerHaptic('success');
    sounds.success(playerResources.soundEnabled);
    showFeedback({ text: 'CONTINUE!', emoji: '🎁', intensity: 'high', color: 'green' });
  }, [gameState, generatePiecesWithRng, playerResources.soundEnabled, showFeedback]);

  const handleContinuePaid = useCallback(() => {
    setPlayerResources(prev => useContinue(prev, 'paid'));
    setShowContinueModal(false);
    // Resume game - generate new pieces
    const freshPieces = generatePiecesWithRng(gameState);
    setPieces(freshPieces);
    triggerHaptic('success');
    sounds.success(playerResources.soundEnabled);
    showFeedback({ text: 'CONTINUE!', emoji: '🔁', intensity: 'high', color: 'green' });
  }, [gameState, generatePiecesWithRng, playerResources.soundEnabled, showFeedback]);

  const handleContinueAd = useCallback(() => {
    // In real app, show rewarded ad here
    // For now, simulate ad watched
    setPlayerResources(prev => useContinue(prev, 'ad'));
    setShowContinueModal(false);
    const freshPieces = generatePiecesWithRng(gameState);
    setPieces(freshPieces);
    triggerHaptic('success');
    sounds.success(playerResources.soundEnabled);
    showFeedback({ text: 'CONTINUE!', emoji: '🎬', intensity: 'high', color: 'green' });
  }, [gameState, generatePiecesWithRng, playerResources.soundEnabled, showFeedback]);

  const handleContinueCrystal = useCallback(() => {
    setItemResources(prev => spendCrystalsForContinue(prev));
    setShowContinueModal(false);
    const freshPieces = generatePiecesWithRng(gameState);
    setPieces(freshPieces);
    triggerHaptic('success');
    sounds.success(playerResources.soundEnabled);
    showFeedback({ text: 'CONTINUE!', emoji: '💎', intensity: 'high', color: 'purple' });
  }, [gameState, generatePiecesWithRng, playerResources.soundEnabled, showFeedback]);

  const handleDeclineContinue = useCallback(() => {
    setShowContinueModal(false);
    rngOnGameOver(rngStateRef.current);
    sounds.gameOver(playerResources.soundEnabled);
    setIsGameOver(true);
  }, [playerResources.soundEnabled]);

  // ========== UNDO ==========
  const undoAvailability = checkUndoAvailability(playerResources, lastMoveHadClear);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    
    const lastState = historyRef.current.pop()!;
    setGameState(lastState.state);
    setPieces(lastState.pieces);
    setItemGrid(lastState.itemGrid);
    setPlayerResources(prev => useUndo(prev));
    setLastMoveHadClear(false);
    triggerHaptic('medium');
    sounds.click(playerResources.soundEnabled);
    showFeedback({ text: 'UNDO!', emoji: '↩️', intensity: 'medium', color: 'cyan' });
  }, [playerResources.soundEnabled, showFeedback]);

  const handleBuyUndo = useCallback(() => {
    // In real app, show IAP purchase flow
    console.log('Would show IAP for undo purchase');
  }, []);

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
    const initialState = createInitialState();
    // Reset RNG state on restart, but keep tilt protection
    onGoodRun(rngStateRef.current, gameState.score);
    // Start new game in resources
    setPlayerResources(prev => startNewGame(prev));
    // Clear history
    historyRef.current = [];
    setLastMoveHadClear(false);
    setGameState(initialState);
    setPieces(generatePiecesWithRng(initialState));
    setItemGrid(createEmptyItemGrid());
    setIsGameOver(false);
    setShowContinueModal(false);
    setClearingCells(new Set());
    setDragState(null);
    setGhostState(null);
    
    // Restart BGM if music is enabled
    if (playerResources.musicEnabled) {
      playBGM();
    }
  }, [gameState.score, generatePiecesWithRng, playerResources.musicEnabled]);

  // Transform ghostState to GameBoard format
  const ghostPosition = ghostState ? {
    x: ghostState.gridX,
    y: ghostState.gridY,
    piece: ghostState.piece,
    colorId: ghostState.colorId,
    isValid: ghostState.isValid,
  } : null;

  // ========== TUTORIAL COMPLETION ==========
  const handleTutorialAdvance = useCallback(() => {
    setTutorial(prev => {
      const next = advanceTutorial(prev);
      
      // When tutorial completes, start normal game
      if (next.currentStep === 'done' && prev.currentStep === 'complete') {
        // Reset to normal game state
        setTimeout(() => {
          const freshState = createInitialState();
          setGameState(freshState);
          setPieces(generatePiecesWithRng(freshState));
          setItemGrid(createEmptyItemGrid());
        }, 100);
      }
      
      return next;
    });
  }, [generatePiecesWithRng]);

  // Determine if tutorial piece should be highlighted
  const isTutorialPieceHighlighted = tutorial.isActive && tutorial.currentStep === 'pick-piece';
  
  // Determine tutorial target cells for grid highlighting
  const tutorialTargetCells = tutorial.isActive && tutorial.currentStep === 'drop-piece' && tutorial.targetGridPosition
    ? new Set([`${tutorial.targetGridPosition.x}-${tutorial.targetGridPosition.y}`, 
               `${tutorial.targetGridPosition.x + 1}-${tutorial.targetGridPosition.y}`,
               `${tutorial.targetGridPosition.x + 2}-${tutorial.targetGridPosition.y}`])
    : null;

  // Get board metrics for collection animation
  const boardMetrics = getBoardMetrics();

  return (
    <>
      {/* Particle effects layer */}
      <ParticleEffect trigger={particleTrigger} count={16} />
      
      {/* Feedback text overlay */}
      <FeedbackText 
        message={feedbackMessage}
        messageKey={feedbackKey}
        onComplete={() => setFeedbackMessage(null)} 
      />
      
      {/* Item collection animation */}
      {pendingCollection.length > 0 && boardMetrics && (
        <CollectAnimation
          items={pendingCollection}
          cellSize={boardMetrics.cellSize}
          boardLeft={boardMetrics.left}
          boardTop={boardMetrics.top}
          targetX={window.innerWidth - 80}
          targetY={40}
          onComplete={() => setPendingCollection([])}
        />
      )}
      
      {/* Tutorial overlay */}
      {tutorial.isActive && (
        <TutorialOverlay
          step={tutorial.currentStep}
          targetPosition={tutorial.targetGridPosition ?? undefined}
          onRewardComplete={handleTutorialAdvance}
        />
      )}
      
      {/* Fixed HUD - TRUE OVERLAY, outside layout flow */}
      <GameHUD
        score={gameState.score}
        bestScore={playerResources.highScore}
        combo={gameState.combo}
        itemResources={itemResources}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Main game container */}
      <div 
        className={cn(
          "fixed inset-0 flex flex-col items-center overflow-hidden",
          screenShake && "screen-shake"
        )}
        style={{
          paddingTop: 'max(calc(env(safe-area-inset-top) + 88px), 100px)',
          paddingBottom: `max(calc(env(safe-area-inset-bottom) + ${BANNER_HEIGHT}px), ${BANNER_HEIGHT + 16}px)`,
          paddingLeft: 'max(env(safe-area-inset-left), 12px)',
          paddingRight: 'max(env(safe-area-inset-right), 12px)',
        }}
      >
        {/* Board - Center, fills available space */}
        <div className="flex-1 flex items-center justify-center w-full min-h-0 py-3">
          <div ref={boardRef}>
            <GameBoard
              grid={gameState.grid}
              itemGrid={itemGrid}
              ghostPosition={ghostPosition}
              clearingCells={clearingCells}
              tutorialTargetCells={tutorialTargetCells}
              onCellDrop={handleCellDrop}
              onCellHover={handleCellHover}
              onCellLeave={handleCellLeave}
            />
          </div>
        </div>
        
        {/* Undo Button - Above piece tray, centered */}
        {!tutorial.isActive && (
          <div className="flex-shrink-0 flex justify-center pb-6 -mt-6">
            <UndoButton
              availability={undoAvailability}
              onUndo={handleUndo}
              onBuyUndo={handleBuyUndo}
            />
          </div>
        )}
        
        {/* Piece Tray - Bottom, no padding (banner comes right after) */}
        <div className={cn(
          "flex-shrink-0 w-full",
          isTutorialPieceHighlighted && "tutorial-piece-highlight"
        )}>
          <PieceTray
            pieces={pieces}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrag={handleDrag}
          />
        </div>
        
        {/* Settings Modal */}
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          soundEnabled={playerResources.soundEnabled}
          musicEnabled={playerResources.musicEnabled}
          vibrationEnabled={playerResources.vibrationEnabled}
          onToggleSound={() => setPlayerResources(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
          onToggleMusic={() => setPlayerResources(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }))}
          onToggleVibration={() => setPlayerResources(prev => ({ ...prev, vibrationEnabled: !prev.vibrationEnabled }))}
          onReplay={() => {
            setShowSettingsModal(false);
            handleRestart();
          }}
        />
        
        {/* Continue Modal */}
        <ContinueModal
          isOpen={showContinueModal}
          score={gameState.score}
          eligibility={checkContinueEligibility(
            playerResources,
            gameState.score,
            gameState.combo,
            getGridOccupancy(gameState.grid),
            tutorial.isActive
          )}
          itemResources={itemResources}
          onContinueFree={handleContinueFree}
          onContinuePaid={handleContinuePaid}
          onContinueAd={handleContinueAd}
          onContinueCrystal={handleContinueCrystal}
          onDecline={handleDeclineContinue}
        />
        
        {isGameOver && (
          <GameOverModal score={gameState.score} highScore={playerResources.highScore} onRestart={handleRestart} />
        )}
      </div>
      
      {/* Banner Ad - Fixed at bottom, outside layout flow */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <BannerAd />
      </div>
    </>
  );
};

export default BlockBlastGame;
