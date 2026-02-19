/**
 * CleanPositionBadge - Mathematical Centering Approach
 * 
 * This component achieves perfect font centering through proper CSS fundamentals
 * instead of compensation hacks. No transforms, no padding adjustments, no conflicts.
 */

import React from 'react';

const CleanPositionBadge = ({ 
  position, 
  size = 'small' // 'small' (24x15) or 'large' (48x30)
}) => {
  // Get position color
  const getPositionColor = (pos) => {
    const colors = {
      'QB': '#F472B6',
      'RB': '#0fba80', 
      'WR': '#4285F4',
      'TE': '#7C3AED'
    };
    return colors[pos] || '#6B7280';
  };

  // Size configurations
  const dimensions = {
    small: { width: '24px', height: '15px', fontSize: '10px' },
    large: { width: '48px', height: '30px', fontSize: '14px' }
  };

  const config = dimensions[size];

  // FLEX position gets special gradient treatment
  if (position === 'FLEX') {
    return (
      <div
        style={{
          width: config.width,
          height: config.height,
          borderRadius: '2px',
          position: 'relative',
          overflow: 'hidden',
          
          // Precise centering using line-height matching container height
          display: 'table-cell',
          verticalAlign: 'middle',
          textAlign: 'center',
          
          // Clean typography with height-matched line-height for perfect centering
          color: 'white',
          fontSize: config.fontSize,
          fontWeight: '700',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          lineHeight: config.height, // Match container height for perfect vertical centering
          
          // No interference properties
          margin: 0,
          padding: 0,
          border: 'none'
        }}
      >
        {/* Three-layer gradient background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ flex: 1, backgroundColor: '#0fba80' }}></div> {/* RB Green */}
          <div style={{ flex: 1, backgroundColor: '#4285F4' }}></div> {/* WR Blue */}
          <div style={{ flex: 1, backgroundColor: '#7C3AED' }}></div> {/* TE Purple */}
        </div>
        
        {/* Text overlay - table-cell handles centering */}
        <span style={{ 
          position: 'relative', 
          zIndex: 1
        }}>
          {position}
        </span>
      </div>
    );
  }

  // Regular position badges
  return (
    <div
      style={{
        width: config.width,
        height: config.height,
        backgroundColor: getPositionColor(position),
        borderRadius: '2px',
        
        // Precise centering using line-height matching container height
        display: 'table-cell',
        verticalAlign: 'middle',
        textAlign: 'center',
        
        // Clean typography with height-matched line-height for perfect centering
        color: 'white',
        fontSize: config.fontSize,
        fontWeight: '700',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        lineHeight: config.height, // Match container height for perfect vertical centering
        
        // No interference properties
        margin: 0,
        padding: 0,
        border: 'none'
      }}
    >
      {position}
    </div>
  );
};

export default CleanPositionBadge;
