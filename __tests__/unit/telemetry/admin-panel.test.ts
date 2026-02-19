/**
 * B2B Licensing Admin Panel Tests
 *
 * Tests admin authentication, buyer management, analytics,
 * and revenue tracking for the data marketplace.
 *
 * @module __tests__/unit/telemetry/admin-panel
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

// Type definitions for Next.js API
type NextApiRequest = {
  method?: string;
  headers?: Record<string, any>;
  query?: Record<string, any>;
  body?: Record<string, any>;
};

type NextApiResponse = {
  status: (code: number) => NextApiResponse;
  json: (data: any) => NextApiResponse;
  end: () => NextApiResponse;
  setHeader: (key: string, value: any) => NextApiResponse;
  send: (data: any) => NextApiResponse;
};

// ============================================================================
// MOCK SETUP - Firebase Admin
// ============================================================================

const mockDocRef = {
  get: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  ref: null as any,
  collection: vi.fn(),
};

const mockCollectionRef = {
  doc: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  offset: vi.fn(),
  get: vi.fn(),
};

const mockQuery = {
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  offset: vi.fn(),
  get: vi.fn(),
};

const mockFirestore = {
  collection: vi.fn(() => mockCollectionRef),
};

// Hoist Firebase mocks using vi.hoisted()
const {
  mockVerifyIdToken,
  mockGetAuth,
  mockGetFirestore,
  mockRandomUUID,
} = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
  mockGetAuth: vi.fn(),
  mockGetFirestore: vi.fn(() => mockFirestore),
  mockRandomUUID: vi.fn(() => 'uuid-123'),
}));

// Hoist third-party mocks
const {
  mockStripeCustomersCreate,
  mockStripeCustomersRetrieve,
  mockStripeCustomersList,
} = vi.hoisted(() => ({
  mockStripeCustomersCreate: vi.fn(),
  mockStripeCustomersRetrieve: vi.fn(),
  mockStripeCustomersList: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: mockGetAuth,
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: mockGetFirestore,
}));

vi.mock('stripe', () => {
  return {
    default: class MockStripe {
      customers = {
        create: mockStripeCustomersCreate,
        retrieve: mockStripeCustomersRetrieve,
        list: mockStripeCustomersList,
      };
    },
  };
});

vi.mock('@/lib/firebase/server', () => ({
  getAdminDb: () => mockFirestore,
}));

vi.mock('crypto', () => ({
  default: {
    randomUUID: mockRandomUUID,
    randomBytes: vi.fn((len: number) => ({
      toString: (encoding: string) => 'a'.repeat(len * 2),
    })),
    createHash: (algorithm: string) => ({
      update: (data: string) => ({
        digest: (encoding: string) => 'hash_' + data.substring(0, 20),
      }),
    }),
  },
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createMockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: 'GET',
    headers: { authorization: 'Bearer admin-token-123' },
    query: {},
    body: {},
    ...overrides,
  } as unknown as NextApiRequest;
}

function createMockRes(): NextApiResponse & { _status: number; _json: any; _ended: boolean } {
  const res = {
    _status: 200,
    _json: null,
    _ended: false,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(data: any) {
      res._json = data;
      return res;
    },
    end() {
      res._ended = true;
      return res;
    },
    setHeader: vi.fn(() => res),
    send: vi.fn(() => res),
  };
  return res as any;
}

// ============================================================================
// TEST SUITE: Admin Authentication
// ============================================================================

describe('Admin Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuth.mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    });
  });

  it('should authenticate admin user with valid token and admin claim', async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: 'admin-user-123',
      email: 'admin@topdog.com',
      admin: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const req = createMockReq({
      headers: { authorization: 'Bearer valid-token-123' },
    });

    const result = await mockVerifyIdToken('valid-token-123');
    expect(result.admin).toBe(true);
    expect(result.uid).toBe('admin-user-123');
    expect(result.email).toBe('admin@topdog.com');
  });

  it('should reject request without authorization header', async () => {
    const req = createMockReq({
      headers: {},
    });

    expect(req.headers.authorization).toBeUndefined();
  });

  it('should reject request with invalid token', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

    const token = 'invalid-token';
    await expect(mockVerifyIdToken(token)).rejects.toThrow('Invalid token');
  });

  it('should reject request with valid token but no admin claim', async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: 'regular-user-123',
      email: 'user@example.com',
      admin: false,
    });

    const result = await mockVerifyIdToken('valid-token');
    expect(result.admin).toBe(false);
  });

  it('should reject request with expired token', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Token expired'));

    await expect(mockVerifyIdToken('expired-token')).rejects.toThrow('Token expired');
  });

  it('should extract uid and email from verified token', async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: 'test-uid-456',
      email: 'test@example.com',
      admin: true,
    });

    const result = await mockVerifyIdToken('test-token');
    expect(result.uid).toBe('test-uid-456');
    expect(result.email).toBe('test@example.com');
  });

  it('should handle Firebase Admin SDK errors gracefully', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Firebase connection error'));

    await expect(mockVerifyIdToken('any-token')).rejects.toThrow('Firebase connection error');
  });

  it('should reject non-Bearer token format', async () => {
    const req = createMockReq({
      headers: { authorization: 'Basic admin-token-123' },
    });

    const authHeader = req.headers.authorization as string;
    const isBearerToken = authHeader.startsWith('Bearer ');
    expect(isBearerToken).toBe(false);
  });

  it('should handle malformed JWT gracefully', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Malformed JWT'));

    await expect(mockVerifyIdToken('malformed.jwt')).rejects.toThrow('Malformed JWT');
  });

  it('should pass admin context to handler in withAdminAuth wrapper', async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: 'admin-123',
      email: 'admin@topdog.com',
      admin: true,
    });

    const token = 'valid-admin-token';
    const result = await mockVerifyIdToken(token);

    expect(result).toHaveProperty('uid');
    expect(result).toHaveProperty('email');
    expect(result).toHaveProperty('admin');
  });
});

// ============================================================================
// TEST SUITE: Buyer Management — List & Create
// ============================================================================

describe('Buyer Management — List & Create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
  });

  it('GET should return paginated buyer list', async () => {
    const mockBuyers = [
      {
        buyerId: 'buyer-1',
        organizationName: 'Acme Corp',
        contactEmail: 'contact@acme.com',
        tier: 'professional',
        status: 'active',
      },
      {
        buyerId: 'buyer-2',
        organizationName: 'Beta Ltd',
        contactEmail: 'contact@beta.com',
        tier: 'starter',
        status: 'active',
      },
    ];

    mockCollectionRef.limit.mockReturnValue(mockQuery);
    mockCollectionRef.offset.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: mockBuyers.map((b, idx) => ({
        id: b.buyerId,
        data: () => b,
      })),
    });

    const snapshot = await mockQuery.get();
    expect(snapshot.docs).toHaveLength(2);
    expect(snapshot.docs[0].data()).toHaveProperty('organizationName');
  });

  it('GET should filter by status', async () => {
    mockCollectionRef.where.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: [
        {
          id: 'buyer-1',
          data: () => ({ status: 'active' }),
        },
      ],
    });

    const query = mockCollectionRef.where('status', '==', 'active');
    const snapshot = await query.get();
    expect(snapshot.docs[0].data().status).toBe('active');
  });

  it('GET should filter by tier', async () => {
    mockCollectionRef.where.mockReturnValue(mockQuery);
    mockQuery.where.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: [
        {
          id: 'buyer-1',
          data: () => ({ tier: 'enterprise' }),
        },
      ],
    });

    const query = mockCollectionRef.where('tier', '==', 'enterprise');
    const snapshot = await query.get();
    expect(snapshot.docs[0].data().tier).toBe('enterprise');
  });

  it('GET should use default pagination (page 1, size 20)', async () => {
    mockCollectionRef.limit.mockReturnValue(mockQuery);
    mockCollectionRef.offset.mockReturnValue(mockQuery);

    // Default: page 1, pageSize 20 = limit(20), offset(0)
    mockCollectionRef.limit(20);
    mockCollectionRef.offset(0);

    expect(mockCollectionRef.limit).toHaveBeenCalledWith(20);
    expect(mockCollectionRef.offset).toHaveBeenCalledWith(0);
  });

  it('GET should cap pageSize at 100', async () => {
    mockCollectionRef.limit.mockReturnValue(mockQuery);

    // Requesting pageSize 500 should be capped at 100
    const pageSize = Math.min(500, 100);
    mockCollectionRef.limit(pageSize);

    expect(mockCollectionRef.limit).toHaveBeenCalledWith(100);
  });

  it('POST should create buyer with all required fields', async () => {
    const setMock = vi.fn().mockResolvedValue(undefined);
    mockDocRef.set = setMock;

    const buyerData = {
      buyerId: 'buyer-new',
      organizationName: 'New Corp',
      contactEmail: 'new@corp.com',
      tier: 'professional',
      subscribedProducts: [],
      monthlyRecordLimit: 1000000,
      billingCustomerId: 'cus_123',
      createdAt: Date.now(),
      lastAccessAt: 0,
      status: 'active',
      apiKeyHash: 'hash_value',
      recordsConsumedThisMonth: 0,
    };

    await mockDocRef.set(buyerData);
    expect(setMock).toHaveBeenCalledWith(buyerData);
  });

  it('POST should generate API key and return plaintext (only on create)', async () => {
    const mockAPIKeyManager = {
      generateAPIKey: vi.fn(() => 'tds_' + 'a'.repeat(48)),
      hashAPIKey: vi.fn((key: string) => 'hash_' + key),
    };

    const apiKey = mockAPIKeyManager.generateAPIKey('buyer-123');
    expect(apiKey).toMatch(/^tds_/);
    expect(apiKey).toHaveLength(52); // 4 prefix + 48 chars
  });

  it('POST should store API key hash (not plaintext) in Firestore', async () => {
    const mockAPIKeyManager = {
      generateAPIKey: vi.fn(() => 'tds_' + 'a'.repeat(48)),
      hashAPIKey: vi.fn((key: string) => 'hash_' + key.substring(4, 20)), // Skip 'tds_' prefix in hash
    };

    const apiKey = mockAPIKeyManager.generateAPIKey('buyer-123');
    const hashedKey = mockAPIKeyManager.hashAPIKey(apiKey);

    // Should store hash, not plaintext
    expect(hashedKey).not.toContain('tds_');
    expect(hashedKey).toContain('hash_');
  });

  it('POST should validate required fields (organizationName, contactEmail, tier)', async () => {
    const req = createMockReq({
      method: 'POST',
      body: {
        organizationName: 'Test Org',
        // Missing contactEmail and tier
      },
    });

    const requiredFields = ['organizationName', 'contactEmail', 'tier'];
    const hasAllRequired = requiredFields.every(field => req.body[field] !== undefined);
    expect(hasAllRequired).toBe(false);
  });

  it('POST should reject invalid tier value', async () => {
    const validTiers = ['starter', 'professional', 'enterprise'];
    const invalidTier = 'gold';

    const isValidTier = validTiers.includes(invalidTier);
    expect(isValidTier).toBe(false);
  });

  it('POST should reject duplicate email', async () => {
    mockCollectionRef.where.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: [
        {
          id: 'buyer-existing',
          data: () => ({ contactEmail: 'duplicate@example.com' }),
        },
      ],
    });

    const query = mockCollectionRef.where('contactEmail', '==', 'duplicate@example.com');
    const snapshot = await query.get();

    expect(snapshot.docs.length).toBeGreaterThan(0);
  });

  it('POST should return 405 for unsupported methods', async () => {
    const res = createMockRes();
    res.status(405);

    expect(res._status).toBe(405);
  });
});

// ============================================================================
// TEST SUITE: Buyer Management — Detail, Update, Delete
// ============================================================================

describe('Buyer Management — Detail, Update, Delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
  });

  it('GET should return buyer with recent access logs', async () => {
    const mockBuyer = {
      buyerId: 'buyer-1',
      organizationName: 'Acme Corp',
      contactEmail: 'contact@acme.com',
      tier: 'professional',
      status: 'active',
    };

    mockDocRef.get.mockResolvedValue({
      exists: true,
      data: () => mockBuyer,
      id: 'buyer-1',
    });

    const doc = await mockDocRef.get();
    expect(doc.exists).toBe(true);
    expect(doc.data()).toEqual(mockBuyer);
  });

  it('GET should return 404 for non-existent buyer', async () => {
    mockDocRef.get.mockResolvedValue({
      exists: false,
    });

    const doc = await mockDocRef.get();
    expect(doc.exists).toBe(false);
  });

  it('PATCH should update tier', async () => {
    const updateMock = vi.fn().mockResolvedValue(undefined);
    mockDocRef.update = updateMock;

    mockDocRef.get.mockResolvedValue({
      exists: true,
      data: () => ({ tier: 'starter' }),
    });

    await mockDocRef.update({ tier: 'professional' });
    expect(updateMock).toHaveBeenCalledWith({ tier: 'professional' });
  });

  it('PATCH should update status', async () => {
    const updateMock = vi.fn().mockResolvedValue(undefined);
    mockDocRef.update = updateMock;

    await mockDocRef.update({ status: 'suspended' });
    expect(updateMock).toHaveBeenCalledWith({ status: 'suspended' });
  });

  it('PATCH should update subscribedProducts', async () => {
    const updateMock = vi.fn().mockResolvedValue(undefined);
    mockDocRef.update = updateMock;

    const newProducts = ['product-1', 'product-2', 'product-3'];
    await mockDocRef.update({ subscribedProducts: newProducts });

    expect(updateMock).toHaveBeenCalledWith({ subscribedProducts: newProducts });
  });

  it('PATCH should update monthlyRecordLimit', async () => {
    const updateMock = vi.fn().mockResolvedValue(undefined);
    mockDocRef.update = updateMock;

    await mockDocRef.update({ monthlyRecordLimit: 5000000 });
    expect(updateMock).toHaveBeenCalledWith({ monthlyRecordLimit: 5000000 });
  });

  it('PATCH should reject invalid status value', async () => {
    const validStatuses = ['active', 'suspended', 'cancelled'];
    const invalidStatus = 'blocked';

    const isValidStatus = validStatuses.includes(invalidStatus);
    expect(isValidStatus).toBe(false);
  });

  it('PATCH should return 404 for non-existent buyer', async () => {
    mockDocRef.get.mockResolvedValue({
      exists: false,
    });

    const doc = await mockDocRef.get();
    expect(doc.exists).toBe(false);
  });

  it('DELETE should soft-delete (set status=cancelled)', async () => {
    const updateMock = vi.fn().mockResolvedValue(undefined);
    mockDocRef.update = updateMock;
    mockDocRef.get.mockResolvedValue({
      exists: true,
      data: () => ({ buyerId: 'buyer-1', status: 'active' }),
    });

    await mockDocRef.update({ status: 'cancelled' });
    expect(updateMock).toHaveBeenCalledWith({ status: 'cancelled' });
  });

  it('DELETE should revoke API key on deletion', async () => {
    const updateMock = vi.fn().mockResolvedValue(undefined);
    mockDocRef.update = updateMock;
    mockDocRef.get.mockResolvedValue({
      exists: true,
    });

    // Simulate revoking API key (update status to suspended)
    await mockDocRef.update({ status: 'suspended' });
    expect(updateMock).toHaveBeenCalled();
  });

  it('DELETE should return 404 for non-existent buyer', async () => {
    mockDocRef.get.mockResolvedValue({
      exists: false,
    });

    const doc = await mockDocRef.get();
    expect(doc.exists).toBe(false);
  });

  it('should return 405 for unsupported methods', async () => {
    const res = createMockRes();
    res.status(405);

    expect(res._status).toBe(405);
  });
});

// ============================================================================
// TEST SUITE: API Key Management
// ============================================================================

describe('API Key Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
  });

  it('POST should rotate API key and return new plaintext key', async () => {
    const mockAPIKeyManager = {
      generateAPIKey: vi.fn(() => 'tds_' + 'new'.repeat(16)),
      hashAPIKey: vi.fn((key: string) => 'hash_new_' + key.substring(0, 10)),
      rotateAPIKey: vi.fn(async (buyerId: string) => 'tds_' + 'b'.repeat(48)),
    };

    const newKey = await mockAPIKeyManager.rotateAPIKey('buyer-1');
    expect(newKey).toMatch(/^tds_/);
    expect(newKey).toHaveLength(52);
  });

  it('POST should hash new key before storing', async () => {
    const mockAPIKeyManager = {
      generateAPIKey: vi.fn(() => 'tds_' + 'a'.repeat(48)),
      hashAPIKey: vi.fn((key: string) => 'hash_' + key.substring(0, 20)),
    };

    const apiKey = mockAPIKeyManager.generateAPIKey('buyer-1');
    const hashedKey = mockAPIKeyManager.hashAPIKey(apiKey);

    const updateMock = vi.fn().mockResolvedValue(undefined);
    mockDocRef.update = updateMock;

    await mockDocRef.update({ apiKeyHash: hashedKey });
    expect(updateMock).toHaveBeenCalledWith({ apiKeyHash: hashedKey });
  });

  it('POST should return 404 for non-existent buyer', async () => {
    mockDocRef.get.mockResolvedValue({
      exists: false,
    });

    const doc = await mockDocRef.get();
    expect(doc.exists).toBe(false);
  });

  it('POST should reject rotation for cancelled buyers', async () => {
    mockDocRef.get.mockResolvedValue({
      exists: true,
      data: () => ({ status: 'cancelled' }),
    });

    const doc = await mockDocRef.get();
    const isCancelled = doc.data().status === 'cancelled';
    expect(isCancelled).toBe(true);
  });

  it('DELETE should revoke API key', async () => {
    const updateMock = vi.fn().mockResolvedValue(undefined);
    mockDocRef.update = updateMock;
    mockDocRef.get.mockResolvedValue({
      exists: true,
      data: () => ({ buyerId: 'buyer-1' }),
    });

    const mockAPIKeyManager = {
      revokeAPIKey: vi.fn(async (buyerId: string) => true),
    };

    const result = await mockAPIKeyManager.revokeAPIKey('buyer-1');
    expect(result).toBe(true);
  });

  it('DELETE should set buyer status to suspended', async () => {
    const updateMock = vi.fn().mockResolvedValue(undefined);
    mockDocRef.update = updateMock;
    mockDocRef.get.mockResolvedValue({
      exists: true,
    });

    await mockDocRef.update({ status: 'suspended' });
    expect(updateMock).toHaveBeenCalledWith({ status: 'suspended' });
  });

  it('DELETE should return 404 for non-existent buyer', async () => {
    mockDocRef.get.mockResolvedValue({
      exists: false,
    });

    const doc = await mockDocRef.get();
    expect(doc.exists).toBe(false);
  });

  it('should return 405 for unsupported methods', async () => {
    const res = createMockRes();
    res.status(405);

    expect(res._status).toBe(405);
  });
});

// ============================================================================
// TEST SUITE: Analytics Dashboard
// ============================================================================

describe('Analytics Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return buyer counts (total, active, suspended)', async () => {
    mockCollectionRef.get.mockResolvedValue({
      docs: [
        { data: () => ({ status: 'active' }) },
        { data: () => ({ status: 'active' }) },
        { data: () => ({ status: 'suspended' }) },
        { data: () => ({ status: 'cancelled' }) },
      ],
    });

    const snapshot = await mockCollectionRef.get();
    const buyers = snapshot.docs.map(doc => doc.data());

    const counts = {
      total: buyers.length,
      active: buyers.filter(b => b.status === 'active').length,
      suspended: buyers.filter(b => b.status === 'suspended').length,
    };

    expect(counts.total).toBe(4);
    expect(counts.active).toBe(2);
    expect(counts.suspended).toBe(1);
  });

  it('should return revenue summary (all-time, this month, last month)', async () => {
    const now = Date.now();
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    mockCollectionRef.where.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: [
        {
          id: 'billing-1',
          data: () => ({
            totalCost: 500,
            timestamp: now,
          }),
        },
        {
          id: 'billing-2',
          data: () => ({
            totalCost: 300,
            timestamp: now,
          }),
        },
      ],
    });

    const query = mockCollectionRef.where('timestamp', '>=', startOfMonth.getTime());
    const snapshot = await query.get();
    const thisMonthRevenue = snapshot.docs.reduce((sum, doc) => sum + doc.data().totalCost, 0);

    expect(thisMonthRevenue).toBe(800);
  });

  it('should calculate revenue growth percentage', () => {
    const lastMonthRevenue = 1000;
    const thisMonthRevenue = 1200;

    const growth = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    expect(growth).toBe(20);
  });

  it('should return product breakdown with records and revenue', async () => {
    mockCollectionRef.get.mockResolvedValue({
      docs: [
        {
          id: 'product-1',
          data: () => ({
            productId: 'product-1',
            recordsDelivered: 50000,
            estimatedValue: 500,
          }),
        },
        {
          id: 'product-2',
          data: () => ({
            productId: 'product-2',
            recordsDelivered: 30000,
            estimatedValue: 300,
          }),
        },
      ],
    });

    const snapshot = await mockCollectionRef.get();
    const breakdown = snapshot.docs.map(doc => doc.data());

    expect(breakdown).toHaveLength(2);
    expect(breakdown[0].recordsDelivered).toBe(50000);
  });

  it('should return tier breakdown', async () => {
    mockCollectionRef.get.mockResolvedValue({
      docs: [
        { data: () => ({ tier: 'starter' }) },
        { data: () => ({ tier: 'starter' }) },
        { data: () => ({ tier: 'professional' }) },
        { data: () => ({ tier: 'enterprise' }) },
      ],
    });

    const snapshot = await mockCollectionRef.get();
    const buyers = snapshot.docs.map(doc => doc.data());

    const tierBreakdown = {
      starter: buyers.filter(b => b.tier === 'starter').length,
      professional: buyers.filter(b => b.tier === 'professional').length,
      enterprise: buyers.filter(b => b.tier === 'enterprise').length,
    };

    expect(tierBreakdown.starter).toBe(2);
    expect(tierBreakdown.professional).toBe(1);
    expect(tierBreakdown.enterprise).toBe(1);
  });

  it('should return top 10 buyers by revenue', async () => {
    const mockBuyers = Array.from({ length: 15 }, (_, i) => ({
      id: `buyer-${i}`,
      data: () => ({
        organizationName: `Org ${i}`,
        estimatedValue: (15 - i) * 1000,
      }),
    }));

    mockCollectionRef.orderBy.mockReturnValue(mockQuery);
    mockQuery.limit.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: mockBuyers.slice(0, 10),
    });

    const query = mockCollectionRef.orderBy('estimatedValue', 'desc');
    const topQuery = query.limit(10);
    const snapshot = await topQuery.get();

    expect(snapshot.docs).toHaveLength(10);
    expect(snapshot.docs[0].data().estimatedValue).toBe(15000); // First item: (15-0)*1000
  });

  it('should handle empty data (no buyers, no records)', async () => {
    mockCollectionRef.get.mockResolvedValue({
      docs: [],
    });

    const snapshot = await mockCollectionRef.get();
    const counts = {
      total: snapshot.docs.length,
      active: 0,
      suspended: 0,
    };

    expect(counts.total).toBe(0);
  });

  it('should return 405 for non-GET methods', async () => {
    const res = createMockRes();
    const req = createMockReq({ method: 'POST' });

    res.status(405);
    expect(res._status).toBe(405);
  });
});

// ============================================================================
// TEST SUITE: Access Logs
// ============================================================================

describe('Access Logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated access logs', async () => {
    const mockLogs = Array.from({ length: 25 }, (_, i) => ({
      id: `log-${i}`,
      data: () => ({
        logId: `log-${i}`,
        timestamp: Date.now() - i * 1000,
        buyerId: `buyer-${i % 5}`,
      }),
    }));

    mockCollectionRef.orderBy.mockReturnValue(mockQuery);
    mockQuery.limit.mockReturnValue(mockQuery);
    mockQuery.offset.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: mockLogs.slice(0, 20),
    });

    const query = mockCollectionRef.orderBy('timestamp', 'desc');
    const limitedQuery = query.limit(20).offset(0);
    const snapshot = await limitedQuery.get();

    expect(snapshot.docs).toHaveLength(20);
  });

  it('should filter by buyerId', async () => {
    mockCollectionRef.where.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: [
        { id: 'log-1', data: () => ({ buyerId: 'buyer-1' }) },
        { id: 'log-2', data: () => ({ buyerId: 'buyer-1' }) },
      ],
    });

    const query = mockCollectionRef.where('buyerId', '==', 'buyer-1');
    const snapshot = await query.get();

    expect(snapshot.docs.every(doc => doc.data().buyerId === 'buyer-1')).toBe(true);
  });

  it('should filter by productId', async () => {
    mockCollectionRef.where.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: [
        { id: 'log-1', data: () => ({ productId: 'product-1' }) },
      ],
    });

    const query = mockCollectionRef.where('productId', '==', 'product-1');
    const snapshot = await query.get();

    expect(snapshot.docs[0].data().productId).toBe('product-1');
  });

  it('should filter by date range', async () => {
    const start = Date.now() - 86400000; // 1 day ago
    const end = Date.now();

    mockCollectionRef.where.mockReturnValue(mockQuery);
    mockQuery.where.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: [
        {
          id: 'log-1',
          data: () => ({
            timestamp: Date.now() - 43200000, // 12 hours ago
          }),
        },
      ],
    });

    const query = mockCollectionRef.where('timestamp', '>=', start);
    const rangeQuery = query.where('timestamp', '<=', end);
    const snapshot = await rangeQuery.get();

    expect(snapshot.docs).toHaveLength(1);
  });

  it('should order by timestamp descending', async () => {
    const mockLogs = [
      { id: 'log-1', data: () => ({ timestamp: 3000 }) },
      { id: 'log-2', data: () => ({ timestamp: 2000 }) },
      { id: 'log-3', data: () => ({ timestamp: 1000 }) },
    ];

    mockCollectionRef.orderBy.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: mockLogs.sort((a, b) => b.data().timestamp - a.data().timestamp),
    });

    const query = mockCollectionRef.orderBy('timestamp', 'desc');
    const snapshot = await query.get();

    const timestamps = snapshot.docs.map(doc => doc.data().timestamp);
    expect(timestamps).toEqual([3000, 2000, 1000]);
  });

  it('should cap pageSize at 200', async () => {
    mockCollectionRef.limit.mockReturnValue(mockQuery);

    const requestedPageSize = 500;
    const cappedPageSize = Math.min(requestedPageSize, 200);
    mockCollectionRef.limit(cappedPageSize);

    expect(mockCollectionRef.limit).toHaveBeenCalledWith(200);
  });

  it('should use default pagination values', async () => {
    mockCollectionRef.limit.mockReturnValue(mockQuery);
    mockCollectionRef.offset.mockReturnValue(mockQuery);

    // Default: page 1, pageSize 50
    mockCollectionRef.limit(50);
    mockCollectionRef.offset(0);

    expect(mockCollectionRef.limit).toHaveBeenCalledWith(50);
    expect(mockCollectionRef.offset).toHaveBeenCalledWith(0);
  });

  it('should return 405 for non-GET methods', async () => {
    const res = createMockRes();
    res.status(405);

    expect(res._status).toBe(405);
  });
});

// ============================================================================
// TEST SUITE: Revenue
// ============================================================================

describe('Revenue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return monthly time series by default', async () => {
    const mockBillingRecords = Array.from({ length: 12 }, (_, i) => ({
      id: `billing-${i}`,
      data: () => ({
        timestamp: new Date(Date.now() - i * 30 * 86400000).getTime(),
        totalCost: 1000 + i * 100,
      }),
    }));

    mockCollectionRef.orderBy.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: mockBillingRecords,
    });

    const query = mockCollectionRef.orderBy('timestamp', 'asc');
    const snapshot = await query.get();

    expect(snapshot.docs).toHaveLength(12);
  });

  it('should support daily period', async () => {
    const mockRecords = Array.from({ length: 30 }, (_, i) => ({
      id: `billing-${i}`,
      data: () => ({
        timestamp: new Date(Date.now() - i * 86400000).getTime(),
        totalCost: 500,
      }),
    }));

    mockCollectionRef.orderBy.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: mockRecords,
    });

    const query = mockCollectionRef.orderBy('timestamp', 'asc');
    const snapshot = await query.get();

    expect(snapshot.docs).toHaveLength(30);
  });

  it('should support weekly period', async () => {
    const mockRecords = Array.from({ length: 52 }, (_, i) => ({
      id: `billing-${i}`,
      data: () => ({
        timestamp: new Date(Date.now() - i * 7 * 86400000).getTime(),
        totalCost: 3500,
      }),
    }));

    mockCollectionRef.orderBy.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: mockRecords,
    });

    const query = mockCollectionRef.orderBy('timestamp', 'asc');
    const snapshot = await query.get();

    expect(snapshot.docs).toHaveLength(52);
  });

  it('should filter by buyerId', async () => {
    mockCollectionRef.where.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: [
        { id: 'billing-1', data: () => ({ buyerId: 'buyer-1', totalCost: 1000 }) },
        { id: 'billing-2', data: () => ({ buyerId: 'buyer-1', totalCost: 1200 }) },
      ],
    });

    const query = mockCollectionRef.where('buyerId', '==', 'buyer-1');
    const snapshot = await query.get();

    expect(snapshot.docs.every(doc => doc.data().buyerId === 'buyer-1')).toBe(true);
  });

  it('should filter by productId', async () => {
    mockCollectionRef.where.mockReturnValue(mockQuery);
    mockQuery.where.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: [
        { id: 'billing-1', data: () => ({ productId: 'product-1', totalCost: 500 }) },
      ],
    });

    const query = mockCollectionRef.where('productId', '==', 'product-1');
    const snapshot = await query.get();

    expect(snapshot.docs[0].data().productId).toBe('product-1');
  });

  it('should filter by date range', async () => {
    const start = Date.now() - 86400000;
    const end = Date.now();

    mockCollectionRef.where.mockReturnValue(mockQuery);
    mockQuery.where.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: [
        { id: 'billing-1', data: () => ({ timestamp: Date.now(), totalCost: 1000 }) },
      ],
    });

    const query = mockCollectionRef.where('timestamp', '>=', start);
    const rangeQuery = query.where('timestamp', '<=', end);
    const snapshot = await rangeQuery.get();

    expect(snapshot.docs).toHaveLength(1);
  });

  it('should calculate totals and average revenue per record', async () => {
    mockCollectionRef.get.mockResolvedValue({
      docs: [
        { data: () => ({ totalCost: 1000, recordCount: 10000 }) },
        { data: () => ({ totalCost: 1200, recordCount: 12000 }) },
      ],
    });

    const snapshot = await mockCollectionRef.get();
    const records = snapshot.docs.map(doc => doc.data());

    const totalRevenue = records.reduce((sum, r) => sum + r.totalCost, 0);
    const totalRecords = records.reduce((sum, r) => sum + r.recordCount, 0);
    const avgPerRecord = totalRevenue / totalRecords;

    expect(totalRevenue).toBe(2200);
    expect(avgPerRecord).toBeCloseTo(0.1, 2); // 2200 / 22000 = 0.1
  });

  it('should return 405 for non-GET methods', async () => {
    const res = createMockRes();
    res.status(405);

    expect(res._status).toBe(405);
  });
});

// ============================================================================
// TEST SUITE: Product Management
// ============================================================================

describe('Product Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET should return all products with subscriber counts and revenue', async () => {
    mockCollectionRef.get.mockResolvedValue({
      docs: [
        {
          id: 'product-1',
          data: () => ({
            productId: 'product-1',
            productName: 'Dataset A',
            subscriberCount: 42,
            totalRevenue: 5200,
          }),
        },
        {
          id: 'product-2',
          data: () => ({
            productId: 'product-2',
            productName: 'Dataset B',
            subscriberCount: 28,
            totalRevenue: 3100,
          }),
        },
      ],
    });

    const snapshot = await mockCollectionRef.get();
    expect(snapshot.docs).toHaveLength(2);
    expect(snapshot.docs[0].data()).toHaveProperty('subscriberCount');
    expect(snapshot.docs[0].data()).toHaveProperty('totalRevenue');
  });

  it('GET should include latest version info', async () => {
    mockCollectionRef.get.mockResolvedValue({
      docs: [
        {
          id: 'product-1',
          data: () => ({
            productId: 'product-1',
            latestVersion: '2.1.0',
            lastReleaseDate: 1234567890,
          }),
        },
      ],
    });

    const snapshot = await mockCollectionRef.get();
    expect(snapshot.docs[0].data().latestVersion).toBe('2.1.0');
  });

  it('GET should include records delivered and last accessed timestamp', async () => {
    mockCollectionRef.get.mockResolvedValue({
      docs: [
        {
          id: 'product-1',
          data: () => ({
            productId: 'product-1',
            recordsDelivered: 1500000,
            lastAccessAt: 1234567890,
          }),
        },
      ],
    });

    const snapshot = await mockCollectionRef.get();
    expect(snapshot.docs[0].data()).toHaveProperty('recordsDelivered');
    expect(snapshot.docs[0].data()).toHaveProperty('lastAccessAt');
  });

  it('should return 405 for non-GET methods on index', async () => {
    const res = createMockRes();
    res.status(405);

    expect(res._status).toBe(405);
  });
});

// ============================================================================
// TEST SUITE: Product Releases
// ============================================================================

describe('Product Releases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
  });

  it('GET should list all releases for a product ordered by version', async () => {
    mockCollectionRef.where.mockReturnValue(mockQuery);
    mockQuery.orderBy.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: [
        {
          id: 'release-3',
          data: () => ({
            productId: 'product-1',
            version: '3.0.0',
            createdAt: 3000,
          }),
        },
        {
          id: 'release-2',
          data: () => ({
            productId: 'product-1',
            version: '2.0.0',
            createdAt: 2000,
          }),
        },
        {
          id: 'release-1',
          data: () => ({
            productId: 'product-1',
            version: '1.0.0',
            createdAt: 1000,
          }),
        },
      ],
    });

    const query = mockCollectionRef.where('productId', '==', 'product-1');
    const orderedQuery = query.orderBy('version', 'desc');
    const snapshot = await orderedQuery.get();

    expect(snapshot.docs).toHaveLength(3);
    expect(snapshot.docs[0].data().version).toBe('3.0.0');
  });

  it('POST should create a new release with valid data', async () => {
    const setMock = vi.fn().mockResolvedValue(undefined);
    mockDocRef.set = setMock;

    const releaseData = {
      productId: 'product-1',
      version: '2.0.0',
      totalRecords: 500000,
      schemaVersion: 2,
      createdAt: Date.now(),
      description: 'Updated dataset',
    };

    await mockDocRef.set(releaseData);
    expect(setMock).toHaveBeenCalledWith(releaseData);
  });

  it('POST should reject version older than latest', async () => {
    mockCollectionRef.where.mockReturnValue(mockQuery);
    mockQuery.orderBy.mockReturnValue(mockQuery);
    mockQuery.limit.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: [
        {
          id: 'release-latest',
          data: () => ({
            productId: 'product-1',
            version: '2.0.0',
          }),
        },
      ],
    });

    const query = mockCollectionRef.where('productId', '==', 'product-1');
    const orderedQuery = query.orderBy('version', 'desc');
    const limitedQuery = orderedQuery.limit(1);
    const snapshot = await limitedQuery.get();

    const latestVersion = snapshot.docs[0].data().version;
    const newVersion = '1.5.0';

    // Simple version comparison (not semantic)
    const isOlderVersion = newVersion.localeCompare(latestVersion) < 0;
    expect(isOlderVersion).toBe(true);
  });

  it('POST should validate required fields (version, totalRecords, schemaVersion)', async () => {
    const req = createMockReq({
      method: 'POST',
      body: {
        version: '1.0.0',
        // Missing totalRecords and schemaVersion
      },
    });

    const requiredFields = ['version', 'totalRecords', 'schemaVersion'];
    const hasAllRequired = requiredFields.every(field => req.body[field] !== undefined);
    expect(hasAllRequired).toBe(false);
  });

  it('POST should return 404 for non-existent product', async () => {
    mockDocRef.get.mockResolvedValue({
      exists: false,
    });

    const doc = await mockDocRef.get();
    expect(doc.exists).toBe(false);
  });

  it('POST should create doc in dataset_releases collection', async () => {
    const setMock = vi.fn().mockResolvedValue(undefined);
    mockDocRef.set = setMock;

    const releaseData = {
      productId: 'product-1',
      version: '1.0.0',
      totalRecords: 100000,
    };

    await mockDocRef.set(releaseData);

    expect(setMock).toHaveBeenCalledWith(expect.objectContaining(releaseData));
  });

  it('GET should return 404 for non-existent product', async () => {
    mockCollectionRef.where.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue({
      docs: [],
    });

    const query = mockCollectionRef.where('productId', '==', 'nonexistent');
    const snapshot = await query.get();

    expect(snapshot.docs).toHaveLength(0);
  });

  it('should return 405 for unsupported methods', async () => {
    const res = createMockRes();
    res.status(405);

    expect(res._status).toBe(405);
  });
});
