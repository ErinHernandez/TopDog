/**
 * Location Security Banner
 *
 * Displays security warnings for new/suspicious locations.
 * Shows contextual messages and actions.
 */

import { BG_COLORS, TEXT_COLORS, STATE_COLORS } from '@/components/vx2/core/constants/colors';
import { SPACING, RADIUS } from '@/components/vx2/core/constants/sizes';
import type { SecurityCheck } from '@/lib/location/types';
import styles from './LocationSecurityBanner.module.css';

interface LocationSecurityBannerProps {
  securityCheck: SecurityCheck;
  locationName?: string;
  onDismiss?: () => void;
  onTrustLocation?: () => void;
  onVerify?: () => void;
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
  const getBannerConfig = () => {
    if (securityCheck.action === 'block') {
      return {
        bgColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: STATE_COLORS.error,
        iconColor: STATE_COLORS.error,
        title: 'Access Blocked',
        message: 'Suspicious activity detected from this location. Please contact support.',
      };
    }

    if (securityCheck.action === 'verify') {
      return {
        bgColor: 'rgba(245, 158, 11, 0.15)',
        borderColor: STATE_COLORS.warning,
        iconColor: STATE_COLORS.warning,
        title: 'Verification Required',
        message: 'Please verify your identity to continue from this new location.',
      };
    }

    if (securityCheck.action === 'warn' || securityCheck.isNewLocation) {
      return {
        bgColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: STATE_COLORS.info,
        iconColor: STATE_COLORS.info,
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
      style={{
        '--bg-color': bannerConfig.bgColor,
        '--border-color': bannerConfig.borderColor,
        '--border-radius': `${RADIUS.lg}px`,
        '--padding': `${SPACING.lg}px`,
      } as React.CSSProperties}
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
        <div
          className={styles.iconContainer}
          style={{
            '--icon-color': bannerConfig.iconColor,
          } as React.CSSProperties}
        >
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
          <h4
            className={styles.title}
            style={{
              '--text-primary-color': TEXT_COLORS.primary,
            } as React.CSSProperties}
          >
            {bannerConfig.title}
          </h4>
          <p
            className={styles.message}
            style={{
              '--text-secondary-color': TEXT_COLORS.secondary,
            } as React.CSSProperties}
          >
            {bannerConfig.message}
          </p>

          {/* Actions */}
          {(onTrustLocation || onVerify) && securityCheck.action !== 'block' && (
            <div className={styles.actions}>
              {onTrustLocation && securityCheck.isNewLocation && (
                <button
                  onClick={onTrustLocation}
                  className={styles.actionButton}
                  style={{
                    '--button-bg-color': STATE_COLORS.success,
                  } as React.CSSProperties}
                >
                  Trust This Location
                </button>
              )}
              {onVerify && securityCheck.action === 'verify' && (
                <button
                  onClick={onVerify}
                  className={styles.actionButton}
                  style={{
                    '--button-bg-color': STATE_COLORS.info,
                  } as React.CSSProperties}
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
