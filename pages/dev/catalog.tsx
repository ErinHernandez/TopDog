import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

import { MCM, SCREENS, getColorForType, getCategoryColor } from '@/lib/dev/mcmTokens';
import type { ScreenDefinition } from '@/lib/dev/mcmTokens';

// ============================================================================
// Element Position System
// ============================================================================

interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Element Catalog Data
// ============================================================================

interface CatalogElement {
  id: string;
  type: string;
  name: string;
  description: string;
  variants?: string[];
  screens: string[];
  positions: Record<string, ElementPosition>;
}

const CATALOG_ELEMENTS: CatalogElement[] = [
  { id: 'button', type: 'Button', name: 'Button', description: 'Primary action buttons', variants: ['Primary', 'Secondary', 'Destructive'], screens: ['login', 'signup', 'lobby', 'profile'], positions: { login: { x: 10, y: 62, width: 80, height: 8 }, signup: { x: 10, y: 70, width: 80, height: 8 }, lobby: { x: 15, y: 45, width: 70, height: 7 }, profile: { x: 10, y: 80, width: 80, height: 8 } } },
  { id: 'textfield', type: 'TextField', name: 'Text Field', description: 'Text input fields', variants: ['Default', 'Focused', 'Error'], screens: ['login', 'signup', 'draftroom'], positions: { login: { x: 10, y: 30, width: 80, height: 8 }, signup: { x: 10, y: 28, width: 80, height: 8 }, draftroom: { x: 5, y: 12, width: 90, height: 6 } } },
  { id: 'securefield', type: 'SecureField', name: 'Secure Field', description: 'Password input with toggle', variants: ['Hidden', 'Visible'], screens: ['login', 'signup'], positions: { login: { x: 10, y: 42, width: 80, height: 8 }, signup: { x: 10, y: 40, width: 80, height: 8 } } },
  { id: 'text', type: 'Text', name: 'Text / Label', description: 'Typography elements', variants: ['Heading', 'Body', 'Caption'], screens: ['login', 'signup', 'lobby', 'profile', 'myteams'], positions: { login: { x: 20, y: 18, width: 60, height: 5 }, signup: { x: 20, y: 15, width: 60, height: 5 }, lobby: { x: 10, y: 25, width: 40, height: 4 }, profile: { x: 30, y: 12, width: 40, height: 5 }, myteams: { x: 10, y: 8, width: 50, height: 5 } } },
  { id: 'card', type: 'Card', name: 'Card', description: 'Content containers', variants: ['Default', 'Interactive', 'Highlighted'], screens: ['lobby', 'myteams', 'draftroom', 'profile'], positions: { lobby: { x: 5, y: 18, width: 90, height: 35 }, myteams: { x: 5, y: 15, width: 90, height: 20 }, draftroom: { x: 5, y: 55, width: 90, height: 30 }, profile: { x: 5, y: 5, width: 90, height: 18 } } },
  { id: 'list', type: 'List', name: 'List Row', description: 'List items with chevrons', variants: ['Default', 'With Icon', 'With Badge'], screens: ['settings', 'profile', 'myteams'], positions: { settings: { x: 0, y: 15, width: 100, height: 60 }, profile: { x: 0, y: 28, width: 100, height: 45 }, myteams: { x: 0, y: 38, width: 100, height: 50 } } },
  { id: 'tabbar', type: 'TabBar', name: 'Tab Bar', description: 'Bottom navigation tabs', variants: ['5 Tabs'], screens: ['lobby', 'myteams', 'profile', 'settings'], positions: { lobby: { x: 0, y: 90, width: 100, height: 10 }, myteams: { x: 0, y: 90, width: 100, height: 10 }, profile: { x: 0, y: 90, width: 100, height: 10 }, settings: { x: 0, y: 90, width: 100, height: 10 } } },
  { id: 'progress', type: 'Progress', name: 'Progress Bar', description: 'Progress indicators', variants: ['Linear', 'Circular'], screens: ['lobby', 'draftroom'], positions: { lobby: { x: 15, y: 38, width: 70, height: 3 }, draftroom: { x: 5, y: 88, width: 90, height: 4 } } },
  { id: 'badge', type: 'Badge', name: 'Badge', description: 'Status badges and pills', variants: ['Default', 'Colored'], screens: ['draftroom', 'lobby', 'myteams'], positions: { draftroom: { x: 70, y: 20, width: 25, height: 5 }, lobby: { x: 70, y: 20, width: 25, height: 4 }, myteams: { x: 75, y: 18, width: 20, height: 4 } } },
  { id: 'segmented', type: 'Segmented', name: 'Segmented Control', description: 'Option picker', variants: ['2 Options', '4 Options'], screens: ['draftroom'], positions: { draftroom: { x: 5, y: 20, width: 90, height: 6 } } },
  { id: 'toggle', type: 'Toggle', name: 'Toggle Switch', description: 'On/off switches', variants: ['On', 'Off'], screens: ['settings'], positions: { settings: { x: 75, y: 25, width: 15, height: 5 } } },
  { id: 'image', type: 'Image', name: 'Image / Avatar', description: 'Images and avatars', variants: ['Square', 'Circle'], screens: ['login', 'signup', 'profile'], positions: { login: { x: 35, y: 5, width: 30, height: 12 }, signup: { x: 38, y: 3, width: 24, height: 10 }, profile: { x: 10, y: 7, width: 15, height: 10 } } },
  { id: 'icon', type: 'Icon', name: 'Icon', description: 'System icons', variants: ['Chevron', 'Lock', 'Gear'], screens: ['settings', 'profile'], positions: { settings: { x: 5, y: 20, width: 8, height: 5 }, profile: { x: 5, y: 32, width: 8, height: 5 } } },
  { id: 'link', type: 'Link', name: 'Link', description: 'Tappable text links', variants: ['Default', 'Muted'], screens: ['login', 'signup'], positions: { login: { x: 25, y: 75, width: 50, height: 4 }, signup: { x: 25, y: 82, width: 50, height: 4 } } },
  { id: 'checkbox', type: 'Checkbox', name: 'Checkbox', description: 'Checkboxes and radio buttons', variants: ['Checked', 'Unchecked'], screens: ['login', 'settings'], positions: { login: { x: 10, y: 52, width: 40, height: 5 }, settings: { x: 80, y: 40, width: 10, height: 5 } } },
];


// ============================================================================
// App Flow Definitions (for Flowchart)
// ============================================================================

interface FlowNode {
  id: string;
  type: 'screen' | 'action' | 'decision' | 'start' | 'end';
  label: string;
  screenId?: string;
}

interface FlowConnection {
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

const APP_FLOW: { nodes: FlowNode[]; connections: FlowConnection[] } = {
  nodes: [
    { id: 'start', type: 'start', label: 'App Launch' },
    { id: 'auth_check', type: 'decision', label: 'Logged In?' },
    { id: 'login', type: 'screen', label: 'Login', screenId: 'login' },
    { id: 'signup', type: 'screen', label: 'Sign Up', screenId: 'signup' },
    { id: 'lobby', type: 'screen', label: 'Lobby', screenId: 'lobby' },
    { id: 'myteams', type: 'screen', label: 'My Teams', screenId: 'myteams' },
    { id: 'draftroom', type: 'screen', label: 'Draft Room', screenId: 'draftroom' },
    { id: 'profile', type: 'screen', label: 'Profile', screenId: 'profile' },
    { id: 'settings', type: 'screen', label: 'Settings', screenId: 'settings' },
    { id: 'join_contest', type: 'action', label: 'Join Contest' },
    { id: 'draft_complete', type: 'action', label: 'Draft Complete' },
    { id: 'logout', type: 'action', label: 'Logout' },
  ],
  connections: [
    { from: 'start', to: 'auth_check' },
    { from: 'auth_check', to: 'login', condition: 'No' },
    { from: 'auth_check', to: 'lobby', condition: 'Yes' },
    { from: 'login', to: 'lobby', label: 'Success' },
    { from: 'login', to: 'signup', label: 'New User' },
    { from: 'signup', to: 'lobby', label: 'Success' },
    { from: 'lobby', to: 'join_contest', label: 'Select Contest' },
    { from: 'join_contest', to: 'draftroom' },
    { from: 'draftroom', to: 'draft_complete', label: 'Finish' },
    { from: 'draft_complete', to: 'myteams' },
    { from: 'lobby', to: 'myteams', label: 'Tab' },
    { from: 'lobby', to: 'profile', label: 'Tab' },
    { from: 'myteams', to: 'lobby', label: 'Tab' },
    { from: 'myteams', to: 'profile', label: 'Tab' },
    { from: 'profile', to: 'settings', label: 'Gear Icon' },
    { from: 'profile', to: 'lobby', label: 'Tab' },
    { from: 'settings', to: 'logout', label: 'Logout' },
    { from: 'logout', to: 'login' },
  ],
};

// ============================================================================
// App Flowchart Component (SVG)
// ============================================================================

const AppFlowchart: React.FC<{ width?: number; height?: number }> = ({ width = 800, height = 600 }) => {
  // Node positions (manually laid out for clarity)
  const nodePositions: Record<string, { x: number; y: number }> = {
    start: { x: 400, y: 30 },
    auth_check: { x: 400, y: 90 },
    login: { x: 200, y: 170 },
    signup: { x: 80, y: 260 },
    lobby: { x: 400, y: 170 },
    join_contest: { x: 550, y: 260 },
    draftroom: { x: 680, y: 340 },
    draft_complete: { x: 680, y: 420 },
    myteams: { x: 400, y: 340 },
    profile: { x: 400, y: 440 },
    settings: { x: 250, y: 520 },
    logout: { x: 100, y: 440 },
  };

  const nodeWidth = 100;
  const nodeHeight = 36;

  const getNodeColor = (type: FlowNode['type']) => {
    switch (type) {
      case 'start': return MCM.sage;
      case 'end': return MCM.coral;
      case 'screen': return MCM.teal;
      case 'action': return MCM.orange;
      case 'decision': return MCM.gold;
      default: return MCM.lineActive;
    }
  };

  const renderNode = (node: FlowNode) => {
    const pos = nodePositions[node.id];
    if (!pos) return null;
    const color = getNodeColor(node.type);

    if (node.type === 'decision') {
      // Diamond shape
      const size = 40;
      return (
        <g key={node.id}>
          <path
            d={`M${pos.x} ${pos.y - size/2} L${pos.x + size/2} ${pos.y} L${pos.x} ${pos.y + size/2} L${pos.x - size/2} ${pos.y} Z`}
            fill={`${color}30`}
            stroke={color}
            strokeWidth={2}
          />
          <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill={MCM.text} fontSize={9} fontWeight={600}>
            {node.label}
          </text>
        </g>
      );
    }

    if (node.type === 'start' || node.type === 'end') {
      // Rounded pill
      return (
        <g key={node.id}>
          <rect
            x={pos.x - 40}
            y={pos.y - 14}
            width={80}
            height={28}
            rx={14}
            fill={`${color}30`}
            stroke={color}
            strokeWidth={2}
          />
          <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill={MCM.text} fontSize={10} fontWeight={600}>
            {node.label}
          </text>
        </g>
      );
    }

    if (node.type === 'action') {
      // Rounded rectangle
      return (
        <g key={node.id}>
          <rect
            x={pos.x - nodeWidth/2}
            y={pos.y - nodeHeight/2}
            width={nodeWidth}
            height={nodeHeight}
            rx={8}
            fill={`${color}20`}
            stroke={color}
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
          <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill={MCM.text} fontSize={10}>
            {node.label}
          </text>
        </g>
      );
    }

    // Screen node - rectangle
    return (
      <g key={node.id}>
        <rect
          x={pos.x - nodeWidth/2}
          y={pos.y - nodeHeight/2}
          width={nodeWidth}
          height={nodeHeight}
          rx={6}
          fill={`${color}25`}
          stroke={color}
          strokeWidth={2}
        />
        <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill={MCM.text} fontSize={11} fontWeight={600}>
          {node.label}
        </text>
      </g>
    );
  };

  const renderConnection = (conn: FlowConnection, idx: number) => {
    const fromPos = nodePositions[conn.from];
    const toPos = nodePositions[conn.to];
    if (!fromPos || !toPos) return null;

    // Simple straight line with arrow
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const offsetStart = 25;
    const offsetEnd = 25;
    
    const x1 = fromPos.x + (dx / len) * offsetStart;
    const y1 = fromPos.y + (dy / len) * offsetStart;
    const x2 = toPos.x - (dx / len) * offsetEnd;
    const y2 = toPos.y - (dy / len) * offsetEnd;

    // Arrow head
    const angle = Math.atan2(dy, dx);
    const arrowLen = 8;
    const arrowAngle = Math.PI / 6;

    return (
      <g key={idx}>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={MCM.lineActive}
          strokeWidth={1.5}
        />
        {/* Arrow head */}
        <path
          d={`M${x2} ${y2} L${x2 - arrowLen * Math.cos(angle - arrowAngle)} ${y2 - arrowLen * Math.sin(angle - arrowAngle)} M${x2} ${y2} L${x2 - arrowLen * Math.cos(angle + arrowAngle)} ${y2 - arrowLen * Math.sin(angle + arrowAngle)}`}
          stroke={MCM.lineActive}
          strokeWidth={1.5}
          fill="none"
        />
        {/* Label */}
        {(conn.label || conn.condition) && (
          <text
            x={(x1 + x2) / 2 + 5}
            y={(y1 + y2) / 2 - 5}
            fill={MCM.textDim}
            fontSize={8}
          >
            {conn.condition || conn.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ background: MCM.bg, borderRadius: 8 }}>
      {/* Title */}
      <text x={width/2} y={20} textAnchor="middle" fill={MCM.textMuted} fontSize={11} fontWeight={600} letterSpacing={2}>
        APP NAVIGATION FLOW
      </text>
      
      {/* Render connections first (behind nodes) */}
      {APP_FLOW.connections.map((conn, idx) => renderConnection(conn, idx))}
      
      {/* Render nodes */}
      {APP_FLOW.nodes.map(node => renderNode(node))}
      
      {/* Legend */}
      <g transform={`translate(${width - 140}, ${height - 100})`}>
        <text x={0} y={0} fill={MCM.textMuted} fontSize={9} fontWeight={600}>LEGEND</text>
        <rect x={0} y={10} width={12} height={12} rx={6} fill={`${MCM.sage}30`} stroke={MCM.sage} />
        <text x={18} y={20} fill={MCM.textDim} fontSize={8}>Start</text>
        <rect x={0} y={28} width={12} height={12} rx={2} fill={`${MCM.teal}25`} stroke={MCM.teal} />
        <text x={18} y={38} fill={MCM.textDim} fontSize={8}>Screen</text>
        <rect x={0} y={46} width={12} height={12} rx={4} fill={`${MCM.orange}20`} stroke={MCM.orange} strokeDasharray="2 1" />
        <text x={18} y={56} fill={MCM.textDim} fontSize={8}>Action</text>
        <path d="M6 64 L12 70 L6 76 L0 70 Z" fill={`${MCM.gold}30`} stroke={MCM.gold} />
        <text x={18} y={74} fill={MCM.textDim} fontSize={8}>Decision</text>
      </g>
    </svg>
  );
};


// ============================================================================
// iPhone Outline Component (Full Size)
// ============================================================================

interface IPhoneOutlineProps {
  width?: number;
  height?: number;
  screenId?: string;
  elements?: CatalogElement[];
  approvedIds?: string[];
}

const IPhoneOutline: React.FC<IPhoneOutlineProps> = ({ 
  width = 300, 
  height = 612,
  screenId,
  elements = [],
  approvedIds = [],
}) => {
  const bezelRadius = 36;
  const bezelWidth = 12;
  
  const screenX = bezelWidth + 6;
  const screenY = bezelWidth + 50;
  const screenW = width - (bezelWidth * 2) - 12;
  const screenH = height - (bezelWidth * 2) - 76;

  const renderPositionedElements = () => {
    if (!screenId) return null;
    const screenElements = elements.filter(el => el.screens.includes(screenId) && approvedIds.includes(el.id));
    return screenElements.map(el => {
      const pos = el.positions[screenId];
      if (!pos) return null;
      const x = screenX + (pos.x / 100) * screenW;
      const y = screenY + (pos.y / 100) * screenH;
      const w = (pos.width / 100) * screenW;
      const h = (pos.height / 100) * screenH;
      const color = getColorForType(el.type);
      const t = el.type.toLowerCase();
      if (t === 'button') return <g key={el.id}><rect x={x} y={y} width={w} height={h} rx={5} stroke={color} strokeWidth={2} fill={`${color}20`} /><line x1={x + w*0.25} y1={y + h/2} x2={x + w*0.75} y2={y + h/2} stroke={color} strokeWidth={1.5} /></g>;
      if (t === 'textfield' || t === 'securefield') return <g key={el.id}><rect x={x} y={y} width={w} height={h} rx={4} stroke={color} strokeWidth={1.5} fill="none" /><line x1={x + 8} y1={y + h/2} x2={x + w*0.4} y2={y + h/2} stroke={MCM.lineActive} strokeWidth={1} /></g>;
      if (t === 'text' || t === 'label') return <g key={el.id}><line x1={x} y1={y + h/2} x2={x + w*0.85} y2={y + h/2} stroke={color} strokeWidth={2} /></g>;
      if (t === 'card') return <g key={el.id}><rect x={x} y={y} width={w} height={h} rx={8} stroke={color} strokeWidth={1.5} fill={`${color}08`} /></g>;
      if (t === 'tabbar') return <g key={el.id}><rect x={x} y={y} width={w} height={h} stroke={MCM.line} strokeWidth={1} fill={MCM.surface} />{[0,1,2,3,4].map(i => <circle key={i} cx={x + (w/5)*(i+0.5)} cy={y + h/2} r={4} fill={i === 0 ? color : MCM.textDim} />)}</g>;
      if (t === 'progress') return <g key={el.id}><rect x={x} y={y} width={w} height={h} rx={h/2} fill={MCM.line} /><rect x={x} y={y} width={w*0.65} height={h} rx={h/2} fill={color} /></g>;
      if (t === 'badge') return <g key={el.id}><rect x={x} y={y} width={w} height={h} rx={h/2} stroke={color} strokeWidth={1.5} fill={`${color}30`} /></g>;
      if (t === 'image') return <g key={el.id}><circle cx={x + w/2} cy={y + h/2} r={Math.min(w, h)/2 - 3} stroke={color} strokeWidth={1.5} fill="none" /><circle cx={x + w/2} cy={y + h/2} r={4} fill={color} /></g>;
      if (t === 'toggle') return <g key={el.id}><rect x={x} y={y} width={w} height={h} rx={h/2} stroke={color} strokeWidth={1.5} fill={`${color}30`} /><circle cx={x + w - h/2} cy={y + h/2} r={h/2 - 3} fill={color} /></g>;
      if (t === 'list') { const rc = Math.min(Math.floor(h / 16), 5); const rh = h / rc; return <g key={el.id}>{Array.from({ length: rc }).map((_, i) => <g key={i}><rect x={x} y={y + i * rh} width={w} height={rh - 1} stroke={MCM.line} strokeWidth={0.5} fill="none" /><line x1={x + 10} y1={y + i * rh + rh/2} x2={x + w*0.5} y2={y + i * rh + rh/2} stroke={MCM.lineActive} strokeWidth={1} /></g>)}</g>; }
      if (t === 'segmented') { const sw = w / 4; return <g key={el.id}>{[0,1,2,3].map(i => <rect key={i} x={x + i * sw + 1} y={y} width={sw - 2} height={h} rx={4} stroke={i === 0 ? color : MCM.line} strokeWidth={1} fill={i === 0 ? `${color}25` : 'none'} />)}</g>; }
      if (t === 'checkbox') return <g key={el.id}><rect x={x} y={y} width={h} height={h} rx={4} stroke={color} strokeWidth={1.5} fill={`${color}20`} /></g>;
      if (t === 'link') return <g key={el.id}><line x1={x} y1={y + h/2} x2={x + w} y2={y + h/2} stroke={color} strokeWidth={1} /></g>;
      if (t === 'icon') return <g key={el.id}><circle cx={x + w/2} cy={y + h/2} r={Math.min(w, h)/2 - 2} stroke={MCM.line} strokeWidth={1} fill="none" /><circle cx={x + w/2} cy={y + h/2} r={3} fill={color} /></g>;
      return <rect key={el.id} x={x} y={y} width={w} height={h} rx={3} stroke={MCM.line} strokeWidth={1} strokeDasharray="4 2" fill="none" />;
    });
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect x={bezelWidth/2} y={bezelWidth/2} width={width - bezelWidth} height={height - bezelWidth} rx={bezelRadius} stroke={MCM.lineActive} strokeWidth={bezelWidth/2} fill="none" />
      <rect x={screenX} y={bezelWidth + 6} width={screenW} height={height - bezelWidth*2 - 12} rx={6} fill={MCM.bg} />
      <rect x={width/2 - 40} y={bezelWidth + 12} width={80} height={26} rx={13} fill="#000" />
      <rect x={width/2 - 45} y={height - bezelWidth - 16} width={90} height={5} rx={2.5} fill={MCM.lineActive} />
      {screenId && <text x={width/2} y={bezelWidth + 52} textAnchor="middle" fill={MCM.textMuted} fontSize={10} fontWeight={600}>{SCREENS.find(s => s.id === screenId)?.name.toUpperCase() || screenId.toUpperCase()}</text>}
      {renderPositionedElements()}
    </svg>
  );
};

// ============================================================================
// Page Component
// ============================================================================

export default function CatalogPage() {
  return (
    <>
      <Head>
        <title>TopDog Design Catalog</title>
        <meta name="description" content="Design system and component catalog for TopDog" />
      </Head>
      <div style={{ 
        backgroundColor: MCM.bg, 
        minHeight: '100vh', 
        padding: '40px',
        color: MCM.text 
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 600, 
          marginBottom: '32px',
          color: MCM.text
        }}>
          TopDog Design Catalog
        </h1>
        
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 500, 
            marginBottom: '24px',
            color: MCM.textMuted 
          }}>
            App Flow
          </h2>
          <div style={{ 
            background: MCM.surface, 
            borderRadius: '12px', 
            padding: '20px',
            border: `1px solid ${MCM.line}`
          }}>
            <AppFlowchart width={900} height={600} />
          </div>
        </section>

        <section>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 500, 
            marginBottom: '24px',
            color: MCM.textMuted 
          }}>
            Screen Catalog
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {SCREENS.map(screen => (
              <div 
                key={screen.id}
                style={{
                  background: MCM.surface,
                  borderRadius: '8px',
                  padding: '16px',
                  border: `1px solid ${MCM.line}`
                }}
              >
                <h3 style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  color: MCM.text 
                }}>
                  {screen.name}
                </h3>
                <span style={{
                  fontSize: '11px',
                  color: getCategoryColor(screen.category),
                  textTransform: 'uppercase'
                }}>
                  {screen.category}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
