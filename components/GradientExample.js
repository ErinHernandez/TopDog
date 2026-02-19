import React from 'react';

import { GradientOverlay, getGradientStyles, createPositionGradient } from '../lib/gradientUtils';

import { POSITIONS } from './draft/v3/constants/positions';

// Example component showing how to use the gradient formatting
export default function GradientExample() {
  
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Gradient Formatting Examples</h2>
      
      {/* Method 1: Using the GradientOverlay component */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Method 1: GradientOverlay Component</h3>
        {POSITIONS.map(position => (
          <GradientOverlay 
            key={position}
            position={position}
            className="rounded p-4"
          >
            <div className="flex items-center justify-between">
              <div className="text-white font-bold">{position} Player Name</div>
              <div className="text-white">ADP: 12.5</div>
            </div>
          </GradientOverlay>
        ))}
      </div>
      
      {/* Method 2: Using getGradientStyles */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Method 2: getGradientStyles</h3>
        {POSITIONS.map(position => {
          const styles = getGradientStyles(position);
          return (
            <div key={position} style={styles.container} className="rounded p-4">
              <div style={styles.gradientOverlay} />
              <div style={styles.content} className="flex items-center justify-between">
                <div className="text-white font-bold">{position} Player Name</div>
                <div className="text-white">ADP: 12.5</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Method 3: Manual implementation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Method 3: Manual Implementation</h3>
        {POSITIONS.map(position => {
          const { firstGradient, positionColor } = createPositionGradient(position);
          return (
            <div 
              key={position}
              className="rounded p-4 relative overflow-hidden"
            >
              {/* Position color gradient overlay */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '100%',
                  background: firstGradient,
                  zIndex: 1,
                  pointerEvents: 'none'
                }}
              />
              
              {/* Content */}
              <div className="flex items-center justify-between" style={{ position: 'relative', zIndex: 2 }}>
                <div className="text-white font-bold">{position} Player Name</div>
                <div className="text-white">ADP: 12.5</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Usage instructions */}
      <div className="bg-gray-800 rounded p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Usage Instructions</h3>
        <div className="text-gray-300 space-y-2 text-sm">
          <p><strong>Method 1:</strong> Use the <code>GradientOverlay</code> component for simple cases</p>
          <p><strong>Method 2:</strong> Use <code>getGradientStyles()</code> for more control over styling</p>
          <p><strong>Method 3:</strong> Use <code>createPositionGradient()</code> for complete manual control</p>
          <p><strong>Position Colors:</strong> QB: Pink (#F472B6), RB: Green (#0fba80), WR: Blue (#4285F4), TE: Purple (#7C3AED)</p>
        </div>
      </div>
    </div>
  );
}
