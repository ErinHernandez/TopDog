/**
 * GlossaryLayout.tsx
 * Main layout wrapper for glossary pages
 *
 * Provides:
 * - Two-column layout with sidebar and main content
 * - Module navigation sidebar
 * - Main content area with scrolling
 * - Dark theme matching TopDog aesthetic
 */

import React, { ReactNode } from 'react';

import type { ModuleId } from '@/lib/glossary/types';
import { MODULE_NAMES } from '@/lib/glossary/types';

import styles from './GlossaryLayout.module.css';

interface GlossaryLayoutProps {
  children: ReactNode;
  activeModule?: ModuleId;
  onModuleSelect?: (moduleId: ModuleId) => void;
}

const MODULES: ModuleId[] = [
  'draft-room',
  'lobby',
  'my-teams',
  'live-slow-drafts',
  'auth',
  'settings',
  'payments',
  'onboarding',
  'navigation-shell',
];

export function GlossaryLayout({
  children,
  activeModule,
  onModuleSelect,
}: GlossaryLayoutProps) {
  return (
    <div className={styles.layoutContainer}>
      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          <h2 className={styles.sidebarTitle}>Modules</h2>
          <nav className={styles.moduleNav}>
            {MODULES.map((moduleId) => (
              <button
                key={moduleId}
                className={`${styles.moduleButton} ${
                  activeModule === moduleId ? styles.moduleButtonActive : ''
                }`}
                onClick={() => onModuleSelect?.(moduleId)}
                type="button"
              >
                <span className={styles.moduleName}>
                  {MODULE_NAMES[moduleId]}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}

export default GlossaryLayout;
