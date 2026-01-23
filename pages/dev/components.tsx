/**
 * Component Sandbox - Development playground for shared components
 * 
 * Use this page to:
 * - Preview components in isolation
 * - Test different props and states
 * - Develop new components before integrating
 * 
 * URL: /dev/components
 */

import React, { useState } from 'react';
import { PlayerExpandedCard } from '../../components/ui';

// Position colors for reference
const POSITION_COLORS: Record<string, string> = {
  QB: '#F472B6',
  RB: '#0fba80',
  WR: '#4285F4',
  TE: '#7C3AED',
};

interface PlayerStats {
  projected?: {
    carries?: number;
    rushYards?: number;
    rushAvg?: number;
    rushTD?: number;
    long?: number;
    fumbles?: number;
    receptions?: number;
  };
  current?: {
    year?: string;
    carries?: number;
    rushYards?: number;
    rushAvg?: number;
    rushTD?: number;
    long?: number;
    fumbles?: number;
    receptions?: number;
  };
  history?: Array<{
    year: string;
    carries: string | number;
    rushYards: string | number;
    rushAvg: string | number;
    rushTD: string | number;
    long: string | number;
    fumbles: string | number;
    receptions: string | number;
  }>;
}

interface SamplePlayer {
  name: string;
  team: string;
  position: string;
  byeWeek: number;
  adp: number;
  proj: number;
  photoUrl: string | null;
  stats: PlayerStats;
}

// Sample player data for testing
const SAMPLE_PLAYERS: Record<string, SamplePlayer> = {
  rb: {
    name: 'Bijan Robinson',
    team: 'ATL',
    position: 'RB',
    byeWeek: 12,
    adp: 2.8,
    proj: 166,
    photoUrl: null,
    stats: {
      projected: {
        carries: 180,
        rushYards: 850,
        rushAvg: 4.7,
        rushTD: 8,
        long: 45,
        fumbles: 2,
        receptions: 45,
      },
      current: {
        year: '2025',
        carries: 180,
        rushYards: 850,
        rushAvg: 4.7,
        rushTD: 8,
        long: 45,
        fumbles: 2,
        receptions: 45,
      },
      history: [
        { year: '2024', carries: '-', rushYards: '-', rushAvg: '-', rushTD: '-', long: '-', fumbles: '-', receptions: '-' },
        { year: '2023', carries: '-', rushYards: '-', rushAvg: '-', rushTD: '-', long: '-', fumbles: '-', receptions: '-' },
      ],
    },
  },
  qb: {
    name: 'Josh Allen',
    team: 'BUF',
    position: 'QB',
    byeWeek: 12,
    adp: 15.2,
    proj: 385,
    photoUrl: null,
    stats: {
      projected: {
        carries: 120,
        rushYards: 650,
        rushAvg: 5.4,
        rushTD: 6,
        long: 52,
        fumbles: 5,
        receptions: 0,
      },
      current: {
        year: '2025',
        carries: 120,
        rushYards: 650,
        rushAvg: 5.4,
        rushTD: 6,
        long: 52,
        fumbles: 5,
        receptions: 0,
      },
      history: [
        { year: '2024', carries: 111, rushYards: 531, rushAvg: 4.8, rushTD: 7, long: 41, fumbles: 6, receptions: 0 },
        { year: '2023', carries: 98, rushYards: 524, rushAvg: 5.3, rushTD: 5, long: 36, fumbles: 4, receptions: 0 },
      ],
    },
  },
  wr: {
    name: 'Amon-Ra St. Brown',
    team: 'DET',
    position: 'WR',
    byeWeek: 5,
    adp: 4.1,
    proj: 165,
    photoUrl: null,
    stats: {
      projected: {
        carries: 8,
        rushYards: 42,
        rushAvg: 5.3,
        rushTD: 0,
        long: 18,
        fumbles: 1,
        receptions: 119,
      },
    },
  },
  te: {
    name: 'Sam LaPorta',
    team: 'DET',
    position: 'TE',
    byeWeek: 5,
    adp: 32.5,
    proj: 142,
    photoUrl: null,
    stats: {
      projected: {
        carries: 0,
        rushYards: 0,
        rushAvg: 0,
        rushTD: 0,
        long: 0,
        fumbles: 0,
        receptions: 86,
      },
    },
  },
};

interface Component {
  id: string;
  name: string;
  description: string;
}

interface PropDocProps {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

export default function ComponentSandbox() {
  const [selectedComponent, setSelectedComponent] = useState<string>('PlayerExpandedCard');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('rb');
  const [showDraftButton, setShowDraftButton] = useState(true);
  const [darkBg, setDarkBg] = useState(true);

  const components: Component[] = [
    { id: 'PlayerExpandedCard', name: 'Player Expanded Card', description: 'Stats dropdown with team logo, badges, and year-by-year stats' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0f1a',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '24px 32px',
        borderBottom: '1px solid #1e293b',
        position: 'sticky',
        top: 0,
        backgroundColor: '#0a0f1a',
        zIndex: 100,
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '4px', color: '#60a5fa' }}>
          Component Sandbox
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Develop and preview shared components in isolation
        </p>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 100px)' }}>
        {/* Sidebar - Component List */}
        <div style={{
          width: '240px',
          borderRight: '1px solid #1e293b',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', letterSpacing: '1px' }}>
            COMPONENTS
          </h3>
          {components.map(comp => (
            <button
              key={comp.id}
              onClick={() => setSelectedComponent(comp.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                marginBottom: '4px',
                backgroundColor: selectedComponent === comp.id ? '#1e293b' : 'transparent',
                border: selectedComponent === comp.id ? '1px solid #3b82f6' : '1px solid transparent',
                borderRadius: '6px',
                color: selectedComponent === comp.id ? '#f1f5f9' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {comp.name}
            </button>
          ))}

          <div style={{ marginTop: '32px' }}>
            <h3 style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', letterSpacing: '1px' }}>
              POSITION COLORS
            </h3>
            {Object.entries(POSITION_COLORS).map(([pos, color]) => (
              <div key={pos} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: color,
                  borderRadius: '4px',
                }} />
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{pos}</span>
                <code style={{ fontSize: '10px', color: '#64748b' }}>{color}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Controls */}
          <div style={{
            padding: '16px 24px',
            backgroundColor: '#0f172a',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            {/* Player Select */}
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                Sample Player
              </label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                style={{
                  backgroundColor: '#1e293b',
                  color: '#f1f5f9',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '13px',
                }}
              >
                <option value="rb">RB - Bijan Robinson</option>
                <option value="qb">QB - Josh Allen</option>
                <option value="wr">WR - Amon-Ra St. Brown</option>
                <option value="te">TE - Sam LaPorta</option>
              </select>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showDraftButton}
                  onChange={(e) => setShowDraftButton(e.target.checked)}
                />
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Draft Button</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={darkBg}
                  onChange={(e) => setDarkBg(e.target.checked)}
                />
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Dark Background</span>
              </label>
            </div>
          </div>

          {/* Preview Area */}
          <div style={{
            flex: 1,
            padding: '32px',
            backgroundColor: darkBg ? '#0f1724' : '#f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            overflow: 'auto',
          }}>
            <div style={{ 
              fontSize: '11px', 
              color: darkBg ? '#64748b' : '#475569', 
              marginBottom: '8px' 
            }}>
              PREVIEW
            </div>

            {/* PlayerExpandedCard Preview */}
            {selectedComponent === 'PlayerExpandedCard' && (
              <>
                {/* Mobile Frame */}
                <div style={{
                  width: '375px',
                  backgroundColor: darkBg ? '#0a0f1a' : '#fff',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                }}>
                  <PlayerExpandedCard
                    player={{
                      name: SAMPLE_PLAYERS[selectedPlayer].name,
                      team: SAMPLE_PLAYERS[selectedPlayer].team,
                      position: SAMPLE_PLAYERS[selectedPlayer].position,
                      adp: SAMPLE_PLAYERS[selectedPlayer].adp,
                      proj: SAMPLE_PLAYERS[selectedPlayer].proj?.toString() || null,
                      projectedPoints: SAMPLE_PLAYERS[selectedPlayer].proj,
                    }}
                    isMyTurn={showDraftButton}
                    onDraft={(p) => alert(`Draft: ${p.name}`)}
                  />
                </div>

                {/* All Positions Preview */}
                <div style={{ 
                  fontSize: '11px', 
                  color: darkBg ? '#64748b' : '#475569', 
                  marginTop: '24px',
                  marginBottom: '8px' 
                }}>
                  ALL POSITIONS
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {Object.entries(SAMPLE_PLAYERS).map(([key, player]) => (
                    <div key={key} style={{
                      width: '375px',
                      backgroundColor: darkBg ? '#0a0f1a' : '#fff',
                      borderRadius: '16px',
                      padding: '12px',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                    }}>
                      <div style={{ 
                        fontSize: '11px', 
                        color: darkBg ? '#64748b' : '#475569', 
                        marginBottom: '8px',
                        fontWeight: 600,
                      }}>
                        {player.position} - {player.name}
                      </div>
                      <PlayerExpandedCard
                        player={{
                          name: player.name,
                          team: player.team,
                          position: player.position,
                          adp: player.adp,
                          proj: player.proj?.toString() || null,
                          projectedPoints: player.proj,
                        }}
                        isMyTurn={false}
                        onDraft={(p) => alert(`Draft: ${p.name}`)}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        </div>

        {/* Right Panel - Code/Props */}
        <div style={{
          width: '320px',
          borderLeft: '1px solid #1e293b',
          padding: '20px',
          overflow: 'auto',
        }}>
          <h3 style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', letterSpacing: '1px' }}>
            PROPS
          </h3>
          
          {selectedComponent === 'PlayerExpandedCard' && (
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              <PropDoc name="player" type="object" required description="Player data object" />
              <PropDoc name="onDraft" type="function" description="Callback when draft button clicked" />
              <PropDoc name="onClose" type="function" description="Callback when card is clicked to close" />
              <PropDoc name="isMyTurn" type="boolean" description="Highlights draft button red when true" />
              <PropDoc name="style" type="object" description="Custom styles to merge" />
            </div>
          )}


          <h3 style={{ fontSize: '12px', color: '#64748b', marginTop: '24px', marginBottom: '12px', letterSpacing: '1px' }}>
            USAGE
          </h3>
          
          {selectedComponent === 'PlayerExpandedCard' && (
            <pre style={{
              backgroundColor: '#0f172a',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '10px',
              color: '#a5f3fc',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}>
{`import PlayerExpandedCard from 
  '@/components/shared/PlayerExpandedCard';

<PlayerExpandedCard
  player={{
    name: 'CeeDee Lamb',
    team: 'DAL',
    position: 'WR',
    adp: 22.1,
    projectedPoints: 185.5,
  }}
  isMyTurn={true}
  onDraft={(p) => handleDraft(p)}
  onClose={() => setExpanded(false)}
/>`}
            </pre>
          )}


          <h3 style={{ fontSize: '12px', color: '#64748b', marginTop: '24px', marginBottom: '12px', letterSpacing: '1px' }}>
            FILE LOCATION
          </h3>
          <code style={{
            display: 'block',
            backgroundColor: '#0f172a',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '10px',
            color: '#60a5fa',
            wordBreak: 'break-all',
          }}>
            components/shared/PlayerExpandedCard/PlayerExpandedCard.js
          </code>

          {selectedComponent === 'PlayerExpandedCard' && (
            <>
              <h3 style={{ fontSize: '12px', color: '#64748b', marginTop: '24px', marginBottom: '12px', letterSpacing: '1px' }}>
                FEATURES
              </h3>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                <ul style={{ paddingLeft: '16px', margin: 0 }}>
                  <li>Team logo (from /logos/nfl/)</li>
                  <li>Bye / ADP / Proj badges</li>
                  <li>DRAFT button (red when isMyTurn)</li>
                  <li>Team gradient background</li>
                  <li>Position-specific stats tables:</li>
                  <ul style={{ paddingLeft: '16px' }}>
                    <li><strong>QB:</strong> CMP, ATT, YDS, CMP%, AVG, TD, INT, LNG, SACK + rushing</li>
                    <li><strong>RB:</strong> CAR, YDS, AVG, TD, LNG, FUM + receiving</li>
                    <li><strong>WR/TE:</strong> REC, TGTS, YDS, AVG, TD, LNG, FD + rushing</li>
                  </ul>
                </ul>
              </div>
              
              <h3 style={{ fontSize: '12px', color: '#64748b', marginTop: '24px', marginBottom: '12px', letterSpacing: '1px' }}>
                ORIGINAL SOURCE
              </h3>
              <code style={{
                display: 'block',
                backgroundColor: '#0f172a',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '9px',
                color: '#60a5fa',
                wordBreak: 'break-all',
              }}>
                components/draft/v3/mobile/apple/components/PlayerListApple.js (lines 832-1384)
              </code>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Prop documentation component
function PropDoc({ name, type, required, description }: PropDocProps) {
  return (
    <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <code style={{ color: '#f1f5f9', fontSize: '12px' }}>{name}</code>
        <span style={{ 
          fontSize: '10px', 
          color: '#64748b',
          backgroundColor: '#1e293b',
          padding: '2px 6px',
          borderRadius: '4px',
        }}>
          {type}
        </span>
        {required && (
          <span style={{ fontSize: '10px', color: '#f87171' }}>required</span>
        )}
      </div>
      <div style={{ fontSize: '11px', color: '#64748b' }}>{description}</div>
    </div>
  );
}
