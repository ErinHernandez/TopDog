import React, { useState, useEffect } from 'react';

export default function FreshCountdownTimer({ initialSeconds = 30 }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [seconds]);

  // Always show two digits
  const display = String(seconds).padStart(2, '0');
  const tens = parseInt(display[0]);
  const ones = parseInt(display[1]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '4px',
      padding: '0',
      margin: '0'
    }}>
      <div style={{
        fontFamily: 'Monocraft, monospace',
        fontSize: '48px',
        color: '#ff1a1a',
        textShadow: '0 0 8px rgba(255, 26, 26, 0.6)',
        textAlign: 'center',
        display: 'inline-block'
      }}>
        {tens}
      </div>
      <div style={{
        fontFamily: 'Monocraft, monospace',
        fontSize: '48px',
        color: '#ff1a1a',
        textShadow: '0 0 8px rgba(255, 26, 26, 0.6)',
        textAlign: 'center',
        display: 'inline-block'
      }}>
        {ones}
      </div>
    </div>
  );
} 