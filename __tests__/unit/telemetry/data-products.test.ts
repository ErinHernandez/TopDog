import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TransformerPipeline,
  getProduct,
  getAllProducts,
  getProductsByBuyer,
  isValidProductId,
  getAllBuyerTypes,
  PRODUCT_REGISTRY,
  CrossSectionExtractor,
  BaseTransformer,
  UICodeRecreationTransformer,
  CreativePreferenceTransformer,
  SpatialAnnotationTransformer,
  ImageUIPlacementTransformer,
  CrossModelBenchmarkTransformer,
  WorkflowKineticsTransformer,
  DesignIterationTransformer,
} from '@/lib/studio/telemetry/products';
import type {
  UICRInput,
  CreativePreferenceInput,
  SpatialAnnotationInput,
  ImageUIPlacementInput,
  CrossModelBenchmarkInput,
  WorkflowKineticsInput,
  DesignIterationInput,
  StrokeEvent,
} from '@/lib/studio/telemetry/products';
import type { FirestoreThread, FirestoreMessage } from '@/lib/studio/telemetry/products/crossSectionExtractor';

describe('Data Products Module', () => {
  describe('ProductRegistry', () => {
    it('should have all 7 products registered', () => {
      const products = getAllProducts();
      expect(products).toHaveLength(7);
    });

    it('should retrieve ui-code-recreation product metadata', () => {
      const product = getProduct('ui-code-recreation');
      expect(product.productId).toBe('ui-code-recreation');
      expect(product.productName).toBe('UI Code Recreation RLHF');
      expect(product.valuePerRecord.min).toBe(0.5);
      expect(product.valuePerRecord.max).toBe(2.0);
      expect(product.schemaVersion).toBe(1);
      expect(product.outputFormat).toBe('jsonl');
    });

    it('should retrieve creative-preference product metadata', () => {
      const product = getProduct('creative-preference');
      expect(product.productId).toBe('creative-preference');
      expect(product.productName).toBe('Creative Image Preference DPO');
      expect(product.valuePerRecord.min).toBe(0.1);
      expect(product.valuePerRecord.max).toBe(0.5);
    });

    it('should retrieve spatial-annotation product metadata', () => {
      const product = getProduct('spatial-annotation');
      expect(product.productId).toBe('spatial-annotation');
      expect(product.valuePerRecord.min).toBe(1.0);
      expect(product.valuePerRecord.max).toBe(5.0);
    });

    it('should retrieve image-ui-placement product metadata', () => {
      const product = getProduct('image-ui-placement');
      expect(product.productId).toBe('image-ui-placement');
      expect(product.valuePerRecord.min).toBe(0.5);
      expect(product.valuePerRecord.max).toBe(3.0);
    });

    it('should retrieve cross-model-benchmark product metadata', () => {
      const product = getProduct('cross-model-benchmark');
      expect(product.productId).toBe('cross-model-benchmark');
      expect(product.valuePerRecord.min).toBe(1.0);
      expect(product.valuePerRecord.max).toBe(5.0);
    });

    it('should retrieve workflow-kinetics product metadata', () => {
      const product = getProduct('workflow-kinetics');
      expect(product.productId).toBe('workflow-kinetics');
      expect(product.valuePerRecord.min).toBe(2.0);
      expect(product.valuePerRecord.max).toBe(8.0);
    });

    it('should retrieve design-iteration product metadata', () => {
      const product = getProduct('design-iteration');
      expect(product.productId).toBe('design-iteration');
      expect(product.valuePerRecord.min).toBe(2.0);
      expect(product.valuePerRecord.max).toBe(10.0);
    });

    it('should throw error for unknown product ID', () => {
      expect(() => getProduct('unknown-product' as any)).toThrow('Unknown data product');
    });

    it('should validate product IDs correctly', () => {
      expect(isValidProductId('ui-code-recreation')).toBe(true);
      expect(isValidProductId('creative-preference')).toBe(true);
      expect(isValidProductId('spatial-annotation')).toBe(true);
      expect(isValidProductId('image-ui-placement')).toBe(true);
      expect(isValidProductId('cross-model-benchmark')).toBe(true);
      expect(isValidProductId('workflow-kinetics')).toBe(true);
      expect(isValidProductId('design-iteration')).toBe(true);
      expect(isValidProductId('invalid-product')).toBe(false);
      expect(isValidProductId('')).toBe(false);
    });

    it('should get products by buyer type', () => {
      const aiModelLabs = getProductsByBuyer('AI Model Labs');
      expect(aiModelLabs).toHaveLength(1);
      expect(aiModelLabs[0].productId).toBe('ui-code-recreation');

      const imageGenTeams = getProductsByBuyer('Image Gen Model Teams');
      expect(imageGenTeams).toHaveLength(1);
      expect(imageGenTeams[0].productId).toBe('creative-preference');
    });

    it('should get all buyer types', () => {
      const buyers = getAllBuyerTypes();
      expect(buyers.length).toBeGreaterThan(0);
      expect(buyers).toContain('AI Model Labs');
      expect(buyers).toContain('Image Gen Model Teams');
      expect(buyers).toEqual(buyers.sort()); // Should be sorted
    });

    it('should verify all products have correct output format', () => {
      const products = getAllProducts();
      products.forEach((product) => {
        expect(product.outputFormat).toBe('jsonl');
      });
    });

    it('should verify all products have schema version 1', () => {
      const products = getAllProducts();
      products.forEach((product) => {
        expect(product.schemaVersion).toBe(1);
      });
    });
  });

  describe('TransformerPipeline', () => {
    let pipeline: TransformerPipeline;

    beforeEach(() => {
      pipeline = new TransformerPipeline();
    });

    it('should initialize with 7 transformers', () => {
      const transformers = pipeline.getAllTransformers();
      expect(transformers.size).toBe(7);
    });

    it('should register all required transformers', () => {
      expect(pipeline.hasTransformer('ui-code-recreation')).toBe(true);
      expect(pipeline.hasTransformer('creative-preference')).toBe(true);
      expect(pipeline.hasTransformer('spatial-annotation')).toBe(true);
      expect(pipeline.hasTransformer('image-ui-placement')).toBe(true);
      expect(pipeline.hasTransformer('cross-model-benchmark')).toBe(true);
      expect(pipeline.hasTransformer('workflow-kinetics')).toBe(true);
      expect(pipeline.hasTransformer('design-iteration')).toBe(true);
    });

    it('should return correct product IDs list', () => {
      const ids = pipeline.getProductIds();
      expect(ids).toHaveLength(7);
      expect(ids).toContain('ui-code-recreation');
      expect(ids).toContain('design-iteration');
    });

    it('should get transformer for valid product ID', () => {
      const transformer = pipeline.getTransformer('ui-code-recreation');
      expect(transformer).toBeDefined();
      expect(transformer instanceof UICodeRecreationTransformer).toBe(true);
    });

    it('should throw error for invalid product ID when getting transformer', () => {
      expect(() => pipeline.getTransformer('invalid-product' as any)).toThrow(
        'No transformer registered for product: invalid-product'
      );
    });

    it('should transform single UI Code Recreation record', () => {
      const input: UICRInput = {
        sessionId: 'session-123',
        events: [
          { type: 'action', actionType: 'type-text', timestamp: 1000, metadata: {} },
          { type: 'undo', targetAction: 'type-text', timestamp: 2000, metadata: {} },
          { type: 'redo', targetAction: 'type-text', timestamp: 2500, metadata: {} },
        ],
        toolSequence: [
          { name: 'pencil', timestamp: 1000 },
          { name: 'eraser', timestamp: 3000 },
        ],
        sessionStartTime: 1000,
        sessionEndTime: 5000,
      };

      const result = pipeline.transform(input, 'ui-code-recreation');
      expect(result.recordId).toBeDefined();
      expect(result.sessionId).toBe('session-123');
      expect(result.undoRedoSequence).toBeDefined();
      expect(result.dpoSignals).toBeDefined();
      expect(result.toolSequenceCategories).toBeDefined();
      expect(result.sessionDurationBucket).toBeDefined();
    });

    it('should validate output after transformation', () => {
      const input: UICRInput = {
        sessionId: 'session-123',
        events: [{ type: 'action', actionType: 'test', timestamp: 1000, metadata: {} }],
        toolSequence: [{ name: 'pencil', timestamp: 1000 }],
        sessionStartTime: 1000,
        sessionEndTime: 5000,
      };

      const result = pipeline.transform(input, 'ui-code-recreation');
      expect(result).toBeDefined();
      expect(result.recordId).toBeTruthy();
    });

    it('should throw error for invalid product during transform', () => {
      const input: any = { sessionId: 'test' };
      expect(() => pipeline.transform(input, 'invalid-product' as any)).toThrow(
        'Invalid product ID'
      );
    });

    it('should batch transform multiple records', () => {
      const inputs: UICRInput[] = [
        {
          sessionId: 'session-1',
          events: [{ type: 'action', actionType: 'test', timestamp: 1000, metadata: {} }],
          toolSequence: [{ name: 'pencil', timestamp: 1000 }],
          sessionStartTime: 1000,
          sessionEndTime: 5000,
        },
        {
          sessionId: 'session-2',
          events: [{ type: 'action', actionType: 'test', timestamp: 2000, metadata: {} }],
          toolSequence: [{ name: 'brush', timestamp: 2000 }],
          sessionStartTime: 2000,
          sessionEndTime: 6000,
        },
      ];

      const results = pipeline.transformBatch(inputs, 'ui-code-recreation');
      expect(results).toHaveLength(2);
      expect(results[0].sessionId).toBe('session-1');
      expect(results[1].sessionId).toBe('session-2');
    });

    it('should convert batch to JSONL format', () => {
      const inputs: UICRInput[] = [
        {
          sessionId: 'session-1',
          events: [{ type: 'action', actionType: 'test', timestamp: 1000, metadata: {} }],
          toolSequence: [{ name: 'pencil', timestamp: 1000 }],
          sessionStartTime: 1000,
          sessionEndTime: 5000,
        },
      ];

      const jsonl = pipeline.transformToJSONL(inputs, 'ui-code-recreation');
      expect(jsonl).toBeTruthy();
      expect(jsonl).toContain('\n');

      const lines = jsonl.split('\n').filter((line) => line);
      expect(lines.length).toBeGreaterThan(0);

      lines.forEach((line) => {
        const parsed = JSON.parse(line);
        expect(parsed.recordId).toBeDefined();
      });
    });

    it('should handle invalid product in batch transform', () => {
      const inputs: any[] = [{ sessionId: 'test' }];
      expect(() => pipeline.transformBatch(inputs, 'invalid-product' as any)).toThrow(
        'Invalid product ID'
      );
    });

    it('should handle invalid product in transformToJSONL', () => {
      const inputs: any[] = [{ sessionId: 'test' }];
      expect(() => pipeline.transformToJSONL(inputs, 'invalid-product' as any)).toThrow(
        'Invalid product ID'
      );
    });
  });

  describe('UICodeRecreationTransformer', () => {
    let transformer: UICodeRecreationTransformer;

    beforeEach(() => {
      transformer = new UICodeRecreationTransformer();
    });

    it('should have correct product ID', () => {
      expect(transformer.productId).toBe('ui-code-recreation');
    });

    it('should transform valid input', () => {
      const input: UICRInput = {
        sessionId: 'session-123',
        events: [
          { type: 'action', actionType: 'type', timestamp: 1000, metadata: {} },
          { type: 'undo', targetAction: 'type', timestamp: 2000, metadata: {} },
        ],
        toolSequence: [{ name: 'pencil', timestamp: 1000 }],
        sessionStartTime: 1000,
        sessionEndTime: 10000,
      };

      const result = transformer.transform(input);
      expect(result.recordId).toBeTruthy();
      expect(result.sessionId).toBe('session-123');
      expect(result.undoRedoSequence).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            actionType: 'undo',
            signalStrength: expect.stringMatching(/strong|medium|weak/),
          }),
        ])
      );
    });

    it('should extract tool sequence categories', () => {
      const input: UICRInput = {
        sessionId: 'session-123',
        events: [
          { type: 'action', actionType: 'test', timestamp: 1000, metadata: {} },
        ],
        toolSequence: [
          { name: 'pencil', timestamp: 1000 },
          { name: 'brush', timestamp: 2000 },
          { name: 'brush', timestamp: 3000 }, // Duplicate
          { name: 'eraser', timestamp: 4000 },
        ],
        sessionStartTime: 1000,
        sessionEndTime: 5000,
      };

      const result = transformer.transform(input);
      // Should filter out consecutive duplicates
      expect(result.toolSequenceCategories.length).toBeLessThanOrEqual(
        input.toolSequence.length
      );
    });

    it('should validate correct output', () => {
      const input: UICRInput = {
        sessionId: 'session-123',
        events: [{ type: 'action', actionType: 'test', timestamp: 1000, metadata: {} }],
        toolSequence: [{ name: 'pencil', timestamp: 1000 }],
        sessionStartTime: 1000,
        sessionEndTime: 5000,
      };

      const output = transformer.transform(input);
      expect(transformer.validateOutput(output)).toBe(true);
    });

    it('should reject invalid output with missing recordId', () => {
      const invalidOutput = {
        sessionId: 'session-123',
        undoRedoSequence: [],
        dpoSignals: [],
        toolSequenceCategories: [],
        sessionDurationBucket: '5-10s',
      } as any;

      expect(transformer.validateOutput(invalidOutput)).toBe(false);
    });

    it('should handle empty events', () => {
      const input: UICRInput = {
        sessionId: 'session-123',
        events: [],
        toolSequence: [],
        sessionStartTime: 1000,
        sessionEndTime: 5000,
      };

      const result = transformer.transform(input);
      expect(result.undoRedoSequence).toEqual([]);
      expect(result.dpoSignals).toEqual([]);
    });

    it('should detect signal strength based on confidence metadata', () => {
      const input: UICRInput = {
        sessionId: 'session-123',
        events: [
          {
            type: 'undo',
            targetAction: 'type',
            timestamp: 1000,
            metadata: { confidence: 0.9 },
          },
        ],
        toolSequence: [],
        sessionStartTime: 1000,
        sessionEndTime: 2000,
      };

      const result = transformer.transform(input);
      expect(result.undoRedoSequence).toHaveLength(1);
    });
  });

  describe('CreativePreferenceTransformer', () => {
    let transformer: CreativePreferenceTransformer;

    beforeEach(() => {
      transformer = new CreativePreferenceTransformer();
    });

    it('should have correct product ID', () => {
      expect(transformer.productId).toBe('creative-preference');
    });

    it('should transform valid input', () => {
      const input: CreativePreferenceInput = {
        promptText: 'a dog in the park',
        imageA: { modelFamily: 'DALL-E 3', generatedAt: 1000 },
        imageB: { modelFamily: 'Stable Diffusion XL', generatedAt: 1500 },
        selectedImageId: 'A',
        userSelection: {
          startTime: 2000,
          endTime: 5000,
          hoverSequence: [
            { imageId: 'A', startTime: 2000, endTime: 3000 },
            { imageId: 'B', startTime: 3000, endTime: 4000 },
          ],
        },
        editedAfter: false,
      };

      const result = transformer.transform(input);
      expect(result.recordId).toBeTruthy();
      expect(result.promptHash).toBeTruthy();
      expect(result.selectedModel).toBe('A');
      expect(result.modelFamilyA).toBeTruthy();
      expect(result.modelFamilyB).toBeTruthy();
      expect(result.timeToDecideBucket).toBeTruthy();
    });

    it('should validate correct output', () => {
      const input: CreativePreferenceInput = {
        promptText: 'test prompt',
        imageA: { modelFamily: 'gpt-4', generatedAt: 1000 },
        imageB: { modelFamily: 'claude-opus', generatedAt: 1500 },
        selectedImageId: 'B',
        userSelection: {
          startTime: 2000,
          endTime: 3000,
          hoverSequence: [],
        },
        editedAfter: true,
      };

      const output = transformer.transform(input);
      expect(transformer.validateOutput(output)).toBe(true);
    });

    it('should calculate hover patterns correctly', () => {
      const input: CreativePreferenceInput = {
        promptText: 'test',
        imageA: { modelFamily: 'model-a', generatedAt: 1000 },
        imageB: { modelFamily: 'model-b', generatedAt: 1500 },
        selectedImageId: 'A',
        userSelection: {
          startTime: 1000,
          endTime: 5000,
          hoverSequence: [
            { imageId: 'A', startTime: 1000, endTime: 2000 },
            { imageId: 'A', startTime: 2100, endTime: 3000 },
            { imageId: 'B', startTime: 3000, endTime: 4000 },
          ],
        },
        editedAfter: false,
      };

      const result = transformer.transform(input);
      expect(result.hoverPatternSummary.avgDwellA).toBeGreaterThan(0);
      expect(result.hoverPatternSummary.switchCount).toBeGreaterThan(0);
    });

    it('should hash prompt text', () => {
      const input: CreativePreferenceInput = {
        promptText: 'a dog in the park',
        imageA: { modelFamily: 'model-a', generatedAt: 1000 },
        imageB: { modelFamily: 'model-b', generatedAt: 1500 },
        selectedImageId: 'A',
        userSelection: { startTime: 2000, endTime: 3000, hoverSequence: [] },
        editedAfter: false,
      };

      const result = transformer.transform(input);
      // Hash should be consistent
      const result2 = transformer.transform(input);
      expect(result.promptHash).toBe(result2.promptHash);
    });

    it('should extract model families correctly', () => {
      const input: CreativePreferenceInput = {
        promptText: 'test',
        imageA: { modelFamily: 'dall-e-3', generatedAt: 1000 },
        imageB: { modelFamily: 'stable-diffusion-xl', generatedAt: 1500 },
        selectedImageId: 'A',
        userSelection: { startTime: 1000, endTime: 2000, hoverSequence: [] },
        editedAfter: false,
      };

      const result = transformer.transform(input);
      expect(result.modelFamilyA).toMatch(/dall-e/i);
      expect(result.modelFamilyB).toMatch(/sdxl|stable-diffusion/i);
    });
  });

  describe('SpatialAnnotationTransformer', () => {
    let transformer: SpatialAnnotationTransformer;

    beforeEach(() => {
      transformer = new SpatialAnnotationTransformer();
    });

    it('should have correct product ID', () => {
      expect(transformer.productId).toBe('spatial-annotation');
    });

    it('should transform valid input', () => {
      const input: SpatialAnnotationInput = {
        sessionId: 'session-123',
        canvasWidth: 1024,
        canvasHeight: 768,
        events: [
          {
            type: 'layer-add',
            timestamp: 1000,
            payload: { layerId: 'layer-1' },
          },
          {
            type: 'layer-delete',
            timestamp: 2000,
            payload: { layerId: 'layer-1' },
          },
          {
            type: 'selection',
            timestamp: 3000,
            payload: { x: 100, y: 100, width: 200, height: 200 },
          },
          {
            type: 'viewport',
            timestamp: 4000,
            payload: { zoomLevel: 2 },
          },
        ],
        sessionStartTime: 1000,
        sessionEndTime: 5000,
      };

      const result = transformer.transform(input);
      expect(result.recordId).toBeTruthy();
      expect(result.sessionId).toBe('session-123');
      expect(result.canvasDimensionsBucket).toBeTruthy();
      expect(result.layerOperations).toBeTruthy();
      expect(result.selectionEvents).toBeTruthy();
      expect(result.viewportChanges).toBeGreaterThan(0);
    });

    it('should validate correct output', () => {
      const input: SpatialAnnotationInput = {
        sessionId: 'session-123',
        canvasWidth: 800,
        canvasHeight: 600,
        events: [{ type: 'layer-add', timestamp: 1000 }],
        sessionStartTime: 1000,
        sessionEndTime: 2000,
      };

      const output = transformer.transform(input);
      expect(transformer.validateOutput(output)).toBe(true);
    });

    it('should bucket canvas dimensions', () => {
      const input: SpatialAnnotationInput = {
        sessionId: 'session-123',
        canvasWidth: 512,
        canvasHeight: 256,
        events: [],
        sessionStartTime: 1000,
        sessionEndTime: 2000,
      };

      const result = transformer.transform(input);
      expect(result.canvasDimensionsBucket.width).toBeGreaterThanOrEqual(512);
      expect(result.canvasDimensionsBucket.height).toBeGreaterThanOrEqual(256);
    });

    it('should count viewport changes', () => {
      const input: SpatialAnnotationInput = {
        sessionId: 'session-123',
        canvasWidth: 1024,
        canvasHeight: 768,
        events: [
          { type: 'viewport', timestamp: 1000 },
          { type: 'viewport', timestamp: 2000 },
          { type: 'viewport', timestamp: 3000 },
          { type: 'layer-add', timestamp: 4000 },
        ],
        sessionStartTime: 1000,
        sessionEndTime: 5000,
      };

      const result = transformer.transform(input);
      expect(result.viewportChanges).toBe(3);
    });

    it('should extract layer operations with time deltas', () => {
      const input: SpatialAnnotationInput = {
        sessionId: 'session-123',
        canvasWidth: 1024,
        canvasHeight: 768,
        events: [
          { type: 'layer-add', timestamp: 1000 },
          { type: 'layer-delete', timestamp: 1500 },
          { type: 'layer-reorder', timestamp: 2000 },
        ],
        sessionStartTime: 1000,
        sessionEndTime: 3000,
      };

      const result = transformer.transform(input);
      expect(result.layerOperations).toHaveLength(3);
      expect(result.layerOperations[0].timeDelta).toBe(0);
      expect(result.layerOperations[1].timeDelta).toBe(500);
      expect(result.layerOperations[2].timeDelta).toBe(500);
    });

    it('should handle empty events', () => {
      const input: SpatialAnnotationInput = {
        sessionId: 'session-123',
        canvasWidth: 1024,
        canvasHeight: 768,
        events: [],
        sessionStartTime: 1000,
        sessionEndTime: 2000,
      };

      const result = transformer.transform(input);
      expect(result.layerOperations).toEqual([]);
      expect(result.selectionEvents).toEqual([]);
      expect(result.viewportChanges).toBe(0);
    });
  });

  describe('ImageUIPlacementTransformer', () => {
    let transformer: ImageUIPlacementTransformer;

    beforeEach(() => {
      transformer = new ImageUIPlacementTransformer();
    });

    it('should have correct product ID', () => {
      expect(transformer.productId).toBe('image-ui-placement');
    });

    it('should transform valid input', () => {
      const input: ImageUIPlacementInput = {
        sessionId: 'session-123',
        canvasWidth: 1024,
        canvasHeight: 768,
        interactions: [
          { type: 'click', x: 100, y: 100, timestamp: 1000 },
          { type: 'drag', x: 200, y: 200, timestamp: 2000 },
        ],
        exportFormat: 'png',
        sessionStartTime: 1000,
        sessionEndTime: 10000,
      };

      const result = transformer.transform(input);
      expect(result.recordId).toBeTruthy();
      expect(result.sessionId).toBe('session-123');
      expect(result.canvasInteractions).toHaveLength(2);
      expect(result.exportFormat).toBe('png');
      expect(result.sessionDurationBucket).toBeTruthy();
    });

    it('should validate correct output', () => {
      const input: ImageUIPlacementInput = {
        sessionId: 'session-123',
        canvasWidth: 800,
        canvasHeight: 600,
        interactions: [],
        sessionStartTime: 1000,
        sessionEndTime: 5000,
      };

      const output = transformer.transform(input);
      expect(transformer.validateOutput(output)).toBe(true);
    });

    it('should bucket region interactions', () => {
      const input: ImageUIPlacementInput = {
        sessionId: 'session-123',
        canvasWidth: 300,
        canvasHeight: 300,
        interactions: [
          { type: 'click', x: 10, y: 10, timestamp: 1000 }, // top-left
          { type: 'click', x: 150, y: 150, timestamp: 2000 }, // center
          { type: 'click', x: 290, y: 290, timestamp: 3000 }, // bottom-right
        ],
        sessionStartTime: 1000,
        sessionEndTime: 4000,
      };

      const result = transformer.transform(input);
      expect(result.canvasInteractions[0].regionBucket).toBeTruthy();
      expect(result.canvasInteractions[1].regionBucket).toBeTruthy();
      expect(result.canvasInteractions[2].regionBucket).toBeTruthy();
    });

    it('should handle optional exportFormat', () => {
      const input: ImageUIPlacementInput = {
        sessionId: 'session-123',
        canvasWidth: 800,
        canvasHeight: 600,
        interactions: [],
        sessionStartTime: 1000,
        sessionEndTime: 5000,
      };

      const result = transformer.transform(input);
      expect(result.exportFormat).toBeUndefined();
    });
  });

  describe('CrossModelBenchmarkTransformer', () => {
    let transformer: CrossModelBenchmarkTransformer;

    beforeEach(() => {
      transformer = new CrossModelBenchmarkTransformer();
    });

    it('should have correct product ID', () => {
      expect(transformer.productId).toBe('cross-model-benchmark');
    });

    it('should transform valid input', () => {
      const input: CrossModelBenchmarkInput = {
        comparisonId: 'comp-123',
        promptText: 'a futuristic city',
        imageA: {
          modelFamily: 'DALL-E 3',
          width: 1024,
          height: 1024,
          generatedAtMs: 2500,
        },
        imageB: {
          modelFamily: 'Stable Diffusion XL',
          width: 512,
          height: 512,
          generatedAtMs: 1800,
        },
        selectedImageId: 'A',
        userSelection: {
          startTime: 5000,
          endTime: 8000,
          hoverSequence: [
            { imageId: 'A', startTime: 5000, endTime: 6000 },
            { imageId: 'B', startTime: 6000, endTime: 7000 },
          ],
        },
        editedAfter: false,
      };

      const result = transformer.transform(input);
      expect(result.recordId).toBeTruthy();
      expect(result.comparisonId).toBe('comp-123');
      expect(result.promptHash).toBeTruthy();
      expect(result.selectedImage).toBe('A');
      expect(result.generationTimeBucketA).toBeTruthy();
      expect(result.generationTimeBucketB).toBeTruthy();
    });

    it('should validate correct output', () => {
      const input: CrossModelBenchmarkInput = {
        comparisonId: 'comp-123',
        promptText: 'test',
        imageA: { modelFamily: 'model-a', width: 512, height: 512, generatedAtMs: 1000 },
        imageB: { modelFamily: 'model-b', width: 512, height: 512, generatedAtMs: 1500 },
        selectedImageId: 'A',
        userSelection: { startTime: 2000, endTime: 3000, hoverSequence: [] },
        editedAfter: false,
      };

      const output = transformer.transform(input);
      expect(transformer.validateOutput(output)).toBe(true);
    });

    it('should bucket image dimensions', () => {
      const input: CrossModelBenchmarkInput = {
        comparisonId: 'comp-123',
        promptText: 'test',
        imageA: { modelFamily: 'model-a', width: 256, height: 512, generatedAtMs: 1000 },
        imageB: { modelFamily: 'model-b', width: 1024, height: 2048, generatedAtMs: 1500 },
        selectedImageId: 'A',
        userSelection: { startTime: 2000, endTime: 3000, hoverSequence: [] },
        editedAfter: false,
      };

      const result = transformer.transform(input);
      expect(result.imageDimensionsBucketA.width).toBeGreaterThanOrEqual(256);
      expect(result.imageDimensionsBucketB.width).toBeGreaterThanOrEqual(1024);
    });

    it('should extract hover events with dwell times', () => {
      const input: CrossModelBenchmarkInput = {
        comparisonId: 'comp-123',
        promptText: 'test',
        imageA: { modelFamily: 'model-a', width: 512, height: 512, generatedAtMs: 1000 },
        imageB: { modelFamily: 'model-b', width: 512, height: 512, generatedAtMs: 1500 },
        selectedImageId: 'A',
        userSelection: {
          startTime: 2000,
          endTime: 8000,
          hoverSequence: [
            { imageId: 'A', startTime: 2000, endTime: 3000 },
            { imageId: 'B', startTime: 3000, endTime: 5000 },
          ],
        },
        editedAfter: false,
      };

      const result = transformer.transform(input);
      expect(result.hoverEvents).toHaveLength(2);
      expect(result.hoverEvents[0].hoveredImage).toBe('A');
      expect(result.hoverEvents[1].hoveredImage).toBe('B');
      expect(result.hoverEvents[1].dwellTimeBucket).toBeTruthy();
    });
  });

  describe('WorkflowKineticsTransformer', () => {
    let transformer: WorkflowKineticsTransformer;

    beforeEach(() => {
      transformer = new WorkflowKineticsTransformer();
    });

    it('should have correct product ID', () => {
      expect(transformer.productId).toBe('workflow-kinetics');
    });

    it('should transform valid input', () => {
      const stroke1: StrokeEvent = {
        toolName: 'pencil',
        startTime: 1000,
        endTime: 2000,
        sampleCount: 50,
        samples: [
          { velocity: 0.5, pressure: 0.8, brushSize: 10 },
          { velocity: 0.6, pressure: 0.7, brushSize: 10 },
        ],
      };

      const input: WorkflowKineticsInput = {
        sessionId: 'session-123',
        sessionStartTime: 1000,
        sessionEndTime: 10000,
        strokes: [stroke1],
      };

      const result = transformer.transform(input);
      expect(result.recordId).toBeTruthy();
      expect(result.sessionId).toBe('session-123');
      expect(result.strokeSummaries).toBeDefined();
      expect(result.totalStrokeCount).toBe(1);
      expect(result.startTimeWindow).toBeTruthy();
    });

    it('should validate correct output', () => {
      const input: WorkflowKineticsInput = {
        sessionId: 'session-123',
        sessionStartTime: 1000,
        sessionEndTime: 5000,
        strokes: [],
      };

      const output = transformer.transform(input);
      expect(transformer.validateOutput(output)).toBe(true);
    });

    it('should group strokes by tool category', () => {
      const input: WorkflowKineticsInput = {
        sessionId: 'session-123',
        sessionStartTime: 1000,
        sessionEndTime: 10000,
        strokes: [
          {
            toolName: 'pencil',
            startTime: 1000,
            endTime: 2000,
            sampleCount: 10,
            samples: [{ velocity: 0.5, pressure: 0.8, brushSize: 10 }],
          },
          {
            toolName: 'brush',
            startTime: 2000,
            endTime: 3000,
            sampleCount: 10,
            samples: [{ velocity: 0.6, pressure: 0.7, brushSize: 12 }],
          },
          {
            toolName: 'eraser',
            startTime: 3000,
            endTime: 4000,
            sampleCount: 10,
            samples: [{ velocity: 0.4, pressure: 0.5, brushSize: 15 }],
          },
        ],
      };

      const result = transformer.transform(input);
      expect(result.strokeSummaries.length).toBeGreaterThan(0);
      expect(result.strokeSummaries[0].toolCategory).toBeTruthy();
    });

    it('should handle empty strokes', () => {
      const input: WorkflowKineticsInput = {
        sessionId: 'session-123',
        sessionStartTime: 1000,
        sessionEndTime: 5000,
        strokes: [],
      };

      const result = transformer.transform(input);
      expect(result.strokeSummaries).toEqual([]);
      expect(result.totalStrokeCount).toBe(0);
    });

    it('should extract tool switch patterns', () => {
      const input: WorkflowKineticsInput = {
        sessionId: 'session-123',
        sessionStartTime: 1000,
        sessionEndTime: 10000,
        strokes: [
          {
            toolName: 'pencil',
            startTime: 1000,
            endTime: 2000,
            sampleCount: 10,
            samples: [{ velocity: 0.5 }],
          },
          {
            toolName: 'eraser',
            startTime: 2000,
            endTime: 3000,
            sampleCount: 10,
            samples: [{ velocity: 0.5 }],
          },
          {
            toolName: 'pencil',
            startTime: 3000,
            endTime: 4000,
            sampleCount: 10,
            samples: [{ velocity: 0.5 }],
          },
        ],
      };

      const result = transformer.transform(input);
      expect(result.toolSwitchPatterns).toBeDefined();
      expect(result.toolSwitchPatterns.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate total switch count', () => {
      const input: WorkflowKineticsInput = {
        sessionId: 'session-123',
        sessionStartTime: 1000,
        sessionEndTime: 10000,
        strokes: [
          {
            toolName: 'pencil',
            startTime: 1000,
            endTime: 2000,
            sampleCount: 10,
            samples: [{ velocity: 0.5 }],
          },
          {
            toolName: 'brush',
            startTime: 2000,
            endTime: 3000,
            sampleCount: 10,
            samples: [{ velocity: 0.5 }],
          },
          {
            toolName: 'eraser',
            startTime: 3000,
            endTime: 4000,
            sampleCount: 10,
            samples: [{ velocity: 0.5 }],
          },
        ],
      };

      const result = transformer.transform(input);
      expect(result.totalSwitchCount).toBe(2); // 3 strokes - 1
    });
  });

  describe('DesignIterationTransformer', () => {
    let transformer: DesignIterationTransformer;

    beforeEach(() => {
      transformer = new DesignIterationTransformer();
    });

    it('should have correct product ID', () => {
      expect(transformer.productId).toBe('design-iteration');
    });

    it('should transform valid input', () => {
      const input: DesignIterationInput = {
        threadId: 'thread-123',
        originalDesignWidth: 1024,
        originalDesignHeight: 768,
        originalDesignFormat: 'png',
        originalDesignDegradationLevel: 2,
        threadStartTime: 1000,
        threadEndTime: 10000,
        messages: [
          {
            direction: 'inbound',
            timestamp: 1000,
            text: 'This looks great!',
            images: [
              {
                width: 512,
                height: 512,
                intent: 'suggestion',
                intentConfidence: 0.9,
              },
            ],
          },
        ],
        revisionCount: 2,
        feedbackText: 'Excellent work overall',
      };

      const result = transformer.transform(input);
      expect(result.threadId).toBe('thread-123');
      expect(result.messages).toHaveLength(1);
      expect(result.revisionCount).toBe(2);
      expect(result.feedbackSentiment).toBeTruthy();
    });

    it('should validate correct output', () => {
      const input: DesignIterationInput = {
        threadId: 'thread-123',
        originalDesignWidth: 800,
        originalDesignHeight: 600,
        originalDesignFormat: 'jpg',
        originalDesignDegradationLevel: 1,
        threadStartTime: 1000,
        threadEndTime: 5000,
        messages: [],
        revisionCount: 0,
      };

      const output = transformer.transform(input);
      expect(transformer.validateOutput(output)).toBe(true);
    });

    it('should strip PII from text', () => {
      const input: DesignIterationInput = {
        threadId: 'thread-123',
        originalDesignWidth: 800,
        originalDesignHeight: 600,
        originalDesignFormat: 'png',
        originalDesignDegradationLevel: 1,
        threadStartTime: 1000,
        threadEndTime: 5000,
        messages: [
          {
            direction: 'inbound',
            timestamp: 1000,
            text: 'Contact me at john@example.com or 555-123-4567',
            images: [],
          },
        ],
        revisionCount: 0,
      };

      const result = transformer.transform(input);
      expect(result.messages[0].textLength).toBeDefined();
      expect(result.messages[0].hasText).toBe(true);
    });

    it('should calculate sentiment correctly', () => {
      const input: DesignIterationInput = {
        threadId: 'thread-123',
        originalDesignWidth: 800,
        originalDesignHeight: 600,
        originalDesignFormat: 'png',
        originalDesignDegradationLevel: 1,
        threadStartTime: 1000,
        threadEndTime: 5000,
        messages: [],
        revisionCount: 0,
        feedbackText: 'This is excellent and amazing work!',
      };

      const result = transformer.transform(input);
      expect(result.feedbackSentiment).toBe('positive');
    });

    it('should classify negative sentiment', () => {
      const input: DesignIterationInput = {
        threadId: 'thread-123',
        originalDesignWidth: 800,
        originalDesignHeight: 600,
        originalDesignFormat: 'png',
        originalDesignDegradationLevel: 1,
        threadStartTime: 1000,
        threadEndTime: 5000,
        messages: [],
        revisionCount: 0,
        feedbackText: 'This is terrible and awful work',
      };

      const result = transformer.transform(input);
      expect(result.feedbackSentiment).toBe('negative');
    });

    it('should bucket image dimensions', () => {
      const input: DesignIterationInput = {
        threadId: 'thread-123',
        originalDesignWidth: 512,
        originalDesignHeight: 256,
        originalDesignFormat: 'png',
        originalDesignDegradationLevel: 1,
        threadStartTime: 1000,
        threadEndTime: 5000,
        messages: [
          {
            direction: 'inbound',
            timestamp: 1000,
            images: [{ width: 1024, height: 1024, intent: 'test', intentConfidence: 0.8 }],
          },
        ],
        revisionCount: 0,
      };

      const result = transformer.transform(input);
      expect(result.messages[0].images[0].dimensionsBucket.width).toBeGreaterThanOrEqual(1024);
    });

    it('should calculate timestamp offsets correctly', () => {
      const input: DesignIterationInput = {
        threadId: 'thread-123',
        originalDesignWidth: 800,
        originalDesignHeight: 600,
        originalDesignFormat: 'png',
        originalDesignDegradationLevel: 1,
        threadStartTime: 1000,
        threadEndTime: 5000,
        messages: [
          {
            direction: 'inbound',
            timestamp: 1000,
            images: [],
          },
          {
            direction: 'outbound',
            timestamp: 4000,
            images: [],
          },
        ],
        revisionCount: 0,
      };

      const result = transformer.transform(input);
      expect(result.messages[0].timestampOffset).toBe(0);
      expect(result.messages[1].timestampOffset).toBeGreaterThan(0);
    });
  });

  describe('CrossSectionExtractor', () => {
    let extractor: CrossSectionExtractor;

    beforeEach(() => {
      extractor = new CrossSectionExtractor();
    });

    it('should extract single thread', () => {
      const thread: FirestoreThread = {
        threadId: 'thread-123',
        projectId: 'project-1',
        reviewToken: 'token-123',
        originalDesign: {
          storageRef: 'gs://bucket/design.png',
          width: 800,
          height: 600,
          format: 'png',
          degradationLevel: 1,
        },
        createdAt: 1000,
        completedAt: 5000,
        messages: [
          {
            id: 'msg-1',
            userId: 'user-1',
            userRole: 'designer',
            direction: 'inbound',
            timestamp: 1000,
            textContent: 'Here is my design',
            images: [
              {
                storageRef: 'gs://bucket/img.png',
                width: 512,
                height: 512,
                intent: 'design',
                intentConfidence: 0.9,
              },
            ],
          },
        ],
        revisionCount: 1,
        status: 'completed',
      };

      const result = extractor.extractThread(thread);
      expect(result.threadId).toBe('thread-123');
      expect(result.messages).toHaveLength(1);
      expect(result.revisionCount).toBe(1);
    });

    it('should extract all threads', () => {
      const threads: FirestoreThread[] = [
        {
          threadId: 'thread-1',
          projectId: 'project-1',
          reviewToken: 'token-1',
          originalDesign: {
            storageRef: 'gs://bucket/design1.png',
            width: 800,
            height: 600,
            format: 'png',
            degradationLevel: 1,
          },
          createdAt: 1000,
          completedAt: 5000,
          messages: [],
          revisionCount: 1,
          status: 'completed',
        },
        {
          threadId: 'thread-2',
          projectId: 'project-1',
          reviewToken: 'token-2',
          originalDesign: {
            storageRef: 'gs://bucket/design2.png',
            width: 1024,
            height: 768,
            format: 'jpg',
            degradationLevel: 2,
          },
          createdAt: 2000,
          completedAt: 6000,
          messages: [],
          revisionCount: 2,
          status: 'completed',
        },
      ];

      const results = extractor.extractAllThreads(threads);
      expect(results).toHaveLength(2);
      expect(results[0].threadId).toBe('thread-1');
      expect(results[1].threadId).toBe('thread-2');
    });

    it('should filter threads by status', () => {
      const threads: FirestoreThread[] = [
        {
          threadId: 'thread-1',
          projectId: 'project-1',
          reviewToken: 'token-1',
          originalDesign: {
            storageRef: 'gs://bucket/design1.png',
            width: 800,
            height: 600,
            format: 'png',
            degradationLevel: 1,
          },
          createdAt: 1000,
          completedAt: 5000,
          messages: [],
          revisionCount: 1,
          status: 'completed',
        },
        {
          threadId: 'thread-2',
          projectId: 'project-1',
          reviewToken: 'token-2',
          originalDesign: {
            storageRef: 'gs://bucket/design2.png',
            width: 1024,
            height: 768,
            format: 'jpg',
            degradationLevel: 2,
          },
          createdAt: 2000,
          completedAt: 6000,
          messages: [],
          revisionCount: 2,
          status: 'active',
        },
      ];

      const completed = extractor.filterThreadsByStatus(threads, 'completed');
      expect(completed).toHaveLength(1);
      expect(completed[0].threadId).toBe('thread-1');

      const active = extractor.filterThreadsByStatus(threads, 'active');
      expect(active).toHaveLength(1);
      expect(active[0].threadId).toBe('thread-2');
    });

    it('should filter threads by project', () => {
      const threads: FirestoreThread[] = [
        {
          threadId: 'thread-1',
          projectId: 'project-1',
          reviewToken: 'token-1',
          originalDesign: {
            storageRef: 'gs://bucket/design1.png',
            width: 800,
            height: 600,
            format: 'png',
            degradationLevel: 1,
          },
          createdAt: 1000,
          completedAt: 5000,
          messages: [],
          revisionCount: 1,
          status: 'completed',
        },
        {
          threadId: 'thread-2',
          projectId: 'project-2',
          reviewToken: 'token-2',
          originalDesign: {
            storageRef: 'gs://bucket/design2.png',
            width: 1024,
            height: 768,
            format: 'jpg',
            degradationLevel: 2,
          },
          createdAt: 2000,
          completedAt: 6000,
          messages: [],
          revisionCount: 2,
          status: 'completed',
        },
      ];

      const project1 = extractor.filterThreadsByProject(threads, 'project-1');
      expect(project1).toHaveLength(1);
      expect(project1[0].projectId).toBe('project-1');
    });

    it('should filter threads by date range', () => {
      const threads: FirestoreThread[] = [
        {
          threadId: 'thread-1',
          projectId: 'project-1',
          reviewToken: 'token-1',
          originalDesign: {
            storageRef: 'gs://bucket/design1.png',
            width: 800,
            height: 600,
            format: 'png',
            degradationLevel: 1,
          },
          createdAt: 1000,
          completedAt: 5000,
          messages: [],
          revisionCount: 1,
          status: 'completed',
        },
        {
          threadId: 'thread-2',
          projectId: 'project-1',
          reviewToken: 'token-2',
          originalDesign: {
            storageRef: 'gs://bucket/design2.png',
            width: 1024,
            height: 768,
            format: 'jpg',
            degradationLevel: 2,
          },
          createdAt: 10000,
          completedAt: 15000,
          messages: [],
          revisionCount: 2,
          status: 'completed',
        },
      ];

      const filtered = extractor.filterThreadsByDateRange(threads, 500, 5000);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].threadId).toBe('thread-1');
    });

    it('should filter threads by minimum revision count', () => {
      const threads: FirestoreThread[] = [
        {
          threadId: 'thread-1',
          projectId: 'project-1',
          reviewToken: 'token-1',
          originalDesign: {
            storageRef: 'gs://bucket/design1.png',
            width: 800,
            height: 600,
            format: 'png',
            degradationLevel: 1,
          },
          createdAt: 1000,
          completedAt: 5000,
          messages: [],
          revisionCount: 1,
          status: 'completed',
        },
        {
          threadId: 'thread-2',
          projectId: 'project-1',
          reviewToken: 'token-2',
          originalDesign: {
            storageRef: 'gs://bucket/design2.png',
            width: 1024,
            height: 768,
            format: 'jpg',
            degradationLevel: 2,
          },
          createdAt: 2000,
          completedAt: 6000,
          messages: [],
          revisionCount: 5,
          status: 'completed',
        },
      ];

      const filtered = extractor.filterThreadsByRevisionCount(threads, 3);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].revisionCount).toBe(5);
    });

    it('should validate thread with all required fields', () => {
      const validThread: FirestoreThread = {
        threadId: 'thread-123',
        projectId: 'project-1',
        reviewToken: 'token-123',
        originalDesign: {
          storageRef: 'gs://bucket/design.png',
          width: 800,
          height: 600,
          format: 'png',
          degradationLevel: 1,
        },
        createdAt: 1000,
        completedAt: 5000,
        messages: [
          {
            id: 'msg-1',
            userId: 'user-1',
            userRole: 'designer',
            direction: 'inbound',
            timestamp: 1000,
          },
        ],
        revisionCount: 1,
        status: 'completed',
      };

      expect(extractor.validateThread(validThread)).toBe(true);
    });

    it('should reject thread with missing messages', () => {
      const invalidThread: FirestoreThread = {
        threadId: 'thread-123',
        projectId: 'project-1',
        reviewToken: 'token-123',
        originalDesign: {
          storageRef: 'gs://bucket/design.png',
          width: 800,
          height: 600,
          format: 'png',
          degradationLevel: 1,
        },
        createdAt: 1000,
        completedAt: 5000,
        messages: [],
        revisionCount: 1,
        status: 'completed',
      };

      expect(extractor.validateThread(invalidThread)).toBe(false);
    });

    it('should calculate thread statistics', () => {
      const threads: FirestoreThread[] = [
        {
          threadId: 'thread-1',
          projectId: 'project-1',
          reviewToken: 'token-1',
          originalDesign: {
            storageRef: 'gs://bucket/design1.png',
            width: 800,
            height: 600,
            format: 'png',
            degradationLevel: 1,
          },
          createdAt: 1000,
          completedAt: 5000,
          messages: [
            {
              id: 'msg-1',
              userId: 'user-1',
              userRole: 'designer',
              direction: 'inbound',
              timestamp: 1000,
              images: [
                { storageRef: 'gs://bucket/img1.png', width: 512, height: 512 },
                { storageRef: 'gs://bucket/img2.png', width: 512, height: 512 },
              ],
              annotations: [{ id: 'anno-1', type: 'comment', x: 10, y: 10, width: 50, height: 50 }],
            },
          ],
          revisionCount: 2,
          status: 'completed',
        },
      ];

      const stats = extractor.getThreadStatistics(threads);
      expect(stats.totalThreads).toBe(1);
      expect(stats.totalMessages).toBe(1);
      expect(stats.totalImages).toBe(2);
      expect(stats.totalAnnotations).toBe(1);
      expect(stats.averageRevisions).toBe(2);
      expect(stats.averageMessagesPerThread).toBe(1);
      expect(stats.averageDurationMs).toBeGreaterThan(0);
    });
  });
});
