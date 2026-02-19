/**
 * LiveDraftsTab - VX2 Live Drafts Tab
 *
 * Placeholder for migration from VX.
 */

import React from 'react';

import styles from './index.module.css';

export default function LiveDraftsTab(): React.ReactElement {
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Live Drafts</h1>
      </div>

      {/* Empty State */}
      <div className={styles.emptyStateContainer}>
        <div className={styles.emptyStateIcon}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        <h2 className={styles.emptyStateTitle}>No Active Drafts</h2>

        <p className={styles.emptyStateDescription}>
          Join a tournament from the Lobby to start drafting
        </p>

        <button className={styles.primaryButton}>Browse Lobby</button>
      </div>
    </div>
  );
}

