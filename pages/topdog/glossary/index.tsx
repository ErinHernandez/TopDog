/**
 * TopDog Master Glossary - Main Index Page
 *
 * Interactive design system explorer for all UI elements across TopDog.
 * Dark theme matching the app aesthetic.
 */

import { Search, Filter, ChevronDown, ChevronRight, Grid, List, X } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useMemo, useCallback } from 'react';

import { elements, screens } from '@/lib/glossary/elements';
import {
  GlossaryElement,
  ModuleId,
  ElementType,
  MODULE_NAMES,
  ELEMENT_TYPE_LABELS,
  GlossaryFilters,
  generateSlug,
} from '@/lib/glossary/types';

import styles from './glossary.module.css';

// Module metadata with element counts
const MODULES: { id: ModuleId; name: string; description: string; status: string }[] = [
  { id: 'draft-room', name: 'Draft Room', description: 'Live drafting experience', status: 'In Progress' },
  { id: 'lobby', name: 'Lobby/Home', description: 'Tournament discovery', status: 'Pending' },
  { id: 'my-teams', name: 'My Teams', description: 'Drafted teams & standings', status: 'Pending' },
  { id: 'live-slow-drafts', name: 'Live/Slow Drafts', description: 'Active draft management', status: 'Pending' },
  { id: 'auth', name: 'Authentication', description: 'Login, signup, verification', status: 'Pending' },
  { id: 'settings', name: 'Settings/Profile', description: 'User preferences', status: 'Pending' },
  { id: 'payments', name: 'Payments', description: 'Deposits & withdrawals', status: 'Pending' },
  { id: 'onboarding', name: 'Onboarding', description: 'First-time user flow', status: 'Pending' },
  { id: 'navigation-shell', name: 'Navigation Shell', description: 'Tab bar, headers', status: 'Pending' },
];

export default function GlossaryIndex() {
  const router = useRouter();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<GlossaryFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [expandedModules, setExpandedModules] = useState<Set<ModuleId>>(new Set(['draft-room']));
  const [showFilters, setShowFilters] = useState(false);

  // Filter elements
  const filteredElements = useMemo(() => {
    return elements.filter(el => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          el.name.toLowerCase().includes(query) ||
          el.id.toLowerCase().includes(query) ||
          el.description.toLowerCase().includes(query) ||
          (el.tags?.some(tag => tag.toLowerCase().includes(query)));
        if (!matchesSearch) return false;
      }

      // Module filter
      if (filters.module && el.module !== filters.module) return false;

      // Element type filter
      if (filters.elementType && el.elementType !== filters.elementType) return false;

      // Interactive filter
      if (filters.isInteractive !== undefined && el.isInteractive !== filters.isInteractive) return false;

      // Tech debt filter
      if (filters.hasTechDebt && (!el.techDebt || el.techDebt.length === 0)) return false;

      return true;
    });
  }, [searchQuery, filters]);

  // Group elements by module
  const elementsByModule = useMemo(() => {
    const grouped = new Map<string, GlossaryElement[]>();
    filteredElements.forEach(el => {
      const existing = grouped.get(el.module) || [];
      grouped.set(el.module, [...existing, el]);
    });
    return grouped;
  }, [filteredElements]);

  // Toggle module expansion
  const toggleModule = useCallback((moduleId: ModuleId) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  // Get element count for module
  const getModuleElementCount = (moduleId: ModuleId) => {
    return elements.filter(el => el.module === moduleId).length;
  };

  // Active filter count
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <>
      <Head>
        <title>TopDog Master Glossary | Design System</title>
        <meta name="description" content="Comprehensive UI element documentation for TopDog" />
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <h1 className={styles.title}>TopDog Glossary</h1>
              <p className={styles.subtitle}>
                {elements.length} elements • {screens.length} screens • 9 modules
              </p>
            </div>

            <div className={styles.headerActions}>
              <Link href="/topdog/glossary" className={styles.backLink}>
                ← Back to Glossaries
              </Link>
            </div>
          </div>
        </header>

        {/* Search & Filters Bar */}
        <div className={styles.toolbar}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Search elements... (⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={styles.clearSearch}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className={styles.toolbarActions}>
            <button
              className={`${styles.filterToggle} ${showFilters ? styles.active : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className={styles.filterBadge}>{activeFilterCount}</span>
              )}
            </button>

            <div className={styles.viewToggle}>
              <button
                className={viewMode === 'list' ? styles.active : ''}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <List size={16} />
              </button>
              <button
                className={viewMode === 'grid' ? styles.active : ''}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <Grid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className={styles.filtersPanel}>
            <div className={styles.filterGroup}>
              <label>Module</label>
              <select
                value={filters.module || ''}
                onChange={(e) => setFilters(f => ({ ...f, module: e.target.value as ModuleId || undefined }))}
              >
                <option value="">All Modules</option>
                {MODULES.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Element Type</label>
              <select
                value={filters.elementType || ''}
                onChange={(e) => setFilters(f => ({ ...f, elementType: e.target.value as ElementType || undefined }))}
              >
                <option value="">All Types</option>
                {Object.entries(ELEMENT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={filters.isInteractive || false}
                  onChange={(e) => setFilters(f => ({ ...f, isInteractive: e.target.checked || undefined }))}
                />
                Interactive Only
              </label>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={filters.hasTechDebt || false}
                  onChange={(e) => setFilters(f => ({ ...f, hasTechDebt: e.target.checked || undefined }))}
                />
                Has Tech Debt
              </label>
            </div>

            {activeFilterCount > 0 && (
              <button className={styles.clearFilters} onClick={clearFilters}>
                Clear All
              </button>
            )}
          </div>
        )}

        {/* Main Content */}
        <main className={styles.main}>
          {/* Sidebar - Module List */}
          <aside className={styles.sidebar}>
            <h2 className={styles.sidebarTitle}>Modules</h2>
            <nav className={styles.moduleList}>
              {MODULES.map(module => {
                const count = getModuleElementCount(module.id);
                const isExpanded = expandedModules.has(module.id);
                const moduleElements = elementsByModule.get(module.id) || [];

                return (
                  <div key={module.id} className={styles.moduleItem}>
                    <button
                      className={styles.moduleHeader}
                      onClick={() => toggleModule(module.id)}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className={styles.moduleName}>{module.name}</span>
                      <span className={`${styles.moduleStatus} ${styles[module.status.toLowerCase().replace(' ', '-')]}`}>
                        {module.status}
                      </span>
                      <span className={styles.moduleCount}>{count}</span>
                    </button>

                    {isExpanded && moduleElements.length > 0 && (
                      <ul className={styles.moduleElements}>
                        {moduleElements.slice(0, 10).map(el => (
                          <li key={el.id}>
                            <Link href={`/topdog/glossary/${generateSlug(el.name)}`} className={styles.elementLink}>
                              <span className={styles.elementId}>{el.id}</span>
                              <span className={styles.elementName}>{el.name}</span>
                            </Link>
                          </li>
                        ))}
                        {moduleElements.length > 10 && (
                          <li className={styles.moreElements}>
                            +{moduleElements.length - 10} more
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* Content Area - Element Cards */}
          <div className={styles.content}>
            <div className={styles.resultsHeader}>
              <span className={styles.resultsCount}>
                {filteredElements.length} element{filteredElements.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </span>
            </div>

            <div className={`${styles.elementGrid} ${styles[viewMode]}`}>
              {filteredElements.map(element => (
                <Link
                  key={element.id}
                  href={`/topdog/glossary/${generateSlug(element.name)}`}
                  className={styles.elementCard}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.cardId}>{element.id}</span>
                    <span className={`${styles.typeBadge} ${styles[element.elementType]}`}>
                      {ELEMENT_TYPE_LABELS[element.elementType]}
                    </span>
                  </div>

                  <h3 className={styles.cardTitle}>{element.name}</h3>
                  <p className={styles.cardDescription}>{element.description}</p>

                  <div className={styles.cardMeta}>
                    <span className={styles.cardModule}>{MODULE_NAMES[element.module]}</span>
                    {element.isInteractive && (
                      <span className={styles.interactiveBadge}>Interactive</span>
                    )}
                    {element.techDebt && element.techDebt.length > 0 && (
                      <span className={styles.techDebtBadge}>
                        {element.techDebt.length} issue{element.techDebt.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className={styles.cardStates}>
                    {element.states.slice(0, 4).map(state => (
                      <span key={state.state} className={styles.stateDot} title={state.state} />
                    ))}
                    {element.states.length > 4 && (
                      <span className={styles.moreStates}>+{element.states.length - 4}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {filteredElements.length === 0 && (
              <div className={styles.emptyState}>
                <p>No elements found matching your criteria.</p>
                <button onClick={clearFilters}>Clear filters</button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
