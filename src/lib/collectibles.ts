// collectibles.ts - Collectible items system (Crystal, Ice)

export type ItemType = 'crystal' | 'ice';

// Spawn chances per block (as fraction)
export const ITEM_SPAWN_CHANCES: Record<ItemType, number> = {
  crystal: 0.04, // 4%
  ice: 0.02,     // 2%
};

// Item grid - tracks which cells have items (separate from game grid)
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

// ========== GRID MANAGEMENT ==========

export function createEmptyItemGrid(size: number = 8): ItemGrid {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

export function cloneItemGrid(grid: ItemGrid): ItemGrid {
  return grid.map(row => [...row]);
}

// Count active items on grid
function countActiveItems(grid: ItemGrid): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== null) count++;
    }
  }
  return count;
}

// Count items in a specific row
function countItemsInRow(grid: ItemGrid, row: number): number {
  return grid[row].filter(cell => cell !== null).length;
}

// ========== SPAWN LOGIC ==========

interface SpawnContext {
  gridOccupancy: number; // 0-1
  isTilt: boolean;       // Player struggling
}

/**
 * Try to spawn an item on a newly placed block
 * Returns the item type to spawn, or null
 */
export function trySpawnItem(
  itemGrid: ItemGrid,
  x: number,
  y: number,
  context: SpawnContext
): ItemType | null {
  // Safety rules
  const activeItems = countActiveItems(itemGrid);
  if (activeItems >= 3) return null; // Max 3 items on grid
  
  if (countItemsInRow(itemGrid, y) >= 1) return null; // Max 1 item per row
  
  // Adjust chances based on context
  let chanceMultiplier = 1.0;
  if (context.gridOccupancy > 0.7) {
    chanceMultiplier = 0.5; // Half chance when grid is crowded
  }
  if (context.isTilt) {
    chanceMultiplier *= 1.3; // +30% when struggling
  }
  
  // Roll for each item type (crystal first, then ice)
  const roll = Math.random();
  const crystalChance = ITEM_SPAWN_CHANCES.crystal * chanceMultiplier;
  const iceChance = ITEM_SPAWN_CHANCES.ice * chanceMultiplier;
  
  if (roll < crystalChance) {
    return 'crystal';
  } else if (roll < crystalChance + iceChance) {
    return 'ice';
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
  
  for (let py = 0; py < piece.length; py++) {
    for (let px = 0; px < piece[py].length; px++) {
      if (!piece[py][px]) continue;
      
      const x = startX + px;
      const y = startY + py;
      
      // Only spawn if cell is valid and empty in item grid
      if (y >= 0 && y < newGrid.length && x >= 0 && x < newGrid[0].length) {
        if (newGrid[y][x] === null) {
          const item = trySpawnItem(newGrid, x, y, context);
          if (item) {
            newGrid[y][x] = item;
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
 * Items are ALWAYS collected when their cell is cleared
 */
export function collectItemsFromClears(
  itemGrid: ItemGrid,
  clearedRows: number[],
  clearedCols: number[]
): CollectionResult {
  const newGrid = cloneItemGrid(itemGrid);
  const collected: CollectedItem[] = [];
  const gridSize = itemGrid.length;
  
  // Collect from cleared rows
  for (const row of clearedRows) {
    for (let col = 0; col < gridSize; col++) {
      const item = newGrid[row][col];
      if (item !== null) {
        collected.push({ type: item, x: col, y: row });
        newGrid[row][col] = null;
      }
    }
  }
  
  // Collect from cleared columns
  for (const col of clearedCols) {
    for (let row = 0; row < gridSize; row++) {
      const item = newGrid[row][col];
      if (item !== null) {
        // Avoid duplicates (if row was also cleared)
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
        ice: parsed.ice ?? 0,
      };
    }
  } catch (e) {
    console.error('Failed to load item resources:', e);
  }
  return { crystals: 0, ice: 0 };
}

export function saveItemResources(resources: ItemResources): void {
  try {
    localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(resources));
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
    if (item.type === 'ice') ice++;
  }
  
  return { crystals, ice };
}

// ========== ECONOMY - SPENDING ==========

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

// ========== VISUAL HELPERS ==========

export const ITEM_EMOJI: Record<ItemType, string> = {
  crystal: '💎',
  ice: '❄️',
};
