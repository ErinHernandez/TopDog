/**
 * Hybrid Adapter
 *
 * Combines Firebase with local storage for offline-first functionality.
 * Reads from local cache first, falls back to Firebase, and syncs changes
 * when online.
 *
 * Features:
 * - Offline-first reads
 * - Background sync when online
 * - Automatic conflict detection
 * - Network status monitoring
 */

import type { DocumentData } from 'firebase/firestore';

import { FirebaseAdapter, getFirebaseAdapter } from '../firebase/firebaseAdapter';
import { logger } from '../structuredLogger';

import {
  LocalStorageAdapter,
  type StoredItem,
  type SyncQueueItem,
} from './localStorage';


// ============================================================================
// TYPES
// ============================================================================

/**
 * Base interface for documents that can be used with the hybrid adapter.
 * Documents must have an id and optionally an updatedAt timestamp for conflict detection.
 */
export interface HybridDocument {
  id: string;
  updatedAt?: Date | number | string;
}

export interface HybridAdapterConfig {
  /** Collection name in Firebase */
  collection: string;
  /** Local storage adapter instance */
  localStorage: LocalStorageAdapter<DocumentData>;
  /** Firebase adapter instance (optional, uses default) */
  firebaseAdapter?: FirebaseAdapter;
  /** Sync interval in milliseconds */
  syncIntervalMs?: number;
  /** Maximum sync retries */
  maxSyncRetries?: number;
  /** Whether to sync automatically */
  autoSync?: boolean;
  /** Conflict resolution strategy */
  conflictResolution?: 'local-wins' | 'server-wins' | 'manual';
}

export interface HybridReadResult<T> {
  data: T | null;
  source: 'local' | 'firebase' | 'cache-miss';
  stale: boolean;
  offline: boolean;
}

export interface SyncResult {
  synced: number;
  failed: number;
  conflicts: number;
  errors: string[];
}

// ============================================================================
// NETWORK STATUS
// ============================================================================

class NetworkStatus {
  private _isOnline: boolean = true;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this._isOnline = navigator.onLine;

      window.addEventListener('online', () => {
        this._isOnline = true;
        this.notifyListeners();
      });

      window.addEventListener('offline', () => {
        this._isOnline = false;
        this.notifyListeners();
      });
    }
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  subscribe(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this._isOnline);
      } catch (error) {
        logger.error('Network status listener error', error as Error, {
          component: 'hybrid',
          operation: 'networkStatus',
        });
      }
    });
  }
}

const networkStatus = new NetworkStatus();

// ============================================================================
// HYBRID ADAPTER
// ============================================================================

export class HybridAdapter<T extends DocumentData & HybridDocument> {
  private config: Required<HybridAdapterConfig>;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing: boolean = false;

  constructor(config: HybridAdapterConfig) {
    this.config = {
      collection: config.collection,
      localStorage: config.localStorage,
      firebaseAdapter: config.firebaseAdapter || getFirebaseAdapter(),
      syncIntervalMs: config.syncIntervalMs || 30000, // 30 seconds
      maxSyncRetries: config.maxSyncRetries || 3,
      autoSync: config.autoSync !== false,
      conflictResolution: config.conflictResolution || 'server-wins',
    };

    // Initialize local storage
    this.config.localStorage.init().catch((err) => {
      logger.error('Failed to initialize local storage', err, {
        component: 'hybrid',
        operation: 'init',
        collection: this.config.collection,
      });
    });

    // Start auto-sync if enabled
    if (this.config.autoSync) {
      this.startAutoSync();
    }

    // Sync when coming back online
    networkStatus.subscribe((online) => {
      if (online) {
        this.sync().catch((err) => {
          logger.warn('Background sync failed on reconnect', {
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }
    });
  }

  // ===========================================================================
  // READ OPERATIONS
  // ===========================================================================

  /**
   * Get a document by ID (offline-first)
   */
  async get(id: string): Promise<HybridReadResult<T>> {
    // Try local first
    try {
      const localData = await this.config.localStorage.get(id);

      if (localData) {
        // Check if we should refresh from server
        if (networkStatus.isOnline) {
          // Refresh in background (don't block)
          this.refreshFromServer(id).catch((err) => {
            logger.warn('Background server refresh failed', {
              id,
              error: err instanceof Error ? err.message : String(err),
            });
          });
        }

        return {
          data: localData as T,
          source: 'local',
          stale: false, // We're refreshing in background
          offline: !networkStatus.isOnline,
        };
      }
    } catch (error) {
      logger.warn('Local storage read failed', {
        component: 'hybrid',
        operation: 'get',
        id,
        error: (error as Error).message,
      });
    }

    // Fall back to Firebase if online
    if (networkStatus.isOnline) {
      try {
        const firebaseData = await this.config.firebaseAdapter.getDocument<T>(
          this.config.collection,
          id
        );

        if (firebaseData) {
          // Cache locally
          await this.config.localStorage.set(id, firebaseData, { fromServer: true });

          return {
            data: firebaseData,
            source: 'firebase',
            stale: false,
            offline: false,
          };
        }
      } catch (error) {
        logger.error('Firebase read failed', error as Error, {
          component: 'hybrid',
          operation: 'get',
          id,
        });
      }
    }

    return {
      data: null,
      source: 'cache-miss',
      stale: false,
      offline: !networkStatus.isOnline,
    };
  }

  /**
   * Refresh a document from server (background)
   */
  private async refreshFromServer(id: string): Promise<void> {
    try {
      const firebaseData = await this.config.firebaseAdapter.getDocument<T>(
        this.config.collection,
        id
      );

      if (firebaseData) {
        const localItem = await this.config.localStorage.getWithMeta(id);

        // Check for conflicts
        if (localItem && localItem.syncStatus === 'pending') {
          // Local changes exist, check for conflict
          if (this.hasConflict(localItem.data as T, firebaseData)) {
            await this.handleConflict(id, localItem.data as T, firebaseData);
            return;
          }
        }

        // Update local cache
        await this.config.localStorage.set(id, firebaseData, { fromServer: true });
      }
    } catch (error) {
      logger.warn('Background refresh failed', {
        component: 'hybrid',
        operation: 'refresh',
        id,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get all documents
   */
  async getAll(): Promise<T[]> {
    // Try local first
    const localData = await this.config.localStorage.getAll();

    if (localData.length > 0) {
      // Refresh in background if online
      if (networkStatus.isOnline) {
        this.refreshAllFromServer().catch((err) => {
          logger.warn('Background refresh-all failed', {
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }
      return localData as T[];
    }

    // Fall back to Firebase if online
    if (networkStatus.isOnline) {
      try {
        const firebaseData = await this.config.firebaseAdapter.queryDocuments<T>(
          this.config.collection,
          []
        );

        // Cache locally
        await Promise.all(
          firebaseData.map((doc) =>
            this.config.localStorage.set(doc.id, doc, { fromServer: true })
          )
        );

        return firebaseData;
      } catch (error) {
        logger.error('Firebase query failed', error as Error, {
          component: 'hybrid',
          operation: 'getAll',
        });
      }
    }

    return [];
  }

  /**
   * Refresh all documents from server
   */
  private async refreshAllFromServer(): Promise<void> {
    try {
      const firebaseData = await this.config.firebaseAdapter.queryDocuments<T>(
        this.config.collection,
        []
      );

      for (const doc of firebaseData) {
        if (doc.id) {
          await this.config.localStorage.set(doc.id, doc, { fromServer: true });
        }
      }
    } catch (error) {
      logger.warn('Background refresh all failed', {
        component: 'hybrid',
        operation: 'refreshAll',
        error: (error as Error).message,
      });
    }
  }

  // ===========================================================================
  // WRITE OPERATIONS
  // ===========================================================================

  /**
   * Set a document (writes locally first, syncs later)
   */
  async set(id: string, data: T): Promise<void> {
    // Always write locally first
    await this.config.localStorage.set(id, data, { fromServer: false });

    // Try to sync immediately if online
    if (networkStatus.isOnline) {
      this.syncSingle(id, 'set', data).catch(() => {
        // Sync failed, will retry later
        logger.warn('Immediate sync failed, queued for later', {
          component: 'hybrid',
          operation: 'set',
          id,
        });
      });
    }
  }

  /**
   * Update a document
   */
  async update(id: string, updates: Partial<T>): Promise<void> {
    // Get existing data
    const existing = await this.config.localStorage.get(id);

    if (!existing) {
      throw new Error(`Document not found: ${id}`);
    }

    const updated = { ...(existing as T), ...updates };
    await this.set(id, updated);
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    // Delete locally first
    await this.config.localStorage.delete(id, { fromServer: false });

    // Try to sync immediately if online
    if (networkStatus.isOnline) {
      this.syncSingle(id, 'delete').catch(() => {
        logger.warn('Immediate delete sync failed, queued for later', {
          component: 'hybrid',
          operation: 'delete',
          id,
        });
      });
    }
  }

  /**
   * Sync a single operation immediately
   */
  private async syncSingle(
    id: string,
    operation: 'set' | 'delete',
    data?: T
  ): Promise<void> {
    try {
      if (operation === 'set' && data) {
        await this.config.firebaseAdapter.setDocument(
          this.config.collection,
          id,
          data,
          true // merge
        );
        // Mark as synced
        await this.config.localStorage.set(id, data, { fromServer: true });
      } else if (operation === 'delete') {
        await this.config.firebaseAdapter.deleteDocument(this.config.collection, id);
      }

      // Remove from sync queue
      const queue = await this.config.localStorage.getSyncQueue();
      const matchingItems = queue.filter((item) => item.docId === id);
      for (const item of matchingItems) {
        await this.config.localStorage.removeSyncQueueItem(item.operationId);
      }
    } catch (error) {
      throw error;
    }
  }

  // ===========================================================================
  // SYNC OPERATIONS
  // ===========================================================================

  /**
   * Sync all pending changes to Firebase
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { synced: 0, failed: 0, conflicts: 0, errors: ['Sync already in progress'] };
    }

    if (!networkStatus.isOnline) {
      return { synced: 0, failed: 0, conflicts: 0, errors: ['Offline'] };
    }

    this.isSyncing = true;
    const result: SyncResult = { synced: 0, failed: 0, conflicts: 0, errors: [] };

    try {
      const queue = await this.config.localStorage.getSyncQueue();

      logger.info('Starting sync', {
        component: 'hybrid',
        operation: 'sync',
        collection: this.config.collection,
        queueSize: queue.length,
      });

      for (const item of queue) {
        if (item.collection !== this.config.collection) continue;

        try {
          await this.syncQueueItem(item);
          await this.config.localStorage.removeSyncQueueItem(item.operationId);
          result.synced++;
        } catch (error) {
          const errorMessage = (error as Error).message;

          // Check if it's a conflict
          if (errorMessage.includes('conflict')) {
            result.conflicts++;
          } else {
            result.failed++;
            result.errors.push(`${item.docId}: ${errorMessage}`);
          }

          // Update retry count
          if (item.attempts < this.config.maxSyncRetries) {
            await this.config.localStorage.updateSyncQueueItem(item.operationId, {
              attempts: item.attempts + 1,
              lastError: errorMessage,
            });
          } else {
            // Max retries reached, remove from queue
            await this.config.localStorage.removeSyncQueueItem(item.operationId);
            logger.error('Sync item failed after max retries', new Error(errorMessage), {
              component: 'hybrid',
              operation: 'sync',
              item: item.operationId,
            });
          }
        }
      }

      logger.info('Sync completed', {
        component: 'hybrid',
        operation: 'sync',
        collection: this.config.collection,
        ...result,
      });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Sync a single queue item
   */
  private async syncQueueItem(item: SyncQueueItem<DocumentData>): Promise<void> {
    switch (item.type) {
      case 'create':
      case 'update':
        if (!item.data) {
          throw new Error('Missing data for create/update operation');
        }

        // Check for conflicts before writing
        const serverData = await this.config.firebaseAdapter.getDocument<T>(
          this.config.collection,
          item.docId
        );

        if (serverData && this.hasConflict(item.data as T, serverData)) {
          await this.handleConflict(item.docId, item.data as T, serverData);
          throw new Error('conflict');
        }

        await this.config.firebaseAdapter.setDocument(
          this.config.collection,
          item.docId,
          item.data,
          true
        );

        // Update local to synced
        await this.config.localStorage.set(item.docId, item.data, { fromServer: true });
        break;

      case 'delete':
        await this.config.firebaseAdapter.deleteDocument(
          this.config.collection,
          item.docId
        );
        break;
    }
  }

  // ===========================================================================
  // CONFLICT HANDLING
  // ===========================================================================

  /**
   * Check if there's a conflict between local and server data
   */
  private hasConflict(localData: T, serverData: T): boolean {
    // Simple implementation: compare updatedAt timestamps
    const localUpdatedAt = localData.updatedAt;
    const serverUpdatedAt = serverData.updatedAt;

    if (!localUpdatedAt || !serverUpdatedAt) {
      return false;
    }

    // If server was updated after local was cached, there's a potential conflict
    const localTime = localUpdatedAt instanceof Date ? localUpdatedAt.getTime() : localUpdatedAt;
    const serverTime = serverUpdatedAt instanceof Date ? serverUpdatedAt.getTime() : serverUpdatedAt;

    return serverTime > localTime;
  }

  /**
   * Handle a conflict based on resolution strategy
   */
  private async handleConflict(id: string, localData: T, serverData: T): Promise<void> {
    switch (this.config.conflictResolution) {
      case 'local-wins':
        // Keep local data, sync will overwrite server
        break;

      case 'server-wins':
        // Update local with server data
        await this.config.localStorage.set(id, serverData, { fromServer: true });
        break;

      case 'manual':
        // Mark for manual resolution
        await this.config.localStorage.markConflict(id, serverData);
        break;
    }
  }

  /**
   * Get all conflicts for manual resolution
   */
  async getConflicts(): Promise<Array<{
    id: string;
    localData: T;
    serverData: T;
  }>> {
    const conflicts = await this.config.localStorage.getConflicts();

    return conflicts.map((item) => ({
      id: item.id,
      localData: item.data as T,
      serverData: item.serverData as T,
    }));
  }

  /**
   * Resolve a conflict manually
   */
  async resolveConflict(id: string, resolution: 'local' | 'server'): Promise<void> {
    await this.config.localStorage.resolveConflict(id, resolution);

    // If local wins, sync to server
    if (resolution === 'local' && networkStatus.isOnline) {
      const data = await this.config.localStorage.get(id);
      if (data) {
        await this.config.firebaseAdapter.setDocument(
          this.config.collection,
          id,
          data,
          true
        );
      }
    }
  }

  // ===========================================================================
  // AUTO-SYNC
  // ===========================================================================

  /**
   * Start automatic background sync
   */
  startAutoSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (networkStatus.isOnline) {
        this.sync().catch((err) => {
          logger.error('Auto-sync failed', err, {
            component: 'hybrid',
            operation: 'autoSync',
            collection: this.config.collection,
          });
        });
      }
    }, this.config.syncIntervalMs);

    logger.info('Auto-sync started', {
      component: 'hybrid',
      operation: 'autoSync',
      interval: this.config.syncIntervalMs,
    });
  }

  /**
   * Stop automatic background sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;

      logger.info('Auto-sync stopped', {
        component: 'hybrid',
        operation: 'autoSync',
      });
    }
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Check if currently online
   */
  get isOnline(): boolean {
    return networkStatus.isOnline;
  }

  /**
   * Get adapter statistics
   */
  async getStats(): Promise<{
    localStorage: Awaited<ReturnType<LocalStorageAdapter<any>['getStats']>>;
    online: boolean;
    syncing: boolean;
  }> {
    return {
      localStorage: await this.config.localStorage.getStats(),
      online: networkStatus.isOnline,
      syncing: this.isSyncing,
    };
  }

  /**
   * Force sync now
   */
  async forceSync(): Promise<SyncResult> {
    return this.sync();
  }

  /**
   * Clear local cache
   */
  async clearCache(): Promise<void> {
    await this.config.localStorage.clear();
    await this.config.localStorage.clearSyncQueue();
  }

  /**
   * Cleanup and close
   */
  destroy(): void {
    this.stopAutoSync();
    this.config.localStorage.close();
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a hybrid adapter for a collection
 */
export function createHybridAdapter<T extends DocumentData & HybridDocument>(
  config: HybridAdapterConfig
): HybridAdapter<T> {
  return new HybridAdapter<T>(config);
}
