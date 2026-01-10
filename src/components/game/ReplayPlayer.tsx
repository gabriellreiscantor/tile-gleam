import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, X, FastForward, Rewind, SkipBack } from 'lucide-react';
import { cn } from '@/lib/utils';
import GameBoard from './GameBoard';
import {
  type ReplayData,
  getReplayDuration,
  getMoveIndexAtTime,
  getReplayStats,
} from '@/lib/replayRecorder';
import { createEmptyGrid } from '@/lib/gameEngine';
import { createEmptyItemGrid } from '@/lib/collectibles';

interface ReplayPlayerProps {
  replay: ReplayData;
  onClose: () => void;
  onRestart: () => void;
}

const PLAYBACK_SPEEDS = [1, 2, 4];

const ReplayPlayer: React.FC<ReplayPlayerProps> = ({ replay, onClose, onRestart }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  const totalDuration = getReplayDuration(replay);
  const speed = PLAYBACK_SPEEDS[speedIndex];
  const stats = getReplayStats(replay);
  
  // Get current grid state
  const currentGrid = currentMoveIndex >= 0 && currentMoveIndex < replay.moves.length
    ? replay.moves[currentMoveIndex].gridSnapshot
    : createEmptyGrid();
  
  const currentScore = currentMoveIndex >= 0 && currentMoveIndex < replay.moves.length
    ? replay.moves[currentMoveIndex].scoreAfter
    : 0;
  
  const currentCombo = currentMoveIndex >= 0 && currentMoveIndex < replay.moves.length
    ? replay.moves[currentMoveIndex].comboAfter
    : 0;
  
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
  
  // Update move index when time changes
  useEffect(() => {
    const moveIndex = getMoveIndexAtTime(replay, currentTime);
    setCurrentMoveIndex(moveIndex);
  }, [currentTime, replay]);
  
  const handlePlayPause = () => {
    if (currentTime >= totalDuration) {
      // Reset to start if at end
      setCurrentTime(0);
      setCurrentMoveIndex(-1);
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
    setCurrentMoveIndex(-1);
  };
  
  const handleSkipBack = () => {
    if (currentMoveIndex > 0) {
      const prevMove = replay.moves[currentMoveIndex - 1];
      setCurrentTime(prevMove.timestamp);
    } else {
      setCurrentTime(0);
    }
  };
  
  const handleSkipForward = () => {
    if (currentMoveIndex < replay.moves.length - 1) {
      const nextMove = replay.moves[currentMoveIndex + 1];
      setCurrentTime(nextMove.timestamp);
    }
  };
  
  const formatTime = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}:${s.toString().padStart(2, '0')}`;
  };
  
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  
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
          <p className="text-white/60 text-xs">Move {currentMoveIndex + 1} / {replay.totalMoves}</p>
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
          <p className="text-white font-bold text-2xl tabular-nums">{currentScore.toLocaleString()}</p>
        </div>
        {currentCombo > 0 && (
          <div className="text-center">
            <span className="text-amber-400/70 text-xs uppercase tracking-wider">Combo</span>
            <p className="text-amber-400 font-bold text-2xl">x{currentCombo}</p>
          </div>
        )}
      </div>
      
      {/* Game Board */}
      <div className="flex-1 flex items-center justify-center px-4">
        <GameBoard
          grid={currentGrid}
          itemGrid={createEmptyItemGrid()}
          ghostPosition={null}
          clearingCells={new Set()}
          floodingCells={new Map()}
          tutorialTargetCells={null}
          onCellDrop={() => {}}
          onCellHover={() => {}}
          onCellLeave={() => {}}
        />
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
