// clusterEngine.ts - Sistema de combo por massa de cor conectada
import { Grid, GRID_SIZE, ColorId, cloneGrid, validateGrid, Piece } from './gameEngine';

// ============= CONFIGURAÇÃO =============
export const MIN_CLUSTER_SIZE_FOR_CLEAR = 8;  // Tamanho mínimo para limpeza automática
const POINTS_PER_CLUSTER_BLOCK = 10;           // Pontos base por bloco limpo
const POINTS_PER_ABSORBED_BLOCK = 5;           // Pontos por bloco que mudou de cor
const FUSION_BONUS = 20;                       // Bônus por fusão de clusters

// ============= TIPOS =============
export interface ClusterInfo {
  color: ColorId;
  cells: { x: number; y: number }[];
  size: number;
}

export interface ClusterPlacementResult {
  grid: Grid;
  placedCells: { x: number; y: number }[];
  absorbedCells: { x: number; y: number; oldColor: ColorId; newColor: ColorId }[];
  clearedClusters: ClusterInfo[];
  clusterComboAfter: number;
  pointsGained: number;
  hadFusion: boolean;
  hadAbsorption: boolean;
  hadClear: boolean;
}

// ============= ALGORITMO FLOOD FILL =============
/**
 * Encontra um cluster a partir de uma célula usando flood fill
 */
function floodFillCluster(
  grid: Grid,
  startX: number,
  startY: number,
  visited: boolean[][]
): ClusterInfo | null {
  const color = grid[startY][startX];
  if (color === 0 || visited[startY][startX]) return null;

  const cells: { x: number; y: number }[] = [];
  const stack: { x: number; y: number }[] = [{ x: startX, y: startY }];

  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) continue;
    if (visited[y][x]) continue;
    if (grid[y][x] !== color) continue;

    visited[y][x] = true;
    cells.push({ x, y });

    // 4 direções ortogonais
    stack.push({ x: x + 1, y });
    stack.push({ x: x - 1, y });
    stack.push({ x, y: y + 1 });
    stack.push({ x, y: y - 1 });
  }

  return {
    color,
    cells,
    size: cells.length,
  };
}

/**
 * Encontra todos os clusters no grid
 */
export function findAllClusters(grid: Grid): ClusterInfo[] {
  const visited: boolean[][] = Array.from({ length: GRID_SIZE }, () => 
    Array(GRID_SIZE).fill(false)
  );
  const clusters: ClusterInfo[] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] !== 0 && !visited[y][x]) {
        const cluster = floodFillCluster(grid, x, y, visited);
        if (cluster) clusters.push(cluster);
      }
    }
  }

  return clusters;
}

/**
 * Encontra clusters adjacentes a um conjunto de células
 */
function findAdjacentClusters(
  grid: Grid,
  cells: { x: number; y: number }[]
): Map<ColorId, ClusterInfo> {
  const visited: boolean[][] = Array.from({ length: GRID_SIZE }, () => 
    Array(GRID_SIZE).fill(false)
  );
  
  // Marcar células colocadas como visitadas (não fazem parte de clusters adjacentes)
  for (const { x, y } of cells) {
    visited[y][x] = true;
  }

  const adjacentClusters = new Map<ColorId, ClusterInfo>();
  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  for (const { x, y } of cells) {
    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
      if (visited[ny][nx]) continue;
      if (grid[ny][nx] === 0) continue;

      const cluster = floodFillCluster(grid, nx, ny, visited);
      if (cluster) {
        // Se já existe um cluster dessa cor, manter o maior
        const existing = adjacentClusters.get(cluster.color);
        if (!existing || cluster.size > existing.size) {
          adjacentClusters.set(cluster.color, cluster);
        }
      }
    }
  }

  return adjacentClusters;
}

/**
 * Determina a cor dominante (maior cluster adjacente)
 */
function getDominantColor(adjacentClusters: Map<ColorId, ClusterInfo>): ColorId | null {
  let dominantColor: ColorId | null = null;
  let maxSize = 0;

  for (const [color, cluster] of adjacentClusters) {
    if (cluster.size > maxSize) {
      maxSize = cluster.size;
      dominantColor = color;
    }
  }

  return dominantColor;
}

/**
 * Aplica absorção de cor - converte blocos colocados para a cor dominante
 */
function applyColorAbsorption(
  grid: Grid,
  placedCells: { x: number; y: number }[],
  dominantColor: ColorId
): { x: number; y: number; oldColor: ColorId; newColor: ColorId }[] {
  const absorbedCells: { x: number; y: number; oldColor: ColorId; newColor: ColorId }[] = [];

  for (const { x, y } of placedCells) {
    const oldColor = grid[y][x];
    if (oldColor !== dominantColor && oldColor !== 0) {
      absorbedCells.push({ x, y, oldColor, newColor: dominantColor });
      grid[y][x] = dominantColor;
    }
  }

  return absorbedCells;
}

/**
 * Encontra clusters que atingiram o tamanho mínimo para limpeza
 */
function findClustersToClean(grid: Grid): ClusterInfo[] {
  const clusters = findAllClusters(grid);
  return clusters.filter(c => c.size >= MIN_CLUSTER_SIZE_FOR_CLEAR);
}

/**
 * Remove um cluster do grid
 */
function clearCluster(grid: Grid, cluster: ClusterInfo): void {
  for (const { x, y } of cluster.cells) {
    grid[y][x] = 0;
  }
}

/**
 * Calcula multiplicador de combo (infinito, escalando suavemente)
 */
function getClusterComboMultiplier(combo: number): number {
  // Combo infinito: escala até 20, depois mais suave
  return 1 + Math.min(combo, 20) * 0.1 + Math.max(0, combo - 20) * 0.05;
}

/**
 * Verifica se houve fusão de clusters (duas massas da mesma cor se uniram)
 */
function checkForFusion(
  gridBefore: Grid,
  gridAfter: Grid,
  placedCells: { x: number; y: number }[]
): boolean {
  // Contar clusters antes (sem as células colocadas)
  const clustersBefore = findAllClusters(gridBefore);
  
  // Contar clusters depois
  const clustersAfter = findAllClusters(gridAfter);
  
  // Se a colocação conectou clusters da mesma cor, o número diminuiu
  // Isso é uma simplificação - fusão acontece quando clusters se unem
  
  // Verificar se algum cluster depois é maior que a soma das células colocadas
  // + o maior cluster adjacente da mesma cor antes
  for (const cellPos of placedCells) {
    const colorAfter = gridAfter[cellPos.y][cellPos.x];
    if (colorAfter === 0) continue;
    
    // Encontrar o cluster que contém esta célula depois
    const clusterContainingCell = clustersAfter.find(c => 
      c.cells.some(cell => cell.x === cellPos.x && cell.y === cellPos.y)
    );
    
    if (clusterContainingCell && clusterContainingCell.size > placedCells.length + 1) {
      // O cluster é maior que apenas as células colocadas - houve fusão
      return true;
    }
  }
  
  return false;
}

// ============= FUNÇÃO PRINCIPAL =============
/**
 * Coloca uma peça no grid aplicando o sistema de clusters
 * 
 * Fluxo:
 * 1. Colocar peça no grid
 * 2. Encontrar clusters adjacentes
 * 3. Aplicar absorção de cor (converter para cor dominante)
 * 4. Verificar fusões
 * 5. Verificar clusters para limpeza
 * 6. Calcular pontuação e combo
 */
export function placePieceWithClusters(
  grid: Grid,
  piece: Piece,
  x: number,
  y: number,
  colorId: ColorId,
  currentClusterCombo: number
): ClusterPlacementResult {
  const workingGrid = cloneGrid(grid);
  const gridBeforePlacement = cloneGrid(grid);
  
  // 1. Colocar peça no grid
  const placedCells: { x: number; y: number }[] = [];
  for (let py = 0; py < piece.length; py++) {
    for (let px = 0; px < piece[py].length; px++) {
      if (!piece[py][px]) continue;
      const gx = x + px;
      const gy = y + py;
      workingGrid[gy][gx] = colorId;
      placedCells.push({ x: gx, y: gy });
    }
  }

  // 2. Encontrar clusters adjacentes (antes de absorção)
  const adjacentClusters = findAdjacentClusters(gridBeforePlacement, placedCells);
  
  // 3. Determinar cor dominante e aplicar absorção
  const dominantColor = getDominantColor(adjacentClusters);
  let absorbedCells: { x: number; y: number; oldColor: ColorId; newColor: ColorId }[] = [];
  
  if (dominantColor !== null && dominantColor !== colorId) {
    absorbedCells = applyColorAbsorption(workingGrid, placedCells, dominantColor);
  }

  // 4. Verificar fusão
  const hadFusion = checkForFusion(gridBeforePlacement, workingGrid, placedCells);

  // 5. Verificar clusters para limpeza (loop para cascatas)
  const clearedClusters: ClusterInfo[] = [];
  let keepClearing = true;
  
  while (keepClearing) {
    const clustersToClean = findClustersToClean(workingGrid);
    if (clustersToClean.length === 0) {
      keepClearing = false;
    } else {
      for (const cluster of clustersToClean) {
        clearedClusters.push({ ...cluster, cells: [...cluster.cells] });
        clearCluster(workingGrid, cluster);
      }
    }
  }

  // 6. Calcular combo
  let clusterComboAfter = currentClusterCombo;
  const hadAbsorption = absorbedCells.length > 0;
  const hadClear = clearedClusters.length > 0;
  
  // Combo aumenta se: houve limpeza OU fusão
  if (hadClear) {
    clusterComboAfter += clearedClusters.length;
  } else if (hadFusion) {
    clusterComboAfter += 1;
  } else if (!hadAbsorption) {
    // Sem absorção, sem fusão, sem clear = combo reseta
    clusterComboAfter = 0;
  }
  // Se houve apenas absorção, combo mantém (não reseta, não aumenta)

  // 7. Calcular pontuação
  let pointsGained = 0;
  
  // Pontos por blocos colocados
  pointsGained += placedCells.length * 2;
  
  // Pontos por absorção
  pointsGained += absorbedCells.length * POINTS_PER_ABSORBED_BLOCK;
  
  // Pontos por fusão
  if (hadFusion) {
    pointsGained += FUSION_BONUS;
  }
  
  // Pontos por clusters limpos (com multiplicador de combo)
  const comboMultiplier = getClusterComboMultiplier(clusterComboAfter);
  for (const cluster of clearedClusters) {
    pointsGained += Math.round(cluster.size * POINTS_PER_CLUSTER_BLOCK * comboMultiplier);
  }

  // Validar grid final
  validateGrid(workingGrid);

  return {
    grid: workingGrid,
    placedCells,
    absorbedCells,
    clearedClusters,
    clusterComboAfter,
    pointsGained,
    hadFusion,
    hadAbsorption,
    hadClear,
  };
}

/**
 * Retorna células que seriam limpas se a peça fosse colocada
 * (para preview visual)
 */
export function previewClusterClear(
  grid: Grid,
  piece: Piece,
  x: number,
  y: number,
  colorId: ColorId
): { x: number; y: number }[] {
  const workingGrid = cloneGrid(grid);
  
  // Colocar peça
  const placedCells: { x: number; y: number }[] = [];
  for (let py = 0; py < piece.length; py++) {
    for (let px = 0; px < piece[py].length; px++) {
      if (!piece[py][px]) continue;
      const gx = x + px;
      const gy = y + py;
      if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
        workingGrid[gy][gx] = colorId;
        placedCells.push({ x: gx, y: gy });
      }
    }
  }

  // Aplicar absorção
  const adjacentClusters = findAdjacentClusters(grid, placedCells);
  const dominantColor = getDominantColor(adjacentClusters);
  if (dominantColor !== null) {
    applyColorAbsorption(workingGrid, placedCells, dominantColor);
  }

  // Encontrar clusters que seriam limpos
  const clustersToClean = findClustersToClean(workingGrid);
  const cellsToClean: { x: number; y: number }[] = [];
  
  for (const cluster of clustersToClean) {
    cellsToClean.push(...cluster.cells);
  }

  return cellsToClean;
}
