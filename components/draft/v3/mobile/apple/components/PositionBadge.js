/**
 * PositionBadge - Clean Implementation
 * 
 * Perfect font centering using table-cell display and mathematical line-height.
 * No transforms, no padding hacks, just precise CSS fundamentals.
 */

import React from 'react';

const PositionBadge = ({ 
  position, 
  style = {},
  top = '0px',
  left = '0px',
  width = '24px',
  height = '15px'
}) => {
  // Get position color
  const getPositionColor = (pos) => {
    const colors = {
      'QB': '#F472B6',
      'RB': '#0fba80', 
      'WR': '#FBBF25',
      'TE': '#7C3AED',
      'FLEX': '#9CA3AF', // Gray for FLEX (fallback, will be overridden by gradient)
      'BN': '#6B7280'    // Gray for Bench
    };
    return colors[pos] || '#6B7280';
  };

  // Calculate font size and color based on badge size (scale proportionally)
  const widthNum = parseInt(width);
  const heightNum = parseInt(height);
  const isDoubleSize = widthNum >= 48 && heightNum >= 30;
  const isRosterSize = widthNum >= 30 && heightNum >= 19; // Roster badges (30x19)
  const fontSize = isDoubleSize ? '15px' : (isRosterSize ? '15px' : '11px');
  const fontColor = 'black'; // Black for all position badges

  // Special handling for FLEX position with three-layer gradient
  if (position === 'FLEX') {
    return (
      <div style={{
        // Positioning
        position: 'absolute',
        top: top,
        left: left,
        
        // Core badge styling
        width: width,
        height: height,
        borderRadius: '2px',
        overflow: 'hidden',
        
        // Clean centering using table-cell
        display: 'table-cell',
        verticalAlign: 'middle',
        textAlign: 'center',
        
        // Clean typography with height-matched line-height
        color: fontColor,
        fontSize: fontSize,
        fontWeight: '700',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        lineHeight: height, // Match container height for perfect centering
        
        // No interference properties
        margin: 0,
        padding: 0,
        border: 'none',
        
        // Override any custom styles
        ...style
      }}>
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
          <div style={{ flex: 1, backgroundColor: '#FBBF25' }}></div> {/* WR Yellow */}
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
    <div style={{
      // Positioning
      position: 'absolute',
      top: top,
      left: left,
      
      // Core badge styling
      width: width,
      height: height,
      backgroundColor: getPositionColor(position),
      borderRadius: '2px',
      
      // Clean centering using table-cell
      display: 'table-cell',
      verticalAlign: 'middle',
      textAlign: 'center',
      
      // Clean typography with height-matched line-height
      color: fontColor,
      fontSize: fontSize,
      fontWeight: '700',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: height, // Match container height for perfect centering
      
      // Position-specific text adjustments
      textIndent: position === 'RB' ? '0.25px' : '0',
      
      // No interference properties
      margin: 0,
      padding: 0,
      border: 'none',
      
      // Override any custom styles
      ...style
    }}>
      {position}
    </div>
  );
};

export default PositionBadge;