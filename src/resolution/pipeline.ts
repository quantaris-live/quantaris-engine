/**
 * @quantaris/engine - Turn Resolution Pipeline
 *
 * Deterministic resolution of game turns.
 *
 * Resolution order (from whitepaper):
 * 1. Collect all actions
 * 2. MOVE phase — all moves applied simultaneously
 * 3. SHIELD phase — shields activated
 * 4. PULSE phase — pulses resolved from post-move positions
 * 5. Apply damage simultaneously
 * 6. Remove entities with HP ≤ 0
 * 7. Check win condition (Core destroyed)
 */

import type {
  GameState,
  Quantar,
  Core,
  Action,
  MoveAction,
  PulseAction,
  ShieldAction,
  TurnInput,
  TurnResult,
  TurnLog,
  TurnEvent,
  Position,
  PlayerId,
} from "../core/types.js";
import {
  PULSE_DAMAGE,
  SHIELD_REDUCTION,
  MAX_TURNS,
  ActionType,
  GamePhase,
  EntityType,
  EventType,
} from "../core/types.js";
import { positionsEqual, isInBounds, getEntityAt } from "../core/state.js";
import { applyDirection, applyPulseDirection, isDiagonalPulse } from "../actions/validate.js";

// ============================================================================
// Internal State (Mutable during resolution)
// ============================================================================

interface MutableQuantar {
  id: string;
  owner: PlayerId;
  position: Position;
  hp: number;
  shielded: boolean;
  pendingDamage: number;
}

interface MutableCore {
  owner: PlayerId;
  position: Position;
  hp: number;
  pendingDamage: number;
}

interface ResolutionState {
  quantars: MutableQuantar[];
  cores: { A: MutableCore; B: MutableCore };
  events: TurnEvent[];
}

// ============================================================================
// Helpers
// ============================================================================

function toMutableQuantar(q: Quantar): MutableQuantar {
  return {
    id: q.id,
    owner: q.owner,
    position: { ...q.position },
    hp: q.hp,
    shielded: false,
    pendingDamage: 0,
  };
}

function toMutableCore(c: Core): MutableCore {
  return {
    owner: c.owner,
    position: { ...c.position },
    hp: c.hp,
    pendingDamage: 0,
  };
}

function toImmutableQuantar(q: MutableQuantar): Quantar {
  return {
    id: q.id,
    owner: q.owner,
    position: { ...q.position },
    hp: q.hp,
  };
}

function toImmutableCore(c: MutableCore): Core {
  return {
    owner: c.owner,
    position: { ...c.position },
    hp: c.hp,
  };
}

function getQuantarById(state: ResolutionState, id: string): MutableQuantar | undefined {
  return state.quantars.find((q) => q.id === id);
}

function getEntityAtPosition(
  state: ResolutionState,
  position: Position
): { type: typeof EntityType.Quantar; entity: MutableQuantar } | { type: typeof EntityType.Core; entity: MutableCore } | null {
  const quantar = state.quantars.find((q) => q.hp > 0 && positionsEqual(q.position, position));
  if (quantar) {
    return { type: EntityType.Quantar, entity: quantar };
  }

  if (positionsEqual(state.cores.A.position, position)) {
    return { type: EntityType.Core, entity: state.cores.A };
  }
  if (positionsEqual(state.cores.B.position, position)) {
    return { type: EntityType.Core, entity: state.cores.B };
  }

  return null;
}

// ============================================================================
// Phase 1: MOVE
// ============================================================================

function resolveMoves(
  state: ResolutionState,
  actions: readonly Action[]
): void {
  const moveActions = actions.filter((a): a is MoveAction => a.type === ActionType.Move);

  // Calculate intended destinations
  const intendedMoves: Array<{
    quantar: MutableQuantar;
    from: Position;
    to: Position;
    action: MoveAction;
  }> = [];

  for (const action of moveActions) {
    const quantar = getQuantarById(state, action.quantarId);
    if (!quantar || quantar.hp <= 0) continue;

    const from = { ...quantar.position };
    const to = applyDirection(from, action.direction);

    if (!isInBounds(to)) {
      state.events.push({
        type: EventType.MoveBlocked,
        quantarId: quantar.id,
        from,
        direction: action.direction,
        reason: "out of bounds",
      });
      continue;
    }

    intendedMoves.push({ quantar, from, to, action });
  }

  // Check for collisions with Cores (Cores never move)
  const validMoves = intendedMoves.filter((move) => {
    const coreCollision =
      positionsEqual(move.to, state.cores.A.position) ||
      positionsEqual(move.to, state.cores.B.position);

    if (coreCollision) {
      state.events.push({
        type: EventType.MoveBlocked,
        quantarId: move.quantar.id,
        from: move.from,
        direction: move.action.direction,
        reason: "blocked by Core",
      });
      return false;
    }
    return true;
  });

  // Check for head-on collisions (two Quantars moving into same cell)
  const destinationCounts = new Map<string, number>();
  for (const move of validMoves) {
    const key = `${move.to.x},${move.to.y}`;
    destinationCounts.set(key, (destinationCounts.get(key) ?? 0) + 1);
  }

  // Check for swap collisions (A→B and B→A)
  const movesByQuantar = new Map(validMoves.map((m) => [m.quantar.id, m]));

  const finalMoves = validMoves.filter((move) => {
    const destKey = `${move.to.x},${move.to.y}`;

    // Multiple Quantars trying to move to same cell
    if ((destinationCounts.get(destKey) ?? 0) > 1) {
      state.events.push({
        type: EventType.MoveBlocked,
        quantarId: move.quantar.id,
        from: move.from,
        direction: move.action.direction,
        reason: "collision with another Quantar",
      });
      return false;
    }

    // Check if moving into a stationary Quantar
    const targetOccupant = state.quantars.find(
      (q) => q.hp > 0 && q.id !== move.quantar.id && positionsEqual(q.position, move.to)
    );
    if (targetOccupant) {
      const occupantMove = movesByQuantar.get(targetOccupant.id);
      // If the occupant is not moving, or moving elsewhere, we're blocked
      if (!occupantMove) {
        state.events.push({
          type: EventType.MoveBlocked,
          quantarId: move.quantar.id,
          from: move.from,
          direction: move.action.direction,
          reason: "blocked by stationary Quantar",
        });
        return false;
      }
      // If we're swapping positions (A→B, B→A), both are blocked
      if (positionsEqual(occupantMove.to, move.from)) {
        state.events.push({
          type: EventType.MoveBlocked,
          quantarId: move.quantar.id,
          from: move.from,
          direction: move.action.direction,
          reason: "swap collision",
        });
        return false;
      }
    }

    return true;
  });

  // Apply valid moves
  for (const move of finalMoves) {
    move.quantar.position = { ...move.to };
    state.events.push({
      type: EventType.Move,
      quantarId: move.quantar.id,
      from: move.from,
      to: move.to,
    });
  }
}

// ============================================================================
// Phase 2: SHIELD
// ============================================================================

function resolveShields(
  state: ResolutionState,
  actions: readonly Action[]
): void {
  const shieldActions = actions.filter((a): a is ShieldAction => a.type === ActionType.Shield);

  for (const action of shieldActions) {
    const quantar = getQuantarById(state, action.quantarId);
    if (!quantar || quantar.hp <= 0) continue;

    quantar.shielded = true;
    state.events.push({
      type: EventType.ShieldActivated,
      quantarId: quantar.id,
    });
  }
}

// ============================================================================
// Phase 3: PULSE
// ============================================================================

function resolvePulses(
  state: ResolutionState,
  actions: readonly Action[]
): void {
  const pulseActions = actions.filter((a): a is PulseAction => a.type === ActionType.Pulse);

  for (const action of pulseActions) {
    const quantar = getQuantarById(state, action.quantarId);
    if (!quantar || quantar.hp <= 0) continue;

    const isDiagonal = isDiagonalPulse(action.direction);

    state.events.push({
      type: EventType.PulseFired,
      quantarId: quantar.id,
      from: { ...quantar.position },
      direction: action.direction,
    });

    // Trace the pulse beam
    let currentPos = { ...quantar.position };
    let hitTarget: { type: typeof EntityType.Quantar; entity: MutableQuantar } | { type: typeof EntityType.Core; entity: MutableCore } | null = null;

    if (isDiagonal) {
      // Diagonal pulse: melee, range=1 (only check adjacent cell)
      currentPos = applyPulseDirection(currentPos, action.direction);
      
      if (isInBounds(currentPos)) {
        const entity = getEntityAtPosition(state, currentPos);
        if (entity) {
          hitTarget = entity;
        }
      }
    } else {
      // Orthogonal pulse: ranged, travels until first hit
      while (true) {
        currentPos = applyPulseDirection(currentPos, action.direction);

        if (!isInBounds(currentPos)) {
          break; // Pulse goes off board
        }

        const entity = getEntityAtPosition(state, currentPos);
        if (entity) {
          hitTarget = entity;
          break;
        }
      }
    }

    if (hitTarget) {
      hitTarget.entity.pendingDamage += PULSE_DAMAGE;
      state.events.push({
        type: EventType.PulseHit,
        targetId: hitTarget.type === EntityType.Quantar ? hitTarget.entity.id : `core_${hitTarget.entity.owner}`,
        targetType: hitTarget.type,
        damage: PULSE_DAMAGE,
      });
    } else {
      state.events.push({
        type: EventType.PulseMiss,
        quantarId: quantar.id,
      });
    }
  }
}

// ============================================================================
// Phase 4: Apply Damage
// ============================================================================

function applyDamage(state: ResolutionState): void {
  // Apply damage to Quantars
  for (const quantar of state.quantars) {
    if (quantar.pendingDamage > 0) {
      let actualDamage = quantar.pendingDamage;

      // Shield reduces damage
      if (quantar.shielded) {
        actualDamage = Math.max(0, actualDamage - SHIELD_REDUCTION);
      }

      quantar.hp -= actualDamage;
      state.events.push({
        type: EventType.DamageApplied,
        targetId: quantar.id,
        damage: actualDamage,
        remainingHp: quantar.hp,
      });

      quantar.pendingDamage = 0;
    }
  }

  // Apply damage to Cores (Cores cannot shield)
  for (const core of [state.cores.A, state.cores.B]) {
    if (core.pendingDamage > 0) {
      core.hp -= core.pendingDamage;
      state.events.push({
        type: EventType.DamageApplied,
        targetId: `core_${core.owner}`,
        damage: core.pendingDamage,
        remainingHp: core.hp,
      });
      core.pendingDamage = 0;
    }
  }
}

// ============================================================================
// Phase 5: Remove Dead Entities
// ============================================================================

function removeDeadEntities(state: ResolutionState): void {
  for (const quantar of state.quantars) {
    if (quantar.hp <= 0) {
      state.events.push({
        type: EventType.EntityDestroyed,
        entityId: quantar.id,
        entityType: EntityType.Quantar,
      });
    }
  }

  // Filter out dead Quantars
  state.quantars = state.quantars.filter((q) => q.hp > 0);

  // Check Cores
  for (const core of [state.cores.A, state.cores.B]) {
    if (core.hp <= 0) {
      state.events.push({
        type: EventType.EntityDestroyed,
        entityId: `core_${core.owner}`,
        entityType: EntityType.Core,
      });
    }
  }
}

// ============================================================================
// Phase 6: Check Win Condition
// ============================================================================

interface WinConditionResult {
  winner: PlayerId | null;
  terminalLoss: PlayerId | null; // Who lost due to 0 quantars (for event logging)
  isDraw: boolean; // Both players lost simultaneously
}

function checkWinCondition(state: ResolutionState): WinConditionResult {
  // Primary Win: Core destroyed
  const coreADead = state.cores.A.hp <= 0;
  const coreBDead = state.cores.B.hp <= 0;

  if (coreADead && coreBDead) {
    // Both cores destroyed simultaneously - draw (no winner)
    return { winner: null, terminalLoss: null, isDraw: true };
  }

  if (coreADead) {
    return { winner: "B", terminalLoss: null, isDraw: false };
  }

  if (coreBDead) {
    return { winner: "A", terminalLoss: null, isDraw: false };
  }

  // Terminal Loss: 0 quantars = immediate loss
  // If player has no living quantars at end of turn, they lose
  const quantarsA = state.quantars.filter(q => q.owner === "A" && q.hp > 0);
  const quantarsB = state.quantars.filter(q => q.owner === "B" && q.hp > 0);

  if (quantarsA.length === 0 && quantarsB.length === 0) {
    // Both players lost all quantars simultaneously - draw
    return { winner: null, terminalLoss: null, isDraw: true };
  }

  if (quantarsA.length === 0) {
    return { winner: "B", terminalLoss: "A", isDraw: false };
  }

  if (quantarsB.length === 0) {
    return { winner: "A", terminalLoss: "B", isDraw: false };
  }

  return { winner: null, terminalLoss: null, isDraw: false };
}

// ============================================================================
// Main Resolution Function
// ============================================================================

/**
 * Resolve a turn given the current state and both players' actions.
 *
 * This is the core of the game engine - completely deterministic.
 * Same inputs will always produce the same outputs.
 */
export function resolveTurn(input: TurnInput): TurnResult {
  const { state, actionsA, actionsB } = input;

  // Create mutable state for resolution
  const resolutionState: ResolutionState = {
    quantars: state.quantars.map(toMutableQuantar),
    cores: {
      A: toMutableCore(state.cores.A),
      B: toMutableCore(state.cores.B),
    },
    events: [],
  };

  // Combine all actions
  const allActions = [...actionsA, ...actionsB];

  // Execute resolution phases
  resolveMoves(resolutionState, allActions);
  resolveShields(resolutionState, allActions);
  resolvePulses(resolutionState, allActions);
  applyDamage(resolutionState);
  removeDeadEntities(resolutionState);

  // Check win condition (includes Terminal Loss check)
  const { winner, terminalLoss, isDraw } = checkWinCondition(resolutionState);

  if (terminalLoss) {
    resolutionState.events.push({
      type: EventType.TerminalLoss,
      loser: terminalLoss,
      reason: "no_quantars",
    });
  }

  if (winner) {
    resolutionState.events.push({
      type: EventType.GameOver,
      winner,
    });
  }

  // Check for max turns (draw condition)
  const nextTurn = state.turn + 1;
  const isMaxTurnsReached = !winner && !isDraw && nextTurn >= MAX_TURNS;
  
  if (isMaxTurnsReached || isDraw) {
    resolutionState.events.push({
      type: EventType.Draw,
      reason: isDraw ? "mutual_destruction" : "max_turns",
    });
  }

  // Game ends if there's a winner, draw, or max turns reached
  const gameEnded = winner !== null || isDraw || isMaxTurnsReached;

  // Build final immutable state
  const newState: GameState = {
    turn: nextTurn,
    phase: gameEnded ? GamePhase.Ended : GamePhase.Playing,
    quantars: resolutionState.quantars.map(toImmutableQuantar),
    cores: {
      A: toImmutableCore(resolutionState.cores.A),
      B: toImmutableCore(resolutionState.cores.B),
    },
    winner, // null for draw
  };

  const log: TurnLog = {
    turn: state.turn,
    events: resolutionState.events,
  };

  return { state: newState, log };
}

