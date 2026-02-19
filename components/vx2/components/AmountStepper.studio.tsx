/**
 * TopDog Studio Entry: AmountStepper
 *
 * Interactive amount stepper for deposit/payment flows.
 * Demonstrates complex props with multiple field types: numbers, text, booleans.
 * Shows real-world callback handling and multi-state scenarios.
 *
 * @example
 * ```typescript
 * import entry from './AmountStepper.studio';
 * // Renders AmountStepper with mock exchange rates and callbacks
 * ```
 *
 * @module components/vx2/components/AmountStepper.studio
 */

import { defineStudio, type PropDefinitions } from '@/lib/studio/core';

import { AmountStepper, type AmountStepperProps } from './AmountStepper';

export default defineStudio(AmountStepper, {
  // Required metadata
  name: 'AmountStepper',
  module: 'payments',
  description: 'Interactive stepper control for deposit amounts with currency support.',

  // Optional metadata
  tags: ['payments', 'form', 'interactive', 'currency'],

  // Prop definitions for the Inspector panel
  props: {
    amountUSD: {
      type: 'number',
      label: 'Amount (USD)',
      default: 100,
      min: 25,
      max: 10000,
      step: 25,
      description: 'Current amount in USD cents',
    },
    displayCurrency: {
      type: 'select',
      label: 'Display Currency',
      default: 'USD',
      options: ['USD', 'AUD', 'EUR', 'GBP', 'CAD', 'JPY'],
      description: 'Currency to display to the user',
    },
    exchangeRate: {
      type: 'number',
      label: 'Exchange Rate',
      default: 1.0,
      min: 0.5,
      max: 150,
      step: 0.01,
      description: '1 USD = X local currency (null = loading)',
    },
    rateLoading: {
      type: 'boolean',
      label: 'Rate Loading',
      default: false,
      description: 'Simulate loading state for exchange rate',
    },
    minUSD: {
      type: 'number',
      label: 'Minimum (USD)',
      default: 25,
      min: 1,
      max: 1000,
      step: 5,
    },
    maxUSD: {
      type: 'number',
      label: 'Maximum (USD)',
      default: 10000,
      min: 100,
      max: 50000,
      step: 100,
    },
    disabled: {
      type: 'boolean',
      label: 'Disabled',
      default: false,
    },
  } satisfies PropDefinitions,

  // Named states showing different scenarios
  states: {
    usdDefault: {
      name: 'Default (USD)',
      props: {
        amountUSD: 100,
        displayCurrency: 'USD',
        exchangeRate: 1.0,
        rateLoading: false,
        minUSD: 25,
        maxUSD: 10000,
        disabled: false,
      },
    },
    aud: {
      name: 'AUD Currency',
      props: {
        amountUSD: 100,
        displayCurrency: 'AUD',
        exchangeRate: 1.55,
        rateLoading: false,
        minUSD: 25,
        maxUSD: 10000,
        disabled: false,
      },
    },
    euroLoading: {
      name: 'EUR (Loading Rate)',
      props: {
        amountUSD: 100,
        displayCurrency: 'EUR',
        exchangeRate: 0.92,
        rateLoading: true,
        minUSD: 25,
        maxUSD: 10000,
        disabled: false,
      },
      meta: { _loading: true },
    },
    atMinimum: {
      name: 'At Minimum Amount',
      props: {
        amountUSD: 25,
        displayCurrency: 'USD',
        exchangeRate: 1.0,
        rateLoading: false,
        minUSD: 25,
        maxUSD: 10000,
        disabled: false,
      },
    },
    atMaximum: {
      name: 'At Maximum Amount',
      props: {
        amountUSD: 10000,
        displayCurrency: 'USD',
        exchangeRate: 1.0,
        rateLoading: false,
        minUSD: 25,
        maxUSD: 10000,
        disabled: false,
      },
    },
    disabled: {
      name: 'Disabled',
      props: {
        amountUSD: 100,
        displayCurrency: 'GBP',
        exchangeRate: 0.79,
        rateLoading: false,
        minUSD: 25,
        maxUSD: 10000,
        disabled: true,
      },
    },
    jpyHighRate: {
      name: 'JPY (High Exchange Rate)',
      props: {
        amountUSD: 100,
        displayCurrency: 'JPY',
        exchangeRate: 110.5,
        rateLoading: false,
        minUSD: 25,
        maxUSD: 10000,
        disabled: false,
      },
    },
  },

  // Platform implementation status
  platforms: {
    'swift-ui': { status: 'planned' },
    'compose': { status: 'not-started' },
  },
});
