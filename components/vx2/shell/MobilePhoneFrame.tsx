/**
 * Phone frame for desktop viewing.
 * Fixed dimensions: 375×812 (iPhone standard).
 * Children fill 100% of the screen area.
 */

import React from 'react';

export interface MobilePhoneFrameProps {
  children: React.ReactNode;
}

export function MobilePhoneFrame({ children }: MobilePhoneFrameProps): React.ReactElement {
  return (
    <div
      className="relative bg-black rounded-[3rem] p-3 shadow-2xl"
      style={{
        width: '375px',
        height: '812px',
      }}
      data-phone-frame="true"
    >
      {/* Screen - children fill this completely */}
      <div 
        className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative"
      >
        {/* Dynamic Island - positioned on top of screen content */}
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2"
          style={{
            width: '70px',
            height: '20px',
            backgroundColor: '#000',
            borderRadius: '12px',
            zIndex: 9999,
          }}
          aria-hidden
        />
        {children}
      </div>
      {/* Home indicator */}
      <div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full"
        aria-hidden
      />
    </div>
  );
}

export default MobilePhoneFrame;
