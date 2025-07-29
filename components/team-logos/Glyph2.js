import React from 'react';

export default function Glyph2({ size = 64, bgColor = '#2563eb' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect width="100" height="100" fill={bgColor} />
      {/* Stylized fish glyphs */}
      <g fill="#ffe600">
        <path d="M20,30 Q40,20 70,30 Q80,35 70,40 Q40,50 20,40 Q10,35 20,30 Z" />
        <circle cx="65" cy="32" r="2" />
        <path d="M20,60 Q40,50 70,60 Q80,65 70,70 Q40,80 20,70 Q10,65 20,60 Z" />
        <circle cx="65" cy="62" r="2" />
      </g>
    </svg>
  );
} 