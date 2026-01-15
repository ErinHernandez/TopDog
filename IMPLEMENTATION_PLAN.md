# Implementation Plan: Testing, Offline Support & Observability

This document provides a detailed implementation plan for five key enhancements to the bestball-site codebase. Each task includes background context, implementation details, file locations, test strategies, and acceptance criteria.

---

## Table of Contents

1. [Unit Tests for Snake Draft Calculations](#1-unit-tests-for-snake-draft-calculations)
2. [Integration Tests for Payment Webhooks](#2-integration-tests-for-payment-webhooks)
3. [Local Adapter for Offline Support](#3-local-adapter-for-offline-support)
4. [Audit Logging for Draft Actions](#4-audit-logging-for-draft-actions)
5. [Retry Logic for Firebase Adapter Operations](#5-retry-logic-for-firebase-adapter-operations)

---

## 1. Unit Tests for Snake Draft Calculations

### Background

The snake draft calculation utilities are located in `/components/vx2/draft-logic/utils/snakeDraft.ts`. These pure functions calculate participant positions in a snake draft pattern where odd rounds go forward (0→11) and even rounds go backward (11→0).

### Current State

- **Implementation**: Complete with 12 functions
- **Existing Tests**: Partial coverage in `__tests__/draft-state.test.js` (tests `getParticipantForPick`, `getRoundForPick`, `getPickInRound`, `isSnakeRound`)
- **Missing Tests**: `getPickNumbersForParticipant`, `isPickForParticipant`, `getPicksUntilTurn`, `getNextPickForParticipant`, `formatPickNumber`, `parsePickNumber`, `isValidPickNumber`, `getTotalPicks`

### Implementation Details

#### New Test File: `__tests__/lib/snakeDraft.test.ts`

```typescript
/**
 * Comprehensive unit tests for snake draft calculations
 *
 * Target: 100% coverage of all snake draft utility functions
 * Located: components/vx2/draft-logic/utils/snakeDraft.ts
 */

describe('Snake Draft Calculations', () => {
  // Test configuration constants
  const DEFAULT_TEAM_COUNT = 12;
  const DEFAULT_ROUNDS = 18;
  const TOTAL_PICKS = 216; // 12 × 18

  describe('getParticipantForPick', () => {
    describe('Round 1 (forward order: 0→11)', () => {
      test.each([
        [1, 0],   // First pick → participant 0
        [6, 5],   // Middle pick
        [12, 11], // Last pick of round → participant 11
      ])('pick %i → participant %i', (pick, expected) => {
        expect(getParticipantForPick(pick, 12)).toBe(expected);
      });
    });

    describe('Round 2 (snake order: 11→0)', () => {
      test.each([
        [13, 11], // First pick of round 2 → participant 11
        [18, 6],  // Middle pick
        [24, 0],  // Last pick of round 2 → participant 0
      ])('pick %i → participant %i', (pick, expected) => {
        expect(getParticipantForPick(pick, 12)).toBe(expected);
      });
    });

    describe('Round 3 (forward order again)', () => {
      test.each([
        [25, 0],  // First pick → back to participant 0
        [36, 11], // Last pick
      ])('pick %i → participant %i', (pick, expected) => {
        expect(getParticipantForPick(pick, 12)).toBe(expected);
      });
    });

    describe('edge cases', () => {
      test('pick 0 returns 0', () => {
        expect(getParticipantForPick(0, 12)).toBe(0);
      });

      test('negative pick returns 0', () => {
        expect(getParticipantForPick(-5, 12)).toBe(0);
      });

      test('handles non-12 team counts', () => {
        expect(getParticipantForPick(1, 10)).toBe(0);
        expect(getParticipantForPick(11, 10)).toBe(0); // Snake back
      });

      test('handles last pick of draft (pick 216)', () => {
        expect(getParticipantForPick(216, 12)).toBe(0); // Round 18 (even), last pick
      });
    });
  });

  describe('getRoundForPick', () => {
    test.each([
      [1, 1],    // Start of round 1
      [12, 1],   // End of round 1
      [13, 2],   // Start of round 2
      [24, 2],   // End of round 2
      [25, 3],   // Start of round 3
      [216, 18], // Last pick of draft
    ])('pick %i → round %i', (pick, expectedRound) => {
      expect(getRoundForPick(pick, 12)).toBe(expectedRound);
    });

    test('handles edge cases', () => {
      expect(getRoundForPick(0, 12)).toBe(1);
      expect(getRoundForPick(-1, 12)).toBe(1);
    });
  });

  describe('getPickInRound', () => {
    test.each([
      [1, 1],   // First pick in round 1
      [12, 12], // Last pick in round 1
      [13, 1],  // First pick in round 2
      [15, 3],  // Third pick in round 2
      [24, 12], // Last pick in round 2
    ])('pick %i → position %i in round', (pick, expectedPosition) => {
      expect(getPickInRound(pick, 12)).toBe(expectedPosition);
    });
  });

  describe('isSnakeRound', () => {
    test('odd rounds are NOT snake rounds (forward order)', () => {
      expect(isSnakeRound(1)).toBe(false);
      expect(isSnakeRound(3)).toBe(false);
      expect(isSnakeRound(17)).toBe(false);
    });

    test('even rounds ARE snake rounds (reverse order)', () => {
      expect(isSnakeRound(2)).toBe(true);
      expect(isSnakeRound(4)).toBe(true);
      expect(isSnakeRound(18)).toBe(true);
    });
  });

  describe('getPickNumbersForParticipant', () => {
    test('participant 0 gets picks at positions 1, 24, 25, 48...', () => {
      const picks = getPickNumbersForParticipant(0, 12, 18);
      expect(picks).toHaveLength(18);
      expect(picks[0]).toBe(1);   // Round 1, first pick
      expect(picks[1]).toBe(24);  // Round 2, last pick (snake)
      expect(picks[2]).toBe(25);  // Round 3, first pick
      expect(picks[17]).toBe(216); // Round 18, last pick
    });

    test('participant 11 gets picks at positions 12, 13, 36, 37...', () => {
      const picks = getPickNumbersForParticipant(11, 12, 18);
      expect(picks).toHaveLength(18);
      expect(picks[0]).toBe(12);  // Round 1, last pick
      expect(picks[1]).toBe(13);  // Round 2, first pick (snake)
    });

    test('middle participant (5) pattern', () => {
      const picks = getPickNumbersForParticipant(5, 12, 18);
      expect(picks).toHaveLength(18);
      expect(picks[0]).toBe(6);   // Round 1, pick 6
      expect(picks[1]).toBe(19);  // Round 2, pick 7 (position 6 from end = 19)
    });
  });

  describe('isPickForParticipant', () => {
    test('returns true when pick belongs to participant', () => {
      expect(isPickForParticipant(1, 0, 12)).toBe(true);
      expect(isPickForParticipant(12, 11, 12)).toBe(true);
      expect(isPickForParticipant(13, 11, 12)).toBe(true); // Snake
    });

    test('returns false when pick does not belong to participant', () => {
      expect(isPickForParticipant(1, 1, 12)).toBe(false);
      expect(isPickForParticipant(12, 0, 12)).toBe(false);
    });
  });

  describe('getPicksUntilTurn', () => {
    test('returns 0 when it is already their turn', () => {
      expect(getPicksUntilTurn(1, 0, 12, 18)).toBe(0);
      expect(getPicksUntilTurn(13, 11, 12, 18)).toBe(0);
    });

    test('calculates distance to next pick correctly', () => {
      // Current pick 5, participant 0's next pick is 24
      expect(getPicksUntilTurn(5, 0, 12, 18)).toBe(19);
    });

    test('returns -1 when no more picks remaining', () => {
      // After last pick (216), no one has more picks
      expect(getPicksUntilTurn(217, 0, 12, 18)).toBe(-1);
    });
  });

  describe('getNextPickForParticipant', () => {
    test('returns next pick number', () => {
      expect(getNextPickForParticipant(1, 0, 12, 18)).toBe(24);
      expect(getNextPickForParticipant(12, 11, 12, 18)).toBe(13);
    });

    test('returns null when no more picks', () => {
      expect(getNextPickForParticipant(216, 0, 12, 18)).toBe(null);
    });
  });

  describe('formatPickNumber', () => {
    test.each([
      [1, '1.01'],
      [12, '1.12'],
      [13, '2.01'],
      [145, '13.01'],
      [216, '18.12'],
    ])('pick %i → "%s"', (pick, expected) => {
      expect(formatPickNumber(pick, 12)).toBe(expected);
    });
  });

  describe('parsePickNumber', () => {
    test.each([
      ['1.01', 1],
      ['1.12', 12],
      ['2.01', 13],
      ['13.01', 145],
      ['18.12', 216],
    ])('"%s" → pick %i', (formatted, expected) => {
      expect(parsePickNumber(formatted, 12)).toBe(expected);
    });

    test('returns null for invalid formats', () => {
      expect(parsePickNumber('invalid', 12)).toBe(null);
      expect(parsePickNumber('1-01', 12)).toBe(null);
      expect(parsePickNumber('', 12)).toBe(null);
    });

    test('returns null for out-of-range values', () => {
      expect(parsePickNumber('0.01', 12)).toBe(null);  // Round 0 invalid
      expect(parsePickNumber('1.13', 12)).toBe(null);  // Pick 13 in 12-team
      expect(parsePickNumber('1.00', 12)).toBe(null);  // Pick 0 invalid
    });
  });

  describe('isValidPickNumber', () => {
    test('validates pick is within range', () => {
      expect(isValidPickNumber(1, 12, 18)).toBe(true);
      expect(isValidPickNumber(216, 12, 18)).toBe(true);
      expect(isValidPickNumber(100, 12, 18)).toBe(true);
    });

    test('rejects out-of-range picks', () => {
      expect(isValidPickNumber(0, 12, 18)).toBe(false);
      expect(isValidPickNumber(-1, 12, 18)).toBe(false);
      expect(isValidPickNumber(217, 12, 18)).toBe(false);
      expect(isValidPickNumber(1000, 12, 18)).toBe(false);
    });
  });

  describe('getTotalPicks', () => {
    test('calculates total picks correctly', () => {
      expect(getTotalPicks(12, 18)).toBe(216);
      expect(getTotalPicks(10, 20)).toBe(200);
      expect(getTotalPicks(8, 15)).toBe(120);
    });
  });

  describe('round-trip consistency', () => {
    test('format/parse round-trip preserves pick number', () => {
      for (let pick = 1; pick <= 216; pick++) {
        const formatted = formatPickNumber(pick, 12);
        const parsed = parsePickNumber(formatted, 12);
        expect(parsed).toBe(pick);
      }
    });

    test('all picks map to exactly one participant', () => {
      const participantPicks = new Map<number, number[]>();

      for (let pick = 1; pick <= 216; pick++) {
        const participant = getParticipantForPick(pick, 12);
        if (!participantPicks.has(participant)) {
          participantPicks.set(participant, []);
        }
        participantPicks.get(participant)!.push(pick);
      }

      // Each participant should have exactly 18 picks
      for (let p = 0; p < 12; p++) {
        expect(participantPicks.get(p)).toHaveLength(18);
      }
    });
  });
});
```

### Acceptance Criteria

- [ ] 100% line coverage for `snakeDraft.ts`
- [ ] All 12 functions have dedicated test suites
- [ ] Edge cases covered (0, negative, boundary values)
- [ ] Property-based tests for round-trip consistency
- [ ] Tests pass in CI pipeline

---

## 2. Integration Tests for Payment Webhooks

### Background

The application processes webhooks from four payment providers: Stripe, Paystack, PayMongo, and Xendit. Each webhook handler must verify signatures, process events idempotently, and update user balances atomically.

### Current State

- **Existing Tests**: `__tests__/api/stripe-webhook.test.js` exists with basic coverage
- **Missing**: Full integration tests simulating real webhook flows with mocked Firebase

### Implementation Details

#### Test Infrastructure Enhancements

**1. Webhook Test Factory (`__tests__/factories/webhookEvents.ts`)**

```typescript
/**
 * Factory functions for creating realistic webhook payloads
 */

export const webhookFactories = {
  stripe: {
    paymentIntentSucceeded: (overrides = {}) => ({
      id: `evt_${randomId()}`,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: `pi_${randomId()}`,
          amount: 5000,
          currency: 'usd',
          metadata: {
            firebaseUserId: `user_${randomId()}`,
          },
          payment_method: `pm_${randomId()}`,
          ...overrides,
        },
      },
      livemode: false,
      api_version: '2025-07-30.basil',
    }),

    paymentIntentFailed: (overrides = {}) => ({ /* ... */ }),
    transferCreated: (overrides = {}) => ({ /* ... */ }),
    disputeCreated: (overrides = {}) => ({ /* ... */ }),
    chargeRefunded: (overrides = {}) => ({ /* ... */ }),
  },

  paystack: {
    chargeSuccess: (overrides = {}) => ({
      event: 'charge.success',
      data: {
        reference: `ref_${randomId()}`,
        amount: 500000, // Amount in kobo
        currency: 'NGN',
        customer: {
          email: 'user@example.com',
        },
        metadata: {
          firebaseUserId: `user_${randomId()}`,
        },
        ...overrides,
      },
    }),

    transferSuccess: (overrides = {}) => ({ /* ... */ }),
    transferFailed: (overrides = {}) => ({ /* ... */ }),
  },

  paymongo: {
    paymentPaid: (overrides = {}) => ({ /* ... */ }),
    paymentFailed: (overrides = {}) => ({ /* ... */ }),
  },

  xendit: {
    virtualAccountPaid: (overrides = {}) => ({ /* ... */ }),
    ewalletPaid: (overrides = {}) => ({ /* ... */ }),
  },
};
```

**2. Firebase Mock Enhancement (`__tests__/__mocks__/firebase-admin.ts`)**

```typescript
/**
 * Enhanced Firebase Admin mock for webhook integration tests
 */

const mockFirestore = {
  transactions: new Map(),
  users: new Map(),
  webhookEvents: new Map(),

  collection: jest.fn((name) => ({
    doc: jest.fn((id) => ({
      get: jest.fn(async () => {
        const data = mockFirestore[name]?.get(id);
        return { exists: !!data, data: () => data, id };
      }),
      set: jest.fn(async (data) => {
        mockFirestore[name]?.set(id, data);
      }),
      update: jest.fn(async (data) => {
        const existing = mockFirestore[name]?.get(id) || {};
        mockFirestore[name]?.set(id, { ...existing, ...data });
      }),
    })),
    where: jest.fn(() => ({
      get: jest.fn(async () => ({
        empty: true,
        docs: [],
      })),
    })),
  })),

  runTransaction: jest.fn(async (callback) => {
    // Simulate Firestore transaction behavior
    const transaction = {
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
    };
    return callback(transaction);
  }),

  // Helper to reset state between tests
  _reset: () => {
    mockFirestore.transactions.clear();
    mockFirestore.users.clear();
    mockFirestore.webhookEvents.clear();
  },
};
```

**3. Integration Test Suite (`__tests__/integration/webhooks/stripe.integration.test.ts`)**

```typescript
/**
 * Stripe Webhook Integration Tests
 *
 * Tests the full webhook processing flow:
 * 1. Signature verification
 * 2. Event parsing
 * 3. Business logic execution
 * 4. Database updates
 * 5. Idempotency handling
 */

describe('Stripe Webhook Integration', () => {
  let mockFirestore;

  beforeEach(() => {
    mockFirestore._reset();
    // Seed initial user data
    mockFirestore.users.set('user_123', {
      balanceCents: 10000,
      email: 'test@example.com',
    });
  });

  describe('payment_intent.succeeded', () => {
    test('credits user balance and creates transaction', async () => {
      const event = webhookFactories.stripe.paymentIntentSucceeded({
        amount: 5000,
        metadata: { firebaseUserId: 'user_123' },
      });

      const response = await sendWebhook('/api/stripe/webhook', event);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
      expect(response.body.actions).toContain('balance_credited');

      // Verify database state
      const user = mockFirestore.users.get('user_123');
      expect(user.balanceCents).toBe(15000); // 10000 + 5000

      const transactions = Array.from(mockFirestore.transactions.values());
      expect(transactions).toHaveLength(1);
      expect(transactions[0].type).toBe('deposit');
      expect(transactions[0].amountCents).toBe(5000);
    });

    test('handles duplicate events idempotently', async () => {
      const event = webhookFactories.stripe.paymentIntentSucceeded({
        amount: 5000,
        metadata: { firebaseUserId: 'user_123' },
      });

      // First webhook
      await sendWebhook('/api/stripe/webhook', event);

      // Duplicate webhook (same event ID)
      const response = await sendWebhook('/api/stripe/webhook', event);

      expect(response.status).toBe(200);
      expect(response.body.actions).toContain('already_processed');

      // Balance should NOT be double-credited
      const user = mockFirestore.users.get('user_123');
      expect(user.balanceCents).toBe(15000);
    });

    test('records transaction with correct currency', async () => {
      const event = webhookFactories.stripe.paymentIntentSucceeded({
        amount: 5000,
        currency: 'eur',
        metadata: { firebaseUserId: 'user_123' },
      });

      await sendWebhook('/api/stripe/webhook', event);

      const transactions = Array.from(mockFirestore.transactions.values());
      expect(transactions[0].currency).toBe('EUR');
    });
  });

  describe('charge.dispute.created', () => {
    test('flags user account and logs security event', async () => {
      const event = webhookFactories.stripe.disputeCreated({
        amount: 5000,
        paymentIntent: 'pi_existing',
      });

      // Pre-seed transaction
      mockFirestore.transactions.set('tx_1', {
        stripePaymentIntentId: 'pi_existing',
        userId: 'user_123',
      });

      const response = await sendWebhook('/api/stripe/webhook', event);

      expect(response.status).toBe(200);
      expect(response.body.actions).toContain('user_flagged');

      const user = mockFirestore.users.get('user_123');
      expect(user.paymentFlagged).toBe(true);
      expect(user.paymentFlagReason).toBe('Dispute received');
    });
  });

  describe('signature verification', () => {
    test('rejects invalid signatures', async () => {
      const event = webhookFactories.stripe.paymentIntentSucceeded();

      const response = await sendWebhook('/api/stripe/webhook', event, {
        signature: 'invalid_signature',
      });

      expect(response.status).toBe(200); // Always 200 for webhooks
      expect(response.body.received).toBe(false);
      expect(response.body.error).toContain('signature');
    });

    test('rejects missing signatures', async () => {
      const event = webhookFactories.stripe.paymentIntentSucceeded();

      const response = await sendWebhook('/api/stripe/webhook', event, {
        omitSignature: true,
      });

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(false);
    });
  });

  describe('error handling', () => {
    test('returns 200 even on processing errors (prevents retries)', async () => {
      const event = webhookFactories.stripe.paymentIntentSucceeded({
        metadata: {}, // Missing firebaseUserId
      });

      const response = await sendWebhook('/api/stripe/webhook', event);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('firebaseUserId');
    });
  });
});
```

**4. Similar test files for other providers:**
- `__tests__/integration/webhooks/paystack.integration.test.ts`
- `__tests__/integration/webhooks/paymongo.integration.test.ts`
- `__tests__/integration/webhooks/xendit.integration.test.ts`

### Test Scenarios Matrix

| Provider | Event Type | Happy Path | Idempotency | Error Cases |
|----------|------------|------------|-------------|-------------|
| Stripe | payment_intent.succeeded | ✓ | ✓ | Missing userId |
| Stripe | payment_intent.payment_failed | ✓ | ✓ | - |
| Stripe | charge.dispute.created | ✓ | ✓ | Missing transaction |
| Stripe | charge.refunded | ✓ | ✓ | - |
| Stripe | transfer.created | ✓ | ✓ | - |
| Paystack | charge.success | ✓ | ✓ | Invalid reference |
| Paystack | transfer.success | ✓ | ✓ | - |
| PayMongo | payment.paid | ✓ | ✓ | - |
| Xendit | virtual_account.paid | ✓ | ✓ | - |

### Acceptance Criteria

- [ ] All 4 webhook handlers have integration tests
- [ ] Idempotency verified for all event types
- [ ] Signature verification tested
- [ ] Error handling returns 200 (webhook requirement)
- [ ] Firebase transactions tested with mocked Firestore
- [ ] 95%+ coverage for webhook handlers (per jest.config.js)

---

## 3. Local Adapter for Offline Support

### Background

The application needs offline support for draft functionality, allowing users to continue drafting even when network connectivity is lost. This requires a local storage adapter that mirrors the Firebase adapter interface.

### Current State

- **Adapter Pattern**: Defined in `/lib/adapters/types.ts`
- **Firebase Client**: `/lib/firebase.ts` has IndexedDB persistence enabled
- **No Local Adapter**: Currently no fallback for offline operations

### Implementation Details

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DataAdapter Interface                   │
│  transform(), validate(), validateOutput(), reverseTransform │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
   ┌─────┴─────┐       ┌─────┴─────┐       ┌─────┴─────┐
   │ Firebase  │       │   Local   │       │  Hybrid   │
   │  Adapter  │       │  Adapter  │       │  Adapter  │
   └───────────┘       └───────────┘       └───────────┘
         │                    │                    │
         │                    │                    │
   ┌─────┴─────┐       ┌─────┴─────┐              │
   │ Firestore │       │IndexedDB/ │              │
   │           │       │LocalStorage              │
   └───────────┘       └───────────┘              │
                                                  │
                              ┌────────────────────┘
                              │
                     (syncs when online)
```

#### New Files

**1. Local Storage Adapter (`/lib/adapters/localStorage.ts`)**

```typescript
/**
 * Local Storage Adapter for Offline Support
 *
 * Provides offline-first data persistence using IndexedDB (via idb-keyval)
 * with automatic sync to Firebase when connectivity returns.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DataAdapter, AdapterResult, AdapterError } from './types';

// Database schema
interface BestballDB extends DBSchema {
  draftState: {
    key: string;
    value: {
      roomId: string;
      state: DraftState;
      lastModified: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
  };
  picks: {
    key: string;
    value: {
      id: string;
      roomId: string;
      pickNumber: number;
      playerId: string;
      participantId: string;
      timestamp: number;
      syncStatus: 'synced' | 'pending';
    };
    indexes: { 'by-room': string; 'by-sync-status': string };
  };
  pendingOperations: {
    key: string;
    value: {
      id: string;
      type: 'pick' | 'queue_update' | 'timer_update';
      payload: unknown;
      createdAt: number;
      retryCount: number;
    };
  };
}

const DB_NAME = 'bestball-offline';
const DB_VERSION = 1;

class LocalStorageAdapter {
  private db: IDBPDatabase<BestballDB> | null = null;
  private syncInProgress = false;
  private onlineHandler: (() => void) | null = null;

  async initialize(): Promise<void> {
    this.db = await openDB<BestballDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Draft state store
        db.createObjectStore('draftState', { keyPath: 'roomId' });

        // Picks store with indexes
        const picksStore = db.createObjectStore('picks', { keyPath: 'id' });
        picksStore.createIndex('by-room', 'roomId');
        picksStore.createIndex('by-sync-status', 'syncStatus');

        // Pending operations queue
        db.createObjectStore('pendingOperations', { keyPath: 'id' });
      },
    });

    // Set up online/offline listeners
    this.setupConnectivityListeners();
  }

  private setupConnectivityListeners(): void {
    if (typeof window === 'undefined') return;

    this.onlineHandler = () => {
      this.syncPendingOperations();
    };

    window.addEventListener('online', this.onlineHandler);
  }

  // =========================================================================
  // DRAFT STATE OPERATIONS
  // =========================================================================

  async getDraftState(roomId: string): Promise<DraftState | null> {
    if (!this.db) throw new AdapterError('Database not initialized');

    const record = await this.db.get('draftState', roomId);
    return record?.state ?? null;
  }

  async saveDraftState(roomId: string, state: DraftState): Promise<void> {
    if (!this.db) throw new AdapterError('Database not initialized');

    await this.db.put('draftState', {
      roomId,
      state,
      lastModified: Date.now(),
      syncStatus: navigator.onLine ? 'synced' : 'pending',
    });

    if (!navigator.onLine) {
      await this.queueOperation('draft_state_update', { roomId, state });
    }
  }

  // =========================================================================
  // PICK OPERATIONS
  // =========================================================================

  async savePick(pick: Pick): Promise<void> {
    if (!this.db) throw new AdapterError('Database not initialized');

    const pickRecord = {
      id: `${pick.roomId}_${pick.pickNumber}`,
      ...pick,
      timestamp: Date.now(),
      syncStatus: navigator.onLine ? 'synced' : 'pending' as const,
    };

    await this.db.put('picks', pickRecord);

    if (!navigator.onLine) {
      await this.queueOperation('pick', pick);
    }
  }

  async getPicksForRoom(roomId: string): Promise<Pick[]> {
    if (!this.db) throw new AdapterError('Database not initialized');

    const picks = await this.db.getAllFromIndex('picks', 'by-room', roomId);
    return picks.sort((a, b) => a.pickNumber - b.pickNumber);
  }

  // =========================================================================
  // SYNC OPERATIONS
  // =========================================================================

  private async queueOperation(type: string, payload: unknown): Promise<void> {
    if (!this.db) return;

    await this.db.put('pendingOperations', {
      id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: type as 'pick' | 'queue_update' | 'timer_update',
      payload,
      createdAt: Date.now(),
      retryCount: 0,
    });
  }

  async syncPendingOperations(): Promise<SyncResult> {
    if (!this.db || this.syncInProgress || !navigator.onLine) {
      return { synced: 0, failed: 0, pending: 0 };
    }

    this.syncInProgress = true;
    const result = { synced: 0, failed: 0, pending: 0 };

    try {
      const operations = await this.db.getAll('pendingOperations');
      result.pending = operations.length;

      for (const op of operations) {
        try {
          await this.syncOperation(op);
          await this.db.delete('pendingOperations', op.id);
          result.synced++;
        } catch (error) {
          op.retryCount++;
          if (op.retryCount < 3) {
            await this.db.put('pendingOperations', op);
          } else {
            // Move to dead letter queue or notify user
            console.error('Operation failed after 3 retries:', op);
            await this.db.delete('pendingOperations', op.id);
          }
          result.failed++;
        }
      }
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  private async syncOperation(op: PendingOperation): Promise<void> {
    // Sync to Firebase based on operation type
    switch (op.type) {
      case 'pick':
        await firebaseAdapter.submitPick(op.payload as Pick);
        break;
      case 'queue_update':
        await firebaseAdapter.updateQueue(op.payload as QueueUpdate);
        break;
      default:
        console.warn('Unknown operation type:', op.type);
    }
  }

  // =========================================================================
  // CONFLICT RESOLUTION
  // =========================================================================

  async detectConflicts(roomId: string): Promise<ConflictResult> {
    const localState = await this.getDraftState(roomId);
    const remoteState = await firebaseAdapter.getDraftState(roomId);

    if (!localState || !remoteState) {
      return { hasConflict: false };
    }

    // Compare pick counts to detect divergence
    if (localState.picks.length !== remoteState.picks.length) {
      return {
        hasConflict: true,
        localPickCount: localState.picks.length,
        remotePickCount: remoteState.picks.length,
        resolution: 'remote_wins', // Server is source of truth
      };
    }

    return { hasConflict: false };
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  async clearOfflineData(): Promise<void> {
    if (!this.db) return;

    await this.db.clear('draftState');
    await this.db.clear('picks');
    await this.db.clear('pendingOperations');
  }

  destroy(): void {
    if (this.onlineHandler && typeof window !== 'undefined') {
      window.removeEventListener('online', this.onlineHandler);
    }
    this.db?.close();
  }
}

export const localStorageAdapter = new LocalStorageAdapter();
```

**2. Hybrid Adapter (`/lib/adapters/hybrid.ts`)**

```typescript
/**
 * Hybrid Adapter - Firebase with Local Fallback
 *
 * Provides seamless online/offline experience by:
 * 1. Using Firebase when online
 * 2. Falling back to local storage when offline
 * 3. Syncing local changes when connectivity returns
 */

class HybridAdapter {
  private isOnline: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  private handleOnline(): void {
    this.isOnline = true;
    localStorageAdapter.syncPendingOperations();
  }

  private handleOffline(): void {
    this.isOnline = false;
  }

  async getDraftState(roomId: string): Promise<DraftState | null> {
    if (this.isOnline) {
      try {
        const state = await firebaseAdapter.getDraftState(roomId);
        // Cache locally for offline access
        await localStorageAdapter.saveDraftState(roomId, state);
        return state;
      } catch (error) {
        // Fallback to local
        return localStorageAdapter.getDraftState(roomId);
      }
    }
    return localStorageAdapter.getDraftState(roomId);
  }

  async submitPick(pick: Pick): Promise<SubmitResult> {
    // Always save locally first (optimistic update)
    await localStorageAdapter.savePick(pick);

    if (this.isOnline) {
      try {
        const result = await firebaseAdapter.submitPick(pick);
        return result;
      } catch (error) {
        // Already saved locally, will sync later
        return { success: true, offline: true };
      }
    }

    return { success: true, offline: true };
  }
}

export const hybridAdapter = new HybridAdapter();
```

**3. Offline Status Hook (`/hooks/useOfflineStatus.ts`)**

```typescript
/**
 * Hook for monitoring and displaying offline status
 */

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending operations periodically
    const interval = setInterval(async () => {
      const count = await localStorageAdapter.getPendingOperationCount();
      setPendingOperations(count);
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    pendingOperations,
    lastSyncTime,
    syncNow: () => localStorageAdapter.syncPendingOperations(),
  };
}
```

### Acceptance Criteria

- [ ] IndexedDB schema created and versioned
- [ ] Local adapter implements same interface as Firebase adapter
- [ ] Automatic sync when coming back online
- [ ] Conflict detection and resolution
- [ ] UI indicator for offline mode
- [ ] Pending operations queue with retry logic
- [ ] Unit tests for all adapter methods
- [ ] Integration tests for offline→online transitions

---

## 4. Audit Logging for Draft Actions

### Background

Draft actions need comprehensive audit logging for debugging, dispute resolution, and compliance. Every pick, queue change, and timer event should be logged with full context.

### Current State

- **Structured Logger**: Exists at `/lib/structuredLogger.ts`
- **Payment Events**: Logged via `logPaymentEvent()` in Stripe module
- **Draft Actions**: No centralized audit logging

### Implementation Details

#### New Files

**1. Draft Audit Logger (`/lib/draft/auditLogger.ts`)**

```typescript
/**
 * Draft Action Audit Logger
 *
 * Provides comprehensive logging for all draft actions with:
 * - Structured event format
 * - User context
 * - Action metadata
 * - Timestamps with server sync
 * - Severity levels
 */

import { logger } from '../structuredLogger';
import { getDb } from '../firebase-utils';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Event types
export type DraftAuditEventType =
  | 'pick_submitted'
  | 'pick_validated'
  | 'pick_rejected'
  | 'autopick_triggered'
  | 'timer_started'
  | 'timer_expired'
  | 'timer_paused'
  | 'timer_resumed'
  | 'queue_updated'
  | 'queue_player_added'
  | 'queue_player_removed'
  | 'draft_started'
  | 'draft_paused'
  | 'draft_resumed'
  | 'draft_completed'
  | 'participant_joined'
  | 'participant_left'
  | 'participant_reconnected'
  | 'state_recovery'
  | 'conflict_detected'
  | 'conflict_resolved';

// Severity levels
export type AuditSeverity = 'debug' | 'info' | 'warn' | 'error' | 'critical';

// Event structure
export interface DraftAuditEvent {
  eventId: string;
  eventType: DraftAuditEventType;
  timestamp: string;
  serverTimestamp?: unknown;
  roomId: string;
  userId?: string;
  participantIndex?: number;
  severity: AuditSeverity;

  // Action-specific data
  pickNumber?: number;
  playerId?: string;
  playerName?: string;
  round?: number;

  // Context
  timerRemaining?: number;
  isAutopick?: boolean;
  source?: 'manual' | 'autopick' | 'queue' | 'system';

  // Error context
  errorCode?: string;
  errorMessage?: string;

  // Additional metadata
  metadata?: Record<string, unknown>;

  // Timing
  latencyMs?: number;
  processingTimeMs?: number;
}

// Configuration
const AUDIT_CONFIG = {
  enableFirestore: true,
  enableConsole: process.env.NODE_ENV === 'development',
  retentionDays: 90,
  batchSize: 100,
};

// Audit buffer for batching
let auditBuffer: DraftAuditEvent[] = [];
let flushTimer: NodeJS.Timeout | null = null;

/**
 * Log a draft audit event
 */
export async function logDraftEvent(
  eventType: DraftAuditEventType,
  context: Omit<DraftAuditEvent, 'eventId' | 'eventType' | 'timestamp' | 'serverTimestamp'>
): Promise<void> {
  const event: DraftAuditEvent = {
    eventId: generateEventId(),
    eventType,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Console logging (development)
  if (AUDIT_CONFIG.enableConsole) {
    logToConsole(event);
  }

  // Structured logger
  logToStructuredLogger(event);

  // Firestore (batched)
  if (AUDIT_CONFIG.enableFirestore) {
    await bufferForFirestore(event);
  }
}

/**
 * Log pick submission
 */
export async function logPickSubmitted(params: {
  roomId: string;
  userId: string;
  participantIndex: number;
  pickNumber: number;
  playerId: string;
  playerName: string;
  round: number;
  timerRemaining: number;
  isAutopick: boolean;
  source: 'manual' | 'autopick' | 'queue';
  latencyMs?: number;
}): Promise<void> {
  await logDraftEvent('pick_submitted', {
    ...params,
    severity: 'info',
  });
}

/**
 * Log pick rejection
 */
export async function logPickRejected(params: {
  roomId: string;
  userId: string;
  participantIndex: number;
  pickNumber: number;
  playerId?: string;
  errorCode: string;
  errorMessage: string;
}): Promise<void> {
  await logDraftEvent('pick_rejected', {
    ...params,
    severity: 'warn',
  });
}

/**
 * Log timer expiration (autopick trigger)
 */
export async function logTimerExpired(params: {
  roomId: string;
  participantIndex: number;
  pickNumber: number;
}): Promise<void> {
  await logDraftEvent('timer_expired', {
    ...params,
    severity: 'info',
  });
}

/**
 * Log draft state conflict
 */
export async function logConflictDetected(params: {
  roomId: string;
  userId: string;
  localPickCount: number;
  remotePickCount: number;
  resolution: string;
}): Promise<void> {
  await logDraftEvent('conflict_detected', {
    ...params,
    severity: 'warn',
    metadata: {
      localPickCount: params.localPickCount,
      remotePickCount: params.remotePickCount,
      resolution: params.resolution,
    },
  });
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function generateEventId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function logToConsole(event: DraftAuditEvent): void {
  const emoji = {
    pick_submitted: '✅',
    pick_rejected: '❌',
    timer_expired: '⏰',
    autopick_triggered: '🤖',
    draft_started: '🏁',
    draft_completed: '🏆',
    conflict_detected: '⚠️',
  }[event.eventType] || '📝';

  console.log(
    `${emoji} [DRAFT AUDIT] ${event.eventType}`,
    {
      room: event.roomId,
      pick: event.pickNumber,
      player: event.playerName,
      user: event.userId,
    }
  );
}

function logToStructuredLogger(event: DraftAuditEvent): void {
  const logFn = {
    debug: logger.debug,
    info: logger.info,
    warn: logger.warn,
    error: logger.error,
    critical: logger.error,
  }[event.severity];

  logFn(`Draft: ${event.eventType}`, {
    component: 'draft',
    operation: event.eventType,
    roomId: event.roomId,
    userId: event.userId,
    pickNumber: event.pickNumber,
    ...event.metadata,
  });
}

async function bufferForFirestore(event: DraftAuditEvent): Promise<void> {
  auditBuffer.push(event);

  // Flush if buffer is full
  if (auditBuffer.length >= AUDIT_CONFIG.batchSize) {
    await flushToFirestore();
    return;
  }

  // Set up delayed flush
  if (!flushTimer) {
    flushTimer = setTimeout(() => flushToFirestore(), 5000);
  }
}

async function flushToFirestore(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (auditBuffer.length === 0) return;

  const eventsToFlush = [...auditBuffer];
  auditBuffer = [];

  try {
    const db = getDb();
    const auditCollection = collection(db, 'draftAuditLogs');

    // Batch write
    await Promise.all(
      eventsToFlush.map(event =>
        addDoc(auditCollection, {
          ...event,
          serverTimestamp: serverTimestamp(),
        })
      )
    );
  } catch (error) {
    // Put events back in buffer for retry
    auditBuffer.unshift(...eventsToFlush);
    logger.error('Failed to flush audit events to Firestore', error as Error, {
      component: 'draft',
      operation: 'audit_flush',
      eventCount: eventsToFlush.length,
    });
  }
}

/**
 * Force flush all buffered events (call on page unload)
 */
export async function flushAuditBuffer(): Promise<void> {
  await flushToFirestore();
}
```

**2. Integration with Pick Executor (`/components/vx2/draft-logic/hooks/usePickExecutor.ts` modifications)**

```typescript
// Add audit logging to pick submission flow

import { logPickSubmitted, logPickRejected } from '@/lib/draft/auditLogger';

// In submitPick function:
async function submitPick(pick: Pick): Promise<PickResult> {
  const startTime = performance.now();

  try {
    // Validate pick
    const validation = validateManualPick(/* ... */);

    if (!validation.valid) {
      await logPickRejected({
        roomId,
        userId,
        participantIndex,
        pickNumber: currentPick,
        playerId: pick.playerId,
        errorCode: validation.errorCode!,
        errorMessage: validation.message || 'Validation failed',
      });

      return { success: false, error: validation.errorCode };
    }

    // Submit to Firebase
    const result = await firebaseAdapter.submitPick(pick);

    // Log success
    await logPickSubmitted({
      roomId,
      userId,
      participantIndex,
      pickNumber: pick.pickNumber,
      playerId: pick.playerId,
      playerName: pick.playerName,
      round: getRoundForPick(pick.pickNumber, teamCount),
      timerRemaining: timer,
      isAutopick: false,
      source: 'manual',
      latencyMs: performance.now() - startTime,
    });

    return result;
  } catch (error) {
    await logPickRejected({
      roomId,
      userId,
      participantIndex,
      pickNumber: currentPick,
      errorCode: 'SUBMIT_ERROR',
      errorMessage: error.message,
    });

    throw error;
  }
}
```

**3. Firestore Schema for Audit Logs**

```
Collection: draftAuditLogs
Document structure:
{
  eventId: string,
  eventType: string,
  timestamp: string (ISO),
  serverTimestamp: Firestore Timestamp,
  roomId: string,
  userId: string,
  participantIndex: number,
  severity: string,
  pickNumber?: number,
  playerId?: string,
  playerName?: string,
  round?: number,
  timerRemaining?: number,
  isAutopick?: boolean,
  source?: string,
  errorCode?: string,
  errorMessage?: string,
  metadata?: map,
  latencyMs?: number,
  processingTimeMs?: number
}

Indexes:
- roomId + timestamp (for room history queries)
- userId + timestamp (for user activity queries)
- eventType + timestamp (for event type analysis)
- severity + timestamp (for error monitoring)
```

### Acceptance Criteria

- [ ] All pick actions logged with full context
- [ ] Timer events logged
- [ ] Queue changes logged
- [ ] Draft lifecycle events logged
- [ ] Firestore collection created with proper indexes
- [ ] Batched writes for performance
- [ ] Console logging in development
- [ ] Unit tests for logger functions
- [ ] Retention policy documented

---

## 5. Retry Logic for Firebase Adapter Operations

### Background

Firebase operations can fail due to network issues, rate limiting, or transient errors. The system needs robust retry logic with exponential backoff to handle these gracefully.

### Current State

- **Paystack Retry Utils**: Exists at `/lib/paystack/retryUtils.ts` (can be generalized)
- **Firebase Client**: No built-in retry logic
- **API Routes**: Some error handling but inconsistent retry behavior

### Implementation Details

#### New Files

**1. Retry Utilities (`/lib/firebase/retryUtils.ts`)**

```typescript
/**
 * Firebase Retry Utilities
 *
 * Provides configurable retry logic with:
 * - Exponential backoff
 * - Jitter to prevent thundering herd
 * - Circuit breaker pattern
 * - Retry budget management
 * - Error classification
 */

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterFactor: number;
  retryableErrors: string[];
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 5000,
  jitterFactor: 0.2,
  retryableErrors: [
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted',
    'aborted',
    'internal',
    'unknown',
    // Network errors
    'network-request-failed',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
  ],
};

/**
 * Error classification for retry decisions
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const errorCode = (error as { code?: string }).code || '';
    const errorMessage = error.message.toLowerCase();

    // Check error code
    if (DEFAULT_CONFIG.retryableErrors.some(e => errorCode.includes(e))) {
      return true;
    }

    // Check error message for network issues
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('unavailable') ||
      errorMessage.includes('connection')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_CONFIG
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add jitter (±jitterFactor)
  const jitter = cappedDelay * config.jitterFactor * (Math.random() * 2 - 1);

  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (attempt >= finalConfig.maxRetries || !isRetryableError(error)) {
        throw error;
      }

      // Calculate delay
      const delayMs = calculateDelay(attempt, finalConfig);

      // Notify callback
      finalConfig.onRetry?.(attempt + 1, lastError);

      // Log retry attempt
      logger.warn(`Retry attempt ${attempt + 1}/${finalConfig.maxRetries}`, {
        component: 'firebase',
        operation: 'retry',
        delayMs,
        errorMessage: lastError.message,
      });

      // Wait before retry
      await sleep(delayMs);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

interface CircuitBreakerState {
  failures: number;
  lastFailure: number | null;
  state: 'closed' | 'open' | 'half-open';
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,
  resetTimeMs: 30000,
  halfOpenMaxAttempts: 3,
};

/**
 * Execute operation with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  key: string,
  operation: () => Promise<T>
): Promise<T> {
  let state = circuitBreakers.get(key);

  if (!state) {
    state = { failures: 0, lastFailure: null, state: 'closed' };
    circuitBreakers.set(key, state);
  }

  // Check circuit state
  if (state.state === 'open') {
    const timeSinceFailure = Date.now() - (state.lastFailure || 0);

    if (timeSinceFailure > CIRCUIT_BREAKER_CONFIG.resetTimeMs) {
      // Transition to half-open
      state.state = 'half-open';
      state.failures = 0;
    } else {
      throw new Error(`Circuit breaker open for ${key}`);
    }
  }

  try {
    const result = await operation();

    // Success - reset state
    state.failures = 0;
    state.state = 'closed';

    return result;
  } catch (error) {
    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
      state.state = 'open';
      logger.error('Circuit breaker opened', error as Error, {
        component: 'firebase',
        operation: 'circuit_breaker',
        key,
        failures: state.failures,
      });
    }

    throw error;
  }
}

// ============================================================================
// RETRY BUDGET
// ============================================================================

interface RetryBudget {
  tokens: number;
  lastRefill: number;
}

const retryBudgets = new Map<string, RetryBudget>();

const BUDGET_CONFIG = {
  maxTokens: 10,
  refillRate: 1, // tokens per second
};

/**
 * Check if retry budget allows another attempt
 */
export function canRetry(key: string): boolean {
  let budget = retryBudgets.get(key);

  if (!budget) {
    budget = { tokens: BUDGET_CONFIG.maxTokens, lastRefill: Date.now() };
    retryBudgets.set(key, budget);
  }

  // Refill tokens based on time elapsed
  const now = Date.now();
  const elapsed = (now - budget.lastRefill) / 1000;
  const refill = Math.floor(elapsed * BUDGET_CONFIG.refillRate);

  if (refill > 0) {
    budget.tokens = Math.min(budget.tokens + refill, BUDGET_CONFIG.maxTokens);
    budget.lastRefill = now;
  }

  return budget.tokens > 0;
}

/**
 * Consume a retry token
 */
export function consumeRetryToken(key: string): boolean {
  const budget = retryBudgets.get(key);

  if (!budget || budget.tokens <= 0) {
    return false;
  }

  budget.tokens--;
  return true;
}
```

**2. Firebase Adapter with Retry (`/lib/firebase/firebaseAdapter.ts`)**

```typescript
/**
 * Firebase Adapter with Built-in Retry Logic
 *
 * Wraps all Firebase operations with:
 * - Automatic retry on transient failures
 * - Circuit breaker protection
 * - Retry budget management
 */

import {
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  runTransaction,
  collection,
  doc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { getDb } from './firebase-utils';
import { withRetry, withCircuitBreaker, canRetry } from './retryUtils';
import { logger } from '../structuredLogger';

class FirebaseAdapter {
  private db = getDb();

  // =========================================================================
  // READ OPERATIONS (with retry)
  // =========================================================================

  async getDocument<T>(
    collectionName: string,
    docId: string,
    options: { maxRetries?: number } = {}
  ): Promise<T | null> {
    return withCircuitBreaker(`read:${collectionName}`, async () => {
      return withRetry(
        async () => {
          const docRef = doc(this.db, collectionName, docId);
          const snapshot = await getDoc(docRef);
          return snapshot.exists() ? (snapshot.data() as T) : null;
        },
        {
          maxRetries: options.maxRetries ?? 3,
          onRetry: (attempt, error) => {
            logger.warn('Firebase read retry', {
              component: 'firebase',
              operation: 'getDocument',
              collection: collectionName,
              docId,
              attempt,
              error: error.message,
            });
          },
        }
      );
    });
  }

  async queryDocuments<T>(
    collectionName: string,
    field: string,
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=',
    value: unknown,
    options: { maxRetries?: number } = {}
  ): Promise<T[]> {
    return withCircuitBreaker(`query:${collectionName}`, async () => {
      return withRetry(
        async () => {
          const q = query(
            collection(this.db, collectionName),
            where(field, operator, value)
          );
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        },
        { maxRetries: options.maxRetries ?? 3 }
      );
    });
  }

  // =========================================================================
  // WRITE OPERATIONS (with retry + idempotency)
  // =========================================================================

  async setDocument<T extends Record<string, unknown>>(
    collectionName: string,
    docId: string,
    data: T,
    options: { maxRetries?: number; merge?: boolean } = {}
  ): Promise<void> {
    // Check retry budget
    if (!canRetry(`write:${collectionName}`)) {
      throw new Error('Retry budget exhausted');
    }

    return withCircuitBreaker(`write:${collectionName}`, async () => {
      return withRetry(
        async () => {
          const docRef = doc(this.db, collectionName, docId);
          await setDoc(docRef, data, { merge: options.merge });
        },
        {
          maxRetries: options.maxRetries ?? 2, // Fewer retries for writes
          onRetry: (attempt, error) => {
            logger.warn('Firebase write retry', {
              component: 'firebase',
              operation: 'setDocument',
              collection: collectionName,
              docId,
              attempt,
              error: error.message,
            });
          },
        }
      );
    });
  }

  async updateDocument(
    collectionName: string,
    docId: string,
    updates: Record<string, unknown>,
    options: { maxRetries?: number } = {}
  ): Promise<void> {
    return withCircuitBreaker(`write:${collectionName}`, async () => {
      return withRetry(
        async () => {
          const docRef = doc(this.db, collectionName, docId);
          await updateDoc(docRef, updates);
        },
        { maxRetries: options.maxRetries ?? 2 }
      );
    });
  }

  // =========================================================================
  // TRANSACTION OPERATIONS (with retry)
  // =========================================================================

  async runAtomicTransaction<T>(
    transactionFn: (transaction: FirebaseFirestore.Transaction) => Promise<T>,
    options: { maxRetries?: number } = {}
  ): Promise<T> {
    return withCircuitBreaker('transaction', async () => {
      return withRetry(
        async () => {
          return runTransaction(this.db, transactionFn);
        },
        {
          maxRetries: options.maxRetries ?? 2,
          onRetry: (attempt, error) => {
            logger.warn('Firebase transaction retry', {
              component: 'firebase',
              operation: 'transaction',
              attempt,
              error: error.message,
            });
          },
        }
      );
    });
  }

  // =========================================================================
  // DRAFT-SPECIFIC OPERATIONS
  // =========================================================================

  async submitPick(pick: Pick): Promise<SubmitPickResult> {
    return this.runAtomicTransaction(async (transaction) => {
      // Read current state
      const roomRef = doc(this.db, 'draftRooms', pick.roomId);
      const roomSnapshot = await transaction.get(roomRef);

      if (!roomSnapshot.exists()) {
        throw new Error('Room not found');
      }

      const roomData = roomSnapshot.data();

      // Validate pick number matches current
      if (roomData.currentPickNumber !== pick.pickNumber) {
        throw new Error(`Pick number mismatch: expected ${roomData.currentPickNumber}, got ${pick.pickNumber}`);
      }

      // Check player not already picked
      if (roomData.pickedPlayerIds?.includes(pick.playerId)) {
        throw new Error('Player already drafted');
      }

      // Write pick
      const pickRef = doc(this.db, 'picks', `${pick.roomId}_${pick.pickNumber}`);
      transaction.set(pickRef, {
        ...pick,
        timestamp: serverTimestamp(),
      });

      // Update room state
      transaction.update(roomRef, {
        currentPickNumber: pick.pickNumber + 1,
        pickedPlayerIds: [...(roomData.pickedPlayerIds || []), pick.playerId],
        lastPickAt: serverTimestamp(),
      });

      return { success: true, pickNumber: pick.pickNumber };
    });
  }
}

export const firebaseAdapter = new FirebaseAdapter();
```

**3. Tests for Retry Logic (`__tests__/lib/firebase/retryUtils.test.ts`)**

```typescript
describe('Firebase Retry Utils', () => {
  describe('withRetry', () => {
    test('succeeds on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await withRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('retries on transient failure then succeeds', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('network-request-failed'))
        .mockResolvedValue('success');

      const result = await withRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    test('throws after max retries exceeded', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('unavailable'));

      await expect(withRetry(operation, { maxRetries: 2 }))
        .rejects.toThrow('unavailable');

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    test('does not retry non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('permission-denied'));

      await expect(withRetry(operation)).rejects.toThrow('permission-denied');

      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('calculateDelay', () => {
    test('exponential backoff', () => {
      const config = { baseDelayMs: 100, maxDelayMs: 10000, jitterFactor: 0 };

      expect(calculateDelay(0, config)).toBe(100);   // 100 * 2^0
      expect(calculateDelay(1, config)).toBe(200);   // 100 * 2^1
      expect(calculateDelay(2, config)).toBe(400);   // 100 * 2^2
      expect(calculateDelay(3, config)).toBe(800);   // 100 * 2^3
    });

    test('caps at maxDelay', () => {
      const config = { baseDelayMs: 100, maxDelayMs: 500, jitterFactor: 0 };

      expect(calculateDelay(10, config)).toBe(500); // Would be 102400, capped at 500
    });
  });

  describe('isRetryableError', () => {
    test('identifies retryable error codes', () => {
      expect(isRetryableError({ code: 'unavailable' })).toBe(true);
      expect(isRetryableError({ code: 'deadline-exceeded' })).toBe(true);
      expect(isRetryableError({ code: 'resource-exhausted' })).toBe(true);
    });

    test('identifies non-retryable errors', () => {
      expect(isRetryableError({ code: 'permission-denied' })).toBe(false);
      expect(isRetryableError({ code: 'not-found' })).toBe(false);
      expect(isRetryableError({ code: 'already-exists' })).toBe(false);
    });
  });

  describe('circuit breaker', () => {
    test('opens after threshold failures', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));

      // Fail 5 times to trip breaker
      for (let i = 0; i < 5; i++) {
        await expect(withCircuitBreaker('test', failingOperation))
          .rejects.toThrow();
      }

      // Next call should fail immediately
      await expect(withCircuitBreaker('test', failingOperation))
        .rejects.toThrow('Circuit breaker open');

      // Operation should not be called when breaker is open
      expect(failingOperation).toHaveBeenCalledTimes(5);
    });
  });
});
```

### Acceptance Criteria

- [ ] Retry logic with exponential backoff implemented
- [ ] Jitter added to prevent thundering herd
- [ ] Circuit breaker protects against cascade failures
- [ ] Retry budget prevents infinite retry loops
- [ ] Error classification determines retryability
- [ ] All Firebase operations wrapped with retry
- [ ] Comprehensive unit tests
- [ ] Integration tests for failure scenarios

---

## Summary & Timeline

| Task | Priority | Estimated Effort | Dependencies |
|------|----------|------------------|--------------|
| 1. Snake Draft Unit Tests | High | 1 day | None |
| 2. Payment Webhook Integration Tests | High | 2 days | Test factories |
| 3. Local Adapter for Offline | Medium | 3 days | IndexedDB setup |
| 4. Audit Logging | Medium | 2 days | Firestore schema |
| 5. Firebase Retry Logic | High | 2 days | None |

**Total Estimated Effort**: 10 developer days

### Recommended Order

1. **Firebase Retry Logic** (foundational - needed by other features)
2. **Snake Draft Unit Tests** (quick win, high value)
3. **Payment Webhook Integration Tests** (critical path testing)
4. **Audit Logging** (observability improvement)
5. **Local Adapter for Offline** (larger feature, builds on retry logic)

---

## Appendix: File Locations Summary

### New Files to Create

```
__tests__/
├── lib/
│   ├── snakeDraft.test.ts              # Task 1
│   └── firebase/
│       └── retryUtils.test.ts          # Task 5
├── integration/
│   └── webhooks/
│       ├── stripe.integration.test.ts  # Task 2
│       ├── paystack.integration.test.ts
│       ├── paymongo.integration.test.ts
│       └── xendit.integration.test.ts
└── factories/
    └── webhookEvents.ts                # Task 2

lib/
├── adapters/
│   ├── localStorage.ts                 # Task 3
│   └── hybrid.ts                       # Task 3
├── draft/
│   └── auditLogger.ts                  # Task 4
└── firebase/
    ├── retryUtils.ts                   # Task 5
    └── firebaseAdapter.ts              # Task 5

hooks/
└── useOfflineStatus.ts                 # Task 3
```

### Files to Modify

```
components/vx2/draft-logic/hooks/
└── usePickExecutor.ts                  # Add audit logging (Task 4)

jest.config.js                          # Add new test paths
```
