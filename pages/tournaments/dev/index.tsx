import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { db } from '../../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';

interface Tournament {
  id: string;
  name: string;
  description: string;
  entryFee: number;
  maxEntries: number;
  prizePool: number;
  format: string;
  leagueSize: number;
  draftDate?: string;
  status: string;
  features?: string[];
  notes?: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  [key: string]: unknown;
}

interface TournamentForm {
  name: string;
  description: string;
  entryFee: number;
  maxEntries: number;
  prizePool: number;
  format: string;
  leagueSize: number;
  draftDate: string;
  status: string;
  features: string[];
  notes: string;
}

export default function DevTournaments() {
  const router = useRouter();
  const [devTournaments, setDevTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTournament, setNewTournament] = useState<TournamentForm>({
    name: '',
    description: '',
    entryFee: 0,
    maxEntries: 0,
    prizePool: 0,
    format: 'Best Ball',
    leagueSize: 12,
    draftDate: '',
    status: 'development',
    features: [],
    notes: ''
  });

  useEffect(() => {
    fetchDevTournaments();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount
  }, []);

  const fetchDevTournaments = async () => {
    if (!db) {
      console.error('Firebase db not initialized');
      setLoading(false);
      return;
    }
    try {
      const querySnapshot = await getDocs(collection(db, 'devTournaments'));
      const tournaments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tournament[];
      setDevTournaments(tournaments);
    } catch (error) {
      console.error('Error fetching dev tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) {
      console.error('Firebase db not initialized');
      return;
    }
    try {
      await addDoc(collection(db, 'devTournaments'), {
        ...newTournament,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setNewTournament({
        name: '',
        description: '',
        entryFee: 0,
        maxEntries: 0,
        prizePool: 0,
        format: 'Best Ball',
        leagueSize: 12,
        draftDate: '',
        status: 'development',
        features: [],
        notes: ''
      });
      setShowCreateForm(false);
      fetchDevTournaments();
    } catch (error) {
      console.error('Error creating tournament:', error);
    }
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!db) {
      console.error('Firebase db not initialized');
      return;
    }
    if (confirm('Are you sure you want to delete this tournament?')) {
      try {
        await deleteDoc(doc(db, 'devTournaments', tournamentId));
        fetchDevTournaments();
      } catch (error) {
        console.error('Error deleting tournament:', error);
      }
    }
  };

  const handleStatusChange = async (tournamentId: string, newStatus: string) => {
    if (!db) {
      console.error('Firebase db not initialized');
      return;
    }
    try {
      await updateDoc(doc(db, 'devTournaments', tournamentId), {
        status: newStatus,
        updatedAt: new Date()
      });
      fetchDevTournaments();
    } catch (error) {
      console.error('Error updating tournament status:', error);
    }
  };

  const formatDate = (date: Timestamp | Date | undefined): string => {
    if (!date) return 'Unknown';
    const dateObj = date instanceof Timestamp ? date.toDate() : date instanceof Date ? date : new Date();
    return dateObj.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading development tournaments...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Development Tournaments - TopDog.dog</title>
        <meta name="description" content="Manage tournaments in development" />
      </Head>

      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#59c5bf' }}>
                  Development Tournaments
                </h1>
                <p className="text-gray-300">
                  Manage and track tournaments currently in development
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 rounded-lg font-bold transition-colors"
                style={{ backgroundColor: '#59c5bf', color: '#111827' }}
              >
                Create New Tournament
              </button>
            </div>

            {/* Create Tournament Form */}
            {showCreateForm && (
              <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#59c5bf' }}>
                  Create New Development Tournament
                </h2>
                <form onSubmit={handleCreateTournament} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 mb-2">Tournament Name</label>
                      <input
                        type="text"
                        value={newTournament.name}
                        onChange={(e) => setNewTournament({...newTournament, name: e.target.value})}
                        className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">Entry Fee ($)</label>
                      <input
                        type="number"
                        value={newTournament.entryFee}
                        onChange={(e) => setNewTournament({...newTournament, entryFee: parseInt(e.target.value) || 0})}
                        className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">Max Entries</label>
                      <input
                        type="number"
                        value={newTournament.maxEntries}
                        onChange={(e) => setNewTournament({...newTournament, maxEntries: parseInt(e.target.value) || 0})}
                        className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">Prize Pool ($)</label>
                      <input
                        type="number"
                        value={newTournament.prizePool}
                        onChange={(e) => setNewTournament({...newTournament, prizePool: parseInt(e.target.value) || 0})}
                        className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">Format</label>
                      <select
                        value={newTournament.format}
                        onChange={(e) => setNewTournament({...newTournament, format: e.target.value})}
                        className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
                      >
                        <option value="Best Ball">Best Ball</option>
                        <option value="SuperFlex">SuperFlex</option>
                        <option value="Dynasty">Dynasty</option>
                        <option value="Redraft">Redraft</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">League Size</label>
                      <input
                        type="number"
                        value={newTournament.leagueSize}
                        onChange={(e) => setNewTournament({...newTournament, leagueSize: parseInt(e.target.value) || 12})}
                        className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Description</label>
                    <textarea
                      value={newTournament.description}
                      onChange={(e) => setNewTournament({...newTournament, description: e.target.value})}
                      className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 h-24"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Development Notes</label>
                    <textarea
                      value={newTournament.notes}
                      onChange={(e) => setNewTournament({...newTournament, notes: e.target.value})}
                      className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 h-24"
                      placeholder="Add development notes, features to implement, etc."
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-lg font-bold transition-colors"
                      style={{ backgroundColor: '#59c5bf', color: '#111827' }}
                    >
                      Create Tournament
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-6 py-3 rounded-lg font-bold bg-gray-600 text-white hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tournament List */}
            <div className="grid gap-6">
              {devTournaments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-xl mb-4">No development tournaments found</div>
                  <p className="text-gray-500">Create your first development tournament to get started</p>
                </div>
              ) : (
                devTournaments.map((tournament) => (
                  <div key={tournament.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2" style={{ color: '#59c5bf' }}>
                          {tournament.name}
                        </h3>
                        <p className="text-gray-300 mb-2">{tournament.description}</p>
                        <div className="flex space-x-4 text-sm text-gray-400">
                          <span>${tournament.entryFee} Entry</span>
                          <span>{tournament.maxEntries} Max Entries</span>
                          <span>${(tournament.prizePool || 0).toLocaleString()} Prize Pool</span>
                          <span>{tournament.format}</span>
                          <span>{tournament.leagueSize} Teams</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <select
                          value={tournament.status}
                          onChange={(e) => handleStatusChange(tournament.id, e.target.value)}
                          className="px-3 py-1 rounded bg-gray-700 text-white border border-gray-600 text-sm"
                        >
                          <option value="development">Development</option>
                          <option value="testing">Testing</option>
                          <option value="ready">Ready for Launch</option>
                          <option value="launched">Launched</option>
                        </select>
                        <button
                          onClick={() => handleDeleteTournament(tournament.id)}
                          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {tournament.notes && (
                      <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                        <h4 className="font-semibold mb-2" style={{ color: '#59c5bf' }}>Development Notes</h4>
                        <p className="text-gray-300 text-sm">{tournament.notes}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>Created: {formatDate(tournament.createdAt)}</span>
                      <span>Updated: {formatDate(tournament.updatedAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
