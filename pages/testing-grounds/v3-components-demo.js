/**
 * V3 Components Demo Page
 * 
 * Individual testing of each V3 component to verify
 * pixel-perfect preservation of measurements.
 */

import React, { useState } from 'react';
import { HorizontalPicksBarDemo } from '../../components/draft/v3/layout/HorizontalPicksBar';
import { FixedElementsLayerDemo } from '../../components/draft/v3/layout/FixedElementsLayer'; 
import { ThreeColumnLayoutDemo } from '../../components/draft/v3/layout/ThreeColumnLayout';
import { TournamentThemeSelector } from '../../components/draft/v3/DraftNavbarV3';

export default function V3ComponentsDemo() {
  const [activeDemo, setActiveDemo] = useState('horizontal-picks');

  const demos = [
    { 
      id: 'horizontal-picks', 
      name: 'Horizontal Picks Bar',
      description: '256px height, 4.5px gaps, 158px cards'
    },
    { 
      id: 'fixed-elements', 
      name: 'Fixed Elements Layer',
      description: 'Absolute positioning: Clock, Autodraft, Buttons'
    },
    { 
      id: 'three-columns', 
      name: 'Three Column Layout',
      description: 'Queue (288px) | Available Players | Your Team'
    },
    { 
      id: 'navbar-theming', 
      name: 'Navbar Theming',
      description: 'Tournament-specific background switching'
    }
  ];

  const renderDemo = () => {
    switch (activeDemo) {
      case 'horizontal-picks':
        return <HorizontalPicksBarDemo />;
      case 'fixed-elements':
        return <FixedElementsLayerDemo />;
      case 'three-columns':
        return <ThreeColumnLayoutDemo />;
      case 'navbar-theming':
        return <NavbarThemingDemo />;
      default:
        return <div className="text-white text-center p-8">Select a demo</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">
            🧪 Draft Room V3 - Component Testing
          </h1>
          <p className="text-gray-300">
            Individual component testing to verify pixel-perfect preservation
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-1">
            {demos.map(demo => (
              <button
                key={demo.id}
                onClick={() => setActiveDemo(demo.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeDemo === demo.id
                    ? 'text-blue-300 border-b-2 border-blue-300'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {demo.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Info */}
      <div className="bg-blue-900 border-b border-blue-600">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-100">
                {demos.find(d => d.id === activeDemo)?.name}
              </h2>
              <p className="text-blue-200 text-sm">
                {demos.find(d => d.id === activeDemo)?.description}
              </p>
            </div>
            <div className="text-blue-200 text-sm">
              Preserving exact measurements from 4614-line original
            </div>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="relative">
        {renderDemo()}
      </div>

      {/* Measurement Guide */}
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 p-4 rounded text-xs text-white max-w-xs">
        <h3 className="font-bold mb-2">Key Measurements:</h3>
        <ul className="space-y-1">
          <li>• Main Width: <code>1391px</code></li>
          <li>• Picks Height: <code>256px</code></li>
          <li>• Queue Width: <code>288px</code></li>
          <li>• Clock Position: <code>0px, 45.5px</code></li>
          <li>• Content Start: <code>380px</code></li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Navbar Theming Demo Component
 */
function NavbarThemingDemo() {
  return (
    <div className="bg-[#101927] min-h-screen">
      <div className="text-white text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Tournament Navbar Theming</h1>
        <p className="text-gray-300 mb-8">
          Easy tournament switching - change one line in navbar.js
        </p>
        
        <TournamentThemeSelector />
        
        <div className="mt-8 max-w-2xl mx-auto text-left">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="font-bold text-white mb-4">How Tournament Switching Works:</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">1. Current Setup</h4>
                <div className="bg-gray-900 p-3 rounded font-mono text-sm">
                  <span className="text-blue-300">export const</span> ACTIVE_TOURNAMENT = TOURNAMENT_THEMES[<span className="text-green-300">'2024_MAIN'</span>];
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">2. To Switch to Spring 2025</h4>
                <div className="bg-gray-900 p-3 rounded font-mono text-sm">
                  <span className="text-blue-300">export const</span> ACTIVE_TOURNAMENT = TOURNAMENT_THEMES[<span className="text-green-300">'2025_SPRING'</span>];
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">3. Result</h4>
                <div className="bg-green-900 p-3 rounded text-sm">
                  ✅ All draft rooms instantly use new tournament theme<br/>
                  ✅ Site navbar remains unchanged<br/>
                  ✅ Fallback colors prevent broken displays
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
