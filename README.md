# @quantaris/engine

> Deterministic game logic for Quantaris — pure TypeScript, zero dependencies.

This is the canonical implementation of Quantaris game rules. The engine is 100% pure functions with no side effects, making it suitable for:

- Server-side turn resolution
- Client-side move preview
- Replay validation
- AI training and research
- Third-party tool development

## Installation

```bash
npm install @quantaris/engine
```

## Quick Start

```typescript
import {
  createInitialState,
  resolveTurn,
  validatePlayerActions,
  hashState,

ActionType,
  Direction,
  Player,
} from "@quantaris/engine";

// Create a new game
const state = createInitialState();

// Define player actions (use enums, never hardcoded strings!)
const actionsA = [
  { type: ActionType.Move, quantarId: "A1", direction: Direction.North },
  { type: ActionType.Pulse, quantarId: "A2", direction: Direction.North },
  { type: ActionType.Shield, quantarId: "A3" },
];

const actionsB = [
  { type: ActionType.Shield, quantarId: "B1" },
  { type: ActionType.Shield, quantarId: "B2" },
  { type: ActionType.Move, quantarId: "B3", direction: Direction.South },
];

// Validate before resolution
const validationA = validatePlayerActions(state, actionsA, Player.A);
const validationB = validatePlayerActions(state, actionsB, Player.B);

if (validationA.valid && validationB.valid) {
  // Resolve the turn
  const result = resolveTurn({ state, actionsA, actionsB });
  
  console.log("New state:", result.state);
  console.log("Turn log:", result.log);
  console.log("State hash:", hashState(result.state));
}
```

## Core Concepts

### Entities

- **Quantar**: Active units controlled by players (3 per player, 2 HP each)
- **Core**: Passive objectives (1 per player, 5 HP, destroy to win)

### Actions

Each Quantar can perform exactly one action per turn:

- `MOVE`: Move one cell orthogonally (N/E/S/W)
- `PULSE`: Fire a beam in a direction (hits first entity, 1 damage)
- `SHIELD`: Reduce incoming damage by 1 this turn

### Turn Resolution

Turns are resolved in a deterministic order:

1. **MOVE phase** — All moves applied simultaneously
2. **SHIELD phase** — Shields activated
3. **PULSE phase** — Beams fired from post-move positions
4. **DAMAGE phase** — All damage applied simultaneously
5. **CLEANUP** — Remove destroyed entities, check win condition

## API Reference

### State Management

```typescript
// Create initial game state
createInitialState(): GameState

// Query helpers
getQuantar(state, id): Quantar | undefined
getPlayerQuantars(state, playerId): Quantar[]
getPlayerCore(state, playerId): Core
getEntityAt(state, position): Entity | null
```

### Validation

```typescript
// Validate a single action
validateAction(state, action, playerId): ValidationResult

// Validate all actions for a turn
validatePlayerActions(state, actions, playerId): ValidationResult
```

### Resolution

```typescript
// Resolve a turn (pure function)
resolveTurn({ state, actionsA, actionsB }): TurnResult
```

### Hashing

```typescript
// Hash state for comparison/verification
hashState(state): string

// Check if two states are identical
statesEqual(a, b): boolean

// Canonical string representation
canonicalizeState(state): string
```

## Types

```typescript
type PlayerId = "A" | "B";
type Direction = "N" | "E" | "S" | "W";

interface Position {
  x: number; // 0-8
  y: number; // 0-8
}

interface Quantar {
  id: string;
  owner: PlayerId;
  position: Position;
  hp: number;
}

interface Core {
  owner: PlayerId;
  position: Position;
  hp: number;
}

interface GameState {
  turn: number;
  phase: GamePhase;        // GamePhase.Playing | GamePhase.Ended
  quantars: Quantar[];
  cores: { A: Core; B: Core };
  winner: PlayerId | null;
}

type Action = MoveAction | PulseAction | ShieldAction;

interface TurnResult {
  state: GameState;
  log: TurnLog;
}
```

## Enums (No Hardcoded Strings!)

**Always use these enums instead of string literals:**

```typescript
// Players
Player.A  // "A"
Player.B  // "B"

// Directions
Direction.North  // "N"
Direction.East   // "E"
Direction.South  // "S"
Direction.West   // "W"

// Action types
ActionType.Move    // "MOVE"
ActionType.Pulse   // "PULSE"
ActionType.Shield  // "SHIELD"

// Game phases (engine-level only)
GamePhase.Playing  // "playing"
GamePhase.Ended    // "ended"
```

## Constants

```typescript
BOARD_SIZE = 9          // 9x9 grid
CORE_HP = 5             // Core hit points
QUANTAR_HP = 2          // Quantar hit points
PULSE_DAMAGE = 1        // Damage per pulse hit
SHIELD_REDUCTION = 1    // Damage reduction from shield
QUANTARS_PER_PLAYER = 3 // Quantars per side
```

## Design Principles

1. **Pure Functions**: No side effects, no mutations, no external state
2. **Deterministic**: Same inputs always produce same outputs
3. **Zero Dependencies**: Works anywhere TypeScript runs
4. **Immutable Data**: All state objects are readonly

## License

MIT

---

*May the quants be with us.* ⚛️
