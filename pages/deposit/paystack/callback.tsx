/**
 * Paystack Payment Callback Page
 * 
 * Handles redirect from Paystack after payment completion.
 * Verifies the transaction and shows success/failure state.
 * 
 * Query Parameters:
 * - reference: Paystack transaction reference
 * - trxref: Alternative reference parameter (Paystack Inline)
 * 
 * @module pages/deposit/paystack/callback
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS } from '../../../components/vx2/core/constants/colors';
import { TYPOGRAPHY } from '../../../components/vx2/core/constants/sizes';
import { formatPaystackAmount } from '../../../lib/paystack/currencyConfig';

// ============================================================================
// TYPES
// ============================================================================

interface VerificationResult {
  status: 'success' | 'failed' | 'pending' | 'processing';
  reference: string;
  amountSmallestUnit: number;
  currency: string;
  amountFormatted: string;
  transactionId?: string;
  gatewayResponse?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function PaystackCallbackPage(): React.ReactElement {
  const router = useRouter();
  const { reference, trxref } = router.query;
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Verify transaction on mount
  useEffect(() => {
    const ref = reference || trxref;
    if (!ref || typeof ref !== 'string') return;
    
    verifyTransaction(ref);
  }, [reference, trxref]);
  
  const verifyTransaction = async (ref: string) => {
    setIsVerifying(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(ref)}`);
      const data = await response.json();
      
      if (data.ok && data.data) {
        setResult(data.data);
      } else {
        setError(data.error?.message || 'Failed to verify payment');
      }
    } catch (err) {
      setError('Network error - please check your connection');
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleGoHome = () => {
    router.push('/');
  };
  
  const handleTryAgain = () => {
    router.push('/deposit');
  };
  
  return (
    <>
      <Head>
        <title>Payment {result?.status === 'success' ? 'Successful' : 'Processing'} | TopDog</title>
      </Head>
      
      <div 
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: BG_COLORS.primary }}
      >
        <div 
          className="w-full max-w-md rounded-2xl p-8 text-center"
          style={{ backgroundColor: BG_COLORS.secondary }}
        >
          {isVerifying ? (
            <>
              <div className="animate-spin w-16 h-16 border-4 border-white/20 border-t-white rounded-full mx-auto mb-6" />
              <h1 
                className="font-bold mb-2"
                style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.xl}px` }}
              >
                Verifying Payment
              </h1>
              <p style={{ color: TEXT_COLORS.secondary }}>
                Please wait while we confirm your payment...
              </p>
            </>
          ) : error ? (
            <>
              <div 
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6"
                style={{ backgroundColor: `${STATE_COLORS.error}20` }}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={STATE_COLORS.error}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 
                className="font-bold mb-2"
                style={{ color: STATE_COLORS.error, fontSize: `${TYPOGRAPHY.fontSize.xl}px` }}
              >
                Verification Failed
              </h1>
              <p className="mb-6" style={{ color: TEXT_COLORS.secondary }}>
                {error}
              </p>
              <button
                onClick={handleTryAgain}
                className="w-full py-3 rounded-xl font-semibold"
                style={{ backgroundColor: STATE_COLORS.active, color: '#000' }}
              >
                Try Again
              </button>
            </>
          ) : result?.status === 'success' ? (
            <>
              <div 
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6"
                style={{ backgroundColor: `${STATE_COLORS.success}20` }}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={STATE_COLORS.success}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 
                className="font-bold mb-2"
                style={{ color: STATE_COLORS.success, fontSize: `${TYPOGRAPHY.fontSize.xl}px` }}
              >
                Payment Successful!
              </h1>
              <p className="mb-2" style={{ color: TEXT_COLORS.secondary }}>
                {result.amountFormatted} has been added to your balance
              </p>
              <p 
                className="mb-6"
                style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}
              >
                Reference: {result.reference}
              </p>
              <button
                onClick={handleGoHome}
                className="w-full py-3 rounded-xl font-semibold"
                style={{ backgroundColor: STATE_COLORS.active, color: '#000' }}
              >
                Continue to TopDog
              </button>
            </>
          ) : result?.status === 'pending' || result?.status === 'processing' ? (
            <>
              <div 
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6"
                style={{ backgroundColor: `${STATE_COLORS.warning}20` }}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={STATE_COLORS.warning}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 
                className="font-bold mb-2"
                style={{ color: STATE_COLORS.warning, fontSize: `${TYPOGRAPHY.fontSize.xl}px` }}
              >
                Payment Pending
              </h1>
              <p className="mb-2" style={{ color: TEXT_COLORS.secondary }}>
                Your payment of {result.amountFormatted} is being processed
              </p>
              <p 
                className="mb-6"
                style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
              >
                {result.status === 'processing' 
                  ? 'Please complete the payment on your phone or bank app'
                  : 'This may take a few moments. Your balance will be updated once confirmed.'
                }
              </p>
              <button
                onClick={handleGoHome}
                className="w-full py-3 rounded-xl font-semibold"
                style={{ backgroundColor: STATE_COLORS.active, color: '#000' }}
              >
                Continue to TopDog
              </button>
            </>
          ) : (
            <>
              <div 
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6"
                style={{ backgroundColor: `${STATE_COLORS.error}20` }}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={STATE_COLORS.error}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 
                className="font-bold mb-2"
                style={{ color: STATE_COLORS.error, fontSize: `${TYPOGRAPHY.fontSize.xl}px` }}
              >
                Payment Failed
              </h1>
              <p className="mb-2" style={{ color: TEXT_COLORS.secondary }}>
                {result?.gatewayResponse || 'The payment could not be completed'}
              </p>
              <p 
                className="mb-6"
                style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}
              >
                Reference: {result?.reference}
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleTryAgain}
                  className="w-full py-3 rounded-xl font-semibold"
                  style={{ backgroundColor: STATE_COLORS.active, color: '#000' }}
                >
                  Try Again
                </button>
                <button
                  onClick={handleGoHome}
                  className="w-full py-3 rounded-xl font-semibold"
                  style={{ 
                    backgroundColor: 'transparent', 
                    color: TEXT_COLORS.secondary,
                    border: `1px solid ${TEXT_COLORS.muted}`,
                  }}
                >
                  Go Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

