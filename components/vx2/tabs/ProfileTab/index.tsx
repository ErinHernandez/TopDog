/**
 * ProfileTab - VX2 Profile Tab
 * 
 * Placeholder for migration from VX.
 */

import React from 'react';

import { cn } from '@/lib/styles';

import styles from './index.module.css';

export default function ProfileTab(): React.ReactElement {
  return (
    <div
      className={cn("flex-1 flex flex-col", styles.container)}
    >
      {/* Header */}
      <div
        className={cn("px-4 py-3", styles.header)}
      >
        <h1
          className={`${styles.title} font-bold`}
        >
          Profile
        </h1>
      </div>

      {/* Profile Avatar */}
      <div className="p-6 flex flex-col items-center">
        <div
          className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-3", styles.avatarCircle)}
        >
          <span className={styles.avatarText}>U</span>
        </div>
        <h2
          className={`${styles.username} font-semibold`}
        >
          Username
        </h2>
        <p className={styles.memberText}>
          Member since 2024
        </p>
      </div>

      {/* Menu Items */}
      <div className="flex-1 px-4">
        {['Rankings', 'Autodraft Limits', 'Deposit History', 'Settings'].map((item) => (
          <div
            key={item}
            className={styles.menuItem}
          >
            <span>{item}</span>
            <span>{'>'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

