import React from 'react';

export default function Glyph3({ size = 64, bgColor = '#388e3c' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect width="100" height="100" fill={bgColor} />
      {/* Stylized monkey glyph */}
      <path d="M30,70 Q20,50 40,40 Q35,25 55,25 Q75,30 70,50 Q90,60 60,80 Q50,90 30,70 Z M60,40 Q65,35 70,40 Q75,45 70,50 Q65,55 60,50 Q55,45 60,40 Z" fill="#ffe600" />
      <circle cx="50" cy="35" r="4" fill="#ffe600" />
      <circle cx="65" cy="55" r="2.5" fill="#ffe600" />
    </svg>
  );
} 