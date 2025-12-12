/**
 * Draft Room V3 - Navbar Component
 * 
 * Tournament-specific navbar with easily changeable theming.
 * To change tournament themes, just update ACTIVE_TOURNAMENT in navbar.js
 */

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  NAVBAR_STYLES, 
  DROPDOWN_STYLES, 
  TOURNAMENT_HELPERS,
  ACTIVE_TOURNAMENT 
} from './constants/navbar';

export default function DraftNavbarV3() {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Tournament info for display/debugging
  const currentTournament = TOURNAMENT_HELPERS.getCurrentTournament();

  return (
    <header 
      className={NAVBAR_STYLES.header.className}
      style={NAVBAR_STYLES.header.style}
    >
      <nav 
        className={NAVBAR_STYLES.nav.className}
        style={NAVBAR_STYLES.nav.style}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between h-16 px-4">
            
            {/* Left side - Logo and Tournament Info */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="text-2xl font-bold">TopDog.dog</div>
              </Link>
              
              {/* Tournament indicator (development only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="px-2 py-1 bg-black bg-opacity-20 rounded text-xs">
                  {currentTournament.name}
                </div>
              )}
            </div>

            {/* Right side - Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-1 hover:bg-black hover:bg-opacity-10 px-3 py-2 rounded transition-colors"
              >
                <span>Menu</span>
                <span className={`transform transition-transform ${showDropdown ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-[#3c3c3c] rounded-lg shadow-xl z-50 border border-gray-600">
                  <div className="py-2">
                    
                    {/* Navigation Section */}
                    <div className="px-4 py-2">
                      <h4 className="text-xs font-semibold text-gray-400 mb-2">Navigation</h4>
                      <Link href="/my-teams" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#4c4c4c] hover:text-white transition-colors">
                        My Teams
                      </Link>
                      <Link href="/exposure" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#4c4c4c] hover:text-white transition-colors">
                        Exposure Report
                      </Link>
                      <Link href="/" className="block px-4 py-2 text-sm text-red-300 hover:bg-[#4c4c4c] hover:text-red-200 transition-colors">
                        Exit Draft
                      </Link>
                    </div>

                    {/* About Section with Special Styling */}
                    <div className="px-4 py-2">
                      <h4 
                        className={DROPDOWN_STYLES.aboutSection.title.className}
                        style={DROPDOWN_STYLES.aboutSection.title.style}
                      >
                        About
                      </h4>
                      <Link href="/our-mission" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#4c4c4c] hover:text-white transition-colors">
                        Our Mission
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

/**
 * Tournament Theme Selector (Development Component)
 * Shows how easy it is to switch between tournament themes
 */
export function TournamentThemeSelector() {
  const [selectedTheme, setSelectedTheme] = useState('MAIN_2024');
  const availableThemes = TOURNAMENT_HELPERS.getAvailableThemes();

  const handleThemeChange = (themeKey) => {
    setSelectedTheme(themeKey);
    TOURNAMENT_HELPERS.switchTournament(themeKey);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 m-4">
      <h3 className="text-white font-bold mb-3">🎨 Tournament Theme Selector</h3>
      <p className="text-gray-300 text-sm mb-4">
        Change tournament themes easily by updating ACTIVE_TOURNAMENT in navbar.js
      </p>
      
      <div className="space-y-2">
        {availableThemes.map(({ key, name }) => (
          <label key={key} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="tournament-theme"
              value={key}
              checked={selectedTheme === key}
              onChange={() => handleThemeChange(key)}
              className="text-blue-500"
            />
            <span className="text-white text-sm">{name}</span>
            {key === 'MAIN_2024' && (
              <span className="text-green-400 text-xs">(Current)</span>
            )}
          </label>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-gray-700 rounded text-xs">
        <div className="text-gray-300 mb-1">
          <strong>Current Theme:</strong> {ACTIVE_TOURNAMENT.name}
        </div>
        <div className="text-gray-300 mb-1">
          <strong>Background:</strong> {ACTIVE_TOURNAMENT.background.image}
        </div>
        <div className="text-gray-300">
          <strong>Fallback Color:</strong> 
          <span 
            className="inline-block w-4 h-4 ml-2 rounded border border-gray-500"
            style={{ backgroundColor: ACTIVE_TOURNAMENT.background.fallbackColor }}
          ></span>
          {ACTIVE_TOURNAMENT.background.fallbackColor}
        </div>
      </div>
    </div>
  );
}

/**
 * Example usage in different tournaments
 */
export const TOURNAMENT_EXAMPLES = {
  // How you'd switch for Spring 2025
  switchToSpring2025: () => {
    // In navbar.js, just change:
    // export const ACTIVE_TOURNAMENT = TOURNAMENT_THEMES['SPRING_2025'];
    console.log('Spring 2025 theme activated!');
  },
  
  // How you'd add a new tournament
  addNewTournament: () => {
    console.log(`
      // Add to TOURNAMENT_THEMES in navbar.js:
      SUMMER_2025: {
        name: '2025 Summer Championship',
        background: {
          image: 'url(/summer_2025_texture.png)',
          fallbackColor: '#00bcd4' // Summer cyan
        },
        colors: {
          text: 'text-navy',
          shadow: 'shadow-lg'
        }
      }
    `);
  }
};
