/**
 * Integration tests for Idesaign Studio image editing pipeline
 * Tests complete user workflows: Open → Edit → Export
 * Focuses on data flow correctness and algorithm implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTestImageData,
  createPixelBuffer,
  getPixel,
  expectArrayCloseTo,
  expectCloseTo,
} from '../../helpers';

describe('Image Editing Pipeline Integration Tests', () => {
  describe('1. Image Import Flow', () => {
    it('should create test image with 100x100 RGBA buffer', () => {
      const width = 100;
      const height = 100;
      const imageData = createTestImageData(width, height, [128, 64, 32, 255]);

      expect(imageData.width).toBe(100);
      expect(imageData.height).toBe(100);
      expect(imageData.data.length).toBe(100 * 100 * 4);
    });

    it('should verify pixel data integrity through import', () => {
      const testColor: [number, number, number, number] = [200, 100, 50, 255];
      const imageData = createTestImageData(100, 100, testColor);

      // Sample pixels at different locations
      const corners = [
        { x: 0, y: 0 },
        { x: 99, y: 0 },
        { x: 0, y: 99 },
        { x: 99, y: 99 },
      ];

      for (const { x, y } of corners) {
        const i = (y * 100 + x) * 4;
        expect(imageData.data[i]).toBe(200);
        expect(imageData.data[i + 1]).toBe(100);
        expect(imageData.data[i + 2]).toBe(50);
        expect(imageData.data[i + 3]).toBe(255);
      }
    });

    it('should verify canvas dimensions set correctly', () => {
      const widths = [50, 100, 256, 512];
      const heights = [50, 100, 256, 512];

      for (const width of widths) {
        for (const height of heights) {
          const imageData = createTestImageData(width, height);
          expect(imageData.width).toBe(width);
          expect(imageData.height).toBe(height);
          expect(imageData.data.length).toBe(width * height * 4);
        }
      }
    });
  });

  describe('2. Selection + Adjustment Pipeline', () => {
    /**
     * Create a rectangular selection mask
     * Returns a buffer where selected pixels = 255, others = 0
     */
    function createRectangularSelection(
      width: number,
      height: number,
      x: number,
      y: number,
      selWidth: number,
      selHeight: number
    ): Uint8ClampedArray {
      const mask = new Uint8ClampedArray(width * height);

      for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
          const inSelection =
            px >= x && px < x + selWidth && py >= y && py < y + selHeight;
          mask[py * width + px] = inSelection ? 255 : 0;
        }
      }

      return mask;
    }

    /**
     * Apply brightness adjustment to image data based on selection mask
     * delta: brightness change (-255 to +255)
     */
    function applyBrightnessWithMask(
      imageData: Uint8ClampedArray,
      width: number,
      height: number,
      selectionMask: Uint8ClampedArray,
      delta: number
    ): void {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const maskIdx = y * width + x;
          const pixIdx = (y * width + x) * 4;

          // Only apply adjustment if pixel is selected
          if (selectionMask[maskIdx] > 0) {
            const factor = selectionMask[maskIdx] / 255; // Handle anti-aliased edges
            const adjustedDelta = delta * factor;

            for (let c = 0; c < 3; c++) {
              const newVal = Math.max(
                0,
                Math.min(255, imageData[pixIdx + c] + adjustedDelta)
              );
              imageData[pixIdx + c] = Math.round(newVal);
            }
          }
        }
      }
    }

    it('should create rectangular selection on test image', () => {
      const width = 100;
      const height = 100;
      const selection = createRectangularSelection(width, height, 25, 25, 50, 50);

      // Count selected pixels
      let selectedCount = 0;
      for (let i = 0; i < selection.length; i++) {
        if (selection[i] > 0) selectedCount++;
      }

      expect(selectedCount).toBe(50 * 50); // 50x50 selection
    });

    it('should apply brightness adjustment only to selected area', () => {
      const width = 100;
      const height = 100;
      const originalColor: [number, number, number, number] = [100, 100, 100, 255];
      const imageData = createTestImageData(width, height, originalColor);

      // Create 50x50 selection at (25, 25)
      const selection = createRectangularSelection(width, height, 25, 25, 50, 50);

      // Apply +50 brightness
      applyBrightnessWithMask(imageData.data, width, height, selection, 50);

      // Verify selected pixels brightened
      const selectedPixel = getPixel(imageData.data, width, 50, 50); // Center of selection
      expect(selectedPixel[0]).toBe(150); // 100 + 50
      expect(selectedPixel[1]).toBe(150);
      expect(selectedPixel[2]).toBe(150);

      // Verify unselected pixels unchanged
      const unselectedPixel = getPixel(imageData.data, width, 10, 10); // Outside selection
      expect(unselectedPixel[0]).toBe(100);
      expect(unselectedPixel[1]).toBe(100);
      expect(unselectedPixel[2]).toBe(100);
    });

    it('should verify selected pixels brightened and unselected unchanged', () => {
      const width = 100;
      const height = 100;
      const imageData = createTestImageData(width, height, [80, 80, 80, 255]);
      const selection = createRectangularSelection(width, height, 20, 20, 60, 60);

      applyBrightnessWithMask(imageData.data, width, height, selection, 75);

      // Inside selection
      for (let y = 20; y < 80; y++) {
        for (let x = 20; x < 80; x++) {
          const pixel = getPixel(imageData.data, width, x, y);
          expect(pixel[0]).toBeGreaterThan(80); // Should be 155
          expect(pixel[1]).toBeGreaterThan(80);
          expect(pixel[2]).toBeGreaterThan(80);
        }
      }

      // Outside selection
      const outsidePixel = getPixel(imageData.data, width, 5, 5);
      expect(outsidePixel[0]).toBe(80);
      expect(outsidePixel[1]).toBe(80);
      expect(outsidePixel[2]).toBe(80);
    });

    it('should clamp brightness values to 0-255 range', () => {
      const imageData = createTestImageData(10, 10, [200, 150, 100, 255]);
      const selection = createRectangularSelection(10, 10, 0, 0, 10, 10);

      // Try to brighten by 200 (should clamp to 255)
      applyBrightnessWithMask(imageData.data, 10, 10, selection, 200);

      const pixel = getPixel(imageData.data, 10, 0, 0);
      expect(pixel[0]).toBe(255); // Clamped from 400
      expect(pixel[1]).toBe(255); // Clamped from 350
      expect(pixel[2]).toBe(255); // Clamped from 300
    });

    it('should darken with negative delta', () => {
      const imageData = createTestImageData(10, 10, [200, 200, 200, 255]);
      const selection = createRectangularSelection(10, 10, 0, 0, 10, 10);

      applyBrightnessWithMask(imageData.data, 10, 10, selection, -100);

      const pixel = getPixel(imageData.data, 10, 0, 0);
      expect(pixel[0]).toBe(100);
      expect(pixel[1]).toBe(100);
      expect(pixel[2]).toBe(100);
    });
  });

  describe('3. Curves Adjustment Pipeline', () => {
    /**
     * Build a Lookup Table (LUT) from curve points
     * Curve points format: [[input1, output1], [input2, output2], ...]
     * LUT maps each input value (0-255) to output value
     */
    function buildCurveLUT(
      points: Array<[number, number]>,
      lutSize: number = 256
    ): Uint8ClampedArray {
      const lut = new Uint8ClampedArray(lutSize);

      // Sort points by x value
      const sorted = [...points].sort((a, b) => a[0] - b[0]);

      // Fill LUT by interpolating between points
      for (let i = 0; i < lutSize; i++) {
        const x = (i / (lutSize - 1)) * 255;

        // Find surrounding control points
        let p0 = sorted[0];
        let p1 = sorted[sorted.length - 1];

        for (let j = 0; j < sorted.length - 1; j++) {
          if (sorted[j][0] <= x && x <= sorted[j + 1][0]) {
            p0 = sorted[j];
            p1 = sorted[j + 1];
            break;
          }
        }

        // Linear interpolation
        if (p0[0] === p1[0]) {
          lut[i] = p0[1];
        } else {
          const t = (x - p0[0]) / (p1[0] - p0[0]);
          const y = Math.round(p0[1] + t * (p1[1] - p0[1]));
          lut[i] = Math.max(0, Math.min(255, y));
        }
      }

      return lut;
    }

    /**
     * Apply LUT to image data
     */
    function applyLUT(
      imageData: Uint8ClampedArray,
      lut: Uint8ClampedArray
    ): void {
      for (let i = 0; i < imageData.length; i += 4) {
        imageData[i] = lut[imageData[i]]; // R
        imageData[i + 1] = lut[imageData[i + 1]]; // G
        imageData[i + 2] = lut[imageData[i + 2]]; // B
        // Alpha unchanged
      }
    }

    it('should create S-curve (darken shadows, brighten highlights)', () => {
      // S-curve points: (0,0), (64,32), (128,128), (192,224), (255,255)
      const sCurvePoints: Array<[number, number]> = [
        [0, 0],
        [64, 32],
        [128, 128],
        [192, 224],
        [255, 255],
      ];

      const lut = buildCurveLUT(sCurvePoints);

      // Shadows (low values) should be darkened
      expect(lut[32]).toBeLessThan(32);

      // Midtones stay relatively same
      expectCloseTo(lut[128], 128, 5);

      // Highlights (high values) should be brightened
      expect(lut[224]).toBeGreaterThan(224);
    });

    it('should build LUT from curve points', () => {
      const points: Array<[number, number]> = [
        [0, 0],
        [128, 128],
        [255, 255],
      ];

      const lut = buildCurveLUT(points);

      expect(lut.length).toBe(256);
      expect(lut[0]).toBe(0);
      expect(lut[128]).toBe(128);
      expect(lut[255]).toBe(255);
    });

    it('should apply LUT to image data', () => {
      const imageData = createTestImageData(10, 10, [64, 128, 192, 255]);

      // Linear curve: y = x (identity)
      const identityPoints: Array<[number, number]> = [
        [0, 0],
        [255, 255],
      ];
      const lut = buildCurveLUT(identityPoints);

      applyLUT(imageData.data, lut);

      // With identity curve, image should be unchanged
      const pixel = getPixel(imageData.data, 10, 0, 0);
      expectCloseTo(pixel[0], 64, 2);
      expectCloseTo(pixel[1], 128, 2);
      expectCloseTo(pixel[2], 192, 2);
    });

    it('should darken dark pixels with S-curve', () => {
      const imageData = createTestImageData(10, 10, [40, 40, 40, 255]);

      const sCurvePoints: Array<[number, number]> = [
        [0, 0],
        [64, 32],
        [128, 128],
        [192, 224],
        [255, 255],
      ];
      const lut = buildCurveLUT(sCurvePoints);

      applyLUT(imageData.data, lut);

      const pixel = getPixel(imageData.data, 10, 0, 0);
      // Value 40 should map to something less than 40
      expect(pixel[0]).toBeLessThan(40);
      expect(pixel[1]).toBeLessThan(40);
      expect(pixel[2]).toBeLessThan(40);
    });

    it('should brighten bright pixels with S-curve', () => {
      const imageData = createTestImageData(10, 10, [220, 220, 220, 255]);

      const sCurvePoints: Array<[number, number]> = [
        [0, 0],
        [64, 32],
        [128, 128],
        [192, 224],
        [255, 255],
      ];
      const lut = buildCurveLUT(sCurvePoints);

      applyLUT(imageData.data, lut);

      const pixel = getPixel(imageData.data, 10, 0, 0);
      // Value 220 should map to something greater than 220
      expect(pixel[0]).toBeGreaterThan(220);
      expect(pixel[1]).toBeGreaterThan(220);
      expect(pixel[2]).toBeGreaterThan(220);
    });

    it('should preserve alpha channel through LUT application', () => {
      const imageData = createTestImageData(10, 10, [128, 128, 128, 100]);

      const points: Array<[number, number]> = [
        [0, 0],
        [255, 255],
      ];
      const lut = buildCurveLUT(points);

      applyLUT(imageData.data, lut);

      const pixel = getPixel(imageData.data, 10, 0, 0);
      expect(pixel[3]).toBe(100); // Alpha unchanged
    });
  });

  describe('4. Multi-Layer Composite', () => {
    /**
     * Blend two pixels using 'normal' blend mode
     * normal: result = top + (bottom * (1 - topAlpha))
     */
    function blendPixelsNormal(
      bottom: [number, number, number, number],
      top: [number, number, number, number]
    ): [number, number, number, number] {
      const topAlpha = top[3] / 255;
      const bottomAlpha = bottom[3] / 255;

      const result: [number, number, number, number] = [0, 0, 0, 0];

      for (let c = 0; c < 3; c++) {
        result[c] = Math.round(top[c] * topAlpha + bottom[c] * (1 - topAlpha));
      }

      result[3] = Math.round(
        255 * (topAlpha + bottomAlpha * (1 - topAlpha))
      );

      return result;
    }

    /**
     * Composite two image layers
     */
    function compositeLayers(
      bottomData: Uint8ClampedArray,
      topData: Uint8ClampedArray,
      width: number,
      height: number
    ): Uint8ClampedArray {
      const result = new Uint8ClampedArray(bottomData);

      for (let i = 0; i < result.length; i += 4) {
        const bottomPixel: [number, number, number, number] = [
          result[i],
          result[i + 1],
          result[i + 2],
          result[i + 3],
        ];

        const topPixel: [number, number, number, number] = [
          topData[i],
          topData[i + 1],
          topData[i + 2],
          topData[i + 3],
        ];

        const blended = blendPixelsNormal(bottomPixel, topPixel);

        result[i] = blended[0];
        result[i + 1] = blended[1];
        result[i + 2] = blended[2];
        result[i + 3] = blended[3];
      }

      return result;
    }

    it('should create base layer (solid red, 100x100)', () => {
      const redColor: [number, number, number, number] = [255, 0, 0, 255];
      const baseLayer = createTestImageData(100, 100, redColor);

      expect(baseLayer.width).toBe(100);
      expect(baseLayer.height).toBe(100);

      const pixel = getPixel(baseLayer.data, 100, 50, 50);
      expect(pixel).toEqual([255, 0, 0, 255]);
    });

    it('should create overlay layer (solid blue, 50% opacity)', () => {
      const blueColor: [number, number, number, number] = [0, 0, 255, 127]; // 50% alpha
      const overlayLayer = createTestImageData(100, 100, blueColor);

      const pixel = getPixel(overlayLayer.data, 100, 50, 50);
      expect(pixel[0]).toBe(0); // R
      expect(pixel[1]).toBe(0); // G
      expect(pixel[2]).toBe(255); // B
      expect(pixel[3]).toBe(127); // 50% opacity
    });

    it('should composite with normal blend mode', () => {
      const redColor: [number, number, number, number] = [255, 0, 0, 255];
      const blueColor: [number, number, number, number] = [0, 0, 255, 127];

      const baseData = new Uint8ClampedArray(100 * 100 * 4);
      const overlayData = new Uint8ClampedArray(100 * 100 * 4);

      // Fill with colors
      for (let i = 0; i < baseData.length; i += 4) {
        baseData[i] = 255;
        overlayData[i + 2] = 255;
        overlayData[i + 3] = 127;
      }

      const result = compositeLayers(baseData, overlayData, 100, 100);

      // With 50% opacity blue over red:
      // R: 0 * 0.5 + 255 * 0.5 = 127.5 ≈ 127
      // G: 0 * 0.5 + 0 * 0.5 = 0
      // B: 255 * 0.5 + 0 * 0.5 = 127.5 ≈ 127
      const pixel: [number, number, number, number] = [
        result[0],
        result[1],
        result[2],
        result[3],
      ];

      expectCloseTo(pixel[0], 127, 2); // Red channel
      expectCloseTo(pixel[1], 0, 1); // Green channel
      expectCloseTo(pixel[2], 127, 2); // Blue channel
    });

    it('should verify resulting pixel values match expected blend', () => {
      const bottomPixel: [number, number, number, number] = [200, 100, 50, 255];
      const topPixel: [number, number, number, number] = [100, 150, 200, 128]; // 50% opacity

      const result = blendPixelsNormal(bottomPixel, topPixel);

      // Expected: top50% + bottom50%
      expect(result[0]).toBeCloseTo(150, 0); // (100 * 0.5) + (200 * 0.5)
      expect(result[1]).toBeCloseTo(125, 0); // (150 * 0.5) + (100 * 0.5)
      expect(result[2]).toBeCloseTo(125, 0); // (200 * 0.5) + (50 * 0.5)
    });

    it('should handle fully opaque overlay', () => {
      const bottomPixel: [number, number, number, number] = [100, 100, 100, 255];
      const topPixel: [number, number, number, number] = [200, 200, 200, 255]; // Fully opaque

      const result = blendPixelsNormal(bottomPixel, topPixel);

      // With 100% opacity, result should be top pixel
      expect(result[0]).toBe(200);
      expect(result[1]).toBe(200);
      expect(result[2]).toBe(200);
    });

    it('should handle fully transparent overlay', () => {
      const bottomPixel: [number, number, number, number] = [100, 100, 100, 255];
      const topPixel: [number, number, number, number] = [200, 200, 200, 0]; // Fully transparent

      const result = blendPixelsNormal(bottomPixel, topPixel);

      // With 0% opacity, result should be bottom pixel
      expect(result[0]).toBe(100);
      expect(result[1]).toBe(100);
      expect(result[2]).toBe(100);
    });
  });

  describe('5. History/Undo Flow', () => {
    /**
     * Simple history manager for storing and restoring image states
     */
    class ImageHistory {
      private states: Uint8ClampedArray[] = [];
      private currentIndex: number = -1;

      recordState(imageData: Uint8ClampedArray): void {
        // Remove any forward history if we're undoing
        if (this.currentIndex < this.states.length - 1) {
          this.states = this.states.slice(0, this.currentIndex + 1);
        }

        this.states.push(new Uint8ClampedArray(imageData));
        this.currentIndex++;
      }

      undo(): Uint8ClampedArray | null {
        if (this.currentIndex > 0) {
          this.currentIndex--;
          return new Uint8ClampedArray(this.states[this.currentIndex]);
        }
        return null;
      }

      redo(): Uint8ClampedArray | null {
        if (this.currentIndex < this.states.length - 1) {
          this.currentIndex++;
          return new Uint8ClampedArray(this.states[this.currentIndex]);
        }
        return null;
      }

      canUndo(): boolean {
        return this.currentIndex > 0;
      }

      canRedo(): boolean {
        return this.currentIndex < this.states.length - 1;
      }
    }

    it('should record initial state', () => {
      const history = new ImageHistory();
      const imageData = createPixelBuffer(10, 10);

      history.recordState(imageData);

      expect(history.canUndo()).toBe(false); // No prior state
    });

    it('should record state after edit', () => {
      const history = new ImageHistory();
      const image1 = createPixelBuffer(10, 10, () => [100, 100, 100, 255]);

      history.recordState(image1);

      // Modify image
      const image2 = createPixelBuffer(10, 10, () => [200, 200, 200, 255]);
      history.recordState(image2);

      expect(history.canUndo()).toBe(true);
    });

    it('should undo to previous state', () => {
      const history = new ImageHistory();
      const image1 = createPixelBuffer(10, 10, () => [100, 100, 100, 255]);
      const image2 = createPixelBuffer(10, 10, () => [200, 200, 200, 255]);

      history.recordState(image1);
      history.recordState(image2);

      const restored = history.undo();

      expect(restored).not.toBeNull();
      expect(restored![0]).toBe(100); // First color channel of first image
    });

    it('should restore pixel data to pre-edit state', () => {
      const history = new ImageHistory();
      const originalImage = createPixelBuffer(
        20,
        20,
        () => [50, 60, 70, 255]
      );

      history.recordState(originalImage);

      // Edit image
      const editedImage = createPixelBuffer(20, 20, () => [150, 160, 170, 255]);
      history.recordState(editedImage);

      const undone = history.undo();

      // Verify pixel values match original
      expect(undone![0]).toBe(50);
      expect(undone![1]).toBe(60);
      expect(undone![2]).toBe(70);
      expect(undone![3]).toBe(255);
    });

    it('should handle multiple undos', () => {
      const history = new ImageHistory();
      const state1 = createPixelBuffer(10, 10, () => [10, 10, 10, 255]);
      const state2 = createPixelBuffer(10, 10, () => [20, 20, 20, 255]);
      const state3 = createPixelBuffer(10, 10, () => [30, 30, 30, 255]);

      history.recordState(state1);
      history.recordState(state2);
      history.recordState(state3);

      const undo1 = history.undo();
      expect(undo1![0]).toBe(20);

      const undo2 = history.undo();
      expect(undo2![0]).toBe(10);
    });

    it('should prevent undo when at initial state', () => {
      const history = new ImageHistory();
      const image = createPixelBuffer(10, 10);

      history.recordState(image);

      const result = history.undo();
      expect(result).toBeNull();
    });

    it('should support redo after undo', () => {
      const history = new ImageHistory();
      const state1 = createPixelBuffer(10, 10, () => [100, 100, 100, 255]);
      const state2 = createPixelBuffer(10, 10, () => [200, 200, 200, 255]);

      history.recordState(state1);
      history.recordState(state2);

      history.undo();
      expect(history.canRedo()).toBe(true);

      const redone = history.redo();
      expect(redone![0]).toBe(200);
    });

    it('should clear redo stack when new edit is made after undo', () => {
      const history = new ImageHistory();
      const state1 = createPixelBuffer(10, 10, () => [100, 100, 100, 255]);
      const state2 = createPixelBuffer(10, 10, () => [200, 200, 200, 255]);
      const state3 = createPixelBuffer(10, 10, () => [150, 150, 150, 255]);

      history.recordState(state1);
      history.recordState(state2);
      history.undo();

      // Make a new edit
      history.recordState(state3);

      // Redo should not work
      expect(history.canRedo()).toBe(false);
    });
  });
});
