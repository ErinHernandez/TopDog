# Adapter Type Safety Documentation

**Date:** January 12, 2025  
**Status:** ✅ **UTILITIES CREATED**  
**File:** `lib/adapters/types.ts`

---

## Overview

Type-safe interfaces and type guards for adapter pattern implementations. Provides type safety for data transformation layers, improving maintainability and catching errors at compile time.

---

## Features

### Type-Safe Adapters
- **DataAdapter Interface** - Generic adapter interface with type parameters
- **Type Guards** - Runtime type checking for validation
- **Error Handling** - AdapterError class for error tracking
- **Safe Adapters** - Safe transformation mode (returns result instead of throwing)

### Validation
- **Input Validation** - Validate source data before transformation
- **Output Validation** - Validate transformed data after transformation
- **Schema Validators** - Create validators from schema definitions
- **Composite Validators** - Combine validators with AND/OR logic

### Utilities
- **Identity Adapter** - No transformation (pass-through)
- **Map Adapter** - Apply function to each item
- **Filter Adapter** - Filter then transform

---

## Usage

### Basic Adapter

```typescript
import { createAdapter, DataAdapter } from '@/lib/adapters/types';

interface RawPlayer {
  name: string;
  position: string;
  team: string;
  adp?: number;
}

interface Player {
  name: string;
  position: string;
  team: string;
  adp: number;
}

const playerAdapter: DataAdapter<RawPlayer, Player> = createAdapter({
  transform: (raw) => ({
    name: raw.name,
    position: raw.position,
    team: raw.team,
    adp: raw.adp || 999, // Default value
  }),
  validate: (source): source is RawPlayer => {
    return (
      typeof source === 'object' &&
      source !== null &&
      'name' in source &&
      'position' in source &&
      'team' in source
    );
  },
});

// Use adapter
const rawPlayer: RawPlayer = { name: 'Patrick Mahomes', position: 'QB', team: 'KC' };
const player = playerAdapter.transform(rawPlayer);
```

### Adapter with Validation

```typescript
import { createAdapter, hasRequiredFields } from '@/lib/adapters/types';

const playerAdapter = createAdapter({
  transform: (raw: RawPlayer): Player => ({
    name: raw.name,
    position: raw.position,
    team: raw.team,
    adp: raw.adp || 999,
  }),
  validate: (source): source is RawPlayer => {
    return hasRequiredFields<RawPlayer>(source, ['name', 'position', 'team']);
  },
  validateOutput: (data): data is Player => {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.name === 'string' &&
      typeof data.position === 'string' &&
      typeof data.team === 'string' &&
      typeof data.adp === 'number'
    );
  },
});
```

### Safe Adapter (Error Handling)

```typescript
import { createSafeAdapter } from '@/lib/adapters/types';

const safePlayerAdapter = createSafeAdapter({
  transform: (raw: RawPlayer): Player => ({
    name: raw.name,
    position: raw.position,
    team: raw.team,
    adp: raw.adp || 999,
  }),
});

// Returns result instead of throwing
const result = safePlayerAdapter.transform(rawPlayer);
if (result.success) {
  console.log('Player:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Batch Transformation

```typescript
const playerAdapter = createAdapter({
  transform: (raw: RawPlayer): Player => ({ ... }),
  transformBatch: (raws: RawPlayer[]): Player[] => {
    // Custom batch logic
    return raws.map(raw => transform(raw));
  },
});

// Transform batch
const players = playerAdapter.transformBatch(rawPlayers);
```

### Reverse Transformation

```typescript
const playerAdapter = createAdapter({
  transform: (raw: RawPlayer): Player => ({
    name: raw.name,
    position: raw.position,
    team: raw.team,
    adp: raw.adp || 999,
  }),
  reverseTransform: (player: Player): RawPlayer => ({
    name: player.name,
    position: player.position,
    team: player.team,
    adp: player.adp === 999 ? undefined : player.adp,
  }),
});

// Transform and reverse
const player = playerAdapter.transform(rawPlayer);
const raw = playerAdapter.reverseTransform?.(player);
```

---

## Type Guards

### Built-in Type Guards

```typescript
import {
  isString,
  isNumber,
  isArray,
  isObject,
  hasRequiredFields,
  isAdapter,
} from '@/lib/adapters/types';

// String type guard
if (isString(value)) {
  // value is string
}

// Number type guard
if (isNumber(value)) {
  // value is number
}

// Array type guard
if (isArray<Player>(value)) {
  // value is Player[]
}

// Object type guard
if (isObject(value)) {
  // value is Record<string, unknown>
}

// Required fields type guard
if (hasRequiredFields<Player>(value, ['name', 'position'])) {
  // value has name and position
}

// Adapter type guard
if (isAdapter<RawPlayer, Player>(value)) {
  // value is DataAdapter<RawPlayer, Player>
}
```

### Schema Validator

```typescript
import { createValidator } from '@/lib/adapters/types';

const playerValidator = createValidator<Player>({
  name: (v) => typeof v === 'string' && v.length > 0,
  position: (v) => typeof v === 'string' && ['QB', 'RB', 'WR', 'TE'].includes(v),
  team: (v) => typeof v === 'string' && v.length > 0,
  adp: (v) => typeof v === 'number' && v >= 0,
});

if (playerValidator(data)) {
  // data is Player
}
```

### Composite Validators

```typescript
import { andValidators, orValidators } from '@/lib/adapters/types';

const validator1 = (v: unknown): v is Player => /* ... */;
const validator2 = (v: unknown): v is Player => /* ... */;

// AND validator (both must pass)
const andValidator = andValidators(validator1, validator2);

// OR validator (either must pass)
const orValidator = orValidators(validator1, validator2);
```

---

## Error Handling

### AdapterError

```typescript
import { AdapterError } from '@/lib/adapters/types';

try {
  const player = playerAdapter.transform(rawPlayer);
} catch (error) {
  if (error instanceof AdapterError) {
    console.error('Adapter error:', error.message);
    console.error('Source data:', error.source);
    console.error('Cause:', error.cause);
  }
}
```

### Safe Adapter Pattern

```typescript
const safeAdapter = createSafeAdapter({
  transform: (raw: RawPlayer): Player => ({ ... }),
});

const result = safeAdapter.transform(rawPlayer);
if (!result.success) {
  // Handle error
  console.error('Transformation failed:', result.error);
  console.error('Source:', result.source);
  return;
}

// Use result.data
const player = result.data;
```

---

## Common Adapters

### Identity Adapter

```typescript
import { identityAdapter } from '@/lib/adapters/types';

const identity = identityAdapter<string>();
const result = identity.transform('hello'); // Returns 'hello'
```

### Map Adapter

```typescript
import { mapAdapter } from '@/lib/adapters/types';

const stringToNumber = mapAdapter<string, number>((str) => parseInt(str, 10));
const number = stringToNumber.transform('123'); // Returns 123
```

### Filter Adapter

```typescript
import { filterAdapter } from '@/lib/adapters/types';

const validPlayers = filterAdapter<RawPlayer, Player>(
  (raw) => raw.name && raw.position && raw.team,
  (raw) => ({ name: raw.name, position: raw.position, team: raw.team, adp: raw.adp || 999 })
);

const players = validPlayers.transform(rawPlayers); // Returns Player[]
```

---

## Integration Example

### NFL API Adapter

```typescript
import { createAdapter, hasRequiredFields } from '@/lib/adapters/types';

interface RawNFLPlayer {
  PlayerID: number;
  Name: string;
  Position: string;
  Team: string;
  ADP?: number;
}

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  adp: number;
}

const nflPlayerAdapter = createAdapter<RawNFLPlayer, Player>({
  transform: (raw) => ({
    id: String(raw.PlayerID),
    name: raw.Name,
    position: raw.Position,
    team: raw.Team,
    adp: raw.ADP || 999,
  }),
  validate: (source): source is RawNFLPlayer => {
    return hasRequiredFields<RawNFLPlayer>(source, ['PlayerID', 'Name', 'Position', 'Team']);
  },
  validateOutput: (data): data is Player => {
    return hasRequiredFields<Player>(data, ['id', 'name', 'position', 'team', 'adp']);
  },
});
```

---

## Benefits

### Type Safety
- Compile-time type checking
- Prevents type errors at runtime
- Better IDE autocomplete

### Validation
- Runtime validation of data
- Catches data issues early
- Clear error messages

### Maintainability
- Clear transformation contracts
- Reusable adapter utilities
- Easy to test

### Error Handling
- Structured error handling
- Error tracking with source data
- Safe transformation mode

---

## Migration Guide

### Before (Unsafe)

```javascript
function transformPlayer(raw) {
  return {
    name: raw.name,
    position: raw.position,
    team: raw.team,
    adp: raw.adp || 999,
  };
}
```

### After (Type-Safe)

```typescript
const playerAdapter = createAdapter<RawPlayer, Player>({
  transform: (raw) => ({
    name: raw.name,
    position: raw.position,
    team: raw.team,
    adp: raw.adp || 999,
  }),
  validate: (source): source is RawPlayer => {
    return hasRequiredFields<RawPlayer>(source, ['name', 'position', 'team']);
  },
});
```

---

## Related Documentation

- `lib/adapters/types.ts` - Implementation
- `lib/nfl/apiAdapter.js` - NFL API adapter example (can be migrated)
- TypeScript Type Guards Documentation

---

**Implementation Date:** January 12, 2025  
**Status:** ✅ **UTILITIES CREATED** - Ready for integration
