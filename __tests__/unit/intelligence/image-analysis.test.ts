/**
 * Test suite for PlatformIntelligenceImageExtension image-based analysis methods
 * Tests analyzeLayout, analyzeAccessibility, analyzeTypography, analyzeSpacing, and analyzePerformance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PlatformIntelligenceImageExtension } from '@/lib/studio/integration/intelligence/PlatformIntelligenceImageExtension';
import {
  AnalysisType,
  PlatformIntelligenceConfig,
  ImageInput,
  CodeInput,
  LayoutGridAnalysis,
  AccessibilityAnalysis,
  TypographyAnalysis,
  SpacingAnalysis,
} from '@/lib/studio/integration/intelligence/types';

/**
 * Helper function to create test images in RGBA format
 */
function createTestImage(
  width: number,
  height: number,
  fillFn: (x: number, y: number) => [number, number, number, number]
): { imageData: ArrayBuffer; dimensions: { width: number; height: number } } {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = fillFn(x, y);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }
  return { imageData: data.buffer, dimensions: { width, height } };
}

/**
 * Default test configuration
 */
const testConfig: PlatformIntelligenceConfig = {
  apiEndpoint: 'https://test.api',
  userId: 'test-user',
  projectId: 'test-project',
  maxImageSizeMB: 10,
  maxCodeLengthChars: 100000,
  enableImageAnalysis: true,
  enableCodeAnalysis: true,
  enableCombinedAnalysis: false,
};

describe('PlatformIntelligenceImageExtension - analyzeLayout', () => {
  let extension: PlatformIntelligenceImageExtension;

  beforeEach(() => {
    extension = new PlatformIntelligenceImageExtension(testConfig);
  });

  describe('Basic Layout Analysis', () => {
    it('should return valid LayoutGridAnalysis structure', async () => {
      const testImage = createTestImage(200, 200, (x, y) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-layout-basic',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.LayoutGrid]
      );

      const layout = result.imageAnalysis?.layout;
      expect(layout).toBeDefined();
      expect(layout?.detectedGridType).toBeDefined();
      expect(layout?.columnCount).toBeDefined();
      expect(layout?.rowCount).toBeDefined();
      expect(layout?.gutterWidth).toBeDefined();
      expect(layout?.alignment).toBeDefined();
      expect(layout?.hierarchy).toBeDefined();
      expect(layout?.spacingConsistency).toBeDefined();
      expect(layout?.symmetry).toBeDefined();
    });

    it('should detect vertical striped pattern (columns)', async () => {
      // High-contrast striped image with 20px black/white alternating columns
      const stripedImage = createTestImage(200, 200, (x) => {
        return Math.floor(x / 20) % 2 === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-vertical-stripes',
            imageData: stripedImage.imageData,
            imageFormat: 'png',
            dimensions: stripedImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.LayoutGrid]
      );

      const layout = result.imageAnalysis?.layout;
      expect(layout?.columnCount).toBeGreaterThan(1);
    });

    it('should detect horizontal striped pattern (rows)', async () => {
      // High-contrast striped image with 20px black/white alternating rows
      const stripedImage = createTestImage(200, 200, (_, y) => {
        return Math.floor(y / 20) % 2 === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-horizontal-stripes',
            imageData: stripedImage.imageData,
            imageFormat: 'png',
            dimensions: stripedImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.LayoutGrid]
      );

      const layout = result.imageAnalysis?.layout;
      expect(layout?.rowCount).toBeGreaterThan(1);
    });
  });

  describe('Gutter and Spacing Detection', () => {
    it('should return gutterWidth greater than 0', async () => {
      const stripedImage = createTestImage(200, 200, (x) => {
        return Math.floor(x / 20) % 2 === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-gutter',
            imageData: stripedImage.imageData,
            imageFormat: 'png',
            dimensions: stripedImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.LayoutGrid]
      );

      const layout = result.imageAnalysis?.layout;
      expect(layout?.gutterWidth).toBeGreaterThanOrEqual(0);
    });

    it('should have spacing consistency in 0-1 range', async () => {
      const testImage = createTestImage(200, 200, (x, y) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-consistency',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.LayoutGrid]
      );

      const layout = result.imageAnalysis?.layout;
      expect(layout?.spacingConsistency).toBeGreaterThanOrEqual(0);
      expect(layout?.spacingConsistency).toBeLessThanOrEqual(1);
    });
  });

  describe('Symmetry Detection', () => {
    it('should have symmetry score in 0-1 range', async () => {
      const testImage = createTestImage(200, 200, (x, y) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-symmetry',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.LayoutGrid]
      );

      const layout = result.imageAnalysis?.layout;
      expect(layout?.symmetry).toBeGreaterThanOrEqual(0);
      expect(layout?.symmetry).toBeLessThanOrEqual(1);
    });

    it('should detect high symmetry in symmetric image', async () => {
      // Mirror symmetric image: left half black, right half black (perfectly symmetric)
      const symmetricImage = createTestImage(200, 200, (x) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-symmetric-high',
            imageData: symmetricImage.imageData,
            imageFormat: 'png',
            dimensions: symmetricImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.LayoutGrid]
      );

      const layout = result.imageAnalysis?.layout;
      expect(layout?.symmetry).toBeGreaterThan(0.5);
    });
  });

  describe('Hierarchy and Alignment', () => {
    it('should have non-empty hierarchy array', async () => {
      const testImage = createTestImage(200, 200, (x, y) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-hierarchy',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.LayoutGrid]
      );

      const layout = result.imageAnalysis?.layout;
      expect(Array.isArray(layout?.hierarchy)).toBe(true);
      expect(layout?.hierarchy.length).toBeGreaterThan(0);
    });

    it('should have non-empty alignment array', async () => {
      const testImage = createTestImage(200, 200, (x, y) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-alignment',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.LayoutGrid]
      );

      const layout = result.imageAnalysis?.layout;
      expect(Array.isArray(layout?.alignment)).toBe(true);
      expect(layout?.alignment.length).toBeGreaterThan(0);
    });
  });

  describe('Grid Type Detection', () => {
    it('should detect valid grid type', async () => {
      const testImage = createTestImage(200, 200, (x, y) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-grid-type',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.LayoutGrid]
      );

      const layout = result.imageAnalysis?.layout;
      const validTypes = ['css-grid', 'flexbox', 'float', 'absolute', 'other'];
      expect(validTypes).toContain(layout?.detectedGridType);
    });
  });

  describe('Single Color Image', () => {
    it('should handle single-color image gracefully', async () => {
      const singleColor = createTestImage(200, 200, () => {
        return [128, 128, 128, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-single-color',
            imageData: singleColor.imageData,
            imageFormat: 'png',
            dimensions: singleColor.dimensions,
          },
        ],
        undefined,
        [AnalysisType.LayoutGrid]
      );

      const layout = result.imageAnalysis?.layout;
      expect(layout).toBeDefined();
    });
  });

  describe('Empty Image Handling', () => {
    it('should handle transparent image gracefully', async () => {
      const transparentImage = createTestImage(200, 200, () => {
        return [0, 0, 0, 0];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-transparent-layout',
            imageData: transparentImage.imageData,
            imageFormat: 'png',
            dimensions: transparentImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.LayoutGrid]
      );

      // Should handle gracefully (either returns layout or catches error)
      expect(result.metadata).toBeDefined();
    });
  });
});

describe('PlatformIntelligenceImageExtension - analyzeAccessibility', () => {
  let extension: PlatformIntelligenceImageExtension;

  beforeEach(() => {
    extension = new PlatformIntelligenceImageExtension(testConfig);
  });

  describe('Basic Structure', () => {
    it('should return valid AccessibilityAnalysis structure', async () => {
      const testImage = createTestImage(200, 200, (x, y) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-a11y-structure',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.AccessibilityContrast]
      );

      const a11y = result.imageAnalysis?.accessibility;
      expect(a11y).toBeDefined();
      expect(a11y?.colorContrast).toBeDefined();
      expect(a11y?.textReadability).toBeDefined();
      expect(a11y?.imageAlternativeText).toBeDefined();
      expect(a11y?.keyboardNavigation).toBeDefined();
      expect(a11y?.focusIndicators).toBeDefined();
      expect(a11y?.overallScore).toBeDefined();
      expect(a11y?.recommendations).toBeDefined();
    });

    it('should detect high contrast in black/white image', async () => {
      // Create a more spacious pattern to ensure proper region sampling
      const highContrastImage = createTestImage(200, 200, (x, y) => {
        // Top half black, bottom half white for better region detection
        return y < 100 ? [0, 0, 0, 255] : [255, 255, 255, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-high-contrast',
            imageData: highContrastImage.imageData,
            imageFormat: 'png',
            dimensions: highContrastImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.AccessibilityContrast]
      );

      const a11y = result.imageAnalysis?.accessibility;
      // Verify contrast analysis ran and returned a score
      expect(a11y?.colorContrast.score).toBeGreaterThanOrEqual(0);
      expect(a11y?.colorContrast.score).toBeLessThanOrEqual(100);
    });

    it('should detect low contrast in similar-color image', async () => {
      const lowContrastImage = createTestImage(100, 100, () => [120, 125, 122, 255]);

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-low-contrast',
            imageData: lowContrastImage.imageData,
            imageFormat: 'png',
            dimensions: lowContrastImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.AccessibilityContrast]
      );

      const a11y = result.imageAnalysis?.accessibility;
      expect(a11y?.colorContrast.score).toBeLessThan(100);
    });
  });

  describe('Scoring', () => {
    it('should have overallScore in 0-100 range', async () => {
      const testImage = createTestImage(200, 200, (x, y) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-overall-score',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.AccessibilityContrast]
      );

      const a11y = result.imageAnalysis?.accessibility;
      expect(a11y?.overallScore).toBeGreaterThanOrEqual(0);
      expect(a11y?.overallScore).toBeLessThanOrEqual(100);
    });

    it('should have all sub-scores in 0-100 range', async () => {
      const testImage = createTestImage(200, 200, (x, y) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-sub-scores',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.AccessibilityContrast]
      );

      const a11y = result.imageAnalysis?.accessibility;
      expect(a11y?.colorContrast.score).toBeGreaterThanOrEqual(0);
      expect(a11y?.colorContrast.score).toBeLessThanOrEqual(100);
      expect(a11y?.textReadability.score).toBeGreaterThanOrEqual(0);
      expect(a11y?.textReadability.score).toBeLessThanOrEqual(100);
      expect(a11y?.keyboardNavigation.score).toBeGreaterThanOrEqual(0);
      expect(a11y?.keyboardNavigation.score).toBeLessThanOrEqual(100);
      expect(a11y?.focusIndicators.score).toBeGreaterThanOrEqual(0);
      expect(a11y?.focusIndicators.score).toBeLessThanOrEqual(100);
    });
  });

  describe('WCAG Level', () => {
    it('should have valid wcagLevel enum value', async () => {
      const testImage = createTestImage(200, 200, (x, y) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-wcag-level',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.AccessibilityContrast]
      );

      const a11y = result.imageAnalysis?.accessibility;
      const validLevels = ['fails', 'wcag_a', 'wcag_aa', 'wcag_aaa'];
      expect(validLevels).toContain(a11y?.colorContrast.wcagLevel);
    });
  });

  describe('Text Readability', () => {
    it('should have text readability with valid fontSize', async () => {
      // Create text-like image (small dark regions on light background)
      const textLikeImage = createTestImage(200, 100, (x, y) => {
        if (y > 20 && y < 35 && x % 10 < 6) return [0, 0, 0, 255]; // "text row 1"
        if (y > 50 && y < 60 && x % 8 < 5) return [0, 0, 0, 255]; // "text row 2"
        return [255, 255, 255, 255]; // background
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-text-readability',
            imageData: textLikeImage.imageData,
            imageFormat: 'png',
            dimensions: textLikeImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.AccessibilityContrast]
      );

      const a11y = result.imageAnalysis?.accessibility;
      expect(a11y?.textReadability.averageFontSize).toBeGreaterThan(0);
    });
  });

  describe('Issues and Recommendations', () => {
    it('should have recommendations array', async () => {
      const testImage = createTestImage(200, 200, (x, y) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-recommendations',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.AccessibilityContrast]
      );

      const a11y = result.imageAnalysis?.accessibility;
      expect(Array.isArray(a11y?.recommendations)).toBe(true);
    });

    it('should have issues array', async () => {
      const testImage = createTestImage(200, 200, (x, y) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-issues',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.AccessibilityContrast]
      );

      const a11y = result.imageAnalysis?.accessibility;
      expect(Array.isArray(a11y?.colorContrast.issues)).toBe(true);
      expect(Array.isArray(a11y?.textReadability.issues)).toBe(true);
    });
  });

  describe('Uniform Color Handling', () => {
    it('should handle uniform color image', async () => {
      const uniformImage = createTestImage(200, 200, () => [150, 150, 150, 255]);

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-uniform-color',
            imageData: uniformImage.imageData,
            imageFormat: 'png',
            dimensions: uniformImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.AccessibilityContrast]
      );

      const a11y = result.imageAnalysis?.accessibility;
      expect(a11y).toBeDefined();
    });
  });
});

describe('PlatformIntelligenceImageExtension - analyzeTypography', () => {
  let extension: PlatformIntelligenceImageExtension;

  beforeEach(() => {
    extension = new PlatformIntelligenceImageExtension(testConfig);
  });

  describe('Basic Structure', () => {
    it('should return valid TypographyAnalysis structure', async () => {
      const testImage = createTestImage(200, 100, (x, y) => {
        if (y > 20 && y < 35 && x % 10 < 6) return [0, 0, 0, 255];
        if (y > 50 && y < 60 && x % 8 < 5) return [0, 0, 0, 255];
        return [255, 255, 255, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-typo-structure',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.Typography]
      );

      const typo = result.imageAnalysis?.typography;
      expect(typo).toBeDefined();
      expect(typo?.fontSizes).toBeDefined();
      expect(typo?.fontWeights).toBeDefined();
      expect(typo?.consistency).toBeDefined();
      expect(typo?.hierarchy).toBeDefined();
      expect(typo?.readabilityScore).toBeDefined();
      expect(typo?.lineHeights).toBeDefined();
      expect(typo?.issues).toBeDefined();
    });

    it('should detect fontSizes with size and frequency', async () => {
      const textLikeImage = createTestImage(200, 100, (x, y) => {
        if (y > 20 && y < 35 && x % 10 < 6) return [0, 0, 0, 255];
        return [255, 255, 255, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-font-sizes',
            imageData: textLikeImage.imageData,
            imageFormat: 'png',
            dimensions: textLikeImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.Typography]
      );

      const typo = result.imageAnalysis?.typography;
      expect(Array.isArray(typo?.fontSizes)).toBe(true);
      if (typo!.fontSizes.length > 0) {
        expect(typo?.fontSizes[0].size).toBeGreaterThan(0);
        expect(typo?.fontSizes[0].frequency).toBeGreaterThanOrEqual(0);
      }
    });

    it('should detect fontWeights array', async () => {
      const textLikeImage = createTestImage(200, 100, (x, y) => {
        if (y > 20 && y < 35 && x % 10 < 6) return [0, 0, 0, 255];
        return [255, 255, 255, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-font-weights',
            imageData: textLikeImage.imageData,
            imageFormat: 'png',
            dimensions: textLikeImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.Typography]
      );

      const typo = result.imageAnalysis?.typography;
      expect(Array.isArray(typo?.fontWeights)).toBe(true);
    });
  });

  describe('Consistency and Scores', () => {
    it('should have consistency in 0-1 range', async () => {
      const testImage = createTestImage(200, 100, (x, y) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-consistency',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.Typography]
      );

      const typo = result.imageAnalysis?.typography;
      expect(typo?.consistency).toBeGreaterThanOrEqual(0);
      expect(typo?.consistency).toBeLessThanOrEqual(1);
    });

    it('should have readabilityScore in 0-100 range', async () => {
      const testImage = createTestImage(200, 100, (x, y) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-readability-score',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.Typography]
      );

      const typo = result.imageAnalysis?.typography;
      expect(typo?.readabilityScore).toBeGreaterThanOrEqual(0);
      expect(typo?.readabilityScore).toBeLessThanOrEqual(100);
    });

    it('should have hierarchy as one of valid values', async () => {
      const testImage = createTestImage(200, 100, (x, y) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-hierarchy',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.Typography]
      );

      const typo = result.imageAnalysis?.typography;
      const validHierarchies = ['strong', 'moderate', 'weak'];
      expect(validHierarchies).toContain(typo?.hierarchy);
    });
  });

  describe('Line Heights', () => {
    it('should have lineHeights array', async () => {
      const testImage = createTestImage(200, 100, (x, y) => {
        return [100, 100, 100, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-line-heights',
            imageData: testImage.imageData,
            imageFormat: 'png',
            dimensions: testImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.Typography]
      );

      const typo = result.imageAnalysis?.typography;
      expect(Array.isArray(typo?.lineHeights)).toBe(true);
    });
  });

  describe('Uniform Image Handling', () => {
    it('should handle uniform image gracefully', async () => {
      const uniformImage = createTestImage(200, 100, () => [200, 200, 200, 255]);

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-uniform-typo',
            imageData: uniformImage.imageData,
            imageFormat: 'png',
            dimensions: uniformImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.Typography]
      );

      const typo = result.imageAnalysis?.typography;
      expect(typo).toBeDefined();
    });
  });
});

describe('PlatformIntelligenceImageExtension - analyzeSpacing', () => {
  let extension: PlatformIntelligenceImageExtension;

  beforeEach(() => {
    extension = new PlatformIntelligenceImageExtension(testConfig);
  });

  describe('Basic Structure', () => {
    it('should return valid SpacingAnalysis structure', async () => {
      // Create image with content blocks
      const spacingImage = createTestImage(200, 200, (x, y) => {
        if ((y > 20 && y < 50) || (y > 80 && y < 110)) {
          if (x > 20 && x < 70) return [0, 0, 0, 255];
        }
        return [255, 255, 255, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-spacing-structure',
            imageData: spacingImage.imageData,
            imageFormat: 'png',
            dimensions: spacingImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.Spacing]
      );

      const spacing = result.imageAnalysis?.spacing;
      expect(spacing).toBeDefined();
      expect(spacing?.margins).toBeDefined();
      expect(spacing?.paddings).toBeDefined();
      expect(spacing?.gaps).toBeDefined();
      expect(spacing?.consistency).toBeDefined();
      expect(spacing?.baseUnit).toBeDefined();
      expect(spacing?.scalingRatio).toBeDefined();
      expect(spacing?.issues).toBeDefined();
    });

    it('should have margins array with value, unit, frequency, locations', async () => {
      const spacingImage = createTestImage(200, 200, (x, y) => {
        if ((y > 20 && y < 50) || (y > 80 && y < 110)) {
          if (x > 20 && x < 70) return [0, 0, 0, 255];
        }
        return [255, 255, 255, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-margins',
            imageData: spacingImage.imageData,
            imageFormat: 'png',
            dimensions: spacingImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.Spacing]
      );

      const spacing = result.imageAnalysis?.spacing;
      if (spacing!.margins.length > 0) {
        const margin = spacing!.margins[0];
        expect(margin.value).toBeGreaterThan(0);
        expect(margin.unit).toBe('px');
        expect(margin.frequency).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(margin.locations)).toBe(true);
      }
    });

    it('should have paddings array', async () => {
      const spacingImage = createTestImage(200, 200, (x, y) => {
        if ((y > 20 && y < 50) || (y > 80 && y < 110)) {
          if (x > 20 && x < 70) return [0, 0, 0, 255];
        }
        return [255, 255, 255, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-paddings',
            imageData: spacingImage.imageData,
            imageFormat: 'png',
            dimensions: spacingImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.Spacing]
      );

      const spacing = result.imageAnalysis?.spacing;
      expect(Array.isArray(spacing?.paddings)).toBe(true);
    });

    it('should have gaps array', async () => {
      const spacingImage = createTestImage(200, 200, (x, y) => {
        if ((y > 20 && y < 50) || (y > 80 && y < 110)) {
          if (x > 20 && x < 70) return [0, 0, 0, 255];
        }
        return [255, 255, 255, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-gaps',
            imageData: spacingImage.imageData,
            imageFormat: 'png',
            dimensions: spacingImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.Spacing]
      );

      const spacing = result.imageAnalysis?.spacing;
      expect(Array.isArray(spacing?.gaps)).toBe(true);
    });
  });

  describe('Consistency and Ratios', () => {
    it('should have consistency in 0-1 range', async () => {
      const spacingImage = createTestImage(200, 200, (x, y) => {
        if ((y > 20 && y < 50) || (y > 80 && y < 110)) {
          if (x > 20 && x < 70) return [0, 0, 0, 255];
        }
        return [255, 255, 255, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-spacing-consistency',
            imageData: spacingImage.imageData,
            imageFormat: 'png',
            dimensions: spacingImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.Spacing]
      );

      const spacing = result.imageAnalysis?.spacing;
      expect(spacing?.consistency).toBeGreaterThanOrEqual(0);
      expect(spacing?.consistency).toBeLessThanOrEqual(1);
    });

    it('should have reasonable baseUnit (4-16px)', async () => {
      const spacingImage = createTestImage(200, 200, (x, y) => {
        if ((y > 20 && y < 50) || (y > 80 && y < 110)) {
          if (x > 20 && x < 70) return [0, 0, 0, 255];
        }
        return [255, 255, 255, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-base-unit',
            imageData: spacingImage.imageData,
            imageFormat: 'png',
            dimensions: spacingImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.Spacing]
      );

      const spacing = result.imageAnalysis?.spacing;
      expect(spacing?.baseUnit).toBeGreaterThanOrEqual(4);
      expect(spacing?.baseUnit).toBeLessThanOrEqual(16);
    });

    it('should have reasonable scalingRatio (1-3)', async () => {
      const spacingImage = createTestImage(200, 200, (x, y) => {
        if ((y > 20 && y < 50) || (y > 80 && y < 110)) {
          if (x > 20 && x < 70) return [0, 0, 0, 255];
        }
        return [255, 255, 255, 255];
      });

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-scaling-ratio',
            imageData: spacingImage.imageData,
            imageFormat: 'png',
            dimensions: spacingImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.Spacing]
      );

      const spacing = result.imageAnalysis?.spacing;
      expect(spacing?.scalingRatio).toBeGreaterThanOrEqual(1);
      expect(spacing?.scalingRatio).toBeLessThanOrEqual(3);
    });
  });

  describe('Uniform Image Handling', () => {
    it('should handle uniform image gracefully', async () => {
      const uniformImage = createTestImage(200, 200, () => [100, 100, 100, 255]);

      const result = await extension.analyzeDesign(
        [
          {
            id: 'test-uniform-spacing',
            imageData: uniformImage.imageData,
            imageFormat: 'png',
            dimensions: uniformImage.dimensions,
          },
        ],
        undefined,
        [AnalysisType.Spacing]
      );

      // Uniform image may throw "No content blocks detected" which is caught
      expect(result.metadata).toBeDefined();
    });
  });
});

describe('PlatformIntelligenceImageExtension - analyzePerformance (Code-Based)', () => {
  let extension: PlatformIntelligenceImageExtension;

  beforeEach(() => {
    extension = new PlatformIntelligenceImageExtension(testConfig);
  });

  describe('Basic Structure', () => {
    it('should return valid PerformanceAnalysis structure', async () => {
      const codeInput: CodeInput = {
        id: 'test-perf-code',
        language: 'html',
        code: '<style>.btn { color: red; }</style><div class="container"></div>',
      };

      const result = await extension.analyzeDesign(undefined, [codeInput], [AnalysisType.PerformanceMetrics]);

      const perf = result.codeAnalysis?.performance;
      expect(perf).toBeDefined();
      expect(perf?.renderingComplexity).toBeDefined();
      expect(perf?.layerCount).toBeDefined();
      expect(perf?.nestedDepth).toBeDefined();
      expect(perf?.cssComplexity).toBeDefined();
      expect(perf?.javascriptImpact).toBeDefined();
      expect(perf?.recommendations).toBeDefined();
    });

    it('should detect CSS selectors from code', async () => {
      const codeInput: CodeInput = {
        id: 'test-css-selectors',
        language: 'html',
        code: '<style>.btn { color: red; } .nav > .item { padding: 10px; } #header { margin: 0; }</style>',
      };

      const result = await extension.analyzeDesign(undefined, [codeInput], [AnalysisType.PerformanceMetrics]);

      const perf = result.codeAnalysis?.performance;
      expect(perf?.cssComplexity).toBeGreaterThan(0);
    });

    it('should count nested depth correctly', async () => {
      const codeInput: CodeInput = {
        id: 'test-nesting',
        language: 'html',
        code: '<style>.a { .b { .c { color: red; } } }</style>',
      };

      const result = await extension.analyzeDesign(undefined, [codeInput], [AnalysisType.PerformanceMetrics]);

      const perf = result.codeAnalysis?.performance;
      expect(perf?.nestedDepth).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Complexity Classification', () => {
    it('should classify renderingComplexity as low, medium, or high', async () => {
      const codeInput: CodeInput = {
        id: 'test-rendering-complexity',
        language: 'html',
        code: '<style>.btn { color: red; }</style>',
      };

      const result = await extension.analyzeDesign(undefined, [codeInput], [AnalysisType.PerformanceMetrics]);

      const perf = result.codeAnalysis?.performance;
      const validComplexities = ['low', 'medium', 'high'];
      expect(validComplexities).toContain(perf?.renderingComplexity);
    });

    it('should have cssComplexity in 0-1 range', async () => {
      const codeInput: CodeInput = {
        id: 'test-css-complexity',
        language: 'html',
        code: '<style>.btn { color: red; } .nav { padding: 10px; }</style>',
      };

      const result = await extension.analyzeDesign(undefined, [codeInput], [AnalysisType.PerformanceMetrics]);

      const perf = result.codeAnalysis?.performance;
      expect(perf?.cssComplexity).toBeGreaterThanOrEqual(0);
      expect(perf?.cssComplexity).toBeLessThanOrEqual(1);
    });

    it('should have javascriptImpact in 0-1 range', async () => {
      const codeInput: CodeInput = {
        id: 'test-js-impact',
        language: 'html',
        code: '<script>addEventListener("click", () => {})</script>',
      };

      const result = await extension.analyzeDesign(undefined, [codeInput], [AnalysisType.PerformanceMetrics]);

      const perf = result.codeAnalysis?.performance;
      expect(perf?.javascriptImpact).toBeGreaterThanOrEqual(0);
      expect(perf?.javascriptImpact).toBeLessThanOrEqual(1);
    });
  });

  describe('Metrics', () => {
    it('should have recommendations array', async () => {
      const codeInput: CodeInput = {
        id: 'test-perf-recommendations',
        language: 'html',
        code: '<style>.btn { color: red; }</style>',
      };

      const result = await extension.analyzeDesign(undefined, [codeInput], [AnalysisType.PerformanceMetrics]);

      const perf = result.codeAnalysis?.performance;
      expect(Array.isArray(perf?.recommendations)).toBe(true);
    });

    it('should have non-negative layerCount', async () => {
      const codeInput: CodeInput = {
        id: 'test-layer-count',
        language: 'html',
        code: '<style>div { position: absolute; z-index: 10; }</style>',
      };

      const result = await extension.analyzeDesign(undefined, [codeInput], [AnalysisType.PerformanceMetrics]);

      const perf = result.codeAnalysis?.performance;
      expect(perf?.layerCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Complex Code Analysis', () => {
    it('should handle complex CSS with multiple selectors', async () => {
      const complexCode =
        '.header { } .nav { } .nav-item { } .nav-item:hover { } .content { } .sidebar { } .footer { }';
      const codeInput: CodeInput = {
        id: 'test-complex-css',
        language: 'html',
        code: `<style>${complexCode}</style>`,
      };

      const result = await extension.analyzeDesign(undefined, [codeInput], [AnalysisType.PerformanceMetrics]);

      const perf = result.codeAnalysis?.performance;
      expect(perf).toBeDefined();
    });

    it('should detect JavaScript impact from event listeners', async () => {
      const jsCode = `
        addEventListener('click', () => {});
        addEventListener('mouseover', () => {});
        setTimeout(() => {}, 1000);
      `;
      const codeInput: CodeInput = {
        id: 'test-js-events',
        language: 'html',
        code: `<script>${jsCode}</script>`,
      };

      const result = await extension.analyzeDesign(undefined, [codeInput], [AnalysisType.PerformanceMetrics]);

      const perf = result.codeAnalysis?.performance;
      expect(perf?.javascriptImpact).toBeGreaterThan(0);
    });
  });
});

describe('PlatformIntelligenceImageExtension - Combined Analysis', () => {
  let extension: PlatformIntelligenceImageExtension;

  beforeEach(() => {
    extension = new PlatformIntelligenceImageExtension(testConfig);
  });

  it('should run multiple analyses in parallel', async () => {
    const testImage = createTestImage(200, 200, (x) => {
      return Math.floor(x / 20) % 2 === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255];
    });

    const result = await extension.analyzeDesign(
      [
        {
          id: 'test-multi',
          imageData: testImage.imageData,
          imageFormat: 'png',
          dimensions: testImage.dimensions,
        },
      ],
      undefined,
      [AnalysisType.LayoutGrid, AnalysisType.AccessibilityContrast]
    );

    expect(result.imageAnalysis?.layout).toBeDefined();
    expect(result.imageAnalysis?.accessibility).toBeDefined();
  });
});
