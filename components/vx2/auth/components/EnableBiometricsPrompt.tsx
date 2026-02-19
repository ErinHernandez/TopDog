/**
 * EnableBiometricsPrompt Component
 * 
 * Prompts users to enable Face ID / Touch ID for faster sign-in
 * Should be shown after successful sign-in if biometrics are available but not enabled
 */

import React, { useState, useCallback, useEffect } from 'react';

import { cn } from '@/lib/styles';

import {
  isPlatformAuthenticatorAvailable,
  isBiometricsEnabled,
  registerBiometric,
  getBiometricTypeName,
} from '../../../../lib/webauthn';

import authStyles from './auth-shared.module.css';
import styles from './EnableBiometricsPrompt.module.css';

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
    <div className={styles.backdrop}>
      <div className={styles.modalCard}>
        {/* Icon */}
        <div className={styles.headerSection}>
          <div className={styles.iconCircle}>
            <svg
              className={styles.iconSvg}
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
        <div className={styles.contentSection}>
          <h3 className={styles.title}>
            Enable {biometricType}?
          </h3>
          <p className={styles.description}>
            Sign in faster and more securely with {biometricType}. Your biometric data never leaves your device.
          </p>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className={styles.buttonsContainer}>
            <button
              onClick={handleEnable}
              disabled={isLoading}
              className={styles.enableButton}
            >
              {isLoading ? (
                <>
                  <div className={styles.spinner} />
                  Setting up...
                </>
              ) : (
                `Enable ${biometricType}`
              )}
            </button>

            <button
              onClick={onClose}
              disabled={isLoading}
              className={styles.cancelButton}
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

