import Head from 'next/head';
import React, { useState, useRef, useEffect } from 'react';

// ============================================================================
// Mid-Century Modern Design System (MCM) - Original SwiftUI Port
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

const getColorForType = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'button': return MCM.orange;
    case 'textfield':
    case 'securefield': return MCM.teal;
    case 'text':
    case 'label': return MCM.gold;
    case 'image':
    case 'icon': return MCM.coral;
    case 'tab':
    case 'tabbar': return MCM.sage;
    case 'card': return MCM.teal;
    case 'progress': return MCM.orange;
    case 'badge': return MCM.gold;
    case 'list': return MCM.lineActive;
    case 'link': return MCM.textMuted;
    case 'checkbox': return MCM.lineActive;
    case 'segmented': return MCM.sage;
    default: return MCM.lineActive;
  }
};

// ============================================================================
// Data Types
// ============================================================================

interface Annotation {
  id: string;
  name: string;
  type: string;
  notes?: string;
  y: number;
  side: 'left' | 'right';
}

interface WireframeScreen {
  title: string;
  annotations: Annotation[];
}

// ============================================================================
// Screen Data
// ============================================================================

const screens: WireframeScreen[] = [
  {
    title: 'Sign In',
    annotations: [
      { id: '1', name: 'Logo', type: 'Image', notes: 'TopDog mark', y: 0.12, side: 'left' },
      { id: '2', name: 'Email/Phone', type: 'TextField', notes: 'Blue border focus', y: 0.28, side: 'left' },
      { id: '3', name: 'Password', type: 'SecureField', notes: 'Eye toggle', y: 0.38, side: 'left' },
      { id: '4', name: 'Remember Me', type: 'Checkbox', y: 0.50, side: 'left' },
      { id: '5', name: 'Forgot?', type: 'Link', notes: '-> Reset flow', y: 0.50, side: 'right' },
      { id: '6', name: 'Sign In', type: 'Button', notes: 'Primary CTA', y: 0.60, side: 'right' },
      { id: '7', name: 'Sign Up Link', type: 'Link', y: 0.78, side: 'right' },
    ],
  },
  {
    title: 'Sign Up',
    annotations: [
      { id: '1', name: 'Logo', type: 'Image', y: 0.08, side: 'left' },
      { id: '2', name: 'Header', type: 'Text', notes: 'Create account', y: 0.16, side: 'left' },
      { id: '3', name: 'Email', type: 'TextField', y: 0.26, side: 'left' },
      { id: '4', name: 'Password', type: 'SecureField', notes: 'Live validation', y: 0.36, side: 'left' },
      { id: '5', name: 'Confirm', type: 'SecureField', y: 0.46, side: 'left' },
      { id: '6', name: 'Continue', type: 'Button', y: 0.58, side: 'right' },
      { id: '7', name: 'Requirements', type: 'Card', notes: 'Password rules', y: 0.72, side: 'right' },
    ],
  },
  {
    title: 'Lobby',
    annotations: [
      { id: '1', name: 'Tournament Card', type: 'Card', y: 0.18, side: 'left' },
      { id: '2', name: 'Globe Graphic', type: 'Image', notes: '3D unique art', y: 0.26, side: 'left' },
      { id: '3', name: 'Progress Bar', type: 'Progress', notes: 'Entries %', y: 0.38, side: 'left' },
      { id: '4', name: 'Join Button', type: 'Button', notes: 'Primary CTA', y: 0.46, side: 'right' },
      { id: '5', name: 'Entry Fee', type: 'Text', notes: '$25', y: 0.54, side: 'left' },
      { id: '6', name: 'Prize Pool', type: 'Text', notes: '$2.1M', y: 0.54, side: 'right' },
      { id: '7', name: 'Tab Bar', type: 'TabBar', notes: '5 tabs', y: 0.92, side: 'right' },
    ],
  },
  {
    title: 'Live Drafts',
    annotations: [
      { id: '1', name: 'Title', type: 'Text', notes: 'Live Drafts', y: 0.06, side: 'left' },
      { id: '2', name: 'Fast Draft Card', type: 'Card', notes: '30s timer', y: 0.20, side: 'left' },
      { id: '3', name: 'Badge', type: 'Badge', notes: 'FAST DRAFT', y: 0.15, side: 'right' },
      { id: '4', name: 'Timer', type: 'Text', notes: 'Countdown', y: 0.28, side: 'right' },
      { id: '5', name: 'Progress', type: 'Progress', y: 0.32, side: 'left' },
      { id: '6', name: 'Slow Draft Card', type: 'Card', notes: '12h timer', y: 0.50, side: 'left' },
      { id: '7', name: 'Tab Bar', type: 'TabBar', y: 0.92, side: 'right' },
    ],
  },
  {
    title: 'Draft: Players',
    annotations: [
      { id: '1', name: 'Top Tabs', type: 'TabBar', notes: '5 draft tabs', y: 0.06, side: 'left' },
      { id: '2', name: 'Search', type: 'TextField', y: 0.14, side: 'left' },
      { id: '3', name: 'Position Pills', type: 'Segmented', notes: 'ALL/QB/RB/WR/TE', y: 0.22, side: 'right' },
      { id: '4', name: 'Player Row', type: 'List', notes: 'Tap = draft/queue', y: 0.42, side: 'left' },
      { id: '5', name: 'Position Badge', type: 'Badge', notes: 'Colored', y: 0.36, side: 'right' },
      { id: '6', name: 'ADP / Proj', type: 'Text', y: 0.50, side: 'right' },
      { id: '7', name: 'Timer Bar', type: 'Progress', notes: 'Pick countdown', y: 0.90, side: 'left' },
    ],
  },
  {
    title: 'Draft: Roster',
    annotations: [
      { id: '1', name: 'Top Tabs', type: 'TabBar', y: 0.06, side: 'left' },
      { id: '2', name: 'QB Slot', type: 'Card', notes: 'Pink', y: 0.16, side: 'left' },
      { id: '3', name: 'RB Slots', type: 'Card', notes: 'Green x 2', y: 0.26, side: 'left' },
      { id: '4', name: 'WR Slots', type: 'Card', notes: 'Yellow x 3', y: 0.40, side: 'right' },
      { id: '5', name: 'TE Slot', type: 'Card', notes: 'Purple', y: 0.54, side: 'right' },
      { id: '6', name: 'FLEX Slot', type: 'Card', notes: '3-stripe', y: 0.62, side: 'left' },
      { id: '7', name: 'Bench Slots', type: 'Card', notes: 'Gray x 4', y: 0.74, side: 'right' },
      { id: '8', name: 'Position Tracker', type: 'Card', y: 0.90, side: 'left' },
    ],
  },
  {
    title: 'Profile',
    annotations: [
      { id: '1', name: 'User Card', type: 'Card', y: 0.12, side: 'left' },
      { id: '2', name: 'Avatar', type: 'Image', y: 0.10, side: 'right' },
      { id: '3', name: 'Username', type: 'Text', y: 0.14, side: 'right' },
      { id: '4', name: 'Balance', type: 'Text', notes: 'Current funds', y: 0.18, side: 'left' },
      { id: '5', name: 'Menu List', type: 'List', notes: 'Settings nav', y: 0.45, side: 'left' },
      { id: '6', name: 'Chevrons', type: 'Icon', notes: '->', y: 0.45, side: 'right' },
      { id: '7', name: 'Add Funds', type: 'Button', notes: '-> Deposit', y: 0.78, side: 'right' },
      { id: '8', name: 'Tab Bar', type: 'TabBar', y: 0.92, side: 'left' },
    ],
  },
];

// ============================================================================
// Atomic Logo Component (MCM Style)
// ============================================================================

const AtomicLogo: React.FC<{ size?: number }> = ({ size = 36 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const center = size / 2;
    const radius = size / 2 - 2;

    ctx.clearRect(0, 0, size, size);

    // Outer ring
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = MCM.orange;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center node
    ctx.beginPath();
    ctx.arc(center, center, 4, 0, Math.PI * 2);
    ctx.fillStyle = MCM.orange;
    ctx.fill();

    // Orbital nodes
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3 - Math.PI / 2;
      const x = center + (radius - 4) * Math.cos(angle);
      const y = center + (radius - 4) * Math.sin(angle);

      // Connecting line
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(x, y);
      ctx.strokeStyle = `${MCM.orange}66`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Node
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = MCM.orange;
      ctx.fill();
    }
  }, [size]);

  return <canvas ref={canvasRef} width={size} height={size} />;
};

// ============================================================================
// MCM Toggle Component
// ============================================================================

const MCMToggle: React.FC<{ isOn: boolean; onToggle: () => void }> = ({ isOn, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: MCM.surface,
        border: `1.5px solid ${isOn ? MCM.orange : MCM.line}`,
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          backgroundColor: isOn ? MCM.orange : MCM.textDim,
          position: 'absolute',
          top: 4,
          left: isOn ? 26 : 4,
          transition: 'all 0.2s ease',
        }}
      />
    </button>
  );
};

// ============================================================================
// Header Component
// ============================================================================

const Header: React.FC<{
  showAnnotations: boolean;
  onToggle: () => void;
}> = ({ showAnnotations, onToggle }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        backgroundColor: MCM.surface,
        borderBottom: `1px solid ${MCM.line}`,
        position: 'relative',
      }}
    >
      {/* MCM accent line */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: 80,
          height: 2,
          backgroundColor: MCM.orange,
        }}
      />

      {/* Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <AtomicLogo size={36} />
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 4,
              color: MCM.text,
            }}
          >
            TOPDOG
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: MCM.textMuted,
            }}
          >
            iOSx Developer Wireframes
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: 1,
            color: showAnnotations ? MCM.orange : MCM.textMuted,
          }}
        >
          {showAnnotations ? 'ANNOTATIONS ON' : 'WIREFRAME ONLY'}
        </span>
        <MCMToggle isOn={showAnnotations} onToggle={onToggle} />
      </div>
    </div>
  );
};

// ============================================================================
// Screen Selector Component
// ============================================================================

const ScreenSelector: React.FC<{
  selectedIndex: number;
  onSelect: (index: number) => void;
}> = ({ selectedIndex, onSelect }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 20px',
        backgroundColor: `${MCM.bg}cc`,
        overflowX: 'auto',
      }}
    >
      {screens.map((screen, i) => (
        <React.Fragment key={screen.title}>
          <button
            onClick={() => onSelect(i)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 5,
              padding: '0 14px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: selectedIndex === i ? 600 : 400,
                color: selectedIndex === i ? MCM.text : MCM.textDim,
              }}
            >
              {screen.title}
            </span>
            {/* MCM indicator - diamond for selected, circle for others */}
            {selectedIndex === i ? (
              <div
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: MCM.orange,
                  transform: 'rotate(45deg)',
                }}
              />
            ) : (
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: MCM.line,
                }}
              />
            )}
          </button>
          {/* Connecting line */}
          {i < screens.length - 1 && (
            <div
              style={{
                width: 20,
                height: 1,
                backgroundColor: MCM.line,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ============================================================================
// Phone Wireframe Canvas Component
// ============================================================================

const PhoneWireframe: React.FC<{
  title: string;
  width: number;
  height: number;
}> = ({ title, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawScreenContent = (
    ctx: CanvasRenderingContext2D,
    rect: { x: number; y: number; width: number; height: number },
    screenTitle: string
  ) => {
    const drawNode = (x: number, y: number, color: string, radius = 4) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    };

    const drawLine = (x1: number, y1: number, x2: number, y2: number, dashed = false) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      if (dashed) {
        ctx.setLineDash([4, 2]);
        ctx.strokeStyle = MCM.line;
      } else {
        ctx.setLineDash([]);
        ctx.strokeStyle = MCM.lineActive;
      }
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawField = (x: number, y: number, w: number, h: number) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4);
      ctx.strokeStyle = MCM.teal;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      drawNode(x, y + h / 2, MCM.teal, 3);
      drawNode(x + w, y + h / 2, MCM.teal, 3);
    };

    const drawButton = (x: number, y: number, w: number, h: number) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.strokeStyle = MCM.orange;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      drawNode(x, y + h / 2, MCM.orange, 3);
      drawNode(x + w, y + h / 2, MCM.orange, 3);
    };

    const drawTabBar = (x: number, y: number, w: number, h: number, activeIndex: number) => {
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.strokeStyle = MCM.line;
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let i = 0; i < 5; i++) {
        const tabX = x + (i * w) / 5 + w / 10;
        drawNode(tabX, y + h / 2, i === activeIndex ? MCM.orange : MCM.textDim, 5);
      }
    };

    switch (screenTitle) {
      case 'Sign In': {
        // Logo circle
        const logoX = rect.x + rect.width / 2;
        const logoY = rect.y + 42;
        ctx.beginPath();
        ctx.arc(logoX, logoY, 22, 0, Math.PI * 2);
        ctx.strokeStyle = MCM.lineActive;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        drawNode(logoX, logoY, MCM.orange);

        // Email field
        drawField(rect.x, rect.y + 85, rect.width, 36);

        // Password field
        drawField(rect.x, rect.y + 130, rect.width, 36);

        // Remember + Forgot line
        drawLine(rect.x, rect.y + 180, rect.x + rect.width, rect.y + 180, true);

        // Sign In button
        drawButton(rect.x, rect.y + 210, rect.width, 40);

        // Sign Up link
        drawLine(rect.x + rect.width / 2 - 30, rect.y + 280, rect.x + rect.width / 2 + 30, rect.y + 280);
        break;
      }

      case 'Sign Up': {
        // Logo
        const logoX = rect.x + rect.width / 2;
        const logoY = rect.y + 28;
        ctx.beginPath();
        ctx.arc(logoX, logoY, 18, 0, Math.PI * 2);
        ctx.strokeStyle = MCM.lineActive;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        drawNode(logoX, logoY, MCM.orange);

        // Title line
        drawLine(rect.x + 30, rect.y + 60, rect.x + rect.width - 30, rect.y + 60);

        // Fields
        drawField(rect.x, rect.y + 80, rect.width, 32);
        drawField(rect.x, rect.y + 120, rect.width, 32);
        drawField(rect.x, rect.y + 160, rect.width, 32);

        // Continue button
        drawButton(rect.x, rect.y + 210, rect.width, 36);

        // Requirements card (dashed)
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y + 260, rect.width, 50, 4);
        ctx.setLineDash([4, 2]);
        ctx.strokeStyle = MCM.line;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      }

      case 'Lobby': {
        // Tournament card
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y + 10, rect.width, 200, 8);
        ctx.strokeStyle = MCM.lineActive;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Corner nodes
        drawNode(rect.x, rect.y + 18, MCM.teal);
        drawNode(rect.x + rect.width, rect.y + 18, MCM.teal);
        drawNode(rect.x + rect.width, rect.y + 202, MCM.teal);
        drawNode(rect.x, rect.y + 202, MCM.teal);

        // Globe
        const globeX = rect.x + rect.width / 2;
        const globeY = rect.y + 75;
        ctx.beginPath();
        ctx.arc(globeX, globeY, 25, 0, Math.PI * 2);
        ctx.strokeStyle = MCM.lineActive;
        ctx.lineWidth = 1;
        ctx.stroke();
        drawNode(globeX, globeY, MCM.gold);

        // Progress bar
        const progressY = rect.y + 120;
        ctx.beginPath();
        ctx.roundRect(rect.x + 15, progressY, rect.width - 30, 6, 3);
        ctx.fillStyle = MCM.line;
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(rect.x + 15, progressY, (rect.width - 30) * 0.7, 6, 3);
        ctx.fillStyle = MCM.orange;
        ctx.fill();

        // Join button
        drawButton(rect.x + 15, rect.y + 140, rect.width - 30, 32);

        // Stats nodes
        const statsY = rect.y + 185;
        drawNode(rect.x + 35, statsY, MCM.gold);
        drawNode(rect.x + rect.width / 2, statsY, MCM.gold);
        drawNode(rect.x + rect.width - 35, statsY, MCM.gold);

        // Tab bar
        drawTabBar(rect.x, rect.y + rect.height - 45, rect.width, 40, 0);
        break;
      }

      case 'Live Drafts': {
        // Title line
        drawLine(rect.x + 20, rect.y + 15, rect.x + rect.width - 20, rect.y + 15);

        // Fast draft card
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y + 35, rect.width, 85, 6);
        ctx.strokeStyle = MCM.lineActive;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        drawNode(rect.x, rect.y + 41, MCM.gold);
        drawNode(rect.x + rect.width, rect.y + 41, MCM.gold);

        // Progress in fast card
        ctx.beginPath();
        ctx.roundRect(rect.x + 10, rect.y + 102, rect.width - 20, 5, 2);
        ctx.fillStyle = MCM.line;
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(rect.x + 10, rect.y + 102, (rect.width - 20) * 0.66, 5, 2);
        ctx.fillStyle = MCM.orange;
        ctx.fill();

        // Slow draft card
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y + 135, rect.width, 85, 6);
        ctx.strokeStyle = MCM.lineActive;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        drawNode(rect.x, rect.y + 141, MCM.sage);
        drawNode(rect.x + rect.width, rect.y + 141, MCM.sage);

        // Tab bar
        drawTabBar(rect.x, rect.y + rect.height - 45, rect.width, 40, 1);
        break;
      }

      case 'Draft: Players': {
        // Top tabs
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.width, 28);
        ctx.strokeStyle = MCM.line;
        ctx.lineWidth = 1;
        ctx.stroke();
        for (let i = 0; i < 5; i++) {
          const x = rect.x + (i * rect.width) / 5 + rect.width / 10;
          drawNode(x, rect.y + 14, i === 0 ? MCM.orange : MCM.textDim, 3);
        }

        // Search
        drawField(rect.x, rect.y + 38, rect.width, 28);

        // Position pills
        const pillsY = rect.y + 76;
        for (let i = 0; i < 5; i++) {
          const pillX = rect.x + i * 36;
          ctx.beginPath();
          ctx.roundRect(pillX, pillsY, 32, 18, 9);
          ctx.strokeStyle = i === 0 ? MCM.orange : MCM.line;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Player rows
        const rowColors = [MCM.coral, MCM.sage, MCM.gold, MCM.teal, MCM.coral];
        for (let i = 0; i < 5; i++) {
          const rowY = rect.y + 110 + i * 38;
          ctx.beginPath();
          ctx.roundRect(rect.x, rowY, rect.width, 34, 4);
          ctx.strokeStyle = MCM.line;
          ctx.lineWidth = 1;
          ctx.stroke();
          drawNode(rect.x + 12, rowY + 17, rowColors[i]!, 4);
          drawLine(rect.x + 24, rowY + 17, rect.x + 80, rowY + 17);
        }

        // Position tracker
        ctx.beginPath();
        ctx.rect(rect.x, rect.y + rect.height - 50, rect.width, 45);
        ctx.strokeStyle = MCM.lineActive;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Timer bar
        ctx.beginPath();
        ctx.roundRect(rect.x + 8, rect.y + rect.height - 19, rect.width - 50, 5, 2);
        ctx.fillStyle = MCM.line;
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(rect.x + 8, rect.y + rect.height - 19, (rect.width - 50) * 0.6, 5, 2);
        ctx.fillStyle = MCM.orange;
        ctx.fill();
        break;
      }

      case 'Draft: Roster': {
        // Top tabs
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.width, 28);
        ctx.strokeStyle = MCM.line;
        ctx.lineWidth = 1;
        ctx.stroke();
        for (let i = 0; i < 5; i++) {
          const x = rect.x + (i * rect.width) / 5 + rect.width / 10;
          drawNode(x, rect.y + 14, i === 2 ? MCM.orange : MCM.textDim, 3);
        }

        // Roster slots
        const slotColors = [MCM.coral, MCM.sage, MCM.sage, MCM.gold, MCM.gold, MCM.gold, MCM.teal, MCM.lineActive];
        for (let i = 0; i < 8; i++) {
          const slotY = rect.y + 40 + i * 34;
          const isFilled = i < 3;

          ctx.beginPath();
          ctx.roundRect(rect.x, slotY, rect.width, 30, 4);
          if (isFilled) {
            ctx.strokeStyle = slotColors[i]!;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([]);
          } else {
            ctx.strokeStyle = `${slotColors[i]!}66`;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 2]);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          drawNode(rect.x + 12, slotY + 15, slotColors[i]!, 4);

          if (isFilled) {
            drawLine(rect.x + 24, slotY + 15, rect.x + 80, slotY + 15);
          }
        }

        // Position tracker
        ctx.beginPath();
        ctx.rect(rect.x, rect.y + rect.height - 50, rect.width, 45);
        ctx.strokeStyle = MCM.lineActive;
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
      }

      case 'Profile': {
        // User card
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y + 15, rect.width, 60, 6);
        ctx.strokeStyle = MCM.lineActive;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Avatar
        const avatarX = rect.x + 28;
        const avatarY = rect.y + 45;
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, 18, 0, Math.PI * 2);
        ctx.strokeStyle = MCM.lineActive;
        ctx.lineWidth = 1;
        ctx.stroke();
        drawNode(avatarX, avatarY, MCM.teal);

        // Info lines
        drawLine(rect.x + 55, rect.y + 37, rect.x + rect.width - 15, rect.y + 37);
        drawLine(rect.x + 55, rect.y + 53, rect.x + rect.width - 40, rect.y + 53);

        // Menu items
        for (let i = 0; i < 6; i++) {
          const itemY = rect.y + 95 + i * 36;
          ctx.beginPath();
          ctx.roundRect(rect.x, itemY, rect.width, 32, 4);
          ctx.strokeStyle = MCM.line;
          ctx.lineWidth = 1;
          ctx.stroke();
          drawNode(rect.x + 14, itemY + 16, MCM.gold, 3);
          drawLine(rect.x + 26, itemY + 16, rect.x + 90, itemY + 16);
        }

        // Add Funds button
        drawButton(rect.x, rect.y + rect.height - 95, rect.width, 36);

        // Tab bar
        drawTabBar(rect.x, rect.y + rect.height - 45, rect.width, 40, 4);
        break;
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const inset = 8;
    const rect = {
      x: inset,
      y: inset,
      width: width - inset * 2,
      height: height - inset * 2,
    };
    const cornerRadius = 28;

    ctx.clearRect(0, 0, width, height);

    // Draw phone outline with rounded corners
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.width, rect.height, cornerRadius);
    ctx.strokeStyle = MCM.lineActive;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Corner nodes (MCM signature)
    const nodeRadius = 4;
    const nodePositions = [
      { x: rect.x, y: rect.y + cornerRadius },
      { x: rect.x + cornerRadius, y: rect.y },
      { x: rect.x + rect.width - cornerRadius, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + cornerRadius },
      { x: rect.x + rect.width, y: rect.y + rect.height - cornerRadius },
      { x: rect.x + rect.width - cornerRadius, y: rect.y + rect.height },
      { x: rect.x + cornerRadius, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height - cornerRadius },
    ];

    nodePositions.forEach((pos) => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = MCM.orange;
      ctx.fill();
    });

    // Dynamic Island
    const diWidth = 80;
    const diHeight = 24;
    ctx.beginPath();
    ctx.roundRect(
      rect.x + rect.width / 2 - diWidth / 2,
      rect.y + 10,
      diWidth,
      diHeight,
      12
    );
    ctx.fillStyle = '#000';
    ctx.fill();

    // Home indicator
    ctx.beginPath();
    ctx.roundRect(
      rect.x + rect.width / 2 - 45,
      rect.y + rect.height - 16,
      90,
      4,
      2
    );
    ctx.fillStyle = MCM.lineActive;
    ctx.fill();

    // Screen content area
    const screenRect = {
      x: rect.x + 12,
      y: rect.y + 44,
      width: rect.width - 24,
      height: rect.height - 72,
    };

    // Draw screen content based on title
    drawScreenContent(ctx, screenRect, title);
  }, [title, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

// ============================================================================
// Annotation Labels Component (SVG Dashed Lines)
// ============================================================================

interface AnnotationLabelsProps {
  annotations: Annotation[];
  phoneRect: { x: number; y: number; width: number; height: number };
  containerWidth: number;
  show: boolean;
}

const AnnotationLabels: React.FC<AnnotationLabelsProps> = ({
  annotations,
  phoneRect,
  containerWidth,
  show,
}) => {
  if (!show) return null;

  const labelWidth = 140;
  const margin = 28;

  return (
    <>
      {/* SVG Lines */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {annotations.map((ann) => {
          const phoneY = phoneRect.y + ann.y * phoneRect.height;
          const isLeft = ann.side === 'left';
          const labelX = isLeft ? margin : containerWidth - margin - labelWidth;
          const phoneEdgeX = isLeft ? phoneRect.x - 8 : phoneRect.x + phoneRect.width + 8;
          const lineStartX = isLeft ? labelX + labelWidth : labelX;
          const midX = isLeft ? labelX + labelWidth + 15 : labelX - 15;
          const color = getColorForType(ann.type);

          return (
            <g key={ann.id}>
              {/* Connecting line - DASHED */}
              <path
                d={`M ${lineStartX} ${phoneY} L ${midX} ${phoneY} L ${phoneEdgeX} ${phoneY}`}
                stroke={color}
                strokeOpacity={0.6}
                strokeWidth={1}
                strokeDasharray="4 3"
                fill="none"
              />
              {/* End node at phone edge */}
              <circle cx={phoneEdgeX} cy={phoneY} r={3} fill={color} />
              {/* Start node at label edge */}
              <circle
                cx={isLeft ? labelX + labelWidth + 4 : labelX - 4}
                cy={phoneY}
                r={2.5}
                fill={color}
              />
            </g>
          );
        })}
      </svg>

      {/* Labels */}
      {annotations.map((ann) => {
        const phoneY = phoneRect.y + ann.y * phoneRect.height;
        const isLeft = ann.side === 'left';
        const labelX = isLeft ? margin : containerWidth - margin - labelWidth;
        const color = getColorForType(ann.type);

        return (
          <div
            key={ann.id}
            style={{
              position: 'absolute',
              left: labelX,
              top: phoneY,
              transform: 'translateY(-50%)',
              width: labelWidth,
              padding: '6px 8px',
              backgroundColor: `${MCM.surface}e6`,
              borderRadius: 4,
              border: `1px solid ${MCM.line}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                justifyContent: isLeft ? 'flex-start' : 'flex-end',
              }}
            >
              {!isLeft && <div style={{ flex: 1 }} />}
              <span style={{ fontSize: 11, fontWeight: 500, color: MCM.text }}>
                {ann.name}
              </span>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color: color,
                  padding: '2px 5px',
                  backgroundColor: `${color}26`,
                  borderRadius: 2,
                }}
              >
                {ann.type}
              </span>
              {isLeft && <div style={{ flex: 1 }} />}
            </div>
            {ann.notes && (
              <div
                style={{
                  fontSize: 9,
                  color: MCM.textDim,
                  marginTop: 2,
                  textAlign: isLeft ? 'left' : 'right',
                }}
              >
                {ann.notes}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

// ============================================================================
// Grid Background Component
// ============================================================================

const GridBackground: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.03,
        backgroundImage: `
          linear-gradient(to right, white 1px, transparent 1px),
          linear-gradient(to bottom, white 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      }}
    />
  );
};

// ============================================================================
// Main Page Component
// ============================================================================

export default function WireframePastIteration1() {
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000);

  const currentScreen = screens[selectedIndex] || screens[0]!;
  const phoneWidth = 220;
  const phoneHeight = 460;

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const phoneRect = {
    x: containerWidth / 2 - phoneWidth / 2,
    y: 40,
    width: phoneWidth,
    height: phoneHeight,
  };

  return (
    <>
      <Head>
        <title>TOPDOG | iOSx Developer Wireframes (02-04-26)</title>
      </Head>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: MCM.bg,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <Header
          showAnnotations={showAnnotations}
          onToggle={() => setShowAnnotations(!showAnnotations)}
        />

        <ScreenSelector selectedIndex={selectedIndex} onSelect={setSelectedIndex} />

        <div
          ref={containerRef}
          style={{
            position: 'relative',
            height: 'calc(100vh - 120px)',
            overflow: 'hidden',
          }}
        >
          <GridBackground />

          {/* Annotation Labels */}
          <AnnotationLabels
            annotations={currentScreen!.annotations}
            phoneRect={phoneRect}
            containerWidth={containerWidth}
            show={showAnnotations}
          />

          {/* Phone Wireframe */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 40,
              transform: 'translateX(-50%)',
            }}
          >
            <PhoneWireframe
              title={currentScreen!.title}
              width={phoneWidth}
              height={phoneHeight}
            />
          </div>
        </div>
      </div>
    </>
  );
}
