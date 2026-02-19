import React, { useState, useEffect } from 'react';

export default function LongDurationTimer({ initialSeconds = 30, useMonocraft = false, isUserOnClock = false }) {
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

  // Format time based on duration
  const formatTime = (totalSeconds) => {
    if (totalSeconds < 60) {
      // Less than 1 minute - show seconds only
      return `${totalSeconds}s`;
    } else if (totalSeconds < 3600) {
      // Less than 1 hour - show minutes:seconds
      const minutes = Math.floor(totalSeconds / 60);
      const remainingSeconds = totalSeconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      // 1 hour or more - show hours:minutes:seconds
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const remainingSeconds = totalSeconds % 60;
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  const timeDisplay = formatTime(seconds);

  if (useMonocraft) {
    // Color logic based on user status and time remaining
    let color;
    if (!isUserOnClock) {
      color = '#ffffff'; // White when user is not on the clock
    } else if (seconds <= 60) {
      color = '#ff1a1a'; // Red when 1 minute or less and user is on the clock
    } else if (seconds <= 300) {
      color = '#f59e0b'; // Orange when 5 minutes or less and user is on the clock
    } else {
      color = '#10b981'; // Green when user is on the clock and more than 5 minutes
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
        <div style={{
          fontFamily: 'Monocraft, monospace',
          fontSize: timeDisplay.length > 6 ? '24px' : '32px', // Smaller font for longer displays
          color: color,
          textShadow: `0 0 8px ${color}40`,
          textAlign: 'center',
          display: 'inline-block',
          whiteSpace: 'nowrap'
        }}>
          {timeDisplay}
        </div>
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
      minWidth: '64px',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{
        fontFamily: 'Monocraft, monospace',
        fontSize: timeDisplay.length > 6 ? '16px' : '20px',
        color: '#ff1a1a',
        textAlign: 'center'
      }}>
        {timeDisplay}
      </div>
    </div>
  );
}
