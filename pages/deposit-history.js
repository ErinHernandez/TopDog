import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

export default function DepositHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = 'Not Todd Middleton'; // In production, this would come from authentication

  useEffect(() => {
    fetchTransactionHistory();
  }, []);

  const fetchTransactionHistory = async () => {
    try {
      // Fetch transaction history
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsData = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getTransactionType = (type) => {
    switch (type) {
      case 'deposit':
        return { label: 'Deposit', color: 'text-green-400' };
      case 'withdrawal':
        return { label: 'Withdrawal', color: 'text-red-400' };
      case 'entry_fee':
        return { label: 'Entry Fee', color: 'text-yellow-400' };
      case 'winnings':
        return { label: 'Winnings', color: 'text-green-400' };
      default:
        return { label: type, color: 'text-gray-400' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading transaction history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Transaction History - TopDog.dog</title>
        <meta name="description" content="Your TopDog.dog transaction history" />
      </Head>
      
      {/* Subheader Navigation */}
      <section className="bg-gray-900 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex justify-start space-x-8 h-14 items-center">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors font-medium text-base pb-1">
              Draft Lobby
            </Link>
            <Link href="/my-teams" className="text-gray-300 hover:text-white transition-colors font-medium text-base pb-1">
              My Teams
            </Link>
            <Link href="/exposure" className="text-gray-300 hover:text-white transition-colors font-medium text-base pb-1">
              Exposure Report
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8" style={{ color: '#3B82F6' }}>
          Transaction History
        </h1>

        {/* Transaction List */}
        <div className="bg-white/10 rounded-xl p-6 border border-[#3B82F6]">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#3B82F6' }}>
            Recent Transactions
          </h2>
          
          {transactions.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              <p className="text-lg">No transactions found</p>
              <p className="text-sm mt-2">Your transaction history will appear here once you make deposits or enter tournaments.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const typeInfo = getTransactionType(transaction.type);
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-4">
                      <div className={`font-semibold ${typeInfo.color}`}>
                        {typeInfo.label}
                      </div>
                      <div className="text-gray-300">
                        {transaction.description || 'Transaction'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className={`font-bold text-lg ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.amount >= 0 ? '+' : ''}{formatAmount(transaction.amount)}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {formatDate(transaction.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 