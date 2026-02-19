/**
 * Cleaned Elements Library - Final Element Storage & Phone State Carousel
 *
 * This page displays:
 * 1. A horizontal scrolling carousel of phone wireframes showing every draft UI state
 * 2. All cleaned/extracted elements ready for use in the glossary
 * 3. Quality control and approval workflow
 *
 * Part of the world's first enterprise-grade app with zero human-written code.
 */

import {
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Filter,
  Search,
  Download,
  Trash2,
  Eye,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  Grid,
  List,
  Layers,
  Tag,
} from 'lucide-react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useRef, useEffect, useMemo } from 'react';

import { elements } from '@/lib/glossary/elements';
import {
  CleanedElement,
  DraftUIState,
  DraftStateConfig,
  DRAFT_STATES,
} from '@/lib/glossary/screenshots/types';

import styles from './cleaned-elements.module.css';

// ============================================================================
// PHONE WIREFRAME COMPONENT
// ============================================================================

interface PhoneWireframeProps {
  state: DraftStateConfig;
  isActive: boolean;
  onClick: () => void;
}

function PhoneWireframe({ state, isActive, onClick }: PhoneWireframeProps) {
  return (
    <button
      className={`${styles.phoneCard} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      style={{
        '--accent-color': state.accentColor,
        '--primary-color': state.primaryColor,
      } as React.CSSProperties}
    >
      {/* Phone Frame */}
      <div className={styles.phoneFrame}>
        {/* Notch */}
        <div className={styles.phoneNotch} />

        {/* Screen Content */}
        <div className={styles.phoneScreen}>
          {/* Status Bar Region */}
          <div className={styles.wireframeStatusBar}>
            <div className={styles.wireframeBlock} style={{ width: '30%' }} />
            {state.timerVisible && (
              <div
                className={styles.wireframeTimer}
                style={{ backgroundColor: state.accentColor }}
              >
                {state.timerValue ? `${state.timerValue}s` : ''}
              </div>
            )}
            <div className={styles.wireframeBlock} style={{ width: '20%' }} />
          </div>

          {/* Picks Bar Region */}
          <div className={styles.wireframePicksBar}>
            <div className={styles.wireframeTabs}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={styles.wireframeTab}
                  style={{
                    backgroundColor:
                      i === 3 ? state.accentColor : 'rgba(255,255,255,0.1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Main Content Region */}
          <div className={styles.wireframeContent}>
            {state.animationActive && (
              <div className={styles.pulseIndicator} style={{ backgroundColor: state.accentColor }} />
            )}
            <div className={styles.wireframeBlock} style={{ width: '80%', height: '12px' }} />
            <div className={styles.wireframeBlock} style={{ width: '60%', height: '12px', marginTop: '8px' }} />
            <div className={styles.wireframeGrid}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.wireframeCard} />
              ))}
            </div>
          </div>

          {/* Footer Region */}
          <div className={styles.wireframeFooter}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.wireframeFooterTab} />
            ))}
          </div>
        </div>

        {/* Home Indicator */}
        <div className={styles.phoneHomeIndicator} />
      </div>

      {/* Label */}
      <div className={styles.phoneLabel}>
        <span className={styles.phoneLabelName}>{state.name}</span>
        <span
          className={styles.urgencyDot}
          style={{
            backgroundColor:
              state.urgencyLevel === 'critical'
                ? '#EF4444'
                : state.urgencyLevel === 'high'
                ? '#F59E0B'
                : state.urgencyLevel === 'medium'
                ? '#3B82F6'
                : '#10B981',
          }}
        />
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CleanedElementsLibrary() {
  // Phone carousel state
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeStateIndex, setActiveStateIndex] = useState(4); // Default to user-turn-normal
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Element list state
  const [cleanedElements, setCleanedElements] = useState<CleanedElement[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedQuality, setSelectedQuality] = useState<string>('all');
  const [filterByState, setFilterByState] = useState<string>('all');

  // Filtered elements
  const filteredElements = useMemo(() => {
    return cleanedElements.filter((el) => {
      if (selectedPlatform !== 'all' && el.platform !== selectedPlatform) return false;
      if (selectedQuality !== 'all' && el.quality !== selectedQuality) return false;
      if (filterByState !== 'all' && el.draftState !== filterByState) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          el.elementId.toLowerCase().includes(query) ||
          el.filename.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [cleanedElements, selectedPlatform, selectedQuality, filterByState, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: cleanedElements.length,
    draft: cleanedElements.filter((e) => e.quality === 'draft').length,
    review: cleanedElements.filter((e) => e.quality === 'review').length,
    approved: cleanedElements.filter((e) => e.quality === 'approved').length,
    production: cleanedElements.filter((e) => e.quality === 'production').length,
    inGlossary: cleanedElements.filter((e) => e.usedInGlossary).length,
  }), [cleanedElements]);

  // Carousel scroll
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 200;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Update scroll buttons
  const updateScrollButtons = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', updateScrollButtons);
      updateScrollButtons();
      return () => carousel.removeEventListener('scroll', updateScrollButtons);
    }
    return undefined;
  }, []);

  // Scroll to active state
  useEffect(() => {
    if (carouselRef.current) {
      const card = carouselRef.current.children[activeStateIndex] as HTMLElement;
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeStateIndex]);

  // Quality badge component
  const QualityBadge = ({ quality }: { quality: CleanedElement['quality'] }) => {
    const config = {
      draft: { icon: <Clock size={12} />, color: '#6B7280', label: 'Draft' },
      review: { icon: <Eye size={12} />, color: '#F59E0B', label: 'Review' },
      approved: { icon: <Check size={12} />, color: '#3B82F6', label: 'Approved' },
      production: { icon: <CheckCircle size={12} />, color: '#10B981', label: 'Production' },
    };
    const { icon, color, label } = config[quality];
    return (
      <span className={styles.qualityBadge} style={{ backgroundColor: `${color}20`, color }}>
        {icon}
        {label}
      </span>
    );
  };

  return (
    <>
      <Head>
        <title>Cleaned Elements Library | TopDog Glossary Admin</title>
        <meta name="description" content="Final cleaned element storage with quality control" />
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/topdog/glossary/admin/element-extractor" className={styles.backLink}>
              ← Element Extractor
            </Link>
            <h1 className={styles.title}>
              <Layers size={28} />
              Cleaned Elements Library
            </h1>
            <p className={styles.subtitle}>Production-ready elements for the glossary</p>
          </div>

          <div className={styles.headerActions}>
            <button className={styles.exportAllButton}>
              <Download size={16} />
              Export All
            </button>
          </div>
        </header>

        {/* Phone State Carousel */}
        <section className={styles.carouselSection}>
          <div className={styles.carouselHeader}>
            <h2>Draft UI States</h2>
            <span className={styles.carouselCount}>{DRAFT_STATES.length} states</span>
          </div>

          <div className={styles.carouselWrapper}>
            {/* Left Arrow */}
            <button
              className={`${styles.carouselArrow} ${styles.left}`}
              onClick={() => scrollCarousel('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Carousel Track */}
            <div className={styles.carouselTrack} ref={carouselRef}>
              {DRAFT_STATES.map((state, index) => (
                <PhoneWireframe
                  key={state.id}
                  state={state}
                  isActive={index === activeStateIndex}
                  onClick={() => {
                    setActiveStateIndex(index);
                    setFilterByState(state.id);
                  }}
                />
              ))}
            </div>

            {/* Right Arrow */}
            <button
              className={`${styles.carouselArrow} ${styles.right}`}
              onClick={() => scrollCarousel('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* State Description */}
          <div className={styles.stateDescription}>
            <div
              className={styles.stateDot}
              style={{ backgroundColor: DRAFT_STATES[activeStateIndex]!.accentColor }}
            />
            <strong>{DRAFT_STATES[activeStateIndex]!.name}</strong>
            <span>{DRAFT_STATES[activeStateIndex]!.description}</span>
          </div>
        </section>

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: '#6B7280' }}>{stats.draft}</span>
            <span className={styles.statLabel}>Draft</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: '#F59E0B' }}>{stats.review}</span>
            <span className={styles.statLabel}>Review</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: '#3B82F6' }}>{stats.approved}</span>
            <span className={styles.statLabel}>Approved</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: '#10B981' }}>{stats.production}</span>
            <span className={styles.statLabel}>Production</span>
          </div>
          <div className={styles.stat}>
            <Star size={14} style={{ color: '#8B5CF6' }} />
            <span className={styles.statValue} style={{ color: '#8B5CF6' }}>{stats.inGlossary}</span>
            <span className={styles.statLabel}>In Glossary</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Search elements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.filters}>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Platforms</option>
              <option value="web">Web</option>
              <option value="ios">iOS</option>
              <option value="ipad">iPad</option>
              <option value="android">Android</option>
            </select>

            <select
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Quality</option>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="approved">Approved</option>
              <option value="production">Production</option>
            </select>

            <select
              value={filterByState}
              onChange={(e) => {
                setFilterByState(e.target.value);
                const stateIndex = DRAFT_STATES.findIndex((s) => s.id === e.target.value);
                if (stateIndex >= 0) setActiveStateIndex(stateIndex);
              }}
              className={styles.filterSelect}
            >
              <option value="all">All States</option>
              {DRAFT_STATES.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.viewToggle}>
            <button
              className={viewMode === 'grid' ? styles.active : ''}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={18} />
            </button>
            <button
              className={viewMode === 'list' ? styles.active : ''}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className={styles.main}>
          {filteredElements.length === 0 ? (
            <div className={styles.emptyState}>
              <Layers size={64} />
              <h2>No Cleaned Elements Yet</h2>
              <p>Extract and clean elements from the Element Extractor</p>
              <Link href="/topdog/glossary/admin/element-extractor" className={styles.extractorLink}>
                Go to Element Extractor →
              </Link>
            </div>
          ) : viewMode === 'grid' ? (
            <div className={styles.grid}>
              {filteredElements.map((element) => (
                <div key={element.id} className={styles.gridItem}>
                  <div className={styles.thumbnail}>
                    <Image src={element.path} alt={element.elementId} width={200} height={200} unoptimized />
                    {element.usedInGlossary && (
                      <div className={styles.glossaryBadge}>
                        <Star size={12} />
                      </div>
                    )}
                  </div>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemHeader}>
                      <span className={styles.elementId}>{element.elementId}</span>
                      <QualityBadge quality={element.quality} />
                    </div>
                    <div className={styles.itemMeta}>
                      <span>{element.platform}</span>
                      <span>•</span>
                      <span>{element.state}</span>
                    </div>
                    <div className={styles.itemDimensions}>
                      {element.finalDimensions.width} × {element.finalDimensions.height}px
                    </div>
                    <div className={styles.itemTags}>
                      {element.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <button title="Copy path">
                      <Copy size={14} />
                    </button>
                    <button title="Preview">
                      <Eye size={14} />
                    </button>
                    <button title="Download">
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Element ID</th>
                  <th>Platform</th>
                  <th>State</th>
                  <th>Dimensions</th>
                  <th>Quality</th>
                  <th>Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredElements.map((element) => (
                  <tr key={element.id}>
                    <td>
                      <div className={styles.tableThumb}>
                        <Image src={element.path} alt="" width={100} height={100} unoptimized />
                      </div>
                    </td>
                    <td>
                      <span className={styles.elementIdCell}>
                        {element.elementId}
                        {element.usedInGlossary && <Star size={12} className={styles.starIcon} />}
                      </span>
                    </td>
                    <td>{element.platform}</td>
                    <td>{element.state}</td>
                    <td className={styles.dimensions}>
                      {element.finalDimensions.width}×{element.finalDimensions.height}
                    </td>
                    <td>
                      <QualityBadge quality={element.quality} />
                    </td>
                    <td>
                      <div className={styles.tableTags}>
                        {element.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className={styles.tag}>{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className={styles.tableActions}>
                        <button title="Copy path">
                          <Copy size={14} />
                        </button>
                        <button title="Preview">
                          <Eye size={14} />
                        </button>
                        <button title="Download">
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>

        {/* Footer */}
        <footer className={styles.footer}>
          <Link href="/topdog/glossary/admin/screenshot-depot" className={styles.navLink}>
            ← Screenshot Depot
          </Link>
          <Link href="/topdog/glossary" className={styles.navLink}>
            View Glossary →
          </Link>
        </footer>
      </div>
    </>
  );
}
