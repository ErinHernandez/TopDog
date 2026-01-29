/**
 * Location Settings Section
 *
 * Settings panel for managing location tracking preferences.
 * Shows consent status, trusted locations, and security options.
 */

import { useState } from 'react';
import { BG_COLORS, TEXT_COLORS, BORDER_COLORS, STATE_COLORS } from '@/components/vx2/core/constants/colors';
import { SPACING, RADIUS } from '@/components/vx2/core/constants/sizes';
import { useLocationConsent } from './hooks/useLocationConsent';
import { useLocationTracking } from './hooks/useLocationTracking';
import { LocationConsentModal } from './LocationConsentModal';
import { getFlagDisplayName } from '@/lib/customization/flags';
import styles from './LocationSettingsSection.module.css';

export function LocationSettingsSection() {
  const { consent, isGranted, grantConsent, revokeConsent } = useLocationConsent();
  const { knownLocations, trustLocation, removeTrust, userLocations } = useLocationTracking();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevoke = async () => {
    if (!window.confirm('Are you sure you want to disable location tracking? This will remove some customization options.')) {
      return;
    }

    setIsRevoking(true);
    try {
      await revokeConsent();
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div
      className={styles.container}
      style={{
        '--bg-color': BG_COLORS.tertiary,
        '--radius-lg': `${RADIUS.lg}px`,
        '--border-color': BORDER_COLORS.light,
      } as React.CSSProperties}
    >
      {/* Header */}
      <div
        className={styles.header}
        style={{
          '--spacing-lg': `${SPACING.lg}px`,
        } as React.CSSProperties}
      >
        <div className={styles.headerContent}>
          <div className={styles.iconContainer}>
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3B82F6"
              strokeWidth={2}
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className={styles.titleSection}>
            <h3 className={styles.title}>
              Location Tracking
            </h3>
            <p className={styles.statusText}>
              {isGranted ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>

        {/* Toggle button */}
        {isGranted ? (
          <button
            onClick={handleRevoke}
            disabled={isRevoking}
            className={`${styles.buttonBase} ${styles.buttonDisable} ${isRevoking ? styles.buttonDisableLoading : ''}`}
            style={{
              '--error-color': STATE_COLORS.error,
            } as React.CSSProperties}
          >
            {isRevoking ? 'Disabling...' : 'Disable'}
          </button>
        ) : (
          <button
            onClick={() => setShowConsentModal(true)}
            className={`${styles.buttonBase} ${styles.buttonEnable}`}
            style={{
              '--success-color': STATE_COLORS.success,
            } as React.CSSProperties}
          >
            Enable
          </button>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}
        style={{
          '--spacing-lg': `${SPACING.lg}px`,
        } as React.CSSProperties}
      >
        {isGranted ? (
          <>
            {/* Stats */}
            <div
              className={styles.statsGrid}
            >
              <div
                className={styles.statCard}
                style={{
                  '--bg-secondary': BG_COLORS.secondary,
                  '--text-primary': TEXT_COLORS.primary,
                  '--text-secondary': TEXT_COLORS.secondary,
                } as React.CSSProperties}
              >
                <div className={styles.statValue}>
                  {userLocations.countries.length}
                </div>
                <div className={styles.statLabel}>
                  Countries
                </div>
              </div>
              <div
                className={styles.statCard}
                style={{
                  '--bg-secondary': BG_COLORS.secondary,
                  '--text-primary': TEXT_COLORS.primary,
                  '--text-secondary': TEXT_COLORS.secondary,
                } as React.CSSProperties}
              >
                <div className={styles.statValue}>
                  {userLocations.states.length}
                </div>
                <div className={styles.statLabel}>
                  US States
                </div>
              </div>
            </div>

            {/* Trusted locations */}
            <div>
              <h4
                className={styles.sectionTitle}
                style={{
                  '--text-primary': TEXT_COLORS.primary,
                } as React.CSSProperties}
              >
                Known Locations
              </h4>

              {knownLocations.length === 0 ? (
                <p
                  className={styles.emptyState}
                  style={{
                    '--text-muted': TEXT_COLORS.muted,
                  } as React.CSSProperties}
                >
                  No locations recorded yet
                </p>
              ) : (
                <div className={styles.locationsList}>
                  {knownLocations.slice(0, 5).map((loc) => (
                    <div
                      key={loc.code}
                      className={styles.locationItem}
                      style={{
                        '--bg-secondary': BG_COLORS.secondary,
                      } as React.CSSProperties}
                    >
                      <div className={styles.locationItemContent}>
                        <img
                          src={`/flags/${loc.code.startsWith('US-') ? 'states' : 'countries'}/${loc.code.replace('US-', '').toLowerCase()}.svg`}
                          alt=""
                          className={styles.locationFlag}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <span
                          className={styles.locationName}
                          style={{
                            '--text-primary': TEXT_COLORS.primary,
                          } as React.CSSProperties}
                        >
                          {getFlagDisplayName(loc.code)}
                        </span>
                        {loc.isTrusted && (
                          <span
                            className={styles.trustedBadge}
                            style={{
                              '--success-color': STATE_COLORS.success,
                            } as React.CSSProperties}
                          >
                            Trusted
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => loc.isTrusted ? removeTrust(loc.code) : trustLocation(loc.code)}
                        className={styles.trustButton}
                        style={{
                          '--button-text-color': loc.isTrusted ? TEXT_COLORS.muted : STATE_COLORS.success,
                        } as React.CSSProperties}
                      >
                        {loc.isTrusted ? 'Remove Trust' : 'Trust'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy info */}
            <p
              className={styles.privacyNote}
              style={{
                '--text-muted': TEXT_COLORS.muted,
              } as React.CSSProperties}
            >
              Location data is used for account security and customization features.
              Only country/state level is tracked, never precise coordinates.
            </p>
          </>
        ) : (
          <div className={styles.disabledContent}>
            <p
              className={styles.disabledText}
              style={{
                '--text-secondary': TEXT_COLORS.secondary,
              } as React.CSSProperties}
            >
              Enable location tracking to unlock flag customizations and improve account security.
            </p>
            <ul
              className={styles.benefitsList}
              style={{
                '--text-muted': TEXT_COLORS.muted,
              } as React.CSSProperties}
            >
              <li className={styles.benefitItem}>
                <svg
                  className={styles.benefitIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Collect flags from visited locations
              </li>
              <li className={styles.benefitItem}>
                <svg
                  className={styles.benefitIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Get alerts for suspicious login attempts
              </li>
              <li className={styles.benefitItem}>
                <svg
                  className={styles.benefitIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Protect your drafts from unauthorized access
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Consent modal */}
      <LocationConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        context="app_open"
      />
    </div>
  );
}

export default LocationSettingsSection;
