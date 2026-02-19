import Image from 'next/image';
import React, { useState } from 'react';

interface Endpoint {
  name: string;
  path: string;
  description: string;
}

interface ApiResult {
  count?: number;
  season?: number;
  week?: number;
  summary?: {
    live?: number;
    final?: number;
  };
  scoringType?: string;
  data?: unknown[];
  caches?: Record<string, {
    exists: boolean;
    isValid: boolean;
    ageMinutes: number;
    itemCount?: number;
  }>;
  error?: string | Record<string, unknown>;
  [key: string]: unknown;
}

interface Player {
  Name?: string;
  name?: string;
  Position?: string;
  position?: string;
  FantasyPointsPPR?: number;
  fantasyPointsPPR?: number;
  projectedPointsPPR?: number;
  projectedPoints?: number;
  adpPPR?: number;
  adp?: number;
  overallRank?: number;
  positionRank?: string | number;
  games?: number;
  team?: string;
  byeWeek?: number;
  opponent?: string;
  totalOpportunities?: number;
  totalTouchdowns?: number;
  headshotUrl?: string;
  number?: number;
  [key: string]: unknown;
}

interface Game {
  isLive?: boolean;
  isFinal?: boolean;
  quarter?: string;
  awayTeam?: string;
  homeTeam?: string;
  awayScore?: number;
  homeScore?: number;
  [key: string]: unknown;
}

interface Team {
  key?: string;
  name?: string;
  fullName?: string;
  colors?: {
    primary?: string;
  };
  headCoach?: string;
  stadium?: {
    name?: string;
  };
  byeWeek?: number;
  [key: string]: unknown;
}

const ENDPOINTS: Endpoint[] = [
  // Live & Scores
  { 
    name: 'Current Week', 
    path: '/api/nfl/current-week',
    description: 'Current NFL season/week info'
  },
  { 
    name: 'Live Scores', 
    path: '/api/nfl/scores',
    description: 'All game scores (live & final)'
  },
  { 
    name: 'Games In Progress', 
    path: '/api/nfl/live',
    description: 'Only games currently in progress'
  },
  { 
    name: 'Live Fantasy', 
    path: '/api/nfl/fantasy-live?limit=20',
    description: 'Live fantasy scores (top 20)'
  },
  // Fantasy & ADP
  { 
    name: 'Fantasy ADP', 
    path: '/api/nfl/fantasy/adp?limit=20',
    description: 'Average Draft Position (top 20)'
  },
  { 
    name: 'Fantasy Rankings', 
    path: '/api/nfl/fantasy/rankings?limit=20',
    description: 'Fantasy rankings with projections'
  },
  // Player Data & Projections
  { 
    name: 'Projections', 
    path: '/api/nfl/projections?position=QB,RB,WR,TE&limit=20',
    description: 'Season projections (top 20 fantasy players)'
  },
  { 
    name: 'Season Stats', 
    path: '/api/nfl/stats/season?limit=20',
    description: 'Season stats (top 20 by PPR)'
  },
  { 
    name: 'Weekly Stats', 
    path: '/api/nfl/stats/weekly?week=1&limit=20',
    description: 'Week 1 stats (top 20)'
  },
  { 
    name: 'Red Zone Stats', 
    path: '/api/nfl/stats/redzone?limit=20',
    description: 'Red zone opportunities (top 20)'
  },
  { 
    name: 'Players', 
    path: '/api/nfl/players?position=QB,RB,WR,TE&limit=20',
    description: 'All players with headshots (top 20)'
  },
  { 
    name: 'Headshots', 
    path: '/api/nfl/headshots?position=QB&team=KC',
    description: 'Player headshot URLs (Chiefs QBs)'
  },
  // Schedule & Teams
  { 
    name: 'Schedule', 
    path: '/api/nfl/schedule?week=1',
    description: 'NFL schedule (Week 1)'
  },
  { 
    name: 'Teams', 
    path: '/api/nfl/teams',
    description: 'All NFL teams with info'
  },
  { 
    name: 'Bye Weeks', 
    path: '/api/nfl/bye-weeks',
    description: 'Bye weeks by team'
  },
  // Injuries & Depth
  { 
    name: 'Injuries', 
    path: '/api/nfl/injuries?position=QB,RB,WR,TE',
    description: 'Current injuries (skill positions)'
  },
  { 
    name: 'Depth Charts', 
    path: '/api/nfl/depth-charts?team=KC',
    description: 'Team depth charts (Chiefs)'
  },
  // News & Cache
  { 
    name: 'News', 
    path: '/api/nfl/news?limit=10',
    description: 'Latest NFL news (10 items)'
  },
  { 
    name: 'Cache Status', 
    path: '/api/nfl/cache-status',
    description: 'View all cache statuses'
  },
];

export default function SportsDataIOTest() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ApiResult>>({});
  const [error, setError] = useState<string | null>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  const runTest = async (endpoint: Endpoint) => {
    setLoading(endpoint.name);
    setError(null);

    try {
      const res = await fetch(endpoint.path);
      const data = await res.json() as ApiResult;

      if (!res.ok) {
        setResults(prev => ({ ...prev, [endpoint.name]: { error: data } }));
      } else {
        setResults(prev => ({ ...prev, [endpoint.name]: data }));
        setExpandedEndpoint(endpoint.name);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setResults(prev => ({ ...prev, [endpoint.name]: { error: errorMessage } }));
    } finally {
      setLoading(null);
    }
  };

  const runAll = async () => {
    for (const endpoint of ENDPOINTS) {
      await runTest(endpoint);
    }
  };

  const clearCache = async () => {
    setLoading('Clearing...');
    try {
      const res = await fetch('/api/nfl/cache-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });
      const data = await res.json() as { message?: string };
      alert(data.message || 'Cache cleared');
      // Refresh cache status
      const cacheEndpoint = ENDPOINTS.find(e => e.name === 'Cache Status');
      if (cacheEndpoint) {
        await runTest(cacheEndpoint);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Error clearing cache: ${  errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  const getPositionColor = (position: string | undefined): string => {
    if (!position) return '#7C3AED';
    switch (position) {
      case 'QB': return '#F472B6';
      case 'RB': return '#0fba80';
      case 'WR': return '#4285F4';
      case 'TE': return '#7C3AED';
      default: return '#7C3AED';
    }
  };

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
          SportsDataIO NFL API Dashboard
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
          Test all NFL data endpoints with caching
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <button
            onClick={runAll}
            disabled={!!loading}
            style={{
              backgroundColor: '#2563eb',
              color: '#fff',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Test All Endpoints
          </button>
          <button
            onClick={clearCache}
            disabled={!!loading}
            style={{
              backgroundColor: '#dc2626',
              color: '#fff',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Clear All Caches
          </button>
        </div>

        {/* Endpoint cards */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {ENDPOINTS.map(endpoint => {
            const result = results[endpoint.name];
            const isLoading = loading === endpoint.name;
            const isExpanded = expandedEndpoint === endpoint.name;
            const hasError = !!result?.error;
            
            return (
              <div 
                key={endpoint.name}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: hasError ? '1px solid #dc2626' : result ? '1px solid #10b981' : '1px solid #334155',
                }}
              >
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: '#263548',
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#f1f5f9' }}>
                      {endpoint.name}
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                      {endpoint.description}
                    </p>
                    <code style={{ 
                      fontSize: '11px', 
                      color: '#60a5fa',
                      backgroundColor: '#1e293b',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      marginTop: '4px',
                      display: 'inline-block'
                    }}>
                      {endpoint.path}
                    </code>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {result && (
                      <button
                        onClick={() => setExpandedEndpoint(isExpanded ? null : endpoint.name)}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#60a5fa',
                          padding: '8px 12px',
                          border: '1px solid #60a5fa',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </button>
                    )}
                    <button
                      onClick={() => runTest(endpoint)}
                      disabled={isLoading}
                      style={{
                        backgroundColor: isLoading ? '#374151' : '#10b981',
                        color: '#fff',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {isLoading ? 'Loading...' : 'Test'}
                    </button>
                  </div>
                </div>

                {/* Result summary */}
                {result && !isExpanded && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #334155' }}>
                    {hasError ? (
                      <span style={{ color: '#f87171', fontSize: '13px' }}>
                        Error: {typeof result.error === 'string' ? result.error : JSON.stringify(result.error)}
                      </span>
                    ) : (
                      <span style={{ color: '#6ee7b7', fontSize: '13px' }}>
                        {result.count !== undefined ? `${result.count} items` : 'Success'}
                        {result.season && ` (${result.season} season)`}
                      </span>
                    )}
                  </div>
                )}

                {/* Expanded result */}
                {result && isExpanded && (
                  <div style={{ 
                    padding: '16px', 
                    borderTop: '1px solid #334155',
                    maxHeight: '400px',
                    overflow: 'auto',
                  }}>
                    {/* Quick stats for certain endpoints */}
                    {endpoint.name === 'Projections' && result.data && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                          TOP PROJECTED PLAYERS
                        </h4>
                        <div style={{ display: 'grid', gap: '4px' }}>
                          {(result.data as Player[]).slice(0, 10).map((p, i) => (
                            <div key={i} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              fontSize: '13px',
                              padding: '4px 8px',
                              backgroundColor: i % 2 === 0 ? '#263548' : 'transparent',
                              borderRadius: '4px',
                            }}>
                              <span>
                                <span style={{ color: '#64748b', marginRight: '8px' }}>{i + 1}.</span>
                                <span style={{ color: '#f1f5f9' }}>{p.Name || p.name}</span>
                                <span style={{ 
                                  color: getPositionColor(p.Position || p.position),
                                  marginLeft: '8px',
                                  fontSize: '11px'
                                }}>
                                  {p.Position || p.position}
                                </span>
                              </span>
                              <span style={{ color: '#22c55e' }}>
                                {((p.FantasyPointsPPR || p.fantasyPointsPPR || 0) as number).toFixed(1)} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {endpoint.name === 'Live Scores' && result.data && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                          WEEK {result.week} GAMES ({result.summary?.live || 0} live, {result.summary?.final || 0} final)
                        </h4>
                        <div style={{ display: 'grid', gap: '8px' }}>
                          {(result.data as Game[]).slice(0, 8).map((g, i) => (
                            <div key={i} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '13px',
                              padding: '8px 12px',
                              backgroundColor: g.isLive ? '#1e3a5f' : '#263548',
                              borderRadius: '6px',
                              border: g.isLive ? '1px solid #3b82f6' : 'none',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ 
                                  color: g.isLive ? '#22c55e' : g.isFinal ? '#94a3b8' : '#fbbf24',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  padding: '2px 6px',
                                  backgroundColor: g.isLive ? '#14532d' : g.isFinal ? '#374151' : '#78350f',
                                  borderRadius: '4px',
                                }}>
                                  {g.isLive ? (g.quarter || 'LIVE') : g.isFinal ? 'FINAL' : 'SCHED'}
                                </span>
                                <span style={{ color: '#f1f5f9' }}>
                                  {g.awayTeam} @ {g.homeTeam}
                                </span>
                              </div>
                              <div style={{ color: '#22c55e', fontWeight: 600 }}>
                                {g.awayScore ?? '-'} - {g.homeScore ?? '-'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {endpoint.name === 'Fantasy ADP' && result.data && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                          ADP RANKINGS ({(result.scoringType as string)?.toUpperCase() || 'PPR'})
                        </h4>
                        <div style={{ display: 'grid', gap: '4px' }}>
                          {(result.data as Player[]).slice(0, 12).map((p, i) => (
                            <div key={i} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              fontSize: '13px',
                              padding: '4px 8px',
                              backgroundColor: i % 2 === 0 ? '#263548' : 'transparent',
                              borderRadius: '4px',
                            }}>
                              <span>
                                <span style={{ 
                                  color: '#fbbf24', 
                                  marginRight: '8px',
                                  minWidth: '36px',
                                  display: 'inline-block',
                                }}>
                                  {((p.adpPPR || p.adp || 0) as number).toFixed(1)}
                                </span>
                                <span style={{ color: '#f1f5f9' }}>{p.name}</span>
                                <span style={{ 
                                  color: getPositionColor(p.position),
                                  marginLeft: '8px',
                                  fontSize: '11px'
                                }}>
                                  {p.position}
                                </span>
                              </span>
                              <span style={{ color: '#64748b', fontSize: '11px' }}>
                                {p.team} | Bye {p.byeWeek}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {endpoint.name === 'Fantasy Rankings' && result.data && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                          FANTASY RANKINGS
                        </h4>
                        <div style={{ display: 'grid', gap: '4px' }}>
                          {(result.data as Player[]).slice(0, 12).map((p, i) => (
                            <div key={i} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              fontSize: '13px',
                              padding: '4px 8px',
                              backgroundColor: i % 2 === 0 ? '#263548' : 'transparent',
                              borderRadius: '4px',
                            }}>
                              <span>
                                <span style={{ color: '#64748b', marginRight: '8px' }}>
                                  #{p.overallRank || i + 1}
                                </span>
                                <span style={{ color: '#f1f5f9' }}>{p.name}</span>
                                <span style={{ 
                                  color: getPositionColor(p.position),
                                  marginLeft: '8px',
                                  fontSize: '11px'
                                }}>
                                  {p.position}{p.positionRank}
                                </span>
                              </span>
                              <span>
                                <span style={{ color: '#fbbf24', marginRight: '12px', fontSize: '11px' }}>
                                  ADP: {((p.adpPPR || p.adp || 0) as number).toFixed(1)}
                                </span>
                                <span style={{ color: '#22c55e' }}>
                                  {((p.projectedPointsPPR || p.projectedPoints || 0) as number).toFixed(0)} pts
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {endpoint.name === 'Season Stats' && result.data && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                          TOP FANTASY PERFORMERS ({result.season} SEASON)
                        </h4>
                        <div style={{ display: 'grid', gap: '4px' }}>
                          {(result.data as Player[]).slice(0, 10).map((p, i) => (
                            <div key={i} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              fontSize: '13px',
                              padding: '4px 8px',
                              backgroundColor: i % 2 === 0 ? '#263548' : 'transparent',
                              borderRadius: '4px',
                            }}>
                              <span>
                                <span style={{ color: '#64748b', marginRight: '8px' }}>{i + 1}.</span>
                                <span style={{ color: '#f1f5f9' }}>{p.name}</span>
                                <span style={{ 
                                  color: getPositionColor(p.position),
                                  marginLeft: '8px',
                                  fontSize: '11px'
                                }}>
                                  {p.position}
                                </span>
                                <span style={{ color: '#64748b', marginLeft: '8px', fontSize: '11px' }}>
                                  {p.games} GP
                                </span>
                              </span>
                              <span style={{ color: '#22c55e', fontWeight: 600 }}>
                                {((p.fantasyPointsPPR || 0) as number).toFixed(1)} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {endpoint.name === 'Red Zone Stats' && result.data && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                          RED ZONE LEADERS ({result.season})
                        </h4>
                        <div style={{ display: 'grid', gap: '4px' }}>
                          {(result.data as Player[]).slice(0, 10).map((p, i) => (
                            <div key={i} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              fontSize: '13px',
                              padding: '4px 8px',
                              backgroundColor: i % 2 === 0 ? '#263548' : 'transparent',
                              borderRadius: '4px',
                            }}>
                              <span>
                                <span style={{ color: '#64748b', marginRight: '8px' }}>{i + 1}.</span>
                                <span style={{ color: '#f1f5f9' }}>{p.name}</span>
                                <span style={{ 
                                  color: getPositionColor(p.position),
                                  marginLeft: '8px',
                                  fontSize: '11px'
                                }}>
                                  {p.position}
                                </span>
                              </span>
                              <span>
                                <span style={{ color: '#fbbf24', marginRight: '12px' }}>
                                  {p.totalOpportunities} opps
                                </span>
                                <span style={{ color: '#22c55e', fontWeight: 600 }}>
                                  {p.totalTouchdowns} TDs
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {endpoint.name === 'Live Fantasy' && result.data && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                          TOP FANTASY PERFORMERS (WEEK {result.week})
                        </h4>
                        <div style={{ display: 'grid', gap: '4px' }}>
                          {(result.data as Player[]).slice(0, 10).map((p, i) => (
                            <div key={i} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              fontSize: '13px',
                              padding: '4px 8px',
                              backgroundColor: i % 2 === 0 ? '#263548' : 'transparent',
                              borderRadius: '4px',
                            }}>
                              <span>
                                <span style={{ color: '#64748b', marginRight: '8px' }}>{i + 1}.</span>
                                <span style={{ color: '#f1f5f9' }}>{p.name}</span>
                                <span style={{ 
                                  color: getPositionColor(p.position),
                                  marginLeft: '8px',
                                  fontSize: '11px'
                                }}>
                                  {p.position}
                                </span>
                                <span style={{ color: '#64748b', marginLeft: '8px', fontSize: '11px' }}>
                                  vs {p.opponent}
                                </span>
                              </span>
                              <span style={{ color: '#22c55e', fontWeight: 600 }}>
                                {((p.fantasyPointsPPR || 0) as number).toFixed(1)} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {endpoint.name === 'Teams' && result.data && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                          NFL TEAMS ({result.count})
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                          {(result.data as Team[]).slice(0, 16).map((t, i) => (
                            <div key={i} style={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '12px',
                              padding: '6px 8px',
                              backgroundColor: '#263548',
                              borderRadius: '6px',
                              borderLeft: `3px solid ${t.colors?.primary || '#64748b'}`,
                            }}>
                              <span style={{ 
                                color: t.colors?.primary || '#f1f5f9',
                                fontWeight: 700,
                                minWidth: '28px',
                              }}>
                                {t.key}
                              </span>
                              <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                                {t.name}
                              </span>
                            </div>
                          ))}
                        </div>
                        {(result.data as Team[])[0] && (
                          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#1e293b', borderRadius: '6px' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                              <span>Sample: {String((result.data as Team[])[0]?.fullName || 'N/A')}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                              <span>Coach: {String((result.data as Team[])[0]?.headCoach || 'N/A')} | </span>
                              <span>Stadium: {String((result.data as Team[])[0]?.stadium?.name || 'N/A')} | </span>
                              <span>Bye: Week {String((result.data as Team[])[0]?.byeWeek || 'N/A')}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {endpoint.name === 'Headshots' && result.data && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                          PLAYER HEADSHOTS
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          {(result.data as Player[]).slice(0, 8).map((p, i) => (
                            <div key={i} style={{ 
                              textAlign: 'center',
                              backgroundColor: '#263548',
                              borderRadius: '8px',
                              padding: '8px',
                              width: '100px',
                            }}>
                              {p.headshotUrl && (
                                <Image
                                  src={p.headshotUrl}
                                  alt={p.name || 'Player'}
                                  width={80}
                                  height={80}
                                  style={{
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    backgroundColor: '#1e293b',
                                  }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                  unoptimized
                                />
                              )}
                              <div style={{ 
                                fontSize: '11px', 
                                color: '#f1f5f9',
                                marginTop: '4px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {p.name}
                              </div>
                              <div style={{ 
                                fontSize: '10px', 
                                color: '#64748b',
                              }}>
                                {p.team} #{p.number}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {endpoint.name === 'Cache Status' && result.caches && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                          CACHE STATUS
                        </h4>
                        <div style={{ display: 'grid', gap: '4px' }}>
                          {Object.entries(result.caches).map(([key, cache]) => (
                            <div key={key} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              fontSize: '13px',
                              padding: '4px 8px',
                              backgroundColor: '#263548',
                              borderRadius: '4px',
                            }}>
                              <span style={{ color: '#f1f5f9' }}>{key}</span>
                              <span style={{ 
                                color: cache.isValid ? '#22c55e' : cache.exists ? '#f59e0b' : '#64748b'
                              }}>
                                {cache.exists 
                                  ? cache.isValid 
                                    ? `Valid (${cache.ageMinutes}m old, ${cache.itemCount || 0} items)`
                                    : `Expired (${cache.ageMinutes}m old)`
                                  : 'Not cached'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw JSON */}
                    <details>
                      <summary style={{ 
                        cursor: 'pointer', 
                        color: '#60a5fa', 
                        fontSize: '12px',
                        marginBottom: '8px'
                      }}>
                        View raw JSON
                      </summary>
                      <pre style={{ 
                        whiteSpace: 'pre-wrap', 
                        wordBreak: 'break-word',
                        color: '#94a3b8',
                        fontSize: '11px',
                        backgroundColor: '#0f172a',
                        padding: '12px',
                        borderRadius: '6px',
                        maxHeight: '300px',
                        overflow: 'auto',
                      }}>
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '32px', 
          padding: '16px', 
          backgroundColor: '#1e293b', 
          borderRadius: '8px',
          fontSize: '13px',
          color: '#94a3b8'
        }}>
          <strong style={{ color: '#f1f5f9' }}>Available Endpoints:</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong>Fantasy & ADP:</strong></li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/fantasy</code> - Fantasy overview</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/fantasy/adp</code> - Average Draft Position (6h)</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/fantasy/rankings</code> - Fantasy rankings (6h)</li>
            <li><strong>Live Scores:</strong></li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/current-week</code> - Current season/week info</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/scores</code> - All game scores (10s cache)</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/live</code> - Games in progress only</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/fantasy-live</code> - Live fantasy points</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/game/[id]</code> - Single game box score</li>
            <li><strong>Player Data & Stats:</strong></li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/projections</code> - Season projections (24h)</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/stats/season</code> - Season stats (6h)</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/stats/weekly</code> - Weekly stats (1h)</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/stats/redzone</code> - Red zone stats (6h)</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/stats/player?name=X</code> - Single player stats</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/players</code> - All players (24h)</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/headshots</code> - Headshot URLs (7d)</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/player/[id]</code> - Single player</li>
            <li><strong>Schedule & Teams:</strong></li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/schedule</code> - Game schedule (24h)</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/teams</code> - Team info (24h)</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/bye-weeks</code> - Bye weeks (24h)</li>
            <li><strong>Injuries & News:</strong></li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/injuries</code> - Current injuries (1h)</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/depth-charts</code> - Depth charts (6h)</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/news</code> - Latest news (15min)</li>
            <li style={{ marginLeft: '16px' }}><code>/api/nfl/cache-status</code> - Cache management</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
