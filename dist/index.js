/**
 * @quantaris/engine
 *
 * Deterministic game logic for Quantaris — pure TypeScript, zero dependencies.
 *
 * This is the canonical implementation of Quantaris game rules.
 * Same inputs will always produce the same outputs.
 *
 * @example
 * ```typescript
 * import {
 *   createInitialState,
 *   resolveTurn,
 *   validatePlayerActions,
 *   hashState,
 * } from "@quantaris/engine";
 *
 * // Start a new game
 * const state = createInitialState();
 *
 * // Validate player actions
 * const validation = validatePlayerActions(state, actions, "A");
 * if (!validation.valid) {
 *   console.error(validation.error);
 * }
 *
 * // Resolve the turn
 * const result = resolveTurn({ state, actionsA, actionsB });
 * console.log(result.state); // New game state
 * console.log(result.log);   // What happened this turn
 *
 * // Hash for verification
 * const hash = hashState(result.state);
 * ```
 *
 * @packageDocumentation
 */
// Core types and state management
export { 
// Enums (runtime + type)
Player, Direction, ActionType, GamePhase, ALL_DIRECTIONS, 
// Constants
BOARD_SIZE, CORE_HP, QUANTAR_HP, PULSE_DAMAGE, SHIELD_REDUCTION, QUANTARS_PER_PLAYER, 
// State functions
createInitialState, getQuantar, getPlayerQuantars, getPlayerCore, isInBounds, positionsEqual, getEntityAt, getOpponent, } from "./core/index.js";
// Action validation
export { validateAction, validatePlayerActions, isValidDirection, getDirectionDelta, applyDirection, } from "./actions/index.js";
// Turn resolution
export { resolveTurn } from "./resolution/index.js";
// Hashing and replay
export { canonicalizeState, canonicalizeActions, hashState, hashActions, hashTurn, statesEqual, createReplayTurn, } from "./hash/index.js";
//# sourceMappingURL=index.js.map