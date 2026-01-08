import type { Piece } from './gameEngine';

// All piece shapes with their matrices
export const PIECE_SHAPES: Piece[] = [
  // Single block
  [[1]],
  
  // 2-block horizontal
  [[1, 1]],
  
  // 2-block vertical
  [[1], [1]],
  
  // 3-block horizontal
  [[1, 1, 1]],
  
  // 3-block vertical
  [[1], [1], [1]],
  
  // L shape
  [[1, 0], [1, 0], [1, 1]],
  
  // Reverse L
  [[0, 1], [0, 1], [1, 1]],
  
  // T shape
  [[1, 1, 1], [0, 1, 0]],
  
  // 2x2 square
  [[1, 1], [1, 1]],
  
  // 3x3 square
  [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
  
  // Z shape
  [[1, 1, 0], [0, 1, 1]],
  
  // S shape
  [[0, 1, 1], [1, 1, 0]],
  
  // 4-block horizontal
  [[1, 1, 1, 1]],
  
  // 4-block vertical
  [[1], [1], [1], [1]],
  
  // 5-block horizontal
  [[1, 1, 1, 1, 1]],
  
  // 5-block vertical
  [[1], [1], [1], [1], [1]],
  
  // Small L
  [[1, 0], [1, 1]],
  
  // Small reverse L
  [[0, 1], [1, 1]],
  
  // Corner
  [[1, 1], [1, 0]],
  
  // Reverse corner
  [[1, 1], [0, 1]],
];

// Tile colors (HSL values for the design system)
export const TILE_COLORS = [
  { name: 'red', hue: 0 },
  { name: 'orange', hue: 25 },
  { name: 'yellow', hue: 45 },
  { name: 'green', hue: 145 },
  { name: 'cyan', hue: 185 },
  { name: 'blue', hue: 220 },
  { name: 'purple', hue: 270 },
  { name: 'pink', hue: 330 },
];

export interface GamePiece {
  shape: Piece;
  colorId: number;
  id: string;
}

export function getRandomPiece(): GamePiece {
  const shape = PIECE_SHAPES[Math.floor(Math.random() * PIECE_SHAPES.length)];
  const colorId = Math.floor(Math.random() * TILE_COLORS.length) + 1; // 1-8
  const id = `piece-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return { shape, colorId, id };
}

export function generatePieceSet(): GamePiece[] {
  return [getRandomPiece(), getRandomPiece(), getRandomPiece()];
}

export function getPieceBlocks(piece: Piece): number {
  let count = 0;
  for (const row of piece) {
    for (const cell of row) {
      if (cell) count++;
    }
  }
  return count;
}
