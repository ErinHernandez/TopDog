/**
 * PositionFilterBar - Position filter buttons for exposure report
 * 
 * Extracted from ExposureReportMobile for reusability.
 * Can be used anywhere position filtering is needed.
 */

import React, { useState, useEffect } from 'react';

import { POSITIONS } from '../../draft/v3/constants/positions';

// Position colors (matches memory)
const POSITION_COLORS = {
  'QB': '#F472B6',
  'RB': '#0fba80',
  'WR': '#FBBF25',
  'TE': '#7C3AED'
};

export function getPositionColor(position) {
  return POSITION_COLORS[position] || '#6B7280';
}

export default function PositionFilterBar({
  selectedPositions,
  onPositionToggle,
  positions = POSITIONS,
  clearAllAfterMs = 3500  // Auto-clear when all selected
}) {
  const [clearAllTimeout, setClearAllTimeout] = useState(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clearAllTimeout) {
        clearTimeout(clearAllTimeout);
      }
    };
  }, [clearAllTimeout]);

  const handlePositionClick = (position) => {
    // Cancel any existing clear timeout
    if (clearAllTimeout) {
      clearTimeout(clearAllTimeout);
      setClearAllTimeout(null);
    }

    let newPositions;
    if (selectedPositions.includes(position)) {
      newPositions = selectedPositions.filter(p => p !== position);
    } else {
      newPositions = [...selectedPositions, position];
    }
    
    onPositionToggle(newPositions);

    // Check if all positions are now selected
    if (newPositions.length === positions.length) {
      const timeoutId = setTimeout(() => {
        onPositionToggle([]);
        setClearAllTimeout(null);
      }, clearAllAfterMs);
      
      setClearAllTimeout(timeoutId);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {positions.map(position => (
        <button
          key={position}
          onClick={() => handlePositionClick(position)}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors border-2 ${
            selectedPositions.includes(position)
              ? 'text-white'
              : 'bg-transparent text-gray-300 hover:bg-gray-800/50'
          }`}
          style={{
            backgroundColor: selectedPositions.includes(position) ? getPositionColor(position) : 'transparent',
            borderColor: getPositionColor(position)
          }}
        >
          {position}
        </button>
      ))}
    </div>
  );
}

