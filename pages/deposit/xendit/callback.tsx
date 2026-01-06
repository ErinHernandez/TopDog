/**
 * Xendit Callback Page
 * 
 * Handles redirect from Xendit after e-wallet payment.
 * Verifies payment status and updates UI accordingly.
 * 
 * @module pages/deposit/xendit/callback
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// ============================================================================
// TYPES
// ============================================================================

type CallbackStatus = 'loading' | 'success' | 'failed' | 'error';

// ============================================================================
// COMPONENT
// ============================================================================

export default function XenditCallback(): React.ReactElement {
  const router = useRouter();
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [message, setMessage] = useState('Verifying your payment...');
  
  useEffect(() => {
    const { status: urlStatus } = router.query;
    
    if (!router.isReady) return;
    
    // Handle based on URL status
    if (urlStatus === 'success') {
      setStatus('success');
      setMessage('Payment successful! Redirecting to your wallet...');
      
      // Redirect to wallet after a short delay
      setTimeout(() => {
        router.push('/wallet?deposit=success');
      }, 2000);
      
    } else if (urlStatus === 'failed') {
      setStatus('failed');
      setMessage('Payment was not completed. Please try again.');
    } else {
      setStatus('error');
      setMessage('Invalid callback. Please contact support if you believe this is an error.');
    }
  }, [router.isReady, router.query]);
  
  const handleRetry = () => {
    router.push('/deposit');
  };
  
  const handleGoToWallet = () => {
    router.push('/wallet');
  };
  
  return (
    <>
      <Head>
        <title>Payment Status | TopDog</title>
      </Head>
      
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#101927] rounded-2xl p-8 text-center">
          {/* Status Icon */}
          <div className="mb-6">
            {status === 'loading' && <LoadingIcon />}
            {status === 'success' && <SuccessIcon />}
            {status === 'failed' && <FailedIcon />}
            {status === 'error' && <ErrorIcon />}
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2">
            {status === 'loading' && 'Processing Payment'}
            {status === 'success' && 'Payment Successful'}
            {status === 'failed' && 'Payment Failed'}
            {status === 'error' && 'Something Went Wrong'}
          </h1>
          
          {/* Message */}
          <p className="text-gray-400 mb-8">{message}</p>
          
          {/* Actions */}
          <div className="space-y-3">
            {status === 'failed' && (
              <button
                onClick={handleRetry}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
            )}
            
            {(status === 'failed' || status === 'error') && (
              <button
                onClick={handleGoToWallet}
                className="w-full py-3 px-6 bg-[#1a2537] hover:bg-[#243044] text-white font-medium rounded-lg transition-colors"
              >
                Go to Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// ICONS
// ============================================================================

function LoadingIcon(): React.ReactElement {
  return (
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-600/20">
      <svg className="animate-spin w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle 
          className="opacity-25" 
          cx="12" cy="12" r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

function SuccessIcon(): React.ReactElement {
  return (
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-600/20">
      <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function FailedIcon(): React.ReactElement {
  return (
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-600/20">
      <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
}

function ErrorIcon(): React.ReactElement {
  return (
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-600/20">
      <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
  );
}


