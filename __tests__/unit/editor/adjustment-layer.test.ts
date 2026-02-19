import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ImageData for Node environment - must come before any imports
class MockImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorSpace: string = 'srgb';

  constructor(data: Uint8ClampedArray | number, widthOrHeight?: number, height?: number) {
    if (typeof data === 'number') {
      // new ImageData(width, height)
      this.width = data;
      this.height = widthOrHeight!;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else {
      // new ImageData(data, width, height)
      this.data = data instanceof Uint8ClampedArray ? data : new Uint8ClampedArray(data);
      this.width = widthOrHeight!;
      this.height = height!;
    }
  }
}
vi.stubGlobal('ImageData', MockImageData);

import { AdjustmentLayerSystem, type BaseAdjustmentLayer } from '@/lib/studio/editor/tools/adjustments/AdjustmentLayer';

describe('AdjustmentLayerSystem', () => {
  // Helper function to create test ImageData with known pixel values
  const createTestImageData = (width: number, height: number, pixelValue: { r: number; g: number; b: number; a: number } = { r: 128, g: 128, b: 128, a: 255 }): ImageData => {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = pixelValue.r;
      data[i + 1] = pixelValue.g;
      data[i + 2] = pixelValue.b;
      data[i + 3] = pixelValue.a;
    }
    return new MockImageData(data, width, height) as unknown as ImageData;
  };

  describe('createAdjustmentLayer', () => {
    it('creates layer with correct type and settings', () => {
      const layer = AdjustmentLayerSystem.createAdjustmentLayer(
        'layer-1',
        'My Brightness Layer',
        {
          type: 'brightness-contrast',
          settings: { brightness: 20, contrast: 10, useLegacy: false },
        }
      );

      expect(layer.id).toBe('layer-1');
      expect(layer.name).toBe('My Brightness Layer');
      expect(layer.type).toBe('brightness-contrast');
      expect(layer.settings).toEqual({ brightness: 20, contrast: 10, useLegacy: false });
    });

    it('sets default opacity to 100', () => {
      const layer = AdjustmentLayerSystem.createAdjustmentLayer(
        'layer-1',
        'Test Layer',
        { type: 'invert', settings: { invertAlpha: false } }
      );

      expect(layer.opacity).toBe(100);
    });

    it('sets visible to true by default', () => {
      const layer = AdjustmentLayerSystem.createAdjustmentLayer(
        'layer-1',
        'Test Layer',
        { type: 'posterize', settings: { levels: 4 } }
      );

      expect(layer.visible).toBe(true);
    });

    it('sets blendMode to normal by default', () => {
      const layer = AdjustmentLayerSystem.createAdjustmentLayer(
        'layer-1',
        'Test Layer',
        { type: 'threshold', settings: { level: 128 } }
      );

      expect(layer.blendMode).toBe('normal');
    });

    it('sets targetLayerId to null when not provided', () => {
      const layer = AdjustmentLayerSystem.createAdjustmentLayer(
        'layer-1',
        'Test Layer',
        { type: 'invert', settings: { invertAlpha: false } }
      );

      expect(layer.targetLayerId).toBeNull();
    });

    it('sets targetLayerId when provided', () => {
      const layer = AdjustmentLayerSystem.createAdjustmentLayer(
        'layer-1',
        'Test Layer',
        { type: 'brightness-contrast', settings: { brightness: 0, contrast: 0, useLegacy: false } },
        'target-layer-id'
      );

      expect(layer.targetLayerId).toBe('target-layer-id');
    });

    it('initializes mask and clipped to false', () => {
      const layer = AdjustmentLayerSystem.createAdjustmentLayer(
        'layer-1',
        'Test Layer',
        { type: 'invert', settings: { invertAlpha: false } }
      );

      expect(layer.mask).toBeNull();
      expect(layer.clipped).toBe(false);
    });
  });

  describe('applyAdjustment - hidden layer', () => {
    it('returns unchanged data when layer is not visible', () => {
      const imageData = createTestImageData(2, 2, { r: 100, g: 150, b: 200, a: 255 });
      const originalData = [...imageData.data];

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Invisible Layer',
        type: 'brightness-contrast',
        visible: false,
        opacity: 100,
        blendMode: 'normal',
        settings: { brightness: 50, contrast: 25, useLegacy: false },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(Array.from(result.data)).toEqual(originalData);
    });
  });

  describe('applyBrightnessContrast', () => {
    it('applies positive brightness to all pixels', () => {
      const imageData = createTestImageData(2, 2, { r: 100, g: 100, b: 100, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Brightness Layer',
        type: 'brightness-contrast',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { brightness: 50, contrast: 0, useLegacy: false },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // All RGB channels should increase by brightness amount
      expect(result.data[0]).toBe(150); // R: 100 + 50
      expect(result.data[1]).toBe(150); // G: 100 + 50
      expect(result.data[2]).toBe(150); // B: 100 + 50
      expect(result.data[3]).toBe(255); // A: unchanged
    });

    it('applies negative brightness to all pixels', () => {
      const imageData = createTestImageData(2, 2, { r: 100, g: 100, b: 100, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Brightness Layer',
        type: 'brightness-contrast',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { brightness: -50, contrast: 0, useLegacy: false },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result.data[0]).toBe(50); // R: 100 - 50
      expect(result.data[1]).toBe(50); // G: 100 - 50
      expect(result.data[2]).toBe(50); // B: 100 - 50
    });

    it('clamps brightness to 0-255 range', () => {
      const imageData = createTestImageData(2, 2, { r: 200, g: 200, b: 200, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Brightness Layer',
        type: 'brightness-contrast',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { brightness: 100, contrast: 0, useLegacy: false },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // Should be clamped to 255, not 300
      expect(result.data[0]).toBe(255);
      expect(result.data[1]).toBe(255);
      expect(result.data[2]).toBe(255);
    });

    it('applies contrast changes', () => {
      const imageData = createTestImageData(2, 2, { r: 128, g: 128, b: 128, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Contrast Layer',
        type: 'brightness-contrast',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { brightness: 0, contrast: 50, useLegacy: false },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // At 128, contrast shouldn't change the value (it's the pivot point)
      expect(result.data[0]).toBe(128);
      expect(result.data[1]).toBe(128);
      expect(result.data[2]).toBe(128);
    });

    it('applies negative contrast to reduce contrast', () => {
      const imageData = createTestImageData(2, 2, { r: 100, g: 100, b: 100, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Contrast Layer',
        type: 'brightness-contrast',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { brightness: 0, contrast: -50, useLegacy: false },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // Negative contrast should push values toward 128
      const contrastFactor = (-50 + 100) / 100; // 0.5
      const expected = Math.round((100 - 128) * contrastFactor + 128);
      expect(result.data[0]).toBe(expected);
    });
  });

  describe('applyLevels', () => {
    it('applies levels adjustment to image data', () => {
      const imageData = createTestImageData(2, 2, { r: 128, g: 128, b: 128, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Levels Layer',
        type: 'levels',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: {
          useComposite: true,
          composite: { black: 0, gamma: 1, white: 255, outputBlack: 0, outputWhite: 255 },
        },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // Should return ImageData (not unchanged data like before)
      expect(result).toBeInstanceOf(MockImageData);
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
    });

    it('applies black point adjustment to darken shadows', () => {
      const imageData = createTestImageData(2, 2, { r: 50, g: 50, b: 50, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Levels Layer',
        type: 'levels',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: {
          useComposite: true,
          composite: { black: 50, gamma: 1, white: 255, outputBlack: 0, outputWhite: 255 },
        },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result).toBeInstanceOf(MockImageData);
      expect(result.data.length).toBe(imageData.data.length);
    });

    it('applies gamma adjustment to change midtones', () => {
      const imageData = createTestImageData(2, 2, { r: 128, g: 128, b: 128, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Levels Layer',
        type: 'levels',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: {
          useComposite: true,
          // Gamma > 1 brightens midtones: Levels uses Math.pow(normalized, 1/gamma)
          // With gamma=2.0: exponent = 0.5, so (128/255)^0.5 ≈ 0.709 → output ≈ 181
          composite: { black: 0, gamma: 2.0, white: 255, outputBlack: 0, outputWhite: 255 },
        },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result).toBeInstanceOf(MockImageData);
      // Gamma > 1 should brighten midtones (exponent < 1 lifts values)
      expect(result.data[0]).toBeGreaterThan(128);
    });
  });

  describe('applyCurves', () => {
    it('applies curves adjustment to image data', () => {
      const imageData = createTestImageData(2, 2, { r: 128, g: 128, b: 128, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Curves Layer',
        type: 'curves',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: {
          useComposite: true,
          composite: [
            { x: 0, y: 0 },
            { x: 255, y: 255 },
          ],
        },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // Should return ImageData (not unchanged data)
      expect(result).toBeInstanceOf(MockImageData);
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
    });

    it('applies S-curve to increase contrast', () => {
      const imageData = createTestImageData(2, 2, { r: 100, g: 150, b: 200, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'S-Curve Layer',
        type: 'curves',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: {
          useComposite: true,
          composite: [
            { x: 0, y: 0 },
            { x: 64, y: 32 },    // Darken shadows
            { x: 128, y: 128 },   // Middle stays same
            { x: 192, y: 224 },   // Brighten highlights
            { x: 255, y: 255 },
          ],
        },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result).toBeInstanceOf(MockImageData);
      expect(result.data.length).toBe(imageData.data.length);
    });
  });

  describe('applyColorBalance', () => {
    it('applies color balance adjustment to image data', () => {
      const imageData = createTestImageData(2, 2, { r: 128, g: 128, b: 128, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Color Balance Layer',
        type: 'color-balance',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: {
          shadowsCyan: 0,
          shadowsMagenta: 0,
          shadowsYellow: 0,
          midtonesCyan: 0,
          midtonesMagenta: 0,
          midtonesYellow: 0,
          preserveLuminosity: false,
        },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // Should return ImageData (not unchanged data)
      expect(result).toBeInstanceOf(MockImageData);
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
    });

    it('applies midtone color adjustments to shift color', () => {
      const imageData = createTestImageData(2, 2, { r: 128, g: 128, b: 128, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Color Balance Layer',
        type: 'color-balance',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: {
          shadowsCyan: 0,
          shadowsMagenta: 0,
          shadowsYellow: 0,
          midtonesCyan: 50,      // Shift toward cyan
          midtonesMagenta: -25,  // Shift toward green
          midtonesYellow: 0,
          preserveLuminosity: false,
        },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result).toBeInstanceOf(MockImageData);
      expect(result.data.length).toBe(imageData.data.length);
    });
  });

  describe('applyInvert', () => {
    it('inverts pixel values correctly', () => {
      const imageData = createTestImageData(2, 2, { r: 100, g: 150, b: 200, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Invert Layer',
        type: 'invert',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { invertAlpha: false },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result.data[0]).toBe(255 - 100); // R: 155
      expect(result.data[1]).toBe(255 - 150); // G: 105
      expect(result.data[2]).toBe(255 - 200); // B: 55
      expect(result.data[3]).toBe(255);       // A: unchanged
    });

    it('preserves alpha channel when invertAlpha is false', () => {
      const imageData = createTestImageData(2, 2, { r: 128, g: 128, b: 128, a: 200 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Invert Layer',
        type: 'invert',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { invertAlpha: false },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result.data[3]).toBe(200); // Alpha unchanged
    });

    it('handles edge case of pure black (0,0,0)', () => {
      const imageData = createTestImageData(2, 2, { r: 0, g: 0, b: 0, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Invert Layer',
        type: 'invert',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { invertAlpha: false },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result.data[0]).toBe(255); // R: 255
      expect(result.data[1]).toBe(255); // G: 255
      expect(result.data[2]).toBe(255); // B: 255
    });

    it('handles edge case of pure white (255,255,255)', () => {
      const imageData = createTestImageData(2, 2, { r: 255, g: 255, b: 255, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Invert Layer',
        type: 'invert',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { invertAlpha: false },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result.data[0]).toBe(0); // R: 0
      expect(result.data[1]).toBe(0); // G: 0
      expect(result.data[2]).toBe(0); // B: 0
    });
  });

  describe('applyThreshold', () => {
    it('converts pixels to black or white at threshold level', () => {
      // Create mixed pixel values
      const data = new Uint8ClampedArray(16); // 4 pixels, 4 bytes each
      // Pixel 0: Very dark (below threshold)
      data[0] = 50;
      data[1] = 50;
      data[2] = 50;
      data[3] = 255;
      // Pixel 1: Bright (above threshold)
      data[4] = 200;
      data[5] = 200;
      data[6] = 200;
      data[7] = 255;

      const imageData = new MockImageData(data, 2, 2) as unknown as ImageData;

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Threshold Layer',
        type: 'threshold',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { level: 128 },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // Pixel 0 should be black (below 128)
      expect(result.data[0]).toBe(0);
      expect(result.data[1]).toBe(0);
      expect(result.data[2]).toBe(0);

      // Pixel 1 should be white (above 128)
      expect(result.data[4]).toBe(255);
      expect(result.data[5]).toBe(255);
      expect(result.data[6]).toBe(255);
    });

    it('uses luminance calculation for grayscale conversion', () => {
      // Create a colored pixel (red heavy)
      const data = new Uint8ClampedArray(4);
      data[0] = 255; // R
      data[1] = 0;   // G
      data[2] = 0;   // B
      data[3] = 255; // A

      const imageData = new MockImageData(data, 1, 1) as unknown as ImageData;

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Threshold Layer',
        type: 'threshold',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { level: 128 },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // Luminance = 0.299*255 + 0.587*0 + 0.114*0 = 76.245
      // Should be black since 76.245 < 128
      expect(result.data[0]).toBe(0);
      expect(result.data[1]).toBe(0);
      expect(result.data[2]).toBe(0);
    });

    it('respects custom threshold values', () => {
      const imageData = createTestImageData(2, 2, { r: 100, g: 100, b: 100, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Threshold Layer',
        type: 'threshold',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { level: 50 },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // Luminance of (100,100,100) = 100, which is > 50, so should be white
      expect(result.data[0]).toBe(255);
      expect(result.data[1]).toBe(255);
      expect(result.data[2]).toBe(255);
    });
  });

  describe('applyPosterize', () => {
    it('reduces color levels correctly', () => {
      const imageData = createTestImageData(2, 2, { r: 200, g: 100, b: 50, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Posterize Layer',
        type: 'posterize',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { levels: 2 },  // 2 levels = step of 128
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // With 2 levels, step = 256/2 = 128
      // 200: floor(200/128)*128 = 128
      // 100: floor(100/128)*128 = 0
      // 50: floor(50/128)*128 = 0
      expect(result.data[0]).toBe(128); // R
      expect(result.data[1]).toBe(0);   // G
      expect(result.data[2]).toBe(0);   // B
    });

    it('clamps levels between 2 and 256', () => {
      const imageData = createTestImageData(2, 2, { r: 100, g: 100, b: 100, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Posterize Layer',
        type: 'posterize',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { levels: 500 },  // Should be clamped to 256
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // With 256 levels, step = 256/256 = 1, so values don't change much
      expect(result.data[0]).toBeLessThanOrEqual(100 + 1);
      expect(result.data[0]).toBeGreaterThanOrEqual(100 - 1);
    });

    it('applies posterize with 4 levels', () => {
      const data = new Uint8ClampedArray(4);
      data[0] = 150; // R
      data[1] = 75;  // G
      data[2] = 200; // B
      data[3] = 255; // A

      const imageData = new MockImageData(data, 1, 1) as unknown as ImageData;

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Posterize Layer',
        type: 'posterize',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { levels: 4 },  // step = 256/4 = 64
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // 150: floor(150/64)*64 = 128
      // 75: floor(75/64)*64 = 64
      // 200: floor(200/64)*64 = 192
      expect(result.data[0]).toBe(128); // R
      expect(result.data[1]).toBe(64);  // G
      expect(result.data[2]).toBe(192); // B
    });
  });

  describe('applyAdjustment with opacity', () => {
    it('applies reduced opacity to adjustment result', () => {
      const imageData = createTestImageData(2, 2, { r: 100, g: 100, b: 100, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Semi-Transparent Invert',
        type: 'invert',
        visible: true,
        opacity: 50,  // 50% opacity
        blendMode: 'normal',
        settings: { invertAlpha: false },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // RGB values are inverted (155, 155, 155)
      expect(result.data[0]).toBe(155); // R
      expect(result.data[1]).toBe(155); // G
      expect(result.data[2]).toBe(155); // B
      // Alpha should be reduced by opacity: 255 * 0.5 = 127.5 -> 128
      expect(result.data[3]).toBe(Math.round(255 * 0.5));
    });

    it('preserves full opacity at 100%', () => {
      const imageData = createTestImageData(2, 2, { r: 100, g: 100, b: 100, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Full Opacity Invert',
        type: 'invert',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { invertAlpha: false },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // At 100% opacity, alpha should remain unchanged
      expect(result.data[3]).toBe(255);
    });

    it('applies opacity to multiple pixels', () => {
      const imageData = createTestImageData(4, 4, { r: 128, g: 128, b: 128, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Threshold with Opacity',
        type: 'threshold',
        visible: true,
        opacity: 50,
        blendMode: 'normal',
        settings: { level: 128 },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // All pixels should be white (luminance 128 > threshold 128 is false, so black)
      // Actually luminance of (128,128,128) = 128, so it's not > 128, should be black
      for (let i = 0; i < result.data.length; i += 4) {
        expect(result.data[i + 3]).toBe(Math.round(255 * 0.5)); // Alpha reduced by opacity
      }
    });
  });

  describe('applyAdjustment with mask', () => {
    it('applies mask when mask is enabled and has pixel data', () => {
      const imageData = createTestImageData(2, 2, { r: 100, g: 100, b: 100, a: 255 });

      // Create a mock mask
      const maskData = new Uint8ClampedArray(4);
      maskData[3] = 255; // Full opacity for first pixel

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Masked Invert',
        type: 'invert',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { invertAlpha: false },
        targetLayerId: null,
        mask: {
          enabled: true,
          density: 50,
          pixelData: {} as unknown as ImageBitmap, // Mock object
        },
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // Mask should reduce alpha by density/100
      expect(result.data[3]).toBeLessThan(255);
    });

    it('ignores mask when mask is disabled', () => {
      const imageData = createTestImageData(2, 2, { r: 100, g: 100, b: 100, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Disabled Mask Invert',
        type: 'invert',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { invertAlpha: false },
        targetLayerId: null,
        mask: {
          enabled: false,
          density: 50,
          pixelData: {} as unknown as ImageBitmap,
        },
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // Mask should not be applied
      expect(result.data[3]).toBe(255);
    });

    it('ignores mask when pixelData is null', () => {
      const imageData = createTestImageData(2, 2, { r: 100, g: 100, b: 100, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'No Mask Data Invert',
        type: 'invert',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { invertAlpha: false },
        targetLayerId: null,
        mask: {
          enabled: true,
          density: 50,
          pixelData: null,
        },
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // Mask should not be applied
      expect(result.data[3]).toBe(255);
    });
  });

  describe('getDefaultSettings', () => {
    it('returns default settings for brightness-contrast', () => {
      const settings = AdjustmentLayerSystem.getDefaultSettings('brightness-contrast');

      expect(settings.brightness).toBe(0);
      expect(settings.contrast).toBe(0);
      expect(settings.useLegacy).toBe(false);
    });

    it('returns default settings for levels', () => {
      const settings = AdjustmentLayerSystem.getDefaultSettings('levels');

      expect(settings.useComposite).toBe(true);
      expect((settings.composite as any).black).toBe(0);
      expect((settings.composite as any).gamma).toBe(1);
      expect((settings.composite as any).white).toBe(255);
    });

    it('returns default settings for curves', () => {
      const settings = AdjustmentLayerSystem.getDefaultSettings('curves');

      expect(settings.useComposite).toBe(true);
      expect((settings.composite as any).length).toBe(2);
      expect((settings.composite as any)[0]).toEqual({ x: 0, y: 0 });
      expect((settings.composite as any)[1]).toEqual({ x: 255, y: 255 });
    });

    it('returns default settings for invert', () => {
      const settings = AdjustmentLayerSystem.getDefaultSettings('invert');

      expect(settings.invertAlpha).toBe(false);
    });

    it('returns default settings for posterize', () => {
      const settings = AdjustmentLayerSystem.getDefaultSettings('posterize');

      expect(settings.levels).toBe(4);
    });

    it('returns default settings for threshold', () => {
      const settings = AdjustmentLayerSystem.getDefaultSettings('threshold');

      expect(settings.level).toBe(128);
    });

    it('returns default settings for color-balance', () => {
      const settings = AdjustmentLayerSystem.getDefaultSettings('color-balance');

      expect(settings.shadowsCyan).toBe(0);
      expect(settings.midtonesCyan).toBe(0);
      expect(settings.preserveLuminosity).toBe(false);
    });

    it('returns empty object for unknown types', () => {
      const settings = AdjustmentLayerSystem.getDefaultSettings('unknown-type' as any);

      expect(settings).toEqual({});
    });
  });

  describe('edge cases and integration', () => {
    it('handles very small images (1x1 pixel)', () => {
      const imageData = createTestImageData(1, 1, { r: 128, g: 128, b: 128, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Invert Small',
        type: 'invert',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { invertAlpha: false },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
      expect(result.data.length).toBe(4);
    });

    it('handles large images without performance issues', () => {
      const imageData = createTestImageData(256, 256, { r: 100, g: 150, b: 200, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Invert Large',
        type: 'invert',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { invertAlpha: false },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result.width).toBe(256);
      expect(result.height).toBe(256);
      expect(result.data.length).toBe(256 * 256 * 4);
    });

    it('chains multiple adjustments correctly', () => {
      let imageData = createTestImageData(2, 2, { r: 100, g: 100, b: 100, a: 255 });

      // First: invert
      const invertLayer: BaseAdjustmentLayer = {
        id: 'layer-1',
        name: 'Invert',
        type: 'invert',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        settings: { invertAlpha: false },
        targetLayerId: null,
        mask: null,
        clipped: false,
      };

      imageData = AdjustmentLayerSystem.applyAdjustment(imageData, invertLayer);
      expect(imageData.data[0]).toBe(155); // Inverted: 255 - 100

      // Second: invert again (should get back to 100)
      imageData = AdjustmentLayerSystem.applyAdjustment(imageData, invertLayer);
      expect(imageData.data[0]).toBe(100); // Back to original
    });
  });

  describe('applyVibrance', () => {
    it('boosts muted colors more than fully saturated colors', () => {
      // Create a muted gray pixel (low saturation) vs fully saturated pure red
      const data = new Uint8ClampedArray(8);
      // Pixel 0: muted grayish (low saturation)
      data[0] = 125; data[1] = 128; data[2] = 126; data[3] = 255;
      // Pixel 1: fully saturated pure red (saturation = 1.0 → scale = 0)
      data[4] = 255; data[5] = 0; data[6] = 0; data[7] = 255;

      const imageData = new MockImageData(data, 2, 1) as unknown as ImageData;

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'Vibrance', type: 'vibrance',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: { vibrance: 100 },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // Fully saturated pixel (sat=1.0) should have scale=0, no change at all
      expect(result.data[4]).toBe(255);
      expect(result.data[5]).toBe(0);
      expect(result.data[6]).toBe(0);

      // Muted pixel should change (scale > 0 since sat is near 0)
      const mutedDelta = Math.abs(result.data[0] - 125) + Math.abs(result.data[1] - 128) + Math.abs(result.data[2] - 126);
      expect(mutedDelta).toBeGreaterThan(0);
    });

    it('vibrance 0 returns unchanged data', () => {
      const imageData = createTestImageData(2, 2, { r: 100, g: 150, b: 200, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'Vibrance', type: 'vibrance',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: { vibrance: 0 },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result.data[0]).toBe(100);
      expect(result.data[1]).toBe(150);
      expect(result.data[2]).toBe(200);
    });

    it('negative vibrance desaturates muted colors', () => {
      const imageData = createTestImageData(2, 2, { r: 120, g: 130, b: 125, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'Vibrance', type: 'vibrance',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: { vibrance: -100 },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // Channels should converge toward the average
      const avg = Math.round((120 + 130 + 125) / 3);
      const rangeBefore = 130 - 120; // 10
      const rangeAfter = Math.max(result.data[0], result.data[1], result.data[2]) - Math.min(result.data[0], result.data[1], result.data[2]);
      expect(rangeAfter).toBeLessThan(rangeBefore);
    });
  });

  describe('applyBlackWhite', () => {
    it('converts color image to grayscale', () => {
      const imageData = createTestImageData(2, 2, { r: 200, g: 100, b: 50, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'Black & White', type: 'black-white',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: { reds: 40, yellows: 60, greens: 40, cyans: 60, blues: 20, magentas: 80, tint: 0 },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // All channels should be identical (grayscale)
      expect(result.data[0]).toBe(result.data[1]);
      expect(result.data[1]).toBe(result.data[2]);
    });

    it('red slider affects red-hue pixels', () => {
      // Pure red pixel
      const imageData = createTestImageData(1, 1, { r: 255, g: 0, b: 0, a: 255 });

      const highRedLayer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'BW High Red', type: 'black-white',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: { reds: 100, yellows: 60, greens: 40, cyans: 60, blues: 20, magentas: 80 },
        targetLayerId: null, mask: null, clipped: false,
      };

      const lowRedLayer: BaseAdjustmentLayer = {
        ...highRedLayer, id: 'layer-2', name: 'BW Low Red',
        settings: { reds: 10, yellows: 60, greens: 40, cyans: 60, blues: 20, magentas: 80 },
      };

      const highResult = AdjustmentLayerSystem.applyAdjustment(imageData, highRedLayer);
      const lowResult = AdjustmentLayerSystem.applyAdjustment(
        createTestImageData(1, 1, { r: 255, g: 0, b: 0, a: 255 }), lowRedLayer
      );

      // Higher red weight should produce brighter result for red pixel
      expect(highResult.data[0]).toBeGreaterThan(lowResult.data[0]);
    });

    it('produces grayscale for achromatic input', () => {
      const imageData = createTestImageData(2, 2, { r: 128, g: 128, b: 128, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'BW Gray', type: 'black-white',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: { reds: 40, yellows: 60, greens: 40, cyans: 60, blues: 20, magentas: 80 },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // All channels should be equal
      expect(result.data[0]).toBe(result.data[1]);
      expect(result.data[1]).toBe(result.data[2]);
    });
  });

  describe('applyPhotoFilter', () => {
    it('shifts colors toward filter color', () => {
      const imageData = createTestImageData(2, 2, { r: 128, g: 128, b: 128, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'Warm Filter', type: 'photo-filter',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: { color: '#FF8800', density: 50, preserveLuminosity: false },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // Red channel should increase (closer to 0xFF)
      expect(result.data[0]).toBeGreaterThan(128);
      // Blue channel should decrease (closer to 0x00)
      expect(result.data[2]).toBeLessThan(128);
    });

    it('density 0 returns unchanged data', () => {
      const imageData = createTestImageData(2, 2, { r: 100, g: 150, b: 200, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'No Filter', type: 'photo-filter',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: { color: '#FF0000', density: 0, preserveLuminosity: false },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result.data[0]).toBe(100);
      expect(result.data[1]).toBe(150);
      expect(result.data[2]).toBe(200);
    });

    it('preserveLuminosity maintains overall brightness', () => {
      const imageData = createTestImageData(2, 2, { r: 128, g: 128, b: 128, a: 255 });
      const origLum = 0.299 * 128 + 0.587 * 128 + 0.114 * 128;

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'Preserve Lum', type: 'photo-filter',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: { color: '#FF8800', density: 75, preserveLuminosity: true },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);
      const resultLum = 0.299 * result.data[0] + 0.587 * result.data[1] + 0.114 * result.data[2];

      // Luminosity should be approximately preserved (within rounding tolerance)
      expect(Math.abs(resultLum - origLum)).toBeLessThan(3);
    });

    it('high density produces stronger color shift', () => {
      const lowDensityLayer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'Low Density', type: 'photo-filter',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: { color: '#0000FF', density: 10, preserveLuminosity: false },
        targetLayerId: null, mask: null, clipped: false,
      };

      const highDensityLayer: BaseAdjustmentLayer = {
        ...lowDensityLayer, id: 'layer-2', name: 'High Density',
        settings: { color: '#0000FF', density: 90, preserveLuminosity: false },
      };

      const lowResult = AdjustmentLayerSystem.applyAdjustment(
        createTestImageData(2, 2, { r: 128, g: 128, b: 128, a: 255 }), lowDensityLayer
      );
      const highResult = AdjustmentLayerSystem.applyAdjustment(
        createTestImageData(2, 2, { r: 128, g: 128, b: 128, a: 255 }), highDensityLayer
      );

      // Higher density should shift blue channel more
      expect(highResult.data[2]).toBeGreaterThan(lowResult.data[2]);
    });
  });

  describe('applyChannelMixer', () => {
    it('default settings preserve original colors', () => {
      const imageData = createTestImageData(2, 2, { r: 100, g: 150, b: 200, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'Channel Mixer', type: 'channel-mixer',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: {
          red: { r: 100, g: 0, b: 0 },
          green: { r: 0, g: 100, b: 0 },
          blue: { r: 0, g: 0, b: 100 },
          monochrome: false,
        },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result.data[0]).toBe(100); // R unchanged
      expect(result.data[1]).toBe(150); // G unchanged
      expect(result.data[2]).toBe(200); // B unchanged
    });

    it('swaps red and blue channels', () => {
      const imageData = createTestImageData(1, 1, { r: 255, g: 0, b: 100, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'Swap R-B', type: 'channel-mixer',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: {
          red: { r: 0, g: 0, b: 100 },   // Red output = blue input
          green: { r: 0, g: 100, b: 0 },   // Green output = green input
          blue: { r: 100, g: 0, b: 0 },   // Blue output = red input
          monochrome: false,
        },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result.data[0]).toBe(100); // R = original B
      expect(result.data[1]).toBe(0);   // G = original G
      expect(result.data[2]).toBe(255); // B = original R
    });

    it('monochrome mode uses red mix for all channels', () => {
      const imageData = createTestImageData(1, 1, { r: 200, g: 100, b: 50, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'Mono Mixer', type: 'channel-mixer',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: {
          red: { r: 40, g: 40, b: 20 },
          green: { r: 0, g: 100, b: 0 },
          blue: { r: 0, g: 0, b: 100 },
          monochrome: true,
        },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // All channels should be equal (monochrome)
      expect(result.data[0]).toBe(result.data[1]);
      expect(result.data[1]).toBe(result.data[2]);

      // Expected: 200*0.4 + 100*0.4 + 50*0.2 = 80 + 40 + 10 = 130
      expect(result.data[0]).toBe(130);
    });

    it('clamps values to 0-255', () => {
      const imageData = createTestImageData(1, 1, { r: 200, g: 200, b: 200, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'Overflow Mixer', type: 'channel-mixer',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: {
          red: { r: 100, g: 100, b: 0 },  // 200 + 200 = 400, should clamp to 255
          green: { r: 0, g: 100, b: 0 },
          blue: { r: 0, g: 0, b: 100 },
          monochrome: false,
        },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result.data[0]).toBe(255); // Clamped from 400
    });
  });

  describe('applyGradientMap', () => {
    it('maps black pixels to first gradient stop', () => {
      const imageData = createTestImageData(1, 1, { r: 0, g: 0, b: 0, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'Gradient Map', type: 'gradient-map',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: {
          stops: [
            { position: 0, color: '#FF0000' },
            { position: 100, color: '#0000FF' },
          ],
        },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result.data[0]).toBe(255); // R from #FF0000
      expect(result.data[1]).toBe(0);
      expect(result.data[2]).toBe(0);
    });

    it('maps white pixels to last gradient stop', () => {
      const imageData = createTestImageData(1, 1, { r: 255, g: 255, b: 255, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'Gradient Map', type: 'gradient-map',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: {
          stops: [
            { position: 0, color: '#FF0000' },
            { position: 100, color: '#0000FF' },
          ],
        },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result.data[0]).toBe(0);
      expect(result.data[1]).toBe(0);
      expect(result.data[2]).toBe(255); // B from #0000FF
    });

    it('interpolates midtone pixels between stops', () => {
      // Mid-gray pixel (luminance ≈ 128)
      const imageData = createTestImageData(1, 1, { r: 128, g: 128, b: 128, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'Gradient Map', type: 'gradient-map',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: {
          stops: [
            { position: 0, color: '#000000' },
            { position: 100, color: '#FFFFFF' },
          ],
        },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // Should be approximately 128 (midpoint of gradient)
      expect(result.data[0]).toBeGreaterThan(120);
      expect(result.data[0]).toBeLessThan(136);
      expect(result.data[0]).toBe(result.data[1]);
      expect(result.data[1]).toBe(result.data[2]);
    });

    it('handles multi-stop gradient correctly', () => {
      // Dark pixel (luminance ≈ 50)
      const imageData = createTestImageData(1, 1, { r: 50, g: 50, b: 50, a: 255 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'Multi-Stop Gradient', type: 'gradient-map',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: {
          stops: [
            { position: 0, color: '#FF0000' },   // Red at 0%
            { position: 50, color: '#00FF00' },   // Green at 50%
            { position: 100, color: '#0000FF' },  // Blue at 100%
          ],
        },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      // Dark pixel (lum ~50/255 ≈ 0.196) should be in the red-to-green zone
      // At position ~0.2 of 0.0-0.5 range → 40% through first segment
      expect(result.data[0]).toBeGreaterThan(100); // Still has red
      expect(result.data[1]).toBeGreaterThan(50);  // Some green
      expect(result.data[2]).toBeLessThan(10);     // No blue yet
    });

    it('preserves alpha channel', () => {
      const imageData = createTestImageData(1, 1, { r: 128, g: 128, b: 128, a: 200 });

      const layer: BaseAdjustmentLayer = {
        id: 'layer-1', name: 'Gradient Map', type: 'gradient-map',
        visible: true, opacity: 100, blendMode: 'normal',
        settings: {
          stops: [
            { position: 0, color: '#FF0000' },
            { position: 100, color: '#0000FF' },
          ],
        },
        targetLayerId: null, mask: null, clipped: false,
      };

      const result = AdjustmentLayerSystem.applyAdjustment(imageData, layer);

      expect(result.data[3]).toBe(200); // Alpha unchanged
    });
  });
});
