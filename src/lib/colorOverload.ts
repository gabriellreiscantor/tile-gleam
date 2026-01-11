// colorOverload.ts - Color Overload Combo detection and logic
import type { Grid, ColorId } from './gameEngine';

export interface OverloadResult {
  triggered: boolean;
  dominantColor: ColorId;
  connectedCells: { x: number; y: number }[];
  allCellsToConvert: { x: number; y: number }[];
  baseScore: number;
}

// Flood fill to find connected cells of same color
function floodFill(
  grid: Grid,
  startX: number,
  startY: number,
  colorId: ColorId,
  visited: Set<string>
): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
  const key = (x: number, y: number) => `${x}-${y}`;
  
  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    const k = key(x, y);
    
    if (visited.has(k)) continue;
    if (x < 0 || y < 0 || x >= grid[0].length || y >= grid.length) continue;
    if (grid[y][x] !== colorId) continue;
    
    visited.add(k);
    cells.push({ x, y });
    
    // Check 4 neighbors
    queue.push({ x: x + 1, y });
    queue.push({ x: x - 1, y });
    queue.push({ x, y: y + 1 });
    queue.push({ x, y: y - 1 });
  }
  
  return cells;
}

// Find all connected groups on the grid
function findAllConnectedGroups(grid: Grid): Map<ColorId, { x: number; y: number }[][]> {
  const visited = new Set<string>();
  const groups = new Map<ColorId, { x: number; y: number }[][]>();
  
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const color = grid[y][x];
      if (color === 0 || visited.has(`${x}-${y}`)) continue;
      
      const cells = floodFill(grid, x, y, color, visited);
      if (cells.length > 0) {
        if (!groups.has(color)) groups.set(color, []);
        groups.get(color)!.push(cells);
      }
    }
  }
  
  return groups;
}

// Count total filled cells on grid
function countFilledCells(grid: Grid): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== 0) count++;
    }
  }
  return count;
}

// Get all filled cells
function getAllFilledCells(grid: Grid): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x] !== 0) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
}

// Check color dominance (60%+ of visible blocks)
function checkColorDominance(grid: Grid): { color: ColorId; percentage: number } | null {
  const totalFilled = countFilledCells(grid);
  if (totalFilled === 0) return null;
  
  const colorCounts = new Map<ColorId, number>();
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== 0) {
        colorCounts.set(cell, (colorCounts.get(cell) || 0) + 1);
      }
    }
  }
  
  for (const [color, count] of colorCounts) {
    const percentage = count / totalFilled;
    if (percentage >= 0.60) {
      return { color, percentage };
    }
  }
  
  return null;
}

/**
 * Check if Color Overload should trigger
 * Conditions:
 * - 8+ connected blocks of same color OR
 * - 60%+ of visible blocks are same color
 */
export function checkColorOverload(
  grid: Grid,
  _placedCells: { x: number; y: number }[]
): OverloadResult {
  const groups = findAllConnectedGroups(grid);
  
  // Check for 8+ connected blocks
  for (const [color, colorGroups] of groups) {
    for (const group of colorGroups) {
      if (group.length >= 8) {
        const allCells = getAllFilledCells(grid);
        return {
          triggered: true,
          dominantColor: color,
          connectedCells: group,
          allCellsToConvert: allCells,
          baseScore: 500,
        };
      }
    }
  }
  
  // Check for 60% dominance
  const dominance = checkColorDominance(grid);
  if (dominance) {
    const allCells = getAllFilledCells(grid);
    return {
      triggered: true,
      dominantColor: dominance.color,
      connectedCells: allCells, // All cells of that color are "connected" conceptually
      allCellsToConvert: allCells,
      baseScore: 500,
    };
  }
  
  return {
    triggered: false,
    dominantColor: 0,
    connectedCells: [],
    allCellsToConvert: [],
    baseScore: 0,
  };
}

/**
 * Calculate Color Overload score
 * Base: 500 × combo multiplier
 */
export function calculateOverloadScore(cellCount: number, combo: number): number {
  const base = 500;
  const cellBonus = cellCount * 5;
  const comboMultiplier = 1 + Math.min(combo, 20) * 0.15;
  return Math.round((base + cellBonus) * comboMultiplier);
}

/**
 * Convert all cells to dominant color (for animation)
 */
export function convertGridToColor(grid: Grid, colorId: ColorId): Grid {
  return grid.map(row => 
    row.map(cell => cell !== 0 ? colorId : 0)
  );
}

/**
 * Clear all cells (after overload explosion)
 */
export function clearAllCells(grid: Grid): Grid {
  return grid.map(row => row.map(() => 0));
}
