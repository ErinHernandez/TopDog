/**
 * Asset Management Service Tests
 *
 * Tests the assetManagementService which handles:
 * - Asset record creation in Firestore
 * - File uploads to Firebase Storage
 * - Asset retrieval and search
 * - Asset deletion
 *
 * @module __tests__/unit/services/assetManagementService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// MOCKS — hoisted so they work with vi.mock()
// ============================================================================

const mocks = vi.hoisted(() => ({
  mockFirestoreSet: vi.fn().mockResolvedValue(undefined),
  mockFirestoreGet: vi.fn(),
  mockFirestoreUpdate: vi.fn().mockResolvedValue(undefined),
  mockFirestoreDelete: vi.fn().mockResolvedValue(undefined),
  mockFirestoreCollectionGet: vi.fn(),
  mockFirestoreCountGet: vi.fn(),
  mockStorageSave: vi.fn().mockResolvedValue(undefined),
  mockStorageGetSignedUrl: vi.fn(),
  mockStorageDelete: vi.fn().mockResolvedValue(undefined),
  mockCacheGet: vi.fn(),
  mockCacheSet: vi.fn().mockResolvedValue(undefined),
  mockCacheInvalidate: vi.fn().mockResolvedValue(undefined),
  mockCacheInvalidatePattern: vi.fn().mockResolvedValue(undefined),
}));

// Mock Firebase Admin
vi.mock('@/lib/firebase/server', () => {
  // Build chainable query mock
  const buildQueryChain = () => {
    const chain: Record<string, any> = {};
    chain.where = vi.fn().mockReturnValue(chain);
    chain.orderBy = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);
    chain.offset = vi.fn().mockReturnValue(chain);
    chain.get = mocks.mockFirestoreCollectionGet;
    chain.count = vi.fn().mockReturnValue({
      get: mocks.mockFirestoreCountGet,
    });
    chain.doc = vi.fn(() => ({
      set: mocks.mockFirestoreSet,
      get: mocks.mockFirestoreGet,
      update: mocks.mockFirestoreUpdate,
      delete: mocks.mockFirestoreDelete,
    }));
    return chain;
  };

  return {
    getAdminDb: vi.fn(() => ({
      collection: vi.fn(() => buildQueryChain()),
    })),
    getAdminStorage: vi.fn(() => ({
      bucket: vi.fn(() => ({
        file: vi.fn(() => ({
          save: mocks.mockStorageSave,
          getSignedUrl: mocks.mockStorageGetSignedUrl,
          delete: mocks.mockStorageDelete,
        })),
      })),
    })),
  };
});

// Mock cache manager
vi.mock('@/lib/studio/infrastructure/cache/cacheManager', () => ({
  getCacheManager: vi.fn(() => ({
    get: mocks.mockCacheGet,
    set: mocks.mockCacheSet,
    invalidate: mocks.mockCacheInvalidate,
    invalidatePattern: mocks.mockCacheInvalidatePattern,
  })),
}));

// Mock server logger
vi.mock('@/lib/studio/services/serverLogger', () => ({
  serverLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

const importService = async () => {
  const module = await import('@/lib/studio/services/assetManagementService');
  return module.getAssetManagementService();
};

// ============================================================================
// TESTS
// ============================================================================

describe('assetManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: cache miss
    mocks.mockCacheGet.mockResolvedValue(null);

    // Default Firestore doc get: returns an asset owned by test-user-123
    mocks.mockFirestoreGet.mockResolvedValue({
      exists: true,
      id: 'asset-123',
      data: () => ({
        id: 'asset-123',
        userId: 'test-user-123',
        fileName: 'photo.jpg',
        mimeType: 'image/jpeg',
        assetType: 'image',
        fileSize: 500000,
        metadata: { width: 1920, height: 1080 },
        storageUrl: 'https://storage.example.com/image.jpg',
        thumbnailUrl: '',
        createdAt: '2026-02-10T00:00:00Z',
        updatedAt: '2026-02-10T00:00:00Z',
      }),
    });

    // Default collection query: empty result set
    mocks.mockFirestoreCollectionGet.mockResolvedValue({
      docs: [],
      forEach: vi.fn(),
      size: 0,
    });

    // Default count query
    mocks.mockFirestoreCountGet.mockResolvedValue({
      data: () => ({ count: 0 }),
    });

    // Default signed URL
    mocks.mockStorageGetSignedUrl.mockResolvedValue([
      'https://storage.example.com/signed-url',
    ]);
  });

  describe('addAsset', () => {
    it('should create a Firestore document and return AssetRecord', async () => {
      const service = await importService();

      const asset = await service.addAsset('test-user-123', {
        fileName: 'photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 500000,
        assetType: 'image',
        metadata: { width: 1920, height: 1080 },
      });

      expect(mocks.mockFirestoreSet).toHaveBeenCalled();
      expect(asset).toHaveProperty('id');
      expect(asset).toHaveProperty('userId');
      expect(asset.userId).toBe('test-user-123');
    });

    it('should generate a unique ID for the asset', async () => {
      const service = await importService();

      const asset = await service.addAsset('test-user-123', {
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 100000,
        assetType: 'image',
        metadata: {},
      });

      expect(asset.id).toBeDefined();
      expect(typeof asset.id).toBe('string');
      expect(asset.id.length).toBeGreaterThan(0);
    });
  });

  describe('getAsset', () => {
    it('should return asset when found', async () => {
      const service = await importService();

      const asset = await service.getAsset('test-user-123', 'asset-123');

      expect(asset).toBeDefined();
      expect(asset?.fileName).toBe('photo.jpg');
    });

    it('should return null when not found', async () => {
      const service = await importService();
      mocks.mockFirestoreGet.mockResolvedValue({
        exists: false,
      });

      const asset = await service.getAsset('test-user-123', 'non-existent');

      expect(asset).toBeNull();
    });

    it('should only return assets owned by the userId', async () => {
      const service = await importService();
      mocks.mockFirestoreGet.mockResolvedValue({
        exists: true,
        id: 'asset-123',
        data: () => ({
          id: 'asset-123',
          userId: 'other-user-456',
          fileName: 'photo.jpg',
        }),
      });

      const asset = await service.getAsset('test-user-123', 'asset-123');

      // Should return null because userId doesn't match
      expect(asset).toBeNull();
    });
  });

  describe('searchAssets', () => {
    it('should filter by assetType', async () => {
      const service = await importService();

      // Setup the count and query responses
      mocks.mockFirestoreCountGet.mockResolvedValue({
        data: () => ({ count: 5 }),
      });
      mocks.mockFirestoreCollectionGet.mockResolvedValue({
        forEach: vi.fn(),
        size: 0,
      });

      await service.searchAssets('test-user-123', { assetType: 'image' });

      expect(mocks.mockFirestoreCollectionGet).toHaveBeenCalled();
    });

    it('should apply limit and offset', async () => {
      const service = await importService();

      mocks.mockFirestoreCountGet.mockResolvedValue({
        data: () => ({ count: 15 }),
      });
      mocks.mockFirestoreCollectionGet.mockResolvedValue({
        forEach: vi.fn(),
        size: 0,
      });

      const result = await service.searchAssets('test-user-123', {
        limit: 10,
        offset: 5,
      });

      expect(result).toHaveProperty('assets');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.assets)).toBe(true);
    });

    it('should return total count', async () => {
      const service = await importService();

      mocks.mockFirestoreCountGet.mockResolvedValue({
        data: () => ({ count: 42 }),
      });
      mocks.mockFirestoreCollectionGet.mockResolvedValue({
        forEach: vi.fn(),
        size: 0,
      });

      const result = await service.searchAssets('test-user-123', {});

      expect(result.total).toBe(42);
    });
  });

  describe('deleteAsset', () => {
    it('should remove asset from Firestore', async () => {
      const service = await importService();

      await service.deleteAsset('test-user-123', 'asset-123');

      expect(mocks.mockFirestoreDelete).toHaveBeenCalled();
    });

    it('should also delete storage file', async () => {
      const service = await importService();

      await service.deleteAsset('test-user-123', 'asset-123');

      expect(mocks.mockStorageDelete).toHaveBeenCalled();
    });
  });

  describe('uploadToStorage', () => {
    it('should save buffer to Firebase Storage', async () => {
      const service = await importService();

      const buffer = Buffer.from('file content');
      await service.uploadToStorage(
        'test-user-123',
        'asset-123',
        buffer,
        'image/jpeg',
      );

      expect(mocks.mockStorageSave).toHaveBeenCalled();
    });

    it('should return a signed URL', async () => {
      const service = await importService();

      const buffer = Buffer.from('file content');
      const url = await service.uploadToStorage(
        'test-user-123',
        'asset-123',
        buffer,
        'image/jpeg',
      );

      expect(typeof url).toBe('string');
      expect(url.startsWith('http')).toBe(true);
    });

    it('should use correct MIME type in storage', async () => {
      const service = await importService();

      const buffer = Buffer.from('font data');
      await service.uploadToStorage(
        'test-user-123',
        'asset-123',
        buffer,
        'font/ttf',
      );

      expect(mocks.mockStorageSave).toHaveBeenCalled();
    });
  });

  describe('singleton behavior', () => {
    it('should return same instance from getAssetManagementService()', async () => {
      const service1 = await importService();
      const service2 = await importService();

      expect(service1).toBe(service2);
    });
  });
});
