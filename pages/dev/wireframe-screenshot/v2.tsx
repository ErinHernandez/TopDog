import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';

import { WireframePhone } from '../../../components/dev/WireframePhone';

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
}

interface TestInfo {
  total: number;
  passing: number;
  failing: number;
  pending: number;
  coverage: number;
  results: TestResult[];
}

interface AIAnalysis {
  grade: Grade;
  score: number;
  importance: Severity;
  problemSize: Effort;
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

interface Warning {
  id: string;
  type: 'performance' | 'accessibility' | 'security' | 'deprecation' | 'style';
  rule: string;
  message: string;
  severity: Severity;
  line?: number;
  fixable: boolean;
}

interface BestPractice {
  id: string;
  category: 'accessibility' | 'performance' | 'security' | 'maintainability';
  text: string;
  implemented: boolean;
  priority: Severity;
}

interface ActionItem {
  id: string;
  title: string;
  category: 'bug' | 'improvement' | 'refactor' | 'test';
  priority: Severity;
  effort: Effort;
  completed: boolean;
  relatedFiles: string[];
}

interface PerformanceMetrics {
  renderTime?: number;
  bundleSize?: number;
  rerenderCount?: number;
}

interface ExtendedElementData {
  id: string;
  name: string;
  type: string;
  function: string;
  width: number;
  height: number;
  codeSnippets: { typescript: CodeSnippet; swift: CodeSnippet };
  tests: { typescript: TestInfo; swift: TestInfo };
  warnings: { typescript: Warning[]; swift: Warning[] };
  bestPractices: BestPractice[];
  actionItems: ActionItem[];
  performance: { typescript: PerformanceMetrics; swift: PerformanceMetrics };
  aiAnalysis: { typescript: AIAnalysis; swift: AIAnalysis };
}

// Helper functions
const getGradeColor = (grade: Grade): string => {
  switch (grade) {
    case 'A': return MCM.sage;
    case 'B': return MCM.teal;
    case 'C': return MCM.gold;
    case 'D': return MCM.coral;
    case 'F': return MCM.orange;
  }
};

const getSeverityColor = (severity: Severity): string => {
  switch (severity) {
    case 'critical': return MCM.orange;
    case 'high': return MCM.coral;
    case 'medium': return MCM.gold;
    case 'low': return MCM.sage;
  }
};

const getElementDimensions = (type: string): { width: number; height: number } => {
  switch (type.toLowerCase()) {
    case 'button': return { width: 200, height: 44 };
    case 'textfield':
    case 'securefield': return { width: 280, height: 44 };
    case 'image':
    case 'icon': return { width: 80, height: 80 };
    case 'card': return { width: 280, height: 120 };
    default: return { width: 200, height: 44 };
  }
};

// ============================================================================
// Element Position Data (extracted from WireframePhone SVG coordinates)
// ============================================================================

interface ElementPosition {
  id: string;
  name: string;
  type: string;
  notes?: string;
  // Position relative to phone content area (screenX=20, screenY=52)
  x: number;
  y: number;
  width: number;
  height: number;
  side: 'left' | 'right';
  // Label Y position (0-1 relative to phone height, matching column 1 annotations)
  labelY: number;
}

// Phone content area: screenX=20, screenY=52, screenW=200, screenH=412
// labelY values match column 1 annotation y values exactly (0-1 relative to phone height)
const screenElementPositions: Record<string, ElementPosition[]> = {
  'Sign In': [
    { id: '1', name: 'Logo', type: 'Image', notes: 'TopDog mark', x: 78, y: 20, width: 44, height: 44, side: 'left', labelY: 0.12 },
    { id: '2', name: 'Email/Phone', type: 'TextField', notes: 'Blue border focus', x: 0, y: 85, width: 200, height: 36, side: 'left', labelY: 0.26 },
    { id: '3', name: 'Password', type: 'SecureField', notes: 'Eye toggle', x: 0, y: 130, width: 200, height: 36, side: 'left', labelY: 0.38 },
    { id: '4', name: 'Remember Me', type: 'Checkbox', x: 0, y: 177, width: 70, height: 10, side: 'left', labelY: 0.50 },
    { id: '5', name: 'Forgot?', type: 'Link', notes: '→ Reset flow', x: 130, y: 180, width: 70, height: 10, side: 'right', labelY: 0.50 },
    { id: '6', name: 'Sign In', type: 'Button', notes: 'Primary CTA', x: 0, y: 210, width: 200, height: 40, side: 'right', labelY: 0.60 },
    { id: '7', name: 'Sign Up Link', type: 'Link', x: 70, y: 280, width: 60, height: 10, side: 'right', labelY: 0.78 },
  ],
  'Sign Up': [
    { id: '1', name: 'Logo', type: 'Image', x: 82, y: 10, width: 36, height: 36, side: 'left', labelY: 0.08 },
    { id: '2', name: 'Header', type: 'Text', notes: 'Create account', x: 30, y: 55, width: 140, height: 16, side: 'left', labelY: 0.16 },
    { id: '3', name: 'Email', type: 'TextField', x: 0, y: 80, width: 200, height: 32, side: 'left', labelY: 0.26 },
    { id: '4', name: 'Password', type: 'SecureField', notes: 'Live validation', x: 0, y: 120, width: 200, height: 32, side: 'left', labelY: 0.36 },
    { id: '5', name: 'Confirm', type: 'SecureField', x: 0, y: 160, width: 200, height: 32, side: 'left', labelY: 0.46 },
    { id: '6', name: 'Continue', type: 'Button', x: 0, y: 210, width: 200, height: 36, side: 'right', labelY: 0.58 },
    { id: '7', name: 'Requirements', type: 'Card', notes: 'Password rules', x: 0, y: 260, width: 200, height: 50, side: 'right', labelY: 0.72 },
  ],
  'Lobby': [
    { id: '1', name: 'Tournament Card', type: 'Card', x: 0, y: 10, width: 200, height: 200, side: 'left', labelY: 0.18 },
    { id: '2', name: 'Globe Graphic', type: 'Image', notes: '3D unique art', x: 75, y: 50, width: 50, height: 50, side: 'left', labelY: 0.26 },
    { id: '3', name: 'Progress Bar', type: 'Progress', notes: 'Entries %', x: 15, y: 120, width: 170, height: 6, side: 'left', labelY: 0.38 },
    { id: '4', name: 'Join Button', type: 'Button', notes: 'Primary CTA', x: 15, y: 140, width: 170, height: 32, side: 'right', labelY: 0.46 },
    { id: '5', name: 'Entry Fee', type: 'Text', notes: '$25', x: 35, y: 180, width: 30, height: 16, side: 'left', labelY: 0.54 },
    { id: '6', name: 'Prize Pool', type: 'Text', notes: '$2.1M', x: 135, y: 180, width: 30, height: 16, side: 'right', labelY: 0.54 },
    { id: '7', name: 'Tab Bar', type: 'TabBar', notes: '5 tabs', x: 0, y: 367, width: 200, height: 40, side: 'right', labelY: 0.92 },
  ],
  'Live Drafts': [
    { id: '1', name: 'Title', type: 'Text', notes: 'Live Drafts', x: 20, y: 10, width: 160, height: 16, side: 'left', labelY: 0.06 },
    { id: '2', name: 'Fast Draft Card', type: 'Card', notes: '30s timer', x: 0, y: 35, width: 200, height: 85, side: 'left', labelY: 0.20 },
    { id: '3', name: '⚡ Badge', type: 'Badge', notes: 'FAST DRAFT', x: 150, y: 35, width: 50, height: 20, side: 'right', labelY: 0.15 },
    { id: '4', name: 'Timer', type: 'Text', notes: 'Countdown', x: 150, y: 60, width: 50, height: 20, side: 'right', labelY: 0.28 },
    { id: '5', name: 'Progress', type: 'Progress', x: 10, y: 102, width: 180, height: 5, side: 'left', labelY: 0.32 },
    { id: '6', name: 'Slow Draft Card', type: 'Card', notes: '12h timer', x: 0, y: 135, width: 200, height: 85, side: 'left', labelY: 0.50 },
    { id: '7', name: 'Tab Bar', type: 'TabBar', x: 0, y: 367, width: 200, height: 40, side: 'right', labelY: 0.92 },
  ],
  'Draft: Players': [
    { id: '1', name: 'Top Tabs', type: 'TabBar', notes: '5 draft tabs', x: 0, y: 0, width: 200, height: 28, side: 'left', labelY: 0.06 },
    { id: '2', name: 'Search', type: 'TextField', x: 0, y: 38, width: 200, height: 28, side: 'left', labelY: 0.14 },
    { id: '3', name: 'Position Pills', type: 'Segmented', notes: 'ALL/QB/RB/WR/TE', x: 0, y: 76, width: 180, height: 18, side: 'right', labelY: 0.22 },
    { id: '4', name: 'Player Row', type: 'List', notes: 'Tap = draft/queue', x: 0, y: 110, width: 200, height: 170, side: 'left', labelY: 0.42 },
    { id: '5', name: 'Position Badge', type: 'Badge', notes: 'Colored', x: 8, y: 123, width: 12, height: 12, side: 'right', labelY: 0.36 },
    { id: '6', name: 'ADP / Proj', type: 'Text', x: 140, y: 123, width: 60, height: 16, side: 'right', labelY: 0.50 },
    { id: '7', name: 'Timer Bar', type: 'Progress', notes: 'Pick countdown', x: 8, y: 398, width: 150, height: 5, side: 'left', labelY: 0.90 },
  ],
  'Draft: Roster': [
    { id: '1', name: 'Top Tabs', type: 'TabBar', x: 0, y: 0, width: 200, height: 28, side: 'left', labelY: 0.06 },
    { id: '2', name: 'QB Slot', type: 'Card', notes: 'Pink', x: 0, y: 40, width: 200, height: 30, side: 'left', labelY: 0.16 },
    { id: '3', name: 'RB Slots', type: 'Card', notes: 'Green × 2', x: 0, y: 74, width: 200, height: 64, side: 'left', labelY: 0.26 },
    { id: '4', name: 'WR Slots', type: 'Card', notes: 'Yellow × 3', x: 0, y: 142, width: 200, height: 96, side: 'right', labelY: 0.40 },
    { id: '5', name: 'TE Slot', type: 'Card', notes: 'Purple', x: 0, y: 244, width: 200, height: 30, side: 'right', labelY: 0.54 },
    { id: '6', name: 'FLEX Slot', type: 'Card', notes: '3-stripe', x: 0, y: 278, width: 200, height: 30, side: 'left', labelY: 0.62 },
    { id: '7', name: 'Bench Slots', type: 'Card', notes: 'Gray × 4', x: 0, y: 312, width: 200, height: 30, side: 'right', labelY: 0.74 },
    { id: '8', name: 'Position Tracker', type: 'Card', x: 0, y: 362, width: 200, height: 45, side: 'left', labelY: 0.90 },
  ],
  'Profile': [
    { id: '1', name: 'User Card', type: 'Card', x: 0, y: 15, width: 200, height: 60, side: 'left', labelY: 0.12 },
    { id: '2', name: 'Avatar', type: 'Image', x: 10, y: 27, width: 36, height: 36, side: 'right', labelY: 0.10 },
    { id: '3', name: 'Username', type: 'Text', x: 55, y: 32, width: 130, height: 16, side: 'right', labelY: 0.18 },
    { id: '4', name: 'Balance', type: 'Text', notes: 'Current funds', x: 55, y: 48, width: 100, height: 16, side: 'left', labelY: 0.22 },
    { id: '5', name: 'Menu List', type: 'List', notes: 'Settings nav', x: 0, y: 95, width: 200, height: 216, side: 'left', labelY: 0.45 },
    { id: '6', name: 'Chevrons', type: 'Icon', notes: '→', x: 180, y: 107, width: 16, height: 16, side: 'right', labelY: 0.45 },
    { id: '7', name: 'Add Funds', type: 'Button', notes: '→ Deposit', x: 0, y: 317, width: 200, height: 36, side: 'right', labelY: 0.78 },
    { id: '8', name: 'Tab Bar', type: 'TabBar', x: 0, y: 367, width: 200, height: 40, side: 'left', labelY: 0.92 },
  ],
};

// ============================================================================
// Screen Data
// ============================================================================

const screens: WireframeScreen[] = [
  {
    title: 'Sign In',
    annotations: [
      { id: '1', name: 'Logo', type: 'Image', y: 0.12, side: 'left' },
      { id: '2', name: 'Email/Phone', type: 'TextField', y: 0.26, side: 'left' },
      { id: '3', name: 'Password', type: 'SecureField', y: 0.38, side: 'left' },
      { id: '4', name: 'Remember Me', type: 'Checkbox', y: 0.50, side: 'left' },
      { id: '5', name: 'Forgot?', type: 'Link', y: 0.50, side: 'right' },
      { id: '6', name: 'Sign In', type: 'Button', y: 0.60, side: 'right' },
      { id: '7', name: 'Sign Up Link', type: 'Link', y: 0.78, side: 'right' },
    ],
  },
  {
    title: 'Sign Up',
    annotations: [
      { id: '1', name: 'Logo', type: 'Image', y: 0.08, side: 'left' },
      { id: '2', name: 'Header', type: 'Text', y: 0.16, side: 'left' },
      { id: '3', name: 'Email', type: 'TextField', y: 0.26, side: 'left' },
      { id: '4', name: 'Password', type: 'SecureField', y: 0.36, side: 'left' },
      { id: '5', name: 'Confirm', type: 'SecureField', y: 0.46, side: 'left' },
      { id: '6', name: 'Continue', type: 'Button', y: 0.58, side: 'right' },
      { id: '7', name: 'Requirements', type: 'Card', y: 0.72, side: 'right' },
    ],
  },
  {
    title: 'Lobby',
    annotations: [
      { id: '1', name: 'Tournament Card', type: 'Card', y: 0.18, side: 'left' },
      { id: '2', name: 'Globe Graphic', type: 'Image', y: 0.26, side: 'left' },
      { id: '3', name: 'Progress Bar', type: 'Progress', y: 0.38, side: 'left' },
      { id: '4', name: 'Join Button', type: 'Button', y: 0.46, side: 'right' },
      { id: '5', name: 'Entry Fee', type: 'Text', y: 0.54, side: 'left' },
      { id: '6', name: 'Prize Pool', type: 'Text', y: 0.54, side: 'right' },
      { id: '7', name: 'Tab Bar', type: 'TabBar', y: 0.92, side: 'right' },
    ],
  },
  {
    title: 'Live Drafts',
    annotations: [
      { id: '1', name: 'Title', type: 'Text', y: 0.06, side: 'left' },
      { id: '2', name: 'Fast Draft Card', type: 'Card', y: 0.20, side: 'left' },
      { id: '3', name: '⚡ Badge', type: 'Badge', y: 0.15, side: 'right' },
      { id: '4', name: 'Timer', type: 'Text', y: 0.28, side: 'right' },
      { id: '5', name: 'Progress', type: 'Progress', y: 0.32, side: 'left' },
      { id: '6', name: 'Slow Draft Card', type: 'Card', y: 0.50, side: 'left' },
      { id: '7', name: 'Tab Bar', type: 'TabBar', y: 0.92, side: 'right' },
    ],
  },
  {
    title: 'Draft: Players',
    annotations: [
      { id: '1', name: 'Top Tabs', type: 'TabBar', y: 0.06, side: 'left' },
      { id: '2', name: 'Search', type: 'TextField', y: 0.14, side: 'left' },
      { id: '3', name: 'Position Pills', type: 'Segmented', y: 0.22, side: 'right' },
      { id: '4', name: 'Player Row', type: 'List', y: 0.42, side: 'left' },
      { id: '5', name: 'Position Badge', type: 'Badge', y: 0.36, side: 'right' },
      { id: '6', name: 'ADP / Proj', type: 'Text', y: 0.50, side: 'right' },
      { id: '7', name: 'Timer Bar', type: 'Progress', y: 0.90, side: 'left' },
    ],
  },
  {
    title: 'Draft: Roster',
    annotations: [
      { id: '1', name: 'Top Tabs', type: 'TabBar', y: 0.06, side: 'left' },
      { id: '2', name: 'QB Slot', type: 'Card', y: 0.16, side: 'left' },
      { id: '3', name: 'RB Slots', type: 'Card', y: 0.26, side: 'left' },
      { id: '4', name: 'WR Slots', type: 'Card', y: 0.40, side: 'right' },
      { id: '5', name: 'TE Slot', type: 'Card', y: 0.54, side: 'right' },
      { id: '6', name: 'FLEX Slot', type: 'Card', y: 0.62, side: 'left' },
      { id: '7', name: 'Bench Slots', type: 'Card', y: 0.74, side: 'right' },
      { id: '8', name: 'Position Tracker', type: 'Card', y: 0.90, side: 'left' },
    ],
  },
  {
    title: 'Profile',
    annotations: [
      { id: '1', name: 'User Card', type: 'Card', y: 0.12, side: 'left' },
      { id: '2', name: 'Avatar', type: 'Image', y: 0.10, side: 'right' },
      { id: '3', name: 'Username', type: 'Text', y: 0.18, side: 'right' },
      { id: '4', name: 'Balance', type: 'Text', y: 0.22, side: 'left' },
      { id: '5', name: 'Menu List', type: 'List', y: 0.45, side: 'left' },
      { id: '6', name: 'Chevrons', type: 'Icon', y: 0.45, side: 'right' },
      { id: '7', name: 'Add Funds', type: 'Button', y: 0.78, side: 'right' },
      { id: '8', name: 'Tab Bar', type: 'TabBar', y: 0.92, side: 'left' },
    ],
  },
];

// ============================================================================
// Mock Data Generator
// ============================================================================

const generateElementData = (annotation: Annotation, idx: number): ExtendedElementData => {
  const dims = getElementDimensions(annotation.type);
  const grades: Grade[] = ['A', 'B', 'B', 'C', 'B', 'A', 'C'];
  const grade = grades[idx % grades.length]!;
  const score = grade === 'A' ? 92 : grade === 'B' ? 82 : 72;
  const failCount = idx % 3 === 0 ? 1 : 0;
  const hasWarnings = idx % 2 === 0;
  const componentName = annotation.name.replace(/\s/g, '');

  return {
    id: annotation.id,
    name: annotation.name,
    type: annotation.type,
    function: annotation.notes || `${annotation.type} element`,
    width: dims.width,
    height: dims.height,
    codeSnippets: {
      typescript: {
        language: 'typescript',
        code: `const ${componentName}: React.FC = () => {\n  return <div className={styles.${annotation.type.toLowerCase()}}>{/* ... */}</div>;\n};`,
        filePath: `/components/${componentName}.tsx`,
        startLine: 12,
        endLine: 15,
      },
      swift: {
        language: 'swift',
        code: `struct ${componentName}View: View {\n  var body: some View {\n    // ...\n  }\n}`,
        filePath: `/Views/${componentName}View.swift`,
        startLine: 8,
        endLine: 12,
      },
    },
    tests: {
      typescript: {
        total: 4,
        passing: 4 - failCount,
        failing: failCount,
        pending: 0,
        coverage: 75 + idx * 3,
        results: [
          { name: 'renders correctly', status: 'pass', duration: 8 },
          { name: 'handles interaction', status: 'pass', duration: 4 },
          { name: 'accessibility', status: 'pass', duration: 12 },
          { name: 'loading state', status: failCount > 0 ? 'fail' : 'pass', duration: 3 },
        ],
      },
      swift: {
        total: 3,
        passing: 3 - failCount,
        failing: failCount,
        pending: 0,
        coverage: 70 + idx * 2,
        results: [
          { name: 'renders correctly', status: 'pass', duration: 6 },
          { name: 'handles tap', status: 'pass', duration: 3 },
          { name: 'snapshot', status: failCount > 0 ? 'fail' : 'pass', duration: 8 },
        ],
      },
    },
    warnings: {
      typescript: hasWarnings ? [
        { id: 'w1', type: 'accessibility', rule: 'jsx-a11y/click-events-have-key-events', message: 'Missing keyboard handler', severity: 'medium' as Severity, line: 24, fixable: true },
        { id: 'w2', type: 'performance', rule: 'react-hooks/exhaustive-deps', message: 'Missing dependency in useEffect', severity: 'high' as Severity, line: 18, fixable: false },
      ] : [],
      swift: hasWarnings ? [
        { id: 'sw1', type: 'deprecation', rule: 'swift-deprecation', message: 'Using deprecated API', severity: 'low' as Severity, line: 12, fixable: true },
      ] : [],
    },
    bestPractices: [
      { id: 'bp1', category: 'accessibility', text: 'Uses semantic HTML elements', implemented: true, priority: 'high' as Severity },
      { id: 'bp2', category: 'accessibility', text: 'Has proper ARIA labels', implemented: idx % 2 === 0, priority: 'high' as Severity },
      { id: 'bp3', category: 'performance', text: 'Memoizes expensive computations', implemented: idx > 2, priority: 'medium' as Severity },
      { id: 'bp4', category: 'maintainability', text: 'Has loading state', implemented: failCount === 0, priority: 'medium' as Severity },
    ],
    actionItems: [
      { id: 'ai1', title: `Add loading state to ${annotation.name}`, category: 'improvement', priority: failCount > 0 ? 'high' as Severity : 'low' as Severity, effort: 'small', completed: failCount === 0, relatedFiles: [`${componentName}.tsx`] },
      { id: 'ai2', title: 'Increase test coverage to 90%', category: 'test', priority: 'medium' as Severity, effort: 'medium', completed: false, relatedFiles: [`${componentName}.test.tsx`] },
      ...(hasWarnings ? [{ id: 'ai3', title: 'Fix accessibility warnings', category: 'bug' as const, priority: 'high' as Severity, effort: 'small' as Effort, completed: false, relatedFiles: [`${componentName}.tsx`] }] : []),
    ],
    performance: {
      typescript: { renderTime: 8 + idx * 2, bundleSize: 2400 + idx * 100, rerenderCount: idx % 3 },
      swift: { renderTime: 6 + idx * 2, bundleSize: 1800 + idx * 80, rerenderCount: idx % 2 },
    },
    aiAnalysis: {
      typescript: {
        grade: grade,
        score,
        importance: idx < 3 ? 'high' : 'medium',
        problemSize: failCount > 0 ? 'medium' : 'small',
        summary: `${annotation.name} follows most patterns but could use minor improvements.`,
        strengths: ['Clean TypeScript types', 'Good accessibility'],
        weaknesses: failCount > 0 ? ['Missing loading state'] : ['Could add error boundary'],
      },
      swift: {
        grade: grade,
        score: score - 5,
        importance: idx < 3 ? 'high' : 'medium',
        problemSize: failCount > 0 ? 'medium' : 'small',
        summary: `${annotation.name} Swift implementation is solid.`,
        strengths: ['Clean SwiftUI code', 'Good state management'],
        weaknesses: failCount > 0 ? ['Missing preview'] : ['Could add animations'],
      },
    },
  };
};

// ============================================================================
// Grid Background Component
// ============================================================================

const GridBackground: React.FC = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: 0,
  }}>
    <svg style={{ width: '100%', height: '100%', opacity: 0.03 }}>
      {Array.from({ length: Math.ceil(2000 / 32) }).map((_, i) => (
        <line key={`v${i}`} x1={i * 32} y1={0} x2={i * 32} y2={2000} stroke="white" strokeWidth={0.5} />
      ))}
      {Array.from({ length: Math.ceil(2000 / 32) }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 32} x2={3000} y2={i * 32} stroke="white" strokeWidth={0.5} />
      ))}
    </svg>
  </div>
);

// ============================================================================
// Annotation Components
// ============================================================================

interface AnnotationLabelsProps {
  annotations: Annotation[];
  phoneRect: { x: number; y: number; width: number; height: number };
  selectedIndex?: number;
}

const AnnotationLabels: React.FC<AnnotationLabelsProps> = ({ annotations, phoneRect, selectedIndex = -1 }) => {
  const labelWidth = 160;
  const margin = 50;

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {annotations.map((ann, idx) => {
        const phoneY = phoneRect.y + ann.y * phoneRect.height;
        const isLeft = ann.side === 'left';
        const phoneEdgeX = isLeft ? phoneRect.x - 8 : phoneRect.x + phoneRect.width + 8;
        const labelX = isLeft ? phoneEdgeX - margin - labelWidth : phoneEdgeX + margin;
        const color = getColorForType(ann.type);
        const isSelected = idx === selectedIndex;

        return (
          <g key={ann.id} style={{ transition: 'all 0.15s ease' }}>
            <path
              d={`M ${phoneEdgeX} ${phoneY} L ${isLeft ? labelX + labelWidth : labelX} ${phoneY}`}
              stroke={color}
              strokeOpacity={isSelected ? 1 : 0.6}
              strokeWidth={isSelected ? 1.5 : 1}
              strokeDasharray="4 3"
              fill="none"
            />
            <circle cx={phoneEdgeX} cy={phoneY} r={isSelected ? 4 : 3} fill={color} />
            <circle cx={isLeft ? labelX + labelWidth + 4 : labelX - 4} cy={phoneY} r={isSelected ? 3.5 : 2.5} fill={color} />
          </g>
        );
      })}
    </svg>
  );
};

const AnnotationCard: React.FC<{ annotation: Annotation; phoneRect: { x: number; y: number; width: number; height: number }; isSelected?: boolean }> = ({ annotation, phoneRect, isSelected = false }) => {
  const labelWidth = 160;
  const margin = 50;
  const isLeft = annotation.side === 'left';
  const phoneEdgeX = isLeft ? phoneRect.x - 8 : phoneRect.x + phoneRect.width + 8;
  const labelX = isLeft ? phoneEdgeX - margin - labelWidth : phoneEdgeX + margin;
  const labelY = phoneRect.y + annotation.y * phoneRect.height;
  const color = getColorForType(annotation.type);

  return (
    <div style={{
      position: 'absolute',
      left: labelX,
      top: labelY,
      transform: 'translateY(-50%)',
      width: labelWidth,
      padding: '6px 10px',
      background: isSelected ? `${color}15` : `${MCM.surface}e6`,
      borderRadius: 4,
      border: `1px solid ${isSelected ? color : MCM.line}`,
      transition: 'all 0.15s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: color, padding: '2px 5px', background: `${color}26`, borderRadius: 2 }}>
          {annotation.type}
        </span>
        <span style={{ fontSize: 11, fontWeight: 500, color: MCM.text }}>{annotation.name}</span>
      </div>
    </div>
  );
};

// ============================================================================
// Element Analysis Components
// ============================================================================

const CodebaseSelector: React.FC<{ selected: Codebase; onChange: (c: Codebase) => void }> = ({ selected, onChange }) => (
  <div style={{ display: 'flex', gap: 0, marginBottom: 12 }}>
    {[{ value: 'typescript' as Codebase, label: 'TS/React', color: MCM.teal }, { value: 'swift' as Codebase, label: 'Swift', color: MCM.orange }].map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        style={{
          flex: 1,
          padding: '8px 12px',
          fontSize: 11,
          fontWeight: 600,
          color: selected === opt.value ? MCM.bg : opt.color,
          background: selected === opt.value ? opt.color : 'transparent',
          border: `1px solid ${opt.color}`,
          borderRadius: opt.value === 'typescript' ? '4px 0 0 4px' : '0 4px 4px 0',
          cursor: 'pointer',
        }}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const CollapsibleSection: React.FC<{
  title: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  badge?: { text: string; color: string };
  children: React.ReactNode;
}> = ({ title, icon, isOpen, onToggle, badge, children }) => (
  <div style={{ marginBottom: 8, borderBottom: `1px solid ${MCM.line}` }}>
    <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer', color: MCM.text }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s ease', fontSize: 10, color: MCM.textMuted }}>▼</span>
        <span style={{ fontSize: 10, color: MCM.textMuted }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>{title}</span>
      </div>
      {badge && <span style={{ fontSize: 9, fontWeight: 600, color: badge.color, padding: '2px 8px', background: `${badge.color}20`, borderRadius: 3 }}>{badge.text}</span>}
    </button>
    <div style={{ maxHeight: isOpen ? '2000px' : '0', overflow: 'hidden', transition: 'max-height 0.2s ease', paddingBottom: isOpen ? 12 : 0 }}>
      {children}
    </div>
  </div>
);

const TestStatusBar: React.FC<{ tests: TestInfo }> = ({ tests }) => {
  const passPercent = (tests.passing / tests.total) * 100;
  const failPercent = (tests.failing / tests.total) * 100;

  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ width: `${passPercent}%`, background: MCM.sage }} />
        <div style={{ width: `${failPercent}%`, background: MCM.orange }} />
        <div style={{ flex: 1, background: MCM.line }} />
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 10, marginBottom: 8 }}>
        <span style={{ color: MCM.sage }}>● {tests.passing} Pass</span>
        <span style={{ color: MCM.orange }}>● {tests.failing} Fail</span>
        <span style={{ color: MCM.textMuted, marginLeft: 'auto' }}>Coverage: {tests.coverage}%</span>
      </div>
      {tests.results.slice(0, 4).map((test, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, padding: '4px 0', borderBottom: `1px solid ${MCM.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: test.status === 'pass' ? MCM.sage : MCM.orange }}>{test.status === 'pass' ? '✓' : '✗'}</span>
            <span style={{ color: MCM.text }}>{test.name}</span>
          </div>
          {test.duration && <span style={{ color: MCM.textDim }}>{test.duration}ms</span>}
        </div>
      ))}
    </div>
  );
};

const GradeBadge: React.FC<{ grade: Grade; score: number }> = ({ grade, score }) => {
  const color = getGradeColor(grade);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: `${color}30`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color }}>
        {grade}
      </div>
      <span style={{ fontSize: 12, color: MCM.textMuted }}>{score}/100</span>
    </div>
  );
};

const SeverityBadge: React.FC<{ severity: Severity }> = ({ severity }) => {
  const color = getSeverityColor(severity);
  return <span style={{ fontSize: 8, fontWeight: 700, color, padding: '2px 6px', background: `${color}20`, borderRadius: 3, textTransform: 'uppercase' }}>{severity}</span>;
};

const EffortBadge: React.FC<{ effort: Effort }> = ({ effort }) => {
  const labels = { small: 'S', medium: 'M', large: 'L' };
  const colors = { small: MCM.sage, medium: MCM.gold, large: MCM.coral };
  return <span style={{ fontSize: 8, fontWeight: 700, color: colors[effort], padding: '2px 6px', background: `${colors[effort]}20`, borderRadius: 3 }}>{labels[effort]}</span>;
};

const WarningsList: React.FC<{ warnings: Warning[] }> = ({ warnings }) => {
  if (warnings.length === 0) {
    return <div style={{ fontSize: 10, color: MCM.sage, padding: 8, background: `${MCM.sage}10`, borderRadius: 4 }}>✓ No warnings</div>;
  }
  return (
    <div>
      {warnings.map((warning) => (
        <div key={warning.id} style={{ padding: '8px 0', borderBottom: `1px solid ${MCM.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <SeverityBadge severity={warning.severity} />
            <span style={{ fontSize: 10, color: MCM.textMuted, fontFamily: 'Monaco, monospace' }}>{warning.rule}</span>
          </div>
          <div style={{ fontSize: 10, color: MCM.text, marginBottom: 4 }}>{warning.message}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {warning.line && <span style={{ fontSize: 9, color: MCM.textDim }}>Line {warning.line}</span>}
            {warning.fixable && <span style={{ fontSize: 8, color: MCM.teal, padding: '2px 6px', background: `${MCM.teal}20`, borderRadius: 3 }}>Fix Available</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

const BestPracticesChecklist: React.FC<{ practices: BestPractice[] }> = ({ practices }) => (
  <div>
    {practices.map((practice) => (
      <div key={practice.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${MCM.line}` }}>
        <span style={{ fontSize: 12, color: practice.implemented ? MCM.sage : MCM.textDim }}>{practice.implemented ? '☑' : '☐'}</span>
        <span style={{ fontSize: 10, color: practice.implemented ? MCM.text : MCM.textMuted, flex: 1 }}>{practice.text}</span>
        <span style={{ fontSize: 8, color: getSeverityColor(practice.priority), opacity: 0.7 }}>{practice.category}</span>
      </div>
    ))}
  </div>
);

const ActionItemsList: React.FC<{ items: ActionItem[]; onToggle: (id: string) => void; completedState: Record<string, boolean> }> = ({ items, onToggle, completedState }) => (
  <div>
    {items.map((item) => {
      const isCompleted = completedState[item.id] ?? item.completed;
      return (
        <div key={item.id} style={{ padding: '8px 0', borderBottom: `1px solid ${MCM.line}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <button
              onClick={() => onToggle(item.id)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}
            >
              <span style={{ fontSize: 12, color: isCompleted ? MCM.sage : MCM.textDim }}>{isCompleted ? '☑' : '☐'}</span>
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: isCompleted ? MCM.textMuted : MCM.text, textDecoration: isCompleted ? 'line-through' : 'none', marginBottom: 4 }}>{item.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <SeverityBadge severity={item.priority} />
                <EffortBadge effort={item.effort} />
                <span style={{ fontSize: 8, color: MCM.textDim, padding: '2px 6px', background: MCM.bg, borderRadius: 3 }}>{item.category}</span>
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

const PerformanceDisplay: React.FC<{ metrics: PerformanceMetrics }> = ({ metrics }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
    <div style={{ background: MCM.bg, borderRadius: 4, padding: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: MCM.teal }}>{metrics.renderTime ?? '-'}ms</div>
      <div style={{ fontSize: 9, color: MCM.textMuted, marginTop: 4 }}>Render Time</div>
    </div>
    <div style={{ background: MCM.bg, borderRadius: 4, padding: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: MCM.gold }}>{metrics.bundleSize ? `${(metrics.bundleSize / 1000).toFixed(1)}KB` : '-'}</div>
      <div style={{ fontSize: 9, color: MCM.textMuted, marginTop: 4 }}>Bundle Size</div>
    </div>
    <div style={{ background: MCM.bg, borderRadius: 4, padding: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: metrics.rerenderCount && metrics.rerenderCount > 1 ? MCM.coral : MCM.sage }}>{metrics.rerenderCount ?? 0}</div>
      <div style={{ fontSize: 9, color: MCM.textMuted, marginTop: 4 }}>Re-renders</div>
    </div>
  </div>
);

// ============================================================================
// NEW: Analysis Dashboard Components (1400px layout, no accordions)
// ============================================================================

// ScoreDial - Radial progress indicator with grade letter
const ScoreDial: React.FC<{ grade: Grade; score: number }> = ({ grade, score }) => {
  const color = getGradeColor(grade);
  const radius = 42;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 100, height: 100 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        {/* Background ring */}
        <circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          stroke={MCM.line}
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {/* Center content */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{grade}</div>
        <div style={{ fontSize: 11, color: MCM.textMuted, marginTop: 2 }}>{score}/100</div>
      </div>
    </div>
  );
};

// HeroSection - Score dial + element meta + quick stats
const HeroSection: React.FC<{
  data: ExtendedElementData;
  codebase: Codebase;
}> = ({ data, codebase }) => {
  const analysis = data.aiAnalysis[codebase];
  const tests = data.tests[codebase];
  const warnings = data.warnings[codebase];

  return (
    <div style={{
      display: 'flex',
      gap: 24,
      padding: 20,
      background: `linear-gradient(135deg, ${MCM.bg} 0%, ${MCM.surface} 100%)`,
      borderRadius: 8,
      marginBottom: 24,
      borderBottom: `2px solid ${getGradeColor(analysis.grade)}40`,
    }}>
      {/* Score Dial */}
      <ScoreDial grade={analysis.grade} score={analysis.score} />

      {/* Element Info */}
      <div style={{ flex: 1 }}>
        {/* Name and Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 600, color: MCM.text }}>{data.name}</span>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: getColorForType(data.type),
            padding: '4px 10px',
            background: `${getColorForType(data.type)}20`,
            borderRadius: 4,
          }}>
            {data.type}
          </span>
          <span style={{ fontSize: 11, color: MCM.textDim }}>
            {data.width}×{data.height}px
          </span>
        </div>

        {/* AI Summary */}
        <div style={{ fontSize: 12, color: MCM.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
          {analysis.summary}
        </div>

        {/* Quick Stats Row */}
        <div style={{ display: 'flex', gap: 16 }}>
          {/* Tests Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: tests.failing > 0 ? `${MCM.orange}15` : `${MCM.sage}15`,
            borderRadius: 4,
            border: `1px solid ${tests.failing > 0 ? MCM.orange : MCM.sage}40`,
          }}>
            <span style={{ color: tests.failing > 0 ? MCM.orange : MCM.sage, fontWeight: 600 }}>
              {tests.passing}/{tests.total}
            </span>
            <span style={{ fontSize: 10, color: MCM.textMuted }}>Tests</span>
            {tests.failing > 0 && <span style={{ fontSize: 9, color: MCM.orange }}>✗</span>}
            {tests.failing === 0 && <span style={{ fontSize: 9, color: MCM.sage }}>✓</span>}
          </div>

          {/* Warnings Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: warnings.length > 0 ? `${MCM.gold}15` : `${MCM.sage}15`,
            borderRadius: 4,
            border: `1px solid ${warnings.length > 0 ? MCM.gold : MCM.sage}40`,
          }}>
            <span style={{ color: warnings.length > 0 ? MCM.gold : MCM.sage, fontWeight: 600 }}>
              {warnings.length}
            </span>
            <span style={{ fontSize: 10, color: MCM.textMuted }}>Warnings</span>
          </div>

          {/* Coverage Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: `${MCM.teal}15`,
            borderRadius: 4,
            border: `1px solid ${MCM.teal}40`,
          }}>
            <span style={{ color: MCM.teal, fontWeight: 600 }}>{tests.coverage}%</span>
            <span style={{ fontSize: 10, color: MCM.textMuted }}>Coverage</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// CodePanel - Single code block with header/actions
const CodePanel: React.FC<{
  snippet: CodeSnippet;
  title: string;
  color: string;
}> = ({ snippet, title, color }) => (
  <div style={{
    flex: 1,
    background: MCM.surface,
    borderRadius: 8,
    border: `1px solid ${MCM.line}`,
    overflow: 'hidden',
  }}>
    {/* Header */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      background: MCM.bg,
      borderBottom: `1px solid ${MCM.line}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: MCM.text }}>{title}</span>
      </div>
      <span style={{ fontSize: 10, color: MCM.textDim }}>
        Lines {snippet.startLine}-{snippet.endLine}
      </span>
    </div>

    {/* File path */}
    <div style={{ padding: '8px 14px', borderBottom: `1px solid ${MCM.line}` }}>
      <span style={{ fontSize: 10, color: MCM.textMuted, fontFamily: 'Monaco, monospace' }}>
        📁 {snippet.filePath}
      </span>
    </div>

    {/* Code block */}
    <div style={{
      padding: 14,
      fontFamily: 'Monaco, monospace',
      fontSize: 11,
      lineHeight: 1.6,
      color: MCM.text,
      whiteSpace: 'pre',
      overflow: 'auto',
      maxHeight: 180,
      background: MCM.bg,
    }}>
      {snippet.code.split('\n').map((line, i) => (
        <div key={i} style={{ display: 'flex' }}>
          <span style={{ width: 30, color: MCM.textDim, textAlign: 'right', marginRight: 12, userSelect: 'none' }}>
            {snippet.startLine + i}
          </span>
          <span>{line}</span>
        </div>
      ))}
    </div>

    {/* Actions */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 14px',
      borderTop: `1px solid ${MCM.line}`,
      background: MCM.surface,
    }}>
      <button style={{
        fontSize: 10,
        color: MCM.textMuted,
        background: 'transparent',
        border: `1px solid ${MCM.line}`,
        borderRadius: 4,
        padding: '4px 12px',
        cursor: 'pointer',
      }}>
        Copy
      </button>
      <button style={{
        fontSize: 10,
        color: color,
        background: 'transparent',
        border: `1px solid ${color}`,
        borderRadius: 4,
        padding: '4px 12px',
        cursor: 'pointer',
      }}>
        Open →
      </button>
    </div>
  </div>
);

// CodeComparison - Side-by-side TS and Swift
const CodeComparison: React.FC<{ data: ExtendedElementData }> = ({ data }) => (
  <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
    <CodePanel snippet={data.codeSnippets.typescript} title="TYPESCRIPT" color={MCM.teal} />
    <CodePanel snippet={data.codeSnippets.swift} title="SWIFT" color={MCM.orange} />
  </div>
);

// TestsPanel - Status bar + test list + coverage (no accordion)
const TestsPanel: React.FC<{ tests: TestInfo }> = ({ tests }) => {
  const passPercent = (tests.passing / tests.total) * 100;
  const failPercent = (tests.failing / tests.total) * 100;

  return (
    <div style={{
      flex: 1,
      background: MCM.surface,
      borderRadius: 8,
      border: `1px solid ${MCM.line}`,
      padding: 16,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: MCM.text, marginBottom: 12, letterSpacing: 1 }}>
        TESTS
      </div>

      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ width: `${passPercent}%`, background: MCM.sage }} />
        <div style={{ width: `${failPercent}%`, background: MCM.orange }} />
        <div style={{ flex: 1, background: MCM.line }} />
      </div>

      {/* Status counts */}
      <div style={{ display: 'flex', gap: 12, fontSize: 10, marginBottom: 12 }}>
        <span style={{ color: MCM.sage }}>● {tests.passing} Pass</span>
        {tests.failing > 0 && <span style={{ color: MCM.orange }}>● {tests.failing} Fail</span>}
      </div>

      {/* Test results */}
      {tests.results.map((test, idx) => (
        <div key={idx} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 10,
          padding: '6px 0',
          borderBottom: idx < tests.results.length - 1 ? `1px solid ${MCM.line}` : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: test.status === 'pass' ? MCM.sage : MCM.orange }}>
              {test.status === 'pass' ? '✓' : '✗'}
            </span>
            <span style={{ color: MCM.text }}>{test.name}</span>
          </div>
          {test.duration && <span style={{ color: MCM.textDim }}>{test.duration}ms</span>}
        </div>
      ))}

      {/* Coverage */}
      <div style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: `1px solid ${MCM.line}`,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 10,
      }}>
        <span style={{ color: MCM.textMuted }}>Coverage</span>
        <span style={{ color: MCM.teal, fontWeight: 600 }}>{tests.coverage}%</span>
      </div>
    </div>
  );
};

// QualityPanel - Warnings + Best Practices combined
const QualityPanel: React.FC<{
  warnings: Warning[];
  bestPractices: BestPractice[];
}> = ({ warnings, bestPractices }) => (
  <div style={{
    flex: 1,
    background: MCM.surface,
    borderRadius: 8,
    border: `1px solid ${MCM.line}`,
    padding: 16,
  }}>
    {/* Warnings Section */}
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: MCM.text, marginBottom: 12, letterSpacing: 1 }}>
        WARNINGS
      </div>
      {warnings.length === 0 ? (
        <div style={{
          fontSize: 10,
          color: MCM.sage,
          padding: 10,
          background: `${MCM.sage}10`,
          borderRadius: 4,
        }}>
          ✓ No warnings
        </div>
      ) : (
        warnings.slice(0, 2).map((warning) => (
          <div key={warning.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <SeverityBadge severity={warning.severity} />
              <span style={{ fontSize: 9, color: MCM.textDim, fontFamily: 'Monaco, monospace' }}>
                {warning.rule}
              </span>
            </div>
            <div style={{ fontSize: 10, color: MCM.text }}>{warning.message}</div>
          </div>
        ))
      )}
    </div>

    {/* Best Practices Section */}
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: MCM.text, marginBottom: 12, letterSpacing: 1 }}>
        BEST PRACTICES
      </div>
      {bestPractices.slice(0, 4).map((practice) => (
        <div key={practice.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 0',
          fontSize: 10,
        }}>
          <span style={{ color: practice.implemented ? MCM.sage : MCM.textDim }}>
            {practice.implemented ? '☑' : '☐'}
          </span>
          <span style={{ color: practice.implemented ? MCM.text : MCM.textMuted }}>
            {practice.text}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// AIInsightsPanel - Strengths + Weaknesses lists
const AIInsightsPanel: React.FC<{ analysis: AIAnalysis }> = ({ analysis }) => (
  <div style={{
    flex: 1,
    background: MCM.surface,
    borderRadius: 8,
    border: `1px solid ${MCM.line}`,
    padding: 16,
  }}>
    {/* Strengths */}
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: MCM.sage, marginBottom: 10 }}>
        Strengths
      </div>
      {analysis.strengths.map((s, i) => (
        <div key={i} style={{ fontSize: 10, color: MCM.text, padding: '4px 0', paddingLeft: 8 }}>
          • {s}
        </div>
      ))}
    </div>

    {/* Weaknesses */}
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: MCM.coral, marginBottom: 10 }}>
        Areas for Improvement
      </div>
      {analysis.weaknesses.map((w, i) => (
        <div key={i} style={{ fontSize: 10, color: MCM.text, padding: '4px 0', paddingLeft: 8 }}>
          • {w}
        </div>
      ))}
    </div>
  </div>
);

// AnalysisGrid - 3-column layout
const AnalysisGrid: React.FC<{
  tests: TestInfo;
  warnings: Warning[];
  bestPractices: BestPractice[];
  analysis: AIAnalysis;
}> = ({ tests, warnings, bestPractices, analysis }) => (
  <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
    <TestsPanel tests={tests} />
    <QualityPanel warnings={warnings} bestPractices={bestPractices} />
    <AIInsightsPanel analysis={analysis} />
  </div>
);

// PerformanceStrip - Horizontal metrics row
const PerformanceStrip: React.FC<{
  tsMetrics: PerformanceMetrics;
  swiftMetrics: PerformanceMetrics;
}> = ({ tsMetrics, swiftMetrics }) => (
  <div style={{
    display: 'flex',
    gap: 16,
    padding: 16,
    background: MCM.surface,
    borderRadius: 8,
    border: `1px solid ${MCM.line}`,
    marginBottom: 24,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
      <span style={{ fontSize: 18, color: MCM.teal }}>⚡</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: MCM.teal }}>
          {tsMetrics.renderTime ?? '-'}ms
        </div>
        <div style={{ fontSize: 9, color: MCM.textMuted }}>Render Time</div>
      </div>
    </div>

    <div style={{ width: 1, background: MCM.line }} />

    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
      <span style={{ fontSize: 18, color: MCM.gold }}>📦</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: MCM.gold }}>
          {tsMetrics.bundleSize ? `${(tsMetrics.bundleSize / 1000).toFixed(1)}KB` : '-'}
        </div>
        <div style={{ fontSize: 9, color: MCM.textMuted }}>Bundle Size</div>
      </div>
    </div>

    <div style={{ width: 1, background: MCM.line }} />

    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
      <span style={{ fontSize: 18, color: tsMetrics.rerenderCount && tsMetrics.rerenderCount > 1 ? MCM.coral : MCM.sage }}>🔄</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: tsMetrics.rerenderCount && tsMetrics.rerenderCount > 1 ? MCM.coral : MCM.sage }}>
          {tsMetrics.rerenderCount ?? 0}
        </div>
        <div style={{ fontSize: 9, color: MCM.textMuted }}>Re-renders</div>
      </div>
    </div>

    <div style={{ width: 1, background: MCM.line }} />

    {/* Mini trend sparkline placeholder */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 2 }}>
      <span style={{ fontSize: 10, color: MCM.textMuted }}>TREND</span>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 24 }}>
        {[1, 2, 3, 2, 1, 2, 3, 4, 3, 2, 1].map((h, i) => (
          <div key={i} style={{ width: 4, height: h * 5, background: MCM.teal, opacity: 0.6 + i * 0.03, borderRadius: 1 }} />
        ))}
      </div>
    </div>
  </div>
);

// ActionCard - Individual action item card
const ActionCard: React.FC<{
  item: ActionItem;
  isCompleted: boolean;
  onToggle: () => void;
}> = ({ item, isCompleted, onToggle }) => (
  <div style={{
    background: MCM.bg,
    borderRadius: 6,
    border: `1px solid ${isCompleted ? MCM.sage : MCM.line}`,
    padding: 12,
    opacity: isCompleted ? 0.6 : 1,
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <button
        onClick={onToggle}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}
      >
        <span style={{ fontSize: 14, color: isCompleted ? MCM.sage : MCM.textDim }}>
          {isCompleted ? '☑' : '☐'}
        </span>
      </button>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 11,
          color: isCompleted ? MCM.textMuted : MCM.text,
          textDecoration: isCompleted ? 'line-through' : 'none',
          marginBottom: 8,
        }}>
          {item.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 8,
            color: MCM.textDim,
            padding: '2px 6px',
            background: MCM.surface,
            borderRadius: 3,
          }}>
            {item.category}
          </span>
          <span style={{
            fontSize: 8,
            color: isCompleted ? MCM.textDim : getSeverityColor(item.priority),
            padding: '2px 6px',
            background: isCompleted ? MCM.surface : `${getSeverityColor(item.priority)}20`,
            borderRadius: 3,
          }}>
            {item.priority}
          </span>
          <EffortBadge effort={item.effort} />
          {item.relatedFiles[0] && (
            <span style={{ fontSize: 8, color: MCM.textDim }}>· {item.relatedFiles[0]}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

// ActionItemsSection - 2-column card grid
const ActionItemsSection: React.FC<{
  items: ActionItem[];
  completedState: Record<string, boolean>;
  onToggle: (id: string) => void;
}> = ({ items, completedState, onToggle }) => {
  const pendingCount = items.filter(a => !(completedState[a.id] ?? a.completed)).length;

  return (
    <div style={{
      background: MCM.surface,
      borderRadius: 8,
      border: `1px solid ${MCM.line}`,
      padding: 16,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: MCM.text, letterSpacing: 1 }}>
          ACTION ITEMS
        </div>
        <span style={{
          fontSize: 10,
          color: pendingCount > 0 ? MCM.gold : MCM.sage,
          padding: '4px 10px',
          background: pendingCount > 0 ? `${MCM.gold}15` : `${MCM.sage}15`,
          borderRadius: 4,
        }}>
          {pendingCount} pending
        </span>
      </div>

      {/* 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {items.map((item) => (
          <ActionCard
            key={item.id}
            item={item}
            isCompleted={completedState[item.id] ?? item.completed}
            onToggle={() => onToggle(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// AnalysisDashboard - Main 1400px container (replaces ElementAnalysisCard)
// ============================================================================

const AnalysisDashboard: React.FC<{ data: ExtendedElementData }> = ({ data }) => {
  const [codebase, setCodebase] = useState<Codebase>('typescript');
  const [actionItemsState, setActionItemsState] = useState<Record<string, boolean>>({});

  const toggleActionItem = (itemId: string) => {
    setActionItemsState(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const currentTests = data.tests[codebase];
  const currentWarnings = data.warnings[codebase];
  const currentAnalysis = data.aiAnalysis[codebase];

  return (
    <div style={{ width: '100%' }}>
      {/* Codebase Selector (small, top-right) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <CodebaseSelector selected={codebase} onChange={setCodebase} />
      </div>

      {/* Hero Section */}
      <HeroSection data={data} codebase={codebase} />

      {/* Side-by-Side Code Comparison */}
      <CodeComparison data={data} />

      {/* 3-Column Analysis Grid */}
      <AnalysisGrid
        tests={currentTests}
        warnings={currentWarnings}
        bestPractices={data.bestPractices}
        analysis={currentAnalysis}
      />

      {/* Performance Strip */}
      <PerformanceStrip
        tsMetrics={data.performance.typescript}
        swiftMetrics={data.performance.swift}
      />

      {/* Action Items */}
      <ActionItemsSection
        items={data.actionItems}
        completedState={actionItemsState}
        onToggle={toggleActionItem}
      />
    </div>
  );
};

// ============================================================================
// Element Analysis Card (LEGACY - kept for reference)
// ============================================================================

const ElementAnalysisCard: React.FC<{ data: ExtendedElementData }> = ({ data }) => {
  const [codebase, setCodebase] = useState<Codebase>('typescript');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['code', 'tests', 'aiAnalysis', 'actionItems']));
  const [actionItemsState, setActionItemsState] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleActionItem = (itemId: string) => {
    setActionItemsState(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const expandAll = () => setExpandedSections(new Set(['code', 'tests', 'warnings', 'bestPractices', 'aiAnalysis', 'actionItems', 'performance']));
  const collapseAll = () => setExpandedSections(new Set());

  const current = {
    snippet: data.codeSnippets[codebase],
    tests: data.tests[codebase],
    warnings: data.warnings[codebase],
    performance: data.performance[codebase],
    analysis: data.aiAnalysis[codebase],
  };

  const incompleteActions = data.actionItems.filter(a => !(actionItemsState[a.id] ?? a.completed)).length;

  return (
    <div style={{ background: MCM.surface, borderRadius: 8, border: `1px solid ${MCM.line}`, padding: 16, marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: MCM.text }}>{data.name}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: getColorForType(data.type), padding: '3px 8px', background: `${getColorForType(data.type)}20`, borderRadius: 4 }}>{data.type}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={expandAll} style={{ fontSize: 9, color: MCM.textMuted, background: 'transparent', border: `1px solid ${MCM.line}`, borderRadius: 3, padding: '4px 8px', cursor: 'pointer' }}>Expand All</button>
          <button onClick={collapseAll} style={{ fontSize: 9, color: MCM.textMuted, background: 'transparent', border: `1px solid ${MCM.line}`, borderRadius: 3, padding: '4px 8px', cursor: 'pointer' }}>Collapse</button>
        </div>
      </div>

      {/* Codebase Selector */}
      <CodebaseSelector selected={codebase} onChange={setCodebase} />

      {/* Element Preview */}
      <div style={{ padding: 16, background: MCM.bg, borderRadius: 4, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
        <div style={{ width: data.width, height: data.height, minWidth: data.width, minHeight: data.height, borderRadius: 4, border: `1px dashed ${MCM.line}`, background: MCM.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: MCM.textDim }}>
          {data.width}×{data.height}
        </div>
      </div>

      {/* CODE Section */}
      <CollapsibleSection
        title="CODE"
        icon="{ }"
        isOpen={expandedSections.has('code')}
        onToggle={() => toggleSection('code')}
        badge={{ text: `${current.snippet.endLine - current.snippet.startLine} lines`, color: MCM.teal }}
      >
        <div style={{ background: MCM.bg, borderRadius: 4, padding: 12, fontFamily: 'Monaco, monospace', fontSize: 10, color: MCM.text, whiteSpace: 'pre', overflow: 'auto', maxHeight: 120 }}>
          {current.snippet.code}
        </div>
        <div style={{ fontSize: 9, color: MCM.textMuted, marginTop: 8 }}>📁 {current.snippet.filePath}</div>
      </CollapsibleSection>

      {/* TESTS Section */}
      <CollapsibleSection
        title="TESTS"
        icon="✓"
        isOpen={expandedSections.has('tests')}
        onToggle={() => toggleSection('tests')}
        badge={{ text: `${current.tests.passing}/${current.tests.total}`, color: current.tests.failing > 0 ? MCM.orange : MCM.sage }}
      >
        <TestStatusBar tests={current.tests} />
      </CollapsibleSection>

      {/* WARNINGS Section */}
      <CollapsibleSection
        title="WARNINGS"
        icon="⚠"
        isOpen={expandedSections.has('warnings')}
        onToggle={() => toggleSection('warnings')}
        badge={{ text: `${current.warnings.length}`, color: current.warnings.some(w => w.severity === 'critical' || w.severity === 'high') ? MCM.orange : MCM.gold }}
      >
        <WarningsList warnings={current.warnings} />
      </CollapsibleSection>

      {/* BEST PRACTICES Section */}
      <CollapsibleSection
        title="BEST PRACTICES"
        icon="★"
        isOpen={expandedSections.has('bestPractices')}
        onToggle={() => toggleSection('bestPractices')}
        badge={{ text: `${data.bestPractices.filter(bp => bp.implemented).length}/${data.bestPractices.length}`, color: MCM.teal }}
      >
        <BestPracticesChecklist practices={data.bestPractices} />
      </CollapsibleSection>

      {/* AI ANALYSIS Section */}
      <CollapsibleSection
        title="AI ANALYSIS"
        icon="◉"
        isOpen={expandedSections.has('aiAnalysis')}
        onToggle={() => toggleSection('aiAnalysis')}
        badge={{ text: current.analysis.grade, color: getGradeColor(current.analysis.grade) }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <GradeBadge grade={current.analysis.grade} score={current.analysis.score} />
          <SeverityBadge severity={current.analysis.importance} />
          <span style={{ fontSize: 9, color: MCM.textMuted }}>{current.analysis.problemSize} effort</span>
        </div>
        <div style={{ fontSize: 11, color: MCM.text, marginBottom: 12, lineHeight: 1.5 }}>{current.analysis.summary}</div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: MCM.sage, fontWeight: 600, marginBottom: 4 }}>Strengths:</div>
          {current.analysis.strengths.map((s, i) => <div key={i} style={{ fontSize: 10, color: MCM.textMuted, paddingLeft: 8 }}>• {s}</div>)}
        </div>
        <div>
          <div style={{ fontSize: 10, color: MCM.coral, fontWeight: 600, marginBottom: 4 }}>Weaknesses:</div>
          {current.analysis.weaknesses.map((w, i) => <div key={i} style={{ fontSize: 10, color: MCM.textMuted, paddingLeft: 8 }}>• {w}</div>)}
        </div>
      </CollapsibleSection>

      {/* ACTION ITEMS Section */}
      <CollapsibleSection
        title="ACTION ITEMS"
        icon="☐"
        isOpen={expandedSections.has('actionItems')}
        onToggle={() => toggleSection('actionItems')}
        badge={{ text: `${incompleteActions}`, color: incompleteActions > 0 ? MCM.gold : MCM.sage }}
      >
        <ActionItemsList items={data.actionItems} onToggle={toggleActionItem} completedState={actionItemsState} />
      </CollapsibleSection>

      {/* PERFORMANCE Section */}
      <CollapsibleSection
        title="PERFORMANCE"
        icon="⚡"
        isOpen={expandedSections.has('performance')}
        onToggle={() => toggleSection('performance')}
      >
        <PerformanceDisplay metrics={current.performance} />
      </CollapsibleSection>
    </div>
  );
};

// ============================================================================
// Screenshot Viewer (Wireframe without labels)
// ============================================================================

const ScreenshotViewer: React.FC<{
  screenTitle: string;
}> = ({ screenTitle }) => {
  const phoneHeight = 500;
  const phoneWidth = 240;

  return (
    <div style={{ width: phoneWidth, height: phoneHeight }}>
      <WireframePhone screen={screenTitle as any} />
    </div>
  );
};

// ============================================================================
// Elements Wireframe Component (phone frame + dotted element boxes + labels)
// ============================================================================

const ElementsWireframe: React.FC<{
  screen: string;
  selectedElementIndex: number;
  onSelectElement: (idx: number) => void;
  trimmedImages?: Record<string, string>; // id -> image URL
  width: number;
  height: number;
}> = ({ screen, selectedElementIndex, onSelectElement, trimmedImages, width, height }) => {
  // Phone dimensions (same as WireframePhone)
  const phoneWidth = 240;
  const phoneHeight = 500;
  const inset = 8;
  const cornerRadius = 28;
  const screenX = inset + 12;  // 20
  const screenY = inset + 44;  // 52
  const screenW = phoneWidth - inset * 2 - 24;  // 200
  const screenH = phoneHeight - inset * 2 - 72; // 412

  // Center phone in column
  const phoneX = (width - phoneWidth) / 2;
  const phoneY = (height - phoneHeight) / 2;

  // Label dimensions (matching column 1 exactly)
  const labelWidth = 160;
  const margin = 50;

  // Get element positions for this screen
  const elements = screenElementPositions[screen] || [];

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Phone Frame SVG */}
      <svg
        style={{ position: 'absolute', left: phoneX, top: phoneY }}
        width={phoneWidth}
        height={phoneHeight}
        viewBox={`0 0 ${phoneWidth} ${phoneHeight}`}
      >
        {/* Phone outline */}
        <rect
          x={inset}
          y={inset}
          width={phoneWidth - inset * 2}
          height={phoneHeight - inset * 2}
          rx={cornerRadius}
          stroke={MCM.lineActive}
          strokeWidth={2}
          fill="none"
        />

        {/* Corner nodes */}
        {[
          [inset, inset + cornerRadius],
          [inset + cornerRadius, inset],
          [phoneWidth - inset - cornerRadius, inset],
          [phoneWidth - inset, inset + cornerRadius],
          [phoneWidth - inset, phoneHeight - inset - cornerRadius],
          [phoneWidth - inset - cornerRadius, phoneHeight - inset],
          [inset + cornerRadius, phoneHeight - inset],
          [inset, phoneHeight - inset - cornerRadius]
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={4} fill={MCM.orange} />
        ))}

        {/* Dynamic Island */}
        <rect
          x={phoneWidth / 2 - 40}
          y={inset + 10}
          width={80}
          height={24}
          rx={12}
          fill="#000"
        />

        {/* Home indicator */}
        <rect
          x={phoneWidth / 2 - 45}
          y={phoneHeight - inset - 16}
          width={90}
          height={4}
          rx={2}
          fill={MCM.lineActive}
        />
      </svg>

      {/* Dashed lines connecting phone edge to labels (matching column 1) */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {elements.map((el, idx) => {
          const isLeft = el.side === 'left';
          const color = getColorForType(el.type);
          const isSelected = idx === selectedElementIndex;

          // Label Y position using labelY (0-1 relative to phone height, matching column 1)
          const labelYPos = phoneY + el.labelY * phoneHeight;

          // Connection point on phone edge (matching column 1: phoneRect.x - 8 or + width + 8)
          const phoneEdgeX = isLeft ? phoneX + inset - 8 : phoneX + phoneWidth - inset + 8;

          // Label position (matching column 1)
          const labelX = isLeft
            ? phoneEdgeX - margin - labelWidth
            : phoneEdgeX + margin;
          const labelEndX = isLeft ? labelX + labelWidth : labelX;

          return (
            <g key={el.id} style={{ transition: 'all 0.15s ease' }}>
              <path
                d={`M ${phoneEdgeX} ${labelYPos} L ${labelEndX} ${labelYPos}`}
                stroke={color}
                strokeOpacity={isSelected ? 1 : 0.6}
                strokeWidth={isSelected ? 1.5 : 1}
                strokeDasharray="4 3"
                fill="none"
              />
              <circle cx={phoneEdgeX} cy={labelYPos} r={isSelected ? 4 : 3} fill={color} />
              <circle cx={isLeft ? labelEndX + 4 : labelEndX - 4} cy={labelYPos} r={isSelected ? 3.5 : 2.5} fill={color} />
            </g>
          );
        })}
      </svg>

      {/* Element boxes (inside phone content area) */}
      {elements.map((el, idx) => {
        const color = getColorForType(el.type);
        const isSelected = idx === selectedElementIndex;
        const hasTrimmedImage = trimmedImages && trimmedImages[el.id];
        // Use circular shape for Image types that are square (like logos in wireframe)
        const isCircular = el.type === 'Image' && el.width === el.height;
        // Link types without containers render as horizontal lines (like in wireframe)
        const isLine = el.type === 'Link';

        // For Link types, render as a horizontal line
        if (isLine) {
          return (
            <div
              key={el.id}
              onClick={() => onSelectElement(idx)}
              style={{
                position: 'absolute',
                left: phoneX + screenX + el.x,
                top: phoneY + screenY + el.y + el.height / 2,
                width: el.width,
                height: 0,
                borderTop: `1px ${isSelected ? 'solid' : 'dashed'} ${isSelected ? color : MCM.lineActive}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            />
          );
        }

        return (
          <div
            key={el.id}
            onClick={() => onSelectElement(idx)}
            style={{
              position: 'absolute',
              left: phoneX + screenX + el.x,
              top: phoneY + screenY + el.y,
              width: el.width,
              height: el.height,
              border: `1px dashed ${isSelected ? color : MCM.lineActive}`,
              borderRadius: isCircular ? '50%' : 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              color: MCM.textDim,
              cursor: 'pointer',
              background: isSelected ? `${color}10` : 'transparent',
              transition: 'all 0.15s ease',
              overflow: 'hidden',
            }}
          >
            {hasTrimmedImage ? (
              <Image
                src={trimmedImages[el.id] || ''}
                alt={el.name}
                width={el.width}
                height={el.height}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                unoptimized
              />
            ) : (
              <span>{el.width}×{el.height}</span>
            )}
          </div>
        );
      })}

      {/* Labels (outside phone frame - matching column 1 AnnotationCard exactly) */}
      {elements.map((el, idx) => {
        const isLeft = el.side === 'left';
        const color = getColorForType(el.type);
        const isSelected = idx === selectedElementIndex;

        // Label Y position using labelY (0-1 relative to phone height, matching column 1)
        const labelYPos = phoneY + el.labelY * phoneHeight;

        // Match column 1 label positioning exactly
        const phoneEdgeX = isLeft ? phoneX + inset - 8 : phoneX + phoneWidth - inset + 8;
        const labelX = isLeft
          ? phoneEdgeX - margin - labelWidth
          : phoneEdgeX + margin;

        return (
          <div
            key={`label-${el.id}`}
            onClick={() => onSelectElement(idx)}
            style={{
              position: 'absolute',
              left: labelX,
              top: labelYPos,
              transform: 'translateY(-50%)',
              width: labelWidth,
              padding: '6px 10px',
              background: isSelected ? `${color}15` : `${MCM.surface}e6`,
              borderRadius: 4,
              border: `1px solid ${isSelected ? color : MCM.line}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: color, padding: '2px 5px', background: `${color}26`, borderRadius: 2 }}>
                {el.type}
              </span>
              <span style={{ fontSize: 11, fontWeight: 500, color: MCM.text }}>{el.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// Main Page Component
// ============================================================================

export default function WireframeScreenshotV2() {
  const [selectedScreenIndex, setSelectedScreenIndex] = useState(0);
  const [selectedElementIndex, setSelectedElementIndex] = useState(0);
  const selectedScreen = screens[selectedScreenIndex];
  const selectedAnnotation = selectedScreen?.annotations[selectedElementIndex];
  const elementData = generateElementData(selectedAnnotation!, selectedElementIndex);

  const phoneWidth = 240;
  const phoneHeight = 500;
  const viewerWidth = 700;
  const viewerHeight = 600;
  const screenshotColumnWidth = 320;
  const elementsGridWidth = 700;  // Increased to accommodate labels on both sides
  const analysisColumnWidth = 1400;  // Expanded dashboard layout

  const phoneRect = {
    x: (viewerWidth - phoneWidth) / 2,
    y: (viewerHeight - phoneHeight) / 2,
    width: phoneWidth,
    height: phoneHeight,
  };

  return (
    <>
      <Head>
        <title>TopDog Wireframe + Screenshots v2</title>
        <style>{`
          * {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          *::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </Head>
      <div style={{ background: MCM.bg, minHeight: '100vh', color: MCM.text, position: 'relative', overflowX: 'auto' }}>
        <GridBackground />

        {/* Unified Navigation Header */}
        <header style={{
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
          minWidth: viewerWidth + screenshotColumnWidth + elementsGridWidth + analysisColumnWidth,
        }}>
          {/* Left side - Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, zIndex: 1 }}>
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
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 4, color: MCM.text }}>TOPDOG</div>
              <div style={{ fontSize: 10, fontWeight: 500, color: MCM.textMuted }}>iOS Developer Wireframes</div>
            </div>
          </div>

          {/* Center - Screen Selector Nav (positioned over column 2) */}
          <nav style={{
            position: 'absolute',
            left: viewerWidth + (screenshotColumnWidth / 2),
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 0
          }}>
            {screens.map((screen, idx) => (
              <React.Fragment key={screen.title}>
                <button
                  onClick={() => { setSelectedScreenIndex(idx); setSelectedElementIndex(0); }}
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
                  <span style={{ fontSize: 11, fontWeight: selectedScreenIndex === idx ? 600 : 400, color: selectedScreenIndex === idx ? MCM.text : MCM.textDim }}>{screen.title}</span>
                  {selectedScreenIndex === idx ? (
                    <svg width={6} height={6} viewBox="0 0 6 6"><path d="M3 0 L6 3 L3 6 L0 3 Z" fill={MCM.orange} /></svg>
                  ) : (
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: MCM.line }} />
                  )}
                </button>
                {idx < screens.length - 1 && <div style={{ width: 20, height: 1, background: MCM.line }} />}
              </React.Fragment>
            ))}
          </nav>

          {/* Right side - Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 1 }}>
            <Link href="/dev/wireframe-screenshot" style={{ fontSize: 10, color: MCM.textMuted, textDecoration: 'none', padding: '6px 12px', border: `1px solid ${MCM.line}`, borderRadius: 4 }}>v1</Link>
            <Link href="/dev/extraction" style={{ fontSize: 10, color: MCM.orange, textDecoration: 'none', padding: '6px 12px', border: `1px solid ${MCM.orange}`, borderRadius: 4 }}>Extraction</Link>
            <Link href="/dev/catalog" style={{ fontSize: 10, color: MCM.teal, textDecoration: 'none', padding: '6px 12px', border: `1px solid ${MCM.teal}`, borderRadius: 4 }}>Catalog</Link>
          </div>
        </header>

        {/* Main Content */}
        <div style={{ display: 'flex', position: 'relative', zIndex: 1, minWidth: viewerWidth + screenshotColumnWidth + elementsGridWidth + analysisColumnWidth }}>
          {/* Left: Wireframe Viewer */}
          <div style={{ width: viewerWidth, minWidth: viewerWidth, borderRight: `1px solid ${MCM.line}`, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 16px', borderBottom: `1px solid ${MCM.line}`, textAlign: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: MCM.textMuted, letterSpacing: 1 }}>WIREFRAME</span>
            </div>
            <div style={{
              minHeight: 'calc(100vh - 100px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{ position: 'relative', width: viewerWidth, height: viewerHeight }}>
                <div style={{ position: 'absolute', left: phoneRect.x, top: phoneRect.y, width: phoneRect.width, height: phoneRect.height }}>
                  <WireframePhone screen={selectedScreen!.title as any} />
                </div>
                <AnnotationLabels annotations={selectedScreen!.annotations} phoneRect={phoneRect} selectedIndex={selectedElementIndex} />
                {selectedScreen!.annotations.map((ann, idx) => (
                  <div
                    key={ann.id}
                    onClick={() => setSelectedElementIndex(idx)}
                    style={{ cursor: 'pointer' }}
                  >
                    <AnnotationCard annotation={ann} phoneRect={phoneRect} isSelected={idx === selectedElementIndex} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle: Screenshot (Wireframe without labels) */}
          <div style={{ width: screenshotColumnWidth, minWidth: screenshotColumnWidth, borderRight: `1px solid ${MCM.line}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 16px', borderBottom: `1px solid ${MCM.line}`, textAlign: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: MCM.textMuted, letterSpacing: 1 }}>SCREENSHOT</span>
            </div>
            <div style={{
              minHeight: 'calc(100vh - 100px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ScreenshotViewer screenTitle={selectedScreen!.title} />
            </div>
          </div>

          {/* Elements Column */}
          <div style={{ width: elementsGridWidth, minWidth: elementsGridWidth, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 16px', borderBottom: `1px solid ${MCM.line}`, textAlign: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: MCM.textMuted, letterSpacing: 1 }}>
                ELEMENTS ({(screenElementPositions[selectedScreen!.title] || []).length})
              </span>
            </div>
            <div style={{
              minHeight: 'calc(100vh - 100px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ElementsWireframe
                screen={selectedScreen!.title}
                selectedElementIndex={selectedElementIndex}
                onSelectElement={setSelectedElementIndex}
                width={elementsGridWidth}
                height={viewerHeight}
              />
            </div>
          </div>

          {/* Analysis Column - 1400px Dashboard Layout */}
          <div style={{ width: analysisColumnWidth, minWidth: analysisColumnWidth, borderLeft: `1px solid ${MCM.line}`, display: 'flex', flexDirection: 'column', alignSelf: 'stretch' }}>
            <div style={{ padding: '8px 16px', borderBottom: `1px solid ${MCM.line}`, textAlign: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: MCM.textMuted, letterSpacing: 1 }}>
                ANALYSIS DASHBOARD
              </span>
            </div>
            <div style={{ padding: 24 }}>
              <AnalysisDashboard data={elementData} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
