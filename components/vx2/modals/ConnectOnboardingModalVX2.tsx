/**
 * ConnectOnboardingModalVX2 - Stripe Connect Setup
 * 
 * Handles the Stripe Connect Express onboarding flow:
 * - Explains what Connect is and why it's needed
 * - Creates/retrieves Connect account
 * - Opens Stripe-hosted onboarding in new tab
 * - Polls for completion status
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../lib/clientLogger';
import { Close } from '../components/icons';

import styles from './ConnectOnboardingModalVX2.module.css';

const logger = createScopedLogger('[ConnectOnboarding]');

// ============================================================================
// TYPES
// ============================================================================

export interface ConnectOnboardingModalVX2Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onComplete?: () => void;
}

interface ConnectAccountStatus {
  hasAccount: boolean;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  onboardingComplete?: boolean;
  onboardingUrl?: string;
}

type OnboardingStep = 'intro' | 'creating' | 'onboarding' | 'polling' | 'complete' | 'error';

// ============================================================================
// CONSTANTS
// ============================================================================

const POLL_INTERVAL = 3000; // 3 seconds
const MAX_POLL_ATTEMPTS = 60; // 3 minutes max

// ============================================================================
// ICONS
// ============================================================================

function BankIcon(): React.ReactElement {
  return (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" color="var(--color-state-active)">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  );
}

function ShieldIcon(): React.ReactElement {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function ClockIcon(): React.ReactElement {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LockIcon(): React.ReactElement {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function IntroStep({ onContinue }: { onContinue: () => void }): React.ReactElement {
  return (
    <div className={styles.introContainer}>
      <div className={styles.centerSection}>
        <div className={styles.iconCircle}>
          <BankIcon />
        </div>
        <h3 className={cn(styles.introTitle)}>
          Set Up Withdrawals
        </h3>
        <p className={styles.textSecondary}>
          Connect your bank account to receive payouts securely
        </p>
      </div>

      <div className={styles.featuresList}>
        <div className={styles.featureItem}>
          <div className={styles.featureIcon}>
            <ShieldIcon />
          </div>
          <div className={styles.featureContent}>
            <p className={cn(styles.featureTitle)}>
              Secure & Private
            </p>
            <p className={cn(styles.featureDescription)}>
              Bank details are encrypted and stored by Stripe
            </p>
          </div>
        </div>

        <div className={styles.featureItem}>
          <div className={styles.featureIcon}>
            <ClockIcon />
          </div>
          <div className={styles.featureContent}>
            <p className={cn(styles.featureTitle)}>
              Fast Payouts
            </p>
            <p className={cn(styles.featureDescription)}>
              Receive funds within 1-2 business days
            </p>
          </div>
        </div>

        <div className={styles.featureItem}>
          <div className={styles.featureIcon}>
            <LockIcon />
          </div>
          <div className={styles.featureContent}>
            <p className={cn(styles.featureTitle)}>
              One-Time Setup
            </p>
            <p className={cn(styles.featureDescription)}>
              Complete verification once, withdraw anytime
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onContinue}
        className={styles.primaryButton}
      >
        Get Started
      </button>

      <p className={cn(styles.footer)}>
        Powered by Stripe Connect. Takes about 5 minutes.
      </p>
    </div>
  );
}

function LoadingStep({ message }: { message: string }): React.ReactElement {
  return (
    <div className={styles.loadingContainer}>
      <span className={styles.spinner} />
      <p className={styles.loadingMessage}>
        {message}
      </p>
    </div>
  );
}

function OnboardingStep({ onboardingUrl }: { onboardingUrl: string }): React.ReactElement {
  const handleOpenOnboarding = () => {
    window.open(onboardingUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.onboardingContainer}>
      <div className={styles.onboardingIconCircle}>
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" color="var(--color-state-active)">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </div>

      <div>
        <h3 className={cn(styles.onboardingTitle)}>
          Complete Verification
        </h3>
        <p className={styles.textSecondary}>
          Click below to open Stripe&apos;s secure verification portal
        </p>
      </div>

      <button
        onClick={handleOpenOnboarding}
        className={styles.openPortalButton}
      >
        Open Verification Portal
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>

      <div className={styles.infoBox}>
        <p className={cn(styles.infoBoxText)}>
          After completing verification in the new tab, return here. We&apos;ll automatically detect when you&apos;re done.
        </p>
      </div>
    </div>
  );
}

function CompleteStep({ onClose }: { onClose: () => void }): React.ReactElement {
  return (
    <div className={styles.completeContainer}>
      <div className={styles.successIconCircle}>
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" color="var(--color-state-success)">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h3 className={cn(styles.successTitle)}>
          All Set!
        </h3>
        <p className={styles.textSecondary}>
          Your payout account is ready. You can now withdraw your winnings.
        </p>
      </div>

      <button
        onClick={onClose}
        className={styles.continueButton}
      >
        Continue to Withdraw
      </button>
    </div>
  );
}

function ErrorStep({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}): React.ReactElement {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorIconCircle}>
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" color="var(--color-state-error)">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <div>
        <h3 className={cn(styles.errorTitle)}>
          Something went wrong
        </h3>
        <p className={styles.errorMessage}>{message}</p>
      </div>

      <button
        onClick={onRetry}
        className={styles.retryButton}
      >
        Try Again
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConnectOnboardingModalVX2({
  isOpen,
  onClose,
  userId,
  userEmail,
  onComplete,
}: ConnectOnboardingModalVX2Props): React.ReactElement | null {
  const [step, setStep] = useState<OnboardingStep>('intro');
  const [accountStatus, setAccountStatus] = useState<ConnectAccountStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollCountRef = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkAccountStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/stripe/connect/account?userId=${userId}`);
      const data = await response.json();

      if (data.success && data.data) {
        setAccountStatus(data.data);

        if (data.data.onboardingComplete) {
          setStep('complete');
        } else if (data.data.onboardingUrl) {
          setStep('onboarding');
        }
      }
    } catch (err) {
      logger.error('Failed to check account status', err);
    }
  }, [userId]);

  // Check existing account status on mount
  useEffect(() => {
    if (isOpen && userId) {
      checkAccountStatus();
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen, userId, checkAccountStatus]);
  
  const createAccount = async () => {
    setStep('creating');
    setError(null);
    
    try {
      const response = await fetch('/api/stripe/connect/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: userEmail }),
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setAccountStatus(data.data);
        
        if (data.data.onboardingComplete) {
          setStep('complete');
        } else if (data.data.onboardingUrl) {
          setStep('onboarding');
          startPolling();
        } else {
          throw new Error('No onboarding URL received');
        }
      } else {
        throw new Error(data.error || 'Failed to create account');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
      setStep('error');
    }
  };
  
  const startPolling = useCallback(() => {
    pollCountRef.current = 0;
    
    pollIntervalRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      
      if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        return;
      }
      
      try {
        const response = await fetch(`/api/stripe/connect/account?userId=${userId}`);
        const data = await response.json();
        
        if (data.success && data.data?.onboardingComplete) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          setStep('complete');
          onComplete?.();
        }
      } catch (err) {
        // Silent fail, keep polling
      }
    }, POLL_INTERVAL);
  }, [userId, onComplete]);
  
  const handleRetry = () => {
    setStep('intro');
    setError(null);
  };
  
  const handleClose = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div
      className={styles.modalOverlay}
    >
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={cn(styles.headerTitle)}>
            Payout Setup
          </h2>
          <button
            onClick={handleClose}
            className={styles.closeButton}
          >
            <span className={styles.closeIcon}>
              <Close className="w-5 h-5" />
            </span>
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {step === 'intro' && <IntroStep onContinue={createAccount} />}

          {step === 'creating' && <LoadingStep message="Setting up your payout account..." />}

          {step === 'onboarding' && accountStatus?.onboardingUrl && (
            <OnboardingStep onboardingUrl={accountStatus.onboardingUrl} />
          )}

          {step === 'polling' && <LoadingStep message="Checking verification status..." />}

          {step === 'complete' && <CompleteStep onClose={handleClose} />}

          {step === 'error' && (
            <ErrorStep message={error || 'An unexpected error occurred'} onRetry={handleRetry} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ConnectOnboardingModalVX2;

