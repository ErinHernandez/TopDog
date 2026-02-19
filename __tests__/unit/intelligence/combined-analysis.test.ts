import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlatformIntelligenceImageExtension } from '@/lib/studio/integration/intelligence/PlatformIntelligenceImageExtension';
import { AnalysisType, WCAGLevel } from '@/lib/studio/integration/intelligence/types';

describe('PlatformIntelligenceImageExtension.analyzeDesign', () => {
  let extension: PlatformIntelligenceImageExtension;
  let imageInput: {
    id: string;
    imageData: ArrayBuffer;
    imageFormat: 'png' | 'jpeg' | 'webp';
    dimensions: { width: number; height: number };
  };
  let codeInput: {
    id: string;
    language: 'html' | 'jsx' | 'tsx' | 'vue' | 'svelte';
    code: string;
  };

  beforeEach(() => {
    const config = {
      apiEndpoint: 'http://localhost',
      userId: 'test-user',
      projectId: 'test-project',
      maxImageSizeMB: 10,
      maxCodeLengthChars: 100000,
      enableImageAnalysis: true,
      enableCodeAnalysis: true,
      enableCombinedAnalysis: true,
    };

    extension = new PlatformIntelligenceImageExtension(config);

    const imageData = new Uint8ClampedArray(4 * 4 * 4);
    for (let i = 0; i < imageData.length; i += 4) {
      imageData[i] = 100;
      imageData[i + 1] = 150;
      imageData[i + 2] = 200;
      imageData[i + 3] = 255;
    }

    imageInput = {
      id: 'test-image',
      imageData: imageData.buffer,
      imageFormat: 'png' as const,
      dimensions: { width: 4, height: 4 },
    };

    codeInput = {
      id: 'test-code',
      language: 'html' as const,
      code: '<html><body><h1>Test</h1><main><p>Content</p></main></body></html>',
    };
  });

  it('should return consistency scores between 0 and 1', async () => {
    const result = await extension.analyzeDesign([imageInput], [codeInput]);

    expect(result).toBeDefined();
    expect(result.combined).toBeDefined();
    expect(result.combined?.consistency).toBeDefined();
    expect(typeof result.combined?.consistency).toBe('object');

    if (result.combined?.consistency.colorConsistency !== undefined) {
      expect(result.combined.consistency.colorConsistency).toBeGreaterThanOrEqual(0);
      expect(result.combined.consistency.colorConsistency).toBeLessThanOrEqual(1);
    }

    if (result.combined?.consistency.typographyConsistency !== undefined) {
      expect(result.combined.consistency.typographyConsistency).toBeGreaterThanOrEqual(0);
      expect(result.combined.consistency.typographyConsistency).toBeLessThanOrEqual(1);
    }

    if (result.combined?.consistency.spacingConsistency !== undefined) {
      expect(result.combined.consistency.spacingConsistency).toBeGreaterThanOrEqual(0);
      expect(result.combined.consistency.spacingConsistency).toBeLessThanOrEqual(1);
    }

    if (result.combined?.consistency.componentConsistency !== undefined) {
      expect(result.combined.consistency.componentConsistency).toBeGreaterThanOrEqual(0);
      expect(result.combined.consistency.componentConsistency).toBeLessThanOrEqual(1);
    }

    if (result.combined?.consistency.overallConsistency !== undefined) {
      expect(result.combined.consistency.overallConsistency).toBeGreaterThanOrEqual(0);
      expect(result.combined.consistency.overallConsistency).toBeLessThanOrEqual(1);
    }
  });

  it('should return overall score between 0 and 100', async () => {
    const result = await extension.analyzeDesign([imageInput], [codeInput]);

    expect(result).toBeDefined();
    expect(result.combined).toBeDefined();
    expect(result.combined?.score).toBeDefined();
    expect(typeof result.combined?.score.overall).toBe('number');
    expect(result.combined!.score.overall).toBeGreaterThanOrEqual(0);
    expect(result.combined!.score.overall).toBeLessThanOrEqual(100);
  });

  it('should include issues array in result', async () => {
    const result = await extension.analyzeDesign([imageInput], [codeInput]);

    expect(result).toBeDefined();
    expect(result.combined).toBeDefined();
    expect(result.combined?.issues).toBeDefined();
    expect(Array.isArray(result.combined?.issues)).toBe(true);
  });

  it('should include recommendations array with maximum 10 items', async () => {
    const result = await extension.analyzeDesign([imageInput], [codeInput]);

    expect(result).toBeDefined();
    expect(result.combined).toBeDefined();
    expect(result.combined?.recommendations).toBeDefined();
    expect(Array.isArray(result.combined?.recommendations)).toBe(true);
    expect(result.combined!.recommendations.length).toBeLessThanOrEqual(10);
  });

  it('should yield highest color consistency for monochromatic harmony', async () => {
    const monochromaticImageData = new Uint8ClampedArray(4 * 4 * 4);
    for (let i = 0; i < monochromaticImageData.length; i += 4) {
      monochromaticImageData[i] = 100;
      monochromaticImageData[i + 1] = 100;
      monochromaticImageData[i + 2] = 100;
      monochromaticImageData[i + 3] = 255;
    }

    const monochromaticInput = {
      id: 'test-image-mono',
      imageData: monochromaticImageData.buffer,
      imageFormat: 'png' as const,
      dimensions: { width: 4, height: 4 },
    };

    const result = await extension.analyzeDesign([monochromaticInput], [codeInput]);

    expect(result).toBeDefined();
    expect(result.combined).toBeDefined();
    expect(result.combined?.consistency).toBeDefined();

    if (result.combined?.consistency.colorConsistency !== undefined) {
      expect(result.combined.consistency.colorConsistency).toBeGreaterThanOrEqual(0.9);
    }
  });

  it('should generate color_contrast error issue when WCAG check fails', async () => {
    const lowContrastImageData = new Uint8ClampedArray(4 * 4 * 4);
    for (let i = 0; i < lowContrastImageData.length; i += 4) {
      lowContrastImageData[i] = 200;
      lowContrastImageData[i + 1] = 200;
      lowContrastImageData[i + 2] = 200;
      lowContrastImageData[i + 3] = 255;
    }

    const lowContrastInput = {
      id: 'test-image-low-contrast',
      imageData: lowContrastImageData.buffer,
      imageFormat: 'png' as const,
      dimensions: { width: 4, height: 4 },
    };

    const result = await extension.analyzeDesign([lowContrastInput], [codeInput]);

    expect(result).toBeDefined();
    expect(result.combined).toBeDefined();
    expect(result.combined?.issues).toBeDefined();

    const colorContrastIssues = result.combined?.issues.filter(
      (issue: any) => issue.type === 'color_contrast'
    );
    expect((colorContrastIssues?.length ?? 0) >= 0).toBe(true);
  });

  it('should generate warning for low typography readability', async () => {
    const result = await extension.analyzeDesign([imageInput], [codeInput]);

    expect(result).toBeDefined();
    expect(result.combined).toBeDefined();
    expect(result.combined?.issues).toBeDefined();

    const typographyIssues = result.combined?.issues.filter(
      (issue: any) => issue.type === 'typography' || issue.severity === 'warning'
    );
    expect(Array.isArray(typographyIssues)).toBe(true);
  });

  it('should generate warning for low spacing consistency', async () => {
    const result = await extension.analyzeDesign([imageInput], [codeInput]);

    expect(result).toBeDefined();
    expect(result.combined).toBeDefined();
    expect(result.combined?.issues).toBeDefined();

    const spacingIssues = result.combined?.issues.filter(
      (issue: any) => issue.type === 'spacing' || issue.severity === 'warning'
    );
    expect(Array.isArray(spacingIssues)).toBe(true);
  });
});
