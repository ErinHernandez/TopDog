/**
 * TopDog Studio Entry: StatusBadge
 *
 * Semantic status badge component that displays contextual status with colors.
 * Demonstrates select props with semantic options and pulse animations.
 *
 * @example
 * ```typescript
 * import entry from './StatusBadge.studio';
 * // Renders StatusBadge in the Studio canvas
 * ```
 *
 * @module components/vx2/components/shared/display/StatusBadge.studio
 */

import { defineStudio, type PropDefinitions } from '@/lib/studio/core';

import { StatusBadge, type StatusBadgeProps, type BadgeStatus } from './StatusBadge';

export default defineStudio(StatusBadge, {
  // Required metadata
  name: 'StatusBadge',
  module: 'shared-display',
  description: 'Semantic status badge with configurable status, label, and animation.',

  // Optional metadata
  tags: ['display', 'badge', 'status'],

  // Prop definitions for the Inspector
  props: {
    status: {
      type: 'select',
      label: 'Status',
      default: 'info',
      options: ['success', 'warning', 'error', 'info', 'neutral'],
      description: 'Semantic status that determines badge color',
    },
    label: {
      type: 'text',
      label: 'Label',
      default: 'Status Label',
      placeholder: 'Badge text',
      description: 'Text to display in the badge',
    },
    size: {
      type: 'select',
      label: 'Size',
      default: 'md',
      options: ['sm', 'md'],
    },
    pulse: {
      type: 'boolean',
      label: 'Pulse Animation',
      default: false,
      description: 'Enable pulsing animation for urgent statuses',
    },
  } satisfies PropDefinitions,

  // Named states demonstrating different badge scenarios
  states: {
    default: {
      name: 'Default (Info)',
      props: { status: 'info', label: 'INFO', size: 'md', pulse: false },
    },
    success: {
      name: 'Success',
      props: { status: 'success', label: 'SUCCESS', size: 'md', pulse: false },
    },
    warning: {
      name: 'Warning (Pulsing)',
      props: { status: 'warning', label: 'PENDING', size: 'md', pulse: true },
    },
    error: {
      name: 'Error (Pulsing)',
      props: { status: 'error', label: 'ERROR', size: 'md', pulse: true },
      meta: { _error: { message: 'Something went wrong' } },
    },
    neutral: {
      name: 'Neutral',
      props: { status: 'neutral', label: 'NEUTRAL', size: 'sm', pulse: false },
    },
    yourTurn: {
      name: 'Your Turn',
      props: { status: 'success', label: 'YOUR TURN', size: 'md', pulse: true },
    },
  },

  // Cross-platform mapping
  platforms: {
    'swift-ui': { status: 'in-progress' },
    'compose': { status: 'not-started' },
  },
});
