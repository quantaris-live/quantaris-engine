/**
 * @quantaris/engine - Core Types
 *
 * Canonical type definitions for Quantaris game engine.
 * These types are immutable and define the game's data structures.
 *
 * RULE: No hardcoded strings — use enums/consts for all categorical values.
 */

// ============================================================================
// Enums & Constants
// ============================================================================

/** Player identifiers */
export const Player = {
  A: "A",
  B: "B",
} as const;
export type PlayerId = (typeof Player)[keyof typeof Player];

/** Cardinal directions for movement and pulse */
export const Direction = {
  North: "N",
  East: "E",
  South: "S",
  West: "W",
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];

/** All valid directions as array (for validation) */
export const ALL_DIRECTIONS: readonly Direction[] = Object.values(Direction);

/** Action types */
export const ActionType = {
  Move: "MOVE",
  Pulse: "PULSE",
  Shield: "SHIELD",
} as const;
export type ActionType = (typeof ActionType)[keyof typeof ActionType];

/** Game phases (engine-level only, API handles submission tracking) */
export const GamePhase = {
  /** Game is in progress, turns being played */
  Playing: "playing",
  /** Game ended, winner determined */
  Ended: "ended",
} as const;
export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];

/** Board position (0-8 for both x and y) */
export interface Position {
  readonly x: number; // 0-8
  readonly y: number; // 0-8
}

// ============================================================================
// Game Entities
// ============================================================================

/** Active controllable unit */
export interface Quantar {
  readonly id: string;
  readonly owner: PlayerId;
  readonly position: Position;
  readonly hp: number;
}

/** Passive objective - win by destroying opponent's Core */
export interface Core {
  readonly owner: PlayerId;
  readonly position: Position;
  readonly hp: number;
}

// ============================================================================
// Actions
// ============================================================================

/** Move one cell in a direction */
export interface MoveAction {
  readonly type: typeof ActionType.Move;
  readonly quantarId: string;
  readonly direction: Direction;
}

/** Fire a beam in a direction */
export interface PulseAction {
  readonly type: typeof ActionType.Pulse;
  readonly quantarId: string;
  readonly direction: Direction;
}

/** Reduce incoming damage by 1 this turn */
export interface ShieldAction {
  readonly type: typeof ActionType.Shield;
  readonly quantarId: string;
}

/** Union of all possible actions */
export type Action = MoveAction | PulseAction | ShieldAction;

/** Actions submitted by a player for a turn */
export interface PlayerActions {
  readonly playerId: PlayerId;
  readonly actions: readonly Action[];
}

// ============================================================================
// Game State
// ============================================================================

// GamePhase is defined above with the other enums

/** Complete game state - immutable snapshot */
export interface GameState {
  readonly turn: number;
  readonly phase: GamePhase;
  readonly quantars: readonly Quantar[];
  readonly cores: {
    readonly A: Core;
    readonly B: Core;
  };
  readonly winner: PlayerId | null;
}

// ============================================================================
// Turn Resolution
// ============================================================================

/** Input for turn resolution */
export interface TurnInput {
  readonly state: GameState;
  readonly actionsA: readonly Action[];
  readonly actionsB: readonly Action[];
}

// Event type constants
export const EventType = {
  Move: "MOVE",
  MoveBlocked: "MOVE_BLOCKED",
  PulseFired: "PULSE_FIRED",
  PulseHit: "PULSE_HIT",
  PulseMiss: "PULSE_MISS",
  ShieldActivated: "SHIELD_ACTIVATED",
  DamageApplied: "DAMAGE_APPLIED",
  EntityDestroyed: "ENTITY_DESTROYED",
  GameOver: "GAME_OVER",
  Draw: "DRAW",
} as const;

/** Single event in the turn log */
export type TurnEvent =
  | { readonly type: typeof EventType.Move; readonly quantarId: string; readonly from: Position; readonly to: Position }
  | { readonly type: typeof EventType.MoveBlocked; readonly quantarId: string; readonly from: Position; readonly direction: Direction; readonly reason: string }
  | { readonly type: typeof EventType.PulseFired; readonly quantarId: string; readonly from: Position; readonly direction: Direction }
  | { readonly type: typeof EventType.PulseHit; readonly targetId: string; readonly targetType: EntityType; readonly damage: number }
  | { readonly type: typeof EventType.PulseMiss; readonly quantarId: string }
  | { readonly type: typeof EventType.ShieldActivated; readonly quantarId: string }
  | { readonly type: typeof EventType.DamageApplied; readonly targetId: string; readonly damage: number; readonly remainingHp: number }
  | { readonly type: typeof EventType.EntityDestroyed; readonly entityId: string; readonly entityType: EntityType }
  | { readonly type: typeof EventType.GameOver; readonly winner: PlayerId }
  | { readonly type: typeof EventType.Draw; readonly reason: "max_turns" };

/** Log of everything that happened in a turn */
export interface TurnLog {
  readonly turn: number;
  readonly events: readonly TurnEvent[];
}

/** Result of resolving a turn */
export interface TurnResult {
  readonly state: GameState;
  readonly log: TurnLog;
}

// ============================================================================
// Constants
// ============================================================================

export const BOARD_SIZE = 9;
export const CORE_HP = 5;
export const QUANTAR_HP = 2;
export const PULSE_DAMAGE = 1;
export const SHIELD_REDUCTION = 1;
export const QUANTARS_PER_PLAYER = 3;
export const MAX_TURNS = 50;

// Entity types for events
export const EntityType = {
  Quantar: "quantar",
  Core: "core",
} as const;
export type EntityType = (typeof EntityType)[keyof typeof EntityType];

