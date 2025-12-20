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
import { PULSE_DAMAGE, SHIELD_REDUCTION, ActionType, GamePhase, } from "../core/types.js";
import { positionsEqual, isInBounds, getEntityAt } from "../core/state.js";
import { applyDirection } from "../actions/validate.js";
// ============================================================================
// Helpers
// ============================================================================
function toMutableQuantar(q) {
    return {
        id: q.id,
        owner: q.owner,
        position: { ...q.position },
        hp: q.hp,
        shielded: false,
        pendingDamage: 0,
    };
}
function toMutableCore(c) {
    return {
        owner: c.owner,
        position: { ...c.position },
        hp: c.hp,
        pendingDamage: 0,
    };
}
function toImmutableQuantar(q) {
    return {
        id: q.id,
        owner: q.owner,
        position: { ...q.position },
        hp: q.hp,
    };
}
function toImmutableCore(c) {
    return {
        owner: c.owner,
        position: { ...c.position },
        hp: c.hp,
    };
}
function getQuantarById(state, id) {
    return state.quantars.find((q) => q.id === id);
}
function getEntityAtPosition(state, position) {
    const quantar = state.quantars.find((q) => q.hp > 0 && positionsEqual(q.position, position));
    if (quantar) {
        return { type: "quantar", entity: quantar };
    }
    if (positionsEqual(state.cores.A.position, position)) {
        return { type: "core", entity: state.cores.A };
    }
    if (positionsEqual(state.cores.B.position, position)) {
        return { type: "core", entity: state.cores.B };
    }
    return null;
}
// ============================================================================
// Phase 1: MOVE
// ============================================================================
function resolveMoves(state, actions) {
    const moveActions = actions.filter((a) => a.type === ActionType.Move);
    // Calculate intended destinations
    const intendedMoves = [];
    for (const action of moveActions) {
        const quantar = getQuantarById(state, action.quantarId);
        if (!quantar || quantar.hp <= 0)
            continue;
        const from = { ...quantar.position };
        const to = applyDirection(from, action.direction);
        if (!isInBounds(to)) {
            state.events.push({
                type: "MOVE_BLOCKED",
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
        const coreCollision = positionsEqual(move.to, state.cores.A.position) ||
            positionsEqual(move.to, state.cores.B.position);
        if (coreCollision) {
            state.events.push({
                type: "MOVE_BLOCKED",
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
    const destinationCounts = new Map();
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
                type: "MOVE_BLOCKED",
                quantarId: move.quantar.id,
                from: move.from,
                direction: move.action.direction,
                reason: "collision with another Quantar",
            });
            return false;
        }
        // Check if moving into a stationary Quantar
        const targetOccupant = state.quantars.find((q) => q.hp > 0 && q.id !== move.quantar.id && positionsEqual(q.position, move.to));
        if (targetOccupant) {
            const occupantMove = movesByQuantar.get(targetOccupant.id);
            // If the occupant is not moving, or moving elsewhere, we're blocked
            if (!occupantMove) {
                state.events.push({
                    type: "MOVE_BLOCKED",
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
                    type: "MOVE_BLOCKED",
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
            type: "MOVE",
            quantarId: move.quantar.id,
            from: move.from,
            to: move.to,
        });
    }
}
// ============================================================================
// Phase 2: SHIELD
// ============================================================================
function resolveShields(state, actions) {
    const shieldActions = actions.filter((a) => a.type === ActionType.Shield);
    for (const action of shieldActions) {
        const quantar = getQuantarById(state, action.quantarId);
        if (!quantar || quantar.hp <= 0)
            continue;
        quantar.shielded = true;
        state.events.push({
            type: "SHIELD_ACTIVATED",
            quantarId: quantar.id,
        });
    }
}
// ============================================================================
// Phase 3: PULSE
// ============================================================================
function resolvePulses(state, actions) {
    const pulseActions = actions.filter((a) => a.type === ActionType.Pulse);
    for (const action of pulseActions) {
        const quantar = getQuantarById(state, action.quantarId);
        if (!quantar || quantar.hp <= 0)
            continue;
        state.events.push({
            type: "PULSE_FIRED",
            quantarId: quantar.id,
            from: { ...quantar.position },
            direction: action.direction,
        });
        // Trace the pulse beam
        let currentPos = { ...quantar.position };
        let hitTarget = null;
        while (true) {
            currentPos = applyDirection(currentPos, action.direction);
            if (!isInBounds(currentPos)) {
                break; // Pulse goes off board
            }
            const entity = getEntityAtPosition(state, currentPos);
            if (entity) {
                hitTarget = entity;
                break;
            }
        }
        if (hitTarget) {
            hitTarget.entity.pendingDamage += PULSE_DAMAGE;
            state.events.push({
                type: "PULSE_HIT",
                targetId: hitTarget.type === "quantar" ? hitTarget.entity.id : `core_${hitTarget.entity.owner}`,
                targetType: hitTarget.type,
                damage: PULSE_DAMAGE,
            });
        }
        else {
            state.events.push({
                type: "PULSE_MISS",
                quantarId: quantar.id,
            });
        }
    }
}
// ============================================================================
// Phase 4: Apply Damage
// ============================================================================
function applyDamage(state) {
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
                type: "DAMAGE_APPLIED",
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
                type: "DAMAGE_APPLIED",
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
function removeDeadEntities(state) {
    for (const quantar of state.quantars) {
        if (quantar.hp <= 0) {
            state.events.push({
                type: "ENTITY_DESTROYED",
                entityId: quantar.id,
                entityType: "quantar",
            });
        }
    }
    // Filter out dead Quantars
    state.quantars = state.quantars.filter((q) => q.hp > 0);
    // Check Cores
    for (const core of [state.cores.A, state.cores.B]) {
        if (core.hp <= 0) {
            state.events.push({
                type: "ENTITY_DESTROYED",
                entityId: `core_${core.owner}`,
                entityType: "core",
            });
        }
    }
}
// ============================================================================
// Phase 6: Check Win Condition
// ============================================================================
function checkWinCondition(state) {
    const coreADead = state.cores.A.hp <= 0;
    const coreBDead = state.cores.B.hp <= 0;
    if (coreADead && coreBDead) {
        // Both cores destroyed simultaneously - draw (no winner)
        // For now, we'll say no winner (could be a tie rule)
        return null;
    }
    if (coreADead) {
        return "B"; // B wins
    }
    if (coreBDead) {
        return "A"; // A wins
    }
    return null;
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
export function resolveTurn(input) {
    const { state, actionsA, actionsB } = input;
    // Create mutable state for resolution
    const resolutionState = {
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
    // Check win condition
    const winner = checkWinCondition(resolutionState);
    if (winner) {
        resolutionState.events.push({
            type: "GAME_OVER",
            winner,
        });
    }
    // Build final immutable state
    const newState = {
        turn: state.turn + 1,
        phase: winner ? GamePhase.Ended : GamePhase.Playing,
        quantars: resolutionState.quantars.map(toImmutableQuantar),
        cores: {
            A: toImmutableCore(resolutionState.cores.A),
            B: toImmutableCore(resolutionState.cores.B),
        },
        winner,
    };
    const log = {
        turn: state.turn,
        events: resolutionState.events,
    };
    return { state: newState, log };
}
//# sourceMappingURL=pipeline.js.map