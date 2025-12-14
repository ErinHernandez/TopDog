import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';

export default function Profile() {
  const [userBalance, setUserBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = 'NEWUSERNAME'; // In production, this would come from authentication

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Fetch user balance
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserBalance(userDoc.data().balance || 0);
      }

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
      console.error('Error fetching user data:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'url(/wr_blue.png) repeat-y', backgroundSize: 'auto 100%', backgroundPosition: 'center center' }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white overflow-x-auto" style={{ background: 'url(/wr_blue.png) repeat-y', backgroundSize: 'auto 100%', backgroundPosition: 'center center' }}>
      <Head>
        <title>Profile - TopDog.dog</title>
        <meta name="description" content="Your TopDog.dog profile and account information" />
      </Head>
      
      <div className="min-w-[1400px]">
      {/* Subheader Navigation */}
      <section className="border-b border-gray-700 bg-white">
        <div className="container mx-auto px-4" style={{ minWidth: '1400px' }}>
          <div className="flex justify-start space-x-8 items-center" style={{ marginTop: '0px', marginBottom: '0px', height: '54px' }}>
            <Link href="/" className="font-medium text-base pb-1 transition-colors" style={{ fontSize: '0.95rem', WebkitTextStroke: '0.12px #18181b', color: '#ffffff', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Draft Lobby
            </Link>
            <Link href="/my-teams" className="font-medium text-base pb-1 transition-colors" style={{ fontSize: '0.95rem', WebkitTextStroke: '0.12px #18181b', color: '#ffffff', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              My Teams
            </Link>
            <Link href="/exposure" className="font-medium text-base pb-1 transition-colors" style={{ fontSize: '0.95rem', WebkitTextStroke: '0.12px #18181b', color: '#ffffff', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Exposure Report
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8" style={{ minWidth: '1400px' }}>
        <h1 className="text-4xl font-bold mb-8" style={{ color: '#3B82F6' }}>
          Profile
        </h1>

        {/* Balance Section */}
        <div className="bg-white/10 rounded-xl p-6 mb-8 border border-[#3B82F6]">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#3B82F6' }}>
                Account Balance
              </h2>
              <p className="text-3xl font-bold text-white">
                ${userBalance.toFixed(2)}
              </p>
            </div>
            <button
              className="bg-[#111827] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#1f2937] transition-colors"
            >
              Deposit Funds
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white/10 rounded-xl p-6 border border-[#3B82F6]">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#3B82F6' }}>
            Transaction History
          </h2>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300 text-lg">No transactions yet</p>
              <p className="text-gray-400 text-sm mt-2">Make your first deposit to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="font-bold text-white capitalize">
                      {transaction.type}
                    </p>
                    <p className="text-sm text-gray-300">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${
                      transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </p>
                    <p className={`text-sm ${
                      transaction.status === 'completed' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {transaction.status}
                    </p>
            </div>
            </div>
              ))}
            </div>
          )}
        </div>
      </div>

        </div>
      </div>
  );
} 