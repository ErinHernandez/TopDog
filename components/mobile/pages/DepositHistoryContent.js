/**
 * DepositHistoryContent - Mobile Deposit History Content
 * 
 * Extracted from pages/mobile-deposit-history.js for maintainability.
 * Displays transaction history with filtering.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MobilePhoneFrame, { MobilePhoneContent } from '../shared/MobilePhoneFrame';

export default function DepositHistoryContent() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Mock transaction data
  useEffect(() => {
    setTimeout(() => {
      setTransactions([
        {
          id: 'txn_001',
          type: 'deposit',
          amount: 50.00,
          method: 'Credit Card',
          status: 'completed',
          date: '2024-01-15T10:30:00Z',
          description: 'Deposit via Visa ****1234'
        },
        {
          id: 'txn_002',
          type: 'deposit',
          amount: 25.00,
          method: 'PayPal',
          status: 'completed',
          date: '2024-01-10T14:15:00Z',
          description: 'PayPal deposit'
        },
        {
          id: 'txn_003',
          type: 'withdrawal',
          amount: 75.00,
          method: 'Bank Transfer',
          status: 'pending',
          date: '2024-01-08T09:45:00Z',
          description: 'Withdrawal to Bank ****5678'
        },
        {
          id: 'txn_004',
          type: 'deposit',
          amount: 100.00,
          method: 'Apple Pay',
          status: 'completed',
          date: '2024-01-05T16:20:00Z',
          description: 'Apple Pay deposit'
        },
        {
          id: 'txn_005',
          type: 'deposit',
          amount: 30.00,
          method: 'Google Pay',
          status: 'failed',
          date: '2024-01-03T11:10:00Z',
          description: 'Google Pay deposit failed'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'deposits') return transaction.type === 'deposit';
    if (filter === 'withdrawals') return transaction.type === 'withdrawal';
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-900/20 border-green-500/30';
      case 'pending': return 'bg-yellow-900/20 border-yellow-500/30';
      case 'failed': return 'bg-red-900/20 border-red-500/30';
      default: return 'bg-gray-900/20 border-gray-500/30';
    }
  };

  const getTypeIcon = (type) => {
    if (type === 'deposit') {
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    );
  };

  return (
    <MobilePhoneFrame>
      <MobilePhoneContent>
        {/* Mobile Header */}
        <div 
          className="text-white px-4 py-3 flex items-center justify-between flex-shrink-0"
          style={{ 
            background: 'url(/wr_blue.png) no-repeat center center',
            backgroundSize: 'cover'
          }}
        >
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="p-1 hover:bg-blue-700 rounded-md transition-colors mr-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <img src="/logo.png" alt="TopDog.dog Logo" className="h-8 w-auto" />
          </div>
          <button
            onClick={() => router.back()}
            className="p-1 hover:bg-blue-700 rounded-md transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-2">Transaction History</h1>
            <p className="text-gray-400 text-sm mb-4">View your deposits and withdrawals</p>

            {/* Filter Tabs */}
            <FilterTabs filter={filter} setFilter={setFilter} />
          </div>

          {/* Transaction List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 mobile-no-scrollbar">
            {loading ? (
              <LoadingState />
            ) : filteredTransactions.length === 0 ? (
              <EmptyState />
            ) : (
              <TransactionList 
                transactions={filteredTransactions}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
                getStatusBg={getStatusBg}
                getTypeIcon={getTypeIcon}
              />
            )}
          </div>

          {/* Summary */}
          <TransactionSummary transactions={filteredTransactions} />
        </div>
      </MobilePhoneContent>
    </MobilePhoneFrame>
  );
}

function FilterTabs({ filter, setFilter }) {
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'deposits', label: 'Deposits' },
    { id: 'withdrawals', label: 'Withdrawals' }
  ];

  return (
    <div className="flex bg-gray-800 rounded-lg p-1 mb-4">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setFilter(tab.id)}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            filter === tab.id 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8">
      <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="text-gray-400">No transactions found</p>
    </div>
  );
}

function TransactionList({ transactions, formatDate, getStatusColor, getStatusBg, getTypeIcon }) {
  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className={`border rounded-lg p-4 ${getStatusBg(transaction.status)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="mt-1">{getTypeIcon(transaction.type)}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold capitalize">{transaction.type}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusBg(transaction.status)} ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-1">{transaction.description}</p>
                <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`font-bold ${transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">{transaction.method}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TransactionSummary({ transactions }) {
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="bg-gray-800/50 border-t border-gray-700 p-4">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Total Transactions:</span>
        <span className="font-semibold">{transactions.length}</span>
      </div>
      <div className="flex justify-between items-center text-sm mt-1">
        <span className="text-gray-400">Total Deposits:</span>
        <span className="font-semibold text-green-400">+${totalDeposits.toFixed(2)}</span>
      </div>
    </div>
  );
}

