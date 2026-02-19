/**
 * Location Security Banner
 *
 * Displays security warnings for new/suspicious locations.
 * Shows contextual messages and actions.
 *
 * Migrated to Zero-Runtime CSS for CSP compliance.
 */

import type { SecurityCheck } from '@/lib/location/types';

import styles from './LocationSecurityBanner.module.css';

interface LocationSecurityBannerProps {
  securityCheck: SecurityCheck;
  locationName?: string;
  onDismiss?: () => void;
  onTrustLocation?: () => void;
  onVerify?: () => void;
}

type BannerSeverity = 'error' | 'warning' | 'info';

interface BannerConfig {
  severity: BannerSeverity;
  title: string;
  message: string;
}

export function LocationSecurityBanner({
  securityCheck,
  locationName,
  onDismiss,
  onTrustLocation,
  onVerify,
}: LocationSecurityBannerProps) {
  // Don't show if everything is fine
  if (securityCheck.action === 'allow' && !securityCheck.isNewLocation) {
    return null;
  }

  // Determine banner style based on severity
  const getBannerConfig = (): BannerConfig | null => {
    if (securityCheck.action === 'block') {
      return {
        severity: 'error',
        title: 'Access Blocked',
        message: 'Suspicious activity detected from this location. Please contact support.',
      };
    }

    if (securityCheck.action === 'verify') {
      return {
        severity: 'warning',
        title: 'Verification Required',
        message: 'Please verify your identity to continue from this new location.',
      };
    }

    if (securityCheck.action === 'warn' || securityCheck.isNewLocation) {
      return {
        severity: 'info',
        title: 'New Location Detected',
        message: locationName
          ? `You're accessing from ${locationName}. Mark as trusted?`
          : 'You\'re accessing from a new location.',
      };
    }

    return null;
  };

  const bannerConfig = getBannerConfig();
  if (!bannerConfig) return null;

  return (
    <div
      className={styles.container}
      data-severity={bannerConfig.severity}
    >
      {/* Dismiss button */}
      {onDismiss && securityCheck.action !== 'block' && (
        <button
          onClick={onDismiss}
          className={styles.dismissButton}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      <div className={styles.contentWrapper}>
        {/* Icon */}
        <div className={styles.iconContainer}>
          {securityCheck.action === 'block' ? (
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          ) : securityCheck.action === 'verify' ? (
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h4 className={styles.title}>
            {bannerConfig.title}
          </h4>
          <p className={styles.message}>
            {bannerConfig.message}
          </p>

          {/* Actions */}
          {(onTrustLocation || onVerify) && securityCheck.action !== 'block' && (
            <div className={styles.actions}>
              {onTrustLocation && securityCheck.isNewLocation && (
                <button
                  onClick={onTrustLocation}
                  className={styles.actionButton}
                  data-action="trust"
                >
                  Trust This Location
                </button>
              )}
              {onVerify && securityCheck.action === 'verify' && (
                <button
                  onClick={onVerify}
                  className={styles.actionButton}
                  data-action="verify"
                >
                  Verify Identity
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LocationSecurityBanner;
