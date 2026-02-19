/**
 * Mobile Tournament Card Component
 * 
 * Displays tournament information in a mobile-optimized card format
 * Matches the desktop tournament card design but optimized for mobile screens
 */

import Image from 'next/image';
import React from 'react';

import { MOBILE_SIZES, PLATFORM_SPECIFIC } from '../draft/v3/mobile/shared/constants/mobileSizes';

export default function TournamentCardMobile({
  title = "THE TOPDOG INTERNATIONAL",
  entryFee = "$25",
  totalEntries = "571,480",
  firstPlacePrize = "$2M",
  onJoinClick,
  className = "",
  style = {}
}) {
  return (
    <div className={`bg-gray-800/90 rounded-2xl border border-gray-600/50 relative ${className}`} style={{ width: '320px', height: '471px', marginLeft: 'auto', marginRight: 'auto', ...style }}>
      {/* Tournament Title - Curved to match image below (two lines) */}
      <div className="absolute text-center" style={{ top: '114px', left: '50%', transform: 'translateX(-50%)' }}>
        <svg width="260" height="100" viewBox="0 0 260 100" style={{ overflow: 'visible' }}>
          <defs>
            {/* Upper and lower arcs */}
            <path id="tournament-title-arc-1" d="M10,52 A116,116 0 0,1 250,52" />
            <path id="tournament-title-arc-2" d="M10,136 A116,116 0 0,1 250,136" />
          </defs>
          <text 
            fill="#ffffff" 
            fontWeight="700" 
            style={{ letterSpacing: '2px', fontFamily: 'Anton SC, sans-serif', paintOrder: 'stroke fill' }} 
            stroke="#14B8A6"
            strokeWidth="0.8"
            strokeLinejoin="round"
            strokeLinecap="round"
            fontSize="36" 
            x="130" 
            y="-48" 
            textAnchor="middle"
          >
            The TopDog
          </text>
          <text 
            fill="#ffffff" 
            fontWeight="800" 
            style={{ letterSpacing: '2px', fontFamily: 'Anton SC, sans-serif', paintOrder: 'stroke fill' }} 
            stroke="#14B8A6" 
            strokeWidth="0.8" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            fontSize="36"
            x="130"
            y="-2"
            textAnchor="middle"
          >
            International
          </text>
        </svg>
      </div>

      {/* Tournament Logo */}
      <div className="absolute" style={{ top: '126px', left: '50%', transform: 'translateX(-50%)' }}>
        <div className="flex items-center justify-center rounded-2xl" style={{ width: '227px', height: '227px' }}>
          <Image
            src="/Teal_Earth_irelandcenter.png"
            alt="Tournament Graphic"
            width={227}
            height={227}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.9rem' }}
          />
        </div>
      </div>

      {/* Join Tournament Button */}
      <div className="absolute" style={{ top: '370px', left: '50%', transform: 'translateX(-50%)' }}>
        <button
          onClick={onJoinClick}
          className="bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors duration-200 shadow-lg"
          style={{ padding: '12px 32px', fontSize: '16px', whiteSpace: 'nowrap' }}
        >
          Join Tournament
        </button>
      </div>

      {/* Tournament Stats */}
      <div className="absolute" style={{ bottom: '12px', left: '0', right: '0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', textAlign: 'center' }}>
          <div>
            <div className="text-xl font-bold text-white">{entryFee}</div>
            <div className="text-sm text-gray-400">Entry</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">{totalEntries}</div>
            <div className="text-sm text-gray-400">Entries</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">{firstPlacePrize}</div>
            <div className="text-sm text-gray-400">1st Place</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Mobile Tournament Card
 * For use in lists or smaller spaces
 */
export function TournamentCardMobileCompact({
  title = "THE TOPDOG INTERNATIONAL",
  entryFee = "$25",
  totalEntries = "571,480",
  firstPlacePrize = "$2M",
  onJoinClick,
  className = ""
}) {
  return (
    <div className={`bg-gray-800/90 rounded-xl p-4 mx-4 my-2 border border-gray-600/50 ${className}`}>
      {/* Title and Button Row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex-1">
          {title}
        </h3>
        <button
          onClick={onJoinClick}
          className="bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors duration-200 ml-4"
        >
          Join
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <div className="font-bold text-white">{entryFee}</div>
          <div className="text-xs text-gray-400">Entry</div>
        </div>
        <div>
          <div className="font-bold text-white">{totalEntries}</div>
          <div className="text-xs text-gray-400">Entries</div>
        </div>
        <div>
          <div className="font-bold text-white">{firstPlacePrize}</div>
          <div className="text-xs text-gray-400">1st Place</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile Tournament Card with Progress Bar
 * Shows tournament fill status
 */
export function TournamentCardMobileWithProgress({
  title = "THE TOPDOG INTERNATIONAL",
  entryFee = "$25",
  currentEntries = 571480,
  maxEntries = 672672,
  firstPlacePrize = "$2M",
  onJoinClick,
  className = ""
}) {
  const fillPercentage = Math.round((currentEntries / maxEntries) * 100);
  const entriesText = `${currentEntries.toLocaleString()}`;
  
  return (
    <div className={`bg-gray-800/90 rounded-2xl p-6 mx-4 my-4 border border-gray-600/50 ${className}`}>
      {/* Tournament Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white leading-tight">
          {title}
        </h2>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Tournament Fill</span>
          <span>{fillPercentage}% Full</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-teal-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${fillPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Join Tournament Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={onJoinClick}
          className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-8 rounded-xl transition-colors duration-200 shadow-lg w-full"
        >
          Join Tournament
        </button>
      </div>

      {/* Tournament Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-white mb-1">
            {entryFee}
          </div>
          <div className="text-sm text-gray-400">
            Entry
          </div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-white mb-1">
            {entriesText}
          </div>
          <div className="text-sm text-gray-400">
            Entries
          </div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-white mb-1">
            {firstPlacePrize}
          </div>
          <div className="text-sm text-gray-400">
            1st Place
          </div>
        </div>
      </div>
    </div>
  );
}
