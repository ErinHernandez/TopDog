/**
 * Transaction Repository
 *
 * Typed repository for financial transactions collection
 */

import { where, orderBy } from 'firebase/firestore';

import { getFirebaseAdapter } from '@/lib/firebase/firebaseAdapter';

import { BaseRepository } from './baseRepository';

/**
 * Financial transaction document type
 */
export interface FirestoreTransaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'fee' | 'refund' | 'prize' | 'transfer';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  paymentMethod?: string;
  paymentGateway?: string;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date | { toDate(): Date };
  updatedAt: Date | { toDate(): Date };
  completedAt?: Date | { toDate(): Date };
}

/**
 * Repository for transaction documents (/transactions/{transactionId})
 */
class TransactionRepository extends BaseRepository<FirestoreTransaction> {
  constructor() {
    super('transactions', getFirebaseAdapter());
  }

  /**
   * Get a transaction by ID
   */
  async getById(transactionId: string): Promise<FirestoreTransaction | null> {
    return this.get(transactionId);
  }

  /**
   * Get transactions for a user
   */
  async getByUser(userId: string): Promise<FirestoreTransaction[]> {
    return this.queryWhere('userId', '==', userId, {
      orderByField: 'createdAt',
      orderDirection: 'desc',
    });
  }

  /**
   * Get pending transactions for a user
   */
  async getPending(userId: string): Promise<FirestoreTransaction[]> {
    return this.query(
      [
        where('userId', '==', userId),
        where('status', '==', 'pending'),
      ],
      {
        orderByField: 'createdAt',
        orderDirection: 'desc',
      }
    );
  }

  /**
   * Get completed transactions for a user
   */
  async getCompleted(userId: string): Promise<FirestoreTransaction[]> {
    return this.query(
      [
        where('userId', '==', userId),
        where('status', '==', 'completed'),
      ],
      {
        orderByField: 'completedAt',
        orderDirection: 'desc',
        limitCount: 100,
      }
    );
  }

  /**
   * Get transactions by type
   */
  async getByType(userId: string, type: string): Promise<FirestoreTransaction[]> {
    return this.query(
      [
        where('userId', '==', userId),
        where('type', '==', type),
      ],
      {
        orderByField: 'createdAt',
        orderDirection: 'desc',
      }
    );
  }

  /**
   * Create a new transaction
   */
  async createTransaction(data: Omit<FirestoreTransaction, 'id'>): Promise<string> {
    return this.create(data as FirestoreTransaction);
  }

  /**
   * Update transaction status
   */
  async updateStatus(
    transactionId: string,
    status: FirestoreTransaction['status']
  ): Promise<void> {
    const updates: Partial<FirestoreTransaction> = { status, updatedAt: new Date() };

    if (status === 'completed') {
      updates.completedAt = new Date();
    }

    await this.update(transactionId, updates);
  }

  /**
   * Mark transaction as failed
   */
  async markFailed(transactionId: string, reason?: string): Promise<void> {
    await this.update(transactionId, {
      status: 'failed',
      metadata: { failureReason: reason },
      updatedAt: new Date(),
    } as Partial<FirestoreTransaction>);
  }

  /**
   * Delete a transaction (typically only for pending/failed)
   */
  async deleteTransaction(transactionId: string): Promise<void> {
    await this.delete(transactionId);
  }
}

// Singleton instance
let transactionRepositoryInstance: TransactionRepository | null = null;

/**
 * Get the singleton TransactionRepository instance
 */
export function getTransactionRepository(): TransactionRepository {
  if (!transactionRepositoryInstance) {
    transactionRepositoryInstance = new TransactionRepository();
  }
  return transactionRepositoryInstance;
}

// Default export
export const transactionRepository = getTransactionRepository();
