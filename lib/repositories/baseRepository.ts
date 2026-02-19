/**
 * Base Repository Pattern
 *
 * Provides a generic typed abstraction over the FirebaseAdapter
 * for type-safe CRUD operations with consistent error handling.
 *
 * All domain repositories extend this class.
 */

import {
  type DocumentData,
  type QueryConstraint,
  type DocumentSnapshot,
} from 'firebase/firestore';

import { FirebaseAdapter, type QueryOptions } from '@/lib/firebase/firebaseAdapter';
import { logger } from '@/lib/structuredLogger';

/**
 * Generic base repository class for all domain repositories
 */
export abstract class BaseRepository<T extends DocumentData> {
  protected collectionName: string;
  protected adapter: FirebaseAdapter;

  constructor(collectionName: string, adapter: FirebaseAdapter) {
    this.collectionName = collectionName;
    this.adapter = adapter;
  }

  /**
   * Get a single document by ID
   * @throws Error if document not found (returns null instead)
   */
  async get(docId: string): Promise<T | null> {
    try {
      return await this.adapter.getDocument<T>(this.collectionName, docId);
    } catch (error) {
      logger.error('Repository get failed', error as Error, {
        component: 'repository',
        operation: 'get',
        collection: this.collectionName,
        docId,
      });
      throw error;
    }
  }

  /**
   * Query documents with constraints
   */
  async query(
    constraints: QueryConstraint[] = [],
    options: QueryOptions = {}
  ): Promise<T[]> {
    try {
      return await this.adapter.queryDocuments<T>(
        this.collectionName,
        constraints,
        options
      );
    } catch (error) {
      logger.error('Repository query failed', error as Error, {
        component: 'repository',
        operation: 'query',
        collection: this.collectionName,
        constraintCount: constraints.length,
      });
      throw error;
    }
  }

  /**
   * Query documents with simple where clause
   */
  async queryWhere(
    field: string,
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in',
    value: unknown,
    options: QueryOptions = {}
  ): Promise<T[]> {
    try {
      return await this.adapter.queryWhere<T>(
        this.collectionName,
        field,
        operator,
        value,
        options
      );
    } catch (error) {
      logger.error('Repository queryWhere failed', error as Error, {
        component: 'repository',
        operation: 'queryWhere',
        collection: this.collectionName,
        field,
        operator,
      });
      throw error;
    }
  }

  /**
   * Create a new document with auto-generated ID
   */
  async create(data: T): Promise<string> {
    try {
      return await this.adapter.addDocument<T>(this.collectionName, data);
    } catch (error) {
      logger.error('Repository create failed', error as Error, {
        component: 'repository',
        operation: 'create',
        collection: this.collectionName,
      });
      throw error;
    }
  }

  /**
   * Set a document (create or replace)
   */
  async set(docId: string, data: T, merge: boolean = false): Promise<void> {
    try {
      await this.adapter.setDocument<T>(this.collectionName, docId, data, merge);
    } catch (error) {
      logger.error('Repository set failed', error as Error, {
        component: 'repository',
        operation: 'set',
        collection: this.collectionName,
        docId,
      });
      throw error;
    }
  }

  /**
   * Update specific fields in a document
   */
  async update(docId: string, updates: Partial<T>): Promise<void> {
    try {
      await this.adapter.updateDocument(
        this.collectionName,
        docId,
        updates as Record<string, unknown>
      );
    } catch (error) {
      logger.error('Repository update failed', error as Error, {
        component: 'repository',
        operation: 'update',
        collection: this.collectionName,
        docId,
      });
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async delete(docId: string): Promise<void> {
    try {
      await this.adapter.deleteDocument(this.collectionName, docId);
    } catch (error) {
      logger.error('Repository delete failed', error as Error, {
        component: 'repository',
        operation: 'delete',
        collection: this.collectionName,
        docId,
      });
      throw error;
    }
  }

  /**
   * Check if a document exists
   */
  async exists(docId: string): Promise<boolean> {
    try {
      return await this.adapter.exists(this.collectionName, docId);
    } catch (error) {
      logger.error('Repository exists check failed', error as Error, {
        component: 'repository',
        operation: 'exists',
        collection: this.collectionName,
        docId,
      });
      throw error;
    }
  }

  /**
   * Get the underlying Firebase adapter for advanced operations
   */
  getAdapter(): FirebaseAdapter {
    return this.adapter;
  }
}
