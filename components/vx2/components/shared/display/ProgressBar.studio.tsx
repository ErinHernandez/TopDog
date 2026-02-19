/**
 * TopDog Studio Entry: ProgressBar
 *
 * Visual progress indicator component with customizable value, colors, and labels.
 * Demonstrates numeric props, select options, and boolean toggles.
 *
 * @example
 * ```typescript
 * import entry from './ProgressBar.studio';
 * // Renders ProgressBar in the Studio canvas with interactive controls
 * ```
 *
 * @module components/vx2/components/shared/display/ProgressBar.studio
 */

import { defineStudio, type PropDefinitions } from '@/lib/studio/core';

import { ProgressBar, type ProgressBarProps } from './ProgressBar';

export default defineStudio(ProgressBar, {
  // Required metadata
  name: 'ProgressBar',
  module: 'shared-display',
  description: 'Visual progress indicator with customizable value, color, and size.',

  // Optional metadata
  tags: ['display', 'progress', 'indicator'],

  // Prop definitions drive the Inspector panel controls
  props: {
    value: {
      type: 'number',
      label: 'Progress Value',
      description: 'Progress percentage (0-100)',
      default: 65,
      min: 0,
      max: 100,
      step: 5,
      slider: true,
    },
    size: {
      type: 'select',
      label: 'Size',
      default: 'md',
      options: ['sm', 'md', 'lg'],
    },
    color: {
      type: 'color',
      label: 'Bar Color',
      default: '#3b82f6',
      description: 'Fill color for the progress bar',
    },
    backgroundColor: {
      type: 'color',
      label: 'Track Color',
      default: '#e5e7eb',
    },
    showLabel: {
      type: 'boolean',
      label: 'Show Percentage',
      default: false,
    },
    labelPosition: {
      type: 'select',
      label: 'Label Position',
      default: 'right',
      options: ['inside', 'right'],
    },
  } satisfies PropDefinitions,

  // Named states for the state matrix
  states: {
    default: {
      name: 'Default Progress',
      props: { value: 65, size: 'md', showLabel: false },
    },
    halfProgress: {
      name: 'Half Progress',
      props: { value: 50, size: 'md', showLabel: true, labelPosition: 'right' },
    },
    complete: {
      name: 'Complete',
      props: { value: 100, size: 'md', showLabel: true, labelPosition: 'inside' },
    },
    empty: {
      name: 'Empty',
      props: { value: 0, size: 'md', showLabel: false },
      meta: { _empty: true },
    },
    large: {
      name: 'Large Size',
      props: { value: 75, size: 'lg', showLabel: true, labelPosition: 'inside' },
    },
  },

  // Cross-platform implementation status
  platforms: {
    'swift-ui': { status: 'planned' },
    'compose': { status: 'not-started' },
  },
});
