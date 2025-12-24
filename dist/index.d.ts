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
export { type PlayerId, type Position, type Quantar, type Core, type Action, type MoveAction, type PulseAction, type ShieldAction, type PlayerActions, type GameState, type TurnInput, type TurnEvent, type TurnLog, type TurnResult, Player, Direction, ActionType, GamePhase, EntityType, EventType, ALL_DIRECTIONS, BOARD_SIZE, CORE_HP, QUANTAR_HP, PULSE_DAMAGE, SHIELD_REDUCTION, QUANTARS_PER_PLAYER, MAX_TURNS, createInitialState, getQuantar, getPlayerQuantars, getPlayerCore, isInBounds, positionsEqual, getEntityAt, getOpponent, } from "./core/index.js";
export { type ValidationResult, type ValidationSuccess, type ValidationError, type ValidationErrorCode, validateAction, validatePlayerActions, isValidDirection, getDirectionDelta, applyDirection, } from "./actions/index.js";
export { resolveTurn } from "./resolution/index.js";
export { type Replay, type ReplayTurn, canonicalizeState, canonicalizeActions, hashState, hashActions, hashTurn, statesEqual, createReplayTurn, } from "./hash/index.js";
//# sourceMappingURL=index.d.ts.map