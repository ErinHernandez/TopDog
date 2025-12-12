import { useState, useEffect } from 'react';

export default function DevGraphics() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [copiedText, setCopiedText] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/nfl/teams');
      const data = await res.json();
      if (data.ok) {
        setTeams(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const ColorSwatch = ({ color, label, size = 'normal' }) => {
    if (!color) return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        opacity: 0.4,
      }}>
        <div style={{
          width: size === 'large' ? '48px' : '32px',
          height: size === 'large' ? '48px' : '32px',
          backgroundColor: '#1e293b',
          borderRadius: '6px',
          border: '1px dashed #475569',
        }} />
        <div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{label}</div>
          <div style={{ fontSize: '12px', color: '#475569' }}>N/A</div>
        </div>
      </div>
    );

    return (
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          cursor: 'pointer',
        }}
        onClick={() => copyToClipboard(color, `${label}: ${color}`)}
        title="Click to copy"
      >
        <div style={{
          width: size === 'large' ? '48px' : '32px',
          height: size === 'large' ? '48px' : '32px',
          backgroundColor: color,
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }} />
        <div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{label}</div>
          <code style={{ 
            fontSize: '12px', 
            color: '#f1f5f9',
            backgroundColor: '#1e293b',
            padding: '2px 6px',
            borderRadius: '4px',
          }}>
            {color}
          </code>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0a0f1a', 
        color: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        Loading team graphics...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0a0f1a', 
        color: '#e2e8f0',
        padding: '40px',
      }}>
        <h1 style={{ color: '#f87171' }}>Error loading teams</h1>
        <p>{error}</p>
      </div>
    );
  }

  // Group teams by conference and division
  const grouped = teams.reduce((acc, team) => {
    const key = `${team.conference} ${team.division}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(team);
    return acc;
  }, {});

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0f1a', 
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{ 
        padding: '32px 40px',
        borderBottom: '1px solid #1e293b',
        position: 'sticky',
        top: 0,
        backgroundColor: '#0a0f1a',
        zIndex: 100,
      }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#60a5fa' }}>
          Dev Graphics - NFL Teams
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
          Team colors, logos, and visual assets for UI development. Click any color to copy.
        </p>
        
        {/* Quick copy notification */}
        {copiedText && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#22c55e',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            Copied: {copiedText}
          </div>
        )}

        {/* Division tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.keys(grouped).sort().map(division => (
            <button
              key={division}
              onClick={() => {
                document.getElementById(division.replace(' ', '-'))?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {division}
            </button>
          ))}
        </div>
      </div>

      {/* Teams Grid */}
      <div style={{ padding: '32px 40px' }}>
        {Object.entries(grouped).sort().map(([division, divTeams]) => (
          <div key={division} id={division.replace(' ', '-')} style={{ marginBottom: '48px' }}>
            <h2 style={{ 
              fontSize: '18px', 
              color: '#f1f5f9', 
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid #334155',
            }}>
              {division}
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: '20px',
            }}>
              {divTeams.map(team => (
                <div 
                  key={team.key}
                  style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: selectedTeam === team.key ? '2px solid #3b82f6' : '1px solid #334155',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedTeam(selectedTeam === team.key ? null : team.key)}
                >
                  {/* Team Header with gradient */}
                  <div style={{
                    background: team.colors?.primary 
                      ? `linear-gradient(135deg, ${team.colors.primary} 0%, ${team.colors.secondary || team.colors.primary} 100%)`
                      : '#374151',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}>
                    {/* Logo */}
                    {team.logoUrl && (
                      <img 
                        src={team.logoUrl} 
                        alt={team.name}
                        style={{ 
                          width: '48px', 
                          height: '48px',
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        }}
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    <div>
                      <div style={{ 
                        fontSize: '11px', 
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.7)',
                        letterSpacing: '1px',
                      }}>
                        {team.key}
                      </div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 700,
                        color: '#fff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      }}>
                        {team.fullName}
                      </div>
                    </div>
                  </div>

                  {/* Colors Section */}
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                    }}>
                      <ColorSwatch color={team.colors?.primary} label="Primary" />
                      <ColorSwatch color={team.colors?.secondary} label="Secondary" />
                      <ColorSwatch color={team.colors?.tertiary} label="Tertiary" />
                      <ColorSwatch color={team.colors?.quaternary} label="Quaternary" />
                    </div>

                    {/* Expanded details */}
                    {selectedTeam === team.key && (
                      <div style={{ 
                        marginTop: '16px', 
                        paddingTop: '16px',
                        borderTop: '1px solid #334155',
                      }}>
                        {/* Logo URLs */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                            Logo URL
                          </div>
                          <code 
                            style={{ 
                              fontSize: '10px', 
                              color: '#60a5fa',
                              backgroundColor: '#0f172a',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              display: 'block',
                              wordBreak: 'break-all',
                              cursor: 'pointer',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(team.logoUrl, 'Logo URL');
                            }}
                          >
                            {team.logoUrl || 'N/A'}
                          </code>
                        </div>

                        {team.wordmarkUrl && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                              Wordmark URL
                            </div>
                            <code 
                              style={{ 
                                fontSize: '10px', 
                                color: '#60a5fa',
                                backgroundColor: '#0f172a',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                display: 'block',
                                wordBreak: 'break-all',
                                cursor: 'pointer',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(team.wordmarkUrl, 'Wordmark URL');
                              }}
                            >
                              {team.wordmarkUrl}
                            </code>
                          </div>
                        )}

                        {/* CSS Variables snippet */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                            CSS Variables
                          </div>
                          <pre 
                            style={{ 
                              fontSize: '10px', 
                              color: '#a5f3fc',
                              backgroundColor: '#0f172a',
                              padding: '8px',
                              borderRadius: '4px',
                              margin: 0,
                              cursor: 'pointer',
                              overflow: 'auto',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const css = `--${team.key.toLowerCase()}-primary: ${team.colors?.primary || 'N/A'};
--${team.key.toLowerCase()}-secondary: ${team.colors?.secondary || 'N/A'};
--${team.key.toLowerCase()}-tertiary: ${team.colors?.tertiary || 'N/A'};`;
                              copyToClipboard(css, 'CSS Variables');
                            }}
                          >
{`--${team.key.toLowerCase()}-primary: ${team.colors?.primary || 'N/A'};
--${team.key.toLowerCase()}-secondary: ${team.colors?.secondary || 'N/A'};
--${team.key.toLowerCase()}-tertiary: ${team.colors?.tertiary || 'N/A'};`}
                          </pre>
                        </div>

                        {/* Stadium & Info */}
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr',
                          gap: '8px',
                          fontSize: '11px',
                        }}>
                          <div>
                            <span style={{ color: '#64748b' }}>Stadium: </span>
                            <span style={{ color: '#94a3b8' }}>{team.stadium?.name || 'N/A'}</span>
                          </div>
                          <div>
                            <span style={{ color: '#64748b' }}>Bye Week: </span>
                            <span style={{ color: '#94a3b8' }}>{team.byeWeek || 'N/A'}</span>
                          </div>
                          <div>
                            <span style={{ color: '#64748b' }}>Coach: </span>
                            <span style={{ color: '#94a3b8' }}>{team.headCoach || 'N/A'}</span>
                          </div>
                          <div>
                            <span style={{ color: '#64748b' }}>Scheme: </span>
                            <span style={{ color: '#94a3b8' }}>{team.offensiveScheme || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Color Reference Section */}
      <div style={{ 
        padding: '32px 40px',
        backgroundColor: '#0f172a',
        borderTop: '1px solid #1e293b',
      }}>
        <h2 style={{ fontSize: '18px', color: '#f1f5f9', marginBottom: '20px' }}>
          Quick Color Reference
        </h2>
        
        {/* All team colors in a compact grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '8px',
        }}>
          {teams.map(team => (
            <div 
              key={team.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                backgroundColor: '#1e293b',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              onClick={() => copyToClipboard(team.colors?.primary, `${team.key} primary`)}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                backgroundColor: team.colors?.primary || '#374151',
                border: '1px solid rgba(255,255,255,0.1)',
              }} />
              <div style={{ fontSize: '12px', color: '#f1f5f9', fontWeight: 600 }}>
                {team.key}
              </div>
            </div>
          ))}
        </div>

        {/* Export All Colors */}
        <div style={{ marginTop: '32px' }}>
          <button
            onClick={() => {
              const cssVars = teams.map(team => 
`  --team-${team.key.toLowerCase()}-primary: ${team.colors?.primary || '#000000'};
  --team-${team.key.toLowerCase()}-secondary: ${team.colors?.secondary || '#000000'};`
              ).join('\n');
              
              const fullCss = `:root {\n${cssVars}\n}`;
              copyToClipboard(fullCss, 'All team CSS variables');
            }}
            style={{
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Copy All Team Colors as CSS Variables
          </button>
        </div>
      </div>

      {/* Position Colors Reference */}
      <div style={{ 
        padding: '32px 40px',
        borderTop: '1px solid #1e293b',
      }}>
        <h2 style={{ fontSize: '18px', color: '#f1f5f9', marginBottom: '20px' }}>
          Position Colors (TopDog Standard)
        </h2>
        
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { pos: 'QB', color: '#F472B6', label: 'Quarterback' },
            { pos: 'RB', color: '#0fba80', label: 'Running Back' },
            { pos: 'WR', color: '#4285F4', label: 'Wide Receiver' },
            { pos: 'TE', color: '#7C3AED', label: 'Tight End' },
          ].map(({ pos, color, label }) => (
            <div 
              key={pos}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              onClick={() => copyToClipboard(color, `${pos} color`)}
            >
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: color,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
              }}>
                {pos}
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 600 }}>
                  {label}
                </div>
                <code style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {color}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

