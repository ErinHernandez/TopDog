/**
 * Test Data Factories
 *
 * Reusable factory functions for creating test data
 */

// ============================================================================
// TOURNAMENT FACTORIES
// ============================================================================

export const createMockTournament = (overrides = {}) => ({
  id: 'tournament-123',
  name: 'Test TopDog Tournament',
  type: 'topdog',
  entryFee: 1000, // $10.00 in cents
  currency: 'USD',
  maxEntrants: 12,
  currentEntrants: 0,
  status: 'open',
  created: Date.now(),
  startTime: Date.now() + 3600000, // 1 hour from now
  ...overrides,
});

export const createMockDevTournament = (overrides = {}) =>
  createMockTournament({
    type: 'dev',
    entryFee: 0,
    ...overrides,
  });

// ============================================================================
// USER FACTORIES
// ============================================================================

export const createMockUser = (overrides = {}) => ({
  uid: 'user-123',
  email: 'user@example.com',
  username: 'testuser',
  displayName: 'Test User',
  balance: 10000, // $100.00
  currency: 'USD',
  country: 'US',
  emailVerified: true,
  created: Date.now(),
  lastLogin: Date.now(),
  ...overrides,
});

export const createMockAdminUser = (overrides = {}) =>
  createMockUser({
    uid: 'admin-123',
    email: 'admin@example.com',
    username: 'admin',
    role: 'admin',
    ...overrides,
  });

// ============================================================================
// PLAYER FACTORIES
// ============================================================================

export const createMockPlayer = (overrides = {}) => ({
  playerId: 'player-123',
  name: "Ja'Marr Chase",
  position: 'WR',
  team: 'CIN',
  number: 1,
  status: 'Active',
  injury: null,
  projected: 280.5,
  adp: 5.2,
  ...overrides,
});

export const createMockPlayerList = (count = 5) => {
  const positions = ['QB', 'RB', 'WR', 'TE'];
  const teams = ['KC', 'BUF', 'CIN', 'SF', 'PHI'];
  const names = [
    'Patrick Mahomes',
    'Josh Allen',
    "Ja'Marr Chase",
    'Christian McCaffrey',
    'Travis Kelce',
  ];

  return Array.from({ length: count }, (_, i) =>
    createMockPlayer({
      playerId: `player-${i + 1}`,
      name: names[i] || `Player ${i + 1}`,
      position: positions[i % positions.length],
      team: teams[i % teams.length],
      number: i + 1,
      adp: (i + 1) * 1.5,
      projected: 300 - (i * 20),
    })
  );
};

// ============================================================================
// DRAFT FACTORIES
// ============================================================================

export const createMockDraft = (overrides = {}) => ({
  draftId: 'draft-123',
  tournamentId: 'tournament-123',
  status: 'in_progress',
  currentPick: 1,
  currentRound: 1,
  totalRounds: 17,
  pickTimeLimit: 60, // seconds
  draftOrder: ['user-1', 'user-2', 'user-3'],
  picks: [],
  created: Date.now(),
  ...overrides,
});

export const createMockPick = (overrides = {}) => ({
  pickNumber: 1,
  round: 1,
  userId: 'user-123',
  playerId: 'player-123',
  timestamp: Date.now(),
  ...overrides,
});

export const createMockPickSequence = (count = 10) =>
  Array.from({ length: count }, (_, i) =>
    createMockPick({
      pickNumber: i + 1,
      round: Math.floor(i / 12) + 1,
      userId: `user-${(i % 3) + 1}`,
      playerId: `player-${i + 1}`,
    })
  );

// ============================================================================
// PAYMENT FACTORIES
// ============================================================================

export const createMockPayment = (overrides = {}) => ({
  id: 'payment-123',
  userId: 'user-123',
  amount: 5000, // $50.00 in cents
  currency: 'USD',
  status: 'succeeded',
  provider: 'stripe',
  paymentIntentId: 'pi_123',
  created: Date.now(),
  ...overrides,
});

export const createMockDeposit = (overrides = {}) =>
  createMockPayment({
    type: 'deposit',
    ...overrides,
  });

export const createMockWithdrawal = (overrides = {}) =>
  createMockPayment({
    type: 'withdrawal',
    status: 'pending',
    ...overrides,
  });

// ============================================================================
// CURRENCY FACTORIES
// ============================================================================

export const createMockCurrencyConfig = (overrides = {}) => ({
  code: 'USD',
  name: 'US Dollar',
  symbol: '$',
  decimals: 2,
  minAmount: 500, // $5.00
  maxAmount: 1000000, // $10,000.00
  ...overrides,
});

export const createMockExchangeRate = (overrides = {}) => ({
  from: 'USD',
  to: 'EUR',
  rate: 0.85,
  timestamp: Date.now(),
  source: 'stripe',
  ...overrides,
});

// ============================================================================
// API RESPONSE FACTORIES
// ============================================================================

export const createMockApiResponse = (data, overrides = {}) => ({
  ok: true,
  data,
  error: null,
  timestamp: Date.now(),
  ...overrides,
});

export const createMockApiError = (message, code = 'UNKNOWN_ERROR', statusCode = 500) => ({
  ok: false,
  data: null,
  error: {
    message,
    code,
    statusCode,
  },
  timestamp: Date.now(),
});

// ============================================================================
// NEXT.JS REQUEST/RESPONSE FACTORIES
// ============================================================================

export const createMockRequest = (overrides = {}) => ({
  method: 'GET',
  url: '/api/test',
  headers: {},
  query: {},
  body: {},
  ...overrides,
});

export const createMockResponse = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
  };

  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });

  res.json = jest.fn((data) => {
    res.body = data;
    return res;
  });

  res.send = jest.fn((data) => {
    res.body = data;
    return res;
  });

  res.setHeader = jest.fn((key, value) => {
    res.headers[key] = value;
    return res;
  });

  return res;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Tournament
  createMockTournament,
  createMockDevTournament,

  // User
  createMockUser,
  createMockAdminUser,

  // Player
  createMockPlayer,
  createMockPlayerList,

  // Draft
  createMockDraft,
  createMockPick,
  createMockPickSequence,

  // Payment
  createMockPayment,
  createMockDeposit,
  createMockWithdrawal,

  // Currency
  createMockCurrencyConfig,
  createMockExchangeRate,

  // API
  createMockApiResponse,
  createMockApiError,
  createMockRequest,
  createMockResponse,
};
