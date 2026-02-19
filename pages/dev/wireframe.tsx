import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

import { WireframePhone } from '../../components/dev/WireframePhone';

// ============================================================================
// Mid-Century Modern Design System (MCM)
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
  isCustom?: boolean;
}

interface PendingExtraction {
  screenTitle: string;
  elements: Annotation[];
  swiftCode: string;
  screenshotPreview: string;
  timestamp: number;
}

interface PendingCatalogElement {
  id: string;
  type: string;
  name: string;
  timestamp: number;
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
      { id: '5', name: 'Forgot?', type: 'Link', notes: '→ Reset flow', y: 0.50, side: 'right' },
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
      { id: '3', name: '⚡ Badge', type: 'Badge', notes: 'FAST DRAFT', y: 0.15, side: 'right' },
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
      { id: '3', name: 'RB Slots', type: 'Card', notes: 'Green × 2', y: 0.26, side: 'left' },
      { id: '4', name: 'WR Slots', type: 'Card', notes: 'Yellow × 3', y: 0.40, side: 'right' },
      { id: '5', name: 'TE Slot', type: 'Card', notes: 'Purple', y: 0.54, side: 'right' },
      { id: '6', name: 'FLEX Slot', type: 'Card', notes: '3-stripe', y: 0.62, side: 'left' },
      { id: '7', name: 'Bench Slots', type: 'Card', notes: 'Gray × 4', y: 0.74, side: 'right' },
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
      { id: '6', name: 'Chevrons', type: 'Icon', notes: '→', y: 0.45, side: 'right' },
      { id: '7', name: 'Add Funds', type: 'Button', notes: '→ Deposit', y: 0.78, side: 'right' },
      { id: '8', name: 'Tab Bar', type: 'TabBar', y: 0.92, side: 'left' },
    ],
  },
];


// ============================================================================
// Annotation Labels Component (SVG DASHED LINES)
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
  );
};

// ============================================================================
// Annotation Card Component
// ============================================================================

interface AnnotationCardProps {
  annotation: Annotation;
  phoneRect: { x: number; y: number; width: number; height: number };
  containerWidth: number;
}

const AnnotationCard: React.FC<AnnotationCardProps> = ({
  annotation,
  phoneRect,
  containerWidth,
}) => {
  const labelWidth = 140;
  const margin = 28;
  const isLeft = annotation.side === 'left';
  const labelX = isLeft ? margin : containerWidth - margin - labelWidth;
  const labelY = phoneRect.y + annotation.y * phoneRect.height;
  const color = getColorForType(annotation.type);

  return (
    <div
      style={{
        position: 'absolute',
        left: labelX,
        top: labelY,
        transform: 'translateY(-50%)',
        width: labelWidth,
        padding: '6px 10px',
        background: `${MCM.surface}e6`,
        borderRadius: 4,
        border: `1px solid ${MCM.line}`,
        textAlign: isLeft ? 'left' : 'right',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: isLeft ? 'flex-start' : 'flex-end' }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: MCM.text }}>
          {annotation.name}
        </span>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: color,
            padding: '2px 5px',
            background: `${color}26`,
            borderRadius: 2,
          }}
        >
          {annotation.type}
        </span>
      </div>
      {annotation.notes && (
        <div style={{ fontSize: 9, color: MCM.textDim, marginTop: 2 }}>
          {annotation.notes}
        </div>
      )}
    </div>
  );
};


// ============================================================================
// Single Screen with Annotations Component (for All Screens View)
// ============================================================================

interface ScreenWithAnnotationsProps {
  screen: WireframeScreen;
  showAnnotations: boolean;
}

const ScreenWithAnnotations: React.FC<ScreenWithAnnotationsProps> = ({ screen, showAnnotations }) => {
  const phoneWidth = 240;
  const phoneHeight = 500;
  const containerWidth = 900;
  const containerHeight = 580;
  const phoneX = (containerWidth - phoneWidth) / 2;
  const phoneY = (containerHeight - phoneHeight) / 2;

  return (
    <div style={{ marginBottom: 48 }}>
      {/* Screen Title */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: MCM.text,
          letterSpacing: 2,
          textTransform: 'uppercase',
          textAlign: 'center',
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: `1px solid ${MCM.line}`,
        }}
      >
        {screen.isCustom && '✦ '}{screen.title}
      </div>

      {/* Main Content Area */}
      <div style={{ position: 'relative', width: containerWidth, height: containerHeight, margin: '0 auto' }}>
        
        {/* Grid Background */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.03 }}>
          {Array.from({ length: Math.ceil(containerWidth / 32) }).map((_, i) => (
            <line key={`v${i}`} x1={i * 32} y1={0} x2={i * 32} y2={containerHeight} stroke="white" strokeWidth={0.5} />
          ))}
          {Array.from({ length: Math.ceil(containerHeight / 32) }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 32} x2={containerWidth} y2={i * 32} stroke="white" strokeWidth={0.5} />
          ))}
        </svg>

        {/* Dashed Annotation Lines */}
        <AnnotationLabels
          annotations={screen.annotations}
          phoneRect={{ x: phoneX, y: phoneY, width: phoneWidth, height: phoneHeight }}
          containerWidth={containerWidth}
          show={showAnnotations}
        />

        {/* Annotation Cards */}
        {showAnnotations && screen.annotations.map((ann) => (
          <AnnotationCard
            key={ann.id}
            annotation={ann}
            phoneRect={{ x: phoneX, y: phoneY, width: phoneWidth, height: phoneHeight }}
            containerWidth={containerWidth}
          />
        ))}

        {/* Wireframe Phone */}
        <div style={{ position: 'absolute', left: phoneX, top: phoneY }}>
          <WireframePhone screen={screen.title} width={phoneWidth} height={phoneHeight} />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Page Component
// ============================================================================

export default function WireframePage() {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [pendingExtraction, setPendingExtraction] = useState<PendingExtraction | null>(null);
  const [customScreens, setCustomScreens] = useState<WireframeScreen[]>([]);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [pendingCatalogElements, setPendingCatalogElements] = useState<PendingCatalogElement[]>([]);
  const [showCatalogPanel, setShowCatalogPanel] = useState(false);

  // Check for pending extraction from localStorage on mount
  useEffect(() => {
    if (router.query.review === 'pending') {
      const stored = localStorage.getItem('pendingExtraction');
      if (stored) {
        try {
          const extraction = JSON.parse(stored) as PendingExtraction;
          // eslint-disable-next-line react-hooks/set-state-in-effect -- initializing state from localStorage on mount
          setPendingExtraction(extraction);
          setShowReviewPanel(true);
        } catch {
          console.error('Failed to parse pending extraction');
        }
      }
    }
  }, [router.query.review]);

  // Check for pending catalog elements
  useEffect(() => {
    const stored = localStorage.getItem('pendingWireframeElements');
    if (stored) {
      try {
        const elements = JSON.parse(stored) as PendingCatalogElement[];
        if (elements.length > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- initializing state from localStorage on mount
          setPendingCatalogElements(elements);
          setShowCatalogPanel(true);
        }
      } catch {
        console.error('Failed to parse pending catalog elements');
      }
    }
  }, []);

  // Approve a catalog element
  const approveCatalogElement = (elementId: string) => {
    // Add to approved list in localStorage
    const existingApproved = localStorage.getItem('approvedWireframeElements');
    const approved = existingApproved ? JSON.parse(existingApproved) : [];
    if (!approved.includes(elementId)) {
      approved.push(elementId);
      localStorage.setItem('approvedWireframeElements', JSON.stringify(approved));
    }

    // Remove from pending list
    const updatedPending = pendingCatalogElements.filter(el => el.id !== elementId);
    setPendingCatalogElements(updatedPending);
    localStorage.setItem('pendingWireframeElements', JSON.stringify(updatedPending));

    if (updatedPending.length === 0) {
      setShowCatalogPanel(false);
    }
  };

  // Dismiss a catalog element without approving
  const dismissCatalogElement = (elementId: string) => {
    const updatedPending = pendingCatalogElements.filter(el => el.id !== elementId);
    setPendingCatalogElements(updatedPending);
    localStorage.setItem('pendingWireframeElements', JSON.stringify(updatedPending));

    if (updatedPending.length === 0) {
      setShowCatalogPanel(false);
    }
  };

  // Add extraction to wireframe screens
  const addToWireframe = () => {
    if (!pendingExtraction) return;

    const newScreen: WireframeScreen = {
      title: pendingExtraction.screenTitle,
      annotations: pendingExtraction.elements,
      isCustom: true,
    };

    setCustomScreens(prev => [...prev, newScreen]);
    
    // Clear pending extraction
    localStorage.removeItem('pendingExtraction');
    setPendingExtraction(null);
    setShowReviewPanel(false);
    
    // Navigate to the new screen
    setSelectedIndex(screens.length + customScreens.length);
    
    // Clear URL param
    router.replace('/dev/wireframe', undefined, { shallow: true });
  };

  // Dismiss pending extraction without adding
  const dismissExtraction = () => {
    localStorage.removeItem('pendingExtraction');
    setPendingExtraction(null);
    setShowReviewPanel(false);
    router.replace('/dev/wireframe', undefined, { shallow: true });
  };

  // Combine built-in screens with custom screens
  const allScreens = [...screens, ...customScreens];

  // Layout dimensions
  const phoneWidth = 240;
  const phoneHeight = 500;
  const containerWidth = showReviewPanel ? 650 : 900;
  const containerHeight = 640;
  const phoneX = (containerWidth - phoneWidth) / 2;
  const phoneY = (containerHeight - phoneHeight) / 2;

  const currentScreen = allScreens[selectedIndex];

  return (
    <>
      <Head>
        <title>TopDog iOS Wireframes</title>
      </Head>

      <div style={{ minHeight: '100vh', background: MCM.bg, color: MCM.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* ===== HEADER (outside phone) ===== */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: MCM.surface, borderBottom: `1px solid ${MCM.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <svg width={36} height={36} viewBox="0 0 36 36">
              <circle cx={18} cy={18} r={16} stroke={MCM.orange} strokeWidth={1.5} fill="none" />
              <circle cx={18} cy={18} r={4} fill={MCM.orange} />
              {[0, 1, 2].map((i) => {
                const angle = (i * Math.PI * 2) / 3 - Math.PI / 2;
                const x = 18 + 12 * Math.cos(angle);
                const y = 18 + 12 * Math.sin(angle);
                return (
                  <g key={i}>
                    <line x1={18} y1={18} x2={x} y2={y} stroke={MCM.orange} strokeOpacity={0.4} />
                    <circle cx={x} cy={y} r={3} fill={MCM.orange} />
                  </g>
                );
              })}
            </svg>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 4 }}>TOPDOG</div>
              <div style={{ fontSize: 10, fontWeight: 500, color: MCM.textMuted }}>iOS Developer Wireframes</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setShowAnnotations(!showAnnotations)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, color: showAnnotations ? MCM.orange : MCM.textMuted }}>
                {showAnnotations ? 'ANNOTATIONS ON' : 'WIREFRAME ONLY'}
              </span>
              <div style={{ width: 44, height: 24, borderRadius: 12, background: MCM.surface, border: `1.5px solid ${showAnnotations ? MCM.orange : MCM.line}`, position: 'relative' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: showAnnotations ? MCM.orange : MCM.textDim, position: 'absolute', top: 4, left: showAnnotations ? 26 : 4, transition: 'left 0.2s ease' }} />
              </div>
            </button>
            <div style={{ width: 1, height: 24, background: MCM.line }} />
            <Link
              href="/dev/extraction"
              style={{
                fontSize: 10,
                color: MCM.orange,
                textDecoration: 'none',
                padding: '6px 12px',
                border: `1px solid ${MCM.orange}`,
                borderRadius: 4,
              }}
            >
              Extraction
            </Link>
            <Link
              href="/dev/catalog"
              style={{
                fontSize: 10,
                color: MCM.teal,
                textDecoration: 'none',
                padding: '6px 12px',
                border: `1px solid ${MCM.teal}`,
                borderRadius: 4,
              }}
            >
              Catalog
            </Link>
          </div>
        </header>

        {/* ===== SCREEN SELECTOR NAV (outside phone) ===== */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '12px 20px', overflowX: 'auto', background: `${MCM.bg}cc` }}>
          {allScreens.map((screen, i) => (
            <React.Fragment key={`${screen.title}-${i}`}>
              <button onClick={() => setSelectedIndex(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer' }}>
                <span style={{ fontSize: 11, fontWeight: selectedIndex === i ? 600 : 400, color: selectedIndex === i ? MCM.text : MCM.textDim }}>
                  {screen.isCustom && '✦ '}{screen.title}
                </span>
                {selectedIndex === i ? (
                  <svg width={6} height={6} viewBox="0 0 6 6"><path d="M3 0 L6 3 L3 6 L0 3 Z" fill={screen.isCustom ? MCM.teal : MCM.orange} /></svg>
                ) : (
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: screen.isCustom ? MCM.teal : MCM.line }} />
                )}
              </button>
              {i < allScreens.length - 1 && <div style={{ width: 20, height: 1, background: MCM.line }} />}
            </React.Fragment>
          ))}
        </nav>

        {/* ===== MAIN CONTENT AREA ===== */}
        <main style={{ position: 'relative', width: containerWidth, height: containerHeight, margin: '20px auto' }}>
          
          {/* Grid Background */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.03 }}>
            {Array.from({ length: Math.ceil(containerWidth / 32) }).map((_, i) => (
              <line key={`v${i}`} x1={i * 32} y1={0} x2={i * 32} y2={containerHeight} stroke="white" strokeWidth={0.5} />
            ))}
            {Array.from({ length: Math.ceil(containerHeight / 32) }).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={i * 32} x2={containerWidth} y2={i * 32} stroke="white" strokeWidth={0.5} />
            ))}
          </svg>

          {/* ===== DASHED ANNOTATION LINES (outside phone, pointing TO phone) ===== */}
          <AnnotationLabels
            annotations={currentScreen!.annotations}
            phoneRect={{ x: phoneX, y: phoneY, width: phoneWidth, height: phoneHeight }}
            containerWidth={containerWidth}
            show={showAnnotations}
          />

          {/* ===== ANNOTATION CARDS (outside phone, left & right columns) ===== */}
          {showAnnotations && currentScreen!.annotations.map((ann) => (
            <AnnotationCard
              key={ann.id}
              annotation={ann}
              phoneRect={{ x: phoneX, y: phoneY, width: phoneWidth, height: phoneHeight }}
              containerWidth={containerWidth}
            />
          ))}

          {/* ===== WIREFRAME CONTENT ===== */}
          <div style={{ position: 'absolute', left: phoneX, top: phoneY }}>
            <WireframePhone screen={currentScreen!.title} width={phoneWidth} height={phoneHeight} />
          </div>
        </main>

        {/* ===== ALL SCREENS SECTION ===== */}
        <section style={{ borderTop: `2px solid ${MCM.orange}`, marginTop: 40, paddingTop: 40 }}>
          <div
            style={{
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: MCM.orange, letterSpacing: 2, marginBottom: 8 }}>
              ALL SCREENS
            </div>
            <div style={{ fontSize: 10, color: MCM.textMuted }}>
              {allScreens.length} wireframe screens with annotations
            </div>
          </div>

          {allScreens.map((screen) => (
            <ScreenWithAnnotations
              key={screen.title}
              screen={screen}
              showAnnotations={showAnnotations}
            />
          ))}
        </section>

        {/* ===== REVIEW PANEL (for pending extractions) ===== */}
        {showReviewPanel && pendingExtraction && (
          <aside
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 400,
              height: '100vh',
              background: MCM.surface,
              borderLeft: `2px solid ${MCM.orange}`,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 100,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${MCM.line}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: MCM.orange, letterSpacing: 1 }}>
                  PENDING EXTRACTION
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: MCM.text, marginTop: 4 }}>
                  {pendingExtraction.screenTitle}
                </div>
              </div>
              <button
                onClick={dismissExtraction}
                style={{
                  background: 'none',
                  border: 'none',
                  color: MCM.textDim,
                  fontSize: 20,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>

            {/* Screenshot Preview */}
            {pendingExtraction.screenshotPreview && (
              <div style={{ padding: 16, borderBottom: `1px solid ${MCM.line}` }}>
                <div style={{ fontSize: 10, color: MCM.textMuted, marginBottom: 8, letterSpacing: 1 }}>
                  SOURCE SCREENSHOT
                </div>
                <Image
                  src={pendingExtraction.screenshotPreview}
                  alt="Source screenshot"
                  width={400}
                  height={150}
                  style={{
                    width: '100%',
                    maxHeight: 150,
                    objectFit: 'contain',
                    borderRadius: 6,
                    border: `1px solid ${MCM.line}`,
                  }}
                  unoptimized
                />
              </div>
            )}

            {/* Extracted Elements */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              <div style={{ fontSize: 10, color: MCM.textMuted, marginBottom: 12, letterSpacing: 1 }}>
                EXTRACTED ELEMENTS ({pendingExtraction.elements.length})
              </div>
              {pendingExtraction.elements.map((el) => (
                <div
                  key={el.id}
                  style={{
                    padding: '10px 12px',
                    background: MCM.bg,
                    borderRadius: 6,
                    marginBottom: 8,
                    border: `1px solid ${MCM.line}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: MCM.text }}>{el.name}</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: getColorForType(el.type),
                        padding: '2px 6px',
                        background: `${getColorForType(el.type)}20`,
                        borderRadius: 3,
                      }}
                    >
                      {el.type}
                    </span>
                  </div>
                  {el.notes && (
                    <div style={{ fontSize: 10, color: MCM.textDim, marginTop: 4 }}>
                      {el.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Swift Code Preview */}
            <div style={{ borderTop: `1px solid ${MCM.line}`, maxHeight: 200, overflowY: 'auto' }}>
              <div style={{ padding: '12px 16px', background: MCM.bg }}>
                <div style={{ fontSize: 10, color: MCM.textMuted, marginBottom: 8, letterSpacing: 1 }}>
                  SWIFT CODE PREVIEW
                </div>
                <pre
                  style={{
                    margin: 0,
                    fontFamily: 'SF Mono, Menlo, monospace',
                    fontSize: 9,
                    color: MCM.textDim,
                    whiteSpace: 'pre-wrap',
                    maxHeight: 120,
                    overflow: 'hidden',
                  }}
                >
                  {pendingExtraction.swiftCode.slice(0, 500)}...
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                padding: 16,
                borderTop: `1px solid ${MCM.line}`,
                display: 'flex',
                gap: 12,
              }}
            >
              <button
                onClick={dismissExtraction}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'none',
                  border: `1px solid ${MCM.line}`,
                  borderRadius: 6,
                  color: MCM.textMuted,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
              <button
                onClick={addToWireframe}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: MCM.orange,
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Add to Wireframe
              </button>
            </div>
          </aside>
        )}

        {/* ===== CATALOG ELEMENTS PANEL (for pending elements from catalog) ===== */}
        {showCatalogPanel && pendingCatalogElements.length > 0 && (
          <aside
            style={{
              position: 'fixed',
              top: 0,
              right: showReviewPanel ? 400 : 0,
              width: 320,
              height: '100vh',
              background: MCM.surface,
              borderLeft: `2px solid ${MCM.gold}`,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 99,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${MCM.line}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: MCM.gold, letterSpacing: 1 }}>
                  PENDING APPROVAL
                </div>
                <div style={{ fontSize: 10, color: MCM.textMuted, marginTop: 2 }}>
                  {pendingCatalogElements.length} element{pendingCatalogElements.length !== 1 ? 's' : ''} from catalog
                </div>
              </div>
              <button
                onClick={() => setShowCatalogPanel(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: MCM.textDim,
                  fontSize: 20,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>

            {/* Element List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {pendingCatalogElements.map((element) => {
                const color = getColorForType(element.type);
                return (
                  <div
                    key={element.id}
                    style={{
                      padding: 14,
                      background: MCM.bg,
                      borderRadius: 8,
                      marginBottom: 10,
                      border: `1px solid ${MCM.line}`,
                    }}
                  >
                    {/* Element Info */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: MCM.text }}>{element.name}</span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: color,
                          padding: '3px 8px',
                          background: `${color}20`,
                          borderRadius: 4,
                        }}
                      >
                        {element.type}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <div style={{ fontSize: 9, color: MCM.textDim, marginBottom: 12 }}>
                      Sent: {new Date(element.timestamp).toLocaleString()}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => dismissCatalogElement(element.id)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: 'none',
                          border: `1px solid ${MCM.line}`,
                          borderRadius: 4,
                          color: MCM.textMuted,
                          fontSize: 10,
                          cursor: 'pointer',
                        }}
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => approveCatalogElement(element.id)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: MCM.gold,
                          border: 'none',
                          borderRadius: 4,
                          color: MCM.bg,
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Approve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: 12,
                borderTop: `1px solid ${MCM.line}`,
                fontSize: 10,
                color: MCM.textDim,
                textAlign: 'center',
              }}
            >
              Approve elements after implementing in wireframe
            </div>
          </aside>
        )}

        {/* Catalog Panel Toggle Button (when panel is hidden but has items) */}
        {!showCatalogPanel && pendingCatalogElements.length > 0 && (
          <button
            onClick={() => setShowCatalogPanel(true)}
            style={{
              position: 'fixed',
              top: 100,
              right: 20,
              padding: '10px 16px',
              background: MCM.gold,
              color: MCM.bg,
              border: 'none',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              zIndex: 50,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <span style={{ 
              background: MCM.bg, 
              color: MCM.gold, 
              width: 20, 
              height: 20, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
            }}>
              {pendingCatalogElements.length}
            </span>
            Pending Approval
          </button>
        )}
      </div>
    </>
  );
}
