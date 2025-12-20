/**
 * @quantaris/engine - Action Validation
 *
 * Validates player actions before turn resolution.
 */
import type { Action, GameState, PlayerId, Position } from "../core/types.js";
import { Direction } from "../core/types.js";
export interface ValidationSuccess {
    readonly valid: true;
}
export interface ValidationError {
    readonly valid: false;
    readonly error: string;
    readonly code: ValidationErrorCode;
}
export type ValidationResult = ValidationSuccess | ValidationError;
export type ValidationErrorCode = "INVALID_ACTION_TYPE" | "INVALID_DIRECTION" | "QUANTAR_NOT_FOUND" | "QUANTAR_NOT_OWNED" | "QUANTAR_DEAD" | "MOVE_OUT_OF_BOUNDS" | "DUPLICATE_QUANTAR_ACTION" | "MISSING_QUANTAR_ACTION" | "GAME_NOT_IN_ACTION_PHASE";
export declare function isValidDirection(dir: unknown): dir is Direction;
/**
 * Get the position delta for a direction
 */
export declare function getDirectionDelta(direction: Direction): Position;
/**
 * Apply a direction to a position
 */
export declare function applyDirection(position: Position, direction: Direction): Position;
/**
 * Validate a single action
 */
export declare function validateAction(state: GameState, action: Action, playerId: PlayerId): ValidationResult;
/**
 * Validate all actions for a player's turn
 *
 * Rules:
 * - Each living Quantar must have exactly one action
 * - No duplicate actions for the same Quantar
 * - All actions must be individually valid
 */
export declare function validatePlayerActions(state: GameState, actions: readonly Action[], playerId: PlayerId): ValidationResult;
//# sourceMappingURL=validate.d.ts.map