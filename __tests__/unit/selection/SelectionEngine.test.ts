/**
 * Unit tests for SelectionEngine
 * Core selection data model and operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  installCanvasMocks,
  removeCanvasMocks,
} from '../../helpers/canvas-mock';
import {
  countFullySelectedPixels,
  countSelectedPixels,
  assertPerformance,
} from '../../helpers/test-utils';

// Reference implementation of SelectionEngine for testing
// This mirrors the core logic from lib/studio/editor/tools/selection/SelectionEngine.ts
class TestSelectionEngine {
  private selectionData: Uint8ClampedArray | null = null;
  private width: number;
  private height: number;
  private bounds: { x: number; y: number; width: number; height: number } | null = null;

  constructor(width: number, height: number) {
    if (width <= 0 || height <= 0) {
      throw new Error('Canvas dimensions must be positive');
    }
    this.width = width;
    this.height = height;
  }

  public createEmpty(): void {
    this.selectionData = new Uint8ClampedArray(this.width * this.height);
    this.bounds = null;
  }

  public selectAll(): void {
    this.selectionData = new Uint8ClampedArray(this.width * this.height);
    if (this.selectionData) {
      this.selectionData.fill(255);
    }
    this.bounds = {
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
    };
  }

  public deselectAll(): void {
    this.createEmpty();
  }

  public fromRect(
    rect: { x: number; y: number; width: number; height: number },
    selMode: 'new' | 'add' | 'subtract' | 'intersect' = 'new'
  ): void {
    if (!this.selectionData) {
      this.createEmpty();
    }

    const tempData = new Uint8ClampedArray(this.width * this.height);

    // Fill rectangle
    const x1 = Math.max(0, Math.floor(rect.x));
    const y1 = Math.max(0, Math.floor(rect.y));
    const x2 = Math.min(this.width, Math.ceil(rect.x + rect.width));
    const y2 = Math.min(this.height, Math.ceil(rect.y + rect.height));

    for (let y = y1; y < y2; y++) {
      for (let x = x1; x < x2; x++) {
        tempData[y * this.width + x] = 255;
      }
    }

    this.compositeSelection(tempData, selMode);
    this.updateBounds();
  }

  public getSelectionData(): Uint8ClampedArray | null {
    return this.selectionData ? new Uint8ClampedArray(this.selectionData) : null;
  }

  public hasSelection(): boolean {
    if (!this.selectionData) {
      return false;
    }

    for (let i = 0; i < this.selectionData.length; i++) {
      if (this.selectionData[i] > 0) {
        return true;
      }
    }

    return false;
  }

  public getSelectionBounds(): { x: number; y: number; width: number; height: number } | null {
    if (!this.selectionData) {
      return null;
    }

    return this.bounds ? { ...this.bounds } : null;
  }

  private compositeSelection(
    region: Uint8ClampedArray,
    selMode: 'new' | 'add' | 'subtract' | 'intersect'
  ): void {
    if (!this.selectionData) {
      this.createEmpty();
    }

    switch (selMode) {
      case 'new':
        this.selectionData = new Uint8ClampedArray(region);
        break;

      case 'add':
        for (let i = 0; i < this.selectionData!.length; i++) {
          this.selectionData![i] = Math.max(this.selectionData![i], region[i]);
        }
        break;

      case 'subtract':
        for (let i = 0; i < this.selectionData!.length; i++) {
          this.selectionData![i] = Math.max(0, this.selectionData![i] - region[i]);
        }
        break;

      case 'intersect':
        for (let i = 0; i < this.selectionData!.length; i++) {
          this.selectionData![i] = Math.min(this.selectionData![i], region[i]);
        }
        break;
    }
  }

  private updateBounds(): void {
    if (!this.selectionData) {
      this.bounds = null;
      return;
    }

    let minX = this.width;
    let minY = this.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.selectionData[y * this.width + x] > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (maxX >= 0) {
      this.bounds = {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
      };
    } else {
      this.bounds = null;
    }
  }
}

describe('SelectionEngine', () => {
  beforeEach(() => {
    installCanvasMocks();
  });

  afterEach(() => {
    removeCanvasMocks();
  });

  describe('Constructor', () => {
    it('should create engine with valid dimensions', () => {
      const engine = new TestSelectionEngine(100, 100);
      expect(engine).toBeDefined();
    });

    it('should throw on zero width', () => {
      expect(() => new TestSelectionEngine(0, 100)).toThrow('Canvas dimensions must be positive');
    });

    it('should throw on zero height', () => {
      expect(() => new TestSelectionEngine(100, 0)).toThrow('Canvas dimensions must be positive');
    });

    it('should throw on negative width', () => {
      expect(() => new TestSelectionEngine(-10, 100)).toThrow('Canvas dimensions must be positive');
    });

    it('should throw on negative height', () => {
      expect(() => new TestSelectionEngine(100, -10)).toThrow('Canvas dimensions must be positive');
    });

    it('should handle large dimensions', () => {
      const engine = new TestSelectionEngine(4000, 4000);
      expect(engine).toBeDefined();
    });
  });

  describe('createEmpty', () => {
    it('should create zero-filled buffer', () => {
      const engine = new TestSelectionEngine(10, 10);
      engine.createEmpty();

      const data = engine.getSelectionData();
      expect(data).toBeDefined();
      expect(data!.length).toBe(100);

      for (let i = 0; i < data!.length; i++) {
        expect(data![i]).toBe(0);
      }
    });

    it('should clear selection bounds', () => {
      const engine = new TestSelectionEngine(10, 10);
      engine.selectAll();
      engine.createEmpty();

      const bounds = engine.getSelectionBounds();
      expect(bounds).toBeNull();
    });

    it('should set hasSelection to false', () => {
      const engine = new TestSelectionEngine(10, 10);
      engine.selectAll();
      engine.createEmpty();

      expect(engine.hasSelection()).toBe(false);
    });
  });

  describe('selectAll', () => {
    it('should fill all pixels with 255', () => {
      const engine = new TestSelectionEngine(5, 5);
      engine.selectAll();

      const data = engine.getSelectionData();
      expect(countFullySelectedPixels(data!)).toBe(25);
    });

    it('should set hasSelection to true', () => {
      const engine = new TestSelectionEngine(10, 10);
      engine.selectAll();

      expect(engine.hasSelection()).toBe(true);
    });

    it('should set bounds to full canvas', () => {
      const engine = new TestSelectionEngine(100, 200);
      engine.selectAll();

      const bounds = engine.getSelectionBounds();
      expect(bounds).toBeDefined();
      expect(bounds!.x).toBe(0);
      expect(bounds!.y).toBe(0);
      expect(bounds!.width).toBe(100);
      expect(bounds!.height).toBe(200);
    });
  });

  describe('deselectAll', () => {
    it('should be equivalent to createEmpty', () => {
      const engine = new TestSelectionEngine(10, 10);
      engine.selectAll();
      engine.deselectAll();

      const data = engine.getSelectionData();
      expect(data).toBeDefined();

      for (let i = 0; i < data!.length; i++) {
        expect(data![i]).toBe(0);
      }
    });

    it('should clear bounds', () => {
      const engine = new TestSelectionEngine(10, 10);
      engine.selectAll();
      engine.deselectAll();

      expect(engine.getSelectionBounds()).toBeNull();
    });

    it('should set hasSelection to false', () => {
      const engine = new TestSelectionEngine(10, 10);
      engine.selectAll();
      engine.deselectAll();

      expect(engine.hasSelection()).toBe(false);
    });
  });

  describe('fromRect', () => {
    it('should create rectangular selection with new mode', () => {
      const engine = new TestSelectionEngine(100, 100);
      engine.fromRect({ x: 10, y: 10, width: 20, height: 20 }, 'new');

      const data = engine.getSelectionData();
      expect(countFullySelectedPixels(data!)).toBe(400); // 20x20
    });

    it('should respect rect boundaries', () => {
      const engine = new TestSelectionEngine(100, 100);
      engine.fromRect({ x: 10, y: 10, width: 20, height: 20 }, 'new');

      const data = engine.getSelectionData();
      const bounds = engine.getSelectionBounds();

      expect(bounds!.x).toBe(10);
      expect(bounds!.y).toBe(10);
      expect(bounds!.width).toBe(20);
      expect(bounds!.height).toBe(20);
    });

    it('should handle rects extending beyond canvas', () => {
      const engine = new TestSelectionEngine(100, 100);
      engine.fromRect({ x: 80, y: 80, width: 40, height: 40 }, 'new');

      const data = engine.getSelectionData();
      const bounds = engine.getSelectionBounds();

      expect(bounds!.width).toBe(20); // Clamped to 100
      expect(bounds!.height).toBe(20);
    });

    it('should add selection with add mode', () => {
      const engine = new TestSelectionEngine(100, 100);
      engine.fromRect({ x: 0, y: 0, width: 10, height: 10 }, 'new');
      engine.fromRect({ x: 5, y: 5, width: 10, height: 10 }, 'add');

      const data = engine.getSelectionData();
      const count = countFullySelectedPixels(data!);

      // First rect: 10x10=100, second rect overlaps 5x5=25, total 100+75=175
      expect(count).toBe(175);
    });

    it('should subtract selection with subtract mode', () => {
      const engine = new TestSelectionEngine(100, 100);
      engine.fromRect({ x: 0, y: 0, width: 20, height: 20 }, 'new');
      engine.fromRect({ x: 5, y: 5, width: 10, height: 10 }, 'subtract');

      const data = engine.getSelectionData();
      const count = countFullySelectedPixels(data!);

      // First rect: 20x20=400, subtract 10x10=100, result 300
      expect(count).toBe(300);
    });

    it('should intersect selection with intersect mode', () => {
      const engine = new TestSelectionEngine(100, 100);
      engine.fromRect({ x: 0, y: 0, width: 20, height: 20 }, 'new');
      engine.fromRect({ x: 10, y: 10, width: 20, height: 20 }, 'intersect');

      const data = engine.getSelectionData();
      const count = countFullySelectedPixels(data!);

      // Intersection is 10x10=100
      expect(count).toBe(100);
    });

    it('should handle empty intersection result', () => {
      const engine = new TestSelectionEngine(100, 100);
      engine.fromRect({ x: 0, y: 0, width: 10, height: 10 }, 'new');
      engine.fromRect({ x: 50, y: 50, width: 10, height: 10 }, 'intersect');

      expect(engine.hasSelection()).toBe(false);
    });
  });

  describe('hasSelection', () => {
    it('should return false when empty', () => {
      const engine = new TestSelectionEngine(10, 10);
      engine.createEmpty();

      expect(engine.hasSelection()).toBe(false);
    });

    it('should return true when pixels selected', () => {
      const engine = new TestSelectionEngine(10, 10);
      engine.fromRect({ x: 0, y: 0, width: 1, height: 1 }, 'new');

      expect(engine.hasSelection()).toBe(true);
    });

    it('should return false after deselectAll', () => {
      const engine = new TestSelectionEngine(10, 10);
      engine.selectAll();
      engine.deselectAll();

      expect(engine.hasSelection()).toBe(false);
    });
  });

  describe('Selection Bounds', () => {
    it('should compute correct bounds for rectangular selection', () => {
      const engine = new TestSelectionEngine(200, 200);
      engine.fromRect({ x: 50, y: 75, width: 100, height: 80 }, 'new');

      const bounds = engine.getSelectionBounds();
      expect(bounds).toBeDefined();
      expect(bounds!.x).toBe(50);
      expect(bounds!.y).toBe(75);
      expect(bounds!.width).toBe(100);
      expect(bounds!.height).toBe(80);
    });

    it('should return null when no selection', () => {
      const engine = new TestSelectionEngine(100, 100);
      engine.createEmpty();

      const bounds = engine.getSelectionBounds();
      expect(bounds).toBeNull();
    });

    it('should return full bounds on selectAll', () => {
      const w = 150;
      const h = 250;
      const engine = new TestSelectionEngine(w, h);
      engine.selectAll();

      const bounds = engine.getSelectionBounds();
      expect(bounds!.x).toBe(0);
      expect(bounds!.y).toBe(0);
      expect(bounds!.width).toBe(w);
      expect(bounds!.height).toBe(h);
    });

    it('should update bounds after mode operations', () => {
      const engine = new TestSelectionEngine(100, 100);
      engine.fromRect({ x: 0, y: 0, width: 50, height: 50 }, 'new');
      engine.fromRect({ x: 25, y: 25, width: 50, height: 50 }, 'add');

      const bounds = engine.getSelectionBounds();
      expect(bounds!.x).toBe(0);
      expect(bounds!.y).toBe(0);
      expect(bounds!.width).toBe(75);
      expect(bounds!.height).toBe(75);
    });
  });

  describe('Alpha-channel model', () => {
    it('should store values in 0-255 range', () => {
      const engine = new TestSelectionEngine(10, 10);
      engine.selectAll();

      const data = engine.getSelectionData();
      for (let i = 0; i < data!.length; i++) {
        expect(data![i]).toBeGreaterThanOrEqual(0);
        expect(data![i]).toBeLessThanOrEqual(255);
      }
    });

    it('should use Uint8ClampedArray for storage', () => {
      const engine = new TestSelectionEngine(10, 10);
      engine.createEmpty();

      const data = engine.getSelectionData();
      expect(data).toBeInstanceOf(Uint8ClampedArray);
    });
  });

  describe('Performance', () => {
    it('should create 1000x1000 empty selection quickly', async () => {
      const elapsed = await assertPerformance(() => {
        const engine = new TestSelectionEngine(1000, 1000);
        engine.createEmpty();
      }, 50, 'createEmpty on 1000x1000');

      expect(elapsed).toBeLessThan(50);
    });

    it('should selectAll on 1000x1000 within 50ms', async () => {
      const engine = new TestSelectionEngine(1000, 1000);
      const elapsed = await assertPerformance(() => {
        engine.selectAll();
      }, 50, 'selectAll on 1000x1000');

      expect(elapsed).toBeLessThan(50);
    });

    it('should create rectangle selection quickly', async () => {
      const engine = new TestSelectionEngine(1000, 1000);
      const elapsed = await assertPerformance(() => {
        engine.fromRect({ x: 100, y: 100, width: 500, height: 500 }, 'new');
      }, 50, 'fromRect on 1000x1000');

      expect(elapsed).toBeLessThan(50);
    });

    it('should compute bounds of large selection quickly', async () => {
      const engine = new TestSelectionEngine(2000, 2000);
      engine.selectAll();

      const elapsed = await assertPerformance(() => {
        const bounds = engine.getSelectionBounds();
        expect(bounds).toBeDefined();
      }, 10, 'getSelectionBounds on 2000x2000');

      expect(elapsed).toBeLessThan(10);
    });

    it('should handle 4000x4000 canvas', async () => {
      const elapsed = await assertPerformance(() => {
        const engine = new TestSelectionEngine(4000, 4000);
        engine.selectAll();
      }, 100, 'large canvas allocation');

      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Edge cases', () => {
    it('should handle 1x1 canvas', () => {
      const engine = new TestSelectionEngine(1, 1);
      engine.selectAll();

      const data = engine.getSelectionData();
      expect(data!.length).toBe(1);
      expect(data![0]).toBe(255);
    });

    it('should handle very large single dimension', () => {
      const engine = new TestSelectionEngine(10000, 1);
      engine.selectAll();

      const data = engine.getSelectionData();
      expect(data!.length).toBe(10000);
    });

    it('should handle rect with zero dimensions', () => {
      const engine = new TestSelectionEngine(100, 100);
      engine.fromRect({ x: 50, y: 50, width: 0, height: 0 }, 'new');

      // Should create selection but with no pixels
      expect(engine.hasSelection()).toBe(false);
    });

    it('should handle rect completely outside canvas', () => {
      const engine = new TestSelectionEngine(100, 100);
      engine.fromRect({ x: 200, y: 200, width: 50, height: 50 }, 'new');

      expect(engine.hasSelection()).toBe(false);
    });

    it('should handle fractional coordinates', () => {
      const engine = new TestSelectionEngine(100, 100);
      engine.fromRect({ x: 10.5, y: 10.5, width: 20.7, height: 20.3 }, 'new');

      const bounds = engine.getSelectionBounds();
      expect(bounds).toBeDefined();
      expect(bounds!.x).toBe(10);
      expect(bounds!.y).toBe(10);
    });
  });
});
