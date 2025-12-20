/**
 * @quantaris/engine - State Management
 *
 * Functions for creating and managing game state.
 */

import type { GameState, Quantar, Core, PlayerId, Position } from "./types.js";
import { CORE_HP, QUANTAR_HP, GamePhase } from "./types.js";

/**
 * Initial placement from whitepaper:
 *
 *       x: 0  1  2  3  4  5  6  7  8
 * y=0    .  .  .  .  BC .  .  .  .
 * y=1    .  .  .  .  .  .  .  .  .
 * y=2    .  .  .  B1 B2 B3 .  .  .
 * y=3    .  .  .  .  .  .  .  .  .
 * y=4    .  .  .  .  .  .  .  .  .
 * y=5    .  .  .  .  .  .  .  .  .
 * y=6    .  .  .  A1 A2 A3 .  .  .
 * y=7    .  .  .  .  .  .  .  .  .
 * y=8    .  .  .  .  AC .  .  .  .
 */

const INITIAL_POSITIONS = {
  cores: {
    A: { x: 4, y: 8 } as Position,
    B: { x: 4, y: 0 } as Position,
  },
  quantars: {
    A: [
      { x: 3, y: 6 },
      { x: 4, y: 6 },
      { x: 5, y: 6 },
    ] as Position[],
    B: [
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 5, y: 2 },
    ] as Position[],
  },
} as const;

/**
 * Create a new Quantar entity
 */
function createQuantar(
  owner: PlayerId,
  index: number,
  position: Position
): Quantar {
  return {
    id: `${owner}${index + 1}`, // A1, A2, A3, B1, B2, B3
    owner,
    position: { ...position },
    hp: QUANTAR_HP,
  };
}

/**
 * Create a new Core entity
 */
function createCore(owner: PlayerId, position: Position): Core {
  return {
    owner,
    position: { ...position },
    hp: CORE_HP,
  };
}

/**
 * Create the initial game state
 *
 * @returns A fresh GameState ready for turn 1
 */
export function createInitialState(): GameState {
  const quantarsA = INITIAL_POSITIONS.quantars.A.map((pos, i) =>
    createQuantar("A", i, pos)
  );
  const quantarsB = INITIAL_POSITIONS.quantars.B.map((pos, i) =>
    createQuantar("B", i, pos)
  );

  return {
    turn: 1,
    phase: GamePhase.Playing,
    quantars: [...quantarsA, ...quantarsB],
    cores: {
      A: createCore("A", INITIAL_POSITIONS.cores.A),
      B: createCore("B", INITIAL_POSITIONS.cores.B),
    },
    winner: null,
  };
}

/**
 * Get a Quantar by ID from game state
 */
export function getQuantar(state: GameState, id: string): Quantar | undefined {
  return state.quantars.find((q) => q.id === id);
}

/**
 * Get all Quantars owned by a player
 */
export function getPlayerQuantars(
  state: GameState,
  playerId: PlayerId
): readonly Quantar[] {
  return state.quantars.filter((q) => q.owner === playerId);
}

/**
 * Get the Core for a player
 */
export function getPlayerCore(state: GameState, playerId: PlayerId): Core {
  return state.cores[playerId];
}

/**
 * Check if a position is within board bounds
 */
export function isInBounds(position: Position): boolean {
  return position.x >= 0 && position.x < 9 && position.y >= 0 && position.y < 9;
}

/**
 * Check if two positions are equal
 */
export function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Get entity at a position (Quantar, Core, or null)
 */
export function getEntityAt(
  state: GameState,
  position: Position
): { type: "quantar"; entity: Quantar } | { type: "core"; entity: Core } | null {
  // Check Quantars
  const quantar = state.quantars.find((q) =>
    positionsEqual(q.position, position)
  );
  if (quantar) {
    return { type: "quantar", entity: quantar };
  }

  // Check Cores
  if (positionsEqual(state.cores.A.position, position)) {
    return { type: "core", entity: state.cores.A };
  }
  if (positionsEqual(state.cores.B.position, position)) {
    return { type: "core", entity: state.cores.B };
  }

  return null;
}

/**
 * Get the opponent's player ID
 */
export function getOpponent(playerId: PlayerId): PlayerId {
  return playerId === "A" ? "B" : "A";
}

