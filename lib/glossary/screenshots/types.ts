/**
 * Screenshot Management System - Types
 *
 * Type definitions for the screenshot capture, extraction, and storage system.
 * Part of the world's first enterprise-grade app with zero human-written code.
 */

// ============================================================================
// DRAFT UI STATES - Every possible state of the Draft Room
// ============================================================================

export type DraftUIState =
  | 'pre-draft-lobby'      // Waiting in lobby before draft starts
  | 'draft-countdown'       // 3-2-1 countdown to draft start
  | 'draft-starting'        // Draft is beginning
  | 'opponent-picking'      // Waiting for opponent to pick
  | 'user-turn-normal'      // User's turn, plenty of time
  | 'user-turn-warning'     // User's turn, under 30 seconds
  | 'user-turn-urgent'      // User's turn, under 10 seconds
  | 'user-turn-critical'    // User's turn, under 5 seconds
  | 'pick-made'             // Pick just made animation
  | 'pick-confirmed'        // Pick confirmed state
  | 'round-complete'        // End of a round
  | 'draft-paused'          // Draft is paused
  | 'draft-complete'        // Draft finished
  | 'post-draft-summary'    // Summary screen after draft
  | 'connection-lost'       // Lost connection state
  | 'reconnecting'          // Attempting to reconnect
  | 'error-state';          // Error occurred

export interface DraftStateConfig {
  id: DraftUIState;
  name: string;
  description: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  primaryColor: string;
  accentColor: string;
  animationActive: boolean;
  timerVisible: boolean;
  timerValue?: number; // seconds remaining if applicable
}

// All draft states with their configurations
export const DRAFT_STATES: DraftStateConfig[] = [
  {
    id: 'pre-draft-lobby',
    name: 'Pre-Draft Lobby',
    description: 'Waiting in lobby before draft begins',
    urgencyLevel: 'low',
    primaryColor: '#1F2937',
    accentColor: '#3B82F6',
    animationActive: false,
    timerVisible: true,
    timerValue: 300,
  },
  {
    id: 'draft-countdown',
    name: 'Draft Countdown',
    description: '3-2-1 countdown animation',
    urgencyLevel: 'medium',
    primaryColor: '#1F2937',
    accentColor: '#10B981',
    animationActive: true,
    timerVisible: true,
    timerValue: 3,
  },
  {
    id: 'draft-starting',
    name: 'Draft Starting',
    description: 'Draft is beginning',
    urgencyLevel: 'medium',
    primaryColor: '#1F2937',
    accentColor: '#10B981',
    animationActive: true,
    timerVisible: false,
  },
  {
    id: 'opponent-picking',
    name: 'Opponent Picking',
    description: 'Waiting for opponent to make their pick',
    urgencyLevel: 'low',
    primaryColor: '#1F2937',
    accentColor: '#6B7280',
    animationActive: false,
    timerVisible: true,
    timerValue: 45,
  },
  {
    id: 'user-turn-normal',
    name: 'Your Turn',
    description: 'User\'s turn with plenty of time',
    urgencyLevel: 'medium',
    primaryColor: '#1F2937',
    accentColor: '#10B981',
    animationActive: false,
    timerVisible: true,
    timerValue: 60,
  },
  {
    id: 'user-turn-warning',
    name: 'Your Turn (Warning)',
    description: 'User\'s turn with under 30 seconds',
    urgencyLevel: 'high',
    primaryColor: '#1F2937',
    accentColor: '#F59E0B',
    animationActive: true,
    timerVisible: true,
    timerValue: 25,
  },
  {
    id: 'user-turn-urgent',
    name: 'Your Turn (Urgent)',
    description: 'User\'s turn with under 10 seconds',
    urgencyLevel: 'critical',
    primaryColor: '#1F2937',
    accentColor: '#EF4444',
    animationActive: true,
    timerVisible: true,
    timerValue: 8,
  },
  {
    id: 'user-turn-critical',
    name: 'Your Turn (Critical)',
    description: 'User\'s turn with under 5 seconds',
    urgencyLevel: 'critical',
    primaryColor: '#7F1D1D',
    accentColor: '#EF4444',
    animationActive: true,
    timerVisible: true,
    timerValue: 3,
  },
  {
    id: 'pick-made',
    name: 'Pick Made',
    description: 'Pick animation playing',
    urgencyLevel: 'low',
    primaryColor: '#1F2937',
    accentColor: '#10B981',
    animationActive: true,
    timerVisible: false,
  },
  {
    id: 'pick-confirmed',
    name: 'Pick Confirmed',
    description: 'Pick successfully confirmed',
    urgencyLevel: 'low',
    primaryColor: '#1F2937',
    accentColor: '#10B981',
    animationActive: false,
    timerVisible: false,
  },
  {
    id: 'round-complete',
    name: 'Round Complete',
    description: 'End of draft round',
    urgencyLevel: 'low',
    primaryColor: '#1F2937',
    accentColor: '#8B5CF6',
    animationActive: true,
    timerVisible: false,
  },
  {
    id: 'draft-paused',
    name: 'Draft Paused',
    description: 'Draft temporarily paused',
    urgencyLevel: 'low',
    primaryColor: '#374151',
    accentColor: '#9CA3AF',
    animationActive: false,
    timerVisible: false,
  },
  {
    id: 'draft-complete',
    name: 'Draft Complete',
    description: 'Draft has finished',
    urgencyLevel: 'low',
    primaryColor: '#1F2937',
    accentColor: '#10B981',
    animationActive: true,
    timerVisible: false,
  },
  {
    id: 'post-draft-summary',
    name: 'Post-Draft Summary',
    description: 'Viewing draft results',
    urgencyLevel: 'low',
    primaryColor: '#1F2937',
    accentColor: '#3B82F6',
    animationActive: false,
    timerVisible: false,
  },
  {
    id: 'connection-lost',
    name: 'Connection Lost',
    description: 'Lost connection to server',
    urgencyLevel: 'critical',
    primaryColor: '#7F1D1D',
    accentColor: '#EF4444',
    animationActive: true,
    timerVisible: false,
  },
  {
    id: 'reconnecting',
    name: 'Reconnecting',
    description: 'Attempting to reconnect',
    urgencyLevel: 'high',
    primaryColor: '#1F2937',
    accentColor: '#F59E0B',
    animationActive: true,
    timerVisible: false,
  },
  {
    id: 'error-state',
    name: 'Error',
    description: 'An error occurred',
    urgencyLevel: 'critical',
    primaryColor: '#7F1D1D',
    accentColor: '#EF4444',
    animationActive: false,
    timerVisible: false,
  },
];

// ============================================================================
// SCREENSHOT TYPES
// ============================================================================

export type ScreenshotStatus =
  | 'pending'      // Not yet captured
  | 'captured'     // Raw screenshot taken
  | 'processing'   // Being trimmed/extracted
  | 'ready'        // Cleaned and ready for use
  | 'error';       // Failed to process

export type ScreenshotSource =
  | 'automated'    // Captured by Playwright script
  | 'manual'       // Manually uploaded
  | 'figma'        // Exported from Figma
  | 'storybook';   // Captured from Storybook

export interface RawScreenshot {
  id: string;
  filename: string;
  path: string;
  capturedAt: string; // ISO timestamp
  source: ScreenshotSource;
  route: string; // URL route where captured
  viewport: {
    width: number;
    height: number;
    deviceScaleFactor: number;
  };
  draftState?: DraftUIState;
  platform: 'web' | 'ios' | 'ipad' | 'android';
  fullPageHeight: number;
  fileSize: number; // bytes
  status: ScreenshotStatus;
  metadata?: Record<string, unknown>;
}

export interface ExtractedElement {
  id: string;
  elementId: string; // Glossary element ID (e.g., 'DR-SB-001')
  sourceScreenshotId: string;
  filename: string;
  path: string;
  extractedAt: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  padding: number; // Padding added around element
  state: string; // Element state (default, hover, pressed, etc.)
  platform: 'web' | 'ios' | 'ipad' | 'android';
  draftState?: DraftUIState;
  status: ScreenshotStatus;
  isHero: boolean;
  alt?: string;
  caption?: string;
}

export interface CleanedElement {
  id: string;
  elementId: string;
  extractedElementId: string;
  filename: string;
  path: string;
  cleanedAt: string;
  finalDimensions: {
    width: number;
    height: number;
  };
  state: string;
  platform: 'web' | 'ios' | 'ipad' | 'android';
  draftState?: DraftUIState;
  quality: 'draft' | 'review' | 'approved' | 'production';
  approvedBy?: string;
  approvedAt?: string;
  usedInGlossary: boolean;
  tags: string[];
}

// ============================================================================
// CAPTURE JOB TYPES
// ============================================================================

export interface CaptureJob {
  id: string;
  name: string;
  routes: string[];
  draftStates: DraftUIState[];
  platforms: ('web' | 'ios' | 'ipad' | 'android')[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  totalScreenshots: number;
  capturedScreenshots: number;
  errors: string[];
}

// ============================================================================
// EXTRACTION SELECTION
// ============================================================================

export interface ExtractionSelection {
  screenshotId: string;
  elementId: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  padding: number;
  state: string;
}
