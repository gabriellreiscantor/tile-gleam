// gameEngine.ts - Core game logic separated from UI
export type ColorId = number; // 0 = empty, 1-8 = colors
export type Piece = number[][]; // 0/1 matrix
export type Grid = ColorId[][];

export interface ClearResult {
  clearedRows: number[];
  clearedCols: number[];
  linesCleared: number;
}

export interface ScoreResult {
  placedBlocks: number;
  linesCleared: number;
  comboAfter: number;
  pointsGained: number;
}

export interface EngineState {
  grid: Grid;
  score: number;
  combo: number;
  movesSinceClear: number;
}

export const GRID_SIZE = 8;
export const VALID_COLOR_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

export function createEmptyGrid(size = GRID_SIZE): Grid {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map(row => [...row]);
}

/**
 * Convert pixel coordinates to grid coordinates
 * ALWAYS use Math.floor - NEVER use Math.round
 */
export function pixelToGrid(
  pixelX: number,
  pixelY: number,
  cellSize: number,
  boardLeft: number,
  boardTop: number
): { gx: number; gy: number } {
  return {
    gx: Math.floor((pixelX - boardLeft) / cellSize),
    gy: Math.floor((pixelY - boardTop) / cellSize),
  };
}

/**
 * Check if piece can be placed at position
 * This is THE source of truth - used for both preview AND placement
 */
export function canPlace(grid: Grid, piece: Piece, x: number, y: number): boolean {
  for (let py = 0; py < piece.length; py++) {
    for (let px = 0; px < piece[py].length; px++) {
      if (!piece[py][px]) continue;
      
      const gx = x + px;
      const gy = y + py;
      
      // Strict bounds check
      if (gx < 0 || gy < 0 || gx >= GRID_SIZE || gy >= GRID_SIZE) return false;
      // Strict collision check
      if (grid[gy][gx] !== 0) return false;
    }
  }
  return true;
}

/**
 * Validate grid integrity - run after every mutation
 * Throws if grid is corrupted
 */
export function validateGrid(grid: Grid): void {
  if (grid.length !== GRID_SIZE) {
    throw new Error(`Grid corrupted: expected ${GRID_SIZE} rows, got ${grid.length}`);
  }
  
  for (let y = 0; y < GRID_SIZE; y++) {
    if (grid[y].length !== GRID_SIZE) {
      throw new Error(`Grid corrupted: row ${y} has ${grid[y].length} cells`);
    }
    
    for (let x = 0; x < GRID_SIZE; x++) {
      const value = grid[y][x];
      if (!VALID_COLOR_IDS.includes(value as typeof VALID_COLOR_IDS[number])) {
        throw new Error(`Grid corrupted: invalid value ${value} at (${x}, ${y})`);
      }
    }
  }
}

export function placePiece(
  state: EngineState,
  piece: Piece,
  x: number,
  y: number,
  colorId: ColorId,
): { next: EngineState; clear: ClearResult; score: ScoreResult } {
  // STRICT: No placement if canPlace returns false
  if (!canPlace(state.grid, piece, x, y)) {
    throw new Error("Invalid placement - canPlace returned false");
  }

  const grid = cloneGrid(state.grid);
  let placedBlocks = 0;

  // Write piece to grid
  for (let py = 0; py < piece.length; py++) {
    for (let px = 0; px < piece[py].length; px++) {
      if (!piece[py][px]) continue;
      grid[y + py][x + px] = colorId;
      placedBlocks++;
    }
  }

  // Validate after placement
  validateGrid(grid);

  const clear = findClears(grid);
  const { nextGrid, pointsFromClear, comboAfter, movesSinceClear } = applyClearsAndScore({
    grid,
    combo: state.combo,
    movesSinceClear: state.movesSinceClear,
    clear,
  });

  // Validate after clears
  validateGrid(nextGrid);

  const pointsFromPlacement = placedBlocks * 2;
  const pointsGained = pointsFromPlacement + pointsFromClear;

  const next: EngineState = {
    grid: nextGrid,
    score: state.score + pointsGained,
    combo: comboAfter,
    movesSinceClear,
  };

  return {
    next,
    clear,
    score: {
      placedBlocks,
      linesCleared: clear.linesCleared,
      comboAfter,
      pointsGained,
    },
  };
}

export function findClears(grid: Grid): ClearResult {
  const clearedRows: number[] = [];
  const clearedCols: number[] = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    if (grid[r].every(v => v !== 0)) clearedRows.push(r);
  }

  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (grid[r][c] === 0) { full = false; break; }
    }
    if (full) clearedCols.push(c);
  }

  return {
    clearedRows,
    clearedCols,
    linesCleared: clearedRows.length + clearedCols.length,
  };
}

function applyClearsAndScore(args: {
  grid: Grid;
  combo: number;
  movesSinceClear: number;
  clear: ClearResult;
}): { nextGrid: Grid; pointsFromClear: number; comboAfter: number; movesSinceClear: number } {
  const grid = args.grid;
  const { clearedRows, clearedCols, linesCleared } = args.clear;

  if (linesCleared === 0) {
    const moves = args.movesSinceClear + 1;
    const comboAfter = moves >= 3 ? 0 : args.combo;
    return { nextGrid: grid, pointsFromClear: 0, comboAfter, movesSinceClear: moves };
  }

  clearedRows.forEach(r => {
    for (let c = 0; c < GRID_SIZE; c++) grid[r][c] = 0;
  });
  clearedCols.forEach(c => {
    for (let r = 0; r < GRID_SIZE; r++) grid[r][c] = 0;
  });

  const comboAfter = args.combo + linesCleared;

  const base = 25 * linesCleared;
  const mult = 1 + Math.min(comboAfter, 10) * 0.12;
  const pointsFromClear = Math.round(base * mult);

  return { nextGrid: grid, pointsFromClear, comboAfter, movesSinceClear: 0 };
}

export function anyMoveAvailable(grid: Grid, pieces: Piece[]): boolean {
  for (const piece of pieces) {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (canPlace(grid, piece, x, y)) return true;
      }
    }
  }
  return false;
}

export function createInitialState(): EngineState {
  return {
    grid: createEmptyGrid(),
    score: 0,
    combo: 0,
    movesSinceClear: 0,
  };
}
