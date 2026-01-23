/**
 * Phone frame for desktop viewing.
 * Fixed dimensions matching iPhone 15 (393×852 logical pixels).
 * Used when _app wraps content on desktop; mobile renders fullscreen without frame.
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
        width: '393px',
        height: '852px',
      }}
    >
      {/* Notch */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10"
        aria-hidden
      />
      {/* Screen */}
      <div 
        className="w-full h-full rounded-[2.5rem] overflow-hidden relative"
        style={{ backgroundColor: '#101927' }}
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
