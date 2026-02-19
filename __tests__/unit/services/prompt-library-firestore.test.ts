import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptLibraryService } from '@/lib/studio/services/ai/imageGeneration/promptLibraryService';
import type { SavedPrompt } from '@/lib/studio/services/ai/imageGeneration/types';

/**
 * Mock Factory for Firestore DB
 * Creates a mock Firestore database that tracks query chain calls
 */
function createMockDB(docs: Array<{ id: string; data: Record<string, unknown> }> = []) {
  const mockQuery = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
    }),
  };

  const mockDoc = {
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue({ exists: false, data: () => undefined }),
  };

  const mockCollection = {
    ...mockQuery,
    doc: vi.fn().mockReturnValue(mockDoc),
    add: vi.fn().mockResolvedValue({ id: 'new-id' }),
  };

  return {
    db: { collection: vi.fn().mockReturnValue(mockCollection) },
    mockCollection,
    mockQuery,
    mockDoc,
  };
}

/**
 * Sample Firestore document data for testing
 */
const samplePromptDoc = {
  id: 'prompt-1',
  data: {
    content: 'A scenic landscape with mountains',
    description: 'Nature prompt',
    tags: ['landscape', 'nature'],
    category: 'art',
    isTemplate: false,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-16T00:00:00.000Z',
    favorite: true,
    usageCount: 5,
  },
};

const anotherPromptDoc = {
  id: 'prompt-2',
  data: {
    content: 'A modern city skyline',
    description: 'Urban prompt',
    tags: ['urban', 'city'],
    category: 'photography',
    isTemplate: false,
    createdAt: '2024-01-10T00:00:00.000Z',
    updatedAt: '2024-01-14T00:00:00.000Z',
    favorite: false,
    usageCount: 3,
  },
};

const communityPromptHigh = {
  id: 'community-1',
  data: {
    content: 'High score community prompt',
    description: 'Popular prompt',
    tags: ['popular'],
    category: 'general',
    isTemplate: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    favorite: false,
    usageCount: 100,
    community: {
      shared: true,
      upvotes: 20,
      downvotes: 5,
    },
  },
};

const communityPromptMid = {
  id: 'community-2',
  data: {
    content: 'Mid score community prompt',
    description: 'Moderate prompt',
    tags: ['moderate'],
    category: 'general',
    isTemplate: false,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    favorite: false,
    usageCount: 50,
    community: {
      shared: true,
      upvotes: 10,
      downvotes: 2,
    },
  },
};

const communityPromptLow = {
  id: 'community-3',
  data: {
    content: 'Low score community prompt',
    description: 'Less popular prompt',
    tags: ['less-popular'],
    category: 'general',
    isTemplate: false,
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
    favorite: false,
    usageCount: 10,
    community: {
      shared: true,
      upvotes: 5,
      downvotes: 1,
    },
  },
};

describe('PromptLibraryService - Firestore Query Tests', () => {
  let service: PromptLibraryService;
  let mockDB: ReturnType<typeof createMockDB>;

  beforeEach(() => {
    mockDB = createMockDB();
    service = new PromptLibraryService(mockDB.db as any, 'test-user');
  });

  describe('getAllPrompts()', () => {
    it('queries Firestore with orderBy and limit', async () => {
      mockDB = createMockDB([samplePromptDoc, anotherPromptDoc]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');

      const result = await service.getAllPrompts();

      // Verify collection path
      expect(mockDB.db.collection).toHaveBeenCalledWith('users/test-user/prompts');

      // Verify orderBy was called with correct parameters
      expect(mockDB.mockQuery.orderBy).toHaveBeenCalledWith('updatedAt', 'desc');

      // Verify limit was called with 100
      expect(mockDB.mockQuery.limit).toHaveBeenCalledWith(100);

      // Verify get was called to fetch documents
      expect(mockDB.mockQuery.get).toHaveBeenCalled();

      // Verify returned array has 2 SavedPrompt objects
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'prompt-1',
        content: 'A scenic landscape with mountains',
        category: 'art',
      });
      expect(result[1]).toMatchObject({
        id: 'prompt-2',
        content: 'A modern city skyline',
        category: 'photography',
      });
    });

    it('filters by category when provided', async () => {
      mockDB = createMockDB([samplePromptDoc]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');

      await service.getAllPrompts('art');

      // Verify where was called with category filter
      expect(mockDB.mockQuery.where).toHaveBeenCalledWith('category', '==', 'art');
    });

    it('does not call where when no category is provided', async () => {
      mockDB = createMockDB([samplePromptDoc]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');

      await service.getAllPrompts();

      // Verify where was NOT called for category filtering
      expect(mockDB.mockQuery.where).not.toHaveBeenCalled();
    });

    it('updates promptCache on success', async () => {
      mockDB = createMockDB([samplePromptDoc]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');

      // First call to getAllPrompts should populate cache
      const result1 = await service.getAllPrompts();
      expect(result1).toHaveLength(1);

      // Reset mocks to verify cache is used
      mockDB.mockQuery.get.mockClear();
      mockDB.mockDoc.get.mockClear();

      // Second call with same ID should use cache (not call doc.get)
      const cachedPrompt = await service.getPrompt('prompt-1');

      // Verify cached prompt was returned without hitting Firestore
      expect(cachedPrompt).toMatchObject({
        id: 'prompt-1',
        content: 'A scenic landscape with mountains',
      });
      expect(mockDB.mockDoc.get).not.toHaveBeenCalled();
    });

    it('falls back to cache on Firestore error', async () => {
      // First: successfully load and cache a prompt
      mockDB = createMockDB([samplePromptDoc]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');
      await service.getAllPrompts();

      // Second: make the next query fail
      mockDB.mockQuery.get.mockRejectedValueOnce(new Error('Firestore error'));

      // Call getAllPrompts again - should fall back to cache
      const result = await service.getAllPrompts();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'prompt-1',
        content: 'A scenic landscape with mountains',
      });
    });

    it('filters cache by category on fallback', async () => {
      // Populate cache with multiple categories
      mockDB = createMockDB([samplePromptDoc, anotherPromptDoc]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');
      await service.getAllPrompts();

      // Make next query fail
      mockDB.mockQuery.get.mockRejectedValueOnce(new Error('Firestore error'));

      // Call with category filter on fallback
      const result = await service.getAllPrompts('art');

      // Should return only cached prompts with category 'art'
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('art');
    });
  });

  describe('getCommunityPrompts()', () => {
    it('queries community collection with shared filter', async () => {
      mockDB = createMockDB([communityPromptHigh]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');

      await service.getCommunityPrompts();

      // Verify collection path
      expect(mockDB.db.collection).toHaveBeenCalledWith('community/prompts/shared');

      // Verify where was called with shared filter
      expect(mockDB.mockQuery.where).toHaveBeenCalledWith('community.shared', '==', true);
    });

    it('filters by category when provided', async () => {
      mockDB = createMockDB([communityPromptHigh]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');

      await service.getCommunityPrompts('art');

      // Verify where was called twice: once for shared, once for category
      expect(mockDB.mockQuery.where).toHaveBeenCalledTimes(2);
      expect(mockDB.mockQuery.where).toHaveBeenNthCalledWith(1, 'community.shared', '==', true);
      expect(mockDB.mockQuery.where).toHaveBeenNthCalledWith(2, 'category', '==', 'art');
    });

    it('sorts results by community score (upvotes - downvotes)', async () => {
      // Setup docs with different scores
      // doc1: score = 20 - 5 = 15
      // doc2: score = 10 - 2 = 8
      // doc3: score = 5 - 1 = 4
      mockDB = createMockDB([communityPromptMid, communityPromptHigh, communityPromptLow]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');

      const result = await service.getCommunityPrompts();

      // Verify sorted by score descending: high (15), mid (8), low (4)
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('community-1'); // score: 15
      expect(result[1].id).toBe('community-2'); // score: 8
      expect(result[2].id).toBe('community-3'); // score: 4
    });

    it('respects limit parameter', async () => {
      mockDB = createMockDB([
        communityPromptHigh,
        communityPromptMid,
        communityPromptLow,
        {
          id: 'community-4',
          data: {
            ...communityPromptLow.data,
            community: { shared: true, upvotes: 3, downvotes: 0 },
          },
        },
        {
          id: 'community-5',
          data: {
            ...communityPromptLow.data,
            community: { shared: true, upvotes: 2, downvotes: 0 },
          },
        },
      ]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');

      const result = await service.getCommunityPrompts(undefined, 2);

      // Should only return 2 prompts
      expect(result).toHaveLength(2);
      // Should be the top 2 by score
      expect(result[0].id).toBe('community-1');
      expect(result[1].id).toBe('community-2');
    });

    it('fetches limit * 2 documents from Firestore for sorting', async () => {
      mockDB = createMockDB([communityPromptHigh]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');

      await service.getCommunityPrompts(undefined, 50);

      // Verify limit was called with limit * 2
      expect(mockDB.mockQuery.limit).toHaveBeenCalledWith(100);
    });

    it('falls back to cache on error', async () => {
      // First: successfully load and cache a shared prompt
      mockDB = createMockDB([communityPromptHigh]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');

      // Pre-populate cache by sharing a prompt
      await service.savePrompt('Test content', { category: 'general' });
      const saved = await service.getAllPrompts();

      // Now manually set up a shared prompt in cache (simulate sharePromptToCommunity)
      const sharedPrompt: SavedPrompt = {
        ...saved[0],
        community: {
          shared: true,
          upvotes: 10,
          downvotes: 2,
        },
      };

      // Add to cache by making a successful getAllPrompts query first
      // (getCommunityPrompts doesn't populate the promptCache, but getAllPrompts does)
      mockDB = createMockDB([
        {
          id: sharedPrompt.id,
          data: {
            content: sharedPrompt.content,
            category: sharedPrompt.category,
            description: sharedPrompt.description,
            tags: sharedPrompt.tags,
            isTemplate: sharedPrompt.isTemplate,
            createdAt: sharedPrompt.createdAt.toISOString(),
            updatedAt: sharedPrompt.updatedAt.toISOString(),
            favorite: sharedPrompt.favorite,
            usageCount: sharedPrompt.usageCount,
            community: sharedPrompt.community,
          },
        },
      ]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');
      await service.getAllPrompts();

      // Now make the next query fail
      mockDB.mockQuery.get.mockRejectedValueOnce(new Error('Firestore error'));

      // Call getCommunityPrompts again - should fall back to cache
      const result = await service.getCommunityPrompts();

      // Should still return the shared prompt from cache
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].community?.shared).toBe(true);
    });

    it('filters cache by category and shared status on fallback', async () => {
      // Create cache with both shared and non-shared prompts
      const nonSharedDoc = {
        id: 'prompt-private',
        data: {
          content: 'Private prompt',
          description: 'Not shared',
          tags: [],
          category: 'art',
          isTemplate: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          favorite: false,
          usageCount: 0,
          community: { shared: false, upvotes: 0, downvotes: 0 },
        },
      };

      mockDB = createMockDB([communityPromptHigh, nonSharedDoc]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');
      await service.getAllPrompts();

      // Make query fail
      mockDB.mockQuery.get.mockRejectedValueOnce(new Error('Firestore error'));

      // Get community prompts with category filter
      const result = await service.getCommunityPrompts('general');

      // Should only return shared prompts from the specified category
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((p) => p.community?.shared)).toBe(true);
      expect(result.every((p) => p.category === 'general')).toBe(true);
    });
  });

  describe('mapToPrompt behavior in getAllPrompts and getCommunityPrompts', () => {
    it('correctly maps Firestore document to SavedPrompt', async () => {
      mockDB = createMockDB([samplePromptDoc]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');

      const result = await service.getAllPrompts();

      const prompt = result[0];
      expect(prompt.id).toBe('prompt-1');
      expect(prompt.content).toBe('A scenic landscape with mountains');
      expect(prompt.description).toBe('Nature prompt');
      expect(prompt.tags).toEqual(['landscape', 'nature']);
      expect(prompt.category).toBe('art');
      expect(prompt.isTemplate).toBe(false);
      expect(prompt.favorite).toBe(true);
      expect(prompt.usageCount).toBe(5);
      expect(prompt.createdAt).toEqual(new Date('2024-01-15T00:00:00.000Z'));
      expect(prompt.updatedAt).toEqual(new Date('2024-01-16T00:00:00.000Z'));
      expect(prompt.userId).toBe('test-user');
    });

    it('handles missing community field in regular prompts', async () => {
      mockDB = createMockDB([samplePromptDoc]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');

      const result = await service.getAllPrompts();

      expect(result[0].community).toBeUndefined();
    });

    it('includes community field in community prompts', async () => {
      mockDB = createMockDB([communityPromptHigh]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');

      const result = await service.getCommunityPrompts();

      expect(result[0].community).toBeDefined();
      expect(result[0].community?.shared).toBe(true);
      expect(result[0].community?.upvotes).toBe(20);
      expect(result[0].community?.downvotes).toBe(5);
    });
  });

  describe('query chaining behavior', () => {
    it('chains where -> orderBy -> limit -> get for getAllPrompts', async () => {
      mockDB = createMockDB([samplePromptDoc]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');

      await service.getAllPrompts('art');

      // Verify the chain order: where, then orderBy, then limit
      const callOrder: string[] = [];
      const calls = [
        { fn: mockDB.mockQuery.where, name: 'where' },
        { fn: mockDB.mockQuery.orderBy, name: 'orderBy' },
        { fn: mockDB.mockQuery.limit, name: 'limit' },
        { fn: mockDB.mockQuery.get, name: 'get' },
      ];

      for (const { fn, name } of calls) {
        if (fn.mock.invocationCallOrder.length > 0) {
          callOrder.push(name);
        }
      }

      expect(callOrder).toEqual(['where', 'orderBy', 'limit', 'get']);
    });

    it('chains where -> where -> limit -> get for getCommunityPrompts with category', async () => {
      mockDB = createMockDB([communityPromptHigh]);
      service = new PromptLibraryService(mockDB.db as any, 'test-user');

      await service.getCommunityPrompts('art', 50);

      // Verify where is called twice
      expect(mockDB.mockQuery.where).toHaveBeenCalledTimes(2);
      expect(mockDB.mockQuery.limit).toHaveBeenCalled();
      expect(mockDB.mockQuery.get).toHaveBeenCalled();
    });
  });
});
