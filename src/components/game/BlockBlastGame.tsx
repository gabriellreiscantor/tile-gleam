import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import GameBoard from './GameBoard';
import PieceTray from './PieceTray';
import GameHUD from './GameHUD';
import SettingsModal from './SettingsModal';
import GameOverModal from './GameOverModal';
import UndoButton from './UndoButton';
import FeedbackText from './FeedbackText';
import ParticleEffect from './ParticleEffect';
import DirectionalParticles, { type ClearLine } from './DirectionalParticles';
import StarConvergence from './StarConvergence';
import TutorialOverlay from './TutorialOverlay';
import CollectAnimation from './CollectAnimation';
import BannerAd, { BANNER_HEIGHT } from './BannerAd';
import UndoPurchaseModal from './UndoPurchaseModal';
import ReplayPlayer from './ReplayPlayer';
import StarTutorialOverlay from './StarTutorialOverlay';
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
  findDominantColor,
  getCellsOfColor,
  applyStarConvergence,
  calculateStarScore,
  getAllOccupiedCells,
  spendStar,
  canUseStar,
  loadSessionStats,
  saveSessionStats,
  startNewGame as startNewItemGame,
  recordCrystalCollected,
  recordStarCollected,
  type ItemGrid,
  type ItemResources,
  type CollectedItem,
  type ItemSessionStats,
} from '@/lib/collectibles';
import { preloadSounds, sounds, playBGM, stopBGM, setBGMEnabled, unlockAudioContext, playClearSoundWithCombo } from '@/lib/sounds';
import {
  type ReplayData,
  type RecorderState,
  type DragPoint,
  createRecorderState,
  startRecording,
  recordMove,
  finishRecording,
} from '@/lib/replayRecorder';
import {
  createStarTutorialState,
  advanceStarTutorial,
  shouldTriggerStarTutorial,
  recordGameStartTime,
  getSecondsSinceGameStart,
  clearGameStartTime,
  type StarTutorialState,
} from '@/lib/starTutorial';

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
  const [itemSessionStats, setItemSessionStats] = useState<ItemSessionStats>(() => 
    startNewItemGame(loadSessionStats())
  );
  
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUndoPurchaseModal, setShowUndoPurchaseModal] = useState(false);
  const [isUndoPurchaseLoading, setIsUndoPurchaseLoading] = useState(false);
  const [lastMoveHadClear, setLastMoveHadClear] = useState(false);
  
  // Star Convergence state
  const [isStarActive, setIsStarActive] = useState(false);
  const [starAnimationData, setStarAnimationData] = useState<{
    dominantColor: number;
    affectedCells: { x: number; y: number }[];
    totalPoints: number;
  } | null>(null);
  
  
  // Star Tutorial state
  const [starTutorial, setStarTutorial] = useState<StarTutorialState>(createStarTutorialState);
  const starButtonRef = useRef<HTMLButtonElement>(null);
  
  // ========== REPLAY STATE ==========
  const recorderRef = useRef<RecorderState>(startRecording(createRecorderState()));
  const [currentReplay, setCurrentReplay] = useState<ReplayData | null>(null);
  const [showReplayPlayer, setShowReplayPlayer] = useState(false);
  
  // Drag path recording for cinematographic replay
  const dragPathRef = useRef<DragPoint[]>([]);
  const dragStartTimeRef = useRef<number>(0);
  
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
  
  // Save item session stats on change
  useEffect(() => {
    saveSessionStats(itemSessionStats);
  }, [itemSessionStats]);
  
  // Star Tutorial: Track game start time and check for trigger
  useEffect(() => {
    if (!starTutorial.isActive || starTutorial.step !== 'waiting') return;
    if (tutorial.isActive) return; // Wait for main tutorial to finish first
    
    recordGameStartTime();
    
    const checkTimer = setInterval(() => {
      const seconds = getSecondsSinceGameStart();
      
      if (shouldTriggerStarTutorial(starTutorial, seconds)) {
        // Give the user a star for the tutorial
        setItemResources(prev => ({ ...prev, stars: prev.stars + 1 }));
        
        // Advance to show-arrow step (skip spawn/collect since we just gave them a star)
        setStarTutorial(prev => ({ ...prev, step: 'show-arrow' }));
        
        sounds.success(playerResources.soundEnabled);
        triggerHaptic('medium');
        
        clearInterval(checkTimer);
      }
    }, 1000);
    
    return () => clearInterval(checkTimer);
  }, [starTutorial.isActive, starTutorial.step, tutorial.isActive, playerResources.soundEnabled]);
  
  // Debug: Force spawn item from debug page
  useEffect(() => {
    const forcedItem = localStorage.getItem('debug_force_spawn_item');
    if (forcedItem && (forcedItem === 'crystal' || forcedItem === 'star')) {
      // Colocar o item no itemGrid
      setItemGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[3][3] = forcedItem as 'crystal' | 'star';
        return newGrid;
      });
      
      // TAMBÉM colocar um bloco no gameState.grid para o item ser visível
      setGameState(prev => {
        const newGrid = prev.grid.map(row => [...row]);
        newGrid[3][3] = 1; // Cor 1 (azul) para ser visível
        return { ...prev, grid: newGrid };
      });
      
      localStorage.removeItem('debug_force_spawn_item');
      console.log(`[Debug] Forced ${forcedItem} spawn at (3,3) with block`);
    }
  }, []);
  
  // Debug: Force Color Overload scenario from debug page
  useEffect(() => {
    const forcedOverload = localStorage.getItem('debug_force_color_overload');
    if (!forcedOverload) return;
    
    if (forcedOverload === '8-connected') {
      // Create a grid with 7 connected blue blocks - player needs to add 1 more
      // Layout:
      //   0 1 2 3 4
      // 0 . . . . .
      // 1 . B B B .
      // 2 . B B B .
      // 3 . B . . .
      // 4 . . . . .
      setGameState(prev => {
        const newGrid = prev.grid.map(row => [...row]);
        // 7 connected blue blocks (color 1)
        newGrid[1][1] = 1; newGrid[1][2] = 1; newGrid[1][3] = 1;
        newGrid[2][1] = 1; newGrid[2][2] = 1; newGrid[2][3] = 1;
        newGrid[3][1] = 1;
        return { ...prev, grid: newGrid };
      });
      console.log('[Debug] Forced 8-connected Color Overload scenario (need +1 blue block)');
    } else if (forcedOverload === '60-percent') {
      // Create a grid with ~55% red blocks scattered - player needs to add more
      // More red blocks = triggers 60% dominance
      setGameState(prev => {
        const newGrid = prev.grid.map(row => [...row]);
        // Red blocks (color 2) scattered
        newGrid[0][0] = 2; newGrid[0][2] = 2; newGrid[0][4] = 2; newGrid[0][6] = 2;
        newGrid[1][1] = 2; newGrid[1][3] = 2; newGrid[1][5] = 2;
        newGrid[2][0] = 2; newGrid[2][2] = 2; newGrid[2][4] = 2;
        newGrid[3][1] = 2; newGrid[3][3] = 2; newGrid[3][5] = 2;
        newGrid[4][0] = 2; newGrid[4][2] = 2; newGrid[4][4] = 2;
        // Some other colors to make it ~55%
        newGrid[5][1] = 3; newGrid[5][3] = 4; newGrid[5][5] = 5;
        newGrid[6][0] = 3; newGrid[6][2] = 4; newGrid[6][4] = 5;
        newGrid[7][1] = 3; newGrid[7][3] = 4;
        return { ...prev, grid: newGrid };
      });
      console.log('[Debug] Forced 60% dominance Color Overload scenario (need more red)');
    }
    
    localStorage.removeItem('debug_force_color_overload');
  }, []);
  
  // Helper to generate pieces using RNG system
  const generatePiecesWithRng = useCallback((state: EngineState) => {
    const trio = generateTrio(
      { score: state.score, movesSinceClear: state.movesSinceClear, grid: state.grid, currentCombo: state.combo },
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
  const [floodingCells, setFloodingCells] = useState<Map<string, number>>(new Map());
  const [isFlooding, setIsFlooding] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  
  // Block Blast polish states
  const [justPlacedCells, setJustPlacedCells] = useState<Set<string>>(new Set());
  const [highlightColor, setHighlightColor] = useState<number | null>(null);
  const [comboPulse, setComboPulse] = useState<'none' | 'normal' | 'intense'>('none');
  
  // ========== DRAG STATE (visual only) ==========
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [ghostState, setGhostState] = useState<GhostState | null>(null);
  
  // ========== FEEDBACK STATE ==========
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [particleTrigger, setParticleTrigger] = useState<{ x: number; y: number; color: string } | null>(null);
  const [directionalClearLines, setDirectionalClearLines] = useState<ClearLine[]>([]);
  
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
    
    if (availablePieces.length === 0) {
      console.log('[GameOver] No pieces available, NOT game over');
      return false;
    }
    
    const canMove = anyMoveAvailable(state.grid, availablePieces);
    console.log('[GameOver] Check:', {
      piecesCount: availablePieces.length,
      pieceIds: currentPieces.filter((p): p is GamePiece => p !== null).map(p => p.id),
      canMove,
      gridOccupancy: getGridOccupancy(state.grid)
    });
    
    return !canMove;
  }, []);

  // ========== DRAG HANDLERS ==========
  const handleDragStart = useCallback((piece: GamePiece, _element: HTMLElement) => {
    // Advance tutorial when piece is picked
    if (tutorial.isActive && tutorial.currentStep === 'pick-piece') {
      setTutorial(advanceTutorial);
    }
    
    // Start recording drag path for cinematographic replay
    dragPathRef.current = [];
    dragStartTimeRef.current = Date.now();
    
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
    
    // Record drag point for cinematographic replay (sample every 50ms)
    const now = Date.now();
    const lastPoint = dragPathRef.current[dragPathRef.current.length - 1];
    if (!lastPoint || (now - dragStartTimeRef.current - lastPoint.t) >= 50) {
      dragPathRef.current.push({
        x: blockX,
        y: blockY,
        t: now - dragStartTimeRef.current,
      });
    }
    
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
      // HAPTIC + SOUND on invalid placement
      triggerHaptic('error');
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
      
      // Track just placed cells for bounce animation
      const placedCellsSet = new Set<string>();
      for (let py = 0; py < piece.shape.length; py++) {
        for (let px = 0; px < piece.shape[py].length; px++) {
          if (piece.shape[py][px] === 1) {
            placedCellsSet.add(`${gridX + px}-${gridY + py}`);
          }
        }
      }
      setJustPlacedCells(placedCellsSet);
      // Clear after animation
      setTimeout(() => setJustPlacedCells(new Set()), 300);
      setLastMoveHadClear(hadClear);
      
      // Record move for replay with cinematographic data (skip in tutorial)
      if (!tutorial.isActive) {
        recorderRef.current = recordMove(recorderRef.current, {
          pieceId: piece.id,
          pieceShape: piece.shape,
          colorId: piece.colorId,
          gridX,
          gridY,
          scoreAfter: result.next.score,
          comboAfter: result.next.combo,
          linesCleared: result.clear.linesCleared,
          gridSnapshot: result.next.grid,
          // Cinematographic data
          gridBefore: gameState.grid,
          dragPath: dragPathRef.current,
          clearedRows: result.clear.clearedRows,
          clearedCols: result.clear.clearedCols,
          placementDuration: Date.now() - dragStartTimeRef.current,
        });
      }
      
      // Tutorial: Advance to reward step after successful drop
      if (tutorial.isActive && tutorial.currentStep === 'drop-piece') {
        setTutorial(advanceTutorial); // -> 'reward'
      }
      
      // Spawn items on placed blocks (skip in tutorial)
      let newItemGrid = itemGrid;
      if (!tutorial.isActive) {
        const gridOccupancy = getGridOccupancy(result.next.grid);
        newItemGrid = spawnItemsForPiece(
          itemGrid,
          piece.shape,
          gridX,
          gridY,
          { 
            score: result.next.score,
            combo: result.next.combo,
            linesCleared: result.clear.linesCleared,
            gridOccupancy,
            sessionStats: itemSessionStats,
            lifetimeGames: playerResources.totalGamesPlayed,
            lastPlacedX: gridX,
            lastPlacedY: gridY,
          }
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
            // Update session stats for each collected item
            setItemSessionStats(prev => {
              let newStats = prev;
              for (const item of collectionResult.collected) {
                if (item.type === 'crystal') {
                  newStats = recordCrystalCollected(newStats);
                } else if (item.type === 'star') {
                  newStats = recordStarCollected(newStats);
                }
              }
              return newStats;
            });
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
        
        // DIRECTIONAL PARTICLES: Build clear lines for directional explosion
        const clearLines: ClearLine[] = [
          ...result.clear.clearedRows.map(idx => ({ type: 'row' as const, index: idx })),
          ...result.clear.clearedCols.map(idx => ({ type: 'col' as const, index: idx })),
        ];
        setDirectionalClearLines(clearLines);
        // Clear after animation
        setTimeout(() => setDirectionalClearLines([]), 600);
        
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
          
          // Play clear/combo sound with pitch scaling
          if (result.next.combo > 1) {
            sounds.combo(playerResources.soundEnabled, result.next.combo);
          } else {
            playClearSoundWithCombo(playerResources.soundEnabled, result.clear.linesCleared, result.next.combo);
          }
          
          // Combo pulse effect for high combos
          if (result.next.combo >= 16) {
            setComboPulse('intense');
          } else if (result.next.combo >= 6) {
            setComboPulse('normal');
          }
          // Clear combo pulse after a short delay
          setTimeout(() => setComboPulse('none'), 1500);
          
          // Highlight dominant color for "everything connected" feel
          if (result.next.combo >= 4) {
            const dominantColor = findDominantColor(result.next.grid);
            if (dominantColor) {
              setHighlightColor(dominantColor);
              setTimeout(() => setHighlightColor(null), 800);
            }
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
      
      // Check for Color Overload (only if no lines were cleared and not in tutorial)
      if (!hadClear && !tutorial.isActive) {
        // Build list of placed cells
        const placedCells: { x: number; y: number }[] = [];
        for (let py = 0; py < piece.shape.length; py++) {
          for (let px = 0; px < piece.shape[py].length; px++) {
            if (piece.shape[py][px] === 1) {
              placedCells.push({ x: gridX + px, y: gridY + py });
            }
          }
        }
        
      }
      
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

  // ========== FLOOD FILL ANIMATION ==========
  const startFloodAnimation = useCallback((grid: number[][], onComplete: () => void) => {
    setIsFlooding(true);
    
    // Find all empty cells
    const emptyCells: { x: number; y: number }[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[y][x] === 0) {
          emptyCells.push({ x, y });
        }
      }
    }
    
    // Shuffle for random fill order
    const shuffled = emptyCells.sort(() => Math.random() - 0.5);
    
    // Fill cells progressively
    let index = 0;
    const interval = setInterval(() => {
      if (index >= shuffled.length) {
        clearInterval(interval);
        // Animation complete - wait a moment then show game over
        setTimeout(() => {
          setIsFlooding(false);
          setFloodingCells(new Map());
          onComplete();
        }, 400);
        return;
      }
      
      const cell = shuffled[index];
      const randomColor = Math.floor(Math.random() * 8) + 1; // 1-8
      setFloodingCells(prev => new Map(prev).set(`${cell.x}-${cell.y}`, randomColor));
      
      // Light haptic for each cell
      triggerHaptic('light');
      
      index++;
    }, 40); // 40ms between each cell
  }, []);

  // ========== GAME OVER FLOW ==========
  const handleGameOver = useCallback((finalState: EngineState) => {
    const gridOccupancy = getGridOccupancy(finalState.grid);
    const eligibility = checkContinueEligibility(
      playerResources,
      finalState.score,
      finalState.combo,
      gridOccupancy
    );
    
    // Finish recording and save replay data
    const replayData = finishRecording(
      recorderRef.current,
      finalState.score,
      playerResources.highScore
    );
    console.log('[Replay] Finished recording:', {
      movesCount: recorderRef.current.moves.length,
      isRecording: recorderRef.current.isRecording,
      replayData: replayData ? { totalMoves: replayData.totalMoves, finalScore: replayData.finalScore } : null
    });
    setCurrentReplay(replayData);
    
    // Update high score
    setPlayerResources(prev => updateHighScore(prev, finalState.score));
    
    // Stop BGM and play game over sound
    if (playerResources.musicEnabled) {
      stopBGM();
    }
    sounds.gameOver(playerResources.soundEnabled);
    
    // Start flood animation, then show modal/game over
    startFloodAnimation(finalState.grid, () => {
      if (eligibility.canOffer || canAffordCrystalContinue(itemResources)) {
        // Show continue modal instead of game over
        setShowContinueModal(true);
      } else {
        // Direct game over
        rngOnGameOver(rngStateRef.current);
        setIsGameOver(true);
      }
    });
  }, [playerResources, itemResources, startFloodAnimation]);

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
    setShowUndoPurchaseModal(true);
  }, []);

  const handleUndoPurchaseConfirm = useCallback(() => {
    setIsUndoPurchaseLoading(true);
    // Simulate purchase - in production this would be real IAP
    setTimeout(() => {
      // Add 3 undos on successful purchase
      setPlayerResources(prev => ({
        ...prev,
        paidUndos: prev.paidUndos + 3,
      }));
      setIsUndoPurchaseLoading(false);
      setShowUndoPurchaseModal(false);
      sounds.success(playerResources.soundEnabled);
      showFeedback({ text: '+3 UNDO!', emoji: '🎉', intensity: 'high', color: 'amber' });
      triggerHaptic('heavy');
    }, 1500);
  }, [playerResources.soundEnabled, showFeedback]);

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
    // Start new item game session
    setItemSessionStats(prev => startNewItemGame(prev));
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
    
    // Reset replay recorder for new game
    recorderRef.current = startRecording(createRecorderState());
    setCurrentReplay(null);
    setShowReplayPlayer(false);
    
    // Restart BGM if music is enabled
    if (playerResources.musicEnabled) {
      playBGM();
    }
  }, [gameState.score, generatePiecesWithRng, playerResources.musicEnabled]);
  
  // ========== REPLAY HANDLERS ==========
  const handleWatchReplay = useCallback(() => {
    setShowReplayPlayer(true);
  }, []);
  
  const handleCloseReplay = useCallback(() => {
    setShowReplayPlayer(false);
  }, []);

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

  // Calculate tension/danger mode based on grid occupancy
  const gridOccupancyForTension = getGridOccupancy(gameState.grid);
  const isTenseMode = gridOccupancyForTension > 0.65;
  const isDangerMode = gridOccupancyForTension > 0.80;

  return (
    <>
      
      {/* Particle effects layer */}
      <ParticleEffect trigger={particleTrigger} count={16} />
      
      {/* Directional particles for line clears */}
      <DirectionalParticles 
        lines={directionalClearLines} 
        boardRect={boardMetrics ? { left: boardMetrics.left, top: boardMetrics.top, cellSize: boardMetrics.cellSize } : null}
        gridSize={GRID_SIZE}
      />
      
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
      
      {/* Star Convergence Animation */}
      {isStarActive && starAnimationData && (
        <StarConvergence
          isActive={isStarActive}
          dominantColor={starAnimationData.dominantColor}
          affectedCells={starAnimationData.affectedCells}
          totalPoints={starAnimationData.totalPoints}
          onComplete={() => {
            if (!starAnimationData) return;
            
            // Clear cells and add points
            const newGrid = applyStarConvergence(gameState.grid, starAnimationData.affectedCells);
            const newScore = gameState.score + starAnimationData.totalPoints;
            
            setGameState(prev => ({
              ...prev,
              grid: newGrid,
              score: newScore,
              combo: 1, // Reset combo
            }));
            
            setIsStarActive(false);
            setStarAnimationData(null);
            
            showFeedback({ text: 'LEGENDARY!', emoji: '⭐', intensity: 'high', color: 'yellow' });
          }}
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
      
      {/* Star Tutorial overlay */}
      <StarTutorialOverlay
        state={starTutorial}
        starButtonRef={starButtonRef}
      />
      
      {/* Fixed HUD - TRUE OVERLAY, outside layout flow */}
      {/* Hide when game over or continue modal is showing */}
        {!isGameOver && !showContinueModal && (
          <GameHUD
            score={gameState.score}
            bestScore={playerResources.highScore}
            combo={gameState.combo}
            itemResources={itemResources}
            onOpenSettings={() => setShowSettingsModal(true)}
            onActivateStar={() => {
              if (!canUseStar(itemResources) || isStarActive) return;
              
              // Complete star tutorial when user clicks the star
              if (starTutorial.isActive && starTutorial.step === 'show-arrow') {
                setStarTutorial(advanceStarTutorial);
              }
              
              // FULL BOARD CLEAR - get ALL occupied cells
              const affectedCells = getAllOccupiedCells(gameState.grid);
              if (affectedCells.length === 0) return; // Grid empty, nothing to clear
              
              // Dominant color used only for animation visual
              const dominantColor = findDominantColor(gameState.grid) || 1;
              
              const totalPoints = calculateStarScore(affectedCells.length);
              
              setItemResources(prev => spendStar(prev));
              setStarAnimationData({ dominantColor, affectedCells, totalPoints });
              setIsStarActive(true);
              
              sounds.levelUp(playerResources.soundEnabled);
              triggerHaptic('heavy');
            }}
            starDisabled={isStarActive || (starTutorial.isActive && starTutorial.step !== 'show-arrow')}
            starButtonRef={starButtonRef}
          />
        )}

      {/* Main game container */}
      <div 
        className={cn(
          "fixed inset-0 flex flex-col items-center overflow-hidden",
          screenShake && "screen-shake",
          isTenseMode && !isDangerMode && "tension-mode",
          isDangerMode && "danger-mode",
          comboPulse === 'intense' && "combo-pulse-intense",
          comboPulse === 'normal' && "combo-pulse-active"
        )}
        style={{
          paddingTop: 'max(calc(env(safe-area-inset-top) + 100px), 120px)',
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
              floodingCells={floodingCells}
              tutorialTargetCells={tutorialTargetCells}
              justPlacedCells={justPlacedCells}
              highlightColor={highlightColor}
              onCellDrop={handleCellDrop}
              onCellHover={handleCellHover}
              onCellLeave={handleCellLeave}
            />
          </div>
        </div>
        
        {/* Undo Button - Above piece tray, centered */}
        {!tutorial.isActive && (
          <div className="flex-shrink-0 flex justify-center pb-4 mt-2">
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
            soundEnabled={playerResources.soundEnabled}
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
        
        {/* Unified Game Over / Continue Modal */}
        {(showContinueModal || isGameOver) && !showReplayPlayer && (
          <GameOverModal 
            score={gameState.score} 
            highScore={playerResources.highScore} 
            onRestart={handleRestart}
            showContinueOptions={showContinueModal && !isGameOver}
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
            replayData={currentReplay}
            onWatchReplay={handleWatchReplay}
          />
        )}
        
        {/* Replay Player */}
        {showReplayPlayer && currentReplay && (
          <ReplayPlayer
            replay={currentReplay}
            onClose={handleCloseReplay}
            onRestart={handleRestart}
          />
        )}
        
        {/* Undo Purchase Modal */}
        <UndoPurchaseModal
          isOpen={showUndoPurchaseModal}
          onClose={() => setShowUndoPurchaseModal(false)}
          onConfirm={handleUndoPurchaseConfirm}
          isLoading={isUndoPurchaseLoading}
        />
      </div>
      
      {/* Banner Ad - Fixed at bottom, outside layout flow */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <BannerAd />
      </div>
    </>
  );
};

export default BlockBlastGame;
