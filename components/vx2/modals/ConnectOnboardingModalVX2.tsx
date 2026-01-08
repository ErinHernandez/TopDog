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
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY, Z_INDEX } from '../core/constants/sizes';
import { Close } from '../components/icons';
import { createScopedLogger } from '../../../lib/clientLogger';

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
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke={STATE_COLORS.active}>
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
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: `${STATE_COLORS.active}20` }}
        >
          <BankIcon />
        </div>
        <h3 
          className="font-semibold mb-2"
          style={{ fontSize: `${TYPOGRAPHY.fontSize.xl}px`, color: TEXT_COLORS.primary }}
        >
          Set Up Withdrawals
        </h3>
        <p style={{ color: TEXT_COLORS.secondary }}>
          Connect your bank account to receive payouts securely
        </p>
      </div>
      
      <div className="space-y-3">
        <div 
          className="flex items-start gap-3 p-3 rounded-lg"
          style={{ backgroundColor: BG_COLORS.tertiary }}
        >
          <div style={{ color: STATE_COLORS.success }}>
            <ShieldIcon />
          </div>
          <div>
            <p className="font-medium" style={{ color: TEXT_COLORS.primary }}>
              Secure & Private
            </p>
            <p style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.muted }}>
              Bank details are encrypted and stored by Stripe
            </p>
          </div>
        </div>
        
        <div 
          className="flex items-start gap-3 p-3 rounded-lg"
          style={{ backgroundColor: BG_COLORS.tertiary }}
        >
          <div style={{ color: STATE_COLORS.active }}>
            <ClockIcon />
          </div>
          <div>
            <p className="font-medium" style={{ color: TEXT_COLORS.primary }}>
              Fast Payouts
            </p>
            <p style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.muted }}>
              Receive funds within 1-2 business days
            </p>
          </div>
        </div>
        
        <div 
          className="flex items-start gap-3 p-3 rounded-lg"
          style={{ backgroundColor: BG_COLORS.tertiary }}
        >
          <div style={{ color: STATE_COLORS.warning }}>
            <LockIcon />
          </div>
          <div>
            <p className="font-medium" style={{ color: TEXT_COLORS.primary }}>
              One-Time Setup
            </p>
            <p style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.muted }}>
              Complete verification once, withdraw anytime
            </p>
          </div>
        </div>
      </div>
      
      <button
        onClick={onContinue}
        className="w-full py-3 rounded-lg font-semibold"
        style={{ backgroundColor: STATE_COLORS.active, color: '#000' }}
      >
        Get Started
      </button>
      
      <p 
        className="text-center"
        style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted }}
      >
        Powered by Stripe Connect. Takes about 5 minutes.
      </p>
    </div>
  );
}

function LoadingStep({ message }: { message: string }): React.ReactElement {
  return (
    <div className="text-center py-12 space-y-4">
      <div className="w-12 h-12 mx-auto">
        <span className="animate-spin block w-12 h-12 border-3 border-white/30 border-t-white rounded-full" 
          style={{ borderWidth: '3px' }} />
      </div>
      <p style={{ color: TEXT_COLORS.primary }}>{message}</p>
    </div>
  );
}

function OnboardingStep({ onboardingUrl }: { onboardingUrl: string }): React.ReactElement {
  const handleOpenOnboarding = () => {
    window.open(onboardingUrl, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <div className="text-center space-y-6 py-4">
      <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
        style={{ backgroundColor: `${STATE_COLORS.active}20` }}
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={STATE_COLORS.active}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
      
      <div>
        <h3 
          className="font-semibold mb-2"
          style={{ fontSize: `${TYPOGRAPHY.fontSize.lg}px`, color: TEXT_COLORS.primary }}
        >
          Complete Verification
        </h3>
        <p style={{ color: TEXT_COLORS.secondary }}>
          Click below to open Stripe's secure verification portal
        </p>
      </div>
      
      <button
        onClick={handleOpenOnboarding}
        className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
        style={{ backgroundColor: STATE_COLORS.active, color: '#000' }}
      >
        Open Verification Portal
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
      
      <div 
        className="p-4 rounded-lg"
        style={{ backgroundColor: BG_COLORS.tertiary }}
      >
        <p style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.muted }}>
          After completing verification in the new tab, return here. 
          We'll automatically detect when you're done.
        </p>
      </div>
    </div>
  );
}

function CompleteStep({ onClose }: { onClose: () => void }): React.ReactElement {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
        style={{ backgroundColor: `${STATE_COLORS.success}20` }}
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={STATE_COLORS.success}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div>
        <h3 
          className="font-semibold mb-2"
          style={{ fontSize: `${TYPOGRAPHY.fontSize.xl}px`, color: STATE_COLORS.success }}
        >
          All Set!
        </h3>
        <p style={{ color: TEXT_COLORS.secondary }}>
          Your payout account is ready. You can now withdraw your winnings.
        </p>
      </div>
      
      <button
        onClick={onClose}
        className="w-full py-3 rounded-lg font-semibold"
        style={{ backgroundColor: STATE_COLORS.active, color: '#000' }}
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
    <div className="text-center space-y-6 py-8">
      <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
        style={{ backgroundColor: `${STATE_COLORS.error}20` }}
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={STATE_COLORS.error}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      
      <div>
        <h3 
          className="font-semibold mb-2"
          style={{ fontSize: `${TYPOGRAPHY.fontSize.lg}px`, color: STATE_COLORS.error }}
        >
          Something went wrong
        </h3>
        <p style={{ color: TEXT_COLORS.secondary }}>{message}</p>
      </div>
      
      <button
        onClick={onRetry}
        className="w-full py-3 rounded-lg font-semibold"
        style={{ backgroundColor: STATE_COLORS.active, color: '#000' }}
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
  }, [isOpen, userId]);
  
  const checkAccountStatus = async () => {
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
  };
  
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
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: Z_INDEX.modal }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-xl overflow-hidden"
        style={{ backgroundColor: BG_COLORS.secondary }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: BORDER_COLORS.default }}
        >
          <h2 
            className="font-semibold"
            style={{ fontSize: `${TYPOGRAPHY.fontSize.lg}px`, color: TEXT_COLORS.primary }}
          >
            Payout Setup
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-white/10"
          >
            <span style={{ color: TEXT_COLORS.muted, display: 'inline-block' }}>
              <Close className="w-5 h-5" />
            </span>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {step === 'intro' && (
            <IntroStep onContinue={createAccount} />
          )}
          
          {step === 'creating' && (
            <LoadingStep message="Setting up your payout account..." />
          )}
          
          {step === 'onboarding' && accountStatus?.onboardingUrl && (
            <OnboardingStep onboardingUrl={accountStatus.onboardingUrl} />
          )}
          
          {step === 'polling' && (
            <LoadingStep message="Checking verification status..." />
          )}
          
          {step === 'complete' && (
            <CompleteStep onClose={handleClose} />
          )}
          
          {step === 'error' && (
            <ErrorStep 
              message={error || 'An unexpected error occurred'} 
              onRetry={handleRetry} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ConnectOnboardingModalVX2;

