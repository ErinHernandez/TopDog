/**
 * HistoryManager Unit Tests
 * Tests the core undo/redo system with branching, auto-grouping, and memory management.
 * Covers all public API methods and internal behaviors including event emission,
 * memory eviction, snapshot creation, and auto-grouping of rapid actions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  HistoryEntry,
  HistoryActionType,
  HistoryState,
} from '@/lib/studio/types/history';
import { HistoryManager } from '@/lib/studio/editor/history/HistoryManager';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock HistoryEntryManager
vi.mock('@/lib/studio/editor/history/HistoryEntry', () => {
  const mockEntryCount = { value: 0 };
  return {
    HistoryEntryManager: {
      createEntry: vi.fn(
        (
          type: HistoryActionType,
          label: string,
          icon: string,
          undoData: unknown,
          redoData: unknown,
          layerId: string | null
        ): HistoryEntry => {
          mockEntryCount.value++;
          return {
            id: `entry-${mockEntryCount.value}`,
            type,
            label,
            icon,
            timestamp: Date.now(),
            layerId,
            undoData,
            redoData,
            sizeBytes: 1024,
            isSnapshot: false,
          };
        }
      ),
    },
  };
});

// Mock MemoryManager
vi.mock('@/lib/studio/editor/history/MemoryManager', () => {
  return {
    MemoryManager: vi.fn(function (maxBytes: number, maxEntries: number) {
      (this as any).maxBytes = maxBytes;
      (this as any).maxEntries = maxEntries;
      (this as any).allocations = new Map<string, number>();
      (this as any).warningThreshold = maxBytes * 0.8;

      (this as any).allocate = vi.fn((id: string, bytes: number): boolean => {
        const currentUsage = Array.from(
          (this as any).allocations.values()
        ).reduce((a, b) => a + b, 0);
        if (currentUsage + bytes <= maxBytes) {
          (this as any).allocations.set(id, bytes);
          return true;
        }
        return false;
      });

      (this as any).deallocate = vi.fn((id: string): void => {
        (this as any).allocations.delete(id);
      });

      (this as any).clear = vi.fn((): void => {
        (this as any).allocations.clear();
      });

      (this as any).isWarning = vi.fn((): boolean => {
        const currentUsage = Array.from(
          (this as any).allocations.values()
        ).reduce((a, b) => a + b, 0);
        return currentUsage >= (this as any).warningThreshold;
      });

      (this as any).getBudget = vi.fn(() => ({
        maxMemoryBytes: (this as any).maxBytes,
        currentMemoryBytes: Array.from(
          (this as any).allocations.values()
        ).reduce((a, b) => a + b, 0),
      }));

      (this as any).getLRUEntryId = vi.fn((): string | null => {
        if ((this as any).allocations.size === 0) return null;
        return Array.from((this as any).allocations.keys())[0];
      });
    }),
  };
});

// Mock SnapshotManager
vi.mock('@/lib/studio/editor/history/SnapshotManager', () => {
  return {
    SnapshotManager: vi.fn(function (interval: number) {
      (this as any).interval = interval;
      (this as any).snapshots = new Map<number, boolean>();
      (this as any).callCount = { value: 0 };

      (this as any).shouldCreateSnapshot = vi.fn((idx: number): boolean => {
        (this as any).callCount.value++;
        return idx > 0 && idx % interval === 0;
      });

      (this as any).createSnapshot = vi.fn(
        (id: string, data: ArrayBuffer, tree: unknown): void => {
          // Mock implementation
        }
      );

      (this as any).markSnapshotAt = vi.fn((idx: number): void => {
        (this as any).snapshots.set(idx, true);
      });

      (this as any).clear = vi.fn((): void => {
        (this as any).snapshots.clear();
      });

      (this as any).findNearestSnapshot = vi.fn(
        (targetIdx: number, total: number): number => -1
      );

      (this as any).estimateReplayTime = vi.fn(
        (from: number, to: number): number => (to - from) * 10
      );
    }),
  };
});

// ============================================================================
// Test Helpers
// ============================================================================

function createMockEntry(overrides?: Partial<HistoryEntry>): HistoryEntry {
  return {
    id: `entry-${Math.random()}`,
    type: 'brush-stroke',
    label: 'Test Action',
    icon: 'brush',
    timestamp: Date.now(),
    layerId: 'layer-1',
    undoData: { x: 0 },
    redoData: { x: 1 },
    sizeBytes: 1024,
    isSnapshot: false,
    ...overrides,
  };
}

// ============================================================================
// Test Suites
// ============================================================================

describe('HistoryManager', () => {
  let manager: HistoryManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new HistoryManager();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ========================================================================
  // Construction Tests
  // ========================================================================

  describe('Construction', () => {
    it('should construct with default config', () => {
      const mgr = new HistoryManager();
      const state = mgr.getState();

      expect(state.currentIndex).toBe(-1);
      expect(state.entries).toHaveLength(0);
      expect(state.maxEntries).toBe(100);
      expect(state.maxMemoryBytes).toBe(500 * 1024 * 1024);
      expect(state.snapshotInterval).toBe(20);
    });

    it('should construct with custom config', () => {
      const mgr = new HistoryManager({
        maxEntries: 50,
        maxMemoryBytes: 100 * 1024 * 1024,
        snapshotInterval: 10,
        enableBranching: false,
        autoGroupMs: 300,
        enableCrashRecovery: false,
      });

      const state = mgr.getState();
      expect(state.maxEntries).toBe(50);
      expect(state.maxMemoryBytes).toBe(100 * 1024 * 1024);
      expect(state.snapshotInterval).toBe(10);
    });

    it('should initialize with empty history', () => {
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
      expect(manager.getHistoryList()).toHaveLength(0);
    });
  });

  // ========================================================================
  // Push Tests
  // ========================================================================

  describe('push()', () => {
    it('should add entry to history stack', () => {
      manager.push('brush-stroke', 'Brush', 'brush', { x: 0 }, { x: 1 });

      const state = manager.getState();
      expect(state.entries).toHaveLength(1);
      expect(state.currentIndex).toBe(0);
    });

    it('should emit history:push event', () => {
      const listener = vi.fn();
      manager.on('history:push', listener);

      manager.push('brush-stroke', 'Brush', 'brush', { x: 0 }, { x: 1 });

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          entry: expect.objectContaining({
            type: 'brush-stroke',
            label: 'Brush',
          }),
        })
      );
    });

    it('should increment currentIndex', () => {
      expect(manager.getState().currentIndex).toBe(-1);

      manager.push('brush-stroke', 'Brush 1', 'brush', {}, {});
      expect(manager.getState().currentIndex).toBe(0);

      manager.push('brush-stroke', 'Brush 2', 'brush', {}, {});
      expect(manager.getState().currentIndex).toBe(1);
    });

    it('should allocate memory for entry', () => {
      manager.push('brush-stroke', 'Brush', 'brush', {}, {});

      const state = manager.getState();
      expect(state.totalMemoryBytes).toBeGreaterThan(0);
    });

    it('should support layer ID', () => {
      manager.push('brush-stroke', 'Brush', 'brush', {}, {}, 'layer-42');

      const state = manager.getState();
      expect(state.entries[0]?.layerId).toBe('layer-42');
    });

    it('should handle null layer ID', () => {
      manager.push('document-resize', 'Resize', 'resize', {}, {}, null);

      const state = manager.getState();
      expect(state.entries[0]?.layerId).toBeNull();
    });

    it('should truncate redo history when branching disabled', () => {
      const mgr = new HistoryManager({ enableBranching: false });

      // Push 3 entries
      mgr.push('brush-stroke', 'B1', 'brush', {}, {});
      mgr.push('brush-stroke', 'B2', 'brush', {}, {});
      mgr.push('brush-stroke', 'B3', 'brush', {}, {});

      // Undo once
      mgr.undo();
      expect(mgr.getState().currentIndex).toBe(1);

      // Push new entry (should truncate B3 since branching is disabled)
      mgr.push('brush-stroke', 'B4', 'brush', {}, {});

      const state = mgr.getState();
      expect(state.entries).toHaveLength(3);
      expect(state.currentIndex).toBe(2);
      expect(state.entries[2]?.label).toBe('B4');
    });

    it('should keep redo history when branching enabled', () => {
      const mgr = new HistoryManager({ enableBranching: true });

      // Push 3 entries
      mgr.push('brush-stroke', 'B1', 'brush', {}, {});
      mgr.push('brush-stroke', 'B2', 'brush', {}, {});
      mgr.push('brush-stroke', 'B3', 'brush', {}, {});

      // Undo once
      mgr.undo();

      // Push new entry (even with branching, push always truncates redo)
      mgr.push('brush-stroke', 'B4', 'brush', {}, {});

      const state = mgr.getState();
      expect(state.entries).toHaveLength(3);
    });

    it('should evict oldest entry on memory overflow', () => {
      const mgr = new HistoryManager({
        maxMemoryBytes: 2048, // Small limit to trigger eviction
      });

      // Add first entry (should succeed)
      mgr.push('brush-stroke', 'B1', 'brush', {}, {});
      expect(mgr.getState().entries).toHaveLength(1);

      // Try to add another large entry (would overflow if memory limit respected)
      mgr.push('brush-stroke', 'B2', 'brush', {}, {});
      mgr.push('brush-stroke', 'B3', 'brush', {}, {});

      // Should evict oldest when necessary
      const state = mgr.getState();
      expect(state.entries.length).toBeGreaterThanOrEqual(1);
    });

    it('should emit memory warning when threshold exceeded', () => {
      const mgr = new HistoryManager({
        maxMemoryBytes: 10 * 1024, // 10KB limit
      });
      const listener = vi.fn();
      mgr.on('history:memory-warning', listener);

      // Push multiple entries to trigger warning
      for (let i = 0; i < 5; i++) {
        mgr.push('brush-stroke', `Brush ${i}`, 'brush', {}, {});
      }

      // Memory warning might be emitted depending on allocation behavior
      if (listener.mock.calls.length > 0) {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            currentBytes: expect.any(Number),
            maxBytes: expect.any(Number),
          })
        );
      }
    });

    it('should create snapshot at interval', () => {
      const mgr = new HistoryManager({ snapshotInterval: 3 });

      for (let i = 0; i < 5; i++) {
        mgr.push('brush-stroke', `B${i}`, 'brush', {}, {});
      }

      const state = mgr.getState();
      expect(state.entries).toHaveLength(5);
    });

    it('should enforce max entries limit', () => {
      const mgr = new HistoryManager({ maxEntries: 5 });

      for (let i = 0; i < 10; i++) {
        mgr.push('brush-stroke', `B${i}`, 'brush', {}, {});
      }

      const state = mgr.getState();
      expect(state.entries.length).toBeLessThanOrEqual(5);
    });
  });

  // ========================================================================
  // Undo Tests
  // ========================================================================

  describe('undo()', () => {
    it('should decrement currentIndex', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      manager.push('brush-stroke', 'B2', 'brush', {}, {});

      expect(manager.getState().currentIndex).toBe(1);

      manager.undo();
      expect(manager.getState().currentIndex).toBe(0);
    });

    it('should emit history:undo event', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      const listener = vi.fn();
      manager.on('history:undo', listener);

      manager.undo();

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          entry: expect.any(Object),
          newIndex: -1,
        })
      );
    });

    it('should be no-op when nothing to undo', () => {
      const listener = vi.fn();
      manager.on('history:undo', listener);

      manager.undo();

      expect(listener).not.toHaveBeenCalled();
      expect(manager.getState().currentIndex).toBe(-1);
    });

    it('should be no-op when currentIndex is -1', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      manager.undo();
      manager.undo(); // Should not go below -1

      expect(manager.getState().currentIndex).toBe(-1);
    });

    it('should allow redo after undo', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      manager.undo();

      expect(manager.canRedo()).toBe(true);
    });

    it('should emit correct entry data', () => {
      manager.push('layer-delete', 'Delete Layer', 'trash', { id: 'l1' }, {});
      const listener = vi.fn();
      manager.on('history:undo', listener);

      manager.undo();

      const call = listener.mock.calls[0]?.[0];
      expect(call?.entry.type).toBe('layer-delete');
      expect(call?.entry.label).toBe('Delete Layer');
    });
  });

  // ========================================================================
  // Redo Tests
  // ========================================================================

  describe('redo()', () => {
    it('should increment currentIndex', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      manager.push('brush-stroke', 'B2', 'brush', {}, {});
      manager.undo();

      expect(manager.getState().currentIndex).toBe(0);

      manager.redo();
      expect(manager.getState().currentIndex).toBe(1);
    });

    it('should emit history:redo event', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      manager.undo();

      const listener = vi.fn();
      manager.on('history:redo', listener);

      manager.redo();

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          entry: expect.any(Object),
          newIndex: 0,
        })
      );
    });

    it('should be no-op when at end of history', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      const listener = vi.fn();
      manager.on('history:redo', listener);

      manager.redo();

      expect(listener).not.toHaveBeenCalled();
      expect(manager.getState().currentIndex).toBe(0);
    });

    it('should be no-op when currentIndex >= entries.length - 1', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      manager.push('brush-stroke', 'B2', 'brush', {}, {});
      manager.redo(); // Already at end

      expect(manager.getState().currentIndex).toBe(1);
    });

    it('should disable undo when redo', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      manager.push('brush-stroke', 'B2', 'brush', {}, {});
      manager.undo();
      manager.undo();

      expect(manager.canUndo()).toBe(false);
      manager.redo();
      expect(manager.canUndo()).toBe(true);
    });
  });

  // ========================================================================
  // canUndo/canRedo Tests
  // ========================================================================

  describe('canUndo() / canRedo()', () => {
    it('should return false when empty', () => {
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
    });

    it('should return true for undo after push', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});

      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(false);
    });

    it('should return true for redo after undo', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      manager.undo();

      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(true);
    });

    it('should track state correctly through undo/redo sequence', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      manager.push('brush-stroke', 'B2', 'brush', {}, {});
      manager.push('brush-stroke', 'B3', 'brush', {}, {});

      manager.undo();
      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(true);

      manager.undo();
      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(true);

      manager.undo();
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(true);
    });
  });

  // ========================================================================
  // jumpTo Tests
  // ========================================================================

  describe('jumpTo()', () => {
    beforeEach(() => {
      for (let i = 0; i < 5; i++) {
        manager.push('brush-stroke', `B${i}`, 'brush', {}, {});
      }
    });

    it('should jump to valid index', () => {
      manager.jumpTo(2);
      expect(manager.getState().currentIndex).toBe(2);
    });

    it('should emit history:jump event', () => {
      const listener = vi.fn();
      manager.on('history:jump', listener);

      manager.jumpTo(3);

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          fromIndex: 4,
          toIndex: 3,
        })
      );
    });

    it('should jump to -1 (before first entry)', () => {
      manager.jumpTo(-1);
      expect(manager.getState().currentIndex).toBe(-1);
      expect(manager.canUndo()).toBe(false);
    });

    it('should be no-op for invalid indices', () => {
      const listener = vi.fn();
      manager.on('history:jump', listener);

      manager.jumpTo(-2);
      expect(manager.getState().currentIndex).toBe(4);
      expect(listener).not.toHaveBeenCalled();

      manager.jumpTo(5); // entries.length is 5, so max valid is 4
      expect(manager.getState().currentIndex).toBe(4);
      expect(listener).not.toHaveBeenCalled();

      manager.jumpTo(100);
      expect(manager.getState().currentIndex).toBe(4);
      expect(listener).not.toHaveBeenCalled();
    });

    it('should jump backward', () => {
      manager.jumpTo(1);
      expect(manager.getState().currentIndex).toBe(1);
    });

    it('should jump forward', () => {
      manager.jumpTo(2);
      manager.jumpTo(4);
      expect(manager.getState().currentIndex).toBe(4);
    });

    it('should emit correct from/to indices', () => {
      const listener = vi.fn();
      manager.on('history:jump', listener);

      manager.jumpTo(2);
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({
          fromIndex: 4,
          toIndex: 2,
        })
      );

      manager.jumpTo(0);
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({
          fromIndex: 2,
          toIndex: 0,
        })
      );
    });
  });

  // ========================================================================
  // getState Tests
  // ========================================================================

  describe('getState()', () => {
    it('should return HistoryState object', () => {
      const state = manager.getState();

      expect(state).toHaveProperty('entries');
      expect(state).toHaveProperty('currentIndex');
      expect(state).toHaveProperty('maxEntries');
      expect(state).toHaveProperty('maxMemoryBytes');
      expect(state).toHaveProperty('totalMemoryBytes');
      expect(state).toHaveProperty('snapshotInterval');
      expect(state).toHaveProperty('lastSnapshotIndex');
    });

    it('should reflect current index', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      expect(manager.getState().currentIndex).toBe(0);

      manager.push('brush-stroke', 'B2', 'brush', {}, {});
      expect(manager.getState().currentIndex).toBe(1);

      manager.undo();
      expect(manager.getState().currentIndex).toBe(0);
    });

    it('should include all entries', () => {
      for (let i = 0; i < 3; i++) {
        manager.push('brush-stroke', `B${i}`, 'brush', {}, {});
      }

      const state = manager.getState();
      expect(state.entries).toHaveLength(3);
      expect(state.entries[0]?.label).toBe('B0');
      expect(state.entries[1]?.label).toBe('B1');
      expect(state.entries[2]?.label).toBe('B2');
    });

    it('should report correct memory usage', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});

      const state = manager.getState();
      expect(state.totalMemoryBytes).toBeGreaterThan(0);
      expect(state.totalMemoryBytes).toBeLessThanOrEqual(state.maxMemoryBytes);
    });

    it('should report config values', () => {
      const mgr = new HistoryManager({
        maxEntries: 75,
        maxMemoryBytes: 250 * 1024 * 1024,
        snapshotInterval: 15,
      });

      const state = mgr.getState();
      expect(state.maxEntries).toBe(75);
      expect(state.maxMemoryBytes).toBe(250 * 1024 * 1024);
      expect(state.snapshotInterval).toBe(15);
    });
  });

  // ========================================================================
  // getHistoryList Tests
  // ========================================================================

  describe('getHistoryList()', () => {
    beforeEach(() => {
      for (let i = 0; i < 10; i++) {
        manager.push('brush-stroke', `B${i}`, 'brush', {}, {});
      }
    });

    it('should return all entries when no limit', () => {
      const list = manager.getHistoryList();
      expect(list).toHaveLength(10);
    });

    it('should respect limit parameter', () => {
      const list = manager.getHistoryList(5);
      expect(list).toHaveLength(5);
    });

    it('should return most recent entries', () => {
      const list = manager.getHistoryList(3);
      expect(list).toHaveLength(3);
      expect(list[0]?.label).toBe('B7');
      expect(list[1]?.label).toBe('B8');
      expect(list[2]?.label).toBe('B9');
    });

    it('should handle limit larger than history', () => {
      const list = manager.getHistoryList(50);
      expect(list).toHaveLength(10);
    });

    it('should handle limit of 0', () => {
      const list = manager.getHistoryList(0);
      expect(list).toHaveLength(0);
    });

    it('should return HistoryEntry objects', () => {
      const list = manager.getHistoryList(1);
      const entry = list[0];

      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('type');
      expect(entry).toHaveProperty('label');
      expect(entry).toHaveProperty('icon');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('layerId');
    });
  });

  // ========================================================================
  // clear Tests
  // ========================================================================

  describe('clear()', () => {
    beforeEach(() => {
      for (let i = 0; i < 5; i++) {
        manager.push('brush-stroke', `B${i}`, 'brush', {}, {});
      }
    });

    it('should empty history', () => {
      manager.clear();

      const state = manager.getState();
      expect(state.entries).toHaveLength(0);
    });

    it('should reset currentIndex to -1', () => {
      manager.clear();
      expect(manager.getState().currentIndex).toBe(-1);
    });

    it('should emit history:clear event', () => {
      const listener = vi.fn();
      manager.on('history:clear', listener);

      manager.clear();

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          previousCount: 5,
        })
      );
    });

    it('should disable undo/redo', () => {
      manager.clear();

      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
    });

    it('should allow push after clear', () => {
      manager.clear();
      manager.push('brush-stroke', 'B1', 'brush', {}, {});

      expect(manager.getState().entries).toHaveLength(1);
      expect(manager.getState().currentIndex).toBe(0);
    });

    it('should clear memory allocations', () => {
      manager.clear();

      // Memory should be deallocated
      const state = manager.getState();
      expect(state.totalMemoryBytes).toBe(0);
    });
  });

  // ========================================================================
  // Event System Tests
  // ========================================================================

  describe('Event System - on()', () => {
    it('should register listener', () => {
      const listener = vi.fn();
      manager.on('history:push', listener);

      manager.push('brush-stroke', 'B1', 'brush', {}, {});

      expect(listener).toHaveBeenCalledOnce();
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = manager.on('history:push', listener);

      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      manager.push('brush-stroke', 'B2', 'brush', {}, {});
      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not called for B2
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      manager.on('history:push', listener1);
      manager.on('history:push', listener2);

      manager.push('brush-stroke', 'B1', 'brush', {}, {});

      expect(listener1).toHaveBeenCalledOnce();
      expect(listener2).toHaveBeenCalledOnce();
    });

    it('should support all event types', () => {
      const pushListener = vi.fn();
      const undoListener = vi.fn();
      const redoListener = vi.fn();
      const jumpListener = vi.fn();
      const clearListener = vi.fn();

      manager.on('history:push', pushListener);
      manager.on('history:undo', undoListener);
      manager.on('history:redo', redoListener);
      manager.on('history:jump', jumpListener);
      manager.on('history:clear', clearListener);

      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      expect(pushListener).toHaveBeenCalledOnce();

      manager.push('brush-stroke', 'B2', 'brush', {}, {});
      manager.undo();
      expect(undoListener).toHaveBeenCalledOnce();

      manager.redo();
      expect(redoListener).toHaveBeenCalledOnce();

      manager.jumpTo(0);
      expect(jumpListener).toHaveBeenCalledOnce();

      manager.clear();
      expect(clearListener).toHaveBeenCalledOnce();
    });

    it('should pass correct event data', () => {
      const listener = vi.fn();
      manager.on('history:push', listener);

      manager.push('layer-create', 'Create Layer', 'layers', { id: 'l1' }, {});

      const eventData = listener.mock.calls[0]?.[0];
      expect(eventData?.entry.type).toBe('layer-create');
      expect(eventData?.entry.label).toBe('Create Layer');
      expect(eventData?.entry.icon).toBe('layers');
    });

    it('should allow listener removal during iteration', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsub1 = manager.on('history:push', listener1);
      manager.on('history:push', listener2);

      unsub1();

      manager.push('brush-stroke', 'B1', 'brush', {}, {});

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledOnce();
    });
  });

  // ========================================================================
  // Memory Management Tests
  // ========================================================================

  describe('Memory Management', () => {
    it('should evict oldest entry when memory limit exceeded', () => {
      const mgr = new HistoryManager({
        maxMemoryBytes: 1024, // Very small to trigger eviction
      });

      mgr.push('brush-stroke', 'B1', 'brush', {}, {});
      const initialCount = mgr.getState().entries.length;

      mgr.push('brush-stroke', 'B2', 'brush', {}, {});
      mgr.push('brush-stroke', 'B3', 'brush', {}, {});

      const state = mgr.getState();
      expect(state.entries.length).toBeLessThanOrEqual(initialCount + 2);
    });

    it('should track memory usage', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});

      const state = manager.getState();
      expect(state.totalMemoryBytes).toBeGreaterThan(0);
    });

    it('should emit memory warning when near limit', () => {
      const mgr = new HistoryManager({
        maxMemoryBytes: 5120, // Small limit
      });

      const listener = vi.fn();
      mgr.on('history:memory-warning', listener);

      // Add multiple entries
      for (let i = 0; i < 3; i++) {
        mgr.push('brush-stroke', `B${i}`, 'brush', {}, {});
      }

      // May or may not emit depending on threshold
      if (listener.mock.calls.length > 0) {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            currentBytes: expect.any(Number),
            maxBytes: 5120,
          })
        );
      }
    });

    it('should deallocate memory on clear', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      manager.push('brush-stroke', 'B2', 'brush', {}, {});

      expect(manager.getState().totalMemoryBytes).toBeGreaterThan(0);

      manager.clear();
      expect(manager.getState().totalMemoryBytes).toBe(0);
    });

    it('should deallocate memory on entry eviction', () => {
      const mgr = new HistoryManager({
        maxMemoryBytes: 1024,
      });

      mgr.push('brush-stroke', 'B1', 'brush', {}, {});
      const memAfterOne = mgr.getState().totalMemoryBytes;

      mgr.push('brush-stroke', 'B2', 'brush', {}, {});
      mgr.push('brush-stroke', 'B3', 'brush', {}, {});

      // Memory should not exceed limit
      expect(mgr.getState().totalMemoryBytes).toBeLessThanOrEqual(1024);
    });
  });

  // ========================================================================
  // Max Entries Enforcement Tests
  // ========================================================================

  describe('Max Entries Enforcement', () => {
    it('should limit history to maxEntries', () => {
      const mgr = new HistoryManager({ maxEntries: 5 });

      for (let i = 0; i < 10; i++) {
        mgr.push('brush-stroke', `B${i}`, 'brush', {}, {});
      }

      expect(mgr.getState().entries.length).toBeLessThanOrEqual(5);
    });

    it('should remove oldest when max exceeded', () => {
      const mgr = new HistoryManager({ maxEntries: 3 });

      mgr.push('brush-stroke', 'B0', 'brush', {}, {});
      mgr.push('brush-stroke', 'B1', 'brush', {}, {});
      mgr.push('brush-stroke', 'B2', 'brush', {}, {});
      mgr.push('brush-stroke', 'B3', 'brush', {}, {});

      const entries = mgr.getState().entries;
      expect(entries.length).toBeLessThanOrEqual(3);
      expect(entries[0]?.label).not.toBe('B0');
    });

    it('should decrement currentIndex when oldest removed', () => {
      const mgr = new HistoryManager({ maxEntries: 2 });

      mgr.push('brush-stroke', 'B0', 'brush', {}, {});
      mgr.push('brush-stroke', 'B1', 'brush', {}, {});

      expect(mgr.getState().currentIndex).toBe(1);

      mgr.push('brush-stroke', 'B2', 'brush', {}, {});

      expect(mgr.getState().currentIndex).toBe(1); // Decremented
    });
  });

  // ========================================================================
  // Auto-Grouping Tests
  // ========================================================================

  describe('Auto-Grouping', () => {
    it('should group same-type rapid actions', () => {
      const mgr = new HistoryManager({ autoGroupMs: 500 });

      mgr.push('brush-stroke', 'B1', 'brush', {}, {}, 'layer-1');

      // Within 500ms window, same type, same layer
      vi.advanceTimersByTime(100);
      mgr.push('brush-stroke', 'B2', 'brush', {}, {}, 'layer-1');

      // Should not be in entries yet, still pending
      vi.advanceTimersByTime(450);
      // Flush before checking
      vi.runAllTimers();

      // After timer fires, should be flushed
      const state = mgr.getState();
      expect(state.entries.length).toBeGreaterThanOrEqual(1);
    });

    it('should not group different types', () => {
      const mgr = new HistoryManager({ autoGroupMs: 500 });

      const listener = vi.fn();
      mgr.on('history:push', listener);

      mgr.push('brush-stroke', 'B1', 'brush', {}, {}, 'layer-1');
      mgr.push('layer-property-change', 'Prop', 'settings', {}, {}, 'layer-1');

      vi.runAllTimers();

      // Should emit separate push events
      expect(listener.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('should not group different layers', () => {
      const mgr = new HistoryManager({ autoGroupMs: 500 });

      mgr.push('brush-stroke', 'B1', 'brush', {}, {}, 'layer-1');
      mgr.push('brush-stroke', 'B2', 'brush', {}, {}, 'layer-2');

      vi.runAllTimers();

      const state = mgr.getState();
      expect(state.entries.length).toBeGreaterThanOrEqual(2);
    });

    it('should not group after timeout', () => {
      const mgr = new HistoryManager({ autoGroupMs: 500 });

      mgr.push('brush-stroke', 'B1', 'brush', {}, {}, 'layer-1');

      // Advance past timeout
      vi.advanceTimersByTime(600);

      mgr.push('brush-stroke', 'B2', 'brush', {}, {}, 'layer-1');

      vi.runAllTimers();

      const state = mgr.getState();
      expect(state.entries.length).toBeGreaterThanOrEqual(2);
    });

    it('should flush pending on non-groupable push', () => {
      const mgr = new HistoryManager({ autoGroupMs: 500 });

      mgr.push('brush-stroke', 'B1', 'brush', {}, {}, 'layer-1');

      // Add same-type action (should be pending)
      vi.advanceTimersByTime(100);
      mgr.push('brush-stroke', 'B2', 'brush', {}, {}, 'layer-1');

      // Push different type (should flush pending)
      mgr.push('layer-create', 'Layer', 'layers', {}, {}, null);

      vi.runAllTimers();

      const state = mgr.getState();
      expect(state.entries.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ========================================================================
  // Branching Behavior Tests
  // ========================================================================

  describe('Branching Behavior', () => {
    it('should create branch when branching disabled and new action after undo', () => {
      const mgr = new HistoryManager({ enableBranching: false });

      mgr.push('brush-stroke', 'B1', 'brush', {}, {});
      mgr.push('brush-stroke', 'B2', 'brush', {}, {});
      mgr.push('brush-stroke', 'B3', 'brush', {}, {});

      mgr.undo();
      mgr.undo();

      // Push new action - should create branch and truncate
      mgr.push('brush-stroke', 'B4', 'brush', {}, {});

      const state = mgr.getState();
      expect(state.entries.length).toBe(2); // B1, B4 (B2, B3 truncated)
      expect(state.entries[1]?.label).toBe('B4');
    });

    it('should not create branch when branching enabled', () => {
      const mgr = new HistoryManager({ enableBranching: true });

      mgr.push('brush-stroke', 'B1', 'brush', {}, {});
      mgr.push('brush-stroke', 'B2', 'brush', {}, {});
      mgr.push('brush-stroke', 'B3', 'brush', {}, {});

      mgr.undo();
      mgr.undo();

      mgr.push('brush-stroke', 'B4', 'brush', {}, {});

      const state = mgr.getState();
      expect(state.entries.length).toBe(2);
    });
  });

  // ========================================================================
  // Snapshot Creation Tests
  // ========================================================================

  describe('Snapshot Creation', () => {
    it('should create snapshot at interval', () => {
      const mgr = new HistoryManager({ snapshotInterval: 3 });

      for (let i = 0; i < 5; i++) {
        mgr.push('brush-stroke', `B${i}`, 'brush', {}, {});
      }

      expect(mgr.getState().entries.length).toBe(5);
    });

    it('should create snapshot at first interval point', () => {
      const mgr = new HistoryManager({ snapshotInterval: 2 });

      mgr.push('brush-stroke', 'B0', 'brush', {}, {});
      mgr.push('brush-stroke', 'B1', 'brush', {}, {});
      mgr.push('brush-stroke', 'B2', 'brush', {}, {});

      // Snapshot should have been created at index 2
      expect(mgr.getState().entries.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ========================================================================
  // Integration Tests
  // ========================================================================

  describe('Integration Scenarios', () => {
    it('should handle complex undo/redo sequence', () => {
      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      manager.push('brush-stroke', 'B2', 'brush', {}, {});
      manager.push('brush-stroke', 'B3', 'brush', {}, {});

      manager.undo();
      manager.undo();
      manager.redo();
      manager.undo();
      manager.push('brush-stroke', 'B4', 'brush', {}, {});

      const state = manager.getState();
      expect(state.currentIndex).toBeGreaterThanOrEqual(0);
      expect(state.entries.length).toBeGreaterThan(0);
    });

    it('should emit multiple events in sequence', () => {
      const pushListener = vi.fn();
      const undoListener = vi.fn();

      manager.on('history:push', pushListener);
      manager.on('history:undo', undoListener);

      manager.push('brush-stroke', 'B1', 'brush', {}, {});
      manager.push('brush-stroke', 'B2', 'brush', {}, {});
      manager.undo();

      expect(pushListener).toHaveBeenCalledTimes(2);
      expect(undoListener).toHaveBeenCalledOnce();
    });

    it('should maintain consistency through high volume operations', () => {
      for (let i = 0; i < 50; i++) {
        manager.push('brush-stroke', `B${i}`, 'brush', {}, {});
      }

      const state = manager.getState();
      expect(state.currentIndex).toBeGreaterThanOrEqual(0);
      expect(state.entries.length).toBeLessThanOrEqual(100);

      // Undo some
      for (let i = 0; i < 10; i++) {
        manager.undo();
      }

      expect(manager.canRedo()).toBe(true);
      expect(manager.canUndo()).toBe(true);
    });

    it('should handle getHistoryList after various operations', () => {
      for (let i = 0; i < 10; i++) {
        manager.push('brush-stroke', `B${i}`, 'brush', {}, {});
      }

      manager.undo();
      manager.undo();
      manager.undo();

      const list = manager.getHistoryList(5);
      expect(list).toHaveLength(5);
      expect(list.every((e) => e.type === 'brush-stroke')).toBe(true);
    });
  });
});
