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
      {/* Notch */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10"
        aria-hidden
      />
      {/* Screen - children fill this completely */}
      <div 
        className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative"
      >
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
