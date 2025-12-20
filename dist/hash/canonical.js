/**
 * @quantaris/engine - State Hashing
 *
 * Canonical serialization and hashing for game states.
 * Used for replay verification and state comparison.
 */
// ============================================================================
// Canonical Serialization
// ============================================================================
/**
 * Serialize a Quantar to a canonical string
 */
function serializeQuantar(q) {
    return `Q:${q.id}:${q.owner}:${q.position.x},${q.position.y}:${q.hp}`;
}
/**
 * Serialize a Core to a canonical string
 */
function serializeCore(c) {
    return `C:${c.owner}:${c.position.x},${c.position.y}:${c.hp}`;
}
/**
 * Serialize an action to a canonical string
 */
function serializeAction(a) {
    switch (a.type) {
        case "MOVE":
            return `M:${a.quantarId}:${a.direction}`;
        case "PULSE":
            return `P:${a.quantarId}:${a.direction}`;
        case "SHIELD":
            return `S:${a.quantarId}`;
    }
}
/**
 * Convert a GameState to a canonical string representation.
 *
 * The canonical form is deterministic - same state always produces same string.
 * Quantars are sorted by ID to ensure consistent ordering.
 */
export function canonicalizeState(state) {
    const parts = [];
    // Game metadata
    parts.push(`T:${state.turn}`);
    parts.push(`P:${state.phase}`);
    parts.push(`W:${state.winner ?? "null"}`);
    // Cores (always in A, B order)
    parts.push(serializeCore(state.cores.A));
    parts.push(serializeCore(state.cores.B));
    // Quantars (sorted by ID for determinism)
    const sortedQuantars = [...state.quantars].sort((a, b) => a.id.localeCompare(b.id));
    for (const q of sortedQuantars) {
        parts.push(serializeQuantar(q));
    }
    return parts.join("|");
}
/**
 * Convert actions to a canonical string representation.
 */
export function canonicalizeActions(actions) {
    const sorted = [...actions].sort((a, b) => a.quantarId.localeCompare(b.quantarId));
    return sorted.map(serializeAction).join("|");
}
// ============================================================================
// Simple Hash Function
// ============================================================================
/**
 * Simple string hash function (djb2 algorithm)
 *
 * For cryptographic applications, use a proper hash like SHA-256.
 * This is suitable for quick comparisons and deduplication.
 */
function djb2Hash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    return hash >>> 0; // Convert to unsigned 32-bit
}
/**
 * Hash a string to a hex representation
 */
function hashToHex(str) {
    const hash = djb2Hash(str);
    return hash.toString(16).padStart(8, "0");
}
// ============================================================================
// Public API
// ============================================================================
/**
 * Generate a hash of the game state.
 *
 * Same state always produces the same hash.
 * Different states should produce different hashes (with high probability).
 */
export function hashState(state) {
    const canonical = canonicalizeState(state);
    return hashToHex(canonical);
}
/**
 * Generate a hash of player actions.
 */
export function hashActions(actions) {
    const canonical = canonicalizeActions(actions);
    return hashToHex(canonical);
}
/**
 * Generate a combined hash for a turn (state + both player actions).
 *
 * This can be used to verify that a replay matches the original game.
 */
export function hashTurn(state, actionsA, actionsB) {
    const stateCanon = canonicalizeState(state);
    const actionsACanon = canonicalizeActions(actionsA);
    const actionsBCanon = canonicalizeActions(actionsB);
    const combined = `${stateCanon}||${actionsACanon}||${actionsBCanon}`;
    return hashToHex(combined);
}
/**
 * Verify that two states are identical by comparing their canonical forms.
 */
export function statesEqual(a, b) {
    return canonicalizeState(a) === canonicalizeState(b);
}
/**
 * Create a replay entry for a turn
 */
export function createReplayTurn(state, actionsA, actionsB, log) {
    return {
        turn: state.turn,
        stateHash: hashState(state),
        actionsA: [...actionsA],
        actionsB: [...actionsB],
        log,
    };
}
//# sourceMappingURL=canonical.js.map