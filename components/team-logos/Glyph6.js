import React from 'react';

export default function Glyph6({ size = 64, bgColor = '#bdbdbd' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect width="100" height="100" fill={bgColor} />
      {/* Stylized snake glyph */}
      <path d="M20,60 Q30,40 50,50 Q70,60 60,80 Q50,90 30,80 Q10,70 20,60 Z M60,40 Q80,30 80,60 Q80,90 60,80" fill="#ffe600" />
    </svg>
  );
} 