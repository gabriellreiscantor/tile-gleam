// replayRecorder.ts - Sistema de gravação e replay de partidas cinematográfico

import type { Grid, Piece } from './gameEngine';

// Ponto de trajetória do drag
export interface DragPoint {
  x: number;
  y: number;
  t: number; // timestamp relativo ao início do drag
}

// Evento de jogada gravado com dados cinematográficos
export interface RecordedMove {
  timestamp: number; // ms desde início da partida
  pieceId: string;
  pieceShape: Piece;
  colorId: number;
  gridX: number;
  gridY: number;
  scoreAfter: number;
  comboAfter: number;
  linesCleared: number;
  gridSnapshot: Grid; // Estado do grid APÓS a jogada
  
  // Dados cinematográficos
  gridBefore: Grid; // Estado ANTES de colocar
  dragPath: DragPoint[]; // Trajetória do drag (posições em pixels)
  clearedRows: number[]; // Linhas que foram limpas
  clearedCols: number[]; // Colunas que foram limpas
  placementDuration: number; // Tempo que levou para colocar (ms)
}

// Dados completos do replay
export interface ReplayData {
  startTime: number;
  endTime: number;
  finalScore: number;
  highScore: number;
  totalMoves: number;
  moves: RecordedMove[];
}

// Estado do recorder durante a partida
export interface RecorderState {
  isRecording: boolean;
  startTime: number;
  moves: RecordedMove[];
}

// Criar estado inicial do recorder
export function createRecorderState(): RecorderState {
  return {
    isRecording: false,
    startTime: 0,
    moves: [],
  };
}

// Iniciar gravação de uma nova partida
export function startRecording(state: RecorderState): RecorderState {
  return {
    isRecording: true,
    startTime: Date.now(),
    moves: [],
  };
}

// Gravar uma jogada com dados cinematográficos
export function recordMove(
  state: RecorderState,
  move: Omit<RecordedMove, 'timestamp'>
): RecorderState {
  if (!state.isRecording) return state;
  
  const recordedMove: RecordedMove = {
    ...move,
    timestamp: Date.now() - state.startTime,
    // Clone dos grids para evitar mutações
    gridSnapshot: move.gridSnapshot.map(row => [...row]),
    gridBefore: move.gridBefore.map(row => [...row]),
    // Clone do drag path
    dragPath: move.dragPath.map(p => ({ ...p })),
    clearedRows: [...move.clearedRows],
    clearedCols: [...move.clearedCols],
  };
  
  return {
    ...state,
    moves: [...state.moves, recordedMove],
  };
}

// Finalizar gravação e gerar dados do replay
export function finishRecording(
  state: RecorderState,
  finalScore: number,
  highScore: number
): ReplayData | null {
  if (!state.isRecording || state.moves.length === 0) {
    return null;
  }
  
  return {
    startTime: state.startTime,
    endTime: Date.now(),
    finalScore,
    highScore,
    totalMoves: state.moves.length,
    moves: state.moves,
  };
}

// Resetar recorder
export function resetRecorder(): RecorderState {
  return createRecorderState();
}

// Estado do player de replay
export interface ReplayPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  currentMoveIndex: number;
  playbackSpeed: number; // 1x, 2x, 4x
  elapsedTime: number;
}

export function createReplayPlayerState(): ReplayPlayerState {
  return {
    isPlaying: false,
    isPaused: false,
    currentMoveIndex: 0,
    playbackSpeed: 1,
    elapsedTime: 0,
  };
}

// Calcular duração total do replay
export function getReplayDuration(replay: ReplayData): number {
  if (replay.moves.length === 0) return 0;
  return replay.moves[replay.moves.length - 1].timestamp;
}

// Encontrar o índice da jogada para um determinado tempo
export function getMoveIndexAtTime(replay: ReplayData, time: number): number {
  for (let i = replay.moves.length - 1; i >= 0; i--) {
    if (replay.moves[i].timestamp <= time) {
      return i;
    }
  }
  return -1;
}

// Obter o grid no estado de uma jogada específica
export function getGridAtMove(replay: ReplayData, moveIndex: number): Grid | null {
  if (moveIndex < 0 || moveIndex >= replay.moves.length) {
    return null;
  }
  return replay.moves[moveIndex].gridSnapshot;
}

// Obter estatísticas do replay
export function getReplayStats(replay: ReplayData): {
  duration: string;
  totalMoves: number;
  avgTimePerMove: string;
  maxCombo: number;
  totalLinesCleared: number;
} {
  const durationMs = getReplayDuration(replay);
  const durationSec = Math.floor(durationMs / 1000);
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  
  const avgMs = replay.moves.length > 0 
    ? Math.floor(durationMs / replay.moves.length) 
    : 0;
  
  let maxCombo = 0;
  let totalLines = 0;
  
  for (const move of replay.moves) {
    if (move.comboAfter > maxCombo) maxCombo = move.comboAfter;
    totalLines += move.linesCleared;
  }
  
  return {
    duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    totalMoves: replay.moves.length,
    avgTimePerMove: `${(avgMs / 1000).toFixed(1)}s`,
    maxCombo,
    totalLinesCleared: totalLines,
  };
}
