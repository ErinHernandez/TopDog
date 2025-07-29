import React from 'react';

export default function Glyph1({ size = 64, bgColor = '#d32f2f' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect width="100" height="100" fill={bgColor} />
      {/* Stylized dog glyph */}
      <path d="M20,80 Q10,60 30,50 Q25,30 50,20 Q75,10 80,40 Q90,60 60,80 Q40,90 20,80 Z M35,60 Q40,55 45,60 Q50,65 55,60 Q60,55 65,60" fill="#ffe600" />
      <circle cx="35" cy="40" r="4" fill="#ffe600" />
      <circle cx="60" cy="30" r="3" fill="#ffe600" />
      <circle cx="70" cy="55" r="2.5" fill="#ffe600" />
    </svg>
  );
} 