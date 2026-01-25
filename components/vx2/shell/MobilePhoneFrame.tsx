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
      {/* Screen - dark bg so rounded corners don’t show white at top-left/top-right of bezel */}
      <div 
        className="w-full h-full rounded-[2.5rem] overflow-hidden relative"
        style={{ backgroundColor: '#0f172a' }}
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
    </div>
  );
}

export default MobilePhoneFrame;
