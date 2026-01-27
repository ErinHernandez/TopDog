import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '../lib/userContext';
import { getUserStats, calculateUserRank, type UserStats, type UserRank } from '../lib/userStats';
import { POSITIONS } from '../lib/constants/positions';
import type { Timestamp } from 'firebase/firestore';
import { logger } from '../lib/logger';

type TabType = 'overview' | 'financial' | 'tournaments' | 'drafts' | 'performance' | 'activity';

interface TopTeam {
  team: string;
  count: number;
}

interface TopPosition {
  position: string;
  count: number;
}

export default function Statistics() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  const userId = user?.uid;

  const fetchUserStats = async (): Promise<void> => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      const stats = await getUserStats(userId);
      setUserStats(stats);
      
      if (stats) {
        const rank = calculateUserRank(stats);
        setUserRank(rank);
      }
    } catch (error) {
      logger.error('Error fetching user stats', error instanceof Error ? error : undefined, { userId });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserStats();
    }
  }, [userId]);

  const formatCurrency = (amount: number | undefined | null): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (timestamp: Timestamp | Date | null | undefined): string => {
    if (!timestamp) return 'N/A';
    const date = timestamp && typeof timestamp === 'object' && 'toDate' in timestamp
      ? (timestamp as Timestamp).toDate()
      : timestamp instanceof Date
        ? timestamp
        : new Date(timestamp as string | number);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTopTeams = (): TopTeam[] => {
    if (!userStats?.favoriteTeams) return [];
    return Object.entries(userStats.favoriteTeams)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([team, count]) => ({ team, count }));
  };

  const getTopPositions = (): TopPosition[] => {
    if (!userStats?.playersDrafted) return [];
    return POSITIONS
      .map(pos => ({
        position: pos,
        count: userStats.playersDrafted[pos as keyof typeof userStats.playersDrafted] || 0
      }))
      .sort((a, b) => b.count - a.count);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'url(/wr_blue.png) repeat-y', backgroundSize: 'auto 100%', backgroundPosition: 'center center' }}>
        <div className="text-white text-xl">Loading statistics...</div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'url(/wr_blue.png) repeat-y', backgroundSize: 'auto 100%', backgroundPosition: 'center center' }}>
        <div className="text-white text-xl">No statistics available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white overflow-x-auto" style={{ background: 'url(/wr_blue.png) repeat-y', backgroundSize: 'auto 100%', backgroundPosition: 'center center' }}>
      <Head>
        <title>Statistics - TopDog.dog</title>
        <meta name="description" content="Your comprehensive TopDog.dog statistics" />
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

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8 border-b border-gray-600">
          {(['overview', 'financial', 'tournaments', 'drafts', 'performance', 'activity'] as TabType[]).map((tab) => (
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
          <div className="grid grid-cols-3 gap-6" style={{ minWidth: '1400px' }}>
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
                    {userStats.tournamentResults?.total && userStats.tournamentResults.total > 0 
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
    </div>
  );
}
