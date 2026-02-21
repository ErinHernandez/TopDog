import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';

import { WireframePhone } from '../../components/dev/WireframePhone';

// ============================================================================
// MCM Design System (Mid-Century Modern)
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
    case 'button':
      return MCM.orange;
    case 'textfield':
    case 'securefield':
      return MCM.teal;
    case 'text':
    case 'label':
      return MCM.gold;
    case 'image':
    case 'icon':
      return MCM.coral;
    case 'tab':
    case 'tabbar':
      return MCM.sage;
    case 'card':
      return MCM.teal;
    case 'progress':
      return MCM.orange;
    case 'badge':
      return MCM.gold;
    case 'list':
      return MCM.lineActive;
    case 'link':
      return MCM.textMuted;
    case 'checkbox':
      return MCM.lineActive;
    case 'segmented':
      return MCM.sage;
    default:
      return MCM.lineActive;
  }
};

// ============================================================================
// Layout Constants
// ============================================================================

const LAYOUT = {
  // Use viewport-based sizing - each side is 50% of viewport
  columnWidth: 450,
  columnGap: 36,
  padding: 24,
  phoneWidth: 240,
  phoneHeight: 500,
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

interface ElementMetadata {
  id: string;
  name: string;
  type: string;
  function: string;
  width: number;
  height: number;
  colors: {
    primary?: string;
    secondary?: string;
    background?: string;
  };
  location: string;
}

// ============================================================================
// Extended Element Data Types (Enterprise Code Analysis)
// ============================================================================

type Severity = 'critical' | 'high' | 'medium' | 'low';
type Effort = 'small' | 'medium' | 'large';
type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
type Codebase = 'typescript' | 'swift';

interface CodeSnippet {
  language: Codebase;
  code: string;
  filePath: string;
  startLine: number;
  endLine: number;
}

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending' | 'skipped';
  duration?: number;
  errorMessage?: string;
}

interface TestInfo {
  total: number;
  passing: number;
  failing: number;
  pending: number;
  skipped: number;
  coverage: number;
  testFiles: string[];
  results: TestResult[];
  lastRun?: string;
}

interface Warning {
  id: string;
  type: 'performance' | 'accessibility' | 'security' | 'deprecation' | 'style' | 'logic';
  rule: string;
  message: string;
  severity: Severity;
  line?: number;
  fixable: boolean;
  suggestion?: string;
}

interface BestPractice {
  id: string;
  category: 'accessibility' | 'performance' | 'security' | 'maintainability' | 'testing';
  text: string;
  implemented: boolean;
  priority: Severity;
  reference?: string;
}

interface ArchitectureNode {
  id: string;
  name: string;
  type: 'component' | 'hook' | 'context' | 'utility' | 'service' | 'view' | 'model';
  filePath: string;
  dependencies: string[];
  dependents: string[];
}

interface AIAnalysis {
  grade: Grade;
  score: number;
  importance: Severity;
  problemSize: Effort;
  confidence: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  refactoringSuggestions: {
    title: string;
    description: string;
    impact: Effort;
    effort: Effort;
    priority: Severity;
  }[];
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  category: 'bug' | 'improvement' | 'refactor' | 'test' | 'docs' | 'accessibility' | 'performance';
  priority: Severity;
  effort: Effort;
  assignee?: string;
  dueDate?: string;
  completed: boolean;
  blockedBy?: string[];
  relatedFiles: string[];
}

interface RelatedDocumentation {
  title: string;
  type: 'api' | 'component' | 'guide' | 'example';
  url: string;
  description?: string;
}

interface PerformanceMetrics {
  renderTime?: number;
  bundleSize?: number;
  memoryUsage?: number;
  rerenderCount?: number;
}

interface ExtendedElementData {
  // Existing Fields
  id: string;
  name: string;
  type: string;
  function: string;
  width: number;
  height: number;
  colors: { primary?: string; secondary?: string };
  location: string;

  // Code Section
  codeSnippets: {
    typescript: CodeSnippet;
    swift: CodeSnippet;
  };

  // Quality Metrics
  tests: {
    typescript: TestInfo;
    swift: TestInfo;
  };
  warnings: {
    typescript: Warning[];
    swift: Warning[];
  };

  // Best Practices
  bestPractices: BestPractice[];

  // Architecture
  architecture: {
    nodes: ArchitectureNode[];
    complexity: 'simple' | 'moderate' | 'complex';
    couplingScore: number;
  };

  // AI Analysis
  aiAnalysis: {
    typescript: AIAnalysis;
    swift: AIAnalysis;
    combined: AIAnalysis;
  };

  // Action Items
  actionItems: ActionItem[];

  // Performance
  performance: {
    typescript: PerformanceMetrics;
    swift: PerformanceMetrics;
  };

  // Documentation
  relatedDocs: RelatedDocumentation[];

  // Metadata
  lastUpdated: string;
  version: string;
  owner?: string;
  tags: string[];
}

// Section configuration for extensibility
interface SectionConfig {
  id: string;
  title: string;
  icon: string;
  defaultOpen: boolean;
  badge?: {
    type: 'count' | 'status' | 'grade';
    getValue: (data: ExtendedElementData, codebase: Codebase) => string | number;
    getColor: (data: ExtendedElementData, codebase: Codebase) => string;
  };
  priority: number;
  visible: boolean;
}

// Helper functions for colors
const getGradeColor = (grade: Grade): string => {
  switch (grade) {
    case 'A':
      return MCM.sage;
    case 'B':
      return MCM.teal;
    case 'C':
      return MCM.gold;
    case 'D':
      return MCM.coral;
    case 'F':
      return MCM.orange;
  }
};

const getSeverityColor = (severity: Severity): string => {
  switch (severity) {
    case 'critical':
      return MCM.orange;
    case 'high':
      return MCM.coral;
    case 'medium':
      return MCM.gold;
    case 'low':
      return MCM.sage;
  }
};

const getEffortLabel = (effort: Effort): string => {
  switch (effort) {
    case 'small':
      return 'S';
    case 'medium':
      return 'M';
    case 'large':
      return 'L';
  }
};

// Section Registry for extensibility
const SECTION_REGISTRY: SectionConfig[] = [
  {
    id: 'code',
    title: 'CODE',
    icon: '{ }',
    defaultOpen: true,
    badge: {
      type: 'count',
      getValue: (d, c) => d.codeSnippets[c].endLine - d.codeSnippets[c].startLine,
      getColor: () => MCM.teal,
    },
    priority: 1,
    visible: true,
  },
  {
    id: 'tests',
    title: 'TESTS',
    icon: '✓',
    defaultOpen: true,
    badge: {
      type: 'status',
      getValue: (d, c) => `${d.tests[c].passing}/${d.tests[c].total}`,
      getColor: (d, c) => (d.tests[c].failing > 0 ? MCM.orange : MCM.sage),
    },
    priority: 2,
    visible: true,
  },
  {
    id: 'warnings',
    title: 'WARNINGS',
    icon: '⚠',
    defaultOpen: false,
    badge: {
      type: 'count',
      getValue: (d, c) => d.warnings[c].length,
      getColor: (d, c) =>
        d.warnings[c].some(w => w.severity === 'critical') ? MCM.orange : MCM.gold,
    },
    priority: 3,
    visible: true,
  },
  {
    id: 'bestPractices',
    title: 'BEST PRACTICES',
    icon: '★',
    defaultOpen: false,
    badge: {
      type: 'status',
      getValue: d =>
        `${d.bestPractices.filter(bp => bp.implemented).length}/${d.bestPractices.length}`,
      getColor: () => MCM.teal,
    },
    priority: 4,
    visible: true,
  },
  {
    id: 'architecture',
    title: 'ARCHITECTURE',
    icon: '◈',
    defaultOpen: false,
    priority: 5,
    visible: true,
  },
  {
    id: 'aiAnalysis',
    title: 'AI ANALYSIS',
    icon: '◉',
    defaultOpen: true,
    badge: {
      type: 'grade',
      getValue: (d, c) => d.aiAnalysis[c].grade,
      getColor: (d, c) => getGradeColor(d.aiAnalysis[c].grade),
    },
    priority: 6,
    visible: true,
  },
  {
    id: 'refactoring',
    title: 'REFACTORING',
    icon: '↻',
    defaultOpen: false,
    badge: {
      type: 'count',
      getValue: (d, c) => d.aiAnalysis[c].refactoringSuggestions.length,
      getColor: () => MCM.gold,
    },
    priority: 7,
    visible: true,
  },
  {
    id: 'actionItems',
    title: 'ACTION ITEMS',
    icon: '☐',
    defaultOpen: true,
    badge: {
      type: 'count',
      getValue: d => d.actionItems.filter(a => !a.completed).length,
      getColor: d =>
        d.actionItems.some(a => a.priority === 'critical' && !a.completed) ? MCM.orange : MCM.teal,
    },
    priority: 8,
    visible: true,
  },
  {
    id: 'performance',
    title: 'PERFORMANCE',
    icon: '⚡',
    defaultOpen: false,
    priority: 9,
    visible: true,
  },
  {
    id: 'docs',
    title: 'DOCUMENTATION',
    icon: '📄',
    defaultOpen: false,
    badge: { type: 'count', getValue: d => d.relatedDocs.length, getColor: () => MCM.textMuted },
    priority: 10,
    visible: true,
  },
];

// ============================================================================
// Screen Data
// ============================================================================

const screens: WireframeScreen[] = [
  {
    title: 'Sign In',
    annotations: [
      { id: '1', name: 'Logo', type: 'Image', notes: 'TopDog mark', y: 0.12, side: 'left' },
      {
        id: '2',
        name: 'Email/Phone',
        type: 'TextField',
        notes: 'Blue border focus',
        y: 0.28,
        side: 'left',
      },
      {
        id: '3',
        name: 'Password',
        type: 'SecureField',
        notes: 'Eye toggle',
        y: 0.38,
        side: 'left',
      },
      { id: '4', name: 'Remember Me', type: 'Checkbox', y: 0.5, side: 'left' },
      { id: '5', name: 'Forgot?', type: 'Link', notes: '→ Reset flow', y: 0.5, side: 'right' },
      { id: '6', name: 'Sign In', type: 'Button', notes: 'Primary CTA', y: 0.6, side: 'right' },
      { id: '7', name: 'Sign Up Link', type: 'Link', y: 0.78, side: 'right' },
    ],
  },
  {
    title: 'Sign Up',
    annotations: [
      { id: '1', name: 'Logo', type: 'Image', y: 0.08, side: 'left' },
      { id: '2', name: 'Header', type: 'Text', notes: 'Create account', y: 0.16, side: 'left' },
      { id: '3', name: 'Email', type: 'TextField', y: 0.26, side: 'left' },
      {
        id: '4',
        name: 'Password',
        type: 'SecureField',
        notes: 'Live validation',
        y: 0.36,
        side: 'left',
      },
      { id: '5', name: 'Confirm', type: 'SecureField', y: 0.46, side: 'left' },
      { id: '6', name: 'Continue', type: 'Button', y: 0.58, side: 'right' },
      {
        id: '7',
        name: 'Requirements',
        type: 'Card',
        notes: 'Password rules',
        y: 0.72,
        side: 'right',
      },
    ],
  },
  {
    title: 'Lobby',
    annotations: [
      { id: '1', name: 'Tournament Card', type: 'Card', y: 0.18, side: 'left' },
      {
        id: '2',
        name: 'Globe Graphic',
        type: 'Image',
        notes: '3D unique art',
        y: 0.26,
        side: 'left',
      },
      {
        id: '3',
        name: 'Progress Bar',
        type: 'Progress',
        notes: 'Entries %',
        y: 0.38,
        side: 'left',
      },
      {
        id: '4',
        name: 'Join Button',
        type: 'Button',
        notes: 'Primary CTA',
        y: 0.46,
        side: 'right',
      },
      { id: '5', name: 'Entry Fee', type: 'Text', notes: '$25', y: 0.54, side: 'left' },
      { id: '6', name: 'Prize Pool', type: 'Text', notes: '$2.1M', y: 0.54, side: 'right' },
      { id: '7', name: 'Tab Bar', type: 'TabBar', notes: '5 tabs', y: 0.92, side: 'right' },
    ],
  },
  {
    title: 'Live Drafts',
    annotations: [
      { id: '1', name: 'Title', type: 'Text', notes: 'Live Drafts', y: 0.06, side: 'left' },
      { id: '2', name: 'Fast Draft Card', type: 'Card', notes: '30s timer', y: 0.2, side: 'left' },
      { id: '3', name: '⚡ Badge', type: 'Badge', notes: 'FAST DRAFT', y: 0.15, side: 'right' },
      { id: '4', name: 'Timer', type: 'Text', notes: 'Countdown', y: 0.28, side: 'right' },
      { id: '5', name: 'Progress', type: 'Progress', y: 0.32, side: 'left' },
      { id: '6', name: 'Slow Draft Card', type: 'Card', notes: '12h timer', y: 0.5, side: 'left' },
      { id: '7', name: 'Tab Bar', type: 'TabBar', y: 0.92, side: 'right' },
    ],
  },
  {
    title: 'Draft: Players',
    annotations: [
      { id: '1', name: 'Top Tabs', type: 'TabBar', notes: '5 draft tabs', y: 0.06, side: 'left' },
      { id: '2', name: 'Search', type: 'TextField', y: 0.14, side: 'left' },
      {
        id: '3',
        name: 'Position Pills',
        type: 'Segmented',
        notes: 'ALL/QB/RB/WR/TE',
        y: 0.22,
        side: 'right',
      },
      {
        id: '4',
        name: 'Player Row',
        type: 'List',
        notes: 'Tap = draft/queue',
        y: 0.42,
        side: 'left',
      },
      { id: '5', name: 'Position Badge', type: 'Badge', notes: 'Colored', y: 0.36, side: 'right' },
      { id: '6', name: 'ADP / Proj', type: 'Text', y: 0.5, side: 'right' },
      {
        id: '7',
        name: 'Timer Bar',
        type: 'Progress',
        notes: 'Pick countdown',
        y: 0.9,
        side: 'left',
      },
    ],
  },
  {
    title: 'Draft: Roster',
    annotations: [
      { id: '1', name: 'Top Tabs', type: 'TabBar', y: 0.06, side: 'left' },
      { id: '2', name: 'QB Slot', type: 'Card', notes: 'Pink', y: 0.16, side: 'left' },
      { id: '3', name: 'RB Slots', type: 'Card', notes: 'Green × 2', y: 0.26, side: 'left' },
      { id: '4', name: 'WR Slots', type: 'Card', notes: 'Yellow × 3', y: 0.4, side: 'right' },
      { id: '5', name: 'TE Slot', type: 'Card', notes: 'Purple', y: 0.54, side: 'right' },
      { id: '6', name: 'FLEX Slot', type: 'Card', notes: '3-stripe', y: 0.62, side: 'left' },
      { id: '7', name: 'Bench Slots', type: 'Card', notes: 'Gray × 4', y: 0.74, side: 'right' },
      { id: '8', name: 'Position Tracker', type: 'Card', y: 0.9, side: 'left' },
    ],
  },
  {
    title: 'Profile',
    annotations: [
      { id: '1', name: 'User Card', type: 'Card', y: 0.12, side: 'left' },
      { id: '2', name: 'Avatar', type: 'Image', y: 0.1, side: 'right' },
      { id: '3', name: 'Username', type: 'Text', y: 0.14, side: 'right' },
      { id: '4', name: 'Balance', type: 'Text', notes: 'Current funds', y: 0.18, side: 'left' },
      { id: '5', name: 'Menu List', type: 'List', notes: 'Settings nav', y: 0.45, side: 'left' },
      { id: '6', name: 'Chevrons', type: 'Icon', notes: '→', y: 0.45, side: 'right' },
      { id: '7', name: 'Add Funds', type: 'Button', notes: '→ Deposit', y: 0.78, side: 'right' },
      { id: '8', name: 'Tab Bar', type: 'TabBar', y: 0.92, side: 'left' },
    ],
  },
];

// Sample metadata for right panel
// Helper to generate element dimensions based on type
const getElementDimensions = (type: string): { width: number; height: number } => {
  switch (type.toLowerCase()) {
    case 'button':
      return { width: 200, height: 44 };
    case 'textfield':
    case 'securefield':
      return { width: 280, height: 44 };
    case 'image':
    case 'icon':
      return { width: 80, height: 80 };
    case 'text':
    case 'label':
      return { width: 160, height: 24 };
    case 'link':
      return { width: 120, height: 20 };
    case 'checkbox':
      return { width: 24, height: 24 };
    case 'card':
      return { width: 280, height: 120 };
    case 'tabbar':
      return { width: 280, height: 56 };
    case 'tab':
      return { width: 60, height: 44 };
    case 'progress':
      return { width: 240, height: 8 };
    case 'badge':
      return { width: 80, height: 24 };
    case 'list':
      return { width: 280, height: 180 };
    case 'segmented':
      return { width: 280, height: 36 };
    default:
      return { width: 200, height: 44 };
  }
};

// Generate metadata from annotations
const generateMetadataFromAnnotations = (
  annotations: Annotation[],
  screenTitle: string,
): ElementMetadata[] => {
  return annotations.map(ann => {
    const dims = getElementDimensions(ann.type);
    return {
      id: ann.id,
      name: ann.name,
      type: ann.type,
      function: ann.notes || `${ann.type} element`,
      width: dims.width,
      height: dims.height,
      colors: { primary: getColorForType(ann.type) },
      location: `${screenTitle} > ${ann.side === 'left' ? 'Left' : 'Right'} Section`,
    };
  });
};

// ============================================================================
// Grid Background Component
// ============================================================================

const GridBackground: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <svg
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      opacity: 0.03,
      pointerEvents: 'none',
    }}
  >
    {Array.from({ length: Math.ceil(width / 32) }).map((_, i) => (
      <line
        key={`v${i}`}
        x1={i * 32}
        y1={0}
        x2={i * 32}
        y2={height}
        stroke="white"
        strokeWidth={0.5}
      />
    ))}
    {Array.from({ length: Math.ceil(height / 32) }).map((_, i) => (
      <line
        key={`h${i}`}
        x1={0}
        y1={i * 32}
        x2={width}
        y2={i * 32}
        stroke="white"
        strokeWidth={0.5}
      />
    ))}
  </svg>
);

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
  const marginRight = 94; // Adjusted for phone moving 66px left
  const marginLeft = 94; // Adjusted for phone moving 66px left

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
      {annotations.map(ann => {
        const phoneY = phoneRect.y + ann.y * phoneRect.height;
        const isLeft = ann.side === 'left';
        const phoneEdgeX = isLeft ? phoneRect.x - 8 : phoneRect.x + phoneRect.width + 8;
        const labelX = isLeft ? phoneEdgeX - marginLeft - labelWidth : phoneEdgeX + marginRight;
        const color = getColorForType(ann.type);

        return (
          <g key={ann.id}>
            {/* Horizontal line from phone to label */}
            <path
              d={`M ${phoneEdgeX} ${phoneY} L ${isLeft ? labelX + labelWidth : labelX} ${phoneY}`}
              stroke={color}
              strokeOpacity={0.6}
              strokeWidth={1}
              strokeDasharray="4 3"
              fill="none"
            />
            {/* Dot on phone edge */}
            <circle cx={phoneEdgeX} cy={phoneY} r={3} fill={color} />
            {/* Dot on label edge */}
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
  const marginRight = 94; // Adjusted for phone moving 66px left
  const marginLeft = 94; // Adjusted for phone moving 66px left
  const isLeft = annotation.side === 'left';
  const phoneEdgeX = isLeft ? phoneRect.x - 8 : phoneRect.x + phoneRect.width + 8;
  const labelX = isLeft ? phoneEdgeX - marginLeft - labelWidth : phoneEdgeX + marginRight;
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
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
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
        <span style={{ fontSize: 11, fontWeight: 500, color: MCM.text }}>{annotation.name}</span>
      </div>
      {annotation.notes && (
        <div style={{ fontSize: 9, color: MCM.textMuted }}>{annotation.notes}</div>
      )}
    </div>
  );
};

// ============================================================================
// Metadata Card Component
// ============================================================================

const MetadataCard: React.FC<{ metadata: ElementMetadata }> = ({ metadata }) => {
  const color = getColorForType(metadata.type);

  return (
    <div
      style={{
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: MCM.text }}>{metadata.name}</span>
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
          {metadata.type}
        </span>
      </div>

      <div style={{ fontSize: 11, color: MCM.textMuted, lineHeight: 1.8 }}>
        <div>
          <span style={{ color: MCM.textDim }}>Function:</span> {metadata.function}
        </div>
        <div>
          <span style={{ color: MCM.textDim }}>Dimensions:</span> {metadata.width}×{metadata.height}
          px
        </div>
        <div>
          <span style={{ color: MCM.textDim }}>Colors:</span>
          {metadata.colors.primary && (
            <span style={{ marginLeft: 8 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  background: metadata.colors.primary,
                  borderRadius: 2,
                  marginRight: 4,
                  verticalAlign: 'middle',
                }}
              />
              {metadata.colors.primary}
            </span>
          )}
        </div>
        <div>
          <span style={{ color: MCM.textDim }}>Location:</span> {metadata.location}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Extended Element Card Sub-Components
// ============================================================================

// Severity Badge Component
const SeverityBadge: React.FC<{ severity: Severity }> = ({ severity }) => {
  const color = getSeverityColor(severity);
  return (
    <span
      style={{
        fontSize: 8,
        fontWeight: 700,
        color: color,
        padding: '2px 6px',
        background: `${color}20`,
        borderRadius: 3,
        textTransform: 'uppercase',
      }}
    >
      {severity}
    </span>
  );
};

// Grade Badge Component
const GradeBadge: React.FC<{ grade: Grade; score: number }> = ({ grade, score }) => {
  const color = getGradeColor(grade);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: `${color}30`,
          border: `2px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: 700,
          color: color,
        }}
      >
        {grade}
      </div>
      <span style={{ fontSize: 12, color: MCM.textMuted }}>{score}/100</span>
    </div>
  );
};

// Codebase Selector Component
const CodebaseSelector: React.FC<{
  selected: Codebase;
  onChange: (codebase: Codebase) => void;
}> = ({ selected, onChange }) => {
  const options: { value: Codebase; label: string; color: string }[] = [
    { value: 'typescript', label: 'TS/React', color: MCM.teal },
    { value: 'swift', label: 'Swift', color: MCM.orange },
  ];

  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: 12 }}>
      {options.map(opt => {
        const isActive = selected === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: 11,
              fontWeight: 600,
              color: isActive ? MCM.bg : opt.color,
              background: isActive ? opt.color : 'transparent',
              border: `1px solid ${opt.color}`,
              borderRadius: opt.value === 'typescript' ? '4px 0 0 4px' : '0 4px 4px 0',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

// Collapsible Section Component
const CollapsibleSection: React.FC<{
  title: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  badge?: { text: string; color: string };
  children: React.ReactNode;
}> = ({ title, icon, isOpen, onToggle, badge, children }) => {
  return (
    <div style={{ marginBottom: 8, borderBottom: `1px solid ${MCM.line}` }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 0',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: MCM.text,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-block',
              width: 16,
              textAlign: 'center',
              transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.15s ease',
              fontSize: 10,
              color: MCM.textMuted,
            }}
          >
            ▼
          </span>
          <span style={{ fontSize: 10, color: MCM.textMuted }}>{icon}</span>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>{title}</span>
        </div>
        {badge && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: badge.color,
              padding: '2px 8px',
              background: `${badge.color}20`,
              borderRadius: 3,
            }}
          >
            {badge.text}
          </span>
        )}
      </button>
      <div
        style={{
          maxHeight: isOpen ? '2000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.2s ease',
          paddingBottom: isOpen ? 12 : 0,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Code Viewer Component with Basic Syntax Highlighting
const CodeViewer: React.FC<{ snippet: CodeSnippet }> = ({ snippet }) => {
  const highlightCode = (code: string, lang: Codebase): React.ReactNode[] => {
    const lines = code.split('\n');
    return lines.map((line, idx) => {
      // Basic syntax highlighting
      const highlighted = line
        .replace(
          /(const|let|var|func|if|return|import|export|struct|class|private|public|@State|@Published)/g,
          `<kw>$1</kw>`,
        )
        .replace(/(".*?"|'.*?'|`.*?`)/g, `<str>$1</str>`)
        .replace(/(\/\/.*$)/g, `<cmt>$1</cmt>`)
        .replace(/\b(React|FC|View|String|Int|Bool|useState|useEffect)\b/g, `<type>$1</type>`);

      return (
        <div
          key={idx}
          style={{
            display: 'flex',
            fontSize: 10,
            lineHeight: 1.6,
            fontFamily: 'Monaco, monospace',
          }}
        >
          <span
            style={{
              width: 32,
              color: MCM.textDim,
              textAlign: 'right',
              paddingRight: 12,
              userSelect: 'none',
            }}
          >
            {snippet.startLine + idx}
          </span>
          <span
            style={{ flex: 1, color: MCM.text }}
            dangerouslySetInnerHTML={{
              __html: highlighted
                .replace(/<kw>/g, `<span style="color:${MCM.teal}">`)
                .replace(/<\/kw>/g, '</span>')
                .replace(/<str>/g, `<span style="color:${MCM.coral}">`)
                .replace(/<\/str>/g, '</span>')
                .replace(/<cmt>/g, `<span style="color:${MCM.textDim}">`)
                .replace(/<\/cmt>/g, '</span>')
                .replace(/<type>/g, `<span style="color:${MCM.gold}">`)
                .replace(/<\/type>/g, '</span>'),
            }}
          />
        </div>
      );
    });
  };

  return (
    <div style={{ background: MCM.bg, borderRadius: 4, padding: 12, marginBottom: 8 }}>
      <div
        style={{
          fontSize: 9,
          color: MCM.textMuted,
          marginBottom: 8,
          fontFamily: 'Monaco, monospace',
        }}
      >
        📁 {snippet.filePath}:{snippet.startLine}-{snippet.endLine}
      </div>
      <div style={{ maxHeight: 180, overflow: 'auto' }}>
        {highlightCode(snippet.code, snippet.language)}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          style={{
            fontSize: 9,
            padding: '4px 8px',
            background: MCM.surface,
            border: `1px solid ${MCM.line}`,
            borderRadius: 3,
            color: MCM.textMuted,
            cursor: 'pointer',
          }}
        >
          Copy
        </button>
        <button
          style={{
            fontSize: 9,
            padding: '4px 8px',
            background: MCM.surface,
            border: `1px solid ${MCM.line}`,
            borderRadius: 3,
            color: MCM.teal,
            cursor: 'pointer',
          }}
        >
          View Full →
        </button>
      </div>
    </div>
  );
};

// Test Status Bar Component
const TestStatusBar: React.FC<{ tests: TestInfo }> = ({ tests }) => {
  const total = tests.total || 1;
  const passPercent = (tests.passing / total) * 100;
  const failPercent = (tests.failing / total) * 100;
  const pendingPercent = (tests.pending / total) * 100;

  return (
    <div>
      <div
        style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}
      >
        <div style={{ width: `${passPercent}%`, background: MCM.sage }} />
        <div style={{ width: `${failPercent}%`, background: MCM.orange }} />
        <div style={{ width: `${pendingPercent}%`, background: MCM.gold }} />
        <div style={{ flex: 1, background: MCM.line }} />
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 10, marginBottom: 12 }}>
        <span style={{ color: MCM.sage }}>● {tests.passing} Pass</span>
        <span style={{ color: MCM.orange }}>● {tests.failing} Fail</span>
        <span style={{ color: MCM.gold }}>○ {tests.pending} Pending</span>
        <span style={{ color: MCM.textMuted, marginLeft: 'auto' }}>
          Coverage: {tests.coverage}%
        </span>
      </div>
      <div style={{ maxHeight: 120, overflow: 'auto' }}>
        {tests.results.slice(0, 5).map((test, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 10,
              padding: '4px 0',
              borderBottom: `1px solid ${MCM.line}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  color:
                    test.status === 'pass'
                      ? MCM.sage
                      : test.status === 'fail'
                        ? MCM.orange
                        : MCM.gold,
                }}
              >
                {test.status === 'pass' ? '✓' : test.status === 'fail' ? '✗' : '○'}
              </span>
              <span style={{ color: MCM.text }}>{test.name}</span>
            </div>
            {test.duration && <span style={{ color: MCM.textDim }}>{test.duration}ms</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

// Warnings List Component
const WarningsList: React.FC<{ warnings: Warning[] }> = ({ warnings }) => {
  if (warnings.length === 0) {
    return <div style={{ fontSize: 10, color: MCM.sage, padding: 8 }}>✓ No warnings</div>;
  }

  return (
    <div style={{ maxHeight: 200, overflow: 'auto' }}>
      {warnings.map(warning => (
        <div key={warning.id} style={{ padding: '8px 0', borderBottom: `1px solid ${MCM.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <SeverityBadge severity={warning.severity} />
            <span style={{ fontSize: 10, color: MCM.teal, fontFamily: 'Monaco, monospace' }}>
              {warning.rule}
            </span>
          </div>
          <div style={{ fontSize: 10, color: MCM.text, marginBottom: 4 }}>{warning.message}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {warning.line && (
              <span style={{ fontSize: 9, color: MCM.textDim }}>Line {warning.line}</span>
            )}
            {warning.fixable && (
              <span style={{ fontSize: 9, color: MCM.sage }}>• Fix Available</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Best Practices Checklist Component
const BestPracticesChecklist: React.FC<{ practices: BestPractice[] }> = ({ practices }) => {
  return (
    <div style={{ maxHeight: 200, overflow: 'auto' }}>
      {practices.map(practice => (
        <div
          key={practice.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '6px 0',
            borderBottom: `1px solid ${MCM.line}`,
          }}
        >
          <span style={{ color: practice.implemented ? MCM.sage : MCM.textDim, fontSize: 12 }}>
            {practice.implemented ? '☑' : '☐'}
          </span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 10, color: practice.implemented ? MCM.text : MCM.textMuted }}>
              {practice.text}
            </span>
            {practice.reference && (
              <span style={{ fontSize: 9, color: MCM.teal, marginLeft: 8, cursor: 'pointer' }}>
                → Docs
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Architecture Diagram Component (Simplified)
const ArchitectureDiagram: React.FC<{ architecture: ExtendedElementData['architecture'] }> = ({
  architecture,
}) => {
  const nodeColors: Record<string, string> = {
    component: MCM.orange,
    hook: MCM.teal,
    context: MCM.gold,
    utility: MCM.sage,
    service: MCM.coral,
    view: MCM.orange,
    model: MCM.teal,
  };

  return (
    <div>
      <svg width="100%" height="120" style={{ background: MCM.bg, borderRadius: 4 }}>
        {architecture.nodes.slice(0, 5).map((node, idx) => {
          const x = 60 + idx * 100;
          const y = 60;
          const color = nodeColors[node.type] || MCM.textMuted;
          return (
            <g key={node.id}>
              <rect
                x={x - 35}
                y={y - 20}
                width={70}
                height={40}
                rx={4}
                fill={`${color}30`}
                stroke={color}
                strokeWidth={1}
              />
              <text x={x} y={y - 4} textAnchor="middle" fill={color} fontSize={8} fontWeight={600}>
                {node.type}
              </text>
              <text x={x} y={y + 10} textAnchor="middle" fill={MCM.text} fontSize={9}>
                {node.name.slice(0, 8)}
              </text>
              {idx > 0 && (
                <line
                  x1={x - 35}
                  y1={y}
                  x2={x - 65}
                  y2={y}
                  stroke={MCM.line}
                  strokeDasharray="2,2"
                />
              )}
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 16, fontSize: 10, marginTop: 8, color: MCM.textMuted }}>
        <span>
          Complexity: <span style={{ color: MCM.text }}>{architecture.complexity}</span>
        </span>
        <span>
          Coupling:{' '}
          <span style={{ color: architecture.couplingScore > 60 ? MCM.orange : MCM.sage }}>
            {architecture.couplingScore}
          </span>
        </span>
      </div>
    </div>
  );
};

// Action Item Row Component
const ActionItemRow: React.FC<{
  item: ActionItem;
  onToggle: () => void;
}> = ({ item, onToggle }) => {
  return (
    <div style={{ padding: '8px 0', borderBottom: `1px solid ${MCM.line}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <button
          onClick={onToggle}
          style={{
            fontSize: 14,
            color: item.completed ? MCM.sage : MCM.textDim,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            marginTop: -2,
          }}
        >
          {item.completed ? '☑' : '☐'}
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              color: item.completed ? MCM.textDim : MCM.text,
              textDecoration: item.completed ? 'line-through' : 'none',
              marginBottom: 4,
            }}
          >
            {item.title}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <SeverityBadge severity={item.priority} />
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: MCM.textMuted,
                padding: '2px 6px',
                background: MCM.surface,
                borderRadius: 3,
              }}
            >
              {getEffortLabel(item.effort)}
            </span>
            <span
              style={{
                fontSize: 8,
                color: MCM.textMuted,
                padding: '2px 6px',
                background: MCM.surface,
                borderRadius: 3,
              }}
            >
              {item.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Mock Data Generator
// ============================================================================

const generateExtendedElementData = (
  annotation: Annotation,
  screenTitle: string,
  elementIndex: number,
): ExtendedElementData => {
  const dims = getElementDimensions(annotation.type);
  const color = getColorForType(annotation.type);
  const typeLower = annotation.type.toLowerCase();

  // Generate realistic code snippets based on type
  const tsCode =
    typeLower === 'button'
      ? `const ${annotation.name.replace(/\s/g, '')}: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  disabled,
  loading,
}) => {
  return (
    <button
      className={styles.button}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label="${annotation.name}"
    >
      {loading ? <Spinner /> : children}
    </button>
  );
};`
      : `const ${annotation.name.replace(/\s/g, '')}: React.FC<Props> = ({ value, onChange }) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className={styles.${typeLower}}>
      <input
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="${annotation.name}"
      />
    </div>
  );
};`;

  const swiftCode =
    typeLower === 'button'
      ? `struct ${annotation.name.replace(/\s/g, '')}Button: View {
    @State private var isLoading = false
    var action: () -> Void

    var body: some View {
        Button(action: {
            isLoading = true
            action()
        }) {
            if isLoading {
                ProgressView()
            } else {
                Text("${annotation.name}")
            }
        }
        .accessibilityLabel("${annotation.name}")
    }
}`
      : `struct ${annotation.name.replace(/\s/g, '')}View: View {
    @Binding var text: String
    @FocusState private var isFocused: Bool

    var body: some View {
        TextField("${annotation.name}", text: $text)
            .focused($isFocused)
            .accessibilityLabel("${annotation.name}")
    }
}`;

  // Generate test data
  const testCount = typeLower === 'button' ? 6 : typeLower.includes('field') ? 8 : 4;
  const failingCount = elementIndex % 3 === 0 ? 1 : 0;
  const pendingCount = elementIndex % 4 === 0 ? 1 : 0;
  const passingCount = testCount - failingCount - pendingCount;

  const testResults: TestResult[] = [
    { name: `renders ${annotation.name} correctly`, status: 'pass' as const, duration: 8 },
    { name: 'handles user interaction', status: 'pass' as const, duration: 4 },
    { name: 'accessibility compliance', status: 'pass' as const, duration: 12 },
    ...(failingCount > 0
      ? [
          {
            name: 'loading state visible',
            status: 'fail' as const,
            errorMessage: 'Expected spinner to be visible',
          },
        ]
      : []),
    ...(pendingCount > 0 ? [{ name: 'integration test', status: 'pending' as const }] : []),
    { name: 'snapshot matches', status: 'pass' as const, duration: 3 },
  ].slice(0, testCount);

  // Generate warnings
  const warnings: Warning[] = [];
  if (elementIndex % 2 === 0) {
    warnings.push({
      id: `w1-${annotation.id}`,
      type: 'accessibility',
      rule: 'jsx-a11y/click-events-have-key-events',
      message: 'Missing keyboard event handler',
      severity: 'medium',
      line: 12,
      fixable: true,
    });
  }
  if (elementIndex % 3 === 0) {
    warnings.push({
      id: `w2-${annotation.id}`,
      type: 'performance',
      rule: 'react-hooks/exhaustive-deps',
      message: 'Missing dependency in useEffect',
      severity: 'high',
      line: 24,
      fixable: true,
      suggestion: 'Add missing dependency to array',
    });
  }

  // Generate best practices
  const bestPractices: BestPractice[] = [
    {
      id: 'bp1',
      category: 'accessibility',
      text: 'Has proper ARIA labels',
      implemented: true,
      priority: 'high',
    },
    {
      id: 'bp2',
      category: 'accessibility',
      text: 'Keyboard navigable',
      implemented: elementIndex % 2 === 0,
      priority: 'high',
    },
    {
      id: 'bp3',
      category: 'performance',
      text: 'Memoized callbacks',
      implemented: elementIndex % 3 !== 0,
      priority: 'medium',
    },
    { id: 'bp4', category: 'testing', text: 'Has unit tests', implemented: true, priority: 'high' },
    {
      id: 'bp5',
      category: 'maintainability',
      text: 'TypeScript strict mode',
      implemented: true,
      priority: 'medium',
    },
    {
      id: 'bp6',
      category: 'security',
      text: 'Sanitizes input',
      implemented: typeLower.includes('field'),
      priority: 'high',
    },
  ];

  // Generate AI analysis
  const grades: Grade[] = ['A', 'B', 'B', 'C', 'B', 'A', 'C'];
  const grade = grades[elementIndex % grades.length]!;
  const score = grade === 'A' ? 92 : grade === 'B' ? 82 : grade === 'C' ? 72 : 60;

  const aiAnalysis: AIAnalysis = {
    grade,
    score,
    importance: elementIndex < 3 ? 'high' : 'medium',
    problemSize: failingCount > 0 ? 'medium' : 'small',
    confidence: 85 + (elementIndex % 10),
    summary: `${annotation.name} follows most patterns but ${failingCount > 0 ? 'has failing tests' : 'could use minor improvements'}.`,
    strengths: [
      'Clean TypeScript types',
      'Good accessibility with ARIA labels',
      'Follows component patterns',
    ],
    weaknesses:
      failingCount > 0
        ? ['Missing loading state', 'Test coverage below threshold']
        : ['Could add error boundary'],
    suggestions: [
      'Add loading spinner component',
      'Implement error boundary',
      'Increase test coverage to 90%',
    ],
    refactoringSuggestions: [
      {
        title: 'Extract shared styles',
        description: 'Move repeated styles to shared module',
        impact: 'small',
        effort: 'small',
        priority: 'low',
      },
      ...(failingCount > 0
        ? [
            {
              title: 'Add loading state',
              description: 'Implement loading indicator for async operations',
              impact: 'medium' as Effort,
              effort: 'small' as Effort,
              priority: 'high' as Severity,
            },
          ]
        : []),
    ],
  };

  // Generate action items
  const actionItems: ActionItem[] = [
    {
      id: `ai1-${annotation.id}`,
      title: `Add loading state to ${annotation.name}`,
      description: 'Implement loading indicator for async operations',
      category: 'improvement',
      priority: 'high',
      effort: 'small',
      completed: false,
      relatedFiles: [`${annotation.name.replace(/\s/g, '')}.tsx`],
    },
    {
      id: `ai2-${annotation.id}`,
      title: `Write additional tests`,
      description: 'Increase coverage to meet tier thresholds',
      category: 'test',
      priority: 'medium',
      effort: 'medium',
      completed: elementIndex % 2 === 0,
      relatedFiles: [`${annotation.name.replace(/\s/g, '')}.test.tsx`],
    },
  ];

  return {
    id: annotation.id,
    name: annotation.name,
    type: annotation.type,
    function: annotation.notes || `${annotation.type} element`,
    width: dims.width,
    height: dims.height,
    colors: { primary: color },
    location: `${screenTitle} > ${annotation.side === 'left' ? 'Left' : 'Right'} Section`,
    codeSnippets: {
      typescript: {
        language: 'typescript',
        code: tsCode,
        filePath: `/components/ui/${annotation.name.replace(/\s/g, '')}.tsx`,
        startLine: 12,
        endLine: 12 + tsCode.split('\n').length,
      },
      swift: {
        language: 'swift',
        code: swiftCode,
        filePath: `/TopDog-iOS/Views/${annotation.name.replace(/\s/g, '')}View.swift`,
        startLine: 8,
        endLine: 8 + swiftCode.split('\n').length,
      },
    },
    tests: {
      typescript: {
        total: testCount,
        passing: passingCount,
        failing: failingCount,
        pending: pendingCount,
        skipped: 0,
        coverage: 75 + ((elementIndex * 3) % 20),
        testFiles: [`${annotation.name.replace(/\s/g, '')}.test.tsx`],
        results: testResults,
        lastRun: '2026-02-05T12:00:00.000Z',
      },
      swift: {
        total: Math.ceil(testCount * 0.8),
        passing: Math.ceil(passingCount * 0.8),
        failing: failingCount,
        pending: 0,
        skipped: 0,
        coverage: 70 + ((elementIndex * 2) % 15),
        testFiles: [`${annotation.name.replace(/\s/g, '')}Tests.swift`],
        results: testResults.slice(0, Math.ceil(testCount * 0.8)),
        lastRun: '2026-02-05T12:00:00.000Z',
      },
    },
    warnings: {
      typescript: warnings,
      swift: warnings.map(w => ({ ...w, id: `swift-${w.id}` })).slice(0, 1),
    },
    bestPractices,
    architecture: {
      nodes: [
        {
          id: 'ctx',
          name: 'AppContext',
          type: 'context',
          filePath: '/contexts/AppContext.tsx',
          dependencies: [],
          dependents: ['hook'],
        },
        {
          id: 'hook',
          name: 'useAuth',
          type: 'hook',
          filePath: '/hooks/useAuth.ts',
          dependencies: ['ctx'],
          dependents: ['comp'],
        },
        {
          id: 'comp',
          name: annotation.name.replace(/\s/g, ''),
          type: 'component',
          filePath: `/components/${annotation.name.replace(/\s/g, '')}.tsx`,
          dependencies: ['hook'],
          dependents: [],
        },
      ],
      complexity: testCount > 6 ? 'moderate' : 'simple',
      couplingScore: 25 + ((elementIndex * 5) % 40),
    },
    aiAnalysis: {
      typescript: aiAnalysis,
      swift: { ...aiAnalysis, score: aiAnalysis.score - 5 },
      combined: aiAnalysis,
    },
    actionItems,
    performance: {
      typescript: { renderTime: 4 + elementIndex, bundleSize: 2400 + elementIndex * 100 },
      swift: { renderTime: 3 + elementIndex, memoryUsage: 1800 + elementIndex * 80 },
    },
    relatedDocs: [
      { title: 'Component API', type: 'api', url: '#', description: 'API reference' },
      { title: 'Usage Guide', type: 'guide', url: '#', description: 'How to use' },
    ],
    lastUpdated: '2026-02-05T12:00:00.000Z',
    version: '1.2.3',
    owner: '@frontend-team',
    tags: [typeLower, 'ui', screenTitle.toLowerCase().replace(/\s/g, '-')],
  };
};

// ============================================================================
// Extended Element Card Component
// ============================================================================

const ExtendedElementCard: React.FC<{
  data: ExtendedElementData;
}> = ({ data }) => {
  const [codebase, setCodebase] = useState<Codebase>('typescript');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['code', 'tests', 'aiAnalysis', 'actionItems']),
  );
  const [actionItemsState, setActionItemsState] = useState<Record<string, boolean>>(
    Object.fromEntries(data.actionItems.map(item => [item.id, item.completed])),
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const toggleActionItem = (itemId: string) => {
    setActionItemsState(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const expandAll = () => setExpandedSections(new Set(SECTION_REGISTRY.map(s => s.id)));
  const collapseAll = () => setExpandedSections(new Set());

  const currentCodebaseData = {
    snippet: data.codeSnippets[codebase],
    tests: data.tests[codebase],
    warnings: data.warnings[codebase],
    analysis: data.aiAnalysis[codebase],
    performance: data.performance[codebase],
  };

  return (
    <div
      style={{
        width: 700,
        minHeight: 400,
        background: MCM.surface,
        borderRadius: 8,
        border: `1px solid ${MCM.line}`,
        padding: 16,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: MCM.text }}>{data.name}</span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: getColorForType(data.type),
              padding: '3px 8px',
              background: `${getColorForType(data.type)}20`,
              borderRadius: 4,
              marginLeft: 10,
            }}
          >
            {data.type}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={expandAll}
            style={{
              fontSize: 9,
              padding: '4px 8px',
              background: MCM.bg,
              border: `1px solid ${MCM.line}`,
              borderRadius: 3,
              color: MCM.textMuted,
              cursor: 'pointer',
            }}
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            style={{
              fontSize: 9,
              padding: '4px 8px',
              background: MCM.bg,
              border: `1px solid ${MCM.line}`,
              borderRadius: 3,
              color: MCM.textMuted,
              cursor: 'pointer',
            }}
          >
            Collapse
          </button>
        </div>
      </div>

      {/* Codebase Selector */}
      <CodebaseSelector selected={codebase} onChange={setCodebase} />

      {/* Element Preview */}
      <div
        style={{
          padding: 24,
          background: MCM.bg,
          borderRadius: 4,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: Math.min(data.width, 300),
            height: Math.min(data.height, 80),
            borderRadius: 4,
            border: `1px dashed ${MCM.line}`,
            background: MCM.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: MCM.textDim,
          }}
        >
          {data.width}×{data.height}
        </div>
      </div>

      {/* Collapsible Sections */}
      <div style={{ maxHeight: 600, overflowY: 'auto' }}>
        {/* CODE Section */}
        <CollapsibleSection
          title="CODE"
          icon="{ }"
          isOpen={expandedSections.has('code')}
          onToggle={() => toggleSection('code')}
          badge={{
            text: `${currentCodebaseData.snippet.endLine - currentCodebaseData.snippet.startLine} lines`,
            color: MCM.teal,
          }}
        >
          <CodeViewer snippet={currentCodebaseData.snippet} />
        </CollapsibleSection>

        {/* TESTS Section */}
        <CollapsibleSection
          title="TESTS"
          icon="✓"
          isOpen={expandedSections.has('tests')}
          onToggle={() => toggleSection('tests')}
          badge={{
            text: `${currentCodebaseData.tests.passing}/${currentCodebaseData.tests.total}`,
            color: currentCodebaseData.tests.failing > 0 ? MCM.orange : MCM.sage,
          }}
        >
          <TestStatusBar tests={currentCodebaseData.tests} />
        </CollapsibleSection>

        {/* WARNINGS Section */}
        <CollapsibleSection
          title="WARNINGS"
          icon="⚠"
          isOpen={expandedSections.has('warnings')}
          onToggle={() => toggleSection('warnings')}
          badge={{
            text: String(currentCodebaseData.warnings.length),
            color: currentCodebaseData.warnings.some(w => w.severity === 'critical')
              ? MCM.orange
              : MCM.gold,
          }}
        >
          <WarningsList warnings={currentCodebaseData.warnings} />
        </CollapsibleSection>

        {/* BEST PRACTICES Section */}
        <CollapsibleSection
          title="BEST PRACTICES"
          icon="★"
          isOpen={expandedSections.has('bestPractices')}
          onToggle={() => toggleSection('bestPractices')}
          badge={{
            text: `${data.bestPractices.filter(bp => bp.implemented).length}/${data.bestPractices.length}`,
            color: MCM.teal,
          }}
        >
          <BestPracticesChecklist practices={data.bestPractices} />
        </CollapsibleSection>

        {/* ARCHITECTURE Section */}
        <CollapsibleSection
          title="ARCHITECTURE"
          icon="◈"
          isOpen={expandedSections.has('architecture')}
          onToggle={() => toggleSection('architecture')}
        >
          <ArchitectureDiagram architecture={data.architecture} />
        </CollapsibleSection>

        {/* AI ANALYSIS Section */}
        <CollapsibleSection
          title="AI ANALYSIS"
          icon="◉"
          isOpen={expandedSections.has('aiAnalysis')}
          onToggle={() => toggleSection('aiAnalysis')}
          badge={{
            text: currentCodebaseData.analysis.grade,
            color: getGradeColor(currentCodebaseData.analysis.grade),
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <GradeBadge
                grade={currentCodebaseData.analysis.grade}
                score={currentCodebaseData.analysis.score}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <SeverityBadge severity={currentCodebaseData.analysis.importance} />
                <span
                  style={{
                    fontSize: 9,
                    color: MCM.textMuted,
                    padding: '2px 6px',
                    background: MCM.bg,
                    borderRadius: 3,
                  }}
                >
                  {currentCodebaseData.analysis.problemSize} effort
                </span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: MCM.text, marginBottom: 12, lineHeight: 1.5 }}>
              {currentCodebaseData.analysis.summary}
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: MCM.sage, fontWeight: 600, marginBottom: 4 }}>
                Strengths:
              </div>
              {currentCodebaseData.analysis.strengths.map((s, i) => (
                <div key={i} style={{ fontSize: 10, color: MCM.textMuted, paddingLeft: 8 }}>
                  • {s}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, color: MCM.coral, fontWeight: 600, marginBottom: 4 }}>
                Weaknesses:
              </div>
              {currentCodebaseData.analysis.weaknesses.map((w, i) => (
                <div key={i} style={{ fontSize: 10, color: MCM.textMuted, paddingLeft: 8 }}>
                  • {w}
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>

        {/* REFACTORING Section */}
        <CollapsibleSection
          title="REFACTORING"
          icon="↻"
          isOpen={expandedSections.has('refactoring')}
          onToggle={() => toggleSection('refactoring')}
          badge={{
            text: String(currentCodebaseData.analysis.refactoringSuggestions.length),
            color: MCM.gold,
          }}
        >
          <div>
            {currentCodebaseData.analysis.refactoringSuggestions.map((sug, idx) => (
              <div key={idx} style={{ padding: '8px 0', borderBottom: `1px solid ${MCM.line}` }}>
                <div style={{ fontSize: 11, color: MCM.text, fontWeight: 500, marginBottom: 4 }}>
                  {sug.title}
                </div>
                <div style={{ fontSize: 10, color: MCM.textMuted, marginBottom: 4 }}>
                  {sug.description}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <SeverityBadge severity={sug.priority} />
                  <span
                    style={{
                      fontSize: 8,
                      color: MCM.textDim,
                      padding: '2px 6px',
                      background: MCM.bg,
                      borderRadius: 3,
                    }}
                  >
                    Impact: {sug.impact}
                  </span>
                  <span
                    style={{
                      fontSize: 8,
                      color: MCM.textDim,
                      padding: '2px 6px',
                      background: MCM.bg,
                      borderRadius: 3,
                    }}
                  >
                    Effort: {sug.effort}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* ACTION ITEMS Section */}
        <CollapsibleSection
          title="ACTION ITEMS"
          icon="☐"
          isOpen={expandedSections.has('actionItems')}
          onToggle={() => toggleSection('actionItems')}
          badge={{
            text: String(data.actionItems.filter(a => !actionItemsState[a.id]).length),
            color: data.actionItems.some(a => a.priority === 'critical' && !actionItemsState[a.id])
              ? MCM.orange
              : MCM.teal,
          }}
        >
          <div>
            {data.actionItems.map(item => (
              <ActionItemRow
                key={item.id}
                item={{ ...item, completed: actionItemsState[item.id] ?? item.completed }}
                onToggle={() => toggleActionItem(item.id)}
              />
            ))}
          </div>
        </CollapsibleSection>

        {/* PERFORMANCE Section */}
        <CollapsibleSection
          title="PERFORMANCE"
          icon="⚡"
          isOpen={expandedSections.has('performance')}
          onToggle={() => toggleSection('performance')}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {currentCodebaseData.performance.renderTime && (
              <div style={{ background: MCM.bg, padding: 12, borderRadius: 4 }}>
                <div style={{ fontSize: 9, color: MCM.textMuted, marginBottom: 4 }}>
                  Render Time
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: MCM.teal }}>
                  {currentCodebaseData.performance.renderTime}ms
                </div>
              </div>
            )}
            {currentCodebaseData.performance.bundleSize && (
              <div style={{ background: MCM.bg, padding: 12, borderRadius: 4 }}>
                <div style={{ fontSize: 9, color: MCM.textMuted, marginBottom: 4 }}>
                  Bundle Size
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: MCM.gold }}>
                  {(currentCodebaseData.performance.bundleSize / 1000).toFixed(1)}KB
                </div>
              </div>
            )}
            {currentCodebaseData.performance.memoryUsage && (
              <div style={{ background: MCM.bg, padding: 12, borderRadius: 4 }}>
                <div style={{ fontSize: 9, color: MCM.textMuted, marginBottom: 4 }}>Memory</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: MCM.sage }}>
                  {(currentCodebaseData.performance.memoryUsage / 1000).toFixed(1)}KB
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* DOCUMENTATION Section */}
        <CollapsibleSection
          title="DOCUMENTATION"
          icon="📄"
          isOpen={expandedSections.has('docs')}
          onToggle={() => toggleSection('docs')}
          badge={{
            text: String(data.relatedDocs.length),
            color: MCM.textMuted,
          }}
        >
          <div>
            {data.relatedDocs.map((doc, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 0',
                  borderBottom: `1px solid ${MCM.line}`,
                }}
              >
                <span style={{ fontSize: 10, color: MCM.teal, cursor: 'pointer' }}>
                  {doc.title}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: MCM.textDim,
                    padding: '1px 4px',
                    background: MCM.bg,
                    borderRadius: 2,
                  }}
                >
                  {doc.type}
                </span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: `1px solid ${MCM.line}`,
          fontSize: 9,
          color: MCM.textDim,
          display: 'flex',
          gap: 12,
        }}
      >
        <span>Updated: {new Date(data.lastUpdated).toLocaleDateString()}</span>
        <span>v{data.version}</span>
        {data.owner && <span>Owner: {data.owner}</span>}
      </div>
    </div>
  );
};

// ============================================================================
// Main Page Component
// ============================================================================

export default function WireframeScreenshotPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(true);

  const phoneWidth = LAYOUT.phoneWidth;
  const phoneHeight = LAYOUT.phoneHeight;
  const leftContainerWidth = 1100;
  const containerHeight = 640;
  const phoneX = (leftContainerWidth - phoneWidth) / 2 - 66;
  const phoneY = (containerHeight - phoneHeight) / 2;

  const currentScreen = screens[selectedIndex];

  return (
    <>
      <Head>
        <title>TopDog Wireframe + Screenshots</title>
      </Head>

      {/* Global style to permanently hide ALL scrollbars */}
      <style jsx global>{`
        /* Hide scrollbars for Chrome, Safari, Edge, Opera */
        .wireframe-screenshot-page::-webkit-scrollbar,
        .wireframe-screenshot-page *::-webkit-scrollbar,
        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
        /* Hide scrollbars for Firefox */
        .wireframe-screenshot-page,
        .wireframe-screenshot-page *,
        html,
        body {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      <div
        className="wireframe-screenshot-page"
        style={{
          width: '100vw',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: MCM.bg,
          color: MCM.text,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* ===== SHARED HEADER (Full viewport width) ===== */}
        <header
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            background: MCM.surface,
            borderBottom: `1px solid ${MCM.line}`,
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          {/* Left side - Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <svg width={36} height={36} viewBox="0 0 36 36">
              <circle cx={18} cy={18} r={16} stroke={MCM.orange} strokeWidth={1.5} fill="none" />
              <circle cx={18} cy={18} r={4} fill={MCM.orange} />
              {[0, 1, 2].map(i => {
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
              <div style={{ fontSize: 10, fontWeight: 500, color: MCM.textMuted }}>
                iOS Developer Wireframes
              </div>
            </div>
          </div>

          {/* Center - Screen Selector Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {screens.map((screen, i) => (
              <React.Fragment key={screen.title}>
                <button
                  onClick={() => setSelectedIndex(i)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    padding: '10px 14px',
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
                  {selectedIndex === i ? (
                    <svg width={6} height={6} viewBox="0 0 6 6">
                      <path d="M3 0 L6 3 L3 6 L0 3 Z" fill={MCM.orange} />
                    </svg>
                  ) : (
                    <div
                      style={{ width: 4, height: 4, borderRadius: '50%', background: MCM.line }}
                    />
                  )}
                </button>
                {i < screens.length - 1 && (
                  <div style={{ width: 20, height: 1, background: MCM.line }} />
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Right side - Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
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
              <div
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: MCM.surface,
                  border: `1.5px solid ${showAnnotations ? MCM.orange : MCM.line}`,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: showAnnotations ? MCM.orange : MCM.textDim,
                    position: 'absolute',
                    top: 4,
                    left: showAnnotations ? 26 : 4,
                    transition: 'left 0.2s ease',
                  }}
                />
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

        {/* ===== CONTENT AREA (Two panels side by side) ===== */}
        <div style={{ display: 'flex', flex: 1 }}>
          {/* ===== LEFT PANEL (Wireframe Viewer) ===== */}
          <div
            style={{
              width: '100vw',
              minWidth: '100vw',
              flexShrink: 0,
              height: 'calc(100vh - 64px)',
              overflowY: 'auto',
              overflowX: 'auto',
              position: 'relative',
            }}
          >
            <GridBackground width={3840} height={2000} />

            {/* Main Content Area with Columns Side by Side */}
            <div style={{ display: 'flex', margin: '20px 0 20px 40px', minWidth: '200vw' }}>
              {/* Wireframe with Annotations */}
              <main
                style={{ position: 'relative', width: leftContainerWidth, height: containerHeight }}
              >
                <AnnotationLabels
                  annotations={currentScreen!.annotations}
                  phoneRect={{ x: phoneX, y: phoneY, width: phoneWidth, height: phoneHeight }}
                  containerWidth={leftContainerWidth}
                  show={showAnnotations}
                />

                {showAnnotations &&
                  currentScreen!.annotations.map(ann => (
                    <AnnotationCard
                      key={ann.id}
                      annotation={ann}
                      phoneRect={{ x: phoneX, y: phoneY, width: phoneWidth, height: phoneHeight }}
                      containerWidth={leftContainerWidth}
                    />
                  ))}

                <div style={{ position: 'absolute', left: phoneX, top: phoneY }}>
                  <WireframePhone
                    screen={currentScreen!.title}
                    width={phoneWidth}
                    height={phoneHeight}
                  />
                </div>
              </main>

              {/* Columns 1 & 2 positioned to the right */}
              <div
                style={{
                  display: 'flex',
                  gap: LAYOUT.columnGap * 3,
                  marginTop: phoneY - 40, // Align with main wireframe
                  marginLeft: 100,
                }}
              >
                {/* Column 1: Full iPhone Screenshots */}
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: MCM.textMuted,
                      letterSpacing: 1,
                      marginBottom: 16,
                      paddingBottom: 8,
                      borderBottom: `1px solid ${MCM.line}`,
                      textAlign: 'center',
                    }}
                  >
                    FULL SCREENSHOTS
                  </div>

                  {/* iPhone frames */}
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ marginBottom: 24, marginTop: i === 0 ? 0 : 200 }}>
                      <WireframePhone
                        screen={screens[i % screens.length]!.title}
                        width={LAYOUT.phoneWidth}
                        height={LAYOUT.phoneHeight}
                      />
                    </div>
                  ))}
                </div>

                {/* Column 2: Extended Element Analysis Cards */}
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: MCM.textMuted,
                      letterSpacing: 1,
                      marginBottom: 16,
                      paddingBottom: 8,
                      borderBottom: `1px solid ${MCM.line}`,
                    }}
                  >
                    ELEMENT ANALYSIS ({currentScreen!.annotations.length} elements)
                  </div>

                  {/* Extended Element Cards in horizontal row */}
                  <div
                    style={{ display: 'flex', flexDirection: 'row', gap: 32, flexWrap: 'nowrap' }}
                  >
                    {currentScreen!.annotations.map((annotation, idx) => (
                      <div key={annotation.id} style={{ flexShrink: 0 }}>
                        <ExtendedElementCard
                          data={generateExtendedElementData(annotation, currentScreen!.title, idx)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ALL SCREENS Section */}
            <section
              style={{
                borderTop: `2px solid ${MCM.orange}`,
                marginTop: 40,
                paddingTop: 40,
                paddingBottom: 60,
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: MCM.orange,
                    letterSpacing: 2,
                    marginBottom: 8,
                  }}
                >
                  ALL SCREENS
                </div>
                <div style={{ fontSize: 10, color: MCM.textMuted }}>
                  {screens.length} wireframe screens with annotations
                </div>
              </div>
            </section>
          </div>

          {/* ===== RIGHT PANEL (Metadata) ===== */}
          <div
            style={{
              width: '50vw',
              height: 'calc(100vh - 64px)',
              overflowY: 'auto',
              overflowX: 'hidden',
              position: 'relative',
              borderLeft: `1px solid ${MCM.line}`,
            }}
          >
            <GridBackground width={756} height={2000} />

            {/* Column 3: Metadata */}
            <div style={{ padding: LAYOUT.padding }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: MCM.textMuted,
                  letterSpacing: 1,
                  marginBottom: 16,
                  paddingBottom: 8,
                  borderBottom: `1px solid ${MCM.line}`,
                }}
              >
                ELEMENT METADATA
              </div>

              {generateMetadataFromAnnotations(
                currentScreen!.annotations,
                currentScreen!.title,
              ).map(meta => (
                <MetadataCard key={meta.id} metadata={meta} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Force SSR to avoid static prerender errors (useAuth needs provider at runtime)
export const getServerSideProps = () => ({ props: {} });
