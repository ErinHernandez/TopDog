import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PointerEventHandler } from '@/lib/studio/editor/input/PointerEventHandler';

describe('PointerEventHandler', () => {
  let handler: PointerEventHandler;
  let mockElement: any;
  let addedListeners: Map<string, Function>;

  beforeEach(() => {
    addedListeners = new Map();

    mockElement = {
      addEventListener: vi.fn((type: string, fn: Function, _options?: any) => {
        addedListeners.set(type, fn);
      }),
      removeEventListener: vi.fn((type: string, fn: Function) => {
        const stored = addedListeners.get(type);
        if (stored === fn) addedListeners.delete(type);
      }),
      getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 1920, height: 1080 })),
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    };

    handler = new PointerEventHandler(mockElement);
  });

  it('adds all 8 element-level event listeners on construction', () => {
    expect(mockElement.addEventListener).toHaveBeenCalledTimes(8);
    const eventTypes = mockElement.addEventListener.mock.calls.map((c: any) => c[0]);
    expect(eventTypes).toContain('pointerdown');
    expect(eventTypes).toContain('pointermove');
    expect(eventTypes).toContain('pointerup');
    expect(eventTypes).toContain('pointercancel');
    expect(eventTypes).toContain('wheel');
    expect(eventTypes).toContain('contextmenu');
    expect(eventTypes).toContain('gotpointercapture');
    expect(eventTypes).toContain('lostpointercapture');
  });

  it('removes all 8 element-level event listeners on destroy', () => {
    handler.destroy();
    expect(mockElement.removeEventListener).toHaveBeenCalledTimes(8);
    const eventTypes = mockElement.removeEventListener.mock.calls.map((c: any) => c[0]);
    expect(eventTypes).toContain('pointerdown');
    expect(eventTypes).toContain('pointermove');
    expect(eventTypes).toContain('pointerup');
    expect(eventTypes).toContain('pointercancel');
    expect(eventTypes).toContain('wheel');
    expect(eventTypes).toContain('contextmenu');
    expect(eventTypes).toContain('gotpointercapture');
    expect(eventTypes).toContain('lostpointercapture');
  });

  it('uses same function reference for add and remove', () => {
    handler.destroy();

    const addCalls = mockElement.addEventListener.mock.calls;
    const removeCalls = mockElement.removeEventListener.mock.calls;

    for (const addCall of addCalls) {
      const eventType = addCall[0];
      const addFn = addCall[1];
      const matchingRemove = removeCalls.find((rc: any) => rc[0] === eventType);
      expect(matchingRemove).toBeDefined();
      expect(matchingRemove[1]).toBe(addFn); // Same reference!
    }
  });

  it('removes wheel listener on destroy', () => {
    handler.destroy();
    const wheelRemove = mockElement.removeEventListener.mock.calls.find((c: any) => c[0] === 'wheel');
    expect(wheelRemove).toBeDefined();
  });

  it('handles double destroy gracefully', () => {
    handler.destroy();
    expect(() => handler.destroy()).not.toThrow();
    // Second destroy should be a no-op — still 8 removes, not 16
    expect(mockElement.removeEventListener).toHaveBeenCalledTimes(8);
  });

  it('emits pointer-down event with correct data', () => {
    const listener = vi.fn();
    handler.on('pointer-down', listener);

    const pointerEvent = {
      pointerId: 1,
      clientX: 100,
      clientY: 200,
      pressure: 0.5,
      pointerType: 'pen',
      isPrimary: true,
      button: 0,
      buttons: 1,
      shiftKey: false,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
      timeStamp: 1000,
    };

    // Trigger the stored pointerdown listener
    const pointerdownFn = addedListeners.get('pointerdown');
    expect(pointerdownFn).toBeDefined();
    pointerdownFn!(pointerEvent);

    expect(listener).toHaveBeenCalledTimes(1);
    const emitted = listener.mock.calls[0][0];
    expect(emitted.type).toBe('pointerdown');
    expect(emitted.pressure).toBeGreaterThanOrEqual(0);
    expect(emitted.pressure).toBeLessThanOrEqual(1);
  });

  it('tracks active pointers', () => {
    expect(handler.getPointerCount()).toBe(0);

    const pointerEvent = {
      pointerId: 1,
      clientX: 100,
      clientY: 200,
      pressure: 0.5,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: 1,
      shiftKey: false,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
      timeStamp: 1000,
    };

    addedListeners.get('pointerdown')!(pointerEvent);
    expect(handler.getPointerCount()).toBe(1);
    expect(handler.isPointerActive(1)).toBe(true);

    addedListeners.get('pointerup')!(pointerEvent);
    expect(handler.getPointerCount()).toBe(0);
    expect(handler.isPointerActive(1)).toBe(false);
  });

  it('screenToCanvas applies coordinate transform', () => {
    handler.setCoordinateTransform(50, 100, 2);

    const listener = vi.fn();
    handler.on('pointer-down', listener);

    const pointerEvent = {
      pointerId: 1,
      clientX: 200,
      clientY: 300,
      pressure: 0.5,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: 1,
      shiftKey: false,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
      timeStamp: 1000,
    };

    addedListeners.get('pointerdown')!(pointerEvent);

    const emitted = listener.mock.calls[0][0];
    // screenX = clientX - rect.left = 200 - 0 = 200
    // canvasX = screenX / zoom + panX = 200 / 2 + 50 = 150
    expect(emitted.canvasX).toBe(150);
    // screenY = clientY - rect.top = 300 - 0 = 300
    // canvasY = screenY / zoom + panY = 300 / 2 + 100 = 250
    expect(emitted.canvasY).toBe(250);
  });
});

describe('PointerEventHandler - Stale Pointer Cleanup', () => {
  let handler: PointerEventHandler;
  let addedListeners: Map<string, Function>;
  let mockElement: any;

  const makePointerEvent = (overrides: Partial<Record<string, any>> = {}) => ({
    pointerId: 1,
    clientX: 100,
    clientY: 200,
    pressure: 0.5,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: 1,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    timeStamp: 1000,
    ...overrides,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    addedListeners = new Map();
    mockElement = {
      addEventListener: vi.fn((type: string, fn: Function, _options?: any) => {
        addedListeners.set(type, fn);
      }),
      removeEventListener: vi.fn(),
      getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 1920, height: 1080 })),
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    };
    handler = new PointerEventHandler(mockElement);
  });

  afterEach(() => {
    handler.destroy();
    vi.useRealTimers();
  });

  it('removes stale pointers that missed pointerup after 30s', () => {
    addedListeners.get('pointerdown')!(makePointerEvent({ pointerId: 42 }));
    expect(handler.getPointerCount()).toBe(1);

    // Cleanup interval fires every 30s; first fire at 30s checks > 30s (not yet),
    // second fire at 60s sees 60s of inactivity > 30s threshold → cleaned up
    vi.advanceTimersByTime(61_000);

    expect(handler.getPointerCount()).toBe(0);
    expect(handler.isPointerActive(42)).toBe(false);
  });

  it('keeps active pointers with recent move activity', () => {
    addedListeners.get('pointerdown')!(makePointerEvent({ pointerId: 7 }));

    // Move at 15s — refreshes lastActivity
    vi.advanceTimersByTime(15_000);
    addedListeners.get('pointermove')!(makePointerEvent({ pointerId: 7, clientX: 150 }));

    // At 35s total (20s since last move — under 30s threshold)
    vi.advanceTimersByTime(20_000);
    expect(handler.getPointerCount()).toBe(1);
    expect(handler.isPointerActive(7)).toBe(true);
  });

  it('clears the cleanup interval on destroy', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    handler.destroy();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
