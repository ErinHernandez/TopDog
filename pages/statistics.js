import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getUserStats, calculateUserRank } from '../lib/userStats';

export default function Statistics() {
  const [userStats, setUserStats] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const userId = 'Not Todd Middleton'; // Replace with real user ID in production

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const stats = await getUserStats(userId);
      setUserStats(stats);
      
      if (stats) {
        const rank = calculateUserRank(stats);
        setUserRank(rank);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTopTeams = () => {
    if (!userStats?.favoriteTeams) return [];
    return Object.entries(userStats.favoriteTeams)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([team, count]) => ({ team, count }));
  };

  const getTopPositions = () => {
    if (!userStats?.playersDrafted) return [];
    const positions = ['QB', 'RB', 'WR', 'TE'];
    return positions
      .map(pos => ({
        position: pos,
        count: userStats.playersDrafted[pos] || 0
      }))
      .sort((a, b) => b.count - a.count);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading statistics...</div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">No statistics available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Statistics - TopDog.dog</title>
        <meta name="description" content="Your comprehensive TopDog.dog statistics" />
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

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8 border-b border-gray-600">
          {['overview', 'financial', 'tournaments', 'drafts', 'performance', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-bold capitalize transition-colors ${
                activeTab === tab
                  ? 'text-[#59c5bf] border-b-2 border-[#59c5bf]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Financial Overview */}
                            <div className="bg-white/10 rounded-xl p-6 border border-[#59c5bf]">
                  <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>Financial</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Current Balance:</span>
                  <span className="font-bold">{formatCurrency(userStats.balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Net Profit:</span>
                  <span className={`font-bold ${userStats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(userStats.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Deposits:</span>
                  <span className="font-bold">{formatCurrency(userStats.totalDeposits)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Winnings:</span>
                  <span className="font-bold text-green-400">{formatCurrency(userStats.totalTournamentWinnings)}</span>
                </div>
              </div>
            </div>

            {/* Tournament Overview */}
            <div className="bg-white/10 rounded-xl p-6 border border-[#59c5bf]">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>Tournaments</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Entered:</span>
                  <span className="font-bold">{userStats.tournamentsEntered?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="font-bold">{userStats.tournamentsCompleted?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Rate:</span>
                  <span className="font-bold">
                    {userStats.tournamentResults?.total > 0 
                      ? `${((userStats.tournamentResults.cashed / userStats.tournamentResults.total) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Best Finish:</span>
                  <span className="font-bold">{userStats.bestFinish || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Draft Overview */}
            <div className="bg-white/10 rounded-xl p-6 border border-[#59c5bf]">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>Drafts</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Participated:</span>
                  <span className="font-bold">{userStats.draftsParticipated || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="font-bold">{userStats.draftsCompleted || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Position:</span>
                  <span className="font-bold">{userStats.averageDraftPosition?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Picks:</span>
                  <span className="font-bold">{userStats.playersDrafted?.total || 0}</span>
                </div>
              </div>
            </div>

            {/* Performance Overview */}
            <div className="bg-white/10 rounded-xl p-6 border border-[#59c5bf]">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>Performance</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Avg Finish:</span>
                  <span className="font-bold">{userStats.averageFinish?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Points:</span>
                  <span className="font-bold">{userStats.averagePoints?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Highest Score:</span>
                  <span className="font-bold">{userStats.highestScore?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Points:</span>
                  <span className="font-bold">{userStats.totalPoints?.toFixed(1) || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Activity Overview */}
            <div className="bg-white/10 rounded-xl p-6 border border-[#59c5bf]">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>Activity</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Sessions:</span>
                  <span className="font-bold">{userStats.sessionsCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Days Active:</span>
                  <span className="font-bold">{userStats.daysActive || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Active:</span>
                  <span className="font-bold text-sm">{formatDate(userStats.lastActive)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Member Since:</span>
                  <span className="font-bold text-sm">{formatDate(userStats.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Rankings */}
            {userRank && (
                          <div className="bg-white/10 rounded-xl p-6 border border-[#59c5bf]">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>Rankings</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Overall Rank:</span>
                    <span className="font-bold">{userRank.overall?.toFixed(0) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Financial Rank:</span>
                    <span className="font-bold">{userRank.financial?.toFixed(0) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tournament Rank:</span>
                    <span className="font-bold">{userRank.tournament?.toFixed(0) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Draft Rank:</span>
                    <span className="font-bold">{userRank.draft?.toFixed(0) || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-white/10 rounded-xl p-6 border border-[#59c5bf]">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>Deposits</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Deposits:</span>
                    <span className="font-bold">{formatCurrency(userStats.totalDeposits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Largest Deposit:</span>
                    <span className="font-bold">{formatCurrency(userStats.largestDeposit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Deposit:</span>
                    <span className="font-bold">{formatCurrency(userStats.averageDeposit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>First Deposit:</span>
                    <span className="font-bold text-sm">{formatDate(userStats.firstDeposit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Deposit:</span>
                    <span className="font-bold text-sm">{formatDate(userStats.lastDeposit)}</span>
                  </div>
                </div>
              </div>

                          <div className="bg-white/10 rounded-xl p-6 border border-[#59c5bf]">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>Tournament Spending</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Entry Fees:</span>
                    <span className="font-bold">{formatCurrency(userStats.totalEntryFees?.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TopDog Entries:</span>
                    <span className="font-bold">{formatCurrency(userStats.totalEntryFees?.topdog)}</span>
                  </div>

                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-6 border border-[#59c5bf]">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>Profit & Loss</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{formatCurrency(userStats.totalDeposits)}</div>
                  <div className="text-sm text-gray-400">Total Deposits</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{formatCurrency(userStats.totalEntryFees?.total)}</div>
                  <div className="text-sm text-gray-400">Total Spent</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${userStats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(userStats.netProfit)}
                  </div>
                  <div className="text-sm text-gray-400">Net Profit</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-white/10 rounded-xl p-6 border border-[#59c5bf]">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>Tournament Participation</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>TopDog Entered:</span>
                    <span className="font-bold">{userStats.tournamentsEntered?.topdog || 0}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Total Entered:</span>
                    <span className="font-bold">{userStats.tournamentsEntered?.total || 0}</span>
                  </div>
                </div>
              </div>

                          <div className="bg-white/10 rounded-xl p-6 border border-[#59c5bf]">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>Tournament Results</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>1st Place:</span>
                    <span className="font-bold text-yellow-400">{userStats.tournamentResults?.firstPlace || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2nd Place:</span>
                    <span className="font-bold text-gray-400">{userStats.tournamentResults?.secondPlace || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>3rd Place:</span>
                    <span className="font-bold text-amber-600">{userStats.tournamentResults?.thirdPlace || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Top 10:</span>
                    <span className="font-bold">{userStats.tournamentResults?.topTen || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashed:</span>
                    <span className="font-bold text-green-400">{userStats.tournamentResults?.cashed || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-6 border border-[#59c5bf]">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>Tournament Winnings</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{formatCurrency(userStats.totalWinnings?.topdog)}</div>
                  <div className="text-sm text-gray-400">TopDog Winnings</div>
                </div>

                
              </div>
            </div>
          </div>
        )}

        {/* Drafts Tab */}
        {activeTab === 'drafts' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-white/10 rounded-xl p-6 border border-[#59c5bf]">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>Draft Participation</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Drafts Participated:</span>
                    <span className="font-bold">{userStats.draftsParticipated || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Drafts Completed:</span>
                    <span className="font-bold">{userStats.draftsCompleted || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Drafts Abandoned:</span>
                    <span className="font-bold">{userStats.draftsAbandoned || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Position:</span>
                    <span className="font-bold">{userStats.averageDraftPosition?.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-6 border border-[#c4b5fd]">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#c4b5fd' }}>Players Drafted</h3>
                <div className="space-y-2">
                  {getTopPositions().map(({ position, count }) => (
                    <div key={position} className="flex justify-between">
                      <span>{position}:</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-6 border border-[#c4b5fd]">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#c4b5fd' }}>Favorite Teams</h3>
              <div className="grid md:grid-cols-5 gap-4">
                {getTopTeams().map(({ team, count }) => (
                  <div key={team} className="text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-gray-400">{team}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 rounded-xl p-6 border border-[#c4b5fd]">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#c4b5fd' }}>Tournament Performance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Best Finish:</span>
                    <span className="font-bold">{userStats.bestFinish || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Worst Finish:</span>
                    <span className="font-bold">{userStats.worstFinish || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Finish:</span>
                    <span className="font-bold">{userStats.averageFinish?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Tournaments:</span>
                    <span className="font-bold">{userStats.tournamentResults?.total || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-6 border border-[#c4b5fd]">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#c4b5fd' }}>Scoring Performance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Highest Score:</span>
                    <span className="font-bold">{userStats.highestScore?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lowest Score:</span>
                    <span className="font-bold">{userStats.lowestScore?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Points:</span>
                    <span className="font-bold">{userStats.averagePoints?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Points:</span>
                    <span className="font-bold">{userStats.totalPoints?.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 rounded-xl p-6 border border-[#c4b5fd]">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#c4b5fd' }}>Activity Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Sessions Count:</span>
                    <span className="font-bold">{userStats.sessionsCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days Active:</span>
                    <span className="font-bold">{userStats.daysActive || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Time Spent:</span>
                    <span className="font-bold">{Math.round((userStats.totalTimeSpent || 0) / 60)} hours</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-6 border border-[#c4b5fd]">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#c4b5fd' }}>Timeline</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Member Since:</span>
                    <span className="font-bold text-sm">{formatDate(userStats.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>First Deposit:</span>
                    <span className="font-bold text-sm">{formatDate(userStats.firstDeposit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>First Tournament:</span>
                    <span className="font-bold text-sm">{formatDate(userStats.firstTournament)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>First Win:</span>
                    <span className="font-bold text-sm">{formatDate(userStats.firstWin)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Active:</span>
                    <span className="font-bold text-sm">{formatDate(userStats.lastActive)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 