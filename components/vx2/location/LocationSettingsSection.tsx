/**
 * Location Settings Section
 *
 * Settings panel for managing location tracking preferences.
 * Shows consent status, trusted locations, and security options.
 */

import Image from 'next/image';
import { useState } from 'react';

import { getFlagDisplayName } from '@/lib/customization/flags';

import { STATE_COLORS } from '../core/constants/colors';

import { useLocationConsent } from './hooks/useLocationConsent';
import { useLocationTracking } from './hooks/useLocationTracking';
import { LocationConsentModal } from './LocationConsentModal';
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
    >
      {/* Header */}
      <div
        className={styles.header}
      >
        <div className={styles.headerContent}>
          <div className={styles.iconContainer}>
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke={STATE_COLORS.info}
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
          >
            {isRevoking ? 'Disabling...' : 'Disable'}
          </button>
        ) : (
          <button
            onClick={() => setShowConsentModal(true)}
            className={`${styles.buttonBase} ${styles.buttonEnable}`}
          >
            Enable
          </button>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {isGranted ? (
          <>
            {/* Stats */}
            <div
              className={styles.statsGrid}
            >
              <div
                className={styles.statCard}
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
              >
                Known Locations
              </h4>

              {knownLocations.length === 0 ? (
                <p
                  className={styles.emptyState}
                >
                  No locations recorded yet
                </p>
              ) : (
                <div className={styles.locationsList}>
                  {knownLocations.slice(0, 5).map((loc) => (
                    <div
                      key={loc.code}
                      className={styles.locationItem}
                    >
                      <div className={styles.locationItemContent}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
                        >
                          {getFlagDisplayName(loc.code)}
                        </span>
                        {loc.isTrusted && (
                          <span
                            className={styles.trustedBadge}
                          >
                            Trusted
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => loc.isTrusted ? removeTrust(loc.code) : trustLocation(loc.code)}
                        className={`${styles.trustButton} ${loc.isTrusted ? styles.trustButtonRemove : styles.trustButtonAdd}`}
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
            >
              Location data is used for account security and customization features.
              Only country/state level is tracked, never precise coordinates.
            </p>
          </>
        ) : (
          <div className={styles.disabledContent}>
            <p
              className={styles.disabledText}
            >
              Enable location tracking to unlock flag customizations and improve account security.
            </p>
            <ul
              className={styles.benefitsList}
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
