// collectibles.ts - STRICT Collectible items system (Crystal, Ice)
// MASTER RULE: Items reduce frustration, NOT replace skill

export type ItemType = 'crystal' | 'ice';

// EXTREMELY RARE base chances per ELIGIBLE event
const BASE_CHANCES: Record<ItemType, number> = {
  crystal: 0.004, // 0.4% - 1 per ~250 eligible events
  ice: 0.002,     // 0.2% - 1 per ~500 eligible events
};

// Item grid - tracks which cells have items
export type ItemGrid = (ItemType | null)[][];

export interface CollectedItem {
  type: ItemType;
  x: number;
  y: number;
}

export interface CollectionResult {
  collected: CollectedItem[];
  newItemGrid: ItemGrid;
}

export interface ItemResources {
  crystals: number;
  ice: number;
}

// Session tracking for drop limits
export interface ItemSessionStats {
  crystalsCollectedLast10Games: number;
  lastFreezeGameNumber: number;
  currentGameNumber: number;
  crystalsThisGame: number;
  iceThisGame: number;
  hasEverCollectedCrystal: boolean; // For guaranteed first crystal
}

const SESSION_STATS_KEY = 'blockblast_item_session';

// ========== SESSION TRACKING ==========

export function loadSessionStats(): ItemSessionStats {
  try {
    const saved = localStorage.getItem(SESSION_STATS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load session stats:', e);
  }
  return {
    crystalsCollectedLast10Games: 0,
    lastFreezeGameNumber: -999,
    currentGameNumber: 0,
    crystalsThisGame: 0,
    iceThisGame: 0,
    hasEverCollectedCrystal: false,
  };
}

export function saveSessionStats(stats: ItemSessionStats): void {
  try {
    localStorage.setItem(SESSION_STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save session stats:', e);
  }
}

export function startNewGame(stats: ItemSessionStats): ItemSessionStats {
  return {
    ...stats,
    currentGameNumber: stats.currentGameNumber + 1,
    crystalsThisGame: 0,
    iceThisGame: 0,
  };
}

export function recordCrystalCollected(stats: ItemSessionStats): ItemSessionStats {
  return {
    ...stats,
    crystalsCollectedLast10Games: Math.min(stats.crystalsCollectedLast10Games + 1, 10),
    crystalsThisGame: stats.crystalsThisGame + 1,
    hasEverCollectedCrystal: true,
  };
}

export function recordIceCollected(stats: ItemSessionStats): ItemSessionStats {
  return {
    ...stats,
    lastFreezeGameNumber: stats.currentGameNumber,
    iceThisGame: stats.iceThisGame + 1,
  };
}

// Decay crystal count every 10 games
export function decaySessionStats(stats: ItemSessionStats): ItemSessionStats {
  if (stats.currentGameNumber % 10 === 0 && stats.crystalsCollectedLast10Games > 0) {
    return {
      ...stats,
      crystalsCollectedLast10Games: Math.max(0, stats.crystalsCollectedLast10Games - 1),
    };
  }
  return stats;
}

// ========== GRID MANAGEMENT ==========

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

// ========== ELIGIBILITY CHECKS (STRICT) ==========

interface SpawnContext {
  score: number;
  combo: number;
  linesCleared: number;        // Lines cleared THIS action
  gridOccupancy: number;       // 0-1
  sessionStats: ItemSessionStats;
  lifetimeGames: number;       // Total games played for guaranteed first crystal
  lastPlacedX?: number;
  lastPlacedY?: number;
}

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

/**
 * 💎 CRYSTAL ELIGIBILITY - EXTREMELY STRICT
 * With GUARANTEED first crystal between games 30-50
 */
function isCrystalEligible(ctx: SpawnContext): { eligible: boolean; guaranteed: boolean } {
  // Block early game completely
  if (isEarlyGame(ctx.score)) return { eligible: false, guaranteed: false };
  
  // Block if already got crystal this game
  if (ctx.sessionStats.crystalsThisGame >= 1) return { eligible: false, guaranteed: false };
  
  // GUARANTEED FIRST CRYSTAL: Between lifetime games 30-50
  const isInGuaranteedWindow = ctx.lifetimeGames >= 30 && ctx.lifetimeGames <= 50;
  const neverCollected = !ctx.sessionStats.hasEverCollectedCrystal;
  
  if (isInGuaranteedWindow && neverCollected) {
    // Skip normal restrictions - guaranteed to spawn!
    return { eligible: true, guaranteed: true };
  }
  
  // Normal rules: Block if already collected crystal in last 10 games
  if (ctx.sessionStats.crystalsCollectedLast10Games >= 1) return { eligible: false, guaranteed: false };
  
  // MUST meet at least one skill condition:
  const clearedEnough = ctx.linesCleared >= 3;
  const highCombo = ctx.combo >= 4;
  const gridDanger = ctx.gridOccupancy >= 0.65;
  
  return { eligible: clearedEnough || highCombo || gridDanger, guaranteed: false };
}

/**
 * ❄️ ICE ELIGIBILITY - EVEN MORE STRICT
 */
function isIceEligible(ctx: SpawnContext): boolean {
  // Block early game completely
  if (isEarlyGame(ctx.score)) return false;
  
  // Block if already got ice this game
  if (ctx.sessionStats.iceThisGame >= 1) return false;
  
  // Block if collected freeze in last 3 games
  const gamesSinceLastFreeze = ctx.sessionStats.currentGameNumber - ctx.sessionStats.lastFreezeGameNumber;
  if (gamesSinceLastFreeze < 3) return false;
  
  // MUST meet ALL conditions (very strict):
  const highCombo = ctx.combo >= 5;
  const gridDanger = ctx.gridOccupancy >= 0.70;
  
  return highCombo && gridDanger;
}

// ========== SPAWN LOGIC (SEVERE) ==========

/**
 * Try to spawn an item - STRICT FILTERS
 * Returns the item type to spawn, or null
 */
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
  
  // Try Crystal first (if eligible)
  const crystalCheck = isCrystalEligible(context);
  if (crystalCheck.eligible) {
    if (crystalCheck.guaranteed) {
      // 100% spawn for guaranteed first crystal!
      console.log('[Crystal] GUARANTEED first crystal spawned!');
      return 'crystal';
    }
    const roll = Math.random();
    if (roll < BASE_CHANCES.crystal) {
      return 'crystal';
    }
  }
  
  // Try Ice (if eligible)
  if (isIceEligible(context)) {
    const roll = Math.random();
    if (roll < BASE_CHANCES.ice) {
      return 'ice';
    }
  }
  
  return null;
}

/**
 * Spawn items for placed piece blocks
 * Returns updated item grid
 */
export function spawnItemsForPiece(
  itemGrid: ItemGrid,
  piece: number[][],
  startX: number,
  startY: number,
  context: SpawnContext
): ItemGrid {
  const newGrid = cloneItemGrid(itemGrid);
  
  // Already have an item this game? Block all spawns
  if (context.sessionStats.crystalsThisGame >= 1 && context.sessionStats.iceThisGame >= 1) {
    return newGrid;
  }
  
  for (let py = 0; py < piece.length; py++) {
    for (let px = 0; px < piece[py].length; px++) {
      if (!piece[py][px]) continue;
      
      const x = startX + px;
      const y = startY + py;
      
      if (y >= 0 && y < newGrid.length && x >= 0 && x < newGrid[0].length) {
        if (newGrid[y][x] === null) {
          const item = trySpawnItem(newGrid, x, y, context);
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

// ========== COLLECTION LOGIC ==========

/**
 * Collect items from cleared rows and columns
 */
export function collectItemsFromClears(
  itemGrid: ItemGrid,
  clearedRows: number[],
  clearedCols: number[]
): CollectionResult {
  const newGrid = cloneItemGrid(itemGrid);
  const collected: CollectedItem[] = [];
  const gridSize = itemGrid.length;
  
  for (const row of clearedRows) {
    for (let col = 0; col < gridSize; col++) {
      const item = newGrid[row][col];
      if (item !== null) {
        collected.push({ type: item, x: col, y: row });
        newGrid[row][col] = null;
      }
    }
  }
  
  for (const col of clearedCols) {
    for (let row = 0; row < gridSize; row++) {
      const item = newGrid[row][col];
      if (item !== null) {
        if (!collected.some(c => c.x === col && c.y === row)) {
          collected.push({ type: item, x: col, y: row });
        }
        newGrid[row][col] = null;
      }
    }
  }
  
  return { collected, newItemGrid: newGrid };
}

// ========== PERSISTENCE ==========

const ITEMS_STORAGE_KEY = 'blockblast_item_resources';

export function loadItemResources(): ItemResources {
  try {
    const saved = localStorage.getItem(ITEMS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        crystals: parsed.crystals ?? 0,
        ice: Math.min(parsed.ice ?? 0, 2), // Max 2 stored
      };
    }
  } catch (e) {
    console.error('Failed to load item resources:', e);
  }
  return { crystals: 0, ice: 0 };
}

export function saveItemResources(resources: ItemResources): void {
  try {
    // Enforce max ice storage
    const capped = {
      ...resources,
      ice: Math.min(resources.ice, 2),
    };
    localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(capped));
  } catch (e) {
    console.error('Failed to save item resources:', e);
  }
}

export function addCollectedItems(
  resources: ItemResources,
  collected: CollectedItem[]
): ItemResources {
  let crystals = resources.crystals;
  let ice = resources.ice;
  
  for (const item of collected) {
    if (item.type === 'crystal') crystals++;
    if (item.type === 'ice') ice = Math.min(ice + 1, 2); // Max 2 stored
  }
  
  return { crystals, ice };
}

// ========== ECONOMY - SPENDING ==========

// 💎 Continue costs 3 crystals
export const CONTINUE_CRYSTAL_COST = 3;

// 💎 Re-roll costs 2 crystals (max 1 per game)
export const REROLL_CRYSTAL_COST = 2;

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

export function canAffordReroll(resources: ItemResources): boolean {
  return resources.crystals >= REROLL_CRYSTAL_COST;
}

export function spendCrystalsForReroll(resources: ItemResources): ItemResources {
  if (!canAffordReroll(resources)) {
    throw new Error('Not enough crystals for reroll');
  }
  return {
    ...resources,
    crystals: resources.crystals - REROLL_CRYSTAL_COST,
  };
}

// ❄️ Freeze: preserves combo for 3 moves
export const FREEZE_COST = 1;
export const FREEZE_DURATION = 3;

export function canAffordFreeze(resources: ItemResources): boolean {
  return resources.ice >= FREEZE_COST;
}

export function spendIceForFreeze(resources: ItemResources): ItemResources {
  if (!canAffordFreeze(resources)) {
    throw new Error('Not enough ice for freeze');
  }
  return {
    ...resources,
    ice: resources.ice - FREEZE_COST,
  };
}

// ========== CONTINUE ELIGIBILITY (STRICT) ==========

export interface ContinueEligibility {
  canUseCrystals: boolean;
  reason?: string;
}

export function checkCrystalContinueEligibility(
  resources: ItemResources,
  score: number,
  gridOccupancy: number,
  continueUsedThisGame: boolean
): ContinueEligibility {
  // Already used continue this game
  if (continueUsedThisGame) {
    return { canUseCrystals: false, reason: 'Continue already used' };
  }
  
  // Score too low
  if (score < 100) {
    return { canUseCrystals: false, reason: 'Score too low' };
  }
  
  // Grid not dangerous enough
  if (gridOccupancy < 0.60) {
    return { canUseCrystals: false, reason: 'Grid not full enough' };
  }
  
  // Not enough crystals
  if (!canAffordCrystalContinue(resources)) {
    return { canUseCrystals: false, reason: 'Not enough crystals' };
  }
  
  return { canUseCrystals: true };
}

// ========== VISUAL HELPERS ==========

export const ITEM_EMOJI: Record<ItemType, string> = {
  crystal: '💎',
  ice: '❄️',
};
