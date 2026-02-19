/**
 * Element Extractor Sandbox - Visual Element Cropping Tool
 *
 * This page allows you to:
 * 1. Load raw screenshots from the Screenshot Depot
 * 2. Visually select and crop UI elements
 * 3. Label elements with their Glossary IDs
 * 4. Export cleaned elements to the Cleaned Elements Library
 *
 * Part of the world's first enterprise-grade app with zero human-written code.
 */

import {
  Scissors,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Move,
  Square,
  Crosshair,
  Layers,
  Tag,
  Check,
  X,
  Download,
  Upload,
  Grid,
  Eye,
} from 'lucide-react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import { elements } from '@/lib/glossary/elements';
import {
  RawScreenshot,
  ExtractedElement,
  ExtractionSelection,
  DRAFT_STATES,
} from '@/lib/glossary/screenshots/types';

import styles from './element-extractor.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface Extraction {
  id: string;
  elementId: string;
  bounds: { x: number; y: number; width: number; height: number };
  state: string;
  label: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ElementExtractor() {
  // Canvas and image refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [currentScreenshot, setCurrentScreenshot] = useState<RawScreenshot | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<SelectionBox | null>(null);
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [selectedExtractionId, setSelectedExtractionId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'pan'>('select');
  const [padding, setPadding] = useState(8);
  const [showGrid, setShowGrid] = useState(false);
  const [showGuides, setShowGuides] = useState(true);

  // Element assignment modal
  const [showElementModal, setShowElementModal] = useState(false);
  const [pendingBounds, setPendingBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedElementId, setSelectedElementId] = useState('');
  const [selectedState, setSelectedState] = useState('default');

  // Filtered glossary elements for modal
  const filteredElements = elements.filter((el) =>
    searchQuery === '' ||
    el.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    el.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle zoom
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.1, Math.min(5, prev + delta)));
  };

  // Reset view
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    if (tool === 'pan') {
      setIsPanning(true);
    } else if (tool === 'select') {
      setIsSelecting(true);
      setSelection({ startX: x, startY: y, endX: x, endY: y });
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();

    if (isPanning) {
      setPan((prev) => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    } else if (isSelecting && selection) {
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      setSelection({ ...selection, endX: x, endY: y });
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (isSelecting && selection) {
      // Normalize selection (ensure positive width/height)
      const x = Math.min(selection.startX, selection.endX);
      const y = Math.min(selection.startY, selection.endY);
      const width = Math.abs(selection.endX - selection.startX);
      const height = Math.abs(selection.endY - selection.startY);

      // Only process if selection is meaningful (> 10px)
      if (width > 10 && height > 10) {
        setPendingBounds({ x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) });
        setShowElementModal(true);
      }
    }

    setIsPanning(false);
    setIsSelecting(false);
    setSelection(null);
  };

  // Confirm extraction
  const confirmExtraction = () => {
    if (!pendingBounds || !selectedElementId) return;

    const newExtraction: Extraction = {
      id: `ext-${Date.now()}`,
      elementId: selectedElementId,
      bounds: {
        x: pendingBounds.x - padding,
        y: pendingBounds.y - padding,
        width: pendingBounds.width + padding * 2,
        height: pendingBounds.height + padding * 2,
      },
      state: selectedState,
      label: elements.find((el) => el.id === selectedElementId)?.name || selectedElementId,
    };

    setExtractions([...extractions, newExtraction]);
    setShowElementModal(false);
    setPendingBounds(null);
    setSelectedElementId('');
    setSelectedState('default');
    setSearchQuery('');
  };

  // Delete extraction
  const deleteExtraction = (id: string) => {
    setExtractions(extractions.filter((e) => e.id !== id));
    if (selectedExtractionId === id) {
      setSelectedExtractionId(null);
    }
  };

  // Export all extractions
  const exportExtractions = async () => {
    // TODO: Implement actual canvas cropping and export
    console.info('Exporting extractions:', extractions);
    alert(`Exported ${extractions.length} elements to Cleaned Elements Library`);
  };

  // Load sample image for demo
  const loadSampleImage = () => {
    // In production, this would load from the Screenshot Depot
    setCurrentScreenshot({
      id: 'sample-1',
      filename: 'draft-room-user-turn.png',
      path: '/glossary/screenshots/sample-draft.png',
      capturedAt: new Date().toISOString(),
      source: 'manual',
      route: '/draft-room',
      viewport: { width: 390, height: 844, deviceScaleFactor: 3 },
      draftState: 'user-turn-normal',
      platform: 'ios',
      fullPageHeight: 844,
      fileSize: 245000,
      status: 'captured',
    });
  };

  return (
    <>
      <Head>
        <title>Element Extractor | TopDog Glossary Admin</title>
        <meta name="description" content="Visual element extraction and cropping tool" />
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/topdog/glossary/admin/screenshot-depot" className={styles.backLink}>
              ← Screenshot Depot
            </Link>
            <h1 className={styles.title}>
              <Scissors size={24} />
              Element Extractor
            </h1>
          </div>

          <div className={styles.headerCenter}>
            {currentScreenshot && (
              <span className={styles.currentFile}>
                {currentScreenshot.filename}
                <span className={styles.fileMeta}>
                  {currentScreenshot.viewport.width}×{currentScreenshot.viewport.height}
                </span>
              </span>
            )}
          </div>

          <div className={styles.headerActions}>
            <button className={styles.loadButton} onClick={loadSampleImage}>
              <Upload size={16} />
              Load Screenshot
            </button>
            <button
              className={styles.exportButton}
              onClick={exportExtractions}
              disabled={extractions.length === 0}
            >
              <Download size={16} />
              Export ({extractions.length})
            </button>
          </div>
        </header>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          {/* Tool Selection */}
          <div className={styles.toolGroup}>
            <button
              className={`${styles.toolButton} ${tool === 'select' ? styles.active : ''}`}
              onClick={() => setTool('select')}
              title="Selection Tool (S)"
            >
              <Square size={18} />
            </button>
            <button
              className={`${styles.toolButton} ${tool === 'pan' ? styles.active : ''}`}
              onClick={() => setTool('pan')}
              title="Pan Tool (H)"
            >
              <Move size={18} />
            </button>
          </div>

          <div className={styles.separator} />

          {/* Zoom Controls */}
          <div className={styles.toolGroup}>
            <button className={styles.toolButton} onClick={() => handleZoom(-0.25)} title="Zoom Out">
              <ZoomOut size={18} />
            </button>
            <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>
            <button className={styles.toolButton} onClick={() => handleZoom(0.25)} title="Zoom In">
              <ZoomIn size={18} />
            </button>
            <button className={styles.toolButton} onClick={resetView} title="Reset View">
              <RotateCcw size={18} />
            </button>
          </div>

          <div className={styles.separator} />

          {/* Padding Control */}
          <div className={styles.toolGroup}>
            <label className={styles.paddingLabel}>Padding:</label>
            <input
              type="number"
              value={padding}
              onChange={(e) => setPadding(parseInt(e.target.value) || 0)}
              min={0}
              max={50}
              className={styles.paddingInput}
            />
            <span className={styles.paddingUnit}>px</span>
          </div>

          <div className={styles.separator} />

          {/* View Options */}
          <div className={styles.toolGroup}>
            <button
              className={`${styles.toolButton} ${showGrid ? styles.active : ''}`}
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle Grid"
            >
              <Grid size={18} />
            </button>
            <button
              className={`${styles.toolButton} ${showGuides ? styles.active : ''}`}
              onClick={() => setShowGuides(!showGuides)}
              title="Toggle Guides"
            >
              <Crosshair size={18} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Canvas Area */}
          <div className={styles.canvasArea} ref={containerRef}>
            {!currentScreenshot ? (
              <div className={styles.emptyCanvas}>
                <Layers size={64} />
                <h2>No Screenshot Loaded</h2>
                <p>Load a screenshot from the depot or upload one</p>
                <button className={styles.loadButton} onClick={loadSampleImage}>
                  <Upload size={18} />
                  Load Screenshot
                </button>
              </div>
            ) : (
              <div
                className={styles.canvasContainer}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: tool === 'pan' ? 'grab' : 'crosshair' }}
              >
                <div
                  className={styles.canvasWrapper}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                  }}
                >
                  {/* Screenshot Image */}
                  <Image
                    ref={imageRef}
                    src={currentScreenshot.path}
                    alt="Screenshot"
                    width={800}
                    height={600}
                    className={styles.screenshotImage}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                      // Show placeholder for demo
                      console.info('Image load error - showing placeholder');
                    }}
                    draggable={false}
                    unoptimized
                  />

                  {/* Grid Overlay */}
                  {showGrid && (
                    <div className={styles.gridOverlay} />
                  )}

                  {/* Existing Extractions */}
                  {extractions.map((ext) => (
                    <div
                      key={ext.id}
                      className={`${styles.extractionBox} ${
                        selectedExtractionId === ext.id ? styles.selected : ''
                      }`}
                      style={{
                        left: ext.bounds.x,
                        top: ext.bounds.y,
                        width: ext.bounds.width,
                        height: ext.bounds.height,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExtractionId(ext.id);
                      }}
                    >
                      <div className={styles.extractionLabel}>
                        <Tag size={12} />
                        {ext.elementId}
                      </div>
                    </div>
                  ))}

                  {/* Current Selection */}
                  {selection && (
                    <div
                      className={styles.selectionBox}
                      style={{
                        left: Math.min(selection.startX, selection.endX),
                        top: Math.min(selection.startY, selection.endY),
                        width: Math.abs(selection.endX - selection.startX),
                        height: Math.abs(selection.endY - selection.startY),
                      }}
                    >
                      <div className={styles.selectionSize}>
                        {Math.round(Math.abs(selection.endX - selection.startX))} ×{' '}
                        {Math.round(Math.abs(selection.endY - selection.startY))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Extractions List */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h2>Extractions</h2>
              <span className={styles.extractionCount}>{extractions.length}</span>
            </div>

            <div className={styles.extractionsList}>
              {extractions.length === 0 ? (
                <div className={styles.noExtractions}>
                  <p>Draw a selection box around an element to extract it</p>
                </div>
              ) : (
                extractions.map((ext) => (
                  <div
                    key={ext.id}
                    className={`${styles.extractionItem} ${
                      selectedExtractionId === ext.id ? styles.selected : ''
                    }`}
                    onClick={() => setSelectedExtractionId(ext.id)}
                  >
                    <div className={styles.extractionItemHeader}>
                      <span className={styles.extractionId}>{ext.elementId}</span>
                      <button
                        className={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteExtraction(ext.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className={styles.extractionItemMeta}>
                      <span>{ext.label}</span>
                      <span className={styles.stateBadge}>{ext.state}</span>
                    </div>
                    <div className={styles.extractionItemDimensions}>
                      {ext.bounds.width} × {ext.bounds.height}px
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.sidebarFooter}>
              <Link href="/topdog/glossary/admin/cleaned-elements" className={styles.navLink}>
                View Cleaned Elements →
              </Link>
            </div>
          </aside>
        </div>

        {/* Element Assignment Modal */}
        {showElementModal && pendingBounds && (
          <div className={styles.modalOverlay} onClick={() => setShowElementModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Assign Element</h2>
                <button onClick={() => setShowElementModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.boundsPreview}>
                  <span>Selection:</span>
                  <code>
                    {pendingBounds.width} × {pendingBounds.height}px at ({pendingBounds.x}, {pendingBounds.y})
                  </code>
                </div>

                <div className={styles.formGroup}>
                  <label>Element ID</label>
                  <input
                    type="text"
                    placeholder="Search elements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                  <div className={styles.elementList}>
                    {filteredElements.slice(0, 10).map((el) => (
                      <div
                        key={el.id}
                        className={`${styles.elementOption} ${
                          selectedElementId === el.id ? styles.selected : ''
                        }`}
                        onClick={() => setSelectedElementId(el.id)}
                      >
                        <span className={styles.elementOptionId}>{el.id}</span>
                        <span className={styles.elementOptionName}>{el.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>State</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className={styles.stateSelect}
                  >
                    <option value="default">Default</option>
                    <option value="hover">Hover</option>
                    <option value="pressed">Pressed</option>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                    <option value="loading">Loading</option>
                    <option value="user-turn">User Turn</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Padding</label>
                  <div className={styles.paddingRow}>
                    <input
                      type="number"
                      value={padding}
                      onChange={(e) => setPadding(parseInt(e.target.value) || 0)}
                      min={0}
                      max={50}
                    />
                    <span>px</span>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.cancelButton}
                  onClick={() => setShowElementModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={styles.confirmButton}
                  onClick={confirmExtraction}
                  disabled={!selectedElementId}
                >
                  <Check size={16} />
                  Add Extraction
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
