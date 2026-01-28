/**
 * PayPal Button Component
 *
 * Renders PayPal checkout button for deposits
 * Uses @paypal/react-paypal-js for the official PayPal integration
 */

import React, { useState, useCallback } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { PAYPAL_DEPOSIT_LIMITS } from '../../lib/paypal/paypalTypes';

interface PayPalButtonProps {
  amountCents: number;
  onSuccess: (details: PayPalCaptureDetails) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export interface PayPalCaptureDetails {
  success: boolean;
  captureId?: string;
  amountCents?: number;
  newBalance?: number;
  transactionId?: string;
  error?: string;
}

export function PayPalButton({
  amountCents,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
}: PayPalButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Get client ID from environment
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // All hooks must be called unconditionally at the top level
  // Create order handler
  const createOrder = useCallback(async (): Promise<string> => {
    setIsProcessing(true);

    try {
      const response = await fetch('/api/paypal/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amountCents,
          riskContext: {
            // Add any client-side risk context here
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create PayPal order');
      }

      return data.orderId;
    } catch (error) {
      setIsProcessing(false);
      onError(error as Error);
      throw error;
    }
  }, [amountCents, onError]);

  // Approve handler
  const onApprove = useCallback(
    async (data: { orderID: string }): Promise<void> => {
      try {
        const response = await fetch(`/api/paypal/orders/${data.orderID}/capture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (result.success) {
          onSuccess(result);
        } else {
          onError(new Error(result.error || 'Payment capture failed'));
        }
      } catch (error) {
        onError(error as Error);
      } finally {
        setIsProcessing(false);
      }
    },
    [onSuccess, onError]
  );

  // Error handler
  const onPayPalError = useCallback(
    (err: Record<string, unknown>) => {
      setIsProcessing(false);
      // Note: Raw PayPal error objects are not logged to prevent potential data leakage
      // Error details are safely passed to the onError callback for proper handling
      onError(new Error('PayPal encountered an error. Please try again.'));
    },
    [onError]
  );

  // Cancel handler
  const onPayPalCancel = useCallback(() => {
    setIsProcessing(false);
    onCancel();
  }, [onCancel]);

  // Validation checks - after all hooks are called
  // Validate client ID
  if (!clientId) {
    return (
      <div className="text-red-500 text-sm p-4 bg-red-50 rounded-lg">
        PayPal is not configured. Please contact support.
      </div>
    );
  }

  // Validate amount - minimum
  if (amountCents < PAYPAL_DEPOSIT_LIMITS.minAmountCents) {
    return (
      <div className="text-amber-600 text-sm p-4 bg-amber-50 rounded-lg">
        Minimum deposit is ${PAYPAL_DEPOSIT_LIMITS.minAmountCents / 100} (cost of one draft entry)
      </div>
    );
  }

  // Validate amount - maximum
  if (amountCents > PAYPAL_DEPOSIT_LIMITS.maxAmountCents) {
    return (
      <div className="text-amber-600 text-sm p-4 bg-amber-50 rounded-lg">
        Maximum deposit is ${PAYPAL_DEPOSIT_LIMITS.maxAmountCents / 100} (150 drafts)
      </div>
    );
  }

  return (
    <div className={`paypal-button-container ${disabled || isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
      <PayPalScriptProvider
        options={{
          clientId,
          currency: 'USD',
          intent: 'capture',
        }}
      >
        <PayPalButtons
          style={{
            layout: 'vertical',
            shape: 'rect',
            color: 'gold',
            label: 'paypal',
          }}
          disabled={disabled || isProcessing}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onPayPalError}
          onCancel={onPayPalCancel}
        />
      </PayPalScriptProvider>

      {isProcessing && (
        <div className="text-center text-sm text-gray-500 mt-2">
          Processing payment...
        </div>
      )}
    </div>
  );
}

export default PayPalButton;
