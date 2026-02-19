/**
 * ElementCard.tsx
 * Preview card for a glossary element in list view
 *
 * Displays:
 * - Element name and ID
 * - Module and type badge
 * - Interactive status indicator
 * - Hover preview information
 */

import React, { useState } from 'react';

import type { GlossaryElement } from '@/lib/glossary/types';
import { ELEMENT_TYPE_LABELS, MODULE_NAMES } from '@/lib/glossary/types';

import styles from './ElementCard.module.css';

interface ElementCardProps {
  element: GlossaryElement;
  onClick?: () => void;
  isSelected?: boolean;
}

export function ElementCard({
  element,
  onClick,
  isSelected = false,
}: ElementCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  const typeLabel =
    ELEMENT_TYPE_LABELS[element.elementType as keyof typeof ELEMENT_TYPE_LABELS];

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
      onClick={onClick}
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Header Section */}
      <div className={styles.header}>
        <h3 className={styles.elementName}>{element.name}</h3>
        <span className={styles.elementId}>{element.id}</span>
      </div>

      {/* Meta Information */}
      <div className={styles.metaRow}>
        <span className={styles.module}>
          {MODULE_NAMES[element.module]}
        </span>
      </div>

      {/* Badges Row */}
      <div className={styles.badgesRow}>
        <span className={styles.typeBadge}>{typeLabel}</span>
        {element.isInteractive && (
          <span className={styles.interactiveBadge}>
            <span className={styles.interactiveIndicator} />
            Interactive
          </span>
        )}
      </div>

      {/* Additional Info on Hover */}
      {showPreview && (
        <div className={styles.preview}>
          <div className={styles.previewContent}>
            {element.description && (
              <div className={styles.previewSection}>
                <span className={styles.previewLabel}>Description</span>
                <p className={styles.previewText}>{element.description}</p>
              </div>
            )}
            {element.tags && element.tags.length > 0 && (
              <div className={styles.previewSection}>
                <span className={styles.previewLabel}>Tags</span>
                <div className={styles.tagsList}>
                  {element.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {element.techDebt && element.techDebt.length > 0 && (
              <div className={styles.previewSection}>
                <span className={styles.previewLabel}>
                  Tech Debt Items: {element.techDebt.length}
                </span>
              </div>
            )}
            {element.states && element.states.length > 0 && (
              <div className={styles.previewSection}>
                <span className={styles.previewLabel}>
                  States: {element.states.length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ElementCard;
