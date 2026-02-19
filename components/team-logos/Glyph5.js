import React from 'react';

export default function Glyph5({ size = 64, bgColor = '#6d28d9' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect width="100" height="100" fill={bgColor} />
      {/* Stylized bird glyph */}
      <path d="M30,80 Q20,60 40,50 Q35,35 55,35 Q75,40 70,60 Q90,70 60,80 Q50,90 30,80 Z M60,50 Q65,45 70,50 Q75,55 70,60 Q65,65 60,60 Q55,55 60,50 Z" fill="#ffe600" />
      <circle cx="50" cy="45" r="6" fill="#ffe600" />
      <rect x="60" y="60" width="18" height="6" rx="3" fill="#ffe600" />
    </svg>
  );
} 