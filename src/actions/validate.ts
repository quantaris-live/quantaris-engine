/**
 * @quantaris/engine - Action Validation
 *
 * Validates player actions before turn resolution.
 */

import type {
  Action,
  GameState,
  PlayerId,
  Position,
  PulseDirection,
} from "../core/types.js";
import {
  Direction,
  ActionType,
  GamePhase,
  ALL_DIRECTIONS,
  ALL_PULSE_DIRECTIONS,
  DIAGONAL_DIRECTIONS,
} from "../core/types.js";
import { getQuantar, getPlayerQuantars, isInBounds } from "../core/state.js";

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationSuccess {
  readonly valid: true;
}

export interface ValidationError {
  readonly valid: false;
  readonly error: string;
  readonly code: ValidationErrorCode;
}

export type ValidationResult = ValidationSuccess | ValidationError;

export type ValidationErrorCode =
  | "INVALID_ACTION_TYPE"
  | "INVALID_DIRECTION"
  | "QUANTAR_NOT_FOUND"
  | "QUANTAR_NOT_OWNED"
  | "QUANTAR_DEAD"
  | "MOVE_OUT_OF_BOUNDS"
  | "DUPLICATE_QUANTAR_ACTION"
  | "MISSING_QUANTAR_ACTION"
  | "GAME_NOT_IN_ACTION_PHASE";

// ============================================================================
// Direction Helpers
// ============================================================================

export function isValidDirection(dir: unknown): dir is Direction {
  return typeof dir === "string" && (ALL_DIRECTIONS as readonly string[]).includes(dir);
}

export function isValidPulseDirection(dir: unknown): dir is PulseDirection {
  return typeof dir === "string" && (ALL_PULSE_DIRECTIONS as readonly string[]).includes(dir);
}

export function isDiagonalPulse(dir: PulseDirection): boolean {
  return (DIAGONAL_DIRECTIONS as readonly string[]).includes(dir);
}

const DIRECTION_DELTAS: Record<Direction, Position> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};

const PULSE_DIRECTION_DELTAS: Record<PulseDirection, Position> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
  NE: { x: 1, y: -1 },
  NW: { x: -1, y: -1 },
  SE: { x: 1, y: 1 },
  SW: { x: -1, y: 1 },
};

export function getDirectionDelta(direction: Direction): Position {
  return DIRECTION_DELTAS[direction];
}

export function getPulseDirectionDelta(direction: PulseDirection): Position {
  return PULSE_DIRECTION_DELTAS[direction];
}

export function applyDirection(pos: Position, dir: Direction): Position {
  const d = DIRECTION_DELTAS[dir];
  return { x: pos.x + d.x, y: pos.y + d.y };
}

export function applyPulseDirection(pos: Position, dir: PulseDirection): Position {
  const d = PULSE_DIRECTION_DELTAS[dir];
  return { x: pos.x + d.x, y: pos.y + d.y };
}

// ============================================================================
// Single Action Validation
// ============================================================================

/**
 * Validate a single action
 */
export function validateAction(
  state: GameState,
  action: Action,
  playerId: PlayerId
): ValidationResult {
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
      if (!isValidPulseDirection(action.direction)) {
        return {
          valid: false,
          error: `Invalid pulse direction: ${action.direction}`,
          code: "INVALID_DIRECTION",
        };
      }
      // Diagonal pulse is melee (range 1), orthogonal is ranged
      // Both are valid - range handling is in resolution
      break;
    }

    case ActionType.Shield: {
      // No additional validation needed
      break;
    }

    default: {
      return {
        valid: false,
        error: `Unknown action type: ${(action as { type: string }).type}`,
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
export function validatePlayerActions(
  state: GameState,
  actions: readonly Action[],
  playerId: PlayerId
): ValidationResult {
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
  const actionQuantarIds = new Set<string>();

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

