import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// MOCKS - Setup all capture module imports before importing TelemetryManager
// ============================================================================

// All mocks use class-based pattern (arrow functions can't be called with `new`)
vi.mock('@/lib/studio/telemetry/capture/kinetic', () => ({
  default: class MockKineticCapture {
    startStroke = vi.fn();
    endStroke = vi.fn();
    recordSample = vi.fn();
    getStrokes = vi.fn(() => []);
    getDataSize = vi.fn(() => ({
      samplesCount: 0, binarySize: 0, estimatedValue: 0,
      samplesDropped: 0, samplesSimplified: 0,
      dataBudgetUsed: 0, dataBudgetTotal: 0,
    }));
    clear = vi.fn();
  },
}));

vi.mock('@/lib/studio/telemetry/capture/tool-switch', () => ({
  default: class MockToolSwitchTracker {
    switchTool = vi.fn();
    recordSwitch = vi.fn();
    getPatterns = vi.fn(() => []);
    getStatistics = vi.fn(() => ({ estimatedValue: 0 }));
    clear = vi.fn();
  },
}));

vi.mock('@/lib/studio/telemetry/capture/undo-redo', () => ({
  default: class MockUndoRedoTelemetry {
    recordUndo = vi.fn();
    recordRedo = vi.fn();
    recordAction = vi.fn();
    getTimingData = vi.fn(() => []);
    getDPOSignals = vi.fn(() => []);
    getStatistics = vi.fn(() => ({ estimatedValue: 0 }));
    clear = vi.fn();
  },
}));

vi.mock('@/lib/studio/telemetry/capture/cross-model', () => ({
  default: class MockCrossModelCapture {
    startComparison = vi.fn();
    recordHover = vi.fn();
    recordSelection = vi.fn();
    recordPreference = vi.fn();
    recordComparison = vi.fn();
    getPreferences = vi.fn(() => []);
    getStatistics = vi.fn(() => ({ estimatedValue: 0 }));
    clear = vi.fn();
  },
}));

vi.mock('@/lib/studio/telemetry/capture/session', () => ({
  default: class MockSessionRecorder {
    recordEvent = vi.fn();
    recordToolEvent = vi.fn();
    recordUIInteraction = vi.fn();
    recordUndo = vi.fn();
    recordRedo = vi.fn();
    recordExport = vi.fn();
    recordAIAction = vi.fn();
    recordParameterChange = vi.fn();
    recordCanvasInteraction = vi.fn();
    endSession = vi.fn(() => ({ events: [], duration: 0 }));
    getRecording = vi.fn(() => ({ events: [], duration: 0 }));
    getStatistics = vi.fn(() => ({ estimatedValue: 0 }));
    clear = vi.fn();
  },
}));

vi.mock('@/lib/studio/telemetry/processing/anonymization', () => ({
  default: class MockAnonymizationPipeline {
    anonymizeSession = vi.fn((data: any) => data);
    hashValue = vi.fn((v: string) => `hashed_${v}`);
    scrubText = vi.fn((t: string) => t);
    redactObject = vi.fn((obj: any) => obj);
    getHashedUserId = vi.fn(() => 'hashed_user');
    waitForReady = vi.fn();
  },
}));

vi.mock('@/lib/studio/telemetry/processing/storage', () => ({
  default: class MockStoragePipeline {
    addEvent = vi.fn();
    uploadBatch = vi.fn();
    archiveBatch = vi.fn();
    flush = vi.fn();
    getMetrics = vi.fn(() => ({}));
    registerPageLifecycleHandlers = vi.fn();
    unregisterPageLifecycleHandlers = vi.fn();
    destroy = vi.fn();
    clear = vi.fn();
  },
}));

vi.mock('@/lib/studio/telemetry/processing/schema-versioning', () => ({
  default: class MockSchemaVersioning {
    getCurrentVersion = vi.fn(() => '1.0.0');
    migrateForward = vi.fn();
    validate = vi.fn(() => true);
  },
}));

vi.mock('@/lib/studio/telemetry/monitoring/quality', () => ({
  default: class MockDataQualityMonitor {
    checkQuality = vi.fn(() => ({ valid: true, warnings: [] }));
    validateEvent = vi.fn(() => ({ valid: true }));
    getReport = vi.fn(() => ({ qualityScore: 1.0, totalChecks: 0, warnings: [] }));
    getHealthReport = vi.fn(() => ({ qualityScore: 1.0, totalChecks: 0, warnings: [] }));
    clear = vi.fn();
  },
}));

// ============================================================================
// 1. DOUGLAS-PEUCKER LINE SIMPLIFICATION TESTS (kinetic.ts)
// ============================================================================

describe('Douglas-Peucker Line Simplification (Pure Algorithm)', () => {
  let douglasPeucker: any;
  let perpendicularDistance: any;
  let pressureAwareSimplification: any;

  // Helper to create a sample point
  const p = (x: number, y: number, pressure = 0.5) => ({
    timestamp: 0, x, y, pressure,
    tilt: 0, azimuth: 0, velocity: 0, acceleration: 0,
  });

  beforeEach(async () => {
    // Import the REAL algorithm functions (bypassing mock)
    const real = await vi.importActual<any>('@/lib/studio/telemetry/capture/kinetic');
    douglasPeucker = real.douglasPeucker;
    perpendicularDistance = real.perpendicularDistance;
    pressureAwareSimplification = real.pressureAwareSimplification;
  });

  it('preserves endpoints for any polyline', () => {
    const samples = [p(10, 10), p(20, 20), p(30, 30)];
    const result = douglasPeucker(samples, 1.5);

    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0].x).toBe(10);
    expect(result[0].y).toBe(10);
    expect(result[result.length - 1].x).toBe(30);
    expect(result[result.length - 1].y).toBe(30);
  });

  it('reduces redundant collinear points', () => {
    // 20 points in a perfectly straight horizontal line
    const samples = Array.from({ length: 20 }, (_, i) => p(i * 10, 100));
    const result = douglasPeucker(samples, 1.5);

    // All collinear → collapsed to 2 endpoints
    expect(result.length).toBe(2);
    expect(result[0].x).toBe(0);
    expect(result[1].x).toBe(190);
  });

  it('preserves shape-defining points in V shape', () => {
    // V shape: goes down then back up — vertex at (10, 20)
    const samples = [p(0, 0), p(5, 10), p(10, 20), p(15, 10), p(20, 0)];
    const result = douglasPeucker(samples, 1.5);

    // Vertex is far from endpoint-to-endpoint line → must be preserved
    expect(result.length).toBeGreaterThanOrEqual(3);
    // The vertex at (10, 20) should be retained
    expect(result.some((s: any) => s.x === 10 && s.y === 20)).toBe(true);
  });

  it('preserves pressure transition points (pressureAwareSimplification)', () => {
    // Straight line but with a pressure jump at the midpoint
    const samples = [
      p(0, 50, 0.1), p(10, 50, 0.12), p(20, 50, 0.14),
      p(30, 50, 0.15), p(40, 50, 0.15),
      p(50, 50, 0.9), // pressure jump!
      p(60, 50, 0.9), p(70, 50, 0.9), p(80, 50, 0.9),
    ];

    const result = pressureAwareSimplification(samples, 1.5, 0.02);

    // Both sides of the transition should be preserved
    const pressures = result.map((s: any) => s.pressure);
    const hasLow = pressures.some((pr: number) => pr < 0.5);
    const hasHigh = pressures.some((pr: number) => pr > 0.5);
    expect(hasLow && hasHigh).toBe(true);
  });

  it('perpendicularDistance returns 0 for point on line', () => {
    const start = p(0, 0);
    const end = p(10, 0);
    const on = p(5, 0); // on the line

    expect(perpendicularDistance(on, start, end)).toBeCloseTo(0, 5);
  });

  it('perpendicularDistance returns correct distance for point off line', () => {
    const start = p(0, 0);
    const end = p(10, 0);
    const off = p(5, 5); // 5 units above the line

    expect(perpendicularDistance(off, start, end)).toBeCloseTo(5, 5);
  });

  it('returns input unchanged for 2 or fewer points', () => {
    const two = [p(0, 0), p(10, 10)];
    expect(douglasPeucker(two, 1.5)).toEqual(two);

    const one = [p(5, 5)];
    expect(douglasPeucker(one, 1.5)).toEqual(one);
  });
});

// ============================================================================
// 2. TELEMETRY MANAGER EVENT BUS + tosVersion ENRICHMENT
// ============================================================================

describe('TelemetryManager Event Bus', () => {
  let TelemetryManager: any;
  let manager: any;
  const testSessionId = 'test-session-12345';

  beforeEach(async () => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Dynamically import after mocks are set up
    const module = await import('@/lib/studio/telemetry/telemetry-manager');
    TelemetryManager = module.TelemetryManager;
    manager = new TelemetryManager(testSessionId, 'test-user');
  });

  afterEach(() => {
    if (manager && manager.destroy) {
      manager.destroy();
    }
  });

  it('dispatches events to type-specific handlers', () => {
    const handler = vi.fn();
    manager.on('tool-switch', handler);

    const event = {
      type: 'tool-switch',
      data: { toolId: 'brush' },
    };

    manager.dispatch(event);

    expect(handler).toHaveBeenCalledWith(expect.any(Object));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('dispatches events to global handlers', () => {
    const globalHandler = vi.fn();
    manager.onAll(globalHandler);

    const event1 = { type: 'tool-switch', data: { toolId: 'brush' } };
    const event2 = { type: 'layer-add', data: { layerId: 'layer-1' } };

    manager.dispatch(event1);
    manager.dispatch(event2);

    expect(globalHandler).toHaveBeenCalledTimes(2);
  });

  it('enriches events with _tosVersion field', (done) => {
    const handler = vi.fn((event: any) => {
      expect(event.data._tosVersion).toBe('2026-02-08-v1');
      done();
    });

    manager.on('tool-switch', handler);

    manager.dispatch({
      type: 'tool-switch',
      data: { toolId: 'brush' },
    });
  });

  it('enriches events with _sessionId field', (done) => {
    const handler = vi.fn((event: any) => {
      expect(event.data._sessionId).toBe(testSessionId);
      done();
    });

    manager.on('export', handler);

    manager.dispatch({
      type: 'export',
      data: { format: 'png' },
    });
  });

  it('unsubscribe removes handler', () => {
    const handler = vi.fn();
    const unsubscribe = manager.on('layer-add', handler);

    manager.dispatch({ type: 'layer-add', data: { layerId: 'layer-1' } });
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();

    manager.dispatch({ type: 'layer-add', data: { layerId: 'layer-2' } });
    expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
  });

  it('getEventCount tracks dispatched events', () => {
    manager.dispatch({ type: 'tool-switch', data: { toolId: 'brush' } });
    manager.dispatch({ type: 'layer-add', data: { layerId: 'layer-1' } });
    manager.dispatch({ type: 'export', data: { format: 'png' } });

    expect(manager.getEventCount()).toBe(3);
  });

  it('destroy prevents further dispatch', () => {
    const handler = vi.fn();
    manager.on('tool-switch', handler);

    manager.destroy();

    manager.dispatch({ type: 'tool-switch', data: { toolId: 'brush' } });

    // Handler should not be called after destroy
    expect(handler).not.toHaveBeenCalled();
  });

  it('handles undefined event data gracefully', () => {
    const handler = vi.fn();
    manager.on('tool-switch', handler);

    // Dispatch with no data field — should not throw
    manager.dispatch({ type: 'tool-switch' } as any);

    // Handler should still be called; enrichment adds _tosVersion/_sessionId
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          _tosVersion: '2026-02-08-v1',
          _sessionId: testSessionId,
        }),
      })
    );
  });

  it('isolates handler errors from other handlers', () => {
    const throwingHandler = vi.fn(() => {
      throw new Error('Handler exploded');
    });
    const normalHandler = vi.fn();

    // Both listen to same event type
    manager.on('tool-switch', throwingHandler);
    manager.on('tool-switch', normalHandler);

    // Should not throw
    manager.dispatch({ type: 'tool-switch', data: { toolId: 'brush' } });

    // Both handlers were called; error in first doesn't prevent second
    expect(throwingHandler).toHaveBeenCalledTimes(1);
    expect(normalHandler).toHaveBeenCalledTimes(1);

    // Manager is still functional after the error
    manager.dispatch({ type: 'tool-switch', data: { toolId: 'eraser' } });
    expect(normalHandler).toHaveBeenCalledTimes(2);
  });

  it('event count stays at zero after destroy', () => {
    manager.destroy();

    manager.dispatch({ type: 'tool-switch', data: { toolId: 'brush' } });
    manager.dispatch({ type: 'layer-add', data: { layerId: 'layer-1' } });

    expect(manager.getEventCount()).toBe(0);
  });
});

// ============================================================================
// 3. EDITOR TELEMETRY BRIDGE TESTS
// ============================================================================

function createMockCoordinator() {
  const telemetryListeners = new Set<Function>();
  return {
    onTelemetry: vi.fn((listener: Function) => {
      telemetryListeners.add(listener);
      return () => telemetryListeners.delete(listener);
    }),
    _emitTelemetry: (event: any) => {
      telemetryListeners.forEach((fn) => fn(event));
    },
    destroy: vi.fn(),
  } as any;
}

function createMockToolManager() {
  const listeners = new Set<Function>();
  return {
    subscribe: vi.fn((listener: Function) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
    getActiveTool: vi.fn(() => ({
      id: 'brush',
      name: 'Brush',
      category: 'paint',
    })),
    _notify: () => listeners.forEach((fn) => fn()),
  } as any;
}

function createMockTelemetryManager() {
  const dispatched: any[] = [];
  return {
    dispatch: vi.fn((event: any) => dispatched.push(event)),
    _dispatched: dispatched,
    destroy: vi.fn(),
  } as any;
}

describe('EditorTelemetryBridge', () => {
  let EditorTelemetryBridge: any;
  let bridge: any;
  let mockCoordinator: any;
  let mockToolManager: any;
  let mockTelemetryManager: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await import('@/lib/studio/editor/telemetry/EditorTelemetryBridge');
    EditorTelemetryBridge = module.EditorTelemetryBridge;

    mockCoordinator = createMockCoordinator();
    mockToolManager = createMockToolManager();
    mockTelemetryManager = createMockTelemetryManager();

    bridge = new EditorTelemetryBridge(
      mockCoordinator,
      mockToolManager,
      mockTelemetryManager
    );
  });

  afterEach(() => {
    if (bridge && bridge.destroy) {
      bridge.destroy();
    }
  });

  it('starts in idle state', () => {
    expect(bridge.getState()).toBe('idle');
  });

  it('start() transitions to running', () => {
    bridge.start();
    expect(bridge.getState()).toBe('running');
  });

  it('pause/resume lifecycle', () => {
    bridge.start();
    expect(bridge.getState()).toBe('running');

    bridge.pause();
    expect(bridge.getState()).toBe('paused');

    bridge.resume();
    expect(bridge.getState()).toBe('running');
  });

  it('routes coordinator telemetry events to manager', () => {
    bridge.start();

    mockCoordinator._emitTelemetry({
      kind: 'layer-add',
      timestamp: Date.now(),
      data: { layerId: 'layer-1' },
    });

    expect(mockTelemetryManager.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'layer-add',
      })
    );
  });

  it('routes brush-stroke events as kinetic events', () => {
    bridge.start();

    mockCoordinator._emitTelemetry({
      kind: 'brush-stroke-begin',
      timestamp: Date.now(),
      data: { x: 10, y: 10 },
    });

    expect(mockTelemetryManager.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'kinetic-stroke-begin',
      })
    );
  });

  it('trackExport dispatches export event', () => {
    bridge.start();

    bridge.trackExport('png', { width: 100, height: 100 });

    expect(mockTelemetryManager.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'export',
        data: expect.objectContaining({
          format: 'png',
          dimensions: { width: 100, height: 100 },
        }),
      })
    );
  });

  it('trackAIAction dispatches ai-action event', () => {
    bridge.start();

    bridge.trackAIAction('generate', 'stable-diffusion');

    expect(mockTelemetryManager.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ai-action',
        data: expect.objectContaining({
          action: 'generate',
          model: 'stable-diffusion',
        }),
      })
    );
  });

  it('destroy cleans up subscriptions', () => {
    bridge.start();

    const dispatchCountBefore = mockTelemetryManager.dispatch.mock.calls.length;

    bridge.destroy();

    // Emit coordinator event after destroy
    mockCoordinator._emitTelemetry({
      kind: 'layer-add',
      timestamp: Date.now(),
      data: { layerId: 'layer-1' },
    });

    // Dispatch count should not increase
    const dispatchCountAfter = mockTelemetryManager.dispatch.mock.calls.length;
    expect(dispatchCountAfter).toBe(dispatchCountBefore);
  });

  it('getStats returns event counts', () => {
    bridge.start();

    mockCoordinator._emitTelemetry({
      kind: 'layer-add',
      timestamp: Date.now(),
      data: { layerId: 'layer-1' },
    });
    mockCoordinator._emitTelemetry({
      kind: 'layer-add',
      timestamp: Date.now(),
      data: { layerId: 'layer-2' },
    });
    mockCoordinator._emitTelemetry({
      kind: 'layer-add',
      timestamp: Date.now(),
      data: { layerId: 'layer-3' },
    });

    const stats = bridge.getStats();
    expect(stats.eventsRouted).toBe(3);
  });

  it('handles stroke-end without prior stroke-begin', () => {
    bridge.start();

    // Emit brush-stroke-end with no preceding begin —
    // activeStrokeToolId is null, should default to 'unknown'
    mockCoordinator._emitTelemetry({
      kind: 'brush-stroke-end',
      timestamp: Date.now(),
      data: { pointCount: 0 },
    });

    // Should dispatch without crashing, with 'unknown' defaults
    expect(mockTelemetryManager.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'kinetic-stroke-end',
        data: expect.objectContaining({
          toolId: 'unknown',
          toolName: 'unknown',
        }),
      })
    );
  });

  it('rejects NaN coordinates in kinetic points', () => {
    bridge.start();

    // Begin a stroke first
    mockCoordinator._emitTelemetry({
      kind: 'brush-stroke-begin',
      timestamp: Date.now(),
      data: { x: 10, y: 10 },
    });

    const callsBefore = mockTelemetryManager.dispatch.mock.calls.length;

    // Emit kinetic point with NaN x — should be silently rejected
    mockCoordinator._emitTelemetry({
      kind: 'brush-stroke-point',
      timestamp: Date.now(),
      data: { x: NaN, y: 50, pressure: 0.5 },
    });

    // Emit kinetic point with Infinity y — also rejected
    mockCoordinator._emitTelemetry({
      kind: 'brush-stroke-point',
      timestamp: Date.now(),
      data: { x: 50, y: Infinity, pressure: 0.5 },
    });

    // Emit kinetic point with negative x — also rejected
    mockCoordinator._emitTelemetry({
      kind: 'brush-stroke-point',
      timestamp: Date.now(),
      data: { x: -1, y: 50, pressure: 0.5 },
    });

    // No new dispatches should have been made for the invalid points
    const callsAfter = mockTelemetryManager.dispatch.mock.calls.length;
    expect(callsAfter).toBe(callsBefore);
  });

  it('validates trackExport dimensions', () => {
    bridge.start();

    const callsBefore = mockTelemetryManager.dispatch.mock.calls.length;

    // Negative width — should not dispatch
    bridge.trackExport('png', { width: -1, height: 100 });
    // Zero height — should not dispatch
    bridge.trackExport('png', { width: 100, height: 0 });
    // Null dimensions — should not dispatch
    bridge.trackExport('png', null as any);

    const callsAfter = mockTelemetryManager.dispatch.mock.calls.length;
    expect(callsAfter).toBe(callsBefore);

    // Valid dimensions — should dispatch
    bridge.trackExport('png', { width: 1920, height: 1080 });
    expect(mockTelemetryManager.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'export',
        data: expect.objectContaining({
          format: 'png',
          dimensions: { width: 1920, height: 1080 },
        }),
      })
    );
  });
});

// ============================================================================
// 4. TELEMETRY WORKER BRIDGE TESTS
// ============================================================================

describe('TelemetryWorkerBridge', () => {
  let TelemetryWorkerBridge: any;
  let bridge: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await import(
      '@/lib/studio/telemetry/workers/worker-bridge'
    );
    TelemetryWorkerBridge = module.TelemetryWorkerBridge;

    // Mock global Worker if it exists
    if (typeof global !== 'undefined' && !global.Worker) {
      (global as any).Worker = undefined;
    }

    bridge = new TelemetryWorkerBridge();
  });

  afterEach(() => {
    if (bridge && bridge.destroy) {
      bridge.destroy();
    }
  });

  it('falls back when Worker is undefined', async () => {
    await bridge.init({ sessionId: 'test', userId: 'user-1' });
    expect(bridge.getState()).toBe('fallback');
  });

  it('sendEvent queues in fallback mode', async () => {
    await bridge.init({ sessionId: 'test', userId: 'user-1' });

    bridge.sendEvent({ type: 'event-1', data: {} });
    bridge.sendEvent({ type: 'event-2', data: {} });
    bridge.sendEvent({ type: 'event-3', data: {} });

    const queue = bridge.getFallbackQueue();
    expect(queue.length).toBe(3);
  });

  it('destroy clears fallback queue', async () => {
    await bridge.init({ sessionId: 'test', userId: 'user-1' });

    bridge.sendEvent({ type: 'event-1', data: {} });
    bridge.sendEvent({ type: 'event-2', data: {} });

    bridge.destroy();

    const queue = bridge.getFallbackQueue();
    expect(queue.length).toBe(0);
  });

  it('getStats returns counts in fallback mode', async () => {
    await bridge.init({ sessionId: 'test', userId: 'user-1' });

    for (let i = 0; i < 5; i++) {
      bridge.sendEvent({ type: `event-${i}`, data: {} });
    }

    const stats = await bridge.getStats();
    expect(stats.eventsProcessed).toBe(5);
  });

  it('exposes droppedDuringInit count in stats', async () => {
    await bridge.init({ sessionId: 'test', userId: 'user-1' });

    // In fallback mode, droppedDuringInit should exist (0 since no events sent during init)
    const stats = await bridge.getStats();
    expect(stats).toHaveProperty('droppedDuringInit');
    expect(stats!.droppedDuringInit).toBe(0);

    // memoryEstimate should use the documented constant (200 bytes/event)
    expect(stats).toHaveProperty('memoryEstimate');
    expect(typeof stats!.memoryEstimate).toBe('number');
  });

  it('survives rapid init/destroy cycle', async () => {
    // Init then immediately destroy — should not throw
    await bridge.init({ sessionId: 'test', userId: 'user-1' });
    bridge.destroy();

    // State should be destroyed
    expect(bridge.getState()).toBe('destroyed');

    // sendEvent after destroy is a no-op (state check returns early)
    bridge.sendEvent({ type: 'event-1', data: {} });

    // getStats still returns an object (fallback stats), but with zeroed values
    const stats = await bridge.getStats();
    expect(stats).not.toBeNull();
    expect(stats!.eventsProcessed).toBe(0);
    expect(stats!.memoryEstimate).toBe(0);
  });
});

// ============================================================================
// 5. TELEMETRY PERFORMANCE MONITOR TESTS
// ============================================================================

describe('TelemetryPerformanceMonitor', () => {
  let TelemetryPerformanceMonitor: any;
  let monitor: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await import(
      '@/lib/studio/telemetry/monitoring/performance-monitor'
    );
    TelemetryPerformanceMonitor = module.TelemetryPerformanceMonitor;

    monitor = new TelemetryPerformanceMonitor();
  });

  afterEach(() => {
    if (monitor && monitor.destroy) {
      monitor.destroy();
    }
  });

  it('starts at degrade level 0', () => {
    expect(monitor.getDegradeLevel()).toBe(0);
  });

  it('tracks frame overhead', () => {
    monitor.beginFrame();
    // Simulate some work
    const start = Date.now();
    while (Date.now() - start < 1) {
      // Busy wait for ~1ms
    }
    monitor.endFrame();

    const snapshot = monitor.getSnapshot();
    expect(snapshot.avgFrameOverhead).toBeGreaterThan(0);
  });

  it('records events', () => {
    for (let i = 0; i < 10; i++) {
      monitor.recordEvent();
    }

    const snapshot = monitor.getSnapshot();
    expect(snapshot.totalEvents).toBe(10);
  });

  it('records dropped events', () => {
    for (let i = 0; i < 5; i++) {
      monitor.recordDrop();
    }

    const snapshot = monitor.getSnapshot();
    expect(snapshot.droppedEvents).toBe(5);
  });

  it('triggers degradation after consecutive high overhead frames', () => {
    // Simulate 5 frames with >2ms overhead each
    for (let i = 0; i < 5; i++) {
      monitor.beginFrame();
      const start = Date.now();
      while (Date.now() - start < 3) {
        // Busy wait for ~3ms
      }
      monitor.endFrame();
    }

    expect(monitor.getDegradeLevel()).toBeGreaterThan(0);
  });

  it('fires degrade callback', (done) => {
    const callback = vi.fn();
    monitor.onDegrade(callback);

    // Simulate high overhead frames
    for (let i = 0; i < 5; i++) {
      monitor.beginFrame();
      const start = Date.now();
      while (Date.now() - start < 3) {
        // Busy wait
      }
      monitor.endFrame();
    }

    // Give callback time to fire
    setTimeout(() => {
      expect(callback).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          degradeLevel: expect.any(Number),
        })
      );
      done();
    }, 100);
  });

  it('destroy stops monitoring', () => {
    monitor.recordEvent();
    const countBefore = monitor.getSnapshot().totalEvents;

    monitor.destroy();

    monitor.recordEvent();
    const countAfter = monitor.getSnapshot().totalEvents;

    // After destroy, recording should be no-op
    expect(countAfter).toBe(countBefore);
  });

  it('handles double beginFrame gracefully', () => {
    // First beginFrame is legitimate
    monitor.beginFrame();

    // Second beginFrame should auto-end the first, not crash
    monitor.beginFrame();

    // Should still be able to end the frame and get valid snapshot
    const start = Date.now();
    while (Date.now() - start < 1) {
      // Busy wait ~1ms
    }
    monitor.endFrame();

    const snapshot = monitor.getSnapshot();
    expect(snapshot.avgFrameOverhead).toBeGreaterThanOrEqual(0);
  });

  it('getSnapshot is idempotent', () => {
    // Record some events so there's state to snapshot
    for (let i = 0; i < 5; i++) {
      monitor.recordEvent();
    }

    const snapshot1 = monitor.getSnapshot();
    const snapshot2 = monitor.getSnapshot();

    // Both snapshots should have the same values for non-time fields
    expect(snapshot1.totalEvents).toBe(snapshot2.totalEvents);
    expect(snapshot1.droppedEvents).toBe(snapshot2.droppedEvents);
    expect(snapshot1.degradeLevel).toBe(snapshot2.degradeLevel);
    expect(snapshot1.avgFrameOverhead).toBe(snapshot2.avgFrameOverhead);
    expect(snapshot1.eventThroughput).toBe(snapshot2.eventThroughput);
  });

  it('clamps negative processingTimeMs to zero', () => {
    // Record event with negative processing time
    monitor.recordEvent(-5);
    monitor.recordEvent(-100);

    const snapshot = monitor.getSnapshot();

    // avgFrameOverhead should be 0, not negative
    expect(snapshot.avgFrameOverhead).toBe(0);
    expect(snapshot.peakFrameOverhead).toBe(0);
  });
});
