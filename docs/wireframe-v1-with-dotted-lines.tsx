/**
 * WIREFRAME V1 - Original version with dashed annotation lines
 * 
 * This is the FIRST web version of the wireframe that includes:
 * - HTML Canvas-based phone drawing
 * - SVG annotation lines with dashed strokes (strokeDasharray="4 3")
 * - AnnotationLabels component drawing connecting lines from labels to phone
 * - AnnotationCard components for label boxes with absolute positioning
 * 
 * PRESERVED FOR REFERENCE - This file is not meant to be used directly.
 * Copy this code to a new file if you want to use it.
 */

import Head from 'next/head';
import React, { useState, useRef, useEffect } from 'react';

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
// Canvas Drawing Utilities
// ============================================================================

const drawNode = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  radius: number = 4
) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
};

const drawLine = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = MCM.lineActive,
  dashed?: boolean
) => {
  ctx.beginPath();
  ctx.setLineDash(dashed ? [4, 2] : []);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
  lineWidth: number = 1.5,
  dashed: boolean = false
) => {
  ctx.beginPath();
  ctx.setLineDash(dashed ? [4, 2] : []);
  ctx.roundRect(x, y, w, h, r);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.setLineDash([]);
};

const drawField = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) => {
  drawRoundedRect(ctx, x, y, w, h, 4, MCM.teal, 1.5);
  drawNode(ctx, x, y + h / 2, MCM.teal, 3);
  drawNode(ctx, x + w, y + h / 2, MCM.teal, 3);
};

const drawButton = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) => {
  drawRoundedRect(ctx, x, y, w, h, 6, MCM.orange, 1.5);
  drawNode(ctx, x, y + h / 2, MCM.orange, 3);
  drawNode(ctx, x + w, y + h / 2, MCM.orange, 3);
};

const drawTabBar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  activeIndex: number
) => {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.strokeStyle = MCM.line;
  ctx.lineWidth = 1;
  ctx.stroke();

  for (let i = 0; i < 5; i++) {
    const nodeX = x + (i * (w / 5)) + (w / 10);
    drawNode(ctx, nodeX, y + h / 2, i === activeIndex ? MCM.orange : MCM.textDim, 5);
  }
};

// ============================================================================
// Screen Drawing Functions
// ============================================================================

const drawSignIn = (ctx: CanvasRenderingContext2D, rect: DOMRect) => {
  const { x, y, width: w, height: h } = rect;

  // Logo circle
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 42, 22, 0, Math.PI * 2);
  ctx.strokeStyle = MCM.lineActive;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawNode(ctx, x + w / 2, y + 42, MCM.orange);

  // Email field
  drawField(ctx, x, y + 85, w, 36);

  // Password field
  drawField(ctx, x, y + 130, w, 36);

  // Remember + Forgot line
  drawLine(ctx, x, y + 180, x + w, y + 180, MCM.line, true);

  // Sign In button
  drawButton(ctx, x, y + 210, w, 40);

  // Sign Up link
  drawLine(ctx, x + w / 2 - 30, y + 280, x + w / 2 + 30, y + 280);
};

const drawSignUp = (ctx: CanvasRenderingContext2D, rect: DOMRect) => {
  const { x, y, width: w } = rect;

  // Logo
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 28, 18, 0, Math.PI * 2);
  ctx.strokeStyle = MCM.lineActive;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawNode(ctx, x + w / 2, y + 28, MCM.orange);

  // Title line
  drawLine(ctx, x + 30, y + 60, x + w - 30, y + 60);

  // Fields
  drawField(ctx, x, y + 80, w, 32);
  drawField(ctx, x, y + 120, w, 32);
  drawField(ctx, x, y + 160, w, 32);

  // Continue button
  drawButton(ctx, x, y + 210, w, 36);

  // Requirements card
  drawRoundedRect(ctx, x, y + 260, w, 50, 4, MCM.line, 1, true);
};

const drawLobby = (ctx: CanvasRenderingContext2D, rect: DOMRect) => {
  const { x, y, width: w, height: h } = rect;

  // Tournament card
  const cardY = y + 10;
  const cardH = 200;
  drawRoundedRect(ctx, x, cardY, w, cardH, 8, MCM.lineActive, 1.5);

  // Corner nodes
  drawNode(ctx, x, cardY + 8, MCM.teal);
  drawNode(ctx, x + w, cardY + 8, MCM.teal);
  drawNode(ctx, x + w, cardY + cardH - 8, MCM.teal);
  drawNode(ctx, x, cardY + cardH - 8, MCM.teal);

  // Globe
  ctx.beginPath();
  ctx.arc(x + w / 2, cardY + 65, 25, 0, Math.PI * 2);
  ctx.strokeStyle = MCM.lineActive;
  ctx.lineWidth = 1;
  ctx.stroke();
  drawNode(ctx, x + w / 2, cardY + 65, MCM.gold);

  // Progress bar
  const progY = cardY + 110;
  ctx.fillStyle = MCM.line;
  ctx.beginPath();
  ctx.roundRect(x + 15, progY, w - 30, 6, 3);
  ctx.fill();
  ctx.fillStyle = MCM.orange;
  ctx.beginPath();
  ctx.roundRect(x + 15, progY, (w - 30) * 0.7, 6, 3);
  ctx.fill();

  // Join button
  drawButton(ctx, x + 15, cardY + 130, w - 30, 32);

  // Stats
  const statsY = cardY + 175;
  drawNode(ctx, x + 35, statsY, MCM.gold);
  drawNode(ctx, x + w / 2, statsY, MCM.gold);
  drawNode(ctx, x + w - 35, statsY, MCM.gold);

  // Tab bar
  drawTabBar(ctx, x, y + h - 45, w, 40, 0);
};

const drawLiveDrafts = (ctx: CanvasRenderingContext2D, rect: DOMRect) => {
  const { x, y, width: w, height: h } = rect;

  // Title line
  drawLine(ctx, x + 20, y + 15, x + w - 20, y + 15);

  // Fast draft card
  const fastY = y + 35;
  drawRoundedRect(ctx, x, fastY, w, 85, 6, MCM.lineActive, 1.5);
  drawNode(ctx, x, fastY + 6, MCM.gold);
  drawNode(ctx, x + w, fastY + 6, MCM.gold);

  // Progress in fast card
  ctx.fillStyle = MCM.line;
  ctx.beginPath();
  ctx.roundRect(x + 10, fastY + 67, w - 20, 5, 2);
  ctx.fill();
  ctx.fillStyle = MCM.orange;
  ctx.beginPath();
  ctx.roundRect(x + 10, fastY + 67, (w - 20) * 0.66, 5, 2);
  ctx.fill();

  // Slow draft card
  const slowY = y + 135;
  drawRoundedRect(ctx, x, slowY, w, 85, 6, MCM.lineActive, 1.5);
  drawNode(ctx, x, slowY + 6, MCM.sage);
  drawNode(ctx, x + w, slowY + 6, MCM.sage);

  // Tab bar
  drawTabBar(ctx, x, y + h - 45, w, 40, 1);
};

const drawDraftPlayers = (ctx: CanvasRenderingContext2D, rect: DOMRect) => {
  const { x, y, width: w, height: h } = rect;

  // Top tabs
  ctx.beginPath();
  ctx.rect(x, y, w, 28);
  ctx.strokeStyle = MCM.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const nodeX = x + (i * (w / 5)) + (w / 10);
    drawNode(ctx, nodeX, y + 14, i === 0 ? MCM.orange : MCM.textDim, 3);
  }

  // Search
  drawField(ctx, x, y + 38, w, 28);

  // Position pills
  const pillsY = y + 76;
  for (let i = 0; i < 5; i++) {
    const pillX = x + (i * 36);
    drawRoundedRect(ctx, pillX, pillsY, 32, 18, 9, i === 0 ? MCM.orange : MCM.line);
  }

  // Player rows
  const rowColors = [MCM.coral, MCM.sage, MCM.gold, MCM.teal, MCM.coral];
  for (let i = 0; i < 5; i++) {
    const rowY = y + 110 + (i * 38);
    drawRoundedRect(ctx, x, rowY, w, 34, 4, MCM.line);
    drawNode(ctx, x + 12, rowY + 17, rowColors[i]!, 4);
    drawLine(ctx, x + 24, rowY + 17, x + 80, rowY + 17);
  }

  // Position tracker
  ctx.beginPath();
  ctx.rect(x, y + h - 50, w, 45);
  ctx.strokeStyle = MCM.lineActive;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Timer bar
  ctx.fillStyle = MCM.line;
  ctx.beginPath();
  ctx.roundRect(x + 8, y + h - 14, w - 50, 5, 2);
  ctx.fill();
  ctx.fillStyle = MCM.orange;
  ctx.beginPath();
  ctx.roundRect(x + 8, y + h - 14, (w - 50) * 0.6, 5, 2);
  ctx.fill();
};

const drawDraftRoster = (ctx: CanvasRenderingContext2D, rect: DOMRect) => {
  const { x, y, width: w, height: h } = rect;

  // Top tabs
  ctx.beginPath();
  ctx.rect(x, y, w, 28);
  ctx.strokeStyle = MCM.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const nodeX = x + (i * (w / 5)) + (w / 10);
    drawNode(ctx, nodeX, y + 14, i === 2 ? MCM.orange : MCM.textDim, 3);
  }

  // Roster slots
  const slotColors = [MCM.coral, MCM.sage, MCM.sage, MCM.gold, MCM.gold, MCM.gold, MCM.teal, MCM.lineActive];
  for (let i = 0; i < 8; i++) {
    const slotY = y + 40 + (i * 34);
    const isFilled = i < 3;
    drawRoundedRect(ctx, x, slotY, w, 30, 4, isFilled ? slotColors[i]! : `${slotColors[i]!}66`, 1.5, !isFilled);
    drawNode(ctx, x + 12, slotY + 15, slotColors[i]!, 4);
    if (isFilled) {
      drawLine(ctx, x + 24, slotY + 15, x + 80, slotY + 15);
    }
  }

  // Position tracker
  ctx.beginPath();
  ctx.rect(x, y + h - 50, w, 45);
  ctx.strokeStyle = MCM.lineActive;
  ctx.lineWidth = 1;
  ctx.stroke();
};

const drawProfile = (ctx: CanvasRenderingContext2D, rect: DOMRect) => {
  const { x, y, width: w, height: h } = rect;

  // User card
  const userY = y + 15;
  drawRoundedRect(ctx, x, userY, w, 60, 6, MCM.lineActive, 1.5);

  // Avatar
  ctx.beginPath();
  ctx.arc(x + 28, userY + 30, 18, 0, Math.PI * 2);
  ctx.strokeStyle = MCM.lineActive;
  ctx.lineWidth = 1;
  ctx.stroke();
  drawNode(ctx, x + 28, userY + 30, MCM.teal);

  // Info lines
  drawLine(ctx, x + 55, userY + 22, x + w - 15, userY + 22);
  drawLine(ctx, x + 55, userY + 38, x + w - 40, userY + 38);

  // Menu items
  for (let i = 0; i < 6; i++) {
    const itemY = y + 95 + (i * 36);
    drawRoundedRect(ctx, x, itemY, w, 32, 4, MCM.line);
    drawNode(ctx, x + 14, itemY + 16, MCM.gold, 3);
    drawLine(ctx, x + 26, itemY + 16, x + 90, itemY + 16);
  }

  // Add Funds button
  drawButton(ctx, x, y + h - 95, w, 36);

  // Tab bar
  drawTabBar(ctx, x, y + h - 45, w, 40, 4);
};

// ============================================================================
// Phone Wireframe Component
// ============================================================================

interface PhoneWireframeProps {
  title: string;
  width: number;
  height: number;
}

const PhoneWireframe: React.FC<PhoneWireframeProps> = ({ title, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);

    const inset = 8;
    const rect = {
      x: inset,
      y: inset,
      width: width - inset * 2,
      height: height - inset * 2,
    };
    const cornerRadius = 28;

    // Phone outline
    drawRoundedRect(ctx, rect.x, rect.y, rect.width, rect.height, cornerRadius, MCM.lineActive, 2);

    // Corner nodes
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
    nodePositions.forEach((pos) => drawNode(ctx, pos.x, pos.y, MCM.orange, 4));

    // Dynamic Island
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.roundRect(rect.x + rect.width / 2 - 40, rect.y + 10, 80, 24, 12);
    ctx.fill();

    // Home indicator
    ctx.fillStyle = MCM.lineActive;
    ctx.beginPath();
    ctx.roundRect(rect.x + rect.width / 2 - 45, rect.y + rect.height - 16, 90, 4, 2);
    ctx.fill();

    // Screen content area
    const screenRect = new DOMRect(
      rect.x + 12,
      rect.y + 44,
      rect.width - 24,
      rect.height - 72
    );

    // Draw screen content
    switch (title) {
      case 'Sign In':
        drawSignIn(ctx, screenRect);
        break;
      case 'Sign Up':
        drawSignUp(ctx, screenRect);
        break;
      case 'Lobby':
        drawLobby(ctx, screenRect);
        break;
      case 'Live Drafts':
        drawLiveDrafts(ctx, screenRect);
        break;
      case 'Draft: Players':
        drawDraftPlayers(ctx, screenRect);
        break;
      case 'Draft: Roster':
        drawDraftRoster(ctx, screenRect);
        break;
      case 'Profile':
        drawProfile(ctx, screenRect);
        break;
    }
  }, [title, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block' }}
    />
  );
};

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

  const labelWidth = 130;
  const margin = 24;

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
            {/* End node */}
            <circle cx={phoneEdgeX} cy={phoneY} r={3} fill={color} />
            {/* Start node */}
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
// Annotation Label Cards
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
  const labelWidth = 130;
  const margin = 24;
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
        padding: '6px 8px',
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
// Main Page Component
// ============================================================================

export default function WireframePage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(true);

  const phoneWidth = 220;
  const phoneHeight = 460;
  const containerWidth = 800;
  const containerHeight = 600;
  const phoneX = (containerWidth - phoneWidth) / 2;
  const phoneY = (containerHeight - phoneHeight) / 2;

  const currentScreen = screens[selectedIndex] || screens[0];

  return (
    <>
      <Head>
        <title>TopDog iOS Wireframes</title>
      </Head>

      <div
        style={{
          minHeight: '100vh',
          background: MCM.bg,
          color: MCM.text,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            background: MCM.surface,
            borderBottom: `1px solid ${MCM.line}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Atomic Logo */}
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
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 4, color: MCM.text }}>
                TOPDOG
              </div>
              <div style={{ fontSize: 10, fontWeight: 500, color: MCM.textMuted }}>
                iOSx Developer Wireframes
              </div>
            </div>
          </div>

          {/* Toggle */}
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
        </header>

        {/* Screen Selector */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            padding: '12px 20px',
            overflowX: 'auto',
            background: `${MCM.bg}cc`,
          }}
        >
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
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: MCM.line,
                    }}
                  />
                )}
              </button>
              {i < screens.length - 1 && (
                <div style={{ width: 20, height: 1, background: MCM.line }} />
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Main Content */}
        <main
          style={{
            position: 'relative',
            width: containerWidth,
            height: containerHeight,
            margin: '20px auto',
          }}
        >
          {/* Grid Background */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.03,
            }}
          >
            {Array.from({ length: Math.ceil(containerWidth / 32) }).map((_, i) => (
              <line
                key={`v${i}`}
                x1={i * 32}
                y1={0}
                x2={i * 32}
                y2={containerHeight}
                stroke="white"
                strokeWidth={0.5}
              />
            ))}
            {Array.from({ length: Math.ceil(containerHeight / 32) }).map((_, i) => (
              <line
                key={`h${i}`}
                x1={0}
                y1={i * 32}
                x2={containerWidth}
                y2={i * 32}
                stroke="white"
                strokeWidth={0.5}
              />
            ))}
          </svg>

          {/* Annotation Lines (DASHED SVG) */}
          <AnnotationLabels
            annotations={currentScreen!.annotations}
            phoneRect={{ x: phoneX, y: phoneY, width: phoneWidth, height: phoneHeight }}
            containerWidth={containerWidth}
            show={showAnnotations}
          />

          {/* Annotation Cards */}
          {showAnnotations &&
            currentScreen!.annotations.map((ann) => (
              <AnnotationCard
                key={ann.id}
                annotation={ann}
                phoneRect={{ x: phoneX, y: phoneY, width: phoneWidth, height: phoneHeight }}
                containerWidth={containerWidth}
              />
            ))}

          {/* Phone */}
          <div
            style={{
              position: 'absolute',
              left: phoneX,
              top: phoneY,
            }}
          >
            <PhoneWireframe title={currentScreen!.title} width={phoneWidth} height={phoneHeight} />
          </div>
        </main>

        {/* Footer */}
        <footer
          style={{
            textAlign: 'center',
            padding: 20,
            fontSize: 10,
            color: MCM.textDim,
          }}
        >
          TopDog iOSx • Mid-Century Modern Design System • {screens.length} Screens
        </footer>
      </div>
    </>
  );
}
