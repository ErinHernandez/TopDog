import React from 'react';

// ============================================================================
// MCM Colors
// ============================================================================

const MCM = {
  bg: '#0A0A0B',
  surface: '#141416',
  line: '#2A2A2E',
  lineActive: '#4A4A50',
  text: '#F0F0F0',
  textMuted: '#888888',
  textDim: '#555555',
  orange: '#FF6B4A',
  teal: '#4ECDC4',
  gold: '#F4B942',
  coral: '#FF8A80',
  sage: '#95D5B2',
};

// ============================================================================
// Wireframe Content SVG (No Phone Frame)
// ============================================================================

interface WireframeContentProps {
  screen: string;
  width?: number;
  height?: number;
}

export const WireframeContent: React.FC<WireframeContentProps> = ({
  screen,
  width = 240,
  height = 500
}) => {
  // Content area (no phone inset needed)
  const screenX = 12;
  const screenY = 12;
  const screenW = width - 24;
  const screenH = height - 24;

  const renderContent = () => {
    switch (screen) {
      case 'Sign In':
        return (
          <>
            <circle cx={screenX + screenW/2} cy={screenY + 42} r={22} stroke={MCM.lineActive} strokeWidth={1.5} fill="none" />
            <circle cx={screenX + screenW/2} cy={screenY + 42} r={4} fill={MCM.orange} />
            <rect x={screenX} y={screenY + 85} width={screenW} height={36} rx={4} stroke={MCM.teal} strokeWidth={1.5} fill="none" />
            <circle cx={screenX} cy={screenY + 103} r={3} fill={MCM.teal} />
            <circle cx={screenX + screenW} cy={screenY + 103} r={3} fill={MCM.teal} />
            <rect x={screenX} y={screenY + 130} width={screenW} height={36} rx={4} stroke={MCM.teal} strokeWidth={1.5} fill="none" />
            <circle cx={screenX} cy={screenY + 148} r={3} fill={MCM.teal} />
            <circle cx={screenX + screenW} cy={screenY + 148} r={3} fill={MCM.teal} />
            <line x1={screenX} y1={screenY + 180} x2={screenX + screenW} y2={screenY + 180} stroke={MCM.line} strokeWidth={1} strokeDasharray="4 2" />
            <rect x={screenX} y={screenY + 210} width={screenW} height={40} rx={6} stroke={MCM.orange} strokeWidth={1.5} fill="none" />
            <circle cx={screenX} cy={screenY + 230} r={3} fill={MCM.orange} />
            <circle cx={screenX + screenW} cy={screenY + 230} r={3} fill={MCM.orange} />
            <line x1={screenX + screenW/2 - 30} y1={screenY + 280} x2={screenX + screenW/2 + 30} y2={screenY + 280} stroke={MCM.lineActive} strokeWidth={1} />
          </>
        );

      case 'Sign Up':
        return (
          <>
            <circle cx={screenX + screenW/2} cy={screenY + 28} r={18} stroke={MCM.lineActive} strokeWidth={1.5} fill="none" />
            <circle cx={screenX + screenW/2} cy={screenY + 28} r={4} fill={MCM.orange} />
            <line x1={screenX + 30} y1={screenY + 60} x2={screenX + screenW - 30} y2={screenY + 60} stroke={MCM.lineActive} strokeWidth={1} />
            <rect x={screenX} y={screenY + 80} width={screenW} height={32} rx={4} stroke={MCM.teal} strokeWidth={1.5} fill="none" />
            <rect x={screenX} y={screenY + 120} width={screenW} height={32} rx={4} stroke={MCM.teal} strokeWidth={1.5} fill="none" />
            <rect x={screenX} y={screenY + 160} width={screenW} height={32} rx={4} stroke={MCM.teal} strokeWidth={1.5} fill="none" />
            <rect x={screenX} y={screenY + 210} width={screenW} height={36} rx={6} stroke={MCM.orange} strokeWidth={1.5} fill="none" />
            <rect x={screenX} y={screenY + 260} width={screenW} height={50} rx={4} stroke={MCM.line} strokeWidth={1} strokeDasharray="4 2" fill="none" />
          </>
        );

      case 'Lobby':
        return (
          <>
            <rect x={screenX} y={screenY + 10} width={screenW} height={200} rx={8} stroke={MCM.lineActive} strokeWidth={1.5} fill="none" />
            <circle cx={screenX} cy={screenY + 18} r={4} fill={MCM.teal} />
            <circle cx={screenX + screenW} cy={screenY + 18} r={4} fill={MCM.teal} />
            <circle cx={screenX + screenW} cy={screenY + 202} r={4} fill={MCM.teal} />
            <circle cx={screenX} cy={screenY + 202} r={4} fill={MCM.teal} />
            <circle cx={screenX + screenW/2} cy={screenY + 75} r={25} stroke={MCM.lineActive} strokeWidth={1} fill="none" />
            <circle cx={screenX + screenW/2} cy={screenY + 75} r={4} fill={MCM.gold} />
            <rect x={screenX + 15} y={screenY + 120} width={screenW - 30} height={6} rx={3} fill={MCM.line} />
            <rect x={screenX + 15} y={screenY + 120} width={(screenW - 30) * 0.7} height={6} rx={3} fill={MCM.orange} />
            <rect x={screenX + 15} y={screenY + 140} width={screenW - 30} height={32} rx={6} stroke={MCM.orange} strokeWidth={1.5} fill="none" />
            <circle cx={screenX + 35} cy={screenY + 185} r={4} fill={MCM.gold} />
            <circle cx={screenX + screenW/2} cy={screenY + 185} r={4} fill={MCM.gold} />
            <circle cx={screenX + screenW - 35} cy={screenY + 185} r={4} fill={MCM.gold} />
            <rect x={screenX} y={screenY + screenH - 45} width={screenW} height={40} stroke={MCM.line} strokeWidth={1} fill="none" />
            {[0,1,2,3,4].map(i => <circle key={i} cx={screenX + (i * screenW/5) + screenW/10} cy={screenY + screenH - 25} r={5} fill={i === 0 ? MCM.orange : MCM.textDim} />)}
          </>
        );

      case 'Live Drafts':
        return (
          <>
            <line x1={screenX + 20} y1={screenY + 15} x2={screenX + screenW - 20} y2={screenY + 15} stroke={MCM.lineActive} strokeWidth={1} />
            <rect x={screenX} y={screenY + 35} width={screenW} height={85} rx={6} stroke={MCM.lineActive} strokeWidth={1.5} fill="none" />
            <circle cx={screenX} cy={screenY + 41} r={4} fill={MCM.gold} />
            <circle cx={screenX + screenW} cy={screenY + 41} r={4} fill={MCM.gold} />
            <rect x={screenX + 10} y={screenY + 102} width={screenW - 20} height={5} rx={2} fill={MCM.line} />
            <rect x={screenX + 10} y={screenY + 102} width={(screenW - 20) * 0.66} height={5} rx={2} fill={MCM.orange} />
            <rect x={screenX} y={screenY + 135} width={screenW} height={85} rx={6} stroke={MCM.lineActive} strokeWidth={1.5} fill="none" />
            <circle cx={screenX} cy={screenY + 141} r={4} fill={MCM.sage} />
            <circle cx={screenX + screenW} cy={screenY + 141} r={4} fill={MCM.sage} />
            <rect x={screenX} y={screenY + screenH - 45} width={screenW} height={40} stroke={MCM.line} strokeWidth={1} fill="none" />
            {[0,1,2,3,4].map(i => <circle key={i} cx={screenX + (i * screenW/5) + screenW/10} cy={screenY + screenH - 25} r={5} fill={i === 1 ? MCM.orange : MCM.textDim} />)}
          </>
        );

      case 'Draft: Players':
        return (
          <>
            <rect x={screenX} y={screenY} width={screenW} height={28} stroke={MCM.line} strokeWidth={1} fill="none" />
            {[0,1,2,3,4].map(i => <circle key={i} cx={screenX + (i * screenW/5) + screenW/10} cy={screenY + 14} r={3} fill={i === 0 ? MCM.orange : MCM.textDim} />)}
            <rect x={screenX} y={screenY + 38} width={screenW} height={28} rx={4} stroke={MCM.teal} strokeWidth={1.5} fill="none" />
            {[0,1,2,3,4].map(i => <rect key={i} x={screenX + i * 36} y={screenY + 76} width={32} height={18} rx={9} stroke={i === 0 ? MCM.orange : MCM.line} strokeWidth={1} fill="none" />)}
            {[MCM.coral, MCM.sage, MCM.gold, MCM.teal, MCM.coral].map((color, i) => (
              <g key={i}>
                <rect x={screenX} y={screenY + 110 + i * 38} width={screenW} height={34} rx={4} stroke={MCM.line} strokeWidth={1} fill="none" />
                <circle cx={screenX + 12} cy={screenY + 127 + i * 38} r={4} fill={color} />
                <line x1={screenX + 24} y1={screenY + 127 + i * 38} x2={screenX + 80} y2={screenY + 127 + i * 38} stroke={MCM.lineActive} strokeWidth={1} />
              </g>
            ))}
            <rect x={screenX} y={screenY + screenH - 50} width={screenW} height={45} stroke={MCM.lineActive} strokeWidth={1} fill="none" />
            <rect x={screenX + 8} y={screenY + screenH - 14} width={screenW - 50} height={5} rx={2} fill={MCM.line} />
            <rect x={screenX + 8} y={screenY + screenH - 14} width={(screenW - 50) * 0.6} height={5} rx={2} fill={MCM.orange} />
          </>
        );

      case 'Draft: Roster':
        return (
          <>
            <rect x={screenX} y={screenY} width={screenW} height={28} stroke={MCM.line} strokeWidth={1} fill="none" />
            {[0,1,2,3,4].map(i => <circle key={i} cx={screenX + (i * screenW/5) + screenW/10} cy={screenY + 14} r={3} fill={i === 2 ? MCM.orange : MCM.textDim} />)}
            {[MCM.coral, MCM.sage, MCM.sage, MCM.gold, MCM.gold, MCM.gold, MCM.teal, MCM.lineActive].map((color, i) => (
              <g key={i}>
                <rect x={screenX} y={screenY + 40 + i * 34} width={screenW} height={30} rx={4} stroke={color} strokeWidth={i < 3 ? 1.5 : 1} strokeDasharray={i < 3 ? undefined : '4 2'} fill="none" opacity={i < 3 ? 1 : 0.4} />
                <circle cx={screenX + 12} cy={screenY + 55 + i * 34} r={4} fill={color} />
                {i < 3 && <line x1={screenX + 24} y1={screenY + 55 + i * 34} x2={screenX + 80} y2={screenY + 55 + i * 34} stroke={MCM.lineActive} strokeWidth={1} />}
              </g>
            ))}
            <rect x={screenX} y={screenY + screenH - 50} width={screenW} height={45} stroke={MCM.lineActive} strokeWidth={1} fill="none" />
          </>
        );

      case 'Profile':
        return (
          <>
            <rect x={screenX} y={screenY + 15} width={screenW} height={60} rx={6} stroke={MCM.lineActive} strokeWidth={1.5} fill="none" />
            <circle cx={screenX + 28} cy={screenY + 45} r={18} stroke={MCM.lineActive} strokeWidth={1} fill="none" />
            <circle cx={screenX + 28} cy={screenY + 45} r={4} fill={MCM.teal} />
            <line x1={screenX + 55} y1={screenY + 37} x2={screenX + screenW - 15} y2={screenY + 37} stroke={MCM.lineActive} strokeWidth={1} />
            <line x1={screenX + 55} y1={screenY + 53} x2={screenX + screenW - 40} y2={screenY + 53} stroke={MCM.lineActive} strokeWidth={1} />
            {[0,1,2,3,4,5].map(i => (
              <g key={i}>
                <rect x={screenX} y={screenY + 95 + i * 36} width={screenW} height={32} rx={4} stroke={MCM.line} strokeWidth={1} fill="none" />
                <circle cx={screenX + 14} cy={screenY + 111 + i * 36} r={3} fill={MCM.gold} />
                <line x1={screenX + 26} y1={screenY + 111 + i * 36} x2={screenX + 90} y2={screenY + 111 + i * 36} stroke={MCM.lineActive} strokeWidth={1} />
              </g>
            ))}
            <rect x={screenX} y={screenY + screenH - 95} width={screenW} height={36} rx={6} stroke={MCM.orange} strokeWidth={1.5} fill="none" />
            <circle cx={screenX} cy={screenY + screenH - 77} r={3} fill={MCM.orange} />
            <circle cx={screenX + screenW} cy={screenY + screenH - 77} r={3} fill={MCM.orange} />
            <rect x={screenX} y={screenY + screenH - 45} width={screenW} height={40} stroke={MCM.line} strokeWidth={1} fill="none" />
            {[0,1,2,3,4].map(i => <circle key={i} cx={screenX + (i * screenW/5) + screenW/10} cy={screenY + screenH - 25} r={5} fill={i === 4 ? MCM.orange : MCM.textDim} />)}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Simple border instead of phone frame */}
      <rect x={0} y={0} width={width} height={height} rx={8} stroke={MCM.line} strokeWidth={1} fill="none" />

      {/* Screen content */}
      {renderContent()}
    </svg>
  );
};

export default WireframeContent;
