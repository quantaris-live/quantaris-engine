/**
 * @quantaris/engine - Core Types
 *
 * Canonical type definitions for Quantaris game engine.
 * These types are immutable and define the game's data structures.
 *
 * RULE: No hardcoded strings — use enums/consts for all categorical values.
 */
/** Player identifiers */
export declare const Player: {
    readonly A: "A";
    readonly B: "B";
};
export type PlayerId = (typeof Player)[keyof typeof Player];
/** Cardinal directions for movement and pulse */
export declare const Direction: {
    readonly North: "N";
    readonly East: "E";
    readonly South: "S";
    readonly West: "W";
};
export type Direction = (typeof Direction)[keyof typeof Direction];
/** All valid directions as array (for validation) */
export declare const ALL_DIRECTIONS: readonly Direction[];
/** Action types */
export declare const ActionType: {
    readonly Move: "MOVE";
    readonly Pulse: "PULSE";
    readonly Shield: "SHIELD";
};
export type ActionType = (typeof ActionType)[keyof typeof ActionType];
/** Game phases (engine-level only, API handles submission tracking) */
export declare const GamePhase: {
    /** Game is in progress, turns being played */
    readonly Playing: "playing";
    /** Game ended, winner determined */
    readonly Ended: "ended";
};
export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];
/** Board position (0-8 for both x and y) */
export interface Position {
    readonly x: number;
    readonly y: number;
}
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
/** Input for turn resolution */
export interface TurnInput {
    readonly state: GameState;
    readonly actionsA: readonly Action[];
    readonly actionsB: readonly Action[];
}
/** Single event in the turn log */
export type TurnEvent = {
    readonly type: "MOVE";
    readonly quantarId: string;
    readonly from: Position;
    readonly to: Position;
} | {
    readonly type: "MOVE_BLOCKED";
    readonly quantarId: string;
    readonly from: Position;
    readonly direction: Direction;
    readonly reason: string;
} | {
    readonly type: "PULSE_FIRED";
    readonly quantarId: string;
    readonly from: Position;
    readonly direction: Direction;
} | {
    readonly type: "PULSE_HIT";
    readonly targetId: string;
    readonly targetType: "quantar" | "core";
    readonly damage: number;
} | {
    readonly type: "PULSE_MISS";
    readonly quantarId: string;
} | {
    readonly type: "SHIELD_ACTIVATED";
    readonly quantarId: string;
} | {
    readonly type: "DAMAGE_APPLIED";
    readonly targetId: string;
    readonly damage: number;
    readonly remainingHp: number;
} | {
    readonly type: "ENTITY_DESTROYED";
    readonly entityId: string;
    readonly entityType: "quantar" | "core";
} | {
    readonly type: "GAME_OVER";
    readonly winner: PlayerId;
};
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
export declare const BOARD_SIZE = 9;
export declare const CORE_HP = 5;
export declare const QUANTAR_HP = 2;
export declare const PULSE_DAMAGE = 1;
export declare const SHIELD_REDUCTION = 1;
export declare const QUANTARS_PER_PLAYER = 3;
//# sourceMappingURL=types.d.ts.map