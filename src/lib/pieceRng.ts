// pieceRng.ts - Intelligent piece generation with assist RNG
import type { Piece, Grid } from './gameEngine';

const GRID = 8;

export type PieceId =
  | "S1" | "S2" | "S3" | "S4" | "S5"
  | "SQ2"
  | "L2" | "L3" | "L4"
  | "T3"
  | "Z3"
  | "J3"
  | "B33";

type Tier = "easy" | "mid" | "hard";

export interface RngState {
  bag: PieceId[];
  lastPicks: PieceId[];
  recentFailures: number; // 0..n - tilt protection
}

export interface GameSignals {
  score: number;
  movesSinceClear: number;
  grid: Grid;
}

export interface GeneratedPiece {
  id: PieceId;
  shape: Piece;
  colorId: number;
}

export interface TrioResult {
  pieces: GeneratedPiece[];
  debug: {
    difficulty01: number;
    danger01: number;
    tierWeights: Record<Tier, number>;
    ensuredFit: boolean;
  };
}

/** ======= PIECE LIBRARY ======= **/
const PIECES: Record<PieceId, Piece> = {
  S1: [[1]],
  S2: [[1,1]],
  S3: [[1,1,1]],
  S4: [[1,1,1,1]],
  S5: [[1,1,1,1,1]],

  SQ2: [[1,1],[1,1]],

  L2: [[1],[1]],
  L3: [[1],[1],[1]],
  L4: [[1],[1],[1],[1]],

  T3: [[1,1,1],[0,1,0]],
  Z3: [[1,1,0],[0,1,1]],
  J3: [[1,0],[1,1]],

  B33: [[1,1,1],[1,1,1],[1,1,1]],
};

// Tier classification
const TIER: Record<PieceId, Tier> = {
  S1: "easy",
  S2: "easy",
  S3: "easy",
  SQ2: "easy",
  L2: "easy",

  S4: "mid",
  L3: "mid",
  T3: "mid",
  Z3: "mid",
  J3: "mid",

  S5: "hard",
  L4: "hard",
  B33: "hard",
};

// Colors (1-8)
const TILE_COLORS = 8;

function getRandomColor(): number {
  return Math.floor(Math.random() * TILE_COLORS) + 1;
}

/** ======= GRID HELPERS ======= **/
function canPlaceRng(grid: Grid, piece: Piece, gx: number, gy: number): boolean {
  for (let y = 0; y < piece.length; y++) {
    for (let x = 0; x < piece[y].length; x++) {
      if (!piece[y][x]) continue;
      const tx = gx + x;
      const ty = gy + y;
      if (tx < 0 || ty < 0 || tx >= GRID || ty >= GRID) return false;
      if (grid[ty][tx] !== 0) return false;
    }
  }
  return true;
}

function anyMoveAvailableRng(grid: Grid, piece: Piece): boolean {
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (canPlaceRng(grid, piece, x, y)) return true;
    }
  }
  return false;
}

function occupancy01(grid: Grid): number {
  let filled = 0;
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (grid[y][x] !== 0) filled++;
    }
  }
  return filled / (GRID * GRID);
}

/** ======= DIFFICULTY MODEL ======= **/
function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

// Score curve: 0..1 (helps early, tightens later)
function scoreDifficulty01(score: number): number {
  if (score <= 300) return 0.15;
  if (score >= 1500) return 0.85;
  return 0.15 + ((score - 300) / (1500 - 300)) * (0.85 - 0.15);
}

function danger01(gridOcc: number, movesSinceClear: number): number {
  const occ = clamp01((gridOcc - 0.45) / 0.45);
  const drought = clamp01(movesSinceClear / 6);
  return clamp01(0.7 * occ + 0.3 * drought);
}

/** ======= BAG SYSTEM (anti-repetition) ======= **/
function refillBag(): PieceId[] {
  const base: PieceId[] = [
    "S1","S2","S3","SQ2","L2",
    "S3","SQ2","S4","L3","T3","Z3","J3",
    "S4","L3","S5","L4","B33",
  ];
  // Shuffle
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  return base;
}

function pickFromBag(state: RngState): PieceId {
  if (!state.bag || state.bag.length === 0) state.bag = refillBag();
  const id = state.bag.pop()!;
  state.lastPicks.push(id);
  if (state.lastPicks.length > 6) state.lastPicks.shift();
  return id;
}

/** ======= WEIGHTED PICK (tier-controlled) ======= **/
function tierWeights(difficulty01: number, danger: number, recentFailures: number): Record<Tier, number> {
  const tiltHelp = clamp01(recentFailures / 4) * 0.25;

  let easy = 0.60 - difficulty01 * 0.45 + tiltHelp;
  let hard = 0.10 + difficulty01 * 0.45 - tiltHelp;
  let mid  = 1 - (easy + hard);

  const dangerHelp = danger * 0.25;
  hard = Math.max(0.05, hard - dangerHelp);
  easy = Math.min(0.80, easy + dangerHelp * 0.6);
  mid  = Math.max(0.10, 1 - (easy + hard));

  const sum = easy + mid + hard;
  return { easy: easy/sum, mid: mid/sum, hard: hard/sum };
}

function chooseTier(weights: Record<Tier, number>): Tier {
  const r = Math.random();
  if (r < weights.easy) return "easy";
  if (r < weights.easy + weights.mid) return "mid";
  return "hard";
}

function pickPieceIdByTier(state: RngState, tier: Tier): PieceId {
  for (let tries = 0; tries < 6; tries++) {
    const id = pickFromBag(state);
    if (TIER[id] === tier) return id;
  }
  return pickFromBag(state);
}

/** ======= FIT ENSURE (anti-unfair death) ======= **/
function bestFittingPieceId(grid: Grid, candidates: PieceId[]): PieceId | null {
  for (const id of candidates) {
    if (anyMoveAvailableRng(grid, PIECES[id])) return id;
  }
  return null;
}

function randomCandidatesByTier(tier: Tier): PieceId[] {
  const ids = (Object.keys(PIECES) as PieceId[]).filter(id => TIER[id] === tier);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

/** ======= MAIN API: generate 3 pieces ======= **/
export function generateTrio(signals: GameSignals, state: RngState): TrioResult {
  const occ = occupancy01(signals.grid);
  const baseDiff = scoreDifficulty01(signals.score);
  const dangerLevel = danger01(occ, signals.movesSinceClear);

  const difficulty01 = clamp01(baseDiff + (dangerLevel * 0.10));
  const weights = tierWeights(difficulty01, dangerLevel, state.recentFailures);

  // 1) Generate 3 piece IDs by tier
  const ids: PieceId[] = [];
  for (let i = 0; i < 3; i++) {
    const tier = chooseTier(weights);
    let id = pickPieceIdByTier(state, tier);

    // Anti-repetition: avoid same piece too often
    if (state.lastPicks.filter(x => x === id).length >= 2) {
      const alt = randomCandidatesByTier(tier).find(a => a !== id);
      if (alt) id = alt;
    }
    ids.push(id);
  }

  // 2) Fairness rule: at least 1 must fit
  let ensuredFit = false;
  const fits = ids.map(id => anyMoveAvailableRng(signals.grid, PIECES[id]));
  if (!fits.some(Boolean)) {
    const targetTier: Tier = dangerLevel > 0.55 ? "easy" : "mid";
    const candidates = randomCandidatesByTier(targetTier);
    const fitId = bestFittingPieceId(signals.grid, candidates);
    if (fitId) {
      ids[0] = fitId;
      ensuredFit = true;
    } else {
      const all = Object.keys(PIECES) as PieceId[];
      const anyFit = bestFittingPieceId(signals.grid, all);
      if (anyFit) {
        ids[0] = anyFit;
        ensuredFit = true;
      }
    }
  }

  // 3) Build final pieces with colors
  const pieces = ids.map(id => ({
    id,
    shape: PIECES[id],
    colorId: getRandomColor(),
  }));

  return {
    pieces,
    debug: {
      difficulty01,
      danger01: dangerLevel,
      tierWeights: weights,
      ensuredFit,
    },
  };
}

/** ======= STATE HELPERS ======= **/
export function createInitialRngState(): RngState {
  return {
    bag: [],
    lastPicks: [],
    recentFailures: 0,
  };
}

export function onGameOver(state: RngState): void {
  state.recentFailures = Math.min(state.recentFailures + 1, 6);
}

export function onGoodRun(state: RngState, score: number): void {
  if (score > 1000) {
    state.recentFailures = Math.max(state.recentFailures - 1, 0);
  }
}

export function getPieceShape(id: PieceId): Piece {
  return PIECES[id];
}
