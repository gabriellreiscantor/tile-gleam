// ========================================
// COLLECTIBLES SYSTEM
// Manages Crystal (💎) and Star (⭐) spawning, collection, and usage
// ========================================

export type ItemType = 'crystal' | 'star';

export interface ItemResources {
  crystals: number;
  stars: number;
}

export interface CollectedItem {
  type: ItemType;
  x: number;
  y: number;
}

export interface CollectionResult {
  collected: CollectedItem[];
  newItemGrid: ItemGrid;
}

export type ItemGrid = (ItemType | null)[][];

// Emoji mapping for visual display
export const ITEM_EMOJI: Record<ItemType, string> = {
  crystal: '💎',
  star: '⭐',
};

// ========================================
// SESSION STATS - Track per-game and across sessions
// ========================================

export interface ItemSessionStats {
  crystalsThisGame: number;
  starsThisGame: number;
  currentGameNumber: number;
  lastStarGameNumber: number; // Last game where star dropped
  gamesSinceLastStar: number; // Counter for 15-game cooldown
  crystalsCollectedLast10Games: number;
  hasEverCollectedCrystal: boolean;
}

const INITIAL_SESSION_STATS: ItemSessionStats = {
  crystalsThisGame: 0,
  starsThisGame: 0,
  currentGameNumber: 1,
  lastStarGameNumber: 0,
  gamesSinceLastStar: 999, // High initial value so first star can drop
  crystalsCollectedLast10Games: 0,
  hasEverCollectedCrystal: false,
};

const SESSION_STATS_KEY = 'blockblast_item_session';

export function loadSessionStats(): ItemSessionStats {
  try {
    const data = localStorage.getItem(SESSION_STATS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return { ...INITIAL_SESSION_STATS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load session stats:', e);
  }
  return INITIAL_SESSION_STATS;
}

export function saveSessionStats(stats: ItemSessionStats): void {
  try {
    localStorage.setItem(SESSION_STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save session stats:', e);
  }
}

// Called when a new game starts
export function startNewGame(stats: ItemSessionStats): ItemSessionStats {
  return {
    ...stats,
    crystalsThisGame: 0,
    starsThisGame: 0,
    currentGameNumber: stats.currentGameNumber + 1,
    gamesSinceLastStar: stats.gamesSinceLastStar + 1,
  };
}

// Called when crystal is collected
export function recordCrystalCollected(stats: ItemSessionStats): ItemSessionStats {
  return {
    ...stats,
    crystalsThisGame: stats.crystalsThisGame + 1,
    crystalsCollectedLast10Games: Math.min(stats.crystalsCollectedLast10Games + 1, 10),
    hasEverCollectedCrystal: true,
  };
}

// Called when star is collected
export function recordStarCollected(stats: ItemSessionStats): ItemSessionStats {
  return {
    ...stats,
    starsThisGame: stats.starsThisGame + 1,
    lastStarGameNumber: stats.currentGameNumber,
    gamesSinceLastStar: 0, // Reset cooldown
  };
}

// Decay function - reset per-game stats when appropriate
export function decaySessionStats(stats: ItemSessionStats): ItemSessionStats {
  if (stats.currentGameNumber % 10 === 0 && stats.crystalsCollectedLast10Games > 0) {
    return {
      ...stats,
      crystalsCollectedLast10Games: Math.max(0, stats.crystalsCollectedLast10Games - 1),
    };
  }
  return stats;
}

// ========================================
// ITEM GRID MANAGEMENT
// ========================================

const GRID_SIZE = 8;

export function createEmptyItemGrid(size: number = 8): ItemGrid {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

export function cloneItemGrid(grid: ItemGrid): ItemGrid {
  return grid.map(row => [...row]);
}

function countActiveItems(grid: ItemGrid, type?: ItemType): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (type ? cell === type : cell !== null) count++;
    }
  }
  return count;
}

// ========================================
// SPAWN ELIGIBILITY
// ========================================

interface SpawnContext {
  score: number;
  combo: number;
  linesCleared: number;
  gridOccupancy: number; // 0-1
  sessionStats: ItemSessionStats;
  lifetimeGames: number;
  lastPlacedX?: number;
  lastPlacedY?: number;
}

// Base spawn chances
const BASE_CHANCES: Record<ItemType, number> = {
  crystal: 0.004,  // 0.4%
  star: 0.0015,    // 0.15% - VERY RARE
};

function isEdgeCell(x: number, y: number, gridSize: number = 8): boolean {
  return x === 0 || y === 0 || x === gridSize - 1 || y === gridSize - 1;
}

function isNearLastPlaced(x: number, y: number, ctx: SpawnContext): boolean {
  if (ctx.lastPlacedX === undefined || ctx.lastPlacedY === undefined) return false;
  const dx = Math.abs(x - ctx.lastPlacedX);
  const dy = Math.abs(y - ctx.lastPlacedY);
  return dx <= 1 && dy <= 1;
}

function isEarlyGame(score: number): boolean {
  return score < 150;
}

// Crystal eligibility - moderate conditions
function isCrystalEligible(ctx: SpawnContext): { eligible: boolean; guaranteed: boolean } {
  // Block early game completely
  if (isEarlyGame(ctx.score)) return { eligible: false, guaranteed: false };
  
  // Block if already got crystal this game
  if (ctx.sessionStats.crystalsThisGame >= 1) return { eligible: false, guaranteed: false };
  
  // GUARANTEED FIRST CRYSTAL: Between lifetime games 30-50
  const isInGuaranteedWindow = ctx.lifetimeGames >= 30 && ctx.lifetimeGames <= 50;
  const neverCollected = !ctx.sessionStats.hasEverCollectedCrystal;
  
  if (isInGuaranteedWindow && neverCollected) {
    return { eligible: true, guaranteed: true };
  }
  
  // Normal rules: Block if already collected crystal in last 10 games
  if (ctx.sessionStats.crystalsCollectedLast10Games >= 1) return { eligible: false, guaranteed: false };
  
  // MUST meet at least one skill condition
  const clearedEnough = ctx.linesCleared >= 3;
  const highCombo = ctx.combo >= 4;
  const gridDanger = ctx.gridOccupancy >= 0.65;
  
  return { eligible: clearedEnough || highCombo || gridDanger, guaranteed: false };
}

// Star eligibility - STRICT conditions for rarity
function isStarEligible(ctx: SpawnContext): boolean {
  // Score minimum of 500
  if (ctx.score < 500) return false;
  
  // Grid must be at least 50% occupied
  if (ctx.gridOccupancy < 0.50) return false;
  
  // No star in last 15 games
  if (ctx.sessionStats.gamesSinceLastStar < 15) return false;
  
  // Max 1 star per game
  if (ctx.sessionStats.starsThisGame >= 1) return false;
  
  return true;
}

// ========================================
// SPAWNING LOGIC
// ========================================

export function trySpawnItem(
  itemGrid: ItemGrid,
  x: number,
  y: number,
  context: SpawnContext
): ItemType | null {
  const gridSize = itemGrid.length;
  
  // NEVER spawn on edges
  if (isEdgeCell(x, y, gridSize)) return null;
  
  // NEVER spawn near last placed piece
  if (isNearLastPlaced(x, y, context)) return null;
  
  // Max 1 item on grid at a time
  if (countActiveItems(itemGrid) >= 1) return null;
  
  // Check debug override first
  const debugItem = localStorage.getItem('debug_force_spawn_item');
  if (debugItem === 'crystal' || debugItem === 'star') {
    return debugItem as ItemType;
  }
  
  // Star first (rarest) - only if eligible
  if (isStarEligible(context)) {
    if (Math.random() < BASE_CHANCES.star) {
      console.log('[Items] ⭐ STAR SPAWN! Ultra rare event!');
      return 'star';
    }
  }
  
  // Crystal second
  const crystalCheck = isCrystalEligible(context);
  if (crystalCheck.eligible) {
    if (crystalCheck.guaranteed) {
      console.log('[Crystal] GUARANTEED first crystal spawned!');
      return 'crystal';
    }
    if (Math.random() < BASE_CHANCES.crystal) {
      console.log('[Items] 💎 Crystal spawn');
      return 'crystal';
    }
  }
  
  return null;
}

// Called when a piece is placed
export function spawnItemsForPiece(
  itemGrid: ItemGrid,
  pieceShape: number[][],
  gridX: number,
  gridY: number,
  ctx: SpawnContext
): ItemGrid {
  const newGrid = cloneItemGrid(itemGrid);
  
  // Already have items this game? Block spawns
  if (ctx.sessionStats.crystalsThisGame >= 1 && ctx.sessionStats.starsThisGame >= 1) {
    return newGrid;
  }
  
  for (let py = 0; py < pieceShape.length; py++) {
    for (let px = 0; px < pieceShape[py].length; px++) {
      if (pieceShape[py][px] !== 0) {
        const x = gridX + px;
        const y = gridY + py;
        
        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
          const item = trySpawnItem(newGrid, x, y, ctx);
          if (item) {
            newGrid[y][x] = item;
            return newGrid; // Only 1 item per piece placement
          }
        }
      }
    }
  }
  
  return newGrid;
}

// ========================================
// COLLECTION
// ========================================

export function collectItemsFromClears(
  itemGrid: ItemGrid,
  clearedRows: number[],
  clearedCols: number[]
): CollectionResult {
  const collected: CollectedItem[] = [];
  const newGrid = cloneItemGrid(itemGrid);
  const gridSize = itemGrid.length;
  
  // Collect from cleared rows
  for (const row of clearedRows) {
    for (let col = 0; col < gridSize; col++) {
      const item = newGrid[row]?.[col];
      if (item) {
        collected.push({ type: item, x: col, y: row });
        newGrid[row][col] = null;
      }
    }
  }
  
  // Collect from cleared columns
  for (const col of clearedCols) {
    for (let row = 0; row < gridSize; row++) {
      const item = newGrid[row]?.[col];
      if (item) {
        // Avoid duplicates
        if (!collected.some(c => c.x === col && c.y === row)) {
          collected.push({ type: item, x: col, y: row });
          newGrid[row][col] = null;
        }
      }
    }
  }
  
  return { collected, newItemGrid: newGrid };
}

// ========================================
// RESOURCE PERSISTENCE
// ========================================

const ITEM_RESOURCES_KEY = 'blockblast_item_resources';

const INITIAL_RESOURCES: ItemResources = {
  crystals: 0,
  stars: 0,
};

export function loadItemResources(): ItemResources {
  try {
    const data = localStorage.getItem(ITEM_RESOURCES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        crystals: parsed.crystals ?? 0,
        stars: parsed.stars ?? 0,
      };
    }
  } catch (e) {
    console.error('Failed to load item resources:', e);
  }
  return INITIAL_RESOURCES;
}

export function saveItemResources(resources: ItemResources): void {
  try {
    localStorage.setItem(ITEM_RESOURCES_KEY, JSON.stringify(resources));
  } catch (e) {
    console.error('Failed to save item resources:', e);
  }
}

export function addCollectedItems(
  resources: ItemResources,
  collected: CollectedItem[]
): ItemResources {
  let { crystals, stars } = resources;
  
  for (const item of collected) {
    if (item.type === 'crystal') crystals++;
    if (item.type === 'star') stars++;
  }
  
  // No cap on stars - they're already super rare
  return { crystals, stars };
}

// ========================================
// CRYSTAL ECONOMY
// ========================================

export const CONTINUE_CRYSTAL_COST = 3;

export function canAffordCrystalContinue(resources: ItemResources): boolean {
  return resources.crystals >= CONTINUE_CRYSTAL_COST;
}

export function spendCrystalsForContinue(resources: ItemResources): ItemResources {
  if (!canAffordCrystalContinue(resources)) {
    throw new Error('Not enough crystals for continue');
  }
  return {
    ...resources,
    crystals: resources.crystals - CONTINUE_CRYSTAL_COST,
  };
}

// ========================================
// STAR ECONOMY
// ========================================

export function canUseStar(resources: ItemResources): boolean {
  return resources.stars >= 1;
}

export function spendStar(resources: ItemResources): ItemResources {
  if (!canUseStar(resources)) return resources;
  return {
    ...resources,
    stars: resources.stars - 1,
  };
}

// ========================================
// CONTINUE ELIGIBILITY (Crystal-based)
// ========================================

export interface ContinueEligibility {
  canUseCrystals: boolean;
  reason?: string;
}

export function checkCrystalContinueEligibility(
  resources: ItemResources,
  score: number,
  gridOccupancy: number,
  continueUsedThisGame: boolean = false
): ContinueEligibility {
  if (continueUsedThisGame) {
    return { canUseCrystals: false, reason: 'Continue already used' };
  }
  
  if (score < 100) {
    return { canUseCrystals: false, reason: 'Score too low' };
  }
  
  if (gridOccupancy < 0.60) {
    return { canUseCrystals: false, reason: 'Grid not full enough' };
  }
  
  if (!canAffordCrystalContinue(resources)) {
    return { canUseCrystals: false, reason: 'Not enough crystals' };
  }
  
  return { canUseCrystals: true };
}

// ========================================
// STAR CONVERGENCE HELPERS
// ========================================

// Find the most common color on the grid
export function findDominantColor(grid: number[][]): number | null {
  const colorCounts: Record<number, number> = {};
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = grid[y][x];
      if (cell !== 0) {
        colorCounts[cell] = (colorCounts[cell] || 0) + 1;
      }
    }
  }
  
  const entries = Object.entries(colorCounts);
  if (entries.length === 0) return null;
  
  // Sort by count descending
  entries.sort((a, b) => b[1] - a[1]);
  return Number(entries[0][0]);
}

// Get all cells of a specific color
export function getCellsOfColor(grid: number[][], colorId: number): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] === colorId) {
        cells.push({ x, y });
      }
    }
  }
  
  return cells;
}

// Apply star convergence to grid - clear all cells of dominant color
export function applyStarConvergence(grid: number[][], cells: { x: number; y: number }[]): number[][] {
  const newGrid = grid.map(row => [...row]);
  
  for (const cell of cells) {
    newGrid[cell.y][cell.x] = 0;
  }
  
  return newGrid;
}

// Calculate star convergence score - FULL BOARD CLEAR bonus
export function calculateStarScore(cellCount: number): number {
  const basePoints = cellCount * 100;
  const multiplier = 3.0; // Higher multiplier for full board clear!
  return Math.floor(basePoints * multiplier);
}

// Get ALL occupied cells on the grid (for full board clear)
export function getAllOccupiedCells(grid: number[][]): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] !== 0) {
        cells.push({ x, y });
      }
    }
  }
  
  return cells;
}
