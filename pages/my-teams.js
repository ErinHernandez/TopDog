import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Mock tournaments for demonstration
const tournaments = [
  { name: 'Best Ball Mania VI', entries: 571480, entryFee: 25, prizes: '$15,000,000', rounds: '1 of 4' },
];

// Mock team data with more detailed player information
const mockTeamData = {
  'Best Ball Mania VI': {
    players: {
      QB: [
        { name: 'Lamar Jackson', team: 'BAL', bye: 7, adp: 31.7, pick: 34, image: '/api/placeholder/40/40' },
        { name: 'Jayden Daniels', team: 'WAS', bye: 12, adp: 38.7, pick: 39, image: '/api/placeholder/40/40' },
      ],
      RB: [
        { name: 'Derrick Henry', team: 'BAL', bye: 7, adp: 13.9, pick: 15, image: '/api/placeholder/40/40' },
        { name: 'Omarion Hampton', team: 'LAC', bye: 12, adp: 59.0, pick: 58, image: '/api/placeholder/40/40' },
        { name: 'TreVeyon Henderson', team: 'NE', bye: 14, adp: 66.8, pick: 63, image: '/api/placeholder/40/40' },
        { name: 'Justice Hill', team: 'BAL', bye: 7, adp: 205.1, pick: 202, image: '/api/placeholder/40/40' },
        { name: 'Brashard Smith', team: 'KC', bye: 10, adp: 220.2, pick: 207, image: '/api/placeholder/40/40' },
        { name: 'Bucky Irving', team: 'TB', bye: 9, adp: 22.3, pick: 21, image: '/api/placeholder/40/40' },
      ],
      WR: [
        { name: 'Tyreek Hill', team: 'MIA', bye: 12, adp: 8.2, pick: 8, image: '/api/placeholder/40/40' },
        { name: 'CeeDee Lamb', team: 'DAL', bye: 11, adp: 12.1, pick: 12, image: '/api/placeholder/40/40' },
        { name: 'Amon-Ra St. Brown', team: 'DET', bye: 6, adp: 18.3, pick: 18, image: '/api/placeholder/40/40' },
        { name: 'Deebo Samuel', team: 'SF', bye: 9, adp: 45.2, pick: 44, image: '/api/placeholder/40/40' },
        { name: 'Brandon Aiyuk', team: 'SF', bye: 9, adp: 52.1, pick: 51, image: '/api/placeholder/40/40' },
        { name: 'Tee Higgins', team: 'CIN', bye: 8, adp: 78.4, pick: 77, image: '/api/placeholder/40/40' },
        { name: 'Rome Odunze', team: 'CHI', bye: 6, adp: 89.7, pick: 88, image: '/api/placeholder/40/40' },
        { name: 'Xavier Worthy', team: 'KC', bye: 10, adp: 156.3, pick: 154, image: '/api/placeholder/40/40' },
      ],
      TE: [
        { name: 'Travis Kelce', team: 'KC', bye: 10, adp: 25.8, pick: 26, image: '/api/placeholder/40/40' },
        { name: 'Sam LaPorta', team: 'DET', bye: 6, adp: 42.1, pick: 41, image: '/api/placeholder/40/40' },
        { name: 'Trey McBride', team: 'ARI', bye: 11, adp: 67.3, pick: 66, image: '/api/placeholder/40/40' },
        { name: 'Jake Ferguson', team: 'DAL', bye: 11, adp: 98.5, pick: 97, image: '/api/placeholder/40/40' },
      ],
    },
    positionCounts: { QB: 2, RB: 6, WR: 8, TE: 4 }
  }
};

const TOURNAMENTS = ['Best Ball Mania VI'];

export default function MyTeams() {
  const userId = 'Not Todd Middleton'; // Replace with real user ID in production
  const [selectedTournament, setSelectedTournament] = useState(TOURNAMENTS[0]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);
      try {
        const q = query(collection(db, 'teams'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        setTeams(snapshot.docs.map(doc => doc.data()));
      } catch (error) {
        console.error('Error fetching teams:', error);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTeams();
  }, [userId]);

  // Count teams per tournament
  const teamCounts = TOURNAMENTS.reduce((acc, t) => {
    acc[t] = teams.filter(team => team.tournament === t).length;
    return acc;
  }, {});

  const filteredTeams = teams.filter(team => team.tournament === selectedTournament);
  const currentTeamData = mockTeamData[selectedTournament] || { players: {}, positionCounts: {} };

  return (
    <div className="min-h-screen bg-[#1a1a18] text-white">
      <Head>
        <title>Drafted Teams - TopDog.dog</title>
      </Head>
      
      {/* Subheader Navigation */}
      <section className="bg-gray-900 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex justify-start space-x-8 h-14 items-center">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors font-medium text-base pb-1">
              Draft Lobby
            </Link>
            <span className="text-yellow-400 font-medium border-b-2 border-yellow-400 pb-1 text-base">
              My Teams
            </span>
            <Link href="/exposure" className="text-gray-300 hover:text-white transition-colors font-medium text-base pb-1">
              Exposure Report
            </Link>
          </div>
        </div>
      </section>
      
      <div className="flex h-screen">
        {/* Main Content - Tournament Details and User Teams */}
        <div className="flex-1 bg-[#1a1a18] p-6 overflow-y-auto">
          {/* Tournament Details */}
          <div className="bg-[#232323] rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">👁</div>
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">BB</div>
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold">T</div>
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold">G</div>
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold">M</div>
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedTournament}</h2>
                  <p className="text-gray-400 text-sm">Qualifiers</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Entry</div>
                <div className="font-semibold">${tournaments.find(t => t.name === selectedTournament)?.entryFee}</div>
              </div>
              <div>
                <div className="text-gray-400">Entries</div>
                <div className="font-semibold">{tournaments.find(t => t.name === selectedTournament)?.entries}</div>
              </div>
              <div>
                <div className="text-gray-400">Prizes</div>
                <div className="font-semibold">{tournaments.find(t => t.name === selectedTournament)?.prizes}</div>
              </div>
              <div>
                <div className="text-gray-400">Round</div>
                <div className="font-semibold">{tournaments.find(t => t.name === selectedTournament)?.rounds}</div>
              </div>
              <div>
                <div className="text-gray-400">Won</div>
                <div className="font-semibold">-</div>
              </div>
            </div>
          </div>

          {/* Your Teams Section */}
          <div className="bg-[#232323] rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Your teams</h3>
            {loading ? (
              <div className="text-gray-400">Loading teams...</div>
            ) : (
              <div className="space-y-3">
                {filteredTeams.length === 0 ? (
                  <div className="text-gray-400">No teams in this tournament.</div>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-4 bg-[#181818] rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer border-l-4 border-blue-500">
                      <span className="font-medium">Best Ball Mania VI</span>
                      <span className="text-gray-400">→</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#181818] rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer border-l-4 border-blue-500">
                      <span className="font-medium">Best Ball Mania VI</span>
                      <span className="text-gray-400">→</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#181818] rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                      <span className="font-medium">6/18pchc(2)•sndrs(2)</span>
                      <span className="text-gray-400">→</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#181818] rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                      <span className="font-medium">pacheco1</span>
                      <span className="text-gray-400">→</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#181818] rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                      <span className="font-medium">Best Ball Mania VI</span>
                      <span className="text-gray-400">→</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#181818] rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                      <span className="font-medium">Best Ball Mania VI</span>
                      <span className="text-gray-400">→</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#181818] rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                      <span className="font-medium">Best Ball Mania VI</span>
                      <span className="text-gray-400">→</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#181818] rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                      <span className="font-medium">Best Ball Mania VI</span>
                      <span className="text-gray-400">→</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Team Overview */}
        <div className="w-96 bg-[#232323] border-l border-gray-700 p-6 overflow-y-auto">
          {/* User Profile/Team Overview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex items-center space-x-2">
                <span className="font-medium">NEWUSERNAME</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Position Distribution Bar */}
            <div className="mb-6">
              <div className="flex h-4 bg-gray-700 rounded-full overflow-hidden mb-2">
                <div className="bg-purple-500 h-full" style={{ width: `${(currentTeamData.positionCounts.QB || 0) * 10}%` }}></div>
                <div className="bg-orange-500 h-full" style={{ width: `${(currentTeamData.positionCounts.RB || 0) * 10}%` }}></div>
                <div className="bg-green-500 h-full" style={{ width: `${(currentTeamData.positionCounts.WR || 0) * 10}%` }}></div>
                <div className="bg-blue-500 h-full" style={{ width: `${(currentTeamData.positionCounts.TE || 0) * 10}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{currentTeamData.positionCounts.QB || 0} QB</span>
                <span>{currentTeamData.positionCounts.RB || 0} RB</span>
                <span>{currentTeamData.positionCounts.WR || 0} WR</span>
                <span>{currentTeamData.positionCounts.TE || 0} TE</span>
              </div>
            </div>
          </div>

          {/* Player Lists */}
          {Object.entries(currentTeamData.players).map(([position, players]) => (
            <div key={position} className="mb-6">
              <h4 className="text-lg font-semibold mb-3">{position}</h4>
              <div className="space-y-2">
                {players.map((player, i) => (
                  <div key={i} className="flex items-center space-x-3 p-2 bg-[#181818] rounded-lg">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {player.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-gray-400">{player.team}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{player.bye}</div>
                      <div className="text-gray-400">{player.adp}</div>
                      <div className="text-gray-400">{player.pick}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
                <span>Bye</span>
                <span>ADP</span>
                <span>Pick</span>
              </div>
            </div>
          ))}

          {/* View Full Draft Button */}
          <button className="w-full bg-[#3B82F6] text-white py-3 rounded-lg font-semibold hover:bg-[#1d4ed8] transition-colors">
            View full draft
          </button>
        </div>
      </div>
    </div>
  );
} 