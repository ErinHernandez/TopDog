/**
 * EnableBiometricsPrompt Component
 * 
 * Prompts users to enable Face ID / Touch ID for faster sign-in
 * Should be shown after successful sign-in if biometrics are available but not enabled
 */

import React, { useState, useCallback, useEffect } from 'react';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';
import {
  isPlatformAuthenticatorAvailable,
  isBiometricsEnabled,
  registerBiometric,
  getBiometricTypeName,
} from '../../../../lib/webauthn';

export interface EnableBiometricsPromptProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userName: string;
  onEnabled?: () => void;
}

export function EnableBiometricsPrompt({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName,
  onEnabled,
}: EnableBiometricsPromptProps): React.ReactElement | null {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricType, setBiometricType] = useState('Biometrics');
  const [shouldShow, setShouldShow] = useState(false);

  // Check if we should show the prompt
  useEffect(() => {
    async function check() {
      const available = await isPlatformAuthenticatorAvailable();
      const alreadyEnabled = isBiometricsEnabled(userId);
      setShouldShow(available && !alreadyEnabled);
      if (available) {
        setBiometricType(getBiometricTypeName());
      }
    }
    if (isOpen && userId) {
      check();
    }
  }, [isOpen, userId]);

  const handleEnable = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await registerBiometric(userId, userEmail, userName);

      if (result.success) {
        onEnabled?.();
        onClose();
      } else {
        setError(result.error || 'Failed to enable biometrics');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [userId, userEmail, userName, onEnabled, onClose]);

  if (!isOpen || !shouldShow) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999 }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ backgroundColor: BG_COLORS.secondary }}
      >
        {/* Icon */}
        <div
          className="flex justify-center pt-8 pb-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover' }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#000"
              strokeWidth="1.5"
            >
              <path d="M7 3H5C3.89543 3 3 3.89543 3 5V7" strokeLinecap="round" />
              <path d="M17 3H19C20.1046 3 21 3.89543 21 5V7" strokeLinecap="round" />
              <path d="M7 21H5C3.89543 21 3 20.1046 3 19V17" strokeLinecap="round" />
              <path d="M17 21H19C20.1046 21 21 20.1046 21 19V17" strokeLinecap="round" />
              <circle cx="9" cy="10" r="1" fill="#000" />
              <circle cx="15" cy="10" r="1" fill="#000" />
              <path d="M9 15C9 15 10.5 17 12 17C13.5 17 15 15 15 15" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h3
            className="font-bold mb-2"
            style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.xl}px` }}
          >
            Enable {biometricType}?
          </h3>
          <p
            className="mb-6"
            style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
          >
            Sign in faster and more securely with {biometricType}. Your biometric data never leaves your device.
          </p>

          {error && (
            <div
              className="mb-4 p-3 rounded-lg"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: STATE_COLORS.error,
                fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
              }}
            >
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleEnable}
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              style={{
                background: 'url(/wr_blue.png) no-repeat center center',
                backgroundSize: 'cover',
                color: '#000',
                fontSize: `${TYPOGRAPHY.fontSize.base}px`,
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              {isLoading ? (
                <>
                  <div
                    className="animate-spin rounded-full h-5 w-5 border-2"
                    style={{ borderColor: '#000 transparent transparent transparent' }}
                  />
                  Setting up...
                </>
              ) : (
                `Enable ${biometricType}`
              )}
            </button>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-medium transition-all"
              style={{
                backgroundColor: 'transparent',
                color: TEXT_COLORS.secondary,
                fontSize: `${TYPOGRAPHY.fontSize.base}px`,
              }}
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnableBiometricsPrompt;

