import React from 'react';
import Head from 'next/head'
import { useState } from 'react'

export default function Leaderboard() {
  const [selectedLeague, setSelectedLeague] = useState('all')
  const [leaderboardData] = useState([
    {
      id: 1,
      username: "FantasyKing",
      teamName: "The Dynasty",
      points: 2847,
      rank: 1,
      league: "NFL TopDog Championship",
      wins: 12,
      losses: 2
    },
    {
      id: 2,
      username: "GridironGuru",
      teamName: "Touchdown Titans",
      points: 2789,
      rank: 2,
      league: "NFL TopDog Championship",
      wins: 11,
      losses: 3
    },
    {
      id: 3,
      username: "EndZoneElite",
      teamName: "Victory Vipers",
      points: 2756,
      rank: 3,
      league: "Weekend Warriors",
      wins: 10,
      losses: 4
    },
    {
      id: 4,
      username: "ChampionChaser",
      teamName: "Elite Eleven",
      points: 2723,
      rank: 4,
      league: "NFL TopDog Championship",
      wins: 9,
      losses: 5
    },
    {
      id: 5,
      username: "PlayoffPursuer",
      teamName: "Gridiron Giants",
      points: 2698,
      rank: 5,
      league: "Weekend Warriors",
      wins: 8,
      losses: 6
    }
  ])

  const filteredData = selectedLeague === 'all' 
    ? leaderboardData 
    : leaderboardData.filter(entry => entry.league === selectedLeague)

  const leagues = [...new Set(leaderboardData.map(entry => entry.league))]

  return (
    <div className="min-h-screen overflow-x-auto zoom-resistant" style={{ background: 'url(/wr_blue.png) repeat-y', backgroundSize: 'auto 100%', backgroundPosition: 'center center', transform: 'translateZ(0)' }}>
      <Head>
        <title>Leaderboard - TopDog.dog</title>
        <meta name="description" content="View the top performers in TopDog.dog leagues" />
      </Head>

      {/* Scrollable area - adjust min-width here to control horizontal scroll */}
      {/* Change 1400px to your desired width */}
      <div className="min-w-[1400px] zoom-stable" style={{ minWidth: '1400px', transform: 'translateZ(0)' }}>
        {/* Main content area - adjust padding/margins here to control vertical scroll */}
        {/* Change py-8 to py-[32px] or adjust the 8 value for different vertical spacing */}
        <main className="container py-[18px] zoom-resistant" style={{ minWidth: '1400px', transform: 'translateZ(0)' }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Leaderboard</h1>
            <p className="text-gray-600">See who's dominating the competition</p>
          </div>

          {/* League Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLeague('all')}
                className={`px-4 py-2 rounded-md font-medium ${
                  selectedLeague === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Leagues
              </button>
              {leagues.map((league) => (
                <button
                  key={league}
                  onClick={() => setSelectedLeague(league)}
                  className={`px-4 py-2 rounded-md font-medium ${
                    selectedLeague === league
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {league}
                </button>
              ))}
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      League
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Record
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                            entry.rank === 2 ? 'bg-gray-100 text-gray-800' :
                            entry.rank === 3 ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-50 text-gray-600'
                          }`} style={{ transform: 'translateX(1px)' }}>
                            {entry.rank}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{entry.teamName.length > 14 ? entry.teamName.substring(0, 13) + '...' : entry.teamName}</div>
                          <div className="text-sm text-gray-500">@{entry.username.length > 14 ? entry.username.substring(0, 13).toUpperCase() + '...' : entry.username.toUpperCase()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.league}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {entry.points.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.wins}-{entry.losses}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Participants</h3>
              <p className="text-3xl font-bold text-primary">1,247</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Leagues</h3>
              <p className="text-3xl font-bold text-primary">24</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Prize Pool</h3>
              <p className="text-3xl font-bold text-green-600">$125K</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 