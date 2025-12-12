/**
 * DepositHistoryModalVX - Transaction History Modal for VX Profile
 * 
 * Displays deposit and withdrawal history with filtering.
 * Opens as full-screen modal overlay within Profile tab.
 * Fresh VX build with TypeScript.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { TEXT_COLORS, BG_COLORS, STATE_COLORS } from '../../../../constants/colors';

// ============================================================================
// TYPES
// ============================================================================

export interface DepositHistoryModalVXProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description: string;
}

type FilterType = 'all' | 'deposits' | 'withdrawals';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_COLORS = {
  completed: '#10B981',
  pending: '#F59E0B',
  failed: '#EF4444',
} as const;

const ACCENT_COLOR = STATE_COLORS.active;

// Mock transaction data
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn_001',
    type: 'deposit',
    amount: 100.00,
    method: 'Apple Pay',
    status: 'completed',
    date: '2024-12-08T10:30:00Z',
    description: 'Apple Pay deposit'
  },
  {
    id: 'txn_002',
    type: 'deposit',
    amount: 50.00,
    method: 'Credit Card',
    status: 'completed',
    date: '2024-12-05T14:15:00Z',
    description: 'Deposit via Visa ****1234'
  },
  {
    id: 'txn_003',
    type: 'withdrawal',
    amount: 75.00,
    method: 'Bank Transfer',
    status: 'pending',
    date: '2024-12-03T09:45:00Z',
    description: 'Withdrawal to Bank ****5678'
  },
  {
    id: 'txn_004',
    type: 'deposit',
    amount: 200.00,
    method: 'PayPal',
    status: 'completed',
    date: '2024-12-01T16:20:00Z',
    description: 'PayPal deposit'
  },
  {
    id: 'txn_005',
    type: 'deposit',
    amount: 25.00,
    method: 'Google Pay',
    status: 'failed',
    date: '2024-11-28T11:10:00Z',
    description: 'Google Pay deposit failed'
  },
  {
    id: 'txn_006',
    type: 'withdrawal',
    amount: 150.00,
    method: 'Bank Transfer',
    status: 'completed',
    date: '2024-11-25T09:00:00Z',
    description: 'Withdrawal to Bank ****5678'
  },
  {
    id: 'txn_007',
    type: 'deposit',
    amount: 75.00,
    method: 'Credit Card',
    status: 'completed',
    date: '2024-11-20T14:30:00Z',
    description: 'Deposit via Mastercard ****9876'
  },
];

const MOCK_BALANCE = 425.00;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getPaymentMethodIcon(method: string): React.ReactElement {
  // Return appropriate icon based on payment method
  const iconClass = "w-5 h-5";
  
  if (method.toLowerCase().includes('apple')) {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    );
  }
  
  if (method.toLowerCase().includes('paypal')) {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.646h6.803c2.254 0 4.026.612 5.136 1.773 1.048 1.095 1.423 2.605 1.114 4.49-.32 1.967-1.244 3.59-2.674 4.693-1.402 1.082-3.261 1.631-5.524 1.631H8.008a.769.769 0 0 0-.758.646l-1.174 5.63z"/>
      </svg>
    );
  }
  
  if (method.toLowerCase().includes('google')) {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    );
  }
  
  if (method.toLowerCase().includes('bank')) {
    return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3" />
      </svg>
    );
  }
  
  // Default: Credit Card
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

// ============================================================================
// FILTER TAB BAR
// ============================================================================

interface FilterTabBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: { all: number; deposits: number; withdrawals: number };
}

function FilterTabBar({ activeFilter, onFilterChange, counts }: FilterTabBarProps): React.ReactElement {
  const tabs: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'deposits', label: 'Deposits', count: counts.deposits },
    { id: 'withdrawals', label: 'Withdrawals', count: counts.withdrawals },
  ];

  return (
    <div 
      className="flex rounded-lg p-1 mb-4"
      style={{ backgroundColor: BG_COLORS.tertiary }}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onFilterChange(tab.id)}
          className="flex-1 py-2 px-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-1.5"
          style={{
            backgroundColor: activeFilter === tab.id ? ACCENT_COLOR : 'transparent',
            color: activeFilter === tab.id ? '#000000' : TEXT_COLORS.secondary,
          }}
        >
          {tab.label}
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: activeFilter === tab.id ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)',
              color: activeFilter === tab.id ? '#000000' : TEXT_COLORS.muted,
            }}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// TRANSACTION CARD
// ============================================================================

interface TransactionCardProps {
  transaction: Transaction;
}

function TransactionCard({ transaction }: TransactionCardProps): React.ReactElement {
  const isDeposit = transaction.type === 'deposit';
  const statusColor = STATUS_COLORS[transaction.status];
  const amountColor = isDeposit ? '#10B981' : '#EF4444';

  return (
    <div 
      className="rounded-xl p-4 transition-all"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderLeft: `3px solid ${amountColor}`,
      }}
    >
      <div className="flex items-start justify-between">
        {/* Left: Icon and details */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Payment method icon */}
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: TEXT_COLORS.secondary,
            }}
          >
            {getPaymentMethodIcon(transaction.method)}
          </div>

          {/* Transaction details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="font-semibold text-sm capitalize"
                style={{ color: TEXT_COLORS.primary }}
              >
                {transaction.type}
              </span>
              <span 
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${statusColor}20`,
                  color: statusColor,
                }}
              >
                {transaction.status}
              </span>
            </div>
            <p 
              className="text-sm truncate mb-1"
              style={{ color: TEXT_COLORS.secondary }}
            >
              {transaction.description}
            </p>
            <p 
              className="text-xs"
              style={{ color: TEXT_COLORS.muted }}
            >
              {formatDate(transaction.date)}
            </p>
          </div>
        </div>

        {/* Right: Amount */}
        <div className="text-right flex-shrink-0 ml-3">
          <div 
            className="font-bold text-lg"
            style={{ color: amountColor }}
          >
            {isDeposit ? '+' : '-'}${formatAmount(transaction.amount)}
          </div>
          <div 
            className="text-xs"
            style={{ color: TEXT_COLORS.muted }}
          >
            {transaction.method}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TRANSACTION SUMMARY
// ============================================================================

interface TransactionSummaryProps {
  transactions: Transaction[];
}

function TransactionSummary({ transactions }: TransactionSummaryProps): React.ReactElement {
  const stats = useMemo(() => {
    const completed = transactions.filter(t => t.status === 'completed');
    const totalDeposits = completed
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = completed
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      count: transactions.length,
      totalDeposits,
      totalWithdrawals,
      net: totalDeposits - totalWithdrawals,
    };
  }, [transactions]);

  return (
    <div 
      className="px-4 py-3 flex-shrink-0"
      style={{ 
        backgroundColor: BG_COLORS.tertiary,
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className="flex justify-between items-center text-sm mb-1">
        <span style={{ color: TEXT_COLORS.secondary }}>Transactions:</span>
        <span className="font-semibold" style={{ color: TEXT_COLORS.primary }}>{stats.count}</span>
      </div>
      <div className="flex justify-between items-center text-sm mb-1">
        <span style={{ color: TEXT_COLORS.secondary }}>Total Deposits:</span>
        <span className="font-semibold" style={{ color: '#10B981' }}>+${formatAmount(stats.totalDeposits)}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span style={{ color: TEXT_COLORS.secondary }}>Total Withdrawals:</span>
        <span className="font-semibold" style={{ color: '#EF4444' }}>-${formatAmount(stats.totalWithdrawals)}</span>
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState(): React.ReactElement {
  return (
    <div 
      className="flex-1 flex flex-col items-center justify-center text-center px-6"
      style={{ color: TEXT_COLORS.muted }}
    >
      <svg 
        className="w-16 h-16 mb-4 opacity-40" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p 
        className="text-sm font-medium mb-2"
        style={{ color: TEXT_COLORS.secondary }}
      >
        No transactions found
      </p>
      <p className="text-xs">
        Your deposit and withdrawal history will appear here
      </p>
    </div>
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

function LoadingState(): React.ReactElement {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div 
        className="animate-spin rounded-full h-8 w-8 border-2"
        style={{ 
          borderColor: `${ACCENT_COLOR} transparent transparent transparent` 
        }}
      />
    </div>
  );
}

// ============================================================================
// BALANCE HEADER
// ============================================================================

interface BalanceHeaderProps {
  balance: number;
}

function BalanceHeader({ balance }: BalanceHeaderProps): React.ReactElement {
  return (
    <div 
      className="px-4 py-3 mb-4 rounded-xl"
      style={{ backgroundColor: 'rgba(96, 165, 250, 0.1)' }}
    >
      <div 
        className="text-xs font-medium mb-1"
        style={{ color: TEXT_COLORS.secondary }}
      >
        Current Balance
      </div>
      <div 
        className="text-2xl font-bold"
        style={{ color: ACCENT_COLOR }}
      >
        ${formatAmount(balance)}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DepositHistoryModalVX({ 
  isOpen, 
  onClose 
}: DepositHistoryModalVXProps): React.ReactElement | null {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load transactions on mount
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Simulate API call
      const timer = setTimeout(() => {
        setTransactions(MOCK_TRANSACTIONS);
        setIsLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset filter when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFilter('all');
    }
  }, [isOpen]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    if (filter === 'deposits') return transactions.filter(t => t.type === 'deposit');
    if (filter === 'withdrawals') return transactions.filter(t => t.type === 'withdrawal');
    return transactions;
  }, [transactions, filter]);

  // Count for filter tabs
  const counts = useMemo(() => ({
    all: transactions.length,
    deposits: transactions.filter(t => t.type === 'deposit').length,
    withdrawals: transactions.filter(t => t.type === 'withdrawal').length,
  }), [transactions]);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div
      className="absolute left-0 right-0 bottom-0 flex flex-col"
      style={{
        top: '60px',
        backgroundColor: BG_COLORS.secondary,
        zIndex: 100,
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <h2 
          className="text-lg font-bold"
          style={{ color: TEXT_COLORS.primary }}
        >
          Transaction History
        </h2>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          style={{ color: TEXT_COLORS.secondary }}
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 px-4 pt-4 overflow-hidden">
        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            {/* Balance */}
            <BalanceHeader balance={MOCK_BALANCE} />

            {/* Filter Tabs */}
            <FilterTabBar 
              activeFilter={filter}
              onFilterChange={setFilter}
              counts={counts}
            />

            {/* Transaction List */}
            {filteredTransactions.length === 0 ? (
              <EmptyState />
            ) : (
              <div 
                className="flex-1 overflow-y-auto space-y-3 pb-3"
                style={{ 
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {filteredTransactions.map(transaction => (
                  <TransactionCard 
                    key={transaction.id} 
                    transaction={transaction} 
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary Footer */}
      {!isLoading && filteredTransactions.length > 0 && (
        <TransactionSummary transactions={filteredTransactions} />
      )}
    </div>
  );
}

