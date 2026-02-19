/**
 * FilterPanel.tsx
 * Filter UI component for glossary elements
 *
 * Supports:
 * - Module filtering (dropdown)
 * - Element type filtering (multi-select)
 * - Interactive status toggle
 * - Clear all filters button
 */

import React, { useState } from 'react';

import type {
  ModuleId,
  ElementType,
  GlossaryFilters,
} from '@/lib/glossary/types';
import {
  MODULE_NAMES,
  ELEMENT_TYPE_LABELS,
} from '@/lib/glossary/types';

import styles from './FilterPanel.module.css';

const ELEMENT_TYPES: ElementType[] = [
  'button',
  'input',
  'text',
  'icon',
  'container',
  'card',
  'list',
  'modal',
  'tab',
  'badge',
  'toggle',
  'slider',
  'dropdown',
  'image',
  'indicator',
  'divider',
];

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

interface FilterPanelProps {
  onFilterChange?: (filters: GlossaryFilters) => void;
  filters?: GlossaryFilters;
}

export function FilterPanel({ onFilterChange, filters = {} }: FilterPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ModuleId | undefined>(
    filters.module
  );
  const [selectedTypes, setSelectedTypes] = useState<ElementType[]>(
    filters.elementType ? [filters.elementType] : []
  );
  const [showInteractive, setShowInteractive] = useState<boolean | undefined>(
    filters.isInteractive
  );

  const activeFilterCount =
    (selectedModule ? 1 : 0) +
    selectedTypes.length +
    (showInteractive !== undefined ? 1 : 0);

  const handleModuleChange = (moduleId: ModuleId) => {
    setSelectedModule(selectedModule === moduleId ? undefined : moduleId);
    updateFilters(
      selectedModule === moduleId ? undefined : moduleId,
      selectedTypes,
      showInteractive
    );
  };

  const handleTypeToggle = (type: ElementType) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(newTypes);
    updateFilters(selectedModule, newTypes, showInteractive);
  };

  const handleInteractiveToggle = () => {
    const newValue =
      showInteractive === undefined ? true : showInteractive === true ? false : undefined;
    setShowInteractive(newValue);
    updateFilters(
      selectedModule,
      selectedTypes,
      newValue === undefined ? undefined : newValue
    );
  };

  const handleClearFilters = () => {
    setSelectedModule(undefined);
    setSelectedTypes([]);
    setShowInteractive(undefined);
    updateFilters(undefined, [], undefined);
  };

  const updateFilters = (
    module: ModuleId | undefined,
    types: ElementType[],
    interactive: boolean | undefined
  ) => {
    const newFilters: GlossaryFilters = {};
    if (module) newFilters.module = module;
    if (types.length > 0) newFilters.elementType = types[0];
    if (interactive !== undefined) newFilters.isInteractive = interactive;
    onFilterChange?.(newFilters);
  };

  return (
    <div className={styles.filterPanel}>
      {/* Filter Header */}
      <button
        className={styles.filterHeader}
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <span className={styles.filterTitle}>Filters</span>
        {activeFilterCount > 0 && (
          <span className={styles.filterBadge}>{activeFilterCount}</span>
        )}
        <span
          className={`${styles.expandIcon} ${expanded ? styles.expandIconOpen : ''}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13 6L8 11L3 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {/* Filter Content */}
      {expanded && (
        <div className={styles.filterContent}>
          {/* Module Filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>Module</h3>
            <div className={styles.moduleSelector}>
              {MODULES.map((moduleId) => (
                <button
                  key={moduleId}
                  className={`${styles.moduleOption} ${
                    selectedModule === moduleId
                      ? styles.moduleOptionSelected
                      : ''
                  }`}
                  onClick={() => handleModuleChange(moduleId)}
                  type="button"
                >
                  {MODULE_NAMES[moduleId]}
                </button>
              ))}
            </div>
          </div>

          {/* Element Type Filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>Element Type</h3>
            <div className={styles.typeGrid}>
              {ELEMENT_TYPES.map((type) => (
                <label key={type} className={styles.typeCheckbox}>
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => handleTypeToggle(type)}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxLabel}>
                    {ELEMENT_TYPE_LABELS[type]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Interactive Toggle */}
          <div className={styles.filterSection}>
            <label className={styles.interactiveToggle}>
              <input
                type="checkbox"
                checked={showInteractive === true}
                onChange={handleInteractiveToggle}
                className={styles.checkbox}
              />
              <span className={styles.toggleLabel}>Interactive Elements Only</span>
            </label>
          </div>

          {/* Clear Filters Button */}
          {activeFilterCount > 0 && (
            <button
              className={styles.clearFiltersButton}
              onClick={handleClearFilters}
              type="button"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterPanel;
