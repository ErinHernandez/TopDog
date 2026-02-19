/**
 * Balance Reconciliation Utility
 *
 * Provides comprehensive balance reconciliation functionality:
 * - Validates individual user balances against transaction records
 * - Compares stored balance with sum of all transactions
 * - Reports discrepancies with detailed information
 * - Supports batch reconciliation of all users
 * - Logs discrepancies via structured logger
 */

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';

import { logger } from '../structuredLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'adjustment';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  timestamp: string;
  description?: string;
}

export interface UserBalance {
  userId: string;
  storedBalance: number;
  calculatedBalance: number;
  transactionCount: number;
  discrepancy: number;
  isDiscrepant: boolean;
  error?: string;
  lastChecked: string;
}

export interface ReconciliationResult {
  userId: string;
  status: 'balanced' | 'discrepant' | 'error';
  storedBalance: number;
  calculatedBalance: number;
  discrepancy: number;
  transactionCount: number;
  transactions?: Transaction[];
  error?: string;
  timestamp: string;
  details?: {
    deposits: number;
    withdrawals: number;
    payments: number;
    refunds: number;
    adjustments: number;
  };
}

export interface BulkReconciliationResult {
  totalUsers: number;
  balancedUsers: number;
  discrepantUsers: number;
  errorUsers: number;
  totalDiscrepancy: number;
  results: ReconciliationResult[];
  timestamp: string;
  processingTimeMs: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all transactions for a user
 * @param userId The user ID to query transactions for
 * @returns Array of transactions
 */
async function getUserTransactions(userId: string): Promise<Transaction[]> {
  try {
    const db = getFirestore();
    const transactionsRef = collection(db, 'transactions');

    // Build query constraints
    const constraints: QueryConstraint[] = [where('userId', '==', userId)];

    // Only query completed transactions for balance calculation
    // Pending transactions should not affect balance until confirmed
    constraints.push(where('status', '==', 'completed'));

    const q = query(transactionsRef, ...constraints);
    const snapshot = await getDocs(q);

    const transactions: Transaction[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as DocumentData;
      transactions.push({
        id: doc.id,
        userId: data.userId || userId,
        amount: data.amount || 0,
        type: data.type || 'adjustment',
        status: data.status || 'completed',
        timestamp: data.timestamp || new Date().toISOString(),
        description: data.description,
      });
    });

    return transactions;
  } catch (error) {
    logger.error('Failed to fetch user transactions', error instanceof Error ? error : new Error('Unknown error'), {
      component: 'balance-reconciliation',
      userId,
    });
    throw error;
  }
}

/**
 * Get stored balance for a user from the users collection
 * @param userId The user ID to get balance for
 * @returns The stored balance or 0 if not found
 */
async function getStoredBalance(userId: string): Promise<number> {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      logger.warn('User document not found', {
        component: 'balance-reconciliation',
        userId,
      });
      return 0;
    }

    const data = userDoc.data() as DocumentData;
    return data.balance || 0;
  } catch (error) {
    logger.error('Failed to fetch stored balance', error instanceof Error ? error : new Error('Unknown error'), {
      component: 'balance-reconciliation',
      userId,
    });
    throw error;
  }
}

/**
 * Calculate balance from transactions
 * @param transactions Array of transactions
 * @returns Calculated balance
 */
function calculateBalanceFromTransactions(transactions: Transaction[]): number {
  return transactions.reduce((balance, txn) => {
    switch (txn.type) {
      case 'deposit':
      case 'refund':
        return balance + txn.amount;
      case 'withdrawal':
      case 'payment':
        return balance - txn.amount;
      case 'adjustment':
        // Adjustments can be positive or negative; check the sign of amount
        return balance + txn.amount;
      default:
        return balance;
    }
  }, 0);
}

/**
 * Build transaction details breakdown
 * @param transactions Array of transactions
 * @returns Breakdown of transaction types and amounts
 */
function buildTransactionDetails(transactions: Transaction[]) {
  const details = {
    deposits: 0,
    withdrawals: 0,
    payments: 0,
    refunds: 0,
    adjustments: 0,
  };

  transactions.forEach((txn) => {
    if (txn.type === 'deposit') details.deposits += txn.amount;
    else if (txn.type === 'withdrawal') details.withdrawals += txn.amount;
    else if (txn.type === 'payment') details.payments += txn.amount;
    else if (txn.type === 'refund') details.refunds += txn.amount;
    else if (txn.type === 'adjustment') details.adjustments += txn.amount;
  });

  return details;
}

// ============================================================================
// MAIN RECONCILIATION FUNCTIONS
// ============================================================================

/**
 * Reconcile a single user's balance
 * Compares stored balance against calculated balance from transaction records
 *
 * @param userId The user ID to reconcile
 * @returns ReconciliationResult with detailed information
 */
export async function reconcileUserBalance(userId: string): Promise<ReconciliationResult> {
  const startTime = Date.now();

  logger.debug('Starting user balance reconciliation', {
    component: 'balance-reconciliation',
    userId,
  });

  try {
    // Fetch transactions and stored balance in parallel
    const [transactions, storedBalance] = await Promise.all([
      getUserTransactions(userId),
      getStoredBalance(userId),
    ]);

    // Calculate balance from transactions
    const calculatedBalance = calculateBalanceFromTransactions(transactions);
    const discrepancy = storedBalance - calculatedBalance;
    const isDiscrepant = Math.abs(discrepancy) > 0.01; // Allow for floating point errors

    // Build transaction details
    const details = buildTransactionDetails(transactions);

    // Log result
    if (isDiscrepant) {
      logger.warn('Balance discrepancy detected', {
        component: 'balance-reconciliation',
        userId,
        storedBalance,
        calculatedBalance,
        discrepancy,
        transactionCount: transactions.length,
        processingTimeMs: Date.now() - startTime,
      });
    } else {
      logger.debug('Balance reconciliation complete - no discrepancy', {
        component: 'balance-reconciliation',
        userId,
        balance: storedBalance,
        transactionCount: transactions.length,
        processingTimeMs: Date.now() - startTime,
      });
    }

    return {
      userId,
      status: isDiscrepant ? 'discrepant' : 'balanced',
      storedBalance,
      calculatedBalance,
      discrepancy,
      transactionCount: transactions.length,
      timestamp: new Date().toISOString(),
      details,
    };
  } catch (error) {
    logger.error('Balance reconciliation error', error instanceof Error ? error : new Error('Unknown error'), {
      component: 'balance-reconciliation',
      userId,
      processingTimeMs: Date.now() - startTime,
    });

    return {
      userId,
      status: 'error',
      storedBalance: 0,
      calculatedBalance: 0,
      discrepancy: 0,
      transactionCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// BATCH RECONCILIATION
// ============================================================================

export interface BulkReconciliationOptions {
  /**
   * Maximum number of users to process
   * Default: undefined (all users)
   */
  maxUsers?: number;
  /**
   * Only reconcile users with pending discrepancies
   * Default: false (reconcile all users)
   */
  onlyDiscrepancies?: boolean;
  /**
   * Report only summary, not individual results
   * Default: false
   */
  summaryOnly?: boolean;
}

/**
 * Reconcile balances for all or multiple users
 * Useful for periodic balance audits and discrepancy detection
 *
 * @param options Configuration for bulk reconciliation
 * @returns BulkReconciliationResult with aggregated data
 */
export async function reconcileAllBalances(
  options: BulkReconciliationOptions = {}
): Promise<BulkReconciliationResult> {
  const startTime = Date.now();
  const { maxUsers, onlyDiscrepancies = false, summaryOnly = false } = options;

  logger.info('Starting bulk balance reconciliation', {
    component: 'balance-reconciliation',
    maxUsers,
    onlyDiscrepancies,
  });

  try {
    const db = getFirestore();
    const usersRef = collection(db, 'users');

    // Build query - limit if specified
    const constraints: QueryConstraint[] = [];
    if (maxUsers) {
      constraints.push(limit(maxUsers));
    }

    const q = query(usersRef, ...constraints);
    const snapshot = await getDocs(q);

    const results: ReconciliationResult[] = [];
    let totalDiscrepancy = 0;
    let balancedUsers = 0;
    let discrepantUsers = 0;
    let errorUsers = 0;

    // Process each user
    for (const userDoc of snapshot.docs) {
      const userId = userDoc.id;

      try {
        const result = await reconcileUserBalance(userId);

        // Skip discrepant results if only reporting discrepancies
        if (onlyDiscrepancies && result.status !== 'discrepant') {
          continue;
        }

        // Add to results if not summary-only
        if (!summaryOnly) {
          results.push(result);
        }

        // Update counters
        switch (result.status) {
          case 'balanced':
            balancedUsers++;
            break;
          case 'discrepant':
            discrepantUsers++;
            totalDiscrepancy += Math.abs(result.discrepancy);
            break;
          case 'error':
            errorUsers++;
            break;
        }
      } catch (error) {
        errorUsers++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (!summaryOnly) {
          results.push({
            userId,
            status: 'error',
            storedBalance: 0,
            calculatedBalance: 0,
            discrepancy: 0,
            transactionCount: 0,
            error: errorMessage,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    const totalUsers = snapshot.size;
    const processingTimeMs = Date.now() - startTime;

    logger.info('Bulk balance reconciliation complete', {
      component: 'balance-reconciliation',
      totalUsers,
      balancedUsers,
      discrepantUsers,
      errorUsers,
      totalDiscrepancy,
      processingTimeMs,
    });

    return {
      totalUsers,
      balancedUsers,
      discrepantUsers,
      errorUsers,
      totalDiscrepancy,
      results,
      timestamp: new Date().toISOString(),
      processingTimeMs,
    };
  } catch (error) {
    logger.error('Bulk balance reconciliation error', error instanceof Error ? error : new Error('Unknown error'), {
      component: 'balance-reconciliation',
      processingTimeMs: Date.now() - startTime,
    });

    return {
      totalUsers: 0,
      balancedUsers: 0,
      discrepantUsers: 0,
      errorUsers: 1,
      totalDiscrepancy: 0,
      results: [],
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    };
  }
}
