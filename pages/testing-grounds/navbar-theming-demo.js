/**
 * Demo page showing tournament navbar theming system
 * 
 * This demonstrates how easy it will be to change
 * tournament themes in the V3 draft room system.
 */

import React from 'react';
import DraftNavbarV3, { TournamentThemeSelector } from '../../components/draft/v3/DraftNavbarV3';
import { 
  TOURNAMENT_HELPERS, 
  TOURNAMENT_THEMES,
  ACTIVE_TOURNAMENT 
} from '../../components/draft/v3/constants/navbar';

function NavbarThemingDemo() {
  const availableThemes = TOURNAMENT_HELPERS.getAvailableThemes();
  const currentInfo = TOURNAMENT_HELPERS.getCurrentTournament();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Demo Navbar */}
      <DraftNavbarV3 />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              🎨 Tournament Navbar Theming Demo
            </h1>
            <p className="text-gray-300 text-lg">
              Draft room navbar changes year-to-year while site navbar stays constant
            </p>
          </div>

          {/* Current Theme Info */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Current Theme</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Tournament</h3>
                <p className="text-white">{currentInfo.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Background</h3>
                <p className="text-blue-300 font-mono text-sm">
                  {ACTIVE_TOURNAMENT.background.image}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Fallback Color</h3>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded border border-gray-500"
                    style={{ backgroundColor: currentInfo.fallbackColor }}
                  ></div>
                  <span className="text-white font-mono">{currentInfo.fallbackColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Selector (Development) */}
          <TournamentThemeSelector />

          {/* Available Themes */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Available Tournament Themes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableThemes.map(({ key, name }) => {
                const theme = TOURNAMENT_THEMES[key];
                return (
                  <div key={key} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-white">{name}</h3>
                      {key === '2024_MAIN' && (
                        <span className="bg-green-500 text-black px-2 py-1 rounded text-xs font-bold">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded border border-gray-500"
                          style={{ backgroundColor: theme.background.fallbackColor }}
                        ></div>
                        <span className="text-gray-300 text-sm font-mono">
                          {theme.background.fallbackColor}
                        </span>
                      </div>
                      <div className="text-gray-400 text-xs">
                        Text: {theme.colors.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How to Change */}
          <div className="bg-blue-900 border border-blue-600 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-blue-100 mb-4">
              🚀 How to Change Tournament Theme
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-blue-200 mb-2">1. Edit One File</h3>
                <p className="text-blue-100 text-sm mb-2">
                  Open: <code className="bg-blue-800 px-2 py-1 rounded font-mono">
                    components/draft/v3/constants/navbar.js
                  </code>
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-blue-200 mb-2">2. Change One Line</h3>
                <div className="bg-blue-800 p-3 rounded font-mono text-sm">
                  <div className="text-gray-400">{`// From:`}</div>
                  <div className="text-blue-300">
                    export const ACTIVE_TOURNAMENT = TOURNAMENT_THEMES['2024_MAIN'];
                  </div>
                  <div className="text-gray-400 mt-2">{`// To:`}</div>
                  <div className="text-green-300">
                    export const ACTIVE_TOURNAMENT = TOURNAMENT_THEMES['2025_SPRING'];
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-blue-200 mb-2">3. Done! 🎯</h3>
                <p className="text-blue-100 text-sm">
                  All draft rooms instantly use the new tournament theme.
                  Site navbar remains unchanged.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-green-900 border border-green-600 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-green-100 mb-4">
              ✅ Benefits of This System
            </h2>
            <ul className="space-y-2 text-green-100">
              <li className="flex items-start space-x-2">
                <span className="text-green-400 font-bold">•</span>
                <span><strong>Easy Updates:</strong> Change tournament branding in seconds</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-400 font-bold">•</span>
                <span><strong>Separate Systems:</strong> Draft navbar ≠ Site navbar</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-400 font-bold">•</span>
                <span><strong>Future Ready:</strong> Pre-configured for upcoming tournaments</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-400 font-bold">•</span>
                <span><strong>Consistent:</strong> Same background/colors across all draft rooms</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-400 font-bold">•</span>
                <span><strong>Safe:</strong> Fallback colors prevent broken displays</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NavbarThemingDemo;
