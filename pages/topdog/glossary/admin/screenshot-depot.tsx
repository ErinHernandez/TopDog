/**
 * Screenshot Depot - Raw Screenshot Storage & Management
 *
 * This page stores all raw screenshots captured from localhost:3000.
 * Screenshots are organized by route, draft state, and platform.
 *
 * Part of the world's first enterprise-grade app with zero human-written code.
 */

import {
  Camera,
  Upload,
  Filter,
  Grid,
  List,
  Search,
  Trash2,
  Download,
  Play,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  Check,
  X,
  ChevronRight,
  Clock,
  HardDrive,
  Copy,
  Layers,
} from 'lucide-react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useMemo } from 'react';

import {
  RawScreenshot,
  DraftUIState,
  DRAFT_STATES,
  ScreenshotStatus,
} from '@/lib/glossary/screenshots/types';

import styles from './screenshot-depot.module.css';

// ============================================================================
// MOCK DATA - Replace with actual API/storage later
// ============================================================================

const MOCK_SCREENSHOTS: RawScreenshot[] = [
  // This would be populated by the capture script
];

// Extracted element reference type
interface ExtractedElement {
  id: string;
  sourceScreenshotId: string;
  name: string;
  thumbnailPath: string;
  extractedAt: string;
  dimensions: { width: number; height: number };
}

// Mock extracted elements - would be populated from Element Extractor
const MOCK_EXTRACTED: ExtractedElement[] = [
  // This would be populated when elements are successfully extracted
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function ScreenshotDepot() {
  // State
  const [screenshots, setScreenshots] = useState<RawScreenshot[]>(MOCK_SCREENSHOTS);
  const [extractedElements, setExtractedElements] = useState<ExtractedElement[]>(MOCK_EXTRACTED);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedDraftState, setSelectedDraftState] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedScreenshots, setSelectedScreenshots] = useState<Set<string>>(new Set());
  const [isCapturing, setIsCapturing] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(360);

  // Filtered screenshots
  const filteredScreenshots = useMemo(() => {
    return screenshots.filter((s) => {
      if (selectedPlatform !== 'all' && s.platform !== selectedPlatform) return false;
      if (selectedDraftState !== 'all' && s.draftState !== selectedDraftState) return false;
      if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          s.filename.toLowerCase().includes(query) ||
          s.route.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [screenshots, selectedPlatform, selectedDraftState, selectedStatus, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: screenshots.length,
    captured: screenshots.filter((s) => s.status === 'captured').length,
    processing: screenshots.filter((s) => s.status === 'processing').length,
    ready: screenshots.filter((s) => s.status === 'ready').length,
    errors: screenshots.filter((s) => s.status === 'error').length,
    totalSize: screenshots.reduce((acc, s) => acc + s.fileSize, 0),
  }), [screenshots]);

  // Toggle screenshot selection
  const toggleSelection = (id: string) => {
    setSelectedScreenshots((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all filtered
  const selectAll = () => {
    setSelectedScreenshots(new Set(filteredScreenshots.map((s) => s.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedScreenshots(new Set());
  };

  // Start capture job
  const startCapture = async () => {
    setIsCapturing(true);
    // TODO: Trigger Playwright capture script via API
    console.info('Starting capture job...');
    setTimeout(() => setIsCapturing(false), 3000);
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Platform icon
  const PlatformIcon = ({ platform }: { platform: string }) => {
    switch (platform) {
      case 'web':
        return <Monitor size={14} />;
      case 'ios':
      case 'android':
        return <Smartphone size={14} />;
      case 'ipad':
        return <Tablet size={14} />;
      default:
        return <Monitor size={14} />;
    }
  };

  // Status badge
  const StatusBadge = ({ status }: { status: ScreenshotStatus }) => {
    const config = {
      pending: { color: '#6B7280', label: 'Pending' },
      captured: { color: '#3B82F6', label: 'Captured' },
      processing: { color: '#F59E0B', label: 'Processing' },
      ready: { color: '#10B981', label: 'Ready' },
      error: { color: '#EF4444', label: 'Error' },
    };
    const { color, label } = config[status];
    return (
      <span className={styles.statusBadge} style={{ backgroundColor: `${color}20`, color }}>
        {label}
      </span>
    );
  };

  return (
    <>
      <Head>
        <title>Screenshot Depot | TopDog Glossary Admin</title>
        <meta name="description" content="Raw screenshot storage and management" />
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/topdog/glossary/admin" className={styles.backLink}>
              ← Admin
            </Link>
            <h1 className={styles.title}>
              <Camera size={28} />
              Screenshot Depot
            </h1>
            <p className={styles.subtitle}>Raw screenshot storage & capture management</p>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.captureButton}
              onClick={startCapture}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <>
                  <RefreshCw size={18} className={styles.spinning} />
                  Capturing...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Start Capture
                </>
              )}
            </button>
            <button className={styles.uploadButton}>
              <Upload size={18} />
              Upload
            </button>
          </div>
        </header>

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: '#3B82F6' }}>{stats.captured}</span>
            <span className={styles.statLabel}>Captured</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: '#F59E0B' }}>{stats.processing}</span>
            <span className={styles.statLabel}>Processing</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: '#10B981' }}>{stats.ready}</span>
            <span className={styles.statLabel}>Ready</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: '#EF4444' }}>{stats.errors}</span>
            <span className={styles.statLabel}>Errors</span>
          </div>
          <div className={styles.stat}>
            <HardDrive size={14} />
            <span className={styles.statValue}>{formatSize(stats.totalSize)}</span>
            <span className={styles.statLabel}>Storage</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          {/* Search */}
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Search screenshots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters */}
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
              value={selectedDraftState}
              onChange={(e) => setSelectedDraftState(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All States</option>
              {DRAFT_STATES.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="captured">Captured</option>
              <option value="processing">Processing</option>
              <option value="ready">Ready</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* View Toggle */}
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

        {/* Selection Actions */}
        {selectedScreenshots.size > 0 && (
          <div className={styles.selectionBar}>
            <span>{selectedScreenshots.size} selected</span>
            <button onClick={selectAll}>Select All ({filteredScreenshots.length})</button>
            <button onClick={clearSelection}>Clear</button>
            <button className={styles.extractButton}>
              <ChevronRight size={16} />
              Send to Extractor
            </button>
            <button className={styles.deleteButton}>
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}

        {/* Split Content Area */}
        <div className={styles.splitContainer}>
          {/* Left Panel - Raw Screenshots */}
          <div className={styles.leftPanel}>
            <main className={styles.main}>
              {filteredScreenshots.length === 0 ? (
                <div className={styles.emptyState}>
                  <Camera size={64} />
                  <h2>No Screenshots Yet</h2>
                  <p>Start a capture job to automatically screenshot localhost:3000</p>
                  <button className={styles.captureButton} onClick={startCapture}>
                    <Play size={18} />
                    Start Capture
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className={styles.grid}>
                  {filteredScreenshots.map((screenshot) => (
                    <div
                      key={screenshot.id}
                      className={`${styles.gridItem} ${
                        selectedScreenshots.has(screenshot.id) ? styles.selected : ''
                      }`}
                      onClick={() => toggleSelection(screenshot.id)}
                    >
                      <div className={styles.thumbnail}>
                        <Image src={screenshot.path} alt={screenshot.filename} width={200} height={200} unoptimized />
                        <div className={styles.thumbnailOverlay}>
                          <div className={styles.checkmark}>
                            {selectedScreenshots.has(screenshot.id) && <Check size={20} />}
                          </div>
                        </div>
                      </div>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemHeader}>
                          <PlatformIcon platform={screenshot.platform} />
                          <span className={styles.itemFilename}>{screenshot.filename}</span>
                        </div>
                        <div className={styles.itemMeta}>
                          <StatusBadge status={screenshot.status} />
                          <span className={styles.itemSize}>{formatSize(screenshot.fileSize)}</span>
                        </div>
                        {screenshot.draftState && (
                          <span className={styles.draftState}>
                            {DRAFT_STATES.find((s) => s.id === screenshot.draftState)?.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedScreenshots.size === filteredScreenshots.length && filteredScreenshots.length > 0}
                          onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
                        />
                      </th>
                      <th>Preview</th>
                      <th>Filename</th>
                      <th>Route</th>
                      <th>Platform</th>
                      <th>Draft State</th>
                      <th>Status</th>
                      <th>Size</th>
                      <th>Captured</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScreenshots.map((screenshot) => (
                      <tr
                        key={screenshot.id}
                        className={selectedScreenshots.has(screenshot.id) ? styles.selectedRow : ''}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedScreenshots.has(screenshot.id)}
                            onChange={() => toggleSelection(screenshot.id)}
                          />
                        </td>
                        <td>
                          <div className={styles.tableThumb}>
                            <Image src={screenshot.path} alt="" width={100} height={100} unoptimized />
                          </div>
                        </td>
                        <td className={styles.filename}>{screenshot.filename}</td>
                        <td className={styles.route}>{screenshot.route}</td>
                        <td>
                          <span className={styles.platformBadge}>
                            <PlatformIcon platform={screenshot.platform} />
                            {screenshot.platform}
                          </span>
                        </td>
                        <td>
                          {screenshot.draftState
                            ? DRAFT_STATES.find((s) => s.id === screenshot.draftState)?.name
                            : '-'}
                        </td>
                        <td>
                          <StatusBadge status={screenshot.status} />
                        </td>
                        <td>{formatSize(screenshot.fileSize)}</td>
                        <td>
                          <span className={styles.timestamp}>
                            <Clock size={12} />
                            {new Date(screenshot.capturedAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button title="Download">
                              <Download size={14} />
                            </button>
                            <button title="Send to Extractor">
                              <ChevronRight size={14} />
                            </button>
                            <button title="Delete" className={styles.deleteBtn}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </main>
          </div>

          {/* Vertical Divider */}
          <div className={styles.verticalDivider} />

          {/* Right Panel - Extracted Elements Quick Reference */}
          <div className={styles.rightPanel} style={{ width: rightPanelWidth }}>
            <div className={styles.rightPanelHeader}>
              <h2>
                <Layers size={18} />
                Extracted Elements
                {extractedElements.length > 0 && (
                  <span className={styles.extractedCount}>{extractedElements.length}</span>
                )}
              </h2>
              <p className={styles.rightPanelSubtitle}>Quick reference for successfully extracted UI elements</p>
            </div>
            <div className={styles.rightPanelContent}>
              {extractedElements.length === 0 ? (
                <div className={styles.emptyExtracted}>
                  <Copy size={48} />
                  <p>No extracted elements yet</p>
                  <p style={{ fontSize: '0.6875rem', marginTop: '0.5rem' }}>
                    Successfully extracted elements will appear here as a quick reference
                  </p>
                </div>
              ) : (
                <div className={styles.extractedGrid}>
                  {extractedElements.map((element) => (
                    <div key={element.id} className={styles.extractedItem}>
                      <div className={styles.extractedThumb}>
                        <Image src={element.thumbnailPath} alt={element.name} width={100} height={100} unoptimized />
                      </div>
                      <div className={styles.extractedInfo}>
                        <span className={styles.extractedId}>{element.name}</span>
                        <span className={styles.extractedMeta}>
                          {element.dimensions.width}×{element.dimensions.height}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <footer className={styles.footer}>
          <Link href="/topdog/glossary/admin/element-extractor" className={styles.navLink}>
            Element Extractor →
          </Link>
          <Link href="/topdog/glossary/admin/cleaned-elements" className={styles.navLink}>
            Cleaned Elements Library →
          </Link>
        </footer>
      </div>
    </>
  );
}
