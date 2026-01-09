import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { devTournamentTemplates, tournamentStatuses, tournamentFormats } from '../../../lib/tournamentConfig';

export default function DevTournamentDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (id) {
      fetchTournament();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchTournament is stable
  }, [id]);

  const fetchTournament = async () => {
    try {
      const docRef = doc(db, 'devTournaments', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTournament({ id: docSnap.id, ...data });
        setEditForm({ id: docSnap.id, ...data });
      } else {
        router.push('/tournaments/dev');
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const docRef = doc(db, 'devTournaments', id);
      await updateDoc(docRef, {
        ...editForm,
        updatedAt: new Date()
      });
      setTournament({ ...tournament, ...editForm });
      setEditing(false);
    } catch (error) {
      console.error('Error updating tournament:', error);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'devTournaments', id));
        router.push('/tournaments/dev');
      } catch (error) {
        console.error('Error deleting tournament:', error);
      }
    }
  };

  const createFromTemplate = async (templateKey) => {
    const template = devTournamentTemplates[templateKey];
    if (template) {
      setEditForm({
        ...template,
        name: `${template.name} - ${new Date().toLocaleDateString()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setEditing(true);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading tournament...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Tournament not found</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{tournament.name} - Development Tournament - TopDog.dog</title>
        <meta name="description" content={`Development tournament: ${tournament.name}`} />
      </Head>

      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <Link href="/tournaments/dev" className="text-gray-400 hover:text-white mb-4 inline-block">
                  ← Back to Development Tournaments
                </Link>
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#59c5bf' }}>
                  {tournament.name}
                </h1>
                <p className="text-gray-300 mb-4">{tournament.description}</p>
                <div className="flex items-center space-x-4">
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-semibold"
                    style={{ 
                      backgroundColor: tournamentStatuses.find(s => s.value === tournament.status)?.color + '20',
                      color: tournamentStatuses.find(s => s.value === tournament.status)?.color
                    }}
                  >
                    {tournamentStatuses.find(s => s.value === tournament.status)?.label}
                  </span>
                  <span className="text-gray-400 text-sm">
                    Created: {tournament.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setEditing(!editing)}
                  className="px-4 py-2 rounded-lg font-semibold transition-colors"
                  style={{ backgroundColor: '#59c5bf', color: '#111827' }}
                >
                  {editing ? 'Cancel Edit' : 'Edit Tournament'}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Edit Form */}
            {editing && (
              <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#59c5bf' }}>
                  Edit Tournament
                </h2>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Tournament Name</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Status</label>
                    <select
                      value={editForm.status || 'development'}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                      className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
                    >
                      {tournamentStatuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Entry Fee ($)</label>
                    <input
                      type="number"
                      value={editForm.entryFee || 0}
                      onChange={(e) => setEditForm({...editForm, entryFee: parseInt(e.target.value)})}
                      className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Max Entries</label>
                    <input
                      type="number"
                      value={editForm.maxEntries || 0}
                      onChange={(e) => setEditForm({...editForm, maxEntries: parseInt(e.target.value)})}
                      className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Prize Pool ($)</label>
                    <input
                      type="number"
                      value={editForm.prizePool || 0}
                      onChange={(e) => setEditForm({...editForm, prizePool: parseInt(e.target.value)})}
                      className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Format</label>
                    <select
                      value={editForm.format || 'Best Ball'}
                      onChange={(e) => setEditForm({...editForm, format: e.target.value})}
                      className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
                    >
                      {tournamentFormats.map(format => (
                        <option key={format} value={format}>
                          {format}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 h-24"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Development Notes</label>
                  <textarea
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 h-32"
                    placeholder="Add development notes, features to implement, bugs to fix, etc."
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleSave}
                    className="px-6 py-3 rounded-lg font-bold transition-colors"
                    style={{ backgroundColor: '#59c5bf', color: '#111827' }}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-6 py-3 rounded-lg font-bold bg-gray-600 text-white hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Tournament Details */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Basic Info */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>
                  Tournament Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400 text-sm">Entry Fee</span>
                    <div className="text-white font-semibold">${tournament.entryFee?.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Max Entries</span>
                    <div className="text-white font-semibold">{tournament.maxEntries?.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Prize Pool</span>
                    <div className="text-white font-semibold">${tournament.prizePool?.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Format</span>
                    <div className="text-white font-semibold">{tournament.format}</div>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">League Size</span>
                    <div className="text-white font-semibold">{tournament.leagueSize} Teams</div>
                  </div>
                </div>
              </div>

              {/* Development Notes */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>
                  Development Notes
                </h3>
                {tournament.notes ? (
                  <div className="text-gray-300 whitespace-pre-wrap">{tournament.notes}</div>
                ) : (
                  <div className="text-gray-500 italic">No development notes added yet.</div>
                )}
              </div>

              {/* Templates */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>
                  Quick Templates
                </h3>
                <div className="space-y-3">
                  {Object.entries(devTournamentTemplates).map(([key, template]) => (
                    <button
                      key={key}
                      onClick={() => createFromTemplate(key)}
                      className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                    >
                      <div className="font-semibold text-white">{template.name}</div>
                      <div className="text-sm text-gray-400">{template.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Features & Implementation */}
            {tournament.features && tournament.features.length > 0 && (
              <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4" style={{ color: '#59c5bf' }}>
                  Features & Implementation Status
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {tournament.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 