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
};
/** Cardinal directions for movement */
export const Direction = {
    North: "N",
    East: "E",
    South: "S",
    West: "W",
};
/** 8 pulse directions: orthogonal (ranged) + diagonal (melee) */
export const PulseDirection = {
    North: "N", East: "E", South: "S", West: "W",
    NorthEast: "NE", NorthWest: "NW", SouthEast: "SE", SouthWest: "SW",
};
export const ALL_DIRECTIONS = Object.values(Direction);
export const ALL_PULSE_DIRECTIONS = Object.values(PulseDirection);
/** Diagonal = melee (range=1) */
export const DIAGONAL_DIRECTIONS = [
    PulseDirection.NorthEast,
    PulseDirection.NorthWest,
    PulseDirection.SouthEast,
    PulseDirection.SouthWest,
];
export const ActionType = {
    Move: "MOVE",
    Pulse: "PULSE",
    Shield: "SHIELD",
};
/** Game phases (engine-level only, API handles submission tracking) */
export const GamePhase = {
    /** Game is in progress, turns being played */
    Playing: "playing",
    /** Game ended, winner determined */
    Ended: "ended",
};
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
    TerminalLoss: "TERMINAL_LOSS",
    Draw: "DRAW",
};
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
};
//# sourceMappingURL=types.js.map