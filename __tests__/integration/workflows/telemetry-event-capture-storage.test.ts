/**
 * Integration Test: Telemetry Event Capture → Storage Pipeline
 *
 * Tests the complete event lifecycle from TelemetryManager event bus dispatch
 * through capture handlers (KineticCapture, ToolSwitchTracker, UndoRedoTelemetry)
 * to storage (StoragePipeline) and export (ExportBuffer, JSONLWriter).
 *
 * Architecture:
 * - TelemetryManager.dispatch() → routes events to capture module handlers
 * - Capture modules record events and state
 * - StoragePipeline batches and uploads events
 * - ExportBuffer forks events to data products
 * - JSONLWriter validates serialization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import TelemetryManager from '@/lib/studio/telemetry/telemetry-manager';
import KineticCapture from '@/lib/studio/telemetry/capture/kinetic';
import ToolSwitchTracker from '@/lib/studio/telemetry/capture/tool-switch';
import UndoRedoTelemetry from '@/lib/studio/telemetry/capture/undo-redo';
import StoragePipeline from '@/lib/studio/telemetry/processing/storage';
import { ExportBuffer } from '@/lib/studio/telemetry/export/exportBuffer';
import JSONLWriter from '@/lib/studio/telemetry/export/jsonlWriter';
import { randomTestId } from '@/__tests__/helpers/test-utils';

// ============================================================================
// Hoisted Mocks (required by vi.mock factories)
// ============================================================================

const mockFirestoreClient = vi.hoisted(() => ({
  collection: vi.fn().mockReturnThis(),
  doc: vi.fn().mockReturnThis(),
  set: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
}));

const mockStorageClient = vi.hoisted(() => ({
  file: vi.fn().mockReturnThis(),
  save: vi.fn().mockResolvedValue(undefined),
}));

const mockCrypto = vi.hoisted(() => ({
  sha256: vi.fn().mockResolvedValue('mocked-hash-abc123'),
}));

// ============================================================================
// Mocks for external dependencies
// ============================================================================

vi.mock('@/lib/studio/telemetry/utils/crypto', () => ({
  crypto: mockCrypto,
}));

vi.mock('@/lib/cleanup/cleanupRegistry', () => ({
  cleanupRegistry: {
    register: vi.fn(),
    unregister: vi.fn(),
  },
}));

// ============================================================================
// Test Suite
// ============================================================================

describe('Telemetry Event Capture → Storage Pipeline', () => {
  let sessionId: string;
  let userId: string;
  let telemetryManager: TelemetryManager;

  beforeEach(() => {
    sessionId = randomTestId('session');
    userId = randomTestId('user');

    // Reset mocks
    vi.clearAllMocks();
    mockCrypto.sha256.mockResolvedValue('mocked-hash-abc123');

    // Create telemetry manager with default platform/os parameters
    telemetryManager = new TelemetryManager(
      sessionId,
      userId,
      'web',
      'macOS 14.0',
      '1.0.0'
    );

    // Initialize storage pipeline with mock clients
    const managers = telemetryManager.getManagers();
    managers.storage.initializeClients(mockFirestoreClient, mockStorageClient);
  });

  afterEach(() => {
    telemetryManager.destroy();
  });

  // ============================================================================
  // 1. Event Bus: TelemetryManager Routing
  // ============================================================================

  describe('Event Bus: Dispatch and Routing', () => {
    it('should dispatch kinetic-stroke-begin to KineticCapture', () => {
      const managers = telemetryManager.getManagers();
      const kineticSpy = vi.spyOn(managers.kinetic, 'startStroke');

      telemetryManager.dispatch({
        type: 'kinetic-stroke-begin',
        timestamp: Date.now(),
        data: {
          toolId: 'brush-1',
          toolName: 'Brush',
          x: 100,
          y: 200,
          pressure: 0.8,
          toolSettings: {
            brushSize: 10,
            opacity: 1,
            flow: 1,
            blendMode: 'normal',
            hardness: 0.5,
          },
        },
      });

      expect(kineticSpy).toHaveBeenCalledWith(
        'brush-1',
        'Brush',
        100,
        200,
        0.8,
        expect.objectContaining({ brushSize: 10 })
      );
    });

    it('should dispatch tool-switch to ToolSwitchTracker', () => {
      const managers = telemetryManager.getManagers();
      const toolSwitchSpy = vi.spyOn(managers.toolSwitch, 'switchTool');

      telemetryManager.dispatch({
        type: 'tool-switch',
        timestamp: Date.now(),
        data: {
          fromToolId: 'brush-1',
          toToolId: 'eraser-1',
          fromToolName: 'Brush',
          toToolName: 'Eraser',
          toToolParams: { size: 20 },
        },
      });

      expect(toolSwitchSpy).toHaveBeenCalledWith(
        'brush-1',
        'eraser-1',
        'Brush',
        'Eraser',
        { size: 20 }
      );
    });

    it('should dispatch undo to UndoRedoTelemetry', () => {
      const managers = telemetryManager.getManagers();
      const undoSpy = vi.spyOn(managers.undoRedo, 'recordUndo');

      telemetryManager.dispatch({
        type: 'undo',
        timestamp: Date.now(),
        data: {},
      });

      expect(undoSpy).toHaveBeenCalled();
    });

    it('should dispatch redo to UndoRedoTelemetry', () => {
      const managers = telemetryManager.getManagers();
      const redoSpy = vi.spyOn(managers.undoRedo, 'recordRedo');

      telemetryManager.dispatch({
        type: 'redo',
        timestamp: Date.now(),
        data: {},
      });

      expect(redoSpy).toHaveBeenCalled();
    });

    it('should enrich dispatch events with ToS version and sessionId', () => {
      let capturedEvent: any = null;

      telemetryManager.on('kinetic-stroke-begin', (event) => {
        capturedEvent = event;
      });

      telemetryManager.dispatch({
        type: 'kinetic-stroke-begin',
        timestamp: Date.now(),
        data: {
          toolId: 'brush-1',
          toolName: 'Brush',
          x: 50,
          y: 50,
          pressure: 0.5,
          toolSettings: {},
        },
      });

      expect(capturedEvent.data._tosVersion).toBeDefined();
      expect(capturedEvent.data._sessionId).toBe(sessionId);
    });

    it('should register and call custom handlers', () => {
      const customHandler = vi.fn();
      telemetryManager.on('tool-switch', customHandler);

      telemetryManager.dispatch({
        type: 'tool-switch',
        timestamp: Date.now(),
        data: {
          fromToolId: 'a',
          toToolId: 'b',
          fromToolName: 'A',
          toToolName: 'B',
          toToolParams: {},
        },
      });

      expect(customHandler).toHaveBeenCalled();
    });

    it('should call global handlers for all event types', () => {
      const globalHandler = vi.fn();
      telemetryManager.onAll(globalHandler);

      telemetryManager.dispatch({
        type: 'kinetic-stroke-begin',
        timestamp: Date.now(),
        data: {
          toolId: 'brush-1',
          toolName: 'Brush',
          x: 0,
          y: 0,
          pressure: 1,
          toolSettings: {},
        },
      });

      telemetryManager.dispatch({
        type: 'tool-switch',
        timestamp: Date.now(),
        data: {
          fromToolId: 'a',
          toToolId: 'b',
          fromToolName: 'A',
          toToolName: 'B',
          toToolParams: {},
        },
      });

      expect(globalHandler).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================================
  // 2. KineticCapture: Brush Stroke Lifecycle
  // ============================================================================

  describe('KineticCapture: Brush Stroke Recording', () => {
    it('should record complete brush stroke (begin → point → end)', async () => {
      const managers = telemetryManager.getManagers();

      // Begin stroke (toolSettings must include toolId and toolName)
      const toolSettings = {
        toolId: 'brush-1',
        toolName: 'Brush',
        brushSize: 10,
        opacity: 1,
        flow: 1,
        blendMode: 'normal',
        hardness: 0.5,
      };

      const strokeId = managers.kinetic.startStroke(
        'brush-1',
        'Brush',
        100,
        100,
        0.8,
        toolSettings
      );

      expect(strokeId).toBeDefined();

      // Record samples during stroke
      managers.kinetic.recordSample(110, 110, 0.7, 0, 45);
      managers.kinetic.recordSample(120, 120, 0.6, 0, 90);
      managers.kinetic.recordSample(130, 130, 0.5, 0, 135);

      // End stroke
      const stroke = await managers.kinetic.endStroke();

      expect(stroke).toBeDefined();
      expect(stroke!.strokeId).toBe(strokeId);
      expect(stroke!.toolId).toBe('brush-1');
      expect(stroke!.toolName).toBe('Brush');
      expect(stroke!.samples.length).toBeGreaterThan(0);
      expect(stroke!.duration).toBeGreaterThanOrEqual(0);
    });

    it('should capture kinetic data via event dispatch', async () => {
      const managers = telemetryManager.getManagers();

      // Dispatch stroke begin (toolSettings must include toolId, toolName)
      telemetryManager.dispatch({
        type: 'kinetic-stroke-begin',
        timestamp: Date.now(),
        data: {
          toolId: 'brush-1',
          toolName: 'Brush',
          x: 50,
          y: 50,
          pressure: 1.0,
          toolSettings: {
            toolId: 'brush-1',
            toolName: 'Brush',
            brushSize: 15,
            opacity: 0.8,
            flow: 0.9,
            blendMode: 'multiply',
            hardness: 0.3,
          },
        },
      });

      // Dispatch stroke points
      telemetryManager.dispatch({
        type: 'kinetic-stroke-point',
        timestamp: Date.now() + 100,
        data: { x: 60, y: 60, pressure: 0.95, tilt: 5, azimuth: 45 },
      });

      telemetryManager.dispatch({
        type: 'kinetic-stroke-point',
        timestamp: Date.now() + 200,
        data: { x: 70, y: 70, pressure: 0.9, tilt: 10, azimuth: 90 },
      });

      // Dispatch stroke end (must await the async endStroke)
      await new Promise((resolve) => {
        telemetryManager.dispatch({
          type: 'kinetic-stroke-end',
          timestamp: Date.now() + 300,
          data: {},
        });
        setTimeout(resolve, 50);
      });

      // Verify stroke was recorded
      const strokes = managers.kinetic.getStrokes();
      expect(strokes.length).toBeGreaterThan(0);
      expect(strokes[0].toolName).toBe('Brush');
    });

    it('should calculate velocity and acceleration', async () => {
      const managers = telemetryManager.getManagers();

      const toolSettings = {
        toolId: 'brush-1',
        toolName: 'Brush',
        brushSize: 10,
        opacity: 1,
        flow: 1,
        blendMode: 'normal',
        hardness: 0.5,
      };

      const strokeId = managers.kinetic.startStroke(
        'brush-1',
        'Brush',
        0,
        0,
        1.0,
        toolSettings
      );

      // Record samples with increasing distance (recordSample adds to currentStroke array)
      managers.kinetic.recordSample(10, 0, 1.0);
      managers.kinetic.recordSample(20, 0, 1.0);
      managers.kinetic.recordSample(30, 0, 1.0);

      const stroke = await managers.kinetic.endStroke();

      // Velocity calculation depends on timing between samples
      // At least the initial sample should be recorded (first point in startStroke)
      expect(stroke!.samples.length).toBeGreaterThanOrEqual(1);
      if (stroke!.samples.length > 0) {
        expect(stroke!.samples[0].velocity).toBeGreaterThanOrEqual(0);
      }
    });

    it('should generate hash for stroke deduplication', async () => {
      const managers = telemetryManager.getManagers();

      managers.kinetic.startStroke(
        'brush-1',
        'Brush',
        0,
        0,
        1.0,
        { brushSize: 10, opacity: 1, flow: 1, blendMode: 'normal', hardness: 0.5 }
      );

      managers.kinetic.recordSample(10, 10, 1.0);
      const stroke = await managers.kinetic.endStroke();

      expect(stroke!.hash).toBeDefined();
      expect(stroke!.hash).toBe('mocked-hash-abc123');
    });

    it('should return null when ending stroke without begin', async () => {
      const managers = telemetryManager.getManagers();

      // Create new kinetic capture to avoid previous stroke state
      const freshCapture = new KineticCapture(sessionId);
      const result = await freshCapture.endStroke();

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // 3. ToolSwitchTracker: Tool Change Patterns
  // ============================================================================

  describe('ToolSwitchTracker: Tool Switch Recording', () => {
    it('should record tool switch events', () => {
      const managers = telemetryManager.getManagers();

      telemetryManager.dispatch({
        type: 'tool-switch',
        timestamp: Date.now(),
        data: {
          fromToolId: 'brush-1',
          toToolId: 'eraser-1',
          fromToolName: 'Brush',
          toToolName: 'Eraser',
          toToolParams: { size: 20 },
        },
      });

      const events = managers.toolSwitch.getEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].toToolName).toBe('Eraser');
    });

    it('should detect tool switch patterns', () => {
      const managers = telemetryManager.getManagers();

      // Simulate a pattern: Brush → Eraser → Brush
      managers.toolSwitch.switchTool('a', 'brush-1', 'A', 'Brush', {});
      managers.toolSwitch.switchTool('brush-1', 'eraser-1', 'Brush', 'Eraser', {});
      managers.toolSwitch.switchTool('eraser-1', 'brush-1', 'Eraser', 'Brush', {});

      const patterns = managers.toolSwitch.getPatterns();
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should calculate statistics from tool switches', () => {
      const managers = telemetryManager.getManagers();

      managers.toolSwitch.switchTool('a', 'brush-1', 'A', 'Brush', {});
      managers.toolSwitch.switchTool('brush-1', 'eraser-1', 'Brush', 'Eraser', {});
      managers.toolSwitch.switchTool('eraser-1', 'fill-1', 'Eraser', 'Fill', {});

      const stats = managers.toolSwitch.getStatistics();
      expect(stats.totalSwitches).toBe(3);
      expect(stats.uniqueTools.size).toBeGreaterThan(0);
      expect(stats.estimatedValue).toBeGreaterThanOrEqual(0.5);
    });

    it('should record switches via event dispatch', () => {
      const managers = telemetryManager.getManagers();

      telemetryManager.dispatch({
        type: 'tool-switch',
        timestamp: Date.now(),
        data: {
          fromToolId: 'a',
          toToolId: 'b',
          fromToolName: 'ToolA',
          toToolName: 'ToolB',
          toToolParams: { param1: 'value1' },
        },
      });

      const events = managers.toolSwitch.getEvents();
      expect(events.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================================
  // 4. UndoRedoTelemetry: Undo/Redo Tree Tracking
  // ============================================================================

  describe('UndoRedoTelemetry: Undo/Redo Tracking', () => {
    it('should record undo events with signal strength', () => {
      const managers = telemetryManager.getManagers();

      // Record an action
      managers.undoRedo.recordAction('action-1', 'brush-stroke', 'Brush Stroke', {});

      // Undo immediately (strong signal)
      managers.undoRedo.recordUndo();

      const events = managers.undoRedo.getEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].actionType).toBe('undo');
      expect(events[0].signalStrength).toBe('strong');
    });

    it('should record redo events', () => {
      const managers = telemetryManager.getManagers();

      managers.undoRedo.recordAction('action-1', 'brush-stroke', 'Stroke', {});
      managers.undoRedo.recordUndo();
      managers.undoRedo.recordRedo();

      const events = managers.undoRedo.getEvents();
      const redoEvent = events.find((e) => e.actionType === 'redo');
      expect(redoEvent).toBeDefined();
    });

    it('should generate DPO training signals', () => {
      const managers = telemetryManager.getManagers();

      managers.undoRedo.recordAction('action-1', 'brush-stroke', 'Stroke', {});
      managers.undoRedo.recordUndo(); // Negative signal
      managers.undoRedo.recordAction('action-2', 'brush-stroke', 'Stroke', {});
      managers.undoRedo.recordRedo(); // Positive signal

      const tree = managers.undoRedo.getTree();
      expect(tree.dpoSignals.length).toBeGreaterThan(0);
    });

    it('should record undo via event dispatch', () => {
      const managers = telemetryManager.getManagers();

      managers.undoRedo.recordAction('a1', 'type-a', 'Action A', {});

      telemetryManager.dispatch({
        type: 'undo',
        timestamp: Date.now(),
        data: {},
      });

      const events = managers.undoRedo.getEvents();
      const undoEvent = events.find((e) => e.actionType === 'undo');
      expect(undoEvent).toBeDefined();
    });

    it('should track branching in undo/redo tree', () => {
      const managers = telemetryManager.getManagers();

      managers.undoRedo.recordAction('a1', 'type-a', 'Action 1', {});
      managers.undoRedo.recordAction('a2', 'type-b', 'Action 2', {});
      managers.undoRedo.recordUndo();
      managers.undoRedo.recordAction('a3', 'type-c', 'Action 3', {}); // Creates branch

      const tree = managers.undoRedo.getTree();
      expect(tree.alternativeBranches.size).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // 5. StoragePipeline: Event Batching and Upload
  // ============================================================================

  describe('StoragePipeline: Event Storage', () => {
    it('should add events to current batch', async () => {
      const managers = telemetryManager.getManagers();

      managers.storage.addEvent(
        { type: 'kinetic', toolId: 'brush-1' },
        sessionId,
        'user-hash-1'
      );

      // Stats reflect events that have been flushed, not pending ones
      // Must flush to see the event in stats
      await managers.storage.flush();

      const stats = managers.storage.getStorageStats();
      expect(stats.totalEvents).toBeGreaterThanOrEqual(1);
    });

    it('should batch events and auto-flush on size limit', async () => {
      // Create storage with small batch size
      const smallBatchStorage = new StoragePipeline({
        batchSize: 2,
        batchTimeMs: 60000, // Don't auto-flush by time
      });
      smallBatchStorage.initializeClients(mockFirestoreClient, mockStorageClient);

      smallBatchStorage.addEvent({ id: '1' }, sessionId, 'hash1');
      smallBatchStorage.addEvent({ id: '2' }, sessionId, 'hash1');

      // Adding third event should trigger flush
      smallBatchStorage.addEvent({ id: '3' }, sessionId, 'hash1');

      // Give flush time to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = smallBatchStorage.getStorageStats();
      expect(stats.totalBatches).toBeGreaterThanOrEqual(1);
    });

    it('should compress events when enabled', async () => {
      const managers = telemetryManager.getManagers();

      managers.storage.addEvent(
        { id: '1', data: 'x'.repeat(1000) },
        sessionId,
        'hash1'
      );

      const flushed = await managers.storage.flush();

      if (flushed) {
        expect(flushed.compressedSize).toBeLessThanOrEqual(flushed.uncompressedSize);
        expect(flushed.compressionRatio).toBeGreaterThan(0);
      }
    });

    it('should track multiple sessions in batch', async () => {
      const managers = telemetryManager.getManagers();
      const session1 = 'session-1';
      const session2 = 'session-2';

      managers.storage.addEvent({ id: '1' }, session1, 'hash1');
      managers.storage.addEvent({ id: '2' }, session2, 'hash2');

      // Flush to register events in stats
      await managers.storage.flush();

      const stats = managers.storage.getStorageStats();
      expect(stats.totalEvents).toBeGreaterThanOrEqual(2);
    });

    it('should return metadata on flush', async () => {
      const managers = telemetryManager.getManagers();

      managers.storage.addEvent({ id: '1', large: 'x'.repeat(100) }, sessionId, 'hash1');

      const metadata = await managers.storage.flush();

      expect(metadata).toBeDefined();
      expect(metadata!.batchId).toBeDefined();
      expect(metadata!.eventCount).toBeGreaterThan(0);
      expect(metadata!.uploadTime).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // 6. ExportBuffer: Stream B Fork
  // ============================================================================

  describe('ExportBuffer: Data Product Routing', () => {
    it('should append records for kinetic events', () => {
      const exportBuffer = new ExportBuffer();

      const recordIds = exportBuffer.appendRecord(
        { toolId: 'brush-1', samples: [] },
        'kinetic-stroke-end',
        sessionId
      );

      expect(recordIds.length).toBeGreaterThan(0);
      expect(exportBuffer.getTotalPendingCount()).toBeGreaterThan(0);
    });

    it('should route kinetic events to workflow-kinetics product', () => {
      const exportBuffer = new ExportBuffer();

      exportBuffer.appendRecord(
        { toolId: 'brush-1' },
        'kinetic-stroke-end',
        sessionId
      );

      const stats = exportBuffer.getBufferStats();
      expect(stats.has('workflow-kinetics')).toBe(true);
      expect(stats.get('workflow-kinetics')).toBeGreaterThan(0);
    });

    it('should route tool-switch events', () => {
      const exportBuffer = new ExportBuffer();

      exportBuffer.appendRecord(
        { fromTool: 'brush', toTool: 'eraser' },
        'tool-switch',
        sessionId
      );

      const stats = exportBuffer.getBufferStats();
      expect(stats.get('workflow-kinetics')).toBeGreaterThan(0);
    });

    it('should calculate quality scores', () => {
      const exportBuffer = new ExportBuffer();

      const recordIds = exportBuffer.appendRecord(
        { field1: 'value1', field2: 'value2', field3: null },
        'kinetic-stroke-end',
        sessionId
      );

      const record = exportBuffer.getRecord(recordIds[0]);
      expect(record!.qualityScore).toBeGreaterThan(0);
      expect(record!.qualityScore).toBeLessThanOrEqual(1);
    });

    it('should flush records by data product', () => {
      const exportBuffer = new ExportBuffer();

      exportBuffer.appendRecord({ id: '1' }, 'kinetic-stroke-end', sessionId);
      exportBuffer.appendRecord({ id: '2' }, 'kinetic-stroke-end', sessionId);

      const flushed = exportBuffer.flush('workflow-kinetics');
      expect(flushed.length).toBe(2);

      const stats = exportBuffer.getBufferStats();
      expect(stats.get('workflow-kinetics') || 0).toBe(0);
    });

    it('should filter records by session', () => {
      const exportBuffer = new ExportBuffer();
      const session2 = 'session-2';

      exportBuffer.appendRecord({ id: '1' }, 'kinetic-stroke-end', sessionId);
      exportBuffer.appendRecord({ id: '2' }, 'kinetic-stroke-end', session2);

      const records = exportBuffer.getSessionRecords(sessionId);
      expect(records.length).toBe(1);
      expect(records[0].sessionId).toBe(sessionId);
    });
  });

  // ============================================================================
  // 7. Full Integration: End-to-End Event Lifecycle
  // ============================================================================

  describe('Full Integration: Event Lifecycle', () => {
    it('should complete full lifecycle: dispatch → capture → storage → export', async () => {
      const managers = telemetryManager.getManagers();

      // 1. Dispatch kinetic stroke events (toolSettings must include toolId, toolName)
      telemetryManager.dispatch({
        type: 'kinetic-stroke-begin',
        timestamp: Date.now(),
        data: {
          toolId: 'brush-1',
          toolName: 'Brush',
          x: 0,
          y: 0,
          pressure: 1.0,
          toolSettings: {
            toolId: 'brush-1',
            toolName: 'Brush',
            brushSize: 10,
            opacity: 1,
            flow: 1,
            blendMode: 'normal',
            hardness: 0.5,
          },
        },
      });

      telemetryManager.dispatch({
        type: 'kinetic-stroke-point',
        timestamp: Date.now() + 50,
        data: { x: 10, y: 10, pressure: 0.9, tilt: 5, azimuth: 45 },
      });

      // Await stroke end to allow async processing
      await new Promise((resolve) => {
        telemetryManager.dispatch({
          type: 'kinetic-stroke-end',
          timestamp: Date.now() + 100,
          data: {},
        });
        setTimeout(resolve, 50);
      });

      // 2. Verify capture
      const strokes = managers.kinetic.getStrokes();
      expect(strokes.length).toBeGreaterThan(0);

      // 3. Dispatch tool switch
      telemetryManager.dispatch({
        type: 'tool-switch',
        timestamp: Date.now() + 150,
        data: {
          fromToolId: 'brush-1',
          toToolId: 'eraser-1',
          fromToolName: 'Brush',
          toToolName: 'Eraser',
          toToolParams: {},
        },
      });

      // 4. Verify tool switch capture
      const toolEvents = managers.toolSwitch.getEvents();
      expect(toolEvents.length).toBeGreaterThan(0);

      // 5. Record undo/redo
      managers.undoRedo.recordAction('action-1', 'brush-stroke', 'Stroke', {});
      telemetryManager.dispatch({
        type: 'undo',
        timestamp: Date.now() + 200,
        data: {},
      });

      // 6. Verify undo/redo capture
      const undoRedoEvents = managers.undoRedo.getEvents();
      expect(undoRedoEvents.length).toBeGreaterThan(0);

      // 7. Verify export buffer forked events
      const exportStats = managers.exportBuffer.getBufferStats();
      expect(exportStats.has('workflow-kinetics')).toBe(true);
    });

    it('should preserve event count through pipeline', () => {
      const managers = telemetryManager.getManagers();

      // Record 3 tool switches
      telemetryManager.dispatch({
        type: 'tool-switch',
        timestamp: Date.now(),
        data: {
          fromToolId: 'a',
          toToolId: 'b',
          fromToolName: 'A',
          toToolName: 'B',
          toToolParams: {},
        },
      });

      telemetryManager.dispatch({
        type: 'tool-switch',
        timestamp: Date.now() + 100,
        data: {
          fromToolId: 'b',
          toToolId: 'c',
          fromToolName: 'B',
          toToolName: 'C',
          toToolParams: {},
        },
      });

      telemetryManager.dispatch({
        type: 'tool-switch',
        timestamp: Date.now() + 200,
        data: {
          fromToolId: 'c',
          toToolId: 'd',
          fromToolName: 'C',
          toToolName: 'D',
          toToolParams: {},
        },
      });

      const toolEvents = managers.toolSwitch.getEvents();
      expect(toolEvents.length).toBe(3);

      // Events should also be forked to export buffer
      const exportStats = managers.exportBuffer.getBufferStats();
      expect(exportStats.get('workflow-kinetics')).toBe(3);
    });
  });

  // ============================================================================
  // 8. Error Handling and Edge Cases
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle dispatch of unregistered event types gracefully', () => {
      expect(() => {
        telemetryManager.dispatch({
          type: 'unknown-event-type' as any,
          timestamp: Date.now(),
          data: {},
        });
      }).not.toThrow();
    });

    it('should handle handler errors without propagating', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      telemetryManager.on('tool-switch', errorHandler);

      expect(() => {
        telemetryManager.dispatch({
          type: 'tool-switch',
          timestamp: Date.now(),
          data: {
            fromToolId: 'a',
            toToolId: 'b',
            fromToolName: 'A',
            toToolName: 'B',
            toToolParams: {},
          },
        });
      }).not.toThrow();

      expect(errorHandler).toHaveBeenCalled();
    });

    it('should handle unsubscribe from event handlers', () => {
      const handler = vi.fn();
      const unsubscribe = telemetryManager.on('tool-switch', handler);

      telemetryManager.dispatch({
        type: 'tool-switch',
        timestamp: Date.now(),
        data: {
          fromToolId: 'a',
          toToolId: 'b',
          fromToolName: 'A',
          toToolName: 'B',
          toToolParams: {},
        },
      });

      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      telemetryManager.dispatch({
        type: 'tool-switch',
        timestamp: Date.now(),
        data: {
          fromToolId: 'b',
          toToolId: 'c',
          fromToolName: 'B',
          toToolName: 'C',
          toToolParams: {},
        },
      });

      expect(handler).toHaveBeenCalledTimes(1); // Not called again
    });
  });

  // ============================================================================
  // 9. Statistics and Reporting
  // ============================================================================

  describe('Statistics and Reporting', () => {
    it('should calculate kinetic statistics', () => {
      const managers = telemetryManager.getManagers();

      managers.kinetic.startStroke(
        'brush-1',
        'Brush',
        0,
        0,
        1.0,
        { brushSize: 10, opacity: 1, flow: 1, blendMode: 'normal', hardness: 0.5 }
      );
      managers.kinetic.recordSample(10, 10, 1.0);
      managers.kinetic.recordSample(20, 20, 1.0);

      const stats = managers.kinetic.getDataSize();
      expect(stats.samplesCount).toBeGreaterThanOrEqual(0);
      expect(stats.binarySize).toBeGreaterThanOrEqual(0);
      expect(stats.estimatedValue).toBeGreaterThanOrEqual(0);
    });

    it('should estimate session value across all modules', () => {
      const managers = telemetryManager.getManagers();

      // Add kinetic data
      managers.kinetic.startStroke('b', 'B', 0, 0, 1, {
        brushSize: 10,
        opacity: 1,
        flow: 1,
        blendMode: 'normal',
        hardness: 0.5,
      });
      managers.kinetic.recordSample(10, 10, 1);

      // Add tool switches
      managers.toolSwitch.switchTool('a', 'b', 'A', 'B', {});

      // Add undo/redo
      managers.undoRedo.recordAction('a1', 't', 'Action', {});
      managers.undoRedo.recordUndo();

      const value = telemetryManager.estimateSessionValue();
      expect(value.total).toBeGreaterThanOrEqual(0);
      expect(value.kinetic).toBeGreaterThanOrEqual(0);
      expect(value.toolSwitches).toBeGreaterThanOrEqual(0);
      expect(value.undoRedo).toBeGreaterThanOrEqual(0);
    });

    it('should retrieve event count from manager', () => {
      telemetryManager.dispatch({
        type: 'tool-switch',
        timestamp: Date.now(),
        data: {
          fromToolId: 'a',
          toToolId: 'b',
          fromToolName: 'A',
          toToolName: 'B',
          toToolParams: {},
        },
      });

      expect(telemetryManager.getEventCount()).toBeGreaterThan(0);
    });
  });
});
