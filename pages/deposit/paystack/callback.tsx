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

import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { formatPaystackAmount } from '../../../lib/paystack/currencyConfig';

import styles from './callback.module.css';

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

      <div className={styles.pageContainer}>
        <div className={styles.card}>
          {isVerifying ? (
            <>
              <div className={styles.spinner} />
              <h1 className={`${styles.title} ${styles.titleDefault}`}>
                Verifying Payment
              </h1>
              <p className={styles.message}>
                Please wait while we confirm your payment...
              </p>
            </>
          ) : error ? (
            <>
              <div className={`${styles.iconContainer} ${styles.iconContainerError}`}>
                <svg
                  className={`${styles.icon} ${styles.iconError}`}
                  viewBox="0 0 24 24"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className={`${styles.title} ${styles.titleError}`}>
                Verification Failed
              </h1>
              <p className={styles.message}>{error}</p>
              <button
                onClick={handleTryAgain}
                className={styles.buttonPrimary}
              >
                Try Again
              </button>
            </>
          ) : result?.status === 'success' ? (
            <>
              <div className={`${styles.iconContainer} ${styles.iconContainerSuccess}`}>
                <svg
                  className={`${styles.icon} ${styles.iconSuccess}`}
                  viewBox="0 0 24 24"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className={`${styles.title} ${styles.titleSuccess}`}>
                Payment Successful!
              </h1>
              <p className={styles.subtitle}>
                {result.amountFormatted} has been added to your balance
              </p>
              <p className={styles.reference}>Reference: {result.reference}</p>
              <button
                onClick={handleGoHome}
                className={styles.buttonPrimary}
              >
                Continue to TopDog
              </button>
            </>
          ) : result?.status === 'pending' || result?.status === 'processing' ? (
            <>
              <div className={`${styles.iconContainer} ${styles.iconContainerWarning}`}>
                <svg
                  className={`${styles.icon} ${styles.iconWarning}`}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className={`${styles.title} ${styles.titleWarning}`}>
                Payment Pending
              </h1>
              <p className={styles.subtitle}>
                Your payment of {result.amountFormatted} is being processed
              </p>
              <p className={styles.message}>
                {result.status === 'processing'
                  ? 'Please complete the payment on your phone or bank app'
                  : 'This may take a few moments. Your balance will be updated once confirmed.'}
              </p>
              <button
                onClick={handleGoHome}
                className={styles.buttonPrimary}
              >
                Continue to TopDog
              </button>
            </>
          ) : (
            <>
              <div className={`${styles.iconContainer} ${styles.iconContainerError}`}>
                <svg
                  className={`${styles.icon} ${styles.iconError}`}
                  viewBox="0 0 24 24"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className={`${styles.title} ${styles.titleError}`}>
                Payment Failed
              </h1>
              <p className={styles.subtitle}>
                {result?.gatewayResponse || 'The payment could not be completed'}
              </p>
              <p className={styles.reference}>Reference: {result?.reference}</p>
              <div className={styles.buttonGroup}>
                <button
                  onClick={handleTryAgain}
                  className={styles.buttonPrimary}
                >
                  Try Again
                </button>
                <button
                  onClick={handleGoHome}
                  className={styles.buttonSecondary}
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

