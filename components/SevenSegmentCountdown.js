import React, { useEffect, useState } from 'react';
import LongDurationTimer from './LongDurationTimer';

// Map of which segments are on for each digit (0-9)
const SEGMENTS = [
  [1,1,1,1,1,1,0], // 0
  [0,1,1,0,0,0,0], // 1
  [1,1,0,1,1,0,1], // 2
  [1,1,1,1,0,0,1], // 3
  [0,1,1,0,0,1,1], // 4
  [1,0,1,1,0,1,1], // 5
  [1,0,1,1,1,1,1], // 6
  [1,1,1,0,0,0,0], // 7
  [1,1,1,1,1,1,1], // 8
  [1,1,1,1,0,1,1], // 9
];

// Each segment is a polygon (x,y) points for SVG
const SEGMENT_SHAPES = [
  // Top
  '10,5 40,5 35,10 15,10',
  // Top right
  '40,5 45,10 45,40 40,45 35,40 35,10',
  // Bottom right
  '40,45 45,50 45,80 40,85 35,80 35,50',
  // Bottom
  '10,85 40,85 35,80 15,80',
  // Bottom left
  '10,45 15,50 15,80 10,85 5,80 5,50',
  // Top left
  '10,5 15,10 15,40 10,45 5,40 5,10',
  // Middle
  '10,45 35,45 40,50 35,50 10,50 5,45',
];

function Digit({ value }) {
  const segments = SEGMENTS[value];
  return (
    <svg width="30" height="54" viewBox="0 0 50 90">
      <rect x="0" y="0" width="50" height="90" rx="8" fill="#111" />
      {SEGMENT_SHAPES.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill={segments[i] ? '#ff1a1a' : '#222'}
          stroke="#330000"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

// Monocraft text-based digit component
function MonocraftDigit({ value, color = '#ff1a1a' }) {
  const textShadow = color === '#ffffff' ? 'none' : `0 0 4px ${color}80`;
  return (
    <div 
      style={{
        fontFamily: 'Monocraft, monospace',
        fontSize: '46px',
        color: color,
        textShadow: textShadow,
        textAlign: 'center',
        display: 'inline-block'
      }}
    >
      {value}
    </div>
  );
}

export default function SevenSegmentCountdown({ initialSeconds = 29, useMonocraft = false, isUserOnClock = false }) {
  // All hooks must be called before any early returns
  const [seconds, setSeconds] = useState(initialSeconds);

  // Update local state when prop changes
  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [seconds]);

  // For long durations (over 99 seconds), use the LongDurationTimer - AFTER all hooks
  if (initialSeconds > 99) {
    return <LongDurationTimer initialSeconds={initialSeconds} useMonocraft={useMonocraft} isUserOnClock={isUserOnClock} />;
  }

  // Always show two digits
  const display = String(seconds).padStart(2, '0');
  const tens = parseInt(display[0]);
  const ones = parseInt(display[1]);

  if (useMonocraft) {
    // Color logic based on user status and time remaining
    let color;
    if (!isUserOnClock) {
      color = '#ffffff'; // White when user is not on the clock
    } else if (seconds <= 10) {
      color = '#ff1a1a'; // Red when 10 seconds or less and user is on the clock
    } else {
      color = '#10b981'; // Green when user is on the clock and more than 10 seconds (11s-30s)
    }
    
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '2px',
        padding: '0',
        margin: '0'
      }}>
        <MonocraftDigit value={tens} color={color} />
        <MonocraftDigit value={ones} color={color} />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      background: '#000',
      borderRadius: 7.2,
      padding: '4.8px 7.2px',
      boxShadow: '0 1.2px 7.2px #0008',
      width: '64px',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Digit value={tens} />
      <Digit value={ones} />
    </div>
  );
} 