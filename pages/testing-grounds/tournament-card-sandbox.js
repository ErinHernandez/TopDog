/**
 * Tournament Card Sandbox
 * 
 * Isolated testing environment for TournamentCard styling experiments.
 * Uses styleOverrides prop to test backgrounds, colors, spacing without
 * modifying production component code.
 * 
 * Features:
 * - Side-by-side card comparison
 * - Multi-device iPhone preview (SE, 13, 14 Pro Max)
 * - Real-time style controls
 * - Export configuration
 */

import React, { useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { TournamentCard } from '../../components/vx2/tabs/lobby/TournamentCard';
import MobilePhoneFrame from '../../components/vx2/shell/MobilePhoneFrame';
import { DEVICE_PRESETS, BG_COLORS } from '../../components/vx2/core/constants';
import DevNav from '../../components/dev/DevNav';

// ============================================================================
// VIEW MODES
// ============================================================================

const VIEW_MODES = {
  cards: { id: 'cards', label: 'Cards' },
  devices: { id: 'devices', label: 'Devices' },
};

// All available devices in order from smallest to largest
const ALL_DEVICE_IDS = [
  'iphone-se',
  'iphone-mini',
  'iphone-12',
  'iphone-13',
  'iphone-15',
  'iphone-11',
  'iphone-12-pro-max',
  'iphone-13-pro-max',
  'iphone-14-pro-max',
  'iphone-16-pro-max',
];

// Default selected devices
const DEFAULT_SELECTED_DEVICES = ['iphone-se', 'iphone-13', 'iphone-14-pro-max'];

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_TOURNAMENT = {
  id: 'sandbox-1',
  title: 'BEST BALL INTERNATIONAL',
  entryFee: '$25',
  totalEntries: '10,000',
  firstPlacePrize: '$100,000',
  currentEntries: 7500,
  maxEntries: 10000,
  isFeatured: true,
};

// ============================================================================
// PRESETS
// ============================================================================

const PRESETS = {
  original: {
    label: 'Original',
    overrides: {},
  },
  gradientBlue: {
    label: 'Blue Gradient',
    overrides: {
      background: 'linear-gradient(135deg, #1E3A5F 0%, #0F172A 100%)',
      backgroundFallback: '#0F172A',
      border: '#3B82F6',
      borderWidth: 2,
      accent: '#3B82F6',
    },
  },
  gradientPurple: {
    label: 'Purple Gradient',
    overrides: {
      background: 'linear-gradient(135deg, #4C1D95 0%, #1E1B4B 100%)',
      backgroundFallback: '#1E1B4B',
      border: '#7C3AED',
      borderWidth: 2,
      accent: '#7C3AED',
    },
  },
  gradientGreen: {
    label: 'Green Gradient',
    overrides: {
      background: 'linear-gradient(135deg, #064E3B 0%, #022C22 100%)',
      backgroundFallback: '#022C22',
      border: '#10B981',
      borderWidth: 2,
      accent: '#10B981',
    },
  },
  minimal: {
    label: 'Minimal Dark',
    overrides: {
      background: 'none',
      backgroundFallback: '#0A0A0A',
      border: '#333333',
      borderWidth: 1,
      accent: '#333333',
    },
  },
  glass: {
    label: 'Glassmorphism',
    overrides: {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      backgroundFallback: 'rgba(15,23,42,0.8)',
      border: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      accent: 'rgba(255,255,255,0.2)',
    },
  },
  neon: {
    label: 'Neon Glow',
    overrides: {
      background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A2E 100%)',
      backgroundFallback: '#0A0A0A',
      border: '#00FF88',
      borderWidth: 2,
      accent: '#00FF88',
    },
  },
  warmGradient: {
    label: 'Warm Gradient',
    overrides: {
      background: 'linear-gradient(135deg, #7C2D12 0%, #431407 100%)',
      backgroundFallback: '#431407',
      border: '#F97316',
      borderWidth: 2,
      accent: '#F97316',
    },
  },
};

// ============================================================================
// BACKGROUND OPTIONS
// ============================================================================

const BACKGROUND_OPTIONS = [
  { value: 'url(/tournament_card_bg.webp)', label: 'Space Background' },
  { value: 'linear-gradient(135deg, #1E3A5F 0%, #0F172A 100%)', label: 'Blue Gradient' },
  { value: 'linear-gradient(135deg, #4C1D95 0%, #1E1B4B 100%)', label: 'Purple Gradient' },
  { value: 'linear-gradient(135deg, #064E3B 0%, #022C22 100%)', label: 'Green Gradient' },
  { value: 'linear-gradient(135deg, #7C2D12 0%, #431407 100%)', label: 'Orange Gradient' },
  { value: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)', label: 'Vertical Dark' },
  { value: 'radial-gradient(circle at top right, #1E3A8A 0%, #0F172A 100%)', label: 'Radial Blue' },
  { value: 'none', label: 'Solid Color Only' },
];

// ============================================================================
// CONTROL COMPONENTS
// ============================================================================

function ColorPicker({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <label style={{ color: '#9CA3AF', fontSize: 12, width: 100 }}>{label}</label>
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        style={{ 
          width: 40, 
          height: 28, 
          border: 'none', 
          borderRadius: 4,
          cursor: 'pointer',
          backgroundColor: 'transparent',
        }}
      />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          backgroundColor: '#374151',
          border: '1px solid #4B5563',
          borderRadius: 4,
          padding: '4px 8px',
          color: '#FFFFFF',
          fontSize: 11,
          fontFamily: 'monospace',
        }}
      />
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step = 1 }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <label style={{ color: '#9CA3AF', fontSize: 12 }}>{label}</label>
        <span style={{ color: '#FFFFFF', fontSize: 12, fontFamily: 'monospace' }}>{value}px</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', cursor: 'pointer' }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ color: '#9CA3AF', fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          backgroundColor: '#374151',
          border: '1px solid #4B5563',
          borderRadius: 4,
          padding: '6px 8px',
          color: '#FFFFFF',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// DEVICE CARD WRAPPER
// ============================================================================

function DeviceCardWrapper({ devicePreset, styleOverrides, tournament }) {
  const device = DEVICE_PRESETS[devicePreset];
  
  return (
    <MobilePhoneFrame
      devicePreset={devicePreset}
      fullScreen={false}
      label={`${device.name} (${device.width}x${device.height})`}
    >
      <div
        style={{
          height: '100%',
          backgroundColor: BG_COLORS.primary,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TournamentCard
          tournament={tournament}
          featured={true}
          styleOverrides={styleOverrides}
          onJoinClick={() => console.log('Join clicked')}
        />
      </div>
    </MobilePhoneFrame>
  );
}

// ============================================================================
// MAIN SANDBOX
// ============================================================================

export default function TournamentCardSandbox() {
  // View mode state
  const [viewMode, setViewMode] = useState('cards');
  
  // Selected devices state
  const [selectedDevices, setSelectedDevices] = useState(DEFAULT_SELECTED_DEVICES);
  
  // Toggle device selection
  const toggleDevice = useCallback((deviceId) => {
    setSelectedDevices((prev) => {
      if (prev.includes(deviceId)) {
        // Don't allow deselecting the last device
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== deviceId);
      }
      return [...prev, deviceId];
    });
  }, []);
  
  // Select all / deselect all
  const selectAllDevices = useCallback(() => {
    setSelectedDevices([...ALL_DEVICE_IDS]);
  }, []);
  
  const selectDefaultDevices = useCallback(() => {
    setSelectedDevices([...DEFAULT_SELECTED_DEVICES]);
  }, []);
  
  // Style override state
  const [overrides, setOverrides] = useState({
    background: 'url(/tournament_card_bg.webp)',
    backgroundFallback: '#0a0a1a',
    border: 'rgba(75, 85, 99, 0.5)',
    borderWidth: 1,
    accent: '#1E3A5F',
    progressBg: 'rgba(55, 65, 81, 1)',
    padding: 21,
    borderRadius: 24,
  });
  
  // Custom image URLs (separate from gradient/preset background)
  const [customBackgroundImage, setCustomBackgroundImage] = useState('');
  
  // Computed overrides including custom images
  const computedOverrides = useMemo(() => ({
    ...overrides,
    ...(customBackgroundImage ? { backgroundImage: customBackgroundImage } : {}),
  }), [overrides, customBackgroundImage]);

  // Update a single override
  const updateOverride = useCallback((key, value) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Apply preset
  const applyPreset = useCallback((presetKey) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      setOverrides((prev) => ({
        ...prev,
        ...preset.overrides,
        // Reset to defaults for any keys not in preset
        background: preset.overrides.background ?? 'url(/tournament_card_bg.webp)',
        backgroundFallback: preset.overrides.backgroundFallback ?? '#191932',
        border: preset.overrides.border ?? 'rgba(75, 85, 99, 0.5)',
        borderWidth: preset.overrides.borderWidth ?? 1,
        accent: preset.overrides.accent ?? '#1E3A5F',
      }));
    }
  }, []);

  // Generate exportable code
  const exportCode = useMemo(() => {
    return `// Generated from Tournament Card Sandbox
// Copy this to TournamentCard.tsx CARD_COLORS or pass as styleOverrides

const styleOverrides = {
  background: '${overrides.background}',
  backgroundFallback: '${overrides.backgroundFallback}',
  border: '${overrides.border}',
  borderWidth: ${overrides.borderWidth},
  accent: '${overrides.accent}',
  progressBg: '${overrides.progressBg}',
  padding: ${overrides.padding},
  borderRadius: ${overrides.borderRadius},${customBackgroundImage ? `\n  backgroundImage: '${customBackgroundImage}',` : ''}
};`;
  }, [overrides, customBackgroundImage]);

  // Copy to clipboard
  const handleExport = useCallback(() => {
    navigator.clipboard.writeText(exportCode).then(() => {
      alert('Copied to clipboard!');
    });
  }, [exportCode]);

  return (
    <>
      <Head>
        <title>Tournament Card Sandbox | TopDog</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div
        style={{
          backgroundColor: '#0F172A',
          minHeight: '100vh',
          display: 'flex',
        }}
      >
        {/* Left: Control Panel */}
        <aside
          style={{
            width: 300,
            backgroundColor: '#1F2937',
            padding: 20,
            borderRight: '1px solid #374151',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <h1 style={{ color: '#FFFFFF', fontSize: 18, marginBottom: 4, fontWeight: 700 }}>
            Tournament Card Sandbox
          </h1>
          <p style={{ color: '#6B7280', fontSize: 12, marginBottom: 16 }}>
            Experiment with card styling in isolation
          </p>
          
          {/* View Mode Toggle */}
          <div style={{ 
            display: 'flex', 
            gap: 4, 
            marginBottom: 20,
            backgroundColor: '#111827',
            borderRadius: 8,
            padding: 4,
          }}>
            {Object.values(VIEW_MODES).map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: viewMode === mode.id ? '#3B82F6' : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  color: viewMode === mode.id ? '#FFFFFF' : '#6B7280',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>
          
          {/* Device Selector - only show in device mode */}
          {viewMode === 'devices' && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <h3 style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, margin: 0 }}>
                  DEVICES ({selectedDevices.length}/{ALL_DEVICE_IDS.length})
                </h3>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={selectAllDevices}
                    style={{
                      padding: '3px 8px',
                      backgroundColor: '#1F2937',
                      color: '#9CA3AF',
                      border: '1px solid #374151',
                      borderRadius: 4,
                      fontSize: 10,
                      cursor: 'pointer',
                    }}
                  >
                    All
                  </button>
                  <button
                    onClick={selectDefaultDevices}
                    style={{
                      padding: '3px 8px',
                      backgroundColor: '#1F2937',
                      color: '#9CA3AF',
                      border: '1px solid #374151',
                      borderRadius: 4,
                      fontSize: 10,
                      cursor: 'pointer',
                    }}
                  >
                    Default
                  </button>
                </div>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 6,
              }}>
                {ALL_DEVICE_IDS.map((deviceId) => {
                  const device = DEVICE_PRESETS[deviceId];
                  const isSelected = selectedDevices.includes(deviceId);
                  return (
                    <button
                      key={deviceId}
                      onClick={() => toggleDevice(deviceId)}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: isSelected ? '#1E3A5F' : '#111827',
                        color: isSelected ? '#60A5FA' : '#6B7280',
                        border: isSelected ? '1px solid #3B82F6' : '1px solid #374151',
                        borderRadius: 6,
                        fontSize: 10,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{device?.name || deviceId}</span>
                      <span style={{ 
                        fontSize: 8, 
                        color: isSelected ? '#3B82F6' : '#4B5563',
                        fontFamily: 'monospace',
                      }}>
                        {device?.width}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Presets */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Presets
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: '#374151',
                    border: '1px solid #4B5563',
                    borderRadius: 4,
                    color: '#FFFFFF',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Background
            </h2>
            <Select
              label="Background Style"
              value={overrides.background}
              onChange={(v) => updateOverride('background', v)}
              options={BACKGROUND_OPTIONS}
            />
            <ColorPicker
              label="Fallback Color"
              value={overrides.backgroundFallback}
              onChange={(v) => updateOverride('backgroundFallback', v)}
            />
          </div>
          
          {/* Custom Background Image */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Custom Background
            </h2>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: 11, marginBottom: 4 }}>
                Background Image URL
              </label>
              <input
                type="text"
                value={customBackgroundImage}
                onChange={(e) => setCustomBackgroundImage(e.target.value)}
                placeholder="/path/to/image.png or https://..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: '#374151',
                  border: '1px solid #4B5563',
                  borderRadius: 6,
                  color: '#FFFFFF',
                  fontSize: 11,
                  outline: 'none',
                }}
              />
              <p style={{ color: '#6B7280', fontSize: 10, marginTop: 4 }}>
                Overrides gradient when set
              </p>
            </div>
            {customBackgroundImage && (
              <button
                onClick={() => setCustomBackgroundImage('')}
                style={{
                  padding: '6px 10px',
                  backgroundColor: '#7F1D1D',
                  border: '1px solid #991B1B',
                  borderRadius: 4,
                  color: '#FCA5A5',
                  fontSize: 10,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Clear Custom Background
              </button>
            )}
          </div>

          {/* Border */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Border
            </h2>
            <ColorPicker
              label="Border Color"
              value={overrides.border}
              onChange={(v) => updateOverride('border', v)}
            />
            <Slider
              label="Border Width"
              value={overrides.borderWidth}
              onChange={(v) => updateOverride('borderWidth', v)}
              min={0}
              max={6}
            />
            <ColorPicker
              label="Accent (Featured)"
              value={overrides.accent}
              onChange={(v) => updateOverride('accent', v)}
            />
          </div>

          {/* Spacing */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Spacing
            </h2>
            <Slider
              label="Padding"
              value={overrides.padding}
              onChange={(v) => updateOverride('padding', v)}
              min={12}
              max={40}
            />
            <Slider
              label="Border Radius"
              value={overrides.borderRadius}
              onChange={(v) => updateOverride('borderRadius', v)}
              min={0}
              max={40}
            />
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Progress Bar
            </h2>
            <ColorPicker
              label="Background"
              value={overrides.progressBg}
              onChange={(v) => updateOverride('progressBg', v)}
            />
          </div>

          {/* Export */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Export
            </h2>
            <button
              onClick={handleExport}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: '#10B981',
                border: 'none',
                borderRadius: 6,
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 8,
              }}
            >
              Copy Config to Clipboard
            </button>
            <pre
              style={{
                backgroundColor: '#111827',
                padding: 12,
                borderRadius: 6,
                fontSize: 9,
                color: '#9CA3AF',
                overflow: 'auto',
                maxHeight: 200,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {exportCode}
            </pre>
          </div>
        </aside>

        {/* Center: Preview Area */}
        <main
          style={{
            flex: 1,
            padding: 40,
            overflowY: 'auto',
          }}
        >
          {viewMode === 'cards' ? (
            /* Cards View - Side by Side Comparison */
            <div
              style={{
                display: 'flex',
                gap: 40,
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}
            >
              {/* Original Card */}
              <div>
                <h3 style={{ color: '#6B7280', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
                  ORIGINAL
                </h3>
                <div style={{ 
                  width: 375, 
                  height: 650,
                  transform: 'scale(0.85)',
                  transformOrigin: 'top center',
                }}>
                  <TournamentCard
                    tournament={MOCK_TOURNAMENT}
                    featured={true}
                    onJoinClick={() => console.log('Join clicked')}
                  />
                </div>
              </div>

              {/* Experiment Card */}
              <div>
                <h3 style={{ color: '#10B981', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
                  EXPERIMENT
                </h3>
                <div style={{ 
                  width: 375, 
                  height: 650,
                  transform: 'scale(0.85)',
                  transformOrigin: 'top center',
                }}>
                  <TournamentCard
                    tournament={MOCK_TOURNAMENT}
                    featured={true}
                    styleOverrides={computedOverrides}
                    onJoinClick={() => console.log('Join clicked')}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Devices View - Multi-iPhone Preview */
            <div>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h2 style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                  Device Preview
                </h2>
                <p style={{ color: '#6B7280', fontSize: 12 }}>
                  See how the card looks across different iPhone models
                </p>
              </div>
              
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  gap: 32,
                  flexWrap: 'wrap',
                }}
              >
                {ALL_DEVICE_IDS.filter(id => selectedDevices.includes(id)).map((deviceId) => (
                  <DeviceCardWrapper
                    key={deviceId}
                    devicePreset={deviceId}
                    styleOverrides={computedOverrides}
                    tournament={MOCK_TOURNAMENT}
                  />
                ))}
              </div>
              
              {/* Device Info Cards */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 24,
                marginTop: 48,
                flexWrap: 'wrap',
              }}>
                {ALL_DEVICE_IDS.filter(id => selectedDevices.includes(id)).map((deviceId) => {
                  const device = DEVICE_PRESETS[deviceId];
                  return (
                    <div
                      key={deviceId}
                      style={{
                        backgroundColor: '#1F2937',
                        borderRadius: 12,
                        padding: '16px 20px',
                        minWidth: 180,
                      }}
                    >
                      <h3 style={{
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 8,
                      }}>
                        {device.name}
                      </h3>
                      <div style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.6 }}>
                        <div>Screen: {device.width} x {device.height}</div>
                        <div>
                          Type: {device.hasDynamicIsland ? 'Dynamic Island' : device.hasNotch ? 'Notch' : 'Home Button'}
                        </div>
                        <div>Status Bar: {device.statusBarHeight}px</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* DevNav */}
      <DevNav />
    </>
  );
}

