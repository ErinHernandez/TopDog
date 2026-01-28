/**
 * Location Consent Modal
 * 
 * Prompts user to enable location tracking with context-aware messaging.
 * Enterprise-grade UX with clear value proposition.
 */

import React, { useState } from 'react';
import { createScopedLogger } from '@/lib/clientLogger';
import { BG_COLORS, TEXT_COLORS, BORDER_COLORS, STATE_COLORS } from '@/components/vx2/core/constants/colors';

const logger = createScopedLogger('[LocationConsentModal]');
import { SPACING, RADIUS } from '@/components/vx2/core/constants/sizes';
import { useLocationConsent } from './hooks/useLocationConsent';
import type { ConsentModalContext } from '@/lib/location/types';
import { CONSENT_MODAL_CONFIGS } from '@/lib/location/types';

interface LocationConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: ConsentModalContext;
}

const BENEFITS = [
  {
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    text: 'Protect your drafts from unauthorized access',
  },
  {
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    text: 'Get alerts for suspicious login activity',
  },
  {
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    text: 'Unlock country & state flags for customization',
  },
];

export function LocationConsentModal({ 
  isOpen, 
  onClose, 
  context 
}: LocationConsentModalProps) {
  const { grantConsent, dismissPrompt } = useLocationConsent();
  const [rememberChoice, setRememberChoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const config = CONSENT_MODAL_CONFIGS[context];
  
  async function handleGrant() {
    setIsSubmitting(true);
    
    try {
      await grantConsent(rememberChoice);
      onClose();
    } catch (error) {
      logger.error('Failed to grant consent:', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsSubmitting(false);
    }
  }
  
  async function handleDeny() {
    setIsSubmitting(true);
    
    try {
      await dismissPrompt(rememberChoice);
      onClose();
    } catch (error) {
      logger.error('Failed to dismiss prompt:', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleDeny();
        }
      }}
    >
      <div 
        className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
        style={{ 
          backgroundColor: BG_COLORS.secondary,
          borderRadius: RADIUS.xl,
          border: `1px solid ${BORDER_COLORS.subtle}`,
        }}
      >
        {/* Header */}
        <div 
          style={{ 
            padding: SPACING.xl,
            paddingBottom: SPACING.lg,
            borderBottom: `1px solid ${BORDER_COLORS.light}`,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
            >
              <svg 
                width={24} 
                height={24} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#3B82F6" 
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div>
              <h2 
                className="text-lg font-bold"
                style={{ color: TEXT_COLORS.primary }}
              >
                {config.title}
              </h2>
              <p 
                className="text-sm"
                style={{ color: TEXT_COLORS.secondary }}
              >
                {config.subtitle}
              </p>
            </div>
          </div>
        </div>
        
        {/* Body */}
        <div style={{ padding: SPACING.xl }}>
          {/* Benefits list */}
          <div className="space-y-4">
            {BENEFITS.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div 
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: STATE_COLORS.success }}
                >
                  {benefit.icon}
                </div>
                <span 
                  className="text-sm"
                  style={{ color: TEXT_COLORS.primary }}
                >
                  {benefit.text}
                </span>
              </div>
            ))}
          </div>
          
          {/* Privacy note */}
          <p 
            className="text-xs mt-6 text-center"
            style={{ color: TEXT_COLORS.muted }}
          >
            We only track country/state level - never your precise location.
            <br />
            You can disable this anytime in Settings.
          </p>
          
          {/* Remember choice */}
          <label 
            className="flex items-center justify-center gap-2 mt-4 cursor-pointer select-none"
          >
            <input 
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: STATE_COLORS.info }}
            />
            <span 
              className="text-sm"
              style={{ color: TEXT_COLORS.secondary }}
            >
              Remember my choice
            </span>
          </label>
        </div>
        
        {/* Footer */}
        <div 
          className="flex gap-3"
          style={{ 
            padding: SPACING.xl,
            paddingTop: SPACING.lg,
            borderTop: `1px solid ${BORDER_COLORS.light}`,
          }}
        >
          <button
            onClick={handleDeny}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-lg font-medium transition-colors"
            style={{ 
              backgroundColor: BG_COLORS.tertiary,
              color: TEXT_COLORS.secondary,
              opacity: isSubmitting ? 0.5 : 1,
            }}
          >
            Not Now
          </button>
          <button
            onClick={handleGrant}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: STATE_COLORS.success,
              color: '#FFFFFF',
              opacity: isSubmitting ? 0.5 : 1,
            }}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            Enable
          </button>
        </div>
      </div>
    </div>
  );
}

export default LocationConsentModal;
