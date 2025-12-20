/**
 * @quantaris/engine - Action Validation
 *
 * Validates player actions before turn resolution.
 */
import { Direction, ActionType, GamePhase, ALL_DIRECTIONS, } from "../core/types.js";
import { getQuantar, getPlayerQuantars, isInBounds } from "../core/state.js";
// ============================================================================
// Direction Helpers
// ============================================================================
export function isValidDirection(dir) {
    return typeof dir === "string" && ALL_DIRECTIONS.includes(dir);
}
/**
 * Get the position delta for a direction
 */
export function getDirectionDelta(direction) {
    switch (direction) {
        case Direction.North:
            return { x: 0, y: -1 };
        case Direction.South:
            return { x: 0, y: 1 };
        case Direction.East:
            return { x: 1, y: 0 };
        case Direction.West:
            return { x: -1, y: 0 };
    }
}
/**
 * Apply a direction to a position
 */
export function applyDirection(position, direction) {
    const delta = getDirectionDelta(direction);
    return {
        x: position.x + delta.x,
        y: position.y + delta.y,
    };
}
// ============================================================================
// Single Action Validation
// ============================================================================
/**
 * Validate a single action
 */
export function validateAction(state, action, playerId) {
    // Check action type
    if (!action || typeof action !== "object" || !("type" in action)) {
        return {
            valid: false,
            error: "Invalid action format",
            code: "INVALID_ACTION_TYPE",
        };
    }
    // Check quantar exists
    const quantar = getQuantar(state, action.quantarId);
    if (!quantar) {
        return {
            valid: false,
            error: `Quantar ${action.quantarId} not found`,
            code: "QUANTAR_NOT_FOUND",
        };
    }
    // Check ownership
    if (quantar.owner !== playerId) {
        return {
            valid: false,
            error: `Quantar ${action.quantarId} is not owned by player ${playerId}`,
            code: "QUANTAR_NOT_OWNED",
        };
    }
    // Check quantar is alive
    if (quantar.hp <= 0) {
        return {
            valid: false,
            error: `Quantar ${action.quantarId} is dead`,
            code: "QUANTAR_DEAD",
        };
    }
    // Type-specific validation
    switch (action.type) {
        case ActionType.Move: {
            if (!isValidDirection(action.direction)) {
                return {
                    valid: false,
                    error: `Invalid direction: ${action.direction}`,
                    code: "INVALID_DIRECTION",
                };
            }
            const targetPos = applyDirection(quantar.position, action.direction);
            if (!isInBounds(targetPos)) {
                return {
                    valid: false,
                    error: `Move would go out of bounds`,
                    code: "MOVE_OUT_OF_BOUNDS",
                };
            }
            break;
        }
        case ActionType.Pulse: {
            if (!isValidDirection(action.direction)) {
                return {
                    valid: false,
                    error: `Invalid direction: ${action.direction}`,
                    code: "INVALID_DIRECTION",
                };
            }
            break;
        }
        case ActionType.Shield: {
            // No additional validation needed
            break;
        }
        default: {
            return {
                valid: false,
                error: `Unknown action type: ${action.type}`,
                code: "INVALID_ACTION_TYPE",
            };
        }
    }
    return { valid: true };
}
// ============================================================================
// Full Turn Validation
// ============================================================================
/**
 * Validate all actions for a player's turn
 *
 * Rules:
 * - Each living Quantar must have exactly one action
 * - No duplicate actions for the same Quantar
 * - All actions must be individually valid
 */
export function validatePlayerActions(state, actions, playerId) {
    // Check game is still playing
    if (state.phase !== GamePhase.Playing) {
        return {
            valid: false,
            error: "Game is not in playing phase",
            code: "GAME_NOT_IN_ACTION_PHASE",
        };
    }
    const playerQuantars = getPlayerQuantars(state, playerId);
    const aliveQuantars = playerQuantars.filter((q) => q.hp > 0);
    const quantarIds = new Set(aliveQuantars.map((q) => q.id));
    const actionQuantarIds = new Set();
    // Validate each action
    for (const action of actions) {
        // Check for duplicates
        if (actionQuantarIds.has(action.quantarId)) {
            return {
                valid: false,
                error: `Duplicate action for Quantar ${action.quantarId}`,
                code: "DUPLICATE_QUANTAR_ACTION",
            };
        }
        actionQuantarIds.add(action.quantarId);
        // Validate individual action
        const result = validateAction(state, action, playerId);
        if (!result.valid) {
            return result;
        }
    }
    // Check all alive Quantars have actions
    for (const quantar of aliveQuantars) {
        if (!actionQuantarIds.has(quantar.id)) {
            return {
                valid: false,
                error: `Missing action for Quantar ${quantar.id}`,
                code: "MISSING_QUANTAR_ACTION",
            };
        }
    }
    return { valid: true };
}
//# sourceMappingURL=validate.js.map