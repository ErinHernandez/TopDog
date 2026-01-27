/**
 * Playoff Teams Sandbox
 * 
 * Development sandbox for playoff team tab features.
 * Provides scenario switching, mock data, and debugging tools.
 */

import React, { useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { 
  generatePlayoffPod,
  generateMultiplePods,
  SCENARIO_DESCRIPTIONS,
  ALL_SCENARIOS,
  PRECONFIGURED_SCENARIOS,
  getScenarioPods,
  type PlayoffPod,
  type ScenarioType,
} from '../../lib/mockData/playoffScenarios';
import type { PlayoffTeam } from '../../lib/mockData/playoffTeams';
import { PlayoffPodList, PlayoffPodDetail, MatchupDetailView } from '../../components/vx2/tabs/my-teams/playoff';

// ============================================================================
// STYLES
// ============================================================================

const COLORS = {
  bg: {
    primary: '#0a0f1a',
    secondary: '#101927',
    tertiary: '#1a2435',
    accent: '#1e3a5f',
  },
  text: {
    primary: '#ffffff',
    secondary: '#94a3b8',
    muted: '#64748b',
  },
  position: {
    QB: '#F472B6',
    RB: '#0fba80',
    WR: '#FBBF25',
    TE: '#7C3AED',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
};

// ============================================================================
// COMPONENTS
// ============================================================================

interface ScenarioSwitcherProps {
  selectedScenario: ScenarioType;
  selectedWeek: 15 | 16 | 17;
  onScenarioChange: (scenario: ScenarioType) => void;
  onWeekChange: (week: 15 | 16 | 17) => void;
  onRefresh: () => void;
}

function ScenarioSwitcher({ 
  selectedScenario, 
  selectedWeek, 
  onScenarioChange, 
  onWeekChange,
  onRefresh,
}: ScenarioSwitcherProps) {
  return (
    <div
      style={{
        backgroundColor: COLORS.bg.secondary,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Scenario Selector */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label 
            style={{ 
              display: 'block', 
              color: COLORS.text.secondary, 
              fontSize: '12px', 
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Scenario
          </label>
          <select
            value={selectedScenario}
            onChange={(e) => onScenarioChange(e.target.value as ScenarioType)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: COLORS.bg.tertiary,
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: COLORS.text.primary,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {ALL_SCENARIOS.map((scenario) => (
              <option key={scenario} value={scenario}>
                {scenario.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Week Selector */}
        <div style={{ minWidth: '120px' }}>
          <label 
            style={{ 
              display: 'block', 
              color: COLORS.text.secondary, 
              fontSize: '12px', 
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Week
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {([15, 16, 17] as const).map((week) => (
              <button
                key={week}
                onClick={() => onWeekChange(week)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: selectedWeek === week ? COLORS.bg.accent : COLORS.bg.tertiary,
                  border: selectedWeek === week ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: COLORS.text.primary,
                  fontSize: '14px',
                  fontWeight: selectedWeek === week ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {week}
              </button>
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={onRefresh}
            style={{
              padding: '10px 20px',
              backgroundColor: COLORS.status.success,
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Regenerate
          </button>
        </div>
      </div>

      {/* Scenario Description */}
      <div 
        style={{ 
          marginTop: '12px', 
          padding: '10px', 
          backgroundColor: COLORS.bg.tertiary, 
          borderRadius: '6px',
          color: COLORS.text.secondary,
          fontSize: '13px',
        }}
      >
        {SCENARIO_DESCRIPTIONS[selectedScenario]}
      </div>
    </div>
  );
}

interface PodStandingsProps {
  pod: PlayoffPod;
}

function PodStandings({ pod }: PodStandingsProps) {
  return (
    <div
      style={{
        backgroundColor: COLORS.bg.secondary,
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h3 style={{ color: COLORS.text.primary, fontSize: '18px', fontWeight: 700, margin: 0 }}>
            {pod.name}
          </h3>
          <p style={{ color: COLORS.text.muted, fontSize: '12px', margin: '4px 0 0' }}>
            {pod.room} - Week {pod.week} - Top {pod.advancementCriteria.replace('top', '')} advance
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: COLORS.text.secondary, fontSize: '12px' }}>
            {pod.teams.length} teams
          </div>
        </div>
      </div>

      {/* Standings Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: COLORS.bg.tertiary }}>
              <th style={{ ...thStyle, width: '40px' }}>Rank</th>
              <th style={{ ...thStyle, textAlign: 'left' }}>Team</th>
              <th style={{ ...thStyle, width: '100px' }}>Current Pts</th>
              <th style={{ ...thStyle, width: '100px' }}>Best Case</th>
              <th style={{ ...thStyle, width: '80px' }}>BC Rank</th>
            </tr>
          </thead>
          <tbody>
            {pod.teams.map((team, index) => {
              const isUserTeam = team.isUserTeam;
              const inAdvancementZone = index < parseInt(pod.advancementCriteria.replace('top', ''));
              
              return (
                <tr 
                  key={team.id}
                  style={{ 
                    backgroundColor: isUserTeam ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: inAdvancementZone ? COLORS.status.success : COLORS.bg.tertiary,
                        color: COLORS.text.primary,
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {team.rank}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isUserTeam && (
                        <span
                          style={{
                            padding: '2px 6px',
                            backgroundColor: '#3b82f6',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: '#ffffff',
                          }}
                        >
                          YOU
                        </span>
                      )}
                      <span style={{ color: isUserTeam ? '#ffffff' : COLORS.text.secondary }}>
                        {team.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                    {team.currentPoints.toFixed(1)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                    {team.bestCaseTotal.toFixed(1)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span
                      style={{
                        color: team.bestCaseRank <= 2 ? COLORS.status.success : 
                               team.bestCaseRank <= 4 ? COLORS.status.warning : COLORS.text.muted,
                      }}
                    >
                      #{team.bestCaseRank}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface DebugPanelProps {
  pod: PlayoffPod;
  isOpen: boolean;
  onToggle: () => void;
}

function DebugPanel({ pod, isOpen, onToggle }: DebugPanelProps) {
  return (
    <div
      style={{
        backgroundColor: COLORS.bg.secondary,
        borderRadius: '12px',
        overflow: 'hidden',
        marginTop: '16px',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: 'transparent',
          border: 'none',
          borderBottom: isOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
          color: COLORS.text.secondary,
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Debug Panel</span>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </button>
      
      {isOpen && (
        <div style={{ padding: '16px' }}>
          <pre
            style={{
              backgroundColor: COLORS.bg.tertiary,
              padding: '12px',
              borderRadius: '8px',
              overflow: 'auto',
              maxHeight: '400px',
              fontSize: '11px',
              color: COLORS.text.secondary,
              margin: 0,
            }}
          >
            {JSON.stringify(pod, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  color: COLORS.text.muted,
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  textAlign: 'center',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  color: COLORS.text.primary,
  fontSize: '14px',
};

// ============================================================================
// MAIN PAGE
// ============================================================================

type ViewMode = 'data' | 'podList' | 'podDetail' | 'matchup';

export default function PlayoffTeamsSandbox() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('default');
  const [selectedWeek, setSelectedWeek] = useState<15 | 16 | 17>(15);
  const [refreshKey, setRefreshKey] = useState(0);
  const [debugOpen, setDebugOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('data');
  const [selectedPod, setSelectedPod] = useState<PlayoffPod | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<PlayoffTeam | null>(null);
  const [podCount, setPodCount] = useState(3);

  const pod = useMemo(() => {
    return generatePlayoffPod(selectedScenario, selectedWeek);
  }, [selectedScenario, selectedWeek, refreshKey]);

  // Generate multiple pods for list view
  const pods = useMemo(() => {
    return generateMultiplePods(podCount, selectedScenario, selectedWeek);
  }, [podCount, selectedScenario, selectedWeek, refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    setSelectedPod(null);
    setSelectedOpponent(null);
  }, []);

  const handleSelectPod = useCallback((pod: PlayoffPod) => {
    setSelectedPod(pod);
    setViewMode('podDetail');
  }, []);

  const handleSelectTeam = useCallback((_team: PlayoffTeam, _pod: PlayoffPod) => {
    // Team selection handler - no-op for sandbox testing
  }, []);

  const handleSelectOpponent = useCallback((opponent: PlayoffTeam) => {
    setSelectedOpponent(opponent);
    setViewMode('matchup');
  }, []);

  const handleNavigateOpponent = useCallback((opponent: PlayoffTeam) => {
    setSelectedOpponent(opponent);
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedPod(null);
    setViewMode('podList');
  }, []);

  const handleBackFromMatchup = useCallback(() => {
    setSelectedOpponent(null);
    setViewMode('podDetail');
  }, []);

  return (
    <>
      <Head>
        <title>Playoff Teams Sandbox | TopDog</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: COLORS.bg.primary,
        }}
      >
        {/* View Mode: Pod List Component */}
        {viewMode === 'podList' && (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setViewMode('data')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: COLORS.bg.secondary,
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: COLORS.text.secondary,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Back to Data View
              </button>
            </div>
            <PlayoffPodList
              pods={pods}
              onSelectPod={handleSelectPod}
              onSelectTeam={handleSelectTeam}
            />
          </div>
        )}

        {/* View Mode: Pod Detail Component */}
        {viewMode === 'podDetail' && selectedPod && (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <PlayoffPodDetail
              pod={selectedPod}
              onBack={handleBackFromDetail}
              onSelectOpponent={handleSelectOpponent}
            />
          </div>
        )}

        {/* View Mode: Matchup Detail Component */}
        {viewMode === 'matchup' && selectedPod && selectedOpponent && (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <MatchupDetailView
              pod={selectedPod}
              opponent={selectedOpponent}
              onBack={handleBackFromMatchup}
              onNavigateOpponent={handleNavigateOpponent}
            />
          </div>
        )}

        {/* View Mode: Data View (Default) */}
        {viewMode === 'data' && (
          <div style={{ padding: '24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              {/* Header */}
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ color: COLORS.text.primary, fontSize: '28px', fontWeight: 700, margin: 0 }}>
                  Playoff Teams Sandbox
                </h1>
                <p style={{ color: COLORS.text.secondary, fontSize: '14px', margin: '8px 0 0' }}>
                  Development environment for playoff team tab features
                </p>
              </div>

              {/* View Mode Switcher */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <button
                  onClick={() => setViewMode('podList')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: COLORS.status.success,
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Test Pod List Component
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                  <span style={{ color: COLORS.text.muted, fontSize: '13px' }}>Pods:</span>
                  <select
                    value={podCount}
                    onChange={(e) => setPodCount(parseInt(e.target.value))}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: COLORS.bg.tertiary,
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: COLORS.text.primary,
                      fontSize: '13px',
                    }}
                  >
                    {[1, 2, 3, 5, 10].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scenario Switcher */}
              <ScenarioSwitcher
                selectedScenario={selectedScenario}
                selectedWeek={selectedWeek}
                onScenarioChange={setSelectedScenario}
                onWeekChange={setSelectedWeek}
                onRefresh={handleRefresh}
              />

              {/* Pod Standings */}
              <PodStandings pod={pod} />

              {/* Debug Panel */}
              <DebugPanel 
                pod={pod} 
                isOpen={debugOpen} 
                onToggle={() => setDebugOpen(!debugOpen)} 
              />

              {/* Quick Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginTop: '16px',
                }}
              >
                <StatCard 
                  label="User Team Rank" 
                  value={`#${pod.userTeam.rank}`}
                  color={pod.userTeam.rank <= 2 ? COLORS.status.success : COLORS.text.primary}
                />
                <StatCard 
                  label="User Current Points" 
                  value={pod.userTeam.currentPoints.toFixed(1)}
                />
                <StatCard 
                  label="User Best Case" 
                  value={pod.userTeam.bestCaseTotal.toFixed(1)}
                />
                <StatCard 
                  label="Best Case Rank" 
                  value={`#${pod.userTeam.bestCaseRank}`}
                  color={pod.userTeam.bestCaseRank <= 2 ? COLORS.status.success : 
                         pod.userTeam.bestCaseRank <= 4 ? COLORS.status.warning : COLORS.status.danger}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  color?: string;
}

function StatCard({ label, value, color = COLORS.text.primary }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: COLORS.bg.secondary,
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <div style={{ color: COLORS.text.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ color, fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>
        {value}
      </div>
    </div>
  );
}

