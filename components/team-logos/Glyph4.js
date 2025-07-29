import React from 'react';

export default function Glyph4({ size = 64, bgColor = '#f57c00' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect width="100" height="100" fill={bgColor} />
      {/* Stylized lizard glyph in a circle */}
      <circle cx="50" cy="50" r="38" fill="none" stroke="#ffe600" strokeWidth="6" />
      <path d="M35,70 Q25,50 45,40 Q40,25 60,30 Q80,40 70,60 Q90,70 60,80 Q50,90 35,70 Z" fill="#ffe600" />
    </svg>
  );
} 