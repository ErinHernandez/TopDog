/**
 * Headshots Test Page
 * Demonstrates SportsDataIO headshots integration
 */

import { useState, useEffect } from 'react';
import { useHeadshots } from '../../lib/swr/usePlayerSWR';

export default function HeadshotsTest() {
  const { headshots, headshotsMap, isLoading, error } = useHeadshots();
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter headshots
  const filteredHeadshots = headshots?.filter(player => {
    if (selectedPosition && player.position !== selectedPosition) return false;
    if (searchTerm && !player.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }) || [];

  // Sample players for testing
  const samplePlayers = [
    { name: 'Patrick Mahomes', position: 'QB', team: 'KC' },
    { name: 'Josh Allen', position: 'QB', team: 'BUF' },
    { name: 'Lamar Jackson', position: 'QB', team: 'BAL' },
    { name: 'Christian McCaffrey', position: 'RB', team: 'SF' },
    { name: 'Austin Ekeler', position: 'RB', team: 'LAC' },
    { name: 'Tyreek Hill', position: 'WR', team: 'MIA' },
    { name: 'Davante Adams', position: 'WR', team: 'LV' },
    { name: 'Travis Kelce', position: 'TE', team: 'KC' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0f1a',
      color: '#e2e8f0',
      padding: '40px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#60a5fa' }}>
          SportsDataIO Headshots Test
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
          Testing headshot integration with {headshots?.length || 0} players loaded
        </p>

        {error && (
          <div style={{
            backgroundColor: '#dc2626',
            color: '#fff',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '24px'
          }}>
            Error: {error.message}
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#94a3b8' }}>
              Filter by Position
            </label>
            <select
              value={selectedPosition || ''}
              onChange={(e) => setSelectedPosition(e.target.value || null)}
              style={{
                backgroundColor: '#1F2937',
                color: '#e2e8f0',
                border: '1px solid #374151',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '14px'
              }}
            >
              <option value="">All Positions</option>
              <option value="QB">QB</option>
              <option value="RB">RB</option>
              <option value="WR">WR</option>
              <option value="TE">TE</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#94a3b8' }}>
              Search Players
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              style={{
                width: '100%',
                backgroundColor: '#1F2937',
                color: '#e2e8f0',
                border: '1px solid #374151',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Sample Players with Headshots */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#60a5fa' }}>
            Sample Players (Testing Headshot Lookup)
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {samplePlayers.map(player => {
              const headshotUrl = headshotsMap?.[player.name];
              return (
                <div
                  key={player.name}
                  style={{
                    backgroundColor: '#1F2937',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #374151'
                  }}
                >
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    margin: '0 auto 12px',
                    backgroundColor: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {headshotUrl ? (
                      <img
                        src={headshotUrl}
                        alt={player.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<div style="color: #6B7280; font-size: 12px;">No Photo</div>`;
                        }}
                      />
                    ) : (
                      <div style={{ color: '#6B7280', fontSize: '12px', textAlign: 'center' }}>
                        {isLoading ? 'Loading...' : 'No Photo'}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{player.name}</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                      {player.position} • {player.team}
                    </div>
                    {headshotUrl && (
                      <div style={{ fontSize: '10px', color: '#10b981', marginTop: '4px' }}>
                        Headshot Found
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* All Headshots Grid */}
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#60a5fa' }}>
            All Players with Headshots ({filteredHeadshots.length})
          </h2>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
              Loading headshots...
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '12px'
            }}>
              {filteredHeadshots.slice(0, 100).map(player => (
                <div
                  key={player.name}
                  style={{
                    backgroundColor: '#1F2937',
                    borderRadius: '6px',
                    padding: '12px',
                    border: '1px solid #374151',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    margin: '0 auto 8px',
                    backgroundColor: '#111827'
                  }}>
                    {player.headshotUrl ? (
                      <img
                        src={player.headshotUrl}
                        alt={player.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div style={{ color: '#6B7280', fontSize: '10px', padding: '8px' }}>
                        No Photo
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 500, marginBottom: '2px' }}>
                    {player.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
                    {player.position} • {player.team}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{
          marginTop: '40px',
          padding: '16px',
          backgroundColor: '#1F2937',
          borderRadius: '8px',
          border: '1px solid #374151'
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#60a5fa' }}>Stats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '14px' }}>
            <div>
              <span style={{ color: '#9CA3AF' }}>Total Headshots:</span>{' '}
              <span style={{ color: '#10b981', fontWeight: 600 }}>{headshots?.length || 0}</span>
            </div>
            <div>
              <span style={{ color: '#9CA3AF' }}>Headshots Map Size:</span>{' '}
              <span style={{ color: '#10b981', fontWeight: 600 }}>{Object.keys(headshotsMap || {}).length}</span>
            </div>
            <div>
              <span style={{ color: '#9CA3AF' }}>Filtered Results:</span>{' '}
              <span style={{ color: '#10b981', fontWeight: 600 }}>{filteredHeadshots.length}</span>
            </div>
            <div>
              <span style={{ color: '#9CA3AF' }}>Loading:</span>{' '}
              <span style={{ color: isLoading ? '#FBBF25' : '#10b981', fontWeight: 600 }}>
                {isLoading ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

