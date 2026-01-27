/**
 * Phone frame for desktop viewing.
 * Fixed dimensions: 375×812 (iPhone standard) for the inner screen.
 * With default padding (p-3 = 12px), outer box is 399×836 so inner is exactly 375×812.
 *
 * Safe area ends at the bottom of the Dynamic Island (not below it). paddingTop is the
 * distance from the top of the screen to the bottom of the island, so content starts
 * exactly where the safe area ends.
 */

import React from 'react';

const BEZEL_PX = 12;
const INNER_WIDTH_PX = 375;
const INNER_HEIGHT_PX = 812;

/** Top safe area: from screen top to bottom of island (8 + 20). Safe area ends at bottom of island. */
export const SAFE_AREA_TOP_TO_ISLAND_BOTTOM_PX = 28;

export interface MobilePhoneFrameProps {
  children: React.ReactNode;
  /** When true, content starts at 0 so modals can go over safe area. Default false. */
  contentOverSafeArea?: boolean;
}

export function MobilePhoneFrame({ children, contentOverSafeArea = false }: MobilePhoneFrameProps): React.ReactElement {
  const outerW = INNER_WIDTH_PX + BEZEL_PX * 2;
  const outerH = INNER_HEIGHT_PX + BEZEL_PX * 2;
  const contentTop = contentOverSafeArea ? 0 : SAFE_AREA_TOP_TO_ISLAND_BOTTOM_PX;
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
        style={{
          padding: 8,
          boxSizing: 'border-box',
          background: '#000',
        }}
      >
        {/* Dynamic Island - in border zone so it moves with the frame */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: 8,
            width: '70px',
            height: '20px',
            backgroundColor: '#000',
            borderRadius: '12px',
            zIndex: 9999,
          }}
          aria-hidden
        />
        <div 
          className="w-full h-full rounded-[2.125rem] overflow-hidden relative"
          style={{ backgroundColor: '#0f172a' }}
        >
          {/* Content: contentOverSafeArea=0 lets modals go over safe area */}
          <div
          style={{
            paddingTop: contentTop,
            height: '100%',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
        </div>
      </div>
    </div>
  );
}

export default MobilePhoneFrame;
