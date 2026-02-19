import Head from 'next/head';
import React, { useState } from 'react';

import { initializeDevTournaments, addTournamentToDevelopment } from '../../lib/initDevTournaments';
import { devTournamentTemplates } from '../../lib/tournamentConfig';

export default function InitDevTournaments() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleInitializeAll = async () => {
    setIsInitializing(true);
    setMessage('Initializing development tournaments...');
    
    try {
      await initializeDevTournaments();
      setMessage('Development tournaments initialized successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleAddSpecific = async (tournamentKey: string) => {
    setIsInitializing(true);
    const template = devTournamentTemplates[tournamentKey as keyof typeof devTournamentTemplates];
    setMessage(`Adding ${template?.name || tournamentKey}...`);
    
    try {
      await addTournamentToDevelopment(tournamentKey);
      setMessage(`${template?.name || tournamentKey} added successfully!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <>
      <Head>
        <title>Initialize Development Tournaments - Admin</title>
        <meta name="description" content="Initialize development tournaments" />
      </Head>

      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4" style={{ color: '#c4b5fd' }}>
                Initialize Development Tournaments
              </h1>
              <p className="text-gray-300">
                Add tournaments to the development section for testing and refinement
              </p>
            </div>

            {message && (
              <div className="mb-6 p-4 rounded-lg bg-gray-800 border border-gray-700">
                <p className="text-white">{message}</p>
              </div>
            )}

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#c4b5fd' }}>
                Initialize All Development Tournaments
              </h2>
              <p className="text-gray-300 mb-4">
                This will add all development tournament templates to the database.
              </p>
              <button
                onClick={handleInitializeAll}
                disabled={isInitializing}
                className="px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#c4b5fd', color: '#111827' }}
              >
                {isInitializing ? 'Initializing...' : 'Initialize All'}
              </button>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#c4b5fd' }}>
                Add Specific Tournament
              </h2>
              <p className="text-gray-300 mb-4">
                Add individual tournaments to development:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(devTournamentTemplates).map(([key, template]) => (
                  <div key={key} className="p-4 bg-gray-700 rounded-lg">
                    <h3 className="font-bold text-white mb-2">{template.name}</h3>
                    <p className="text-gray-300 text-sm mb-3">{template.description}</p>
                    <div className="text-xs text-gray-400 mb-3">
                      <div>Entry Fee: ${template.entryFee}</div>
                      <div>Format: {template.format}</div>
                      <div>Status: {template.status}</div>
                    </div>
                    <button
                      onClick={() => handleAddSpecific(key)}
                      disabled={isInitializing}
                      className="w-full px-4 py-2 rounded-lg font-semibold bg-gray-600 text-white hover:bg-gray-500 transition-colors disabled:opacity-50"
                    >
                      Add to Development
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
