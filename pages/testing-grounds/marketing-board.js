/**
 * Marketing Board Development Page
 * 
 * Development area for marketing materials.
 * Features the tournament board grid with perfect square cells.
 * 
 * Controls:
 * - Cell size adjustment
 * - Grid dimensions (rows/columns)
 * - Border width and radius
 * - Export options
 */

import React, { useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import TournamentBoardMarketing, {
  HomepageHeroBoard,
  SocialMediaBoard,
  ThumbnailBoard,
} from '../../components/vx2/marketing/TournamentBoardMarketing';

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

const PRESETS = {
  homepage: {
    name: 'Homepage Hero',
    columns: 12,
    rows: 18,
    cellSize: 72,
    borderWidth: 3,
    borderRadius: 8,
    gap: 3,
  },
  socialSquare: {
    name: 'Social (Square)',
    columns: 10,
    rows: 10,
    cellSize: 100,
    borderWidth: 4,
    borderRadius: 12,
    gap: 4,
  },
  socialWide: {
    name: 'Social (Wide)',
    columns: 16,
    rows: 9,
    cellSize: 64,
    borderWidth: 3,
    borderRadius: 8,
    gap: 3,
  },
  thumbnail: {
    name: 'Thumbnail',
    columns: 12,
    rows: 18,
    cellSize: 32,
    borderWidth: 2,
    borderRadius: 4,
    gap: 1,
  },
  banner: {
    name: 'Banner (Horizontal)',
    columns: 20,
    rows: 6,
    cellSize: 56,
    borderWidth: 3,
    borderRadius: 8,
    gap: 2,
  },
  custom: {
    name: 'Custom',
    columns: 12,
    rows: 18,
    cellSize: 80,
    borderWidth: 3,
    borderRadius: 10,
    gap: 2,
  },
};

// ============================================================================
// CONTROL COMPONENTS
// ============================================================================

function Slider({ label, value, onChange, min, max, step = 1 }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-mono">{value}px</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max }) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-400">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-700 text-sm"
      />
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function MarketingBoardPage() {
  const boardRef = useRef(null);
  const [activePreset, setActivePreset] = useState('homepage');
  const [animated, setAnimated] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  
  // Board configuration state
  const [config, setConfig] = useState(PRESETS.homepage);
  
  // Handle preset change
  const handlePresetChange = useCallback((presetKey) => {
    setActivePreset(presetKey);
    if (presetKey !== 'custom') {
      setConfig(PRESETS[presetKey]);
    }
  }, []);
  
  // Handle config changes
  const updateConfig = useCallback((key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setActivePreset('custom');
  }, []);
  
  // Replay animation
  const replayAnimation = useCallback(() => {
    setAnimationKey((prev) => prev + 1);
  }, []);
  
  // Calculate dimensions
  const totalWidth = config.columns * config.cellSize + (config.columns - 1) * config.gap + config.gap * 2;
  const totalHeight = config.rows * config.cellSize + (config.rows - 1) * config.gap + config.gap * 2;
  
  // Export as image (using canvas)
  const exportAsImage = useCallback(async () => {
    if (!boardRef.current) return;
    
    try {
      // Use html2canvas if available, otherwise show instructions
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(boardRef.current, {
        backgroundColor: '#0d1117',
        scale: 2, // High resolution
      });
      
      const link = document.createElement('a');
      link.download = `tournament-board-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export requires html2canvas package. Run: npm install html2canvas');
    }
  }, []);
  
  return (
    <>
      <Head>
        <title>Marketing Board | TopDog Dev</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="min-h-screen bg-gray-950 text-white">
        {/* Header */}
        <header className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Marketing Materials</h1>
              <p className="text-gray-400 text-sm mt-1">
                Tournament Board Grid Generator
              </p>
            </div>
            <a
              href="/testing-grounds"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Back to Testing Grounds
            </a>
          </div>
        </header>
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex gap-8">
            {/* Controls Panel */}
            <div className="w-80 flex-shrink-0 space-y-6">
              {/* Presets */}
              <div className="bg-gray-900 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-sm text-gray-300 uppercase tracking-wider">
                  Presets
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => handlePresetChange(key)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activePreset === key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Grid Dimensions */}
              <div className="bg-gray-900 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-sm text-gray-300 uppercase tracking-wider">
                  Grid Dimensions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput
                    label="Columns (Teams)"
                    value={config.columns}
                    onChange={(v) => updateConfig('columns', v)}
                    min={1}
                    max={24}
                  />
                  <NumberInput
                    label="Rows (Rounds)"
                    value={config.rows}
                    onChange={(v) => updateConfig('rows', v)}
                    min={1}
                    max={24}
                  />
                </div>
              </div>
              
              {/* Cell Styling */}
              <div className="bg-gray-900 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-sm text-gray-300 uppercase tracking-wider">
                  Cell Styling
                </h3>
                <Slider
                  label="Cell Size"
                  value={config.cellSize}
                  onChange={(v) => updateConfig('cellSize', v)}
                  min={24}
                  max={120}
                />
                <Slider
                  label="Border Width"
                  value={config.borderWidth}
                  onChange={(v) => updateConfig('borderWidth', v)}
                  min={1}
                  max={8}
                />
                <Slider
                  label="Border Radius"
                  value={config.borderRadius}
                  onChange={(v) => updateConfig('borderRadius', v)}
                  min={0}
                  max={24}
                />
                <Slider
                  label="Gap"
                  value={config.gap}
                  onChange={(v) => updateConfig('gap', v)}
                  min={0}
                  max={12}
                />
              </div>
              
              {/* Animation */}
              <div className="bg-gray-900 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-sm text-gray-300 uppercase tracking-wider">
                  Animation
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Enable Animation</span>
                  <button
                    onClick={() => setAnimated(!animated)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      animated ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transform transition-transform ${
                        animated ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {animated && (
                  <button
                    onClick={replayAnimation}
                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Replay Animation
                  </button>
                )}
              </div>
              
              {/* Export */}
              <div className="bg-gray-900 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-sm text-gray-300 uppercase tracking-wider">
                  Export
                </h3>
                <button
                  onClick={exportAsImage}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-colors"
                >
                  Download PNG
                </button>
                <p className="text-xs text-gray-500">
                  Exports at 2x resolution for crisp printing
                </p>
              </div>
              
              {/* Output Info */}
              <div className="bg-gray-800/50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Output Size</span>
                  <span className="font-mono text-green-400">
                    {totalWidth} x {totalHeight}px
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Cells</span>
                  <span className="font-mono text-blue-400">
                    {config.columns * config.rows}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Aspect Ratio</span>
                  <span className="font-mono text-purple-400">
                    {(totalWidth / totalHeight).toFixed(2)}:1
                  </span>
                </div>
              </div>
            </div>
            
            {/* Preview Area */}
            <div className="flex-1 flex flex-col items-center">
              <div className="bg-gray-900 rounded-2xl p-8 overflow-auto max-w-full">
                <div ref={boardRef} className="inline-block">
                  <TournamentBoardMarketing
                    key={animationKey}
                    columns={config.columns}
                    rows={config.rows}
                    cellSize={config.cellSize}
                    borderWidth={config.borderWidth}
                    borderRadius={config.borderRadius}
                    gap={config.gap}
                    animated={animated}
                  />
                </div>
              </div>
              
              {/* Color Legend */}
              <div className="mt-8 bg-gray-900 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                  Position Colors
                </h4>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F472B6' }} />
                    <span className="text-sm text-gray-400">QB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0fba80' }} />
                    <span className="text-sm text-gray-400">RB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FBBF24' }} />
                    <span className="text-sm text-gray-400">WR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#7C3AED' }} />
                    <span className="text-sm text-gray-400">TE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

