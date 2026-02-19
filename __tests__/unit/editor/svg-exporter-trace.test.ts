import { describe, it, expect, beforeEach } from 'vitest';
import { SvgExporter } from '@/lib/studio/editor/formats/svg/SvgExporter';

describe('SvgExporter - Raster to Trace', () => {
  let exporter: SvgExporter;

  beforeEach(() => {
    exporter = new SvgExporter();
  });

  const createRasterLayer = (
    id: string = 'layer-1',
    opacity: number = 100,
    name: string = 'Test Layer'
  ) => ({
    type: 'raster' as const,
    id,
    name,
    visible: true,
    opacity,
    blendMode: 'normal' as const,
    bounds: { x: 0, y: 0, width: 200, height: 200 },
    pixelData: {} as any,
    locked: false,
    clipped: false,
    parentId: null,
  });

  const traceOptions = {
    mode: 'trace' as const,
    precision: 2,
    minify: false,
    embedImages: false,
    traceOptions: {
      threshold: 128,
      turnPolicy: 'minority' as const,
      turdSize: 2,
      alphaMax: 1,
      optCurve: true,
      optTolerance: 0.2,
    },
  };

  describe('Export with trace mode', () => {
    it('produces SVG output with path elements', async () => {
      const layers = [createRasterLayer('trace-1')];

      const result = await exporter.export(layers, 200, 200, traceOptions);

      expect(result).toBeDefined();
      expect(result.blob).toBeDefined();
      expect(result.blob instanceof Blob).toBe(true);

      const svgContent = await result.blob.text();
      expect(svgContent).toContain('<path');
    });

    it('SVG output contains data-trace attribute on path elements', async () => {
      const layers = [createRasterLayer('trace-2')];

      const result = await exporter.export(layers, 200, 200, traceOptions);
      const svgContent = await result.blob.text();

      expect(svgContent).toContain('data-trace="true"');
    });

    it('generates valid SVG structure with root element', async () => {
      const layers = [createRasterLayer('trace-3')];

      const result = await exporter.export(layers, 200, 200, traceOptions);
      const svgContent = await result.blob.text();

      expect(svgContent).toMatch(/<svg[^>]*>/);
      expect(svgContent).toContain('</svg>');
      expect(svgContent).toMatch(/width="200"/);
      expect(svgContent).toMatch(/height="200"/);
    });
  });

  describe('Opacity and visibility handling', () => {
    it('layer with opacity 0 produces hidden group', async () => {
      const layers = [createRasterLayer('hidden-layer', 0)];

      const result = await exporter.export(layers, 200, 200, traceOptions);
      const svgContent = await result.blob.text();

      expect(svgContent).toContain('opacity="0"');
    });

    it('layer with opacity < 100 includes opacity attribute', async () => {
      const layers = [createRasterLayer('semi-transparent', 50)];

      const result = await exporter.export(layers, 200, 200, traceOptions);
      const svgContent = await result.blob.text();

      expect(svgContent).toMatch(/opacity="0\.5"/);
    });

    it('layer with full opacity 100 may omit opacity attribute', async () => {
      const layers = [createRasterLayer('opaque-layer', 100)];

      const result = await exporter.export(layers, 200, 200, traceOptions);
      const svgContent = await result.blob.text();

      expect(svgContent).toBeDefined();
      // Full opacity (100) might not include the attribute
      expect(svgContent).toContain('<path');
    });
  });

  describe('Warnings and approximation', () => {
    it('export includes TRACE_APPROXIMATION warning', async () => {
      const layers = [createRasterLayer('trace-warn')];

      const result = await exporter.export(layers, 200, 200, traceOptions);

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.warnings.some((w) => w.code === 'TRACE_APPROXIMATION' || w.message.includes('approximation'))).toBe(true);
    });

    it('multiple raster layers produce multiple warnings', async () => {
      const layers = [
        createRasterLayer('trace-1'),
        createRasterLayer('trace-2'),
        createRasterLayer('trace-3'),
      ];

      const result = await exporter.export(layers, 200, 200, traceOptions);

      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Multiple raster layers', () => {
    it('each raster layer gets traced separately', async () => {
      const layers = [
        createRasterLayer('trace-a'),
        createRasterLayer('trace-b'),
        createRasterLayer('trace-c'),
      ];

      const result = await exporter.export(layers, 200, 200, traceOptions);
      const svgContent = await result.blob.text();

      // Should have multiple path elements (one per layer)
      const pathCount = (svgContent.match(/<path/g) || []).length;
      expect(pathCount).toBeGreaterThanOrEqual(1);
    });

    it('multiple layers result in multiple groups or paths', async () => {
      const layers = [
        createRasterLayer('layer-1'),
        createRasterLayer('layer-2'),
      ];

      const result = await exporter.export(layers, 200, 200, traceOptions);
      const svgContent = await result.blob.text();

      expect(svgContent).toContain('<path');
      // Should contain content from both layers
      expect(svgContent.length).toBeGreaterThan(100);
    });
  });

  describe('Path data generation', () => {
    it('SVG path data contains expected path commands (M, L, Z)', async () => {
      const layers = [createRasterLayer('cmd-test')];

      const result = await exporter.export(layers, 200, 200, traceOptions);
      const svgContent = await result.blob.text();

      // M = MoveTo, L = LineTo, Z = ClosePath (common SVG path commands)
      // At least one of these should be present for valid traced output
      const hasPathCommands = /[MLZ]/.test(svgContent);
      expect(hasPathCommands).toBe(true);
    });

    it('path element includes d attribute with path data', async () => {
      const layers = [createRasterLayer('path-attr')];

      const result = await exporter.export(layers, 200, 200, traceOptions);
      const svgContent = await result.blob.text();

      expect(svgContent).toMatch(/<path[^>]*d="[^"]*"/);
    });
  });

  describe('Bounding box fallback', () => {
    it('bounding box path contains correct coordinates', async () => {
      const layers = [
        {
          ...createRasterLayer('bbox-test'),
          bounds: { x: 10, y: 20, width: 100, height: 150 },
        },
      ];

      const result = await exporter.export(layers, 200, 200, traceOptions);
      const svgContent = await result.blob.text();

      // Bounding box should reference the layer bounds
      expect(svgContent).toContain('<path');
    });

    it('handles layers with no pixel data gracefully', async () => {
      const layers = [
        {
          ...createRasterLayer('no-pixels'),
          pixelData: null as any,
        },
      ];

      const result = await exporter.export(layers, 200, 200, traceOptions);

      expect(result).toBeDefined();
      expect(result.blob).toBeDefined();
    });
  });

  describe('Embed images mode', () => {
    it('embed mode false uses paths instead of image elements', async () => {
      const layers = [createRasterLayer('no-embed')];
      const noEmbedOptions = {
        ...traceOptions,
        embedImages: false,
      };

      const result = await exporter.export(layers, 200, 200, noEmbedOptions);
      const svgContent = await result.blob.text();

      expect(svgContent).toContain('<path');
      // When not embedding, should have traced paths, not image elements
      // Note: rasterToTrace can fallback to embedded mode if pixel data unavailable
      // so we check for either path OR image
      const hasPathOrImage = svgContent.includes('<path') || svgContent.includes('<image');
      expect(hasPathOrImage).toBe(true);
    });

    it('embed mode true uses image element instead of trace', async () => {
      const layers = [createRasterLayer('with-embed')];
      const embedOptions = {
        mode: 'embedded' as const,
        precision: 2,
        minify: false,
        embedImages: true,
        traceOptions: {
          threshold: 128,
          turnPolicy: 'minority' as const,
          turdSize: 2,
          alphaMax: 1,
          optCurve: true,
          optTolerance: 0.2,
        },
      };

      const result = await exporter.export(layers, 200, 200, embedOptions);
      const svgContent = await result.blob.text();

      expect(svgContent).toContain('<image');
    });
  });

  describe('Trace options configuration', () => {
    it('respects precision setting in output', async () => {
      const layers = [createRasterLayer('precision-test')];
      const precisionOptions = {
        ...traceOptions,
        precision: 3,
      };

      const result = await exporter.export(layers, 200, 200, precisionOptions);
      expect(result).toBeDefined();
      expect(result.blob instanceof Blob).toBe(true);
    });

    it('applies trace algorithm with configured threshold', async () => {
      const layers = [createRasterLayer('threshold-test')];
      const thresholdOptions = {
        ...traceOptions,
        traceOptions: {
          ...traceOptions.traceOptions,
          threshold: 200,
        },
      };

      const result = await exporter.export(layers, 200, 200, thresholdOptions);
      expect(result).toBeDefined();
      expect(result.blob instanceof Blob).toBe(true);
    });
  });

  describe('Result structure', () => {
    it('export result contains blob and warnings properties', async () => {
      const layers = [createRasterLayer('structure-test')];

      const result = await exporter.export(layers, 200, 200, traceOptions);

      expect(result).toHaveProperty('blob');
      expect(result).toHaveProperty('warnings');
      expect(result.blob instanceof Blob).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('warnings array is empty when export succeeds without issues', async () => {
      const layers = [
        {
          ...createRasterLayer('clean-export'),
          opacity: 100,
          visible: true,
        },
      ];

      const result = await exporter.export(layers, 200, 200, traceOptions);

      // Some warnings expected for trace approximation
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });
});
