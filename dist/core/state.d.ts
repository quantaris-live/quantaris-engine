/**
 * @quantaris/engine - State Management
 *
 * Functions for creating and managing game state.
 */
import type { GameState, Quantar, Core, PlayerId, Position } from "./types.js";
/**
 * Create the initial game state
 *
 * @returns A fresh GameState ready for turn 1
 */
export declare function createInitialState(): GameState;
/**
 * Get a Quantar by ID from game state
 */
export declare function getQuantar(state: GameState, id: string): Quantar | undefined;
/**
 * Get all Quantars owned by a player
 */
export declare function getPlayerQuantars(state: GameState, playerId: PlayerId): readonly Quantar[];
/**
 * Get the Core for a player
 */
export declare function getPlayerCore(state: GameState, playerId: PlayerId): Core;
/**
 * Check if a position is within board bounds
 */
export declare function isInBounds(position: Position): boolean;
/**
 * Check if two positions are equal
 */
export declare function positionsEqual(a: Position, b: Position): boolean;
/**
 * Get entity at a position (Quantar, Core, or null)
 */
export declare function getEntityAt(state: GameState, position: Position): {
    type: "quantar";
    entity: Quantar;
} | {
    type: "core";
    entity: Core;
} | null;
/**
 * Get the opponent's player ID
 */
export declare function getOpponent(playerId: PlayerId): PlayerId;
//# sourceMappingURL=state.d.ts.map