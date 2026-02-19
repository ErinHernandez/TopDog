/**
 * Local Storage Adapter
 *
 * Provides IndexedDB-based local storage for offline support.
 * Implements the DataAdapter interface with persistent local storage.
 *
 * Features:
 * - IndexedDB persistence
 * - Sync queue for offline changes
 * - Conflict resolution
 * - TTL-based cache invalidation
 */

import { logger } from '../structuredLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface LocalStorageConfig {
  /** Database name */
  dbName: string;
  /** Database version */
  version: number;
  /** Store name */
  storeName: string;
  /** Time-to-live for cached items (ms) */
  ttlMs?: number;
  /** Maximum items in store */
  maxItems?: number;
}

export interface StoredItem<T> {
  /** Unique identifier */
  id: string;
  /** The actual data */
  data: T;
  /** Timestamp when stored */
  storedAt: number;
  /** Timestamp when last updated */
  updatedAt: number;
  /** TTL expiration timestamp */
  expiresAt?: number;
  /** Version for conflict resolution */
  version: number;
  /** Pending sync status */
  syncStatus: 'synced' | 'pending' | 'conflict';
  /** Original server data (for conflict resolution) */
  serverData?: T;
}

export interface SyncQueueItem<T> {
  /** Unique operation ID */
  operationId: string;
  /** Type of operation */
  type: 'create' | 'update' | 'delete';
  /** Collection/store name */
  collection: string;
  /** Document ID */
  docId: string;
  /** Data for create/update operations */
  data?: T;
  /** Timestamp when queued */
  queuedAt: number;
  /** Number of sync attempts */
  attempts: number;
  /** Last error if any */
  lastError?: string;
}

// ============================================================================
// LOCAL STORAGE ADAPTER
// ============================================================================

export class LocalStorageAdapter<T> {
  private db: IDBDatabase | null = null;
  private config: Required<LocalStorageConfig>;
  private initPromise: Promise<void> | null = null;

  constructor(config: LocalStorageConfig) {
    this.config = {
      dbName: config.dbName,
      version: config.version,
      storeName: config.storeName,
      ttlMs: config.ttlMs || 24 * 60 * 60 * 1000, // 24 hours default
      maxItems: config.maxItems || 10000,
    };
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        logger.error('IndexedDB open error', request.error || new Error('Unknown error'), {
          component: 'localStorage',
          operation: 'init',
          dbName: this.config.dbName,
        });
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('IndexedDB initialized', {
          component: 'localStorage',
          operation: 'init',
          dbName: this.config.dbName,
          version: this.config.version,
        });
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create main data store
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const store = db.createObjectStore(this.config.storeName, { keyPath: 'id' });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'operationId' });
          syncStore.createIndex('queuedAt', 'queuedAt', { unique: false });
          syncStore.createIndex('collection', 'collection', { unique: false });
        }

        logger.info('IndexedDB schema upgraded', {
          component: 'localStorage',
          operation: 'upgrade',
          dbName: this.config.dbName,
          version: this.config.version,
        });
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDb(): Promise<IDBDatabase> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // ===========================================================================
  // CRUD OPERATIONS
  // ===========================================================================

  /**
   * Get an item by ID
   */
  async get(id: string): Promise<T | null> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.config.storeName, 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const item = request.result as StoredItem<T> | undefined;

        if (!item) {
          resolve(null);
          return;
        }

        // Check TTL expiration
        if (item.expiresAt && item.expiresAt < Date.now()) {
          // Item expired, delete it
          this.delete(id).catch(() => {}); // Fire and forget
          resolve(null);
          return;
        }

        resolve(item.data);
      };
    });
  }

  /**
   * Get an item with full metadata
   */
  async getWithMeta(id: string): Promise<StoredItem<T> | null> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.config.storeName, 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const item = request.result as StoredItem<T> | undefined;
        resolve(item || null);
      };
    });
  }

  /**
   * Set an item (create or update)
   */
  async set(id: string, data: T, options: { fromServer?: boolean } = {}): Promise<void> {
    const db = await this.ensureDb();
    const now = Date.now();

    // Get existing item for version management
    const existing = await this.getWithMeta(id);

    const item: StoredItem<T> = {
      id,
      data,
      storedAt: existing?.storedAt || now,
      updatedAt: now,
      expiresAt: this.config.ttlMs ? now + this.config.ttlMs : undefined,
      version: (existing?.version || 0) + 1,
      syncStatus: options.fromServer ? 'synced' : 'pending',
      serverData: options.fromServer ? data : existing?.serverData,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.config.storeName, 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.put(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Queue for sync if not from server
        if (!options.fromServer) {
          this.addToSyncQueue({
            operationId: `${id}-${now}`,
            type: existing ? 'update' : 'create',
            collection: this.config.storeName,
            docId: id,
            data,
            queuedAt: now,
            attempts: 0,
          }).catch((err) => {
            logger.warn('Failed to add to sync queue', {
              component: 'localStorage',
              operation: 'set',
              id,
              error: err.message,
            });
          });
        }
        resolve();
      };
    });
  }

  /**
   * Delete an item
   */
  async delete(id: string, options: { fromServer?: boolean } = {}): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.config.storeName, 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Queue for sync if not from server
        if (!options.fromServer) {
          this.addToSyncQueue({
            operationId: `${id}-${Date.now()}-delete`,
            type: 'delete',
            collection: this.config.storeName,
            docId: id,
            queuedAt: Date.now(),
            attempts: 0,
          }).catch(() => {});
        }
        resolve();
      };
    });
  }

  /**
   * Get all items
   */
  async getAll(): Promise<T[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.config.storeName, 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const items = request.result as StoredItem<T>[];
        const now = Date.now();

        // Filter out expired items
        const validItems = items
          .filter((item) => !item.expiresAt || item.expiresAt > now)
          .map((item) => item.data);

        resolve(validItems);
      };
    });
  }

  /**
   * Query items by index
   */
  async queryByIndex(
    indexName: string,
    value: IDBValidKey
  ): Promise<StoredItem<T>[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.config.storeName, 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result as StoredItem<T>[]);
      };
    });
  }

  /**
   * Clear all items
   */
  async clear(): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.config.storeName, 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // ===========================================================================
  // SYNC QUEUE OPERATIONS
  // ===========================================================================

  /**
   * Add an operation to the sync queue
   */
  async addToSyncQueue(item: SyncQueueItem<T>): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('syncQueue', 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.put(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get all pending sync operations
   */
  async getSyncQueue(): Promise<SyncQueueItem<T>[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('syncQueue', 'readonly');
      const store = transaction.objectStore('syncQueue');
      const index = store.index('queuedAt');
      const request = index.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result as SyncQueueItem<T>[]);
      };
    });
  }

  /**
   * Remove an operation from the sync queue
   */
  async removeSyncQueueItem(operationId: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('syncQueue', 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(operationId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Update sync queue item (e.g., increment attempts)
   */
  async updateSyncQueueItem(operationId: string, updates: Partial<SyncQueueItem<T>>): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('syncQueue', 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const getRequest = store.get(operationId);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const existing = getRequest.result as SyncQueueItem<T> | undefined;
        if (!existing) {
          reject(new Error(`Sync queue item not found: ${operationId}`));
          return;
        }

        const updated = { ...existing, ...updates };
        const putRequest = store.put(updated);

        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
      };
    });
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue(): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('syncQueue', 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // ===========================================================================
  // CONFLICT RESOLUTION
  // ===========================================================================

  /**
   * Mark an item as having a conflict
   */
  async markConflict(id: string, serverData: T): Promise<void> {
    const db = await this.ensureDb();
    const existing = await this.getWithMeta(id);

    if (!existing) {
      throw new Error(`Item not found: ${id}`);
    }

    const updated: StoredItem<T> = {
      ...existing,
      syncStatus: 'conflict',
      serverData,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.config.storeName, 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.put(updated);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Resolve a conflict by choosing local or server version
   */
  async resolveConflict(id: string, resolution: 'local' | 'server'): Promise<void> {
    const existing = await this.getWithMeta(id);

    if (!existing) {
      throw new Error(`Item not found: ${id}`);
    }

    if (existing.syncStatus !== 'conflict') {
      throw new Error(`Item is not in conflict state: ${id}`);
    }

    if (resolution === 'server' && existing.serverData) {
      await this.set(id, existing.serverData, { fromServer: true });
    } else {
      // Keep local data, mark as synced
      const db = await this.ensureDb();
      const updated: StoredItem<T> = {
        ...existing,
        syncStatus: 'synced',
        serverData: existing.data,
      };

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.config.storeName, 'readwrite');
        const store = transaction.objectStore(this.config.storeName);
        const request = store.put(updated);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  /**
   * Get all items with conflicts
   */
  async getConflicts(): Promise<StoredItem<T>[]> {
    return this.queryByIndex('syncStatus', 'conflict');
  }

  // ===========================================================================
  // MAINTENANCE
  // ===========================================================================

  /**
   * Clean up expired items
   */
  async cleanup(): Promise<number> {
    const db = await this.ensureDb();
    const now = Date.now();
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.config.storeName, 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const index = store.index('expiresAt');
      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          logger.info('Cleanup completed', {
            component: 'localStorage',
            operation: 'cleanup',
            deletedCount,
          });
          resolve(deletedCount);
        }
      };
    });
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalItems: number;
    pendingSync: number;
    conflicts: number;
    queueSize: number;
  }> {
    const db = await this.ensureDb();

    const [totalItems, pendingSync, conflicts, queueSize] = await Promise.all([
      new Promise<number>((resolve, reject) => {
        const transaction = db.transaction(this.config.storeName, 'readonly');
        const store = transaction.objectStore(this.config.storeName);
        const request = store.count();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      }),
      new Promise<number>((resolve, reject) => {
        const transaction = db.transaction(this.config.storeName, 'readonly');
        const store = transaction.objectStore(this.config.storeName);
        const index = store.index('syncStatus');
        const request = index.count('pending');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      }),
      new Promise<number>((resolve, reject) => {
        const transaction = db.transaction(this.config.storeName, 'readonly');
        const store = transaction.objectStore(this.config.storeName);
        const index = store.index('syncStatus');
        const request = index.count('conflict');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      }),
      new Promise<number>((resolve, reject) => {
        const transaction = db.transaction('syncQueue', 'readonly');
        const store = transaction.objectStore('syncQueue');
        const request = store.count();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      }),
    ]);

    return { totalItems, pendingSync, conflicts, queueSize };
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a local storage adapter for a specific data type
 */
export function createLocalStorageAdapter<T>(
  config: LocalStorageConfig
): LocalStorageAdapter<T> {
  return new LocalStorageAdapter<T>(config);
}

// ============================================================================
// DEFAULT INSTANCES
// ============================================================================

/** Draft data local storage */
export const draftLocalStorage = createLocalStorageAdapter<unknown>({
  dbName: 'bestball-offline',
  version: 1,
  storeName: 'drafts',
  ttlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
});

/** Player data local storage */
export const playerLocalStorage = createLocalStorageAdapter<unknown>({
  dbName: 'bestball-offline',
  version: 1,
  storeName: 'players',
  ttlMs: 24 * 60 * 60 * 1000, // 24 hours
});

/** User data local storage */
export const userLocalStorage = createLocalStorageAdapter<unknown>({
  dbName: 'bestball-offline',
  version: 1,
  storeName: 'users',
  ttlMs: 60 * 60 * 1000, // 1 hour
});
