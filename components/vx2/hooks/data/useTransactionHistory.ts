/**
 * useTransactionHistory - Data hook for deposit/withdrawal history
 * 
 * Provides transaction history with filtering and pagination.
 * Currently uses mock data, designed for easy API integration.
 * 
 * @example
 * ```tsx
 * const { transactions, isLoading, error, refetch } = useTransactionHistory();
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Transaction types
 */
export type TransactionType = 'deposit' | 'withdrawal' | 'entry' | 'winning' | 'refund';

/**
 * Transaction status
 */
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'cancelled';

/**
 * Transaction record
 */
export interface Transaction {
  /** Unique identifier */
  id: string;
  /** Transaction type */
  type: TransactionType;
  /** Amount in cents (positive for credits, negative for debits) */
  amountCents: number;
  /** Formatted amount (e.g., "$25.00") */
  amountFormatted: string;
  /** Transaction status */
  status: TransactionStatus;
  /** Timestamp */
  createdAt: string;
  /** Description */
  description: string;
  /** Payment method used (for deposits/withdrawals) */
  paymentMethod?: string;
  /** Reference ID (tournament ID, etc.) */
  referenceId?: string;
}

/**
 * Filter options
 */
export interface TransactionFilters {
  /** Filter by type */
  types: TransactionType[];
  /** Filter by status */
  statuses: TransactionStatus[];
  /** Date range start */
  startDate?: string;
  /** Date range end */
  endDate?: string;
}

/**
 * Hook return type
 */
export interface UseTransactionHistoryResult {
  /** Filtered transactions */
  transactions: Transaction[];
  /** All transactions (unfiltered) */
  allTransactions: Transaction[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch function */
  refetch: () => Promise<void>;
  /** Whether a refetch is in progress */
  isRefetching: boolean;
  /** Current filters */
  filters: TransactionFilters;
  /** Update filters */
  setFilters: (filters: Partial<TransactionFilters>) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Summary stats */
  stats: {
    totalDeposits: number;
    totalWithdrawals: number;
    netBalance: number;
  };
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn-1',
    type: 'deposit',
    amountCents: 10000,
    amountFormatted: '$100.00',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    description: 'Deposit via PayPal',
    paymentMethod: 'PayPal',
  },
  {
    id: 'txn-2',
    type: 'entry',
    amountCents: -2500,
    amountFormatted: '-$25.00',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    description: 'TopDog International Entry',
    referenceId: 'topdog-international',
  },
  {
    id: 'txn-3',
    type: 'entry',
    amountCents: -2500,
    amountFormatted: '-$25.00',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    description: 'TopDog International Entry',
    referenceId: 'topdog-international',
  },
  {
    id: 'txn-4',
    type: 'winning',
    amountCents: 15000,
    amountFormatted: '$150.00',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    description: 'Tournament Winnings - TopDog Regional',
    referenceId: 'topdog-regional-prev',
  },
  {
    id: 'txn-5',
    type: 'deposit',
    amountCents: 25000,
    amountFormatted: '$250.00',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    description: 'Deposit via Card',
    paymentMethod: 'Visa ****4242',
  },
  {
    id: 'txn-6',
    type: 'withdrawal',
    amountCents: -5000,
    amountFormatted: '-$50.00',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    description: 'Withdrawal to PayPal',
    paymentMethod: 'PayPal',
  },
  {
    id: 'txn-7',
    type: 'refund',
    amountCents: 2500,
    amountFormatted: '$25.00',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    description: 'Refund - Draft cancelled',
    referenceId: 'cancelled-draft-123',
  },
  {
    id: 'txn-8',
    type: 'deposit',
    amountCents: 37500,
    amountFormatted: '$375.00',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    description: 'Deposit via Card',
    paymentMethod: 'Mastercard ****8888',
  },
  {
    id: 'txn-9',
    type: 'withdrawal',
    amountCents: -20000,
    amountFormatted: '-$200.00',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
    description: 'Withdrawal to Bank Account',
    paymentMethod: 'Bank ****1234',
  },
];

// ============================================================================
// MOCK FETCH
// ============================================================================

async function fetchTransactionHistory(): Promise<Transaction[]> {
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 150));
  return MOCK_TRANSACTIONS;
}

// ============================================================================
// HOOK
// ============================================================================

const DEFAULT_FILTERS: TransactionFilters = {
  types: [],
  statuses: [],
  startDate: undefined,
  endDate: undefined,
};

/**
 * Hook for fetching and managing transaction history
 */
export function useTransactionHistory(): UseTransactionHistoryResult {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<TransactionFilters>(DEFAULT_FILTERS);

  const fetchData = useCallback(async (isRefetch = false) => {
    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const data = await fetchTransactionHistory();
      setAllTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Filter transactions
  const transactions = useMemo(() => {
    let result = [...allTransactions];
    
    // Filter by type
    if (filters.types.length > 0) {
      result = result.filter(t => filters.types.includes(t.type));
    }
    
    // Filter by status
    if (filters.statuses.length > 0) {
      result = result.filter(t => filters.statuses.includes(t.status));
    }
    
    // Filter by date range
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      result = result.filter(t => new Date(t.createdAt).getTime() >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      result = result.filter(t => new Date(t.createdAt).getTime() <= end);
    }
    
    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return result;
  }, [allTransactions, filters]);

  // Calculate stats
  const stats = useMemo(() => {
    const deposits = allTransactions
      .filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amountCents, 0);
    
    const withdrawals = allTransactions
      .filter(t => t.type === 'withdrawal' && t.status === 'completed')
      .reduce((sum, t) => sum + Math.abs(t.amountCents), 0);
    
    return {
      totalDeposits: deposits,
      totalWithdrawals: withdrawals,
      netBalance: deposits - withdrawals,
    };
  }, [allTransactions]);

  const setFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  return {
    transactions,
    allTransactions,
    isLoading,
    error,
    refetch,
    isRefetching,
    filters,
    setFilters,
    clearFilters,
    stats,
  };
}

export default useTransactionHistory;

