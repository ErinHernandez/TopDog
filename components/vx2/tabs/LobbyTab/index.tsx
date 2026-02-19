/**
 * LobbyTab - VX2 Lobby Tab
 *
 * Placeholder for migration from VX.
 * Will be populated with LobbyTabVX content.
 */

import React from 'react';

import styles from './index.module.css';

export default function LobbyTab(): React.ReactElement {
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Lobby</h1>
        <p className={styles.headerSubtitle}>VX2 - Enterprise Tab System</p>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Sample Tournament Card */}
        <div className={styles.tournamentCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Best Ball Mania V</h3>
              <p className={styles.cardSubtitle}>$25 Entry - 12 Team Draft</p>
            </div>
            <div className={styles.statusBadge}>FILLING</div>
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progressBarFill}
              style={{ '--progress-width': '75%' } as React.CSSProperties}
            />
          </div>

          <div className={styles.cardFooter}>
            <span className={styles.cardStats}>9/12 Entered</span>
            <button className={styles.joinButton}>Join $25</button>
          </div>
        </div>

        {/* Info Card */}
        <div className={styles.infoCard}>
          <h3 className={styles.infoTitle}>VX2 Foundation Complete</h3>
          <p className={styles.infoText}>
            This is a placeholder tab demonstrating the new enterprise-grade tab
            system. Content from VX will be migrated here.
          </p>
        </div>
      </div>
    </div>
  );
}

