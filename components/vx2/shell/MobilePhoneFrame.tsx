/**
 * Phone frame for desktop viewing.
 * Fixed dimensions: 375×812 (iPhone standard) for the inner screen.
 * With default padding (p-3 = 12px), outer box is 399×836 so inner is exactly 375×812.
 *
 * Safe area ends at the bottom of the Dynamic Island (not below it). paddingTop is the
 * distance from the top of the screen to the bottom of the island, so content starts
 * exactly where the safe area ends.
 *
 * Migrated to CSS Modules for CSP compliance.
 */

import React from 'react';
import { cn } from '@/lib/styles';
import styles from './MobilePhoneFrame.module.css';

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

  const frameStyle: React.CSSProperties = {
    '--frame-outer-width': `${outerW}px`,
    '--frame-outer-height': `${outerH}px`,
    '--bezel-px': `${BEZEL_PX}px`,
  } as React.CSSProperties;

  const innerStyle: React.CSSProperties = {
    '--inner-bg': '#101927',
    '--safe-area-height': `${contentTop}px`,
    '--content-top': `${contentTop}px`,
  } as React.CSSProperties;

  return (
    <div
      className={styles.frame}
      style={frameStyle}
      data-phone-frame="true"
    >
      {/* Screen - dark bg so rounded corners don't show white at top-left/top-right of bezel */}
      <div className={styles.screen}>
        {/* Dynamic Island - in border zone so it moves with the frame */}
        <div
          className={styles.dynamicIsland}
          aria-hidden
        />
        <div className={styles.innerScreen} style={innerStyle}>
          {/* Safe area - matches background color */}
          {!contentOverSafeArea && (
            <div
              className={styles.safeArea}
              style={innerStyle}
              aria-hidden="true"
            />
          )}
          {/* Content: contentOverSafeArea=0 lets modals go over safe area */}
          <div
            className={cn(
              styles.contentContainer,
              contentOverSafeArea && styles.contentContainerNoSafeArea
            )}
            style={innerStyle}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobilePhoneFrame;
