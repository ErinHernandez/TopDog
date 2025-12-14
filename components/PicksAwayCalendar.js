import React from 'react';

export default function PicksAwayCalendar({ picksAway = 0 }) {
  // Color logic - only change color when on the clock
  let textColor, borderColor, backgroundColor;
  if (picksAway === 0) {
    // Your turn - on the clock
    textColor = '#000000';
    borderColor = '#FCD34D';
    backgroundColor = '#FCD34D';
  } else {
    // Not on the clock - consistent color for all other states
    textColor = '#ffffff';
    borderColor = '#6B7280';
    backgroundColor = '#6B7280';
  }

  return (
    <div style={{
      width: '100px',
      height: '90px',
      backgroundColor: backgroundColor,
      border: `2px solid ${borderColor}`,
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      paddingTop: '4px'
    }}>
      {/* Main Number/Text Display */}
      <div style={{
        fontSize: picksAway === 0 ? '20px' : picksAway === 1 ? '20px' : '32px',
        fontWeight: 'bold',
        color: textColor,
        lineHeight: '1',
        textAlign: 'center',
        marginBottom: '4px'
      }}>
        {picksAway === 0 ? 'ON THE CLOCK' : picksAway === 1 ? 'UP NEXT' : picksAway.toString().padStart(2, '0')}
      </div>

      {/* Picks Away Label - Only show when not on the clock and not "Up Next" */}
      {picksAway !== 0 && picksAway !== 1 && (
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: textColor,
          lineHeight: '1',
          opacity: 0.9,
          textAlign: 'center',
          marginTop: '4px'
        }}>
          PICKS AWAY
        </div>
      )}
    </div>
  );
}