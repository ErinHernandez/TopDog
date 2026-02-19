/**
 * PaymentMethodSelector Component
 *
 * Displays all available payment methods and allows users to select one.
 * Handles location-based availability and visual feedback for selection.
 *
 * Features:
 * - Location-aware method availability
 * - Visual selection indicator
 * - Icon display for each payment method
 * - Unavailable method opacity/disable state
 *
 * @component
 */

import React, { type JSX } from 'react';

import type { PaymentMethodId, PaymentMethodDetails } from '../../lib/paymentMethodConfig';

interface UserLocation {
  latitude?: number;
  longitude?: number;
  country: string;
  state?: string | null;
}

interface PaymentMethodSelectorProps {
  /**
   * All available payment methods to display
   */
  allMethods: PaymentMethodId[];

  /**
   * List of payment methods available in user's location
   */
  availableMethods: string[];

  /**
   * Currently selected payment method
   */
  selectedMethod: string;

  /**
   * User's location information
   */
  userLocation: UserLocation | null;

  /**
   * Callback when payment method is selected
   */
  onMethodSelect: (methodKey: string) => void;

  /**
   * Function to get payment method details
   */
  getMethodDetails: (methodKey: string) => PaymentMethodDetails & { type?: string };

  /**
   * Function to get payment method icon
   */
  getMethodIcon: (method: string) => JSX.Element;
}

export function PaymentMethodSelector({
  allMethods,
  availableMethods,
  selectedMethod,
  userLocation,
  onMethodSelect,
  getMethodDetails,
  getMethodIcon,
}: PaymentMethodSelectorProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-white">Payment Method</h2>

      {/* Show all payment methods for informational purposes */}
      <div className="space-y-3">
        {allMethods.map(methodKey => {
          const method = getMethodDetails(methodKey);
          const isSelected = selectedMethod === methodKey;
          const isAvailable = userLocation ? availableMethods.includes(methodKey) : true;

          return (
            <div
              key={methodKey}
              className={`bg-gray-800 rounded-lg p-4 border-2 cursor-pointer transition-all hover:shadow-lg ${
                isSelected
                  ? 'border-[#59c5bf] bg-[#59c5bf]/10 shadow-lg'
                  : 'border-gray-700 hover:border-gray-600 hover:bg-gray-750'
              } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => isAvailable && onMethodSelect(methodKey)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getMethodIcon(methodKey)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-white truncate">{method.name}</h3>
                    <p className="text-xs text-gray-400 capitalize">{(method.type || 'unknown').replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {isSelected && (
                    <div className="text-[#59c5bf]">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex justify-between text-xs">
              </div>

              {!isAvailable && userLocation && (
                <div className="mt-2 p-2 bg-gray-700 rounded text-xs text-gray-400">
                  Not available in your location ({userLocation.country})
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
