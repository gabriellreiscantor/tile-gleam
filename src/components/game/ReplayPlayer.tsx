import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, X, FastForward, Rewind, SkipBack } from 'lucide-react';
import { cn } from '@/lib/utils';
import GameBoard from './GameBoard';
import AnimatedReplayPiece from './AnimatedReplayPiece';
import {
  type ReplayData,
  type RecordedMove,
  getReplayDuration,
  getReplayStats,
} from '@/lib/replayRecorder';
import { createEmptyGrid, GRID_SIZE } from '@/lib/gameEngine';
import { createEmptyItemGrid } from '@/lib/collectibles';

interface ReplayPlayerProps {
  replay: ReplayData;
  onClose: () => void;
  onRestart: () => void;
}

const PLAYBACK_SPEEDS = [1, 2, 4];

// Duração de cada fase de animação (ms)
const DRAG_DURATION = 600;
const DROP_DURATION = 150;
const CLEAR_DURATION = 400;

type AnimationPhase = 'idle' | 'drag' | 'drop' | 'clear';

interface MoveAnimation {
  moveIndex: number;
  phase: AnimationPhase;
  progress: number; // 0-1 dentro da fase atual
}

// Calcula a duração total do replay cinematográfico
function getCinematicDuration(replay: ReplayData): number {
  let total = 0;
  for (const move of replay.moves) {
    total += DRAG_DURATION + DROP_DURATION;
    if (move.linesCleared > 0) {
      total += CLEAR_DURATION;
    }
  }
  return total;
}

// Encontra qual move e fase para um determinado tempo
function getMoveAnimationAtTime(replay: ReplayData, time: number): MoveAnimation {
  let elapsed = 0;
  
  for (let i = 0; i < replay.moves.length; i++) {
    const move = replay.moves[i];
    const moveDuration = DRAG_DURATION + DROP_DURATION + (move.linesCleared > 0 ? CLEAR_DURATION : 0);
    
    if (time < elapsed + moveDuration) {
      // Estamos neste move
      const timeInMove = time - elapsed;
      
      if (timeInMove < DRAG_DURATION) {
        return {
          moveIndex: i,
          phase: 'drag',
          progress: timeInMove / DRAG_DURATION,
        };
      } else if (timeInMove < DRAG_DURATION + DROP_DURATION) {
        return {
          moveIndex: i,
          phase: 'drop',
          progress: (timeInMove - DRAG_DURATION) / DROP_DURATION,
        };
      } else {
        return {
          moveIndex: i,
          phase: 'clear',
          progress: (timeInMove - DRAG_DURATION - DROP_DURATION) / CLEAR_DURATION,
        };
      }
    }
    
    elapsed += moveDuration;
  }
  
  // Fim do replay
  return {
    moveIndex: replay.moves.length - 1,
    phase: 'idle',
    progress: 1,
  };
}

// Interpola posição da peça durante o drag
function interpolateDragPosition(
  move: RecordedMove,
  progress: number,
  boardRect: DOMRect,
  cellSize: number
): { x: number; y: number } {
  const path = move.dragPath;
  
  // Posição final no grid (centro da peça)
  const pieceWidth = move.pieceShape[0].length;
  const pieceHeight = move.pieceShape.length;
  const finalX = boardRect.left + (move.gridX + pieceWidth / 2) * cellSize;
  const finalY = boardRect.top + (move.gridY + pieceHeight / 2) * cellSize;
  
  if (!path || path.length === 0) {
    // Sem path, usa interpolação linear do centro da tela
    const startX = boardRect.left + boardRect.width / 2;
    const startY = boardRect.bottom + 100;
    
    // Ease out
    const eased = 1 - Math.pow(1 - progress, 3);
    
    return {
      x: startX + (finalX - startX) * eased,
      y: startY + (finalY - startY) * eased,
    };
  }
  
  // Usa o path gravado
  if (progress >= 1) {
    return { x: finalX, y: finalY };
  }
  
  // Encontra o ponto no path correspondente ao progresso
  const targetT = progress * (path[path.length - 1].t || 1);
  
  for (let i = 0; i < path.length - 1; i++) {
    if (path[i + 1].t >= targetT) {
      const segment = (targetT - path[i].t) / (path[i + 1].t - path[i].t);
      return {
        x: path[i].x + (path[i + 1].x - path[i].x) * segment,
        y: path[i].y + (path[i + 1].y - path[i].y) * segment,
      };
    }
  }
  
  const lastPoint = path[path.length - 1];
  return { x: lastPoint.x, y: lastPoint.y };
}

const ReplayPlayer: React.FC<ReplayPlayerProps> = ({ replay, onClose, onRestart }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [moveAnimation, setMoveAnimation] = useState<MoveAnimation>({ moveIndex: -1, phase: 'idle', progress: 0 });
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
  
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const boardRef = useRef<HTMLDivElement>(null);
  
  const totalDuration = getCinematicDuration(replay);
  const speed = PLAYBACK_SPEEDS[speedIndex];
  const stats = getReplayStats(replay);
  
  // Obtém o move atual
  const currentMove = moveAnimation.moveIndex >= 0 && moveAnimation.moveIndex < replay.moves.length
    ? replay.moves[moveAnimation.moveIndex]
    : null;
  
  // Grid a mostrar depende da fase
  const getDisplayGrid = () => {
    if (!currentMove) return createEmptyGrid();
    
    if (moveAnimation.phase === 'drag') {
      // Durante drag, mostra o grid ANTES da jogada
      return currentMove.gridBefore;
    }
    
    // Após drop, mostra o grid com a peça colocada
    return currentMove.gridSnapshot;
  };
  
  // Score e combo atuais
  const currentScore = currentMove?.scoreAfter ?? 0;
  const currentCombo = moveAnimation.phase === 'clear' || moveAnimation.phase === 'idle'
    ? (currentMove?.comboAfter ?? 0)
    : 0;
  
  // Calcula posição e métricas do board
  const getBoardMetrics = useCallback(() => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const cellSize = rect.width / GRID_SIZE;
    return { rect, cellSize };
  }, []);
  
  // Atualiza células em clearing
  useEffect(() => {
    if (moveAnimation.phase === 'clear' && currentMove && currentMove.linesCleared > 0) {
      const cells = new Set<string>();
      currentMove.clearedRows.forEach(row => {
        for (let col = 0; col < GRID_SIZE; col++) {
          cells.add(`${col}-${row}`);
        }
      });
      currentMove.clearedCols.forEach(col => {
        for (let row = 0; row < GRID_SIZE; row++) {
          cells.add(`${col}-${row}`);
        }
      });
      setClearingCells(cells);
    } else {
      setClearingCells(new Set());
    }
  }, [moveAnimation.phase, currentMove]);
  
  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!isPlaying) return;
    
    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;
    
    setCurrentTime(prev => {
      const newTime = prev + delta * speed;
      
      if (newTime >= totalDuration) {
        setIsPlaying(false);
        return totalDuration;
      }
      
      return newTime;
    });
    
    animationRef.current = requestAnimationFrame(animate);
  }, [isPlaying, speed, totalDuration]);
  
  // Start/stop animation
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);
  
  // Update move animation when time changes
  useEffect(() => {
    const anim = getMoveAnimationAtTime(replay, currentTime);
    setMoveAnimation(anim);
  }, [currentTime, replay]);
  
  const handlePlayPause = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
      setMoveAnimation({ moveIndex: -1, phase: 'idle', progress: 0 });
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleSpeedToggle = () => {
    setSpeedIndex((speedIndex + 1) % PLAYBACK_SPEEDS.length);
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };
  
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setMoveAnimation({ moveIndex: -1, phase: 'idle', progress: 0 });
  };
  
  const handleSkipBack = () => {
    if (moveAnimation.moveIndex > 0) {
      // Calcula o tempo no início do move anterior
      let time = 0;
      for (let i = 0; i < moveAnimation.moveIndex - 1; i++) {
        const m = replay.moves[i];
        time += DRAG_DURATION + DROP_DURATION + (m.linesCleared > 0 ? CLEAR_DURATION : 0);
      }
      setCurrentTime(time);
    } else {
      setCurrentTime(0);
    }
  };
  
  const handleSkipForward = () => {
    if (moveAnimation.moveIndex < replay.moves.length - 1) {
      // Calcula o tempo no início do próximo move
      let time = 0;
      for (let i = 0; i <= moveAnimation.moveIndex; i++) {
        const m = replay.moves[i];
        time += DRAG_DURATION + DROP_DURATION + (m.linesCleared > 0 ? CLEAR_DURATION : 0);
      }
      setCurrentTime(time);
    }
  };
  
  const formatTime = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}:${s.toString().padStart(2, '0')}`;
  };
  
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  
  // Calcula posição da peça animada
  const renderAnimatedPiece = () => {
    if (!currentMove || moveAnimation.phase !== 'drag') return null;
    
    const metrics = getBoardMetrics();
    if (!metrics) return null;
    
    const pos = interpolateDragPosition(
      currentMove,
      moveAnimation.progress,
      metrics.rect,
      metrics.cellSize
    );
    
    return (
      <AnimatedReplayPiece
        piece={currentMove.pieceShape}
        colorId={currentMove.colorId}
        x={pos.x}
        y={pos.y}
        cellSize={metrics.cellSize * 0.9}
        scale={1.15 - moveAnimation.progress * 0.15}
      />
    );
  };
  
  // Efeito de flash no drop
  const showDropFlash = moveAnimation.phase === 'drop';
  
  return (
    <div 
      className="fixed inset-0 z-[80] flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #0a1628 0%, #1a2d4a 50%, #0a1628 100%)',
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        
        <div className="text-center">
          <h2 className="text-white font-bold text-lg">📽️ Replay</h2>
          <p className="text-white/60 text-xs">
            Move {moveAnimation.moveIndex + 1} / {replay.totalMoves}
            {moveAnimation.phase !== 'idle' && (
              <span className="ml-2 text-amber-400/80">
                {moveAnimation.phase === 'drag' && '🎯'}
                {moveAnimation.phase === 'drop' && '💥'}
                {moveAnimation.phase === 'clear' && '✨'}
              </span>
            )}
          </p>
        </div>
        
        <button
          onClick={onRestart}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <RotateCcw className="w-5 h-5 text-white" />
        </button>
      </div>
      
      {/* Score Display */}
      <div className="flex justify-center gap-8 py-2">
        <div className="text-center">
          <span className="text-white/50 text-xs uppercase tracking-wider">Score</span>
          <p className={cn(
            "text-white font-bold text-2xl tabular-nums transition-all duration-150",
            showDropFlash && "scale-110 text-emerald-400"
          )}>
            {currentScore.toLocaleString()}
          </p>
        </div>
        {currentCombo > 0 && (
          <div className="text-center">
            <span className="text-amber-400/70 text-xs uppercase tracking-wider">Combo</span>
            <p className={cn(
              "text-amber-400 font-bold text-2xl transition-all duration-150",
              moveAnimation.phase === 'clear' && "animate-pulse"
            )}>
              x{currentCombo}
            </p>
          </div>
        )}
      </div>
      
      {/* Game Board */}
      <div className="flex-1 flex items-center justify-center px-4 relative" ref={boardRef}>
        <GameBoard
          grid={getDisplayGrid()}
          itemGrid={createEmptyItemGrid()}
          ghostPosition={null}
          clearingCells={clearingCells}
          floodingCells={new Map()}
          tutorialTargetCells={null}
          onCellDrop={() => {}}
          onCellHover={() => {}}
          onCellLeave={() => {}}
        />
        
        {/* Peça animada flutuante */}
        {renderAnimatedPiece()}
        
        {/* Drop flash overlay */}
        {showDropFlash && (
          <div 
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
              animation: 'pulse 150ms ease-out',
            }}
          />
        )}
      </div>
      
      {/* Stats Bar */}
      <div className="flex justify-center gap-6 py-3 px-4">
        <div className="text-center">
          <span className="text-white/40 text-[10px] uppercase">Duration</span>
          <p className="text-white/80 text-sm font-medium">{stats.duration}</p>
        </div>
        <div className="text-center">
          <span className="text-white/40 text-[10px] uppercase">Avg/Move</span>
          <p className="text-white/80 text-sm font-medium">{stats.avgTimePerMove}</p>
        </div>
        <div className="text-center">
          <span className="text-white/40 text-[10px] uppercase">Max Combo</span>
          <p className="text-amber-400/80 text-sm font-medium">x{stats.maxCombo}</p>
        </div>
        <div className="text-center">
          <span className="text-white/40 text-[10px] uppercase">Lines</span>
          <p className="text-cyan-400/80 text-sm font-medium">{stats.totalLinesCleared}</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="px-6 py-2">
        <div className="relative">
          <input
            type="range"
            min={0}
            max={totalDuration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-white
                       [&::-webkit-slider-thumb]:shadow-lg"
            style={{
              background: `linear-gradient(to right, #22c55e ${progress}%, rgba(255,255,255,0.1) ${progress}%)`,
            }}
          />
        </div>
        <div className="flex justify-between text-white/50 text-xs mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>
      
      {/* Controls */}
      <div 
        className="flex items-center justify-center gap-4 py-4 px-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        {/* Reset */}
        <button
          onClick={handleReset}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center
                     active:scale-95 transition-transform"
        >
          <SkipBack className="w-5 h-5 text-white" />
        </button>
        
        {/* Skip Back */}
        <button
          onClick={handleSkipBack}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center
                     active:scale-95 transition-transform"
        >
          <Rewind className="w-5 h-5 text-white" />
        </button>
        
        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            "active:scale-95 transition-all",
            isPlaying
              ? "bg-gradient-to-b from-amber-400 to-amber-500"
              : "bg-gradient-to-b from-emerald-400 to-emerald-500"
          )}
          style={{
            boxShadow: isPlaying
              ? '0 6px 0 #b45309, 0 10px 20px rgba(245, 158, 11, 0.4)'
              : '0 6px 0 #047857, 0 10px 20px rgba(16, 185, 129, 0.4)',
          }}
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 text-white" fill="white" />
          ) : (
            <Play className="w-7 h-7 text-white ml-1" fill="white" />
          )}
        </button>
        
        {/* Skip Forward */}
        <button
          onClick={handleSkipForward}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center
                     active:scale-95 transition-transform"
        >
          <FastForward className="w-5 h-5 text-white" />
        </button>
        
        {/* Speed */}
        <button
          onClick={handleSpeedToggle}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center
                     active:scale-95 transition-transform"
        >
          <span className="text-white font-bold text-sm">{speed}x</span>
        </button>
      </div>
    </div>
  );
};

export default ReplayPlayer;
