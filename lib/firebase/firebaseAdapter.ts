/**
 * Firebase Adapter with Built-in Retry Logic
 *
 * Wraps all Firebase operations with:
 * - Automatic retry on transient failures
 * - Circuit breaker protection
 * - Retry budget management
 * - Structured logging
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
  orderBy,
  limit,
  startAfter,
  DocumentReference,
  DocumentSnapshot,
  QueryConstraint,
  serverTimestamp,
  Timestamp,
  WriteBatch,
  writeBatch,
  type Firestore,
  type DocumentData,
} from 'firebase/firestore';
import { getDb } from '../firebase-utils';
import {
  withRetry,
  withCircuitBreaker,
  withFullProtection,
  canRetry,
  consumeRetryToken,
  type RetryConfig,
} from './retryUtils';
import { logger } from '../structuredLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface AdapterOptions {
  /** Maximum retries for read operations */
  readRetries?: number;
  /** Maximum retries for write operations */
  writeRetries?: number;
  /** Base delay for retries in milliseconds */
  baseDelayMs?: number;
  /** Enable circuit breaker */
  enableCircuitBreaker?: boolean;
  /** Enable retry budget */
  enableRetryBudget?: boolean;
}

export interface QueryOptions {
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
  startAfterDoc?: DocumentSnapshot;
}

export interface BatchOperation {
  type: 'set' | 'update' | 'delete';
  collection: string;
  docId: string;
  data?: Record<string, unknown>;
  merge?: boolean;
}

const DEFAULT_OPTIONS: Required<AdapterOptions> = {
  readRetries: 3,
  writeRetries: 2,
  baseDelayMs: 100,
  enableCircuitBreaker: true,
  enableRetryBudget: true,
};

// ============================================================================
// FIREBASE ADAPTER CLASS
// ============================================================================

export class FirebaseAdapter {
  private db: Firestore;
  private options: Required<AdapterOptions>;

  constructor(options: AdapterOptions = {}) {
    this.db = getDb();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // =========================================================================
  // READ OPERATIONS
  // =========================================================================

  /**
   * Get a single document by ID
   */
  async getDocument<T extends DocumentData>(
    collectionName: string,
    docId: string
  ): Promise<T | null> {
    const circuitKey = `read:${collectionName}`;

    const operation = async () => {
      const docRef = doc(this.db, collectionName, docId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      return { id: snapshot.id, ...snapshot.data() } as unknown as T;
    };

    if (this.options.enableCircuitBreaker) {
      return withCircuitBreaker(circuitKey, () =>
        withRetry(operation, {
          maxRetries: this.options.readRetries,
          baseDelayMs: this.options.baseDelayMs,
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
        })
      );
    }

    return withRetry(operation, {
      maxRetries: this.options.readRetries,
      baseDelayMs: this.options.baseDelayMs,
    });
  }

  /**
   * Query documents with filters
   */
  async queryDocuments<T extends DocumentData>(
    collectionName: string,
    constraints: QueryConstraint[],
    options: QueryOptions = {}
  ): Promise<T[]> {
    const circuitKey = `query:${collectionName}`;

    const operation = async () => {
      const allConstraints = [...constraints];

      if (options.orderByField) {
        allConstraints.push(orderBy(options.orderByField, options.orderDirection || 'asc'));
      }

      if (options.limitCount) {
        allConstraints.push(limit(options.limitCount));
      }

      if (options.startAfterDoc) {
        allConstraints.push(startAfter(options.startAfterDoc));
      }

      const q = query(collection(this.db, collectionName), ...allConstraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as unknown as T[];
    };

    if (this.options.enableCircuitBreaker) {
      return withCircuitBreaker(circuitKey, () =>
        withRetry(operation, {
          maxRetries: this.options.readRetries,
          baseDelayMs: this.options.baseDelayMs,
        })
      );
    }

    return withRetry(operation, {
      maxRetries: this.options.readRetries,
      baseDelayMs: this.options.baseDelayMs,
    });
  }

  /**
   * Query documents with simple where clause
   */
  async queryWhere<T extends DocumentData>(
    collectionName: string,
    field: string,
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in',
    value: unknown,
    options: QueryOptions = {}
  ): Promise<T[]> {
    return this.queryDocuments<T>(
      collectionName,
      [where(field, operator, value)],
      options
    );
  }

  // =========================================================================
  // WRITE OPERATIONS
  // =========================================================================

  /**
   * Set a document (create or overwrite)
   */
  async setDocument<T extends DocumentData>(
    collectionName: string,
    docId: string,
    data: T,
    merge: boolean = false
  ): Promise<void> {
    const circuitKey = `write:${collectionName}`;
    const budgetKey = `write:${collectionName}`;

    // Check retry budget for writes
    if (this.options.enableRetryBudget && !canRetry(budgetKey)) {
      throw new Error(`Retry budget exhausted for writes to ${collectionName}`);
    }

    const operation = async () => {
      const docRef = doc(this.db, collectionName, docId);
      await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge });
    };

    if (this.options.enableRetryBudget) {
      consumeRetryToken(budgetKey);
    }

    if (this.options.enableCircuitBreaker) {
      return withCircuitBreaker(circuitKey, () =>
        withRetry(operation, {
          maxRetries: this.options.writeRetries,
          baseDelayMs: this.options.baseDelayMs,
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
        })
      );
    }

    return withRetry(operation, {
      maxRetries: this.options.writeRetries,
      baseDelayMs: this.options.baseDelayMs,
    });
  }

  /**
   * Update specific fields in a document
   */
  async updateDocument(
    collectionName: string,
    docId: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    const circuitKey = `write:${collectionName}`;
    const budgetKey = `write:${collectionName}`;

    if (this.options.enableRetryBudget && !canRetry(budgetKey)) {
      throw new Error(`Retry budget exhausted for writes to ${collectionName}`);
    }

    const operation = async () => {
      const docRef = doc(this.db, collectionName, docId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    };

    if (this.options.enableRetryBudget) {
      consumeRetryToken(budgetKey);
    }

    if (this.options.enableCircuitBreaker) {
      return withCircuitBreaker(circuitKey, () =>
        withRetry(operation, {
          maxRetries: this.options.writeRetries,
          baseDelayMs: this.options.baseDelayMs,
        })
      );
    }

    return withRetry(operation, {
      maxRetries: this.options.writeRetries,
      baseDelayMs: this.options.baseDelayMs,
    });
  }

  /**
   * Add a new document with auto-generated ID
   */
  async addDocument<T extends DocumentData>(
    collectionName: string,
    data: T
  ): Promise<string> {
    const circuitKey = `write:${collectionName}`;
    const budgetKey = `write:${collectionName}`;

    if (this.options.enableRetryBudget && !canRetry(budgetKey)) {
      throw new Error(`Retry budget exhausted for writes to ${collectionName}`);
    }

    const operation = async () => {
      const collRef = collection(this.db, collectionName);
      const docRef = await addDoc(collRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    };

    if (this.options.enableRetryBudget) {
      consumeRetryToken(budgetKey);
    }

    if (this.options.enableCircuitBreaker) {
      return withCircuitBreaker(circuitKey, () =>
        withRetry(operation, {
          maxRetries: this.options.writeRetries,
          baseDelayMs: this.options.baseDelayMs,
        })
      );
    }

    return withRetry(operation, {
      maxRetries: this.options.writeRetries,
      baseDelayMs: this.options.baseDelayMs,
    });
  }

  /**
   * Delete a document
   */
  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    const circuitKey = `write:${collectionName}`;

    const operation = async () => {
      const docRef = doc(this.db, collectionName, docId);
      await deleteDoc(docRef);
    };

    if (this.options.enableCircuitBreaker) {
      return withCircuitBreaker(circuitKey, () =>
        withRetry(operation, {
          maxRetries: this.options.writeRetries,
          baseDelayMs: this.options.baseDelayMs,
        })
      );
    }

    return withRetry(operation, {
      maxRetries: this.options.writeRetries,
      baseDelayMs: this.options.baseDelayMs,
    });
  }

  // =========================================================================
  // BATCH OPERATIONS
  // =========================================================================

  /**
   * Execute multiple operations in a batch
   */
  async batchWrite(operations: BatchOperation[]): Promise<void> {
    const circuitKey = 'write:batch';

    const operation = async () => {
      const batch = writeBatch(this.db);

      for (const op of operations) {
        const docRef = doc(this.db, op.collection, op.docId);

        switch (op.type) {
          case 'set':
            batch.set(docRef, {
              ...op.data,
              updatedAt: serverTimestamp(),
            }, { merge: op.merge || false });
            break;
          case 'update':
            batch.update(docRef, {
              ...op.data,
              updatedAt: serverTimestamp(),
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      }

      await batch.commit();
    };

    if (this.options.enableCircuitBreaker) {
      return withCircuitBreaker(circuitKey, () =>
        withRetry(operation, {
          maxRetries: this.options.writeRetries,
          baseDelayMs: this.options.baseDelayMs,
          onRetry: (attempt, error) => {
            logger.warn('Firebase batch write retry', {
              component: 'firebase',
              operation: 'batchWrite',
              operationCount: operations.length,
              attempt,
              error: error.message,
            });
          },
        })
      );
    }

    return withRetry(operation, {
      maxRetries: this.options.writeRetries,
      baseDelayMs: this.options.baseDelayMs,
    });
  }

  // =========================================================================
  // TRANSACTION OPERATIONS
  // =========================================================================

  /**
   * Run an atomic transaction
   */
  async runAtomicTransaction<T>(
    transactionFn: (
      transaction: {
        get: <D extends DocumentData>(ref: DocumentReference) => Promise<DocumentSnapshot<D>>;
        set: <D extends DocumentData>(ref: DocumentReference, data: D, options?: { merge?: boolean }) => void;
        update: (ref: DocumentReference, data: Record<string, unknown>) => void;
        delete: (ref: DocumentReference) => void;
      }
    ) => Promise<T>
  ): Promise<T> {
    const circuitKey = 'transaction';

    const operation = async () => {
      return runTransaction(this.db, async (transaction) => {
        // Wrap transaction methods to add timestamps
        const wrappedTransaction = {
          get: <D extends DocumentData>(ref: DocumentReference) =>
            transaction.get(ref) as Promise<DocumentSnapshot<D>>,
          set: <D extends DocumentData>(ref: DocumentReference, data: D, options?: { merge?: boolean }) => {
            transaction.set(ref, {
              ...data,
              updatedAt: serverTimestamp(),
            }, options || {});
          },
          update: (ref: DocumentReference, data: Record<string, unknown>) => {
            transaction.update(ref, {
              ...data,
              updatedAt: serverTimestamp(),
            });
          },
          delete: (ref: DocumentReference) => {
            transaction.delete(ref);
          },
        };

        return transactionFn(wrappedTransaction);
      });
    };

    if (this.options.enableCircuitBreaker) {
      return withCircuitBreaker(circuitKey, () =>
        withRetry(operation, {
          maxRetries: this.options.writeRetries,
          baseDelayMs: this.options.baseDelayMs,
          onRetry: (attempt, error) => {
            logger.warn('Firebase transaction retry', {
              component: 'firebase',
              operation: 'transaction',
              attempt,
              error: error.message,
            });
          },
        })
      );
    }

    return withRetry(operation, {
      maxRetries: this.options.writeRetries,
      baseDelayMs: this.options.baseDelayMs,
    });
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  /**
   * Get a document reference
   */
  getDocRef(collectionName: string, docId: string): DocumentReference {
    return doc(this.db, collectionName, docId);
  }

  /**
   * Check if a document exists
   */
  async exists(collectionName: string, docId: string): Promise<boolean> {
    const document = await this.getDocument(collectionName, docId);
    return document !== null;
  }

  /**
   * Get the Firestore instance (for advanced usage)
   */
  getFirestore(): Firestore {
    return this.db;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let defaultAdapter: FirebaseAdapter | null = null;

/**
 * Get the default Firebase adapter instance
 */
export function getFirebaseAdapter(options?: AdapterOptions): FirebaseAdapter {
  if (!defaultAdapter) {
    defaultAdapter = new FirebaseAdapter(options);
  }
  return defaultAdapter;
}

/**
 * Create a new Firebase adapter instance with custom options
 */
export function createFirebaseAdapter(options: AdapterOptions): FirebaseAdapter {
  return new FirebaseAdapter(options);
}

// Export default instance
export const firebaseAdapter = getFirebaseAdapter();
