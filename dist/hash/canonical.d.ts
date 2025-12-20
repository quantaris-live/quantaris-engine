/**
 * @quantaris/engine - State Hashing
 *
 * Canonical serialization and hashing for game states.
 * Used for replay verification and state comparison.
 */
import type { GameState, Action, TurnLog } from "../core/types.js";
/**
 * Convert a GameState to a canonical string representation.
 *
 * The canonical form is deterministic - same state always produces same string.
 * Quantars are sorted by ID to ensure consistent ordering.
 */
export declare function canonicalizeState(state: GameState): string;
/**
 * Convert actions to a canonical string representation.
 */
export declare function canonicalizeActions(actions: readonly Action[]): string;
/**
 * Generate a hash of the game state.
 *
 * Same state always produces the same hash.
 * Different states should produce different hashes (with high probability).
 */
export declare function hashState(state: GameState): string;
/**
 * Generate a hash of player actions.
 */
export declare function hashActions(actions: readonly Action[]): string;
/**
 * Generate a combined hash for a turn (state + both player actions).
 *
 * This can be used to verify that a replay matches the original game.
 */
export declare function hashTurn(state: GameState, actionsA: readonly Action[], actionsB: readonly Action[]): string;
/**
 * Verify that two states are identical by comparing their canonical forms.
 */
export declare function statesEqual(a: GameState, b: GameState): boolean;
export interface ReplayTurn {
    readonly turn: number;
    readonly stateHash: string;
    readonly actionsA: readonly Action[];
    readonly actionsB: readonly Action[];
    readonly log: TurnLog;
}
export interface Replay {
    readonly initialState: GameState;
    readonly turns: readonly ReplayTurn[];
    readonly finalState: GameState;
    readonly winner: "A" | "B" | null;
}
/**
 * Create a replay entry for a turn
 */
export declare function createReplayTurn(state: GameState, actionsA: readonly Action[], actionsB: readonly Action[], log: TurnLog): ReplayTurn;
//# sourceMappingURL=canonical.d.ts.map