/**
 * DraftSubHeaderMobile - Mobile Draft Room Specific Blue Gradient Bars
 * 
 * This is completely independent from the main app SubHeader component
 * to prevent cross-contamination between draft room and non-draft contexts.
 * 
 * Changes to this component will ONLY affect mobile draft rooms.
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface DraftSubHeaderMobileProps {
  /** Position of the header (default: "top") */
  position?: 'top' | 'bottom';
  /** Height of the header (default: "7px") */
  height?: string;
  /** Additional CSS classes */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

// ============================================================================
// COMPONENT
// ============================================================================

const DraftSubHeaderMobile: React.FC<DraftSubHeaderMobileProps> = ({ 
  position = 'top', 
  height = '7px',
  className = '',
  style = {},
}): React.ReactElement => {
  return (
    <section 
      className={`draft-mobile-subheader zoom-resistant ${className}`}
      style={{ 
        height: height,
        width: '100vw', 
        background: 'url(/wr_blue.png) no-repeat center center', 
        backgroundSize: 'cover', 
        margin: '0', 
        padding: '0',
        transform: 'translateZ(0)',
        ...style,
      }}
    >
      {/* Preload background image for performance */}
      <img 
        src="/wr_blue.png" 
        alt="" 
        style={{ display: 'none' }}
        loading="eager"
        aria-hidden="true"
      />
    </section>
  );
};

export default DraftSubHeaderMobile;
