/**
 * DraftSubHeader - Draft Room Specific Blue Gradient Bars
 * 
 * This is completely independent from the main app SubHeader component
 * to prevent cross-contamination between draft room and non-draft contexts.
 * 
 * Changes to this component will ONLY affect draft rooms.
 */

import React from 'react';

const DraftSubHeader = ({ 
  position = 'top', 
  height = '7px',
  className = '',
  style = {}
}) => {
  return (
    <section 
      className={`draft-subheader zoom-resistant ${className}`}
      style={{ 
        height: height,
        width: '100vw', 
        background: 'url(/wr_blue.png) no-repeat center center', 
        backgroundSize: 'cover', 
        margin: '0', 
        padding: '0',
        transform: 'translateZ(0)',
        ...style
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

export default DraftSubHeader;
