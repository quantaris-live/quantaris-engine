/**
 * @quantaris/engine - Action Validation
 *
 * Validates player actions before turn resolution.
 */
import type { Action, GameState, PlayerId, Position, PulseDirection } from "../core/types.js";
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
export declare function isValidPulseDirection(dir: unknown): dir is PulseDirection;
export declare function isDiagonalPulse(dir: PulseDirection): boolean;
export declare function getDirectionDelta(direction: Direction): Position;
export declare function getPulseDirectionDelta(direction: PulseDirection): Position;
export declare function applyDirection(pos: Position, dir: Direction): Position;
export declare function applyPulseDirection(pos: Position, dir: PulseDirection): Position;
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