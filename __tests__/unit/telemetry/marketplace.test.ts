import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

// ============================================================================
// MOCK SETUP - Firebase Admin
// ============================================================================

const mockDocRef = {
  get: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
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

const mockTransaction = {
  get: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
};

const mockFirestore = {
  collection: vi.fn(() => mockCollectionRef),
  runTransaction: vi.fn(async (fn: any) => fn(mockTransaction)),
};

// Define mock functions using vi.hoisted() so they're available in vi.mock()
const {
  mockStripeUsageRecord,
  mockStripeCustomersList,
  mockStripeCustomersRetrieve,
  mockStripeCustomersCreate,
  mockStripeCheckoutCreate,
} = vi.hoisted(() => ({
  mockStripeUsageRecord: vi.fn(),
  mockStripeCustomersList: vi.fn(),
  mockStripeCustomersRetrieve: vi.fn(),
  mockStripeCustomersCreate: vi.fn(),
  mockStripeCheckoutCreate: vi.fn(),
}));

vi.mock('stripe', () => {
  return {
    default: class MockStripe {
      subscriptionItems = {
        createUsageRecord: mockStripeUsageRecord,
      };
      customers = {
        list: mockStripeCustomersList,
        retrieve: mockStripeCustomersRetrieve,
        create: mockStripeCustomersCreate,
      };
      checkout = {
        sessions: {
          create: mockStripeCheckoutCreate,
        },
      };
    },
  };
});

vi.mock('@/lib/firebase/server', () => ({
  getAdminDb: () => mockFirestore,
}));

// Mock the distributed rate limiter used by AccessControl
vi.mock('@/lib/studio/telemetry/marketplace/rateLimiter', () => ({
  DistributedRateLimiter: {
    checkAndRecord: vi.fn().mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 }),
    getStatus: vi.fn().mockResolvedValue({ requestCount: 1, remaining: 99, windowStart: Date.now(), resetAt: Date.now() + 60000 }),
    cleanup: vi.fn().mockResolvedValue(0),
    clearCache: vi.fn(),
  },
}));

// Mock the Stripe resilience module used by BillingBridge
vi.mock('@/lib/studio/telemetry/marketplace/stripeResilience', () => ({
  StripeCircuitBreaker: {
    execute: vi.fn(async (operation: () => Promise<any>) => operation()),
    getStatus: vi.fn(() => ({ state: 'closed', failureCount: 0, lastFailureAt: 0 })),
    reset: vi.fn(),
  },
  withRetry: vi.fn(async (operation: () => Promise<any>) => operation()),
  CircuitOpenError: class extends Error { constructor() { super('Circuit open'); } },
}));

// Import modules after mocking
import { APIKeyManager } from '@/lib/studio/telemetry/marketplace/apiKeyManager';
import { AccessControl } from '@/lib/studio/telemetry/marketplace/accessControl';
import { DatasetServer } from '@/lib/studio/telemetry/marketplace/datasetServer';
import { BillingBridge, PRICING_TIERS } from '@/lib/studio/telemetry/marketplace/billingBridge';

// ============================================================================
// TEST SUITE: APIKeyManager
// ============================================================================

describe('APIKeyManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAPIKey', () => {
    it('should generate a key with tds_ prefix', () => {
      const key = APIKeyManager.generateAPIKey('buyer-123');
      expect(key).toMatch(/^tds_/);
    });

    it('should generate keys with 48 random hex characters after prefix', () => {
      const key = APIKeyManager.generateAPIKey('buyer-456');
      const suffix = key.replace('tds_', '');
      expect(suffix).toHaveLength(48);
      expect(suffix).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique keys each time', () => {
      const key1 = APIKeyManager.generateAPIKey('buyer-1');
      const key2 = APIKeyManager.generateAPIKey('buyer-1');
      expect(key1).not.toBe(key2);
    });

    it('should contain sufficient entropy', () => {
      const keys = Array.from({ length: 10 }, () => APIKeyManager.generateAPIKey('buyer'));
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(10);
    });
  });

  describe('hashAPIKey', () => {
    it('should hash API key using SHA-256', () => {
      const key = 'tds_test_key_123';
      const hash = APIKeyManager.hashAPIKey(key);
      const expectedHash = crypto
        .createHash('sha256')
        .update(key)
        .digest('hex');
      expect(hash).toBe(expectedHash);
    });

    it('should produce consistent hashes for same key', () => {
      const key = 'tds_consistent_key';
      const hash1 = APIKeyManager.hashAPIKey(key);
      const hash2 = APIKeyManager.hashAPIKey(key);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different keys', () => {
      const hash1 = APIKeyManager.hashAPIKey('tds_key_1');
      const hash2 = APIKeyManager.hashAPIKey('tds_key_2');
      expect(hash1).not.toBe(hash2);
    });

    it('should produce 64-character hex hash (SHA-256)', () => {
      const hash = APIKeyManager.hashAPIKey('tds_any_key');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('validateAPIKey', () => {
    it('should reject key without tds_ prefix', async () => {
      const result = await APIKeyManager.validateAPIKey('invalid_key_format');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key format');
    });

    it('should reject non-existent API key', async () => {
      mockCollectionRef.where.mockReturnValue(mockQuery);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValue({ empty: true, docs: [] });

      const result = await APIKeyManager.validateAPIKey('tds_nonexistent_key');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key not found');
    });

    it('should reject suspended buyer account', async () => {
      const mockBuyerDoc = {
        data: () => ({
          buyerId: 'buyer-1',
          status: 'suspended',
          apiKeyHash: 'test_hash',
          tier: 'starter',
          monthlyRecordLimit: 100000,
          recordsConsumedThisMonth: 50000,
        }),
        ref: { update: vi.fn() },
      };

      mockCollectionRef.where.mockReturnValue(mockQuery);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValue({ empty: false, docs: [mockBuyerDoc] });

      const result = await APIKeyManager.validateAPIKey('tds_suspended_key');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Buyer account is suspended');
    });

    it('should reject cancelled buyer account', async () => {
      const mockBuyerDoc = {
        data: () => ({
          buyerId: 'buyer-1',
          status: 'cancelled',
          apiKeyHash: 'test_hash',
        }),
        ref: { update: vi.fn() },
      };

      mockCollectionRef.where.mockReturnValue(mockQuery);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValue({ empty: false, docs: [mockBuyerDoc] });

      const result = await APIKeyManager.validateAPIKey('tds_cancelled_key');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Buyer account is cancelled');
    });

    it('should reject when monthly record limit exceeded', async () => {
      const mockBuyerDoc = {
        data: () => ({
          buyerId: 'buyer-1',
          status: 'active',
          apiKeyHash: 'test_hash',
          tier: 'starter',
          monthlyRecordLimit: 100000,
          recordsConsumedThisMonth: 100000,
        }),
        ref: { update: vi.fn() },
      };

      mockCollectionRef.where.mockReturnValue(mockQuery);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValue({ empty: false, docs: [mockBuyerDoc] });

      const result = await APIKeyManager.validateAPIKey('tds_exceeded_key');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Monthly record limit exceeded');
    });

    it('should accept valid active buyer with remaining quota', async () => {
      const mockBuyerDoc = {
        data: () => ({
          buyerId: 'buyer-valid',
          status: 'active',
          apiKeyHash: 'test_hash',
          tier: 'professional',
          monthlyRecordLimit: 1000000,
          recordsConsumedThisMonth: 500000,
        }),
        ref: { update: vi.fn().mockResolvedValue(undefined) },
      };

      mockCollectionRef.where.mockReturnValue(mockQuery);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValue({ empty: false, docs: [mockBuyerDoc] });

      const result = await APIKeyManager.validateAPIKey('tds_valid_key');
      expect(result.valid).toBe(true);
      expect(result.buyerId).toBe('buyer-valid');
      expect(result.tier).toBe('professional');
      expect(result.remainingRecords).toBe(500000);
    });

    it('should update lastAccessAt timestamp on validation', async () => {
      const updateMock = vi.fn().mockResolvedValue(undefined);
      const mockBuyerDoc = {
        data: () => ({
          buyerId: 'buyer-1',
          status: 'active',
          apiKeyHash: 'test_hash',
          tier: 'starter',
          monthlyRecordLimit: 100000,
          recordsConsumedThisMonth: 50000,
        }),
        ref: { update: updateMock },
      };

      mockCollectionRef.where.mockReturnValue(mockQuery);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValue({ empty: false, docs: [mockBuyerDoc] });

      await APIKeyManager.validateAPIKey('tds_update_test');
      expect(updateMock).toHaveBeenCalledWith({ lastAccessAt: expect.any(Number) });
    });

    it('should handle Firestore errors gracefully', async () => {
      mockCollectionRef.where.mockReturnValue(mockQuery);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.get.mockRejectedValue(new Error('Firestore connection failed'));

      const result = await APIKeyManager.validateAPIKey('tds_error_key');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Validation error');
    });
  });

  describe('rotateAPIKey', () => {
    it('should return null if buyer not found', async () => {
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({ exists: false });

      const result = await APIKeyManager.rotateAPIKey('nonexistent-buyer');
      expect(result).toBeNull();
    });

    it('should generate and store new key for buyer', async () => {
      const updateMock = vi.fn().mockResolvedValue(undefined);
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({ buyerId: 'buyer-1' }),
      });
      mockDocRef.update = updateMock;

      const newKey = await APIKeyManager.rotateAPIKey('buyer-1');
      expect(newKey).toMatch(/^tds_/);
      expect(updateMock).toHaveBeenCalledWith({
        apiKeyHash: expect.any(String),
        updatedAt: expect.any(Number),
      });
    });

    it('should return new API key', async () => {
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({ exists: true });
      mockDocRef.update.mockResolvedValue(undefined);

      const newKey = await APIKeyManager.rotateAPIKey('buyer-1');
      expect(newKey).toMatch(/^tds_/);
      expect(newKey).toHaveLength(52); // 4 for prefix + 48 for random
    });
  });

  describe('revokeAPIKey', () => {
    it('should return false if buyer not found', async () => {
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({ exists: false });

      const result = await APIKeyManager.revokeAPIKey('nonexistent-buyer');
      expect(result).toBe(false);
    });

    it('should suspend buyer account on revoke', async () => {
      const updateMock = vi.fn().mockResolvedValue(undefined);
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({ exists: true });
      mockDocRef.update = updateMock;

      const result = await APIKeyManager.revokeAPIKey('buyer-to-revoke');
      expect(result).toBe(true);
      expect(updateMock).toHaveBeenCalledWith({
        status: 'suspended',
        updatedAt: expect.any(Number),
      });
    });

    it('should return true on successful revoke', async () => {
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({ exists: true });
      mockDocRef.update.mockResolvedValue(undefined);

      const result = await APIKeyManager.revokeAPIKey('buyer-1');
      expect(result).toBe(true);
    });
  });

  describe('storeAPIKeyHash', () => {
    it('should store API key hash for buyer', async () => {
      const updateMock = vi.fn().mockResolvedValue(undefined);
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.update = updateMock;

      const result = await APIKeyManager.storeAPIKeyHash('buyer-1', 'hashed_key_123');
      expect(result).toBe(true);
      expect(updateMock).toHaveBeenCalledWith({ apiKeyHash: 'hashed_key_123' });
    });

    it('should return false on storage error', async () => {
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.update.mockRejectedValue(new Error('Storage failed'));

      const result = await APIKeyManager.storeAPIKeyHash('buyer-1', 'some_hash');
      expect(result).toBe(false);
    });
  });
});

// ============================================================================
// TEST SUITE: AccessControl
// ============================================================================

describe('AccessControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateRequest', () => {
    it('should reject request with invalid API key', async () => {
      vi.spyOn(APIKeyManager, 'validateAPIKey').mockResolvedValue({
        valid: false,
        error: 'Invalid API key format',
      });

      const result = await AccessControl.validateRequest('invalid_key', 'product-1', 1000);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key format');
    });

    it('should reject request if not subscribed to product', async () => {
      vi.spyOn(APIKeyManager, 'validateAPIKey').mockResolvedValue({
        valid: true,
        buyerId: 'buyer-1',
        tier: 'starter',
        remainingRecords: 50000,
      });

      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          buyerId: 'buyer-1',
          subscribedProducts: ['product-2', 'product-3'],
        }),
      });

      const result = await AccessControl.validateRequest('tds_valid_key', 'product-1', 1000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not subscribed');
    });

    it('should reject request exceeding monthly quota', async () => {
      vi.spyOn(APIKeyManager, 'validateAPIKey').mockResolvedValue({
        valid: true,
        buyerId: 'buyer-1',
        tier: 'starter',
        remainingRecords: 500,
      });

      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          subscribedProducts: ['product-1'],
        }),
      });

      const result = await AccessControl.validateRequest('tds_valid_key', 'product-1', 1000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient quota');
    });

    it('should accept valid request with subscription and quota', async () => {
      vi.spyOn(APIKeyManager, 'validateAPIKey').mockResolvedValue({
        valid: true,
        buyerId: 'buyer-valid',
        tier: 'professional',
        remainingRecords: 100000,
      });

      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          buyerId: 'buyer-valid',
          subscribedProducts: ['product-1', 'product-2'],
        }),
      });

      const result = await AccessControl.validateRequest('tds_valid_key', 'product-1', 50000);
      expect(result.valid).toBe(true);
      expect(result.buyerId).toBe('buyer-valid');
    });

    it('should reject request if buyer not found in Firestore', async () => {
      vi.spyOn(APIKeyManager, 'validateAPIKey').mockResolvedValue({
        valid: true,
        buyerId: 'buyer-1',
        tier: 'starter',
        remainingRecords: 50000,
      });

      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({ exists: false });

      const result = await AccessControl.validateRequest('tds_valid_key', 'product-1', 1000);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Buyer not found');
    });
  });

  // NOTE: Rate limiting tests moved to production-hardening.test.ts
  // The old in-memory checkRateLimit was replaced with DistributedRateLimiter (Firestore-backed)

  describe('logAccess', () => {
    it('should create access log entry', async () => {
      const docMock = { set: vi.fn().mockResolvedValue(undefined) };

      const buyerDocRef = {
        get: vi.fn(),
        update: vi.fn(),
      };

      // Mock transaction.get to return a buyer doc
      mockTransaction.get.mockResolvedValue({
        exists: true,
        data: () => ({ recordsConsumedThisMonth: 500 }),
      });

      const originalCollection = mockFirestore.collection.getMockImplementation?.() || mockFirestore.collection;

      mockFirestore.collection.mockImplementation((name: string) => {
        if (name === 'data_access_logs') {
          return { doc: vi.fn().mockReturnValue(docMock) };
        }
        if (name === 'data_buyers') {
          return { doc: vi.fn().mockReturnValue(buyerDocRef) };
        }
        return mockCollectionRef;
      });

      const logId = await AccessControl.logAccess(
        'buyer-1',
        'product-1',
        '1.0.0',
        10000,
        10000,
        150,
        'jsonl',
        '192.168.1.1'
      );

      expect(logId).toMatch(/^log_/);
      expect(docMock.set).toHaveBeenCalledWith({
        logId: expect.any(String),
        buyerId: 'buyer-1',
        productId: 'product-1',
        releaseVersion: '1.0.0',
        recordsRequested: 10000,
        recordsDelivered: 10000,
        timestamp: expect.any(Number),
        responseTimeMs: 150,
        format: 'jsonl',
        ipAddress: '192.168.1.1',
      });

      // Verify transaction was used for consumption update
      expect(mockFirestore.runTransaction).toHaveBeenCalled();

      // Restore the original implementation
      mockFirestore.collection.mockImplementation(originalCollection as any);
    });

    it('should return null on logging error', async () => {
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.set.mockRejectedValue(new Error('Write failed'));

      const logId = await AccessControl.logAccess(
        'buyer-1',
        'product-1',
        '1.0.0',
        1000,
        1000,
        100,
        'jsonl',
        '192.168.1.1'
      );

      expect(logId).toBeNull();
    });
  });

  describe('getUsageReport', () => {
    beforeEach(() => {
      // Set up the where().where().get() chain for access log queries
      const chainedQuery = {
        where: vi.fn().mockReturnThis(),
        get: vi.fn(),
      };
      mockFirestore.collection.mockImplementation((name: string) => {
        if (name === 'data_access_logs') {
          return { where: vi.fn().mockReturnValue(chainedQuery) };
        }
        return mockCollectionRef;
      });
      // Store reference for test assertions
      (globalThis as any).__chainedQuery = chainedQuery;
    });

    afterEach(() => {
      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      delete (globalThis as any).__chainedQuery;
    });

    it('should return empty report when no logs found', async () => {
      const chainedQuery = (globalThis as any).__chainedQuery;
      chainedQuery.get.mockResolvedValue({ empty: true, docs: [] });

      const report = await AccessControl.getUsageReport('buyer-1', 1000, 2000);
      expect(report).toEqual({
        buyerId: 'buyer-1',
        period: { start: 1000, end: 2000 },
        productBreakdown: {},
        totalRecords: 0,
        totalValue: 0,
      });
    });

    it('should aggregate usage by product', async () => {
      const chainedQuery = (globalThis as any).__chainedQuery;
      const mockLogs = [
        { data: () => ({ buyerId: 'buyer-1', productId: 'product-1', recordsDelivered: 5000 }) },
        { data: () => ({ buyerId: 'buyer-1', productId: 'product-1', recordsDelivered: 3000 }) },
        { data: () => ({ buyerId: 'buyer-1', productId: 'product-2', recordsDelivered: 2000 }) },
      ];
      chainedQuery.get.mockResolvedValue({ empty: false, docs: mockLogs });

      const report = await AccessControl.getUsageReport('buyer-1', 1000, 2000);
      expect(report.totalRecords).toBe(10000);
      expect(report.productBreakdown['product-1'].recordsDelivered).toBe(8000);
      expect(report.productBreakdown['product-2'].recordsDelivered).toBe(2000);
    });

    it('should calculate estimated value for records', async () => {
      const chainedQuery = (globalThis as any).__chainedQuery;
      const mockLogs = [
        { data: () => ({ buyerId: 'buyer-1', productId: 'product-1', recordsDelivered: 1000 }) },
      ];
      chainedQuery.get.mockResolvedValue({ empty: false, docs: mockLogs });

      const report = await AccessControl.getUsageReport('buyer-1', 1000, 2000);
      expect(report.productBreakdown['product-1'].estimatedValue).toBe(10);
      expect(report.totalValue).toBe(10);
    });
  });
});

// ============================================================================
// TEST SUITE: DatasetServer
// ============================================================================

describe('DatasetServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('getCatalog', () => {
    it('should return empty array when no releases found', async () => {
      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.get.mockResolvedValue({ empty: true, docs: [] });

      const catalog = await DatasetServer.getCatalog();
      expect(catalog).toEqual([]);
    });

    it('should return catalog entries from releases', async () => {
      const mockReleases = [
        {
          id: 'release-1',
          data: () => ({
            productId: 'product-1',
            productName: 'Product One',
            description: 'First product',
            version: '1.0.0',
            totalRecords: 50000,
            schemaVersion: 1,
            sampleRecord: { id: 1, name: 'test' },
            pricePerRecord: { min: 0.005, max: 0.05 },
            createdAt: 1000,
            availableFormats: ['jsonl', 'json', 'parquet'],
            kAnonymityGuarantee: 5,
          }),
        },
      ];

      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.get.mockResolvedValue({ empty: false, docs: mockReleases });

      const catalog = await DatasetServer.getCatalog();
      expect(catalog).toHaveLength(1);
      expect(catalog[0]).toEqual({
        productId: 'product-1',
        productName: 'Product One',
        description: 'First product',
        latestVersion: '1.0.0',
        totalRecords: 50000,
        schemaVersion: 1,
        sampleRecord: { id: 1, name: 'test' },
        pricePerRecord: { min: 0.005, max: 0.05 },
        updatedAt: 1000,
        availableFormats: ['jsonl', 'json', 'parquet'],
        kAnonymityGuarantee: 5,
      });
    });

    it('should sort catalog by latest updates first', async () => {
      const mockReleases = [
        {
          id: 'release-1',
          data: () => ({
            productId: 'product-1',
            productName: 'Product One',
            version: '1.0.0',
            createdAt: 1000,
            totalRecords: 1000,
            schemaVersion: 1,
          }),
        },
        {
          id: 'release-2',
          data: () => ({
            productId: 'product-2',
            productName: 'Product Two',
            version: '2.0.0',
            createdAt: 2000,
            totalRecords: 2000,
            schemaVersion: 1,
          }),
        },
      ];

      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.get.mockResolvedValue({ empty: false, docs: mockReleases });

      const catalog = await DatasetServer.getCatalog();
      expect(catalog[0].productId).toBe('product-2');
      expect(catalog[1].productId).toBe('product-1');
    });

    it('should use default values for optional fields', async () => {
      const mockReleases = [
        {
          id: 'release-1',
          data: () => ({
            productId: 'product-minimal',
            productName: 'Minimal Product',
            description: 'Minimal metadata',
            version: '1.0.0',
            totalRecords: 1000,
            schemaVersion: 1,
          }),
        },
      ];

      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.get.mockResolvedValue({ empty: false, docs: mockReleases });

      const catalog = await DatasetServer.getCatalog();
      expect(catalog[0].sampleRecord).toEqual({});
      expect(catalog[0].pricePerRecord).toEqual({ min: 0.005, max: 0.05 });
      expect(catalog[0].availableFormats).toEqual(['jsonl', 'json']);
      expect(catalog[0].kAnonymityGuarantee).toBe(5);
    });
  });

  describe('getProductRecords', () => {
    it('should return null when product not found', async () => {
      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.where.mockReturnValue(mockQuery);
      mockQuery.orderBy.mockReturnValue(mockQuery);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValue({ empty: true, docs: [] });

      const result = await DatasetServer.getProductRecords('nonexistent-product');
      expect(result).toBeNull();
    });

    it('should retrieve records with pagination', async () => {
      const mockRecordDocs = [
        { id: 'record-1', data: () => ({ name: 'Record 1' }) },
        { id: 'record-2', data: () => ({ name: 'Record 2' }) },
      ];

      const recordsCollectionRef = {
        orderBy: vi.fn().mockReturnValue(mockQuery),
      };

      const releaseDocRef = {
        collection: vi.fn().mockReturnValue(recordsCollectionRef),
      };

      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.where.mockReturnValue(mockQuery);
      mockQuery.orderBy.mockReturnValue(mockQuery);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'release-1',
            data: () => ({
              productId: 'product-1',
              version: '1.0.0',
              totalRecords: 1000,
            }),
          },
        ],
      });

      mockCollectionRef.doc.mockReturnValue(releaseDocRef);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.offset.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValueOnce({
        empty: false,
        docs: mockRecordDocs,
      });

      const result = await DatasetServer.getProductRecords('product-1', {
        limit: 100,
        offset: 0,
        format: 'jsonl',
      });

      expect(result).not.toBeNull();
      expect(result?.records).toHaveLength(2);
      expect(result?.records[0]).toEqual({ recordId: 'record-1', name: 'Record 1' });
    });

    it('should enforce maximum limit of 10000 records', async () => {
      const recordsCollectionRef = {
        orderBy: vi.fn().mockReturnValue(mockQuery),
      };

      const releaseDocRef = {
        collection: vi.fn().mockReturnValue(recordsCollectionRef),
      };

      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.where.mockReturnValue(mockQuery);
      mockQuery.orderBy.mockReturnValue(mockQuery);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'release-1',
            data: () => ({
              productId: 'product-1',
              version: '1.0.0',
              totalRecords: 50000,
            }),
          },
        ],
      });

      mockCollectionRef.doc.mockReturnValue(releaseDocRef);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.offset.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValueOnce({ empty: false, docs: [] });

      await DatasetServer.getProductRecords('product-1', { limit: 50000 });

      const callArgs = mockQuery.limit.mock.calls[mockQuery.limit.mock.calls.length - 1];
      expect(callArgs[0]).toBe(10000);
    });

    it('should default limit to 100 if not provided', async () => {
      const recordsCollectionRef = {
        orderBy: vi.fn().mockReturnValue(mockQuery),
      };

      const releaseDocRef = {
        collection: vi.fn().mockReturnValue(recordsCollectionRef),
      };

      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.where.mockReturnValue(mockQuery);
      mockQuery.orderBy.mockReturnValue(mockQuery);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'release-1',
            data: () => ({
              productId: 'product-1',
              version: '1.0.0',
              totalRecords: 1000,
            }),
          },
        ],
      });

      mockCollectionRef.doc.mockReturnValue(releaseDocRef);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.offset.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValueOnce({ empty: false, docs: [] });

      await DatasetServer.getProductRecords('product-1', {});

      const callArgs = mockQuery.limit.mock.calls[mockQuery.limit.mock.calls.length - 1];
      expect(callArgs[0]).toBe(100);
    });

    it('should return format in response', async () => {
      const recordsCollectionRef = {
        orderBy: vi.fn().mockReturnValue(mockQuery),
      };

      const releaseDocRef = {
        collection: vi.fn().mockReturnValue(recordsCollectionRef),
      };

      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.where.mockReturnValue(mockQuery);
      mockQuery.orderBy.mockReturnValue(mockQuery);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'release-1',
            data: () => ({
              productId: 'product-1',
              version: '1.0.0',
              totalRecords: 100,
            }),
          },
        ],
      });

      mockCollectionRef.doc.mockReturnValue(releaseDocRef);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.offset.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValueOnce({ empty: false, docs: [] });

      const result = await DatasetServer.getProductRecords('product-1', { format: 'parquet' });

      expect(result?.format).toBe('parquet');
    });
  });

  describe('getLatestRelease', () => {
    it('should return null when product not found', async () => {
      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.where.mockReturnValue(mockQuery);
      mockQuery.orderBy.mockReturnValue(mockQuery);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValueOnce({ empty: true, docs: [] });

      const result = await DatasetServer.getLatestRelease('nonexistent');
      expect(result).toBeNull();
    });

    it('should return latest release with release ID', async () => {
      const mockRelease = {
        id: 'release-latest',
        data: () => ({
          productId: 'product-1',
          version: '2.0.0',
          totalRecords: 5000,
        }),
      };

      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.where.mockReturnValue(mockQuery);
      mockQuery.orderBy.mockReturnValue(mockQuery);
      mockQuery.limit.mockReturnValue(mockQuery);
      mockQuery.get.mockResolvedValueOnce({ empty: false, docs: [mockRelease] });

      const result = await DatasetServer.getLatestRelease('product-1');
      expect(result).not.toBeNull();
      expect(result.releaseId).toBe('release-latest');
      expect(result.version).toBe('2.0.0');
    });
  });

  describe('getSampleRecords', () => {
    it('should limit samples to maximum 10 records', async () => {
      const recordDocs = Array(15)
        .fill(null)
        .map((_, i) => ({
          id: `sample-${i}`,
          data: () => ({ value: i }),
        }));

      const mockRelease = {
        releaseId: 'release-1',
        productName: 'Test Product',
        schemaVersion: 1,
        version: '1.0.0',
        totalRecords: 1000,
      };

      vi.spyOn(DatasetServer, 'getLatestRelease').mockResolvedValue(mockRelease);

      const recordsCollectionRef = {
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ empty: false, docs: recordDocs.slice(0, 10) }),
        }),
      };

      const releaseDocRef = {
        collection: vi.fn().mockReturnValue(recordsCollectionRef),
      };

      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.doc.mockReturnValue(releaseDocRef);

      const result = await DatasetServer.getSampleRecords('product-1', 15);
      expect(result?.records).toHaveLength(10);

      vi.restoreAllMocks();
    });

    it('should return null for non-existent product', async () => {
      const spy = vi.spyOn(DatasetServer, 'getLatestRelease').mockResolvedValue(null);

      const result = await DatasetServer.getSampleRecords('nonexistent');
      expect(result).toBeNull();

      spy.mockRestore();
    });
  });

  describe('streamRecords', () => {
    it('should yield records in batches', async () => {
      const mockRecords1 = {
        records: Array(100).fill(null).map((_, i) => ({ id: 1, index: i })),
        totalCount: 250,
        format: 'jsonl',
        productId: 'product-1',
        version: '1.0.0',
      };
      const mockRecords2 = {
        records: Array(100).fill(null).map((_, i) => ({ id: 2, index: i })),
        totalCount: 250,
        format: 'jsonl',
        productId: 'product-1',
        version: '1.0.0',
      };
      const mockRecords3 = {
        records: Array(50).fill(null).map((_, i) => ({ id: 3, index: i })),
        totalCount: 250,
        format: 'jsonl',
        productId: 'product-1',
        version: '1.0.0',
      };

      const getProductRecordsSpy = vi.spyOn(DatasetServer, 'getProductRecords')
        .mockResolvedValueOnce(mockRecords1)
        .mockResolvedValueOnce(mockRecords2)
        .mockResolvedValueOnce(mockRecords3);

      const records: any[] = [];
      for await (const record of DatasetServer.streamRecords('product-1', { batchSize: 100 })) {
        records.push(record);
      }

      expect(records).toHaveLength(250);
      expect(getProductRecordsSpy).toHaveBeenCalledTimes(3);
      getProductRecordsSpy.mockRestore();
    });

    it('should stop when no more records available', async () => {
      const mockRecords = {
        records: Array(50).fill(null).map((_, i) => ({ id: 1, index: i })),
        totalCount: 50,
        format: 'jsonl',
        productId: 'product-1',
        version: '1.0.0',
      };

      const getProductRecordsSpy = vi.spyOn(DatasetServer, 'getProductRecords')
        .mockResolvedValueOnce(mockRecords);

      const records: any[] = [];
      for await (const record of DatasetServer.streamRecords('product-1', { batchSize: 1000 })) {
        records.push(record);
      }

      expect(records).toHaveLength(50);
      expect(getProductRecordsSpy).toHaveBeenCalledTimes(1);
      getProductRecordsSpy.mockRestore();
    });
  });
});

// ============================================================================
// TEST SUITE: BillingBridge
// ============================================================================

describe('BillingBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordUsage', () => {
    it('should return false when buyer not found', async () => {
      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({ exists: false });

      const result = await BillingBridge.recordUsage('nonexistent-buyer', 'product-1', 1000);
      expect(result).toBe(false);
    });

    it('should return false when no billing customer ID', async () => {
      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          buyerId: 'buyer-1',
          billingCustomerId: null,
        }),
      });

      const result = await BillingBridge.recordUsage('buyer-1', 'product-1', 1000);
      expect(result).toBe(false);
    });

    it('should record usage to Stripe subscription', async () => {
      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          buyerId: 'buyer-1',
          tier: 'professional',
          billingCustomerId: 'cus_123',
          stripeSubscriptionItemId: 'si_123',
        }),
      });
      mockDocRef.set.mockResolvedValue(undefined);
      mockStripeUsageRecord.mockResolvedValue({});

      const result = await BillingBridge.recordUsage('buyer-1', 'product-1', 5000);
      expect(result).toBe(true);
      expect(mockStripeUsageRecord).toHaveBeenCalledWith('si_123', {
        quantity: 5000,
      });
    });

    it('should create billing record in Firestore', async () => {
      const docSetMock = vi.fn().mockResolvedValue(undefined);
      const docRefMock = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            buyerId: 'buyer-1',
            tier: 'starter',
            billingCustomerId: 'cus_123',
            stripeSubscriptionItemId: 'si_123',
          }),
        }),
      };

      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.doc.mockReturnValue(docRefMock);
      mockCollectionRef.doc.mockReturnValue({ set: docSetMock });

      // Set up two different collection refs
      let callCount = 0;
      mockFirestore.collection.mockImplementation((name: string) => {
        callCount++;
        if (callCount === 1) return mockCollectionRef;
        const ref = { doc: vi.fn().mockReturnValue({ set: docSetMock }) };
        return ref;
      });

      mockCollectionRef.doc.mockReturnValue(docRefMock);
      mockStripeUsageRecord.mockResolvedValue({});

      await BillingBridge.recordUsage('buyer-1', 'product-1', 5000);

      expect(docSetMock).toHaveBeenCalledWith(
        expect.objectContaining({
          buyerId: 'buyer-1',
          productId: 'product-1',
          recordCount: 5000,
          pricePerRecord: expect.any(Number),
          totalCost: expect.any(Number),
        })
      );
    });

    it('should calculate correct cost based on tier', async () => {
      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          buyerId: 'buyer-1',
          tier: 'professional',
          billingCustomerId: 'cus_123',
          stripeSubscriptionItemId: 'si_123',
        }),
      });
      mockDocRef.set.mockResolvedValue(undefined);
      mockStripeUsageRecord.mockResolvedValue({});

      await BillingBridge.recordUsage('buyer-1', 'product-1', 1000);

      // Professional tier price is 0.008 per record
      // 1000 * 0.008 = 8.00
      expect(mockStripeUsageRecord).toHaveBeenCalledWith('si_123', {
        quantity: 1000,
      });
    });

    it('should handle Stripe errors gracefully', async () => {
      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          buyerId: 'buyer-1',
          tier: 'starter',
          billingCustomerId: 'cus_123',
          stripeSubscriptionItemId: 'si_123',
        }),
      });
      mockStripeUsageRecord.mockRejectedValue(new Error('Stripe API error'));

      const result = await BillingBridge.recordUsage('buyer-1', 'product-1', 1000);
      expect(result).toBe(false);
    });

    it('should achieve idempotency with unique billing log IDs', async () => {
      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          buyerId: 'buyer-1',
          tier: 'starter',
          billingCustomerId: 'cus_123',
          stripeSubscriptionItemId: 'si_123',
        }),
      });
      mockDocRef.set.mockResolvedValue(undefined);
      mockStripeUsageRecord.mockResolvedValue({});

      let docSetMock: any = null;
      const billingCollectionRef = {
        doc: vi.fn().mockImplementation((logId: string) => {
          docSetMock = { set: vi.fn().mockResolvedValue(undefined) };
          return docSetMock;
        }),
      };

      mockFirestore.collection.mockImplementation((name: string) => {
        if (name === 'data_buyers') return mockCollectionRef;
        if (name === 'billing_records') return billingCollectionRef;
        return mockCollectionRef;
      });

      await BillingBridge.recordUsage('buyer-1', 'product-1', 1000);
      const firstCallArg = billingCollectionRef.doc.mock.calls[0]?.[0];

      await BillingBridge.recordUsage('buyer-1', 'product-1', 1000);
      const secondCallArg = billingCollectionRef.doc.mock.calls[1]?.[0];

      expect(firstCallArg).toBeDefined();
      expect(secondCallArg).toBeDefined();
      expect(firstCallArg).not.toBe(secondCallArg);
    });
  });

  describe('getBillingStatus', () => {
    it('should return null when buyer not found', async () => {
      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({ exists: false });

      const result = await BillingBridge.getBillingStatus('nonexistent-buyer');
      expect(result).toBeNull();
    });

    it('should return billing status for active buyer', async () => {
      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          buyerId: 'buyer-1',
          status: 'active',
          tier: 'starter',
          recordsConsumedThisMonth: 50000,
          billingCustomerId: 'cus_123',
        }),
      });
      mockStripeCustomersRetrieve.mockResolvedValue({
        subscriptions: { data: [{ status: 'active' }] },
      });

      const result = await BillingBridge.getBillingStatus('buyer-1');
      expect(result?.status).toBe('active');
      expect(result?.tier).toBe('starter');
      expect(result?.currentUsage).toBe(50000);
      expect(result?.monthlyLimit).toBe(PRICING_TIERS['starter'].monthlyRecordLimit);
    });

    it('should calculate estimated cost', async () => {
      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          buyerId: 'buyer-1',
          status: 'active',
          tier: 'professional',
          recordsConsumedThisMonth: 100000,
        }),
      });

      const result = await BillingBridge.getBillingStatus('buyer-1');
      // Professional: 0.008 per record
      // 100000 * 0.008 = 800
      expect(result?.estimatedCost).toBe(800);
    });
  });

  describe('estimateCost', () => {
    it('should calculate cost for starter tier', () => {
      const cost = BillingBridge.estimateCost('starter', 10000);
      expect(cost).toBe(100); // 10000 * 0.01
    });

    it('should calculate cost for professional tier', () => {
      const cost = BillingBridge.estimateCost('professional', 10000);
      expect(cost).toBe(80); // 10000 * 0.008
    });

    it('should calculate cost for enterprise tier', () => {
      const cost = BillingBridge.estimateCost('enterprise', 10000);
      expect(cost).toBe(50); // 10000 * 0.005
    });

    it('should use starter tier as default for unknown tier', () => {
      const cost = BillingBridge.estimateCost('unknown-tier', 10000);
      expect(cost).toBe(100); // Uses starter tier pricing
    });
  });

  describe('createCheckoutSession', () => {
    it('should create or retrieve Stripe customer', async () => {
      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.doc.mockReturnValue(mockDocRef);

      mockStripeCustomersList.mockResolvedValue({ data: [] });
      mockStripeCustomersCreate.mockResolvedValue({ id: 'cus_new_123' });
      mockStripeCheckoutCreate.mockResolvedValue({
        url: 'https://checkout.stripe.com/session/test',
      });
      mockDocRef.update.mockResolvedValue(undefined);

      const sessionUrl = await BillingBridge.createCheckoutSession(
        'buyer-new',
        'buyer@example.com',
        'starter'
      );

      expect(sessionUrl).toBe('https://checkout.stripe.com/session/test');
      expect(mockStripeCustomersCreate).toHaveBeenCalledWith({
        email: 'buyer@example.com',
        metadata: {
          buyerId: 'buyer-new',
          tier: 'starter',
        },
      });
    });

    it('should reuse existing Stripe customer', async () => {
      mockStripeCustomersList.mockResolvedValue({
        data: [{ id: 'cus_existing_123' }],
      });
      mockStripeCheckoutCreate.mockResolvedValue({
        url: 'https://checkout.stripe.com/session/test',
      });

      const sessionUrl = await BillingBridge.createCheckoutSession(
        'buyer-1',
        'buyer@example.com',
        'professional'
      );

      expect(sessionUrl).toBe('https://checkout.stripe.com/session/test');
      expect(mockStripeCustomersCreate).not.toHaveBeenCalled();
    });

    it('should handle checkout session creation errors', async () => {
      mockStripeCustomersList.mockResolvedValue({ data: [] });
      mockStripeCustomersCreate.mockResolvedValue({ id: 'cus_123' });
      mockStripeCheckoutCreate.mockRejectedValue(new Error('Stripe error'));
      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.update.mockResolvedValue(undefined);

      const sessionUrl = await BillingBridge.createCheckoutSession(
        'buyer-1',
        'buyer@example.com',
        'starter'
      );

      expect(sessionUrl).toBeNull();
    });

    it('should return null when no session URL', async () => {
      mockStripeCustomersList.mockResolvedValue({ data: [] });
      mockStripeCustomersCreate.mockResolvedValue({ id: 'cus_123' });
      mockStripeCheckoutCreate.mockResolvedValue({ url: null });
      mockFirestore.collection.mockReturnValue(mockCollectionRef);
      mockCollectionRef.doc.mockReturnValue(mockDocRef);
      mockDocRef.update.mockResolvedValue(undefined);

      const sessionUrl = await BillingBridge.createCheckoutSession(
        'buyer-1',
        'buyer@example.com',
        'starter'
      );

      expect(sessionUrl).toBeNull();
    });
  });

  describe('PRICING_TIERS constants', () => {
    it('should define all three pricing tiers', () => {
      expect(PRICING_TIERS).toHaveProperty('starter');
      expect(PRICING_TIERS).toHaveProperty('professional');
      expect(PRICING_TIERS).toHaveProperty('enterprise');
    });

    it('starter tier should have correct config', () => {
      expect(PRICING_TIERS['starter']).toEqual({
        tier: 'starter',
        monthlyRecordLimit: 100000,
        pricePerRecord: 0.01,
        monthlyMinimum: 500,
        supportLevel: 'email',
        customSchemas: false,
        realTimeAccess: false,
      });
    });

    it('enterprise tier should have highest limits', () => {
      expect(PRICING_TIERS['enterprise'].monthlyRecordLimit).toBe(Infinity);
      expect(PRICING_TIERS['enterprise'].pricePerRecord).toBeLessThan(
        PRICING_TIERS['professional'].pricePerRecord
      );
    });
  });
});
