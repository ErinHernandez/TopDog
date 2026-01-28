/**
 * SubHeader - V3 Blue Gradient Bars Component
 * 
 * Consistent blue header bars used throughout the application.
 * 
 * @example
 * ```tsx
 * <SubHeader position="top" height="7px" />
 * ```
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface SubHeaderProps {
  /** Position of the subheader ('top' or 'bottom') */
  position?: 'top' | 'bottom';
  /** Height of the subheader bar */
  height?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const SubHeader: React.FC<SubHeaderProps> = ({ 
  position = 'top', 
  height = '7px',
}): React.ReactElement => {
  return (
    <section 
      className="zoom-resistant"
      style={{ 
        height: height,
        width: '100vw', 
        background: 'url(/wr_blue.png) no-repeat center center', 
        backgroundSize: 'cover', 
        margin: '0', 
        padding: '0',
        transform: 'translateZ(0)',
      }}
    >
      {/* Preload background image for performance */}
      <img 
        src="/wr_blue.png" 
        alt="" 
        style={{ display: 'none' }}
        loading="eager"
      />
    </section>
  );
};

export default SubHeader;
