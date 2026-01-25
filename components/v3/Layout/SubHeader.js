/**
 * SubHeader - V3 Blue Gradient Bars Component
 * Consistent blue header bars used throughout the application
 */

import React from 'react';

const SubHeader = ({ position = 'top', height = '7px' }) => {
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
        transform: 'translateZ(0)'
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
