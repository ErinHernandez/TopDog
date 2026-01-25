/**
 * Phone frame for desktop viewing.
 * Fixed dimensions: 375×812 (iPhone standard) for the inner screen.
 * With default padding (p-3 = 12px), outer box is 399×836 so inner is exactly 375×812.
 */

import React from 'react';

const BEZEL_PX = 12;
const INNER_WIDTH_PX = 375;
const INNER_HEIGHT_PX = 812;

export interface MobilePhoneFrameProps {
  children: React.ReactNode;
}

export function MobilePhoneFrame({ children }: MobilePhoneFrameProps): React.ReactElement {
  const outerW = INNER_WIDTH_PX + BEZEL_PX * 2;
  const outerH = INNER_HEIGHT_PX + BEZEL_PX * 2;
  return (
    <div
      className="relative bg-black rounded-[3rem] shadow-2xl"
      style={{
        width: `${outerW}px`,
        height: `${outerH}px`,
        padding: `${BEZEL_PX}px`,
        boxSizing: 'border-box',
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
