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
import type { TurnInput, TurnResult } from "../core/types.js";
/**
 * Resolve a turn given the current state and both players' actions.
 *
 * This is the core of the game engine - completely deterministic.
 * Same inputs will always produce the same outputs.
 */
export declare function resolveTurn(input: TurnInput): TurnResult;
//# sourceMappingURL=pipeline.d.ts.map