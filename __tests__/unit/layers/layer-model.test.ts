import { describe, it, expect } from 'vitest';
import { LayerModel } from '@/lib/studio/editor/layers/LayerModel';
import type {
  LayerTree,
  Layer,
  RasterLayer,
  AdjustmentLayer,
  TextLayer,
  ShapeLayer,
  GroupLayer,
  SmartObjectLayer,
  LayerLock,
  Rect,
} from '@/lib/studio/types/layers';

/**
 * Helper function to create a populated test tree for reuse across tests
 * Structure:
 * - root
 *   ├─ raster1
 *   ├─ group1 [collapsed=false, passThrough=false]
 *   │  ├─ text1
 *   │  └─ shape1
 *   ├─ adjustment1
 *   └─ smartObject1
 */
function createPopulatedTestTree(): {
  tree: LayerTree;
  layerIds: {
    raster1: string;
    group1: string;
    text1: string;
    shape1: string;
    adjustment1: string;
    smartObject1: string;
  };
} {
  let tree = LayerModel.createEmptyTree('test-doc');

  const raster1 = LayerModel.createRasterLayer('raster-1', 'Raster 1', {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  tree = LayerModel.addLayer(tree, raster1);

  const group1 = LayerModel.createGroupLayer('group-1', 'Group 1');
  tree = LayerModel.addLayer(tree, group1);

  const text1 = LayerModel.createTextLayer(
    'text-1',
    'Hello World',
    { x: 10, y: 10, width: 80, height: 20 },
    'group-1'
  );
  tree = LayerModel.addLayer(tree, text1);

  const shape1 = LayerModel.createShapeLayer(
    'shape-1',
    'Shape 1',
    'circle',
    { x: 20, y: 20, width: 50, height: 50 },
    'group-1'
  );
  tree = LayerModel.addLayer(tree, shape1);

  const adjustment1 = LayerModel.createAdjustmentLayer(
    'adjustment-1',
    'Levels',
    'levels'
  );
  tree = LayerModel.addLayer(tree, adjustment1);

  const smartObject1 = LayerModel.createSmartObjectLayer(
    'smart-1',
    'Smart Object',
    'source-ref-123',
    { x: 50, y: 50, width: 150, height: 150 }
  );
  tree = LayerModel.addLayer(tree, smartObject1);

  return {
    tree,
    layerIds: {
      raster1: 'raster-1',
      group1: 'group-1',
      text1: 'text-1',
      shape1: 'shape-1',
      adjustment1: 'adjustment-1',
      smartObject1: 'smart-1',
    },
  };
}

describe('LayerModel - Factory Methods', () => {
  it('createEmptyTree: creates tree with empty layers Map, empty rootOrder, null activeLayerId, empty selectedLayerIds', () => {
    const tree = LayerModel.createEmptyTree('doc-123');

    expect(tree.documentId).toBe('doc-123');
    expect(tree.layers.size).toBe(0);
    expect(tree.rootOrder).toEqual([]);
    expect(tree.activeLayerId).toBeNull();
    expect(tree.selectedLayerIds.size).toBe(0);
  });

  it('createRasterLayer: creates layer with correct defaults (visible=true, opacity=100, blendMode=normal)', () => {
    const layer = LayerModel.createRasterLayer('raster-1', 'My Raster', {
      x: 10,
      y: 20,
      width: 300,
      height: 400,
    });

    expect(layer).toEqual({
      id: 'raster-1',
      type: 'raster',
      name: 'My Raster',
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      bounds: { x: 10, y: 20, width: 300, height: 400 },
      locked: { position: false, pixels: false, transparency: false, all: false },
      parentId: null,
      order: 0,
      mask: null,
      effects: [],
      clipToBelow: false,
      pixelData: null,
    });
  });

  it('createRasterLayer: accepts optional parentId', () => {
    const layer = LayerModel.createRasterLayer(
      'raster-2',
      'Child Raster',
      { x: 0, y: 0, width: 50, height: 50 },
      'parent-group'
    );

    expect(layer.parentId).toBe('parent-group');
  });

  it('createAdjustmentLayer: creates layer with correct type and adjustmentType', () => {
    const layer = LayerModel.createAdjustmentLayer(
      'adj-1',
      'Curves',
      'curves'
    );

    expect(layer.type).toBe('adjustment');
    expect((layer as AdjustmentLayer).adjustmentType).toBe('curves');
    expect((layer as AdjustmentLayer).settings).toEqual({});
    expect(layer.visible).toBe(true);
    expect(layer.opacity).toBe(100);
  });

  it('createAdjustmentLayer: accepts optional parentId', () => {
    const layer = LayerModel.createAdjustmentLayer(
      'adj-2',
      'Levels',
      'levels',
      'parent-group'
    );

    expect(layer.parentId).toBe('parent-group');
  });

  it('createTextLayer: creates layer with name truncated to 30 characters', () => {
    const longText = 'This is a very long text that exceeds thirty characters definitely';
    const layer = LayerModel.createTextLayer(
      'text-1',
      longText,
      { x: 0, y: 0, width: 200, height: 50 }
    );

    expect((layer as TextLayer).name).toBe(longText.substring(0, 30));
    expect((layer as TextLayer).name.length).toBe(30);
  });

  it('createTextLayer: uses full text if shorter than 30 characters', () => {
    const shortText = 'Short text';
    const layer = LayerModel.createTextLayer(
      'text-2',
      shortText,
      { x: 0, y: 0, width: 100, height: 50 }
    );

    expect((layer as TextLayer).name).toBe(shortText);
  });

  it('createTextLayer: includes correct font defaults', () => {
    const layer = LayerModel.createTextLayer(
      'text-3',
      'Sample',
      { x: 0, y: 0, width: 100, height: 50 }
    ) as TextLayer;

    expect(layer.fontSize).toBeGreaterThan(0);
    expect(layer.fontFamily).toBeDefined();
    expect(layer.color).toBeDefined();
  });

  it('createShapeLayer: creates layer with correct shapeType, fill, and stroke defaults', () => {
    const layer = LayerModel.createShapeLayer(
      'shape-1',
      'Circle',
      'circle',
      { x: 0, y: 0, width: 100, height: 100 }
    ) as ShapeLayer;

    expect(layer.type).toBe('shape');
    expect(layer.shapeType).toBe('circle');
    expect(layer.fill).toBe('#000000');
    expect(layer.stroke).toBeNull();
  });

  it('createGroupLayer: creates layer with empty children, collapsed=false, passThrough=false', () => {
    const layer = LayerModel.createGroupLayer(
      'group-1',
      'My Group'
    ) as GroupLayer;

    expect(layer.type).toBe('group');
    expect(layer.children).toEqual([]);
    expect(layer.collapsed).toBe(false);
    expect(layer.passThrough).toBe(false);
  });

  it('createSmartObjectLayer: creates layer with identity transform [1,0,0,0,1,0,0,0,1]', () => {
    const layer = LayerModel.createSmartObjectLayer(
      'smart-1',
      'Smart Object',
      'source-ref-123',
      { x: 0, y: 0, width: 100, height: 100 }
    ) as SmartObjectLayer;

    expect(layer.type).toBe('smart-object');
    expect(layer.sourceRef).toBe('source-ref-123');
    expect(layer.transform).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });

  it('all factory methods create layers with default locks (all false)', () => {
    const raster = LayerModel.createRasterLayer('r', 'R', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    const adjustment = LayerModel.createAdjustmentLayer('a', 'A', 'levels');
    const text = LayerModel.createTextLayer('t', 'T', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    const shape = LayerModel.createShapeLayer('s', 'S', 'rect', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    const group = LayerModel.createGroupLayer('g', 'G');
    const smart = LayerModel.createSmartObjectLayer('so', 'SO', 'ref', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });

    [raster, adjustment, text, shape, group, smart].forEach((layer) => {
      expect(layer.locked).toEqual({
        position: false,
        pixels: false,
        transparency: false,
        all: false,
      });
    });
  });
});

describe('LayerModel - Tree Operations', () => {
  it('addLayer: adds root layer to rootOrder', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const layer = LayerModel.createRasterLayer('r1', 'Raster', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });

    tree = LayerModel.addLayer(tree, layer);

    expect(tree.rootOrder).toContain('r1');
    expect(tree.layers.has('r1')).toBe(true);
  });

  it('addLayer: adds child layer to group children', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const group = LayerModel.createGroupLayer('g1', 'Group');
    tree = LayerModel.addLayer(tree, group);

    const textLayer = LayerModel.createTextLayer(
      't1',
      'Text',
      { x: 0, y: 0, width: 10, height: 10 },
      'g1'
    );
    tree = LayerModel.addLayer(tree, textLayer);

    const groupLayer = tree.layers.get('g1') as GroupLayer;
    expect(groupLayer.children).toContain('t1');
    expect(tree.layers.has('t1')).toBe(true);
  });

  it('addLayer: adds at specific index in rootOrder', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const r1 = LayerModel.createRasterLayer('r1', 'R1', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    const r2 = LayerModel.createRasterLayer('r2', 'R2', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    const r3 = LayerModel.createRasterLayer('r3', 'R3', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });

    tree = LayerModel.addLayer(tree, r1);
    tree = LayerModel.addLayer(tree, r2);
    tree = LayerModel.addLayer(tree, r3, 1); // Insert r3 at index 1

    expect(tree.rootOrder).toEqual(['r1', 'r3', 'r2']);
  });

  it('deleteLayer: removes from rootOrder and layers Map', () => {
    const { tree: initialTree } = createPopulatedTestTree();
    const tree = LayerModel.deleteLayer(initialTree, 'raster-1');

    expect(tree.rootOrder).not.toContain('raster-1');
    expect(tree.layers.has('raster-1')).toBe(false);
  });

  it('deleteLayer: clears activeLayerId if deleted layer was active', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const layer = LayerModel.createRasterLayer('r1', 'R', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    tree = LayerModel.addLayer(tree, layer);
    tree = LayerModel.setActiveLayer(tree, 'r1');

    expect(tree.activeLayerId).toBe('r1');

    tree = LayerModel.deleteLayer(tree, 'r1');
    expect(tree.activeLayerId).toBeNull();
  });

  it('deleteLayer: recursively deletes group children', () => {
    const { tree: initialTree } = createPopulatedTestTree();
    const tree = LayerModel.deleteLayer(initialTree, 'group-1');

    expect(tree.layers.has('group-1')).toBe(false);
    expect(tree.layers.has('text-1')).toBe(false);
    expect(tree.layers.has('shape-1')).toBe(false);
  });

  it('deleteLayer: non-existent ID returns unchanged tree', () => {
    const { tree: initialTree } = createPopulatedTestTree();
    const tree = LayerModel.deleteLayer(initialTree, 'non-existent-id');

    expect(tree).toEqual(initialTree);
  });

  it('duplicateLayer: creates new layer with new ID, same properties, inserted after original', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const original = LayerModel.createRasterLayer('r1', 'Original', {
      x: 10,
      y: 20,
      width: 100,
      height: 100,
    });
    tree = LayerModel.addLayer(tree, original);

    tree = LayerModel.duplicateLayer(tree, 'r1', 'r1-copy');

    const r1Index = tree.rootOrder.indexOf('r1');
    const copyIndex = tree.rootOrder.indexOf('r1-copy');

    expect(copyIndex).toBe(r1Index + 1);
    expect(tree.layers.has('r1-copy')).toBe(true);

    const copiedLayer = tree.layers.get('r1-copy') as RasterLayer;
    expect(copiedLayer.name).toBe('Original');
    expect(copiedLayer.bounds).toEqual({ x: 10, y: 20, width: 100, height: 100 });
    expect(copiedLayer.visible).toBe(true);
    expect(copiedLayer.opacity).toBe(100);
  });

  it('updateLayerProperty: changes single property and returns new tree', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const layer = LayerModel.createRasterLayer('r1', 'Raster', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    tree = LayerModel.addLayer(tree, layer);

    const updatedTree = LayerModel.updateLayerProperty(tree, 'r1', 'visible', false);

    expect(updatedTree.layers.get('r1')?.visible).toBe(false);
    expect(tree.layers.get('r1')?.visible).toBe(true); // Original unchanged
    expect(updatedTree).not.toBe(tree); // New tree instance
  });

  it('updateLayerProperties: changes multiple properties', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const layer = LayerModel.createRasterLayer('r1', 'Raster', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    tree = LayerModel.addLayer(tree, layer);

    const updatedTree = LayerModel.updateLayerProperties(tree, 'r1', {
      visible: false,
      opacity: 50,
      name: 'Updated',
    });

    const updated = updatedTree.layers.get('r1');
    expect(updated?.visible).toBe(false);
    expect(updated?.opacity).toBe(50);
    expect(updated?.name).toBe('Updated');
  });

  it('setOpacity: clamps opacity to 0-100 (test with -10 and 200)', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const layer = LayerModel.createRasterLayer('r1', 'R', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    tree = LayerModel.addLayer(tree, layer);

    const negativeTree = LayerModel.setOpacity(tree, 'r1', -10);
    expect(negativeTree.layers.get('r1')?.opacity).toBe(0);

    const highTree = LayerModel.setOpacity(tree, 'r1', 200);
    expect(highTree.layers.get('r1')?.opacity).toBe(100);

    const validTree = LayerModel.setOpacity(tree, 'r1', 50);
    expect(validTree.layers.get('r1')?.opacity).toBe(50);
  });

  it('setLock: merges partial lock with existing lock', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const layer = LayerModel.createRasterLayer('r1', 'R', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    tree = LayerModel.addLayer(tree, layer);

    tree = LayerModel.setLock(tree, 'r1', { position: true });
    let locked = tree.layers.get('r1')?.locked;
    expect(locked?.position).toBe(true);
    expect(locked?.pixels).toBe(false);
    expect(locked?.transparency).toBe(false);

    tree = LayerModel.setLock(tree, 'r1', { pixels: true, transparency: true });
    locked = tree.layers.get('r1')?.locked;
    expect(locked?.position).toBe(true); // Still true from before
    expect(locked?.pixels).toBe(true);
    expect(locked?.transparency).toBe(true);
  });

  it('reorderLayer: moves layer within rootOrder', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const r1 = LayerModel.createRasterLayer('r1', 'R1', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    const r2 = LayerModel.createRasterLayer('r2', 'R2', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    const r3 = LayerModel.createRasterLayer('r3', 'R3', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });

    tree = LayerModel.addLayer(tree, r1);
    tree = LayerModel.addLayer(tree, r2);
    tree = LayerModel.addLayer(tree, r3);

    expect(tree.rootOrder).toEqual(['r1', 'r2', 'r3']);

    tree = LayerModel.reorderLayer(tree, 'r3', 0);
    expect(tree.rootOrder).toEqual(['r3', 'r1', 'r2']);
  });

  it('reorderLayer: moves layer within group children', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const group = LayerModel.createGroupLayer('g1', 'Group');
    tree = LayerModel.addLayer(tree, group);

    const t1 = LayerModel.createTextLayer(
      't1',
      'T1',
      { x: 0, y: 0, width: 10, height: 10 },
      'g1'
    );
    const t2 = LayerModel.createTextLayer(
      't2',
      'T2',
      { x: 0, y: 0, width: 10, height: 10 },
      'g1'
    );
    const t3 = LayerModel.createTextLayer(
      't3',
      'T3',
      { x: 0, y: 0, width: 10, height: 10 },
      'g1'
    );

    tree = LayerModel.addLayer(tree, t1);
    tree = LayerModel.addLayer(tree, t2);
    tree = LayerModel.addLayer(tree, t3);

    const groupBefore = tree.layers.get('g1') as GroupLayer;
    expect(groupBefore.children).toEqual(['t1', 't2', 't3']);

    tree = LayerModel.reorderLayer(tree, 't3', 0);

    const groupAfter = tree.layers.get('g1') as GroupLayer;
    expect(groupAfter.children).toEqual(['t3', 't1', 't2']);
  });

  it('moveToParent: moves layer from root to group', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const group = LayerModel.createGroupLayer('g1', 'Group');
    const raster = LayerModel.createRasterLayer('r1', 'Raster', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });

    tree = LayerModel.addLayer(tree, group);
    tree = LayerModel.addLayer(tree, raster);

    expect(tree.rootOrder).toContain('r1');

    tree = LayerModel.moveToParent(tree, 'r1', 'g1');

    expect(tree.rootOrder).not.toContain('r1');
    const groupLayer = tree.layers.get('g1') as GroupLayer;
    expect(groupLayer.children).toContain('r1');
    expect(tree.layers.get('r1')?.parentId).toBe('g1');
  });

  it('moveToParent: moves layer from group to root', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const group = LayerModel.createGroupLayer('g1', 'Group');
    tree = LayerModel.addLayer(tree, group);

    const text = LayerModel.createTextLayer(
      't1',
      'Text',
      { x: 0, y: 0, width: 10, height: 10 },
      'g1'
    );
    tree = LayerModel.addLayer(tree, text);

    const groupBefore = tree.layers.get('g1') as GroupLayer;
    expect(groupBefore.children).toContain('t1');

    tree = LayerModel.moveToParent(tree, 't1', null);

    expect(tree.rootOrder).toContain('t1');
    const groupAfter = tree.layers.get('g1') as GroupLayer;
    expect(groupAfter.children).not.toContain('t1');
    expect(tree.layers.get('t1')?.parentId).toBeNull();
  });

  it('moveToParent: moves layer between groups', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const g1 = LayerModel.createGroupLayer('g1', 'Group 1');
    const g2 = LayerModel.createGroupLayer('g2', 'Group 2');
    tree = LayerModel.addLayer(tree, g1);
    tree = LayerModel.addLayer(tree, g2);

    const shape = LayerModel.createShapeLayer(
      's1',
      'Shape',
      'rect',
      { x: 0, y: 0, width: 10, height: 10 },
      'g1'
    );
    tree = LayerModel.addLayer(tree, shape);

    const group1Before = tree.layers.get('g1') as GroupLayer;
    expect(group1Before.children).toContain('s1');

    tree = LayerModel.moveToParent(tree, 's1', 'g2');

    const group1After = tree.layers.get('g1') as GroupLayer;
    const group2After = tree.layers.get('g2') as GroupLayer;
    expect(group1After.children).not.toContain('s1');
    expect(group2After.children).toContain('s1');
    expect(tree.layers.get('s1')?.parentId).toBe('g2');
  });
});

describe('LayerModel - Query Methods', () => {
  it('getDescendants: returns all nested children recursively', () => {
    const { tree } = createPopulatedTestTree();

    const descendants = LayerModel.getDescendants(tree, 'group-1');

    expect(descendants.map((d) => d.id)).toContain('text-1');
    expect(descendants.map((d) => d.id)).toContain('shape-1');
    expect(descendants.length).toBe(2);
  });

  it('getZIndex: returns correct position in parent order', () => {
    const { tree } = createPopulatedTestTree();

    const zIndex = LayerModel.getZIndex(tree, 'raster-1');
    expect(zIndex).toBe(tree.rootOrder.indexOf('raster-1'));
  });

  it('getLayer: returns layer when found', () => {
    const { tree } = createPopulatedTestTree();

    const layer = LayerModel.getLayer(tree, 'raster-1');
    expect(layer).toBeDefined();
    expect(layer?.id).toBe('raster-1');
  });

  it('getLayer: returns null when not found', () => {
    const { tree } = createPopulatedTestTree();

    const layer = LayerModel.getLayer(tree, 'non-existent');
    expect(layer).toBeNull();
  });

  it('getRootLayers: returns root layers in order', () => {
    const { tree } = createPopulatedTestTree();

    const rootLayers = LayerModel.getRootLayers(tree);

    expect(rootLayers.map((l) => l.id)).toEqual(tree.rootOrder);
    expect(rootLayers.length).toBe(tree.rootOrder.length);
  });

  it('getChildren: returns group children in order', () => {
    const { tree } = createPopulatedTestTree();

    const children = LayerModel.getChildren(tree, 'group-1');

    expect(children.map((c) => c.id)).toEqual(['text-1', 'shape-1']);
  });

  it('getBounds: returns bounding box of multiple layers', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const r1 = LayerModel.createRasterLayer('r1', 'R1', {
      x: 0,
      y: 0,
      width: 50,
      height: 50,
    });
    const r2 = LayerModel.createRasterLayer('r2', 'R2', {
      x: 25,
      y: 25,
      width: 50,
      height: 50,
    });

    tree = LayerModel.addLayer(tree, r1);
    tree = LayerModel.addLayer(tree, r2);

    const bounds = LayerModel.getBounds(tree, ['r1', 'r2']);

    expect(bounds).not.toBeNull();
    expect(bounds?.x).toBe(0);
    expect(bounds?.y).toBe(0);
    expect(bounds?.width).toBe(75);
    expect(bounds?.height).toBe(75);
  });

  it('getBounds: returns null when no layers have bounds', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const group = LayerModel.createGroupLayer('g1', 'Group');
    tree = LayerModel.addLayer(tree, group);

    const bounds = LayerModel.getBounds(tree, ['g1']);
    expect(bounds).toBeNull();
  });

  it('validateTree: returns valid=true for valid tree', () => {
    const { tree } = createPopulatedTestTree();

    const validation = LayerModel.validateTree(tree);

    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  it('validateTree: detects orphaned layer references', () => {
    const { tree: baseTree } = createPopulatedTestTree();

    // Manually create an invalid tree with orphaned reference
    const invalidTree: LayerTree = {
      ...baseTree,
      rootOrder: [...baseTree.rootOrder, 'non-existent-layer'],
    };

    const validation = LayerModel.validateTree(invalidTree);

    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors.some((e) => e.includes('non-existent-layer'))).toBe(
      true
    );
  });

  it('validateTree: detects non-group parent references', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const raster = LayerModel.createRasterLayer('r1', 'R', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    tree = LayerModel.addLayer(tree, raster);

    const text = LayerModel.createTextLayer(
      't1',
      'T',
      { x: 0, y: 0, width: 10, height: 10 },
      'r1' // Raster cannot be parent
    );
    tree = LayerModel.addLayer(tree, text);

    const validation = LayerModel.validateTree(tree);

    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes('not a group'))).toBe(true);
  });
});

describe('LayerModel - Selection Methods', () => {
  it('setActiveLayer: sets active layer ID', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const layer = LayerModel.createRasterLayer('r1', 'R', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    tree = LayerModel.addLayer(tree, layer);

    tree = LayerModel.setActiveLayer(tree, 'r1');
    expect(tree.activeLayerId).toBe('r1');

    tree = LayerModel.setActiveLayer(tree, null);
    expect(tree.activeLayerId).toBeNull();
  });

  it('setSelectedLayers: sets selection to provided IDs', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const r1 = LayerModel.createRasterLayer('r1', 'R1', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    const r2 = LayerModel.createRasterLayer('r2', 'R2', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });

    tree = LayerModel.addLayer(tree, r1);
    tree = LayerModel.addLayer(tree, r2);

    tree = LayerModel.setSelectedLayers(tree, ['r1', 'r2']);

    expect(tree.selectedLayerIds.has('r1')).toBe(true);
    expect(tree.selectedLayerIds.has('r2')).toBe(true);
    expect(tree.selectedLayerIds.size).toBe(2);
  });

  it('addToSelection: adds layer to selection without removing others', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const r1 = LayerModel.createRasterLayer('r1', 'R1', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    const r2 = LayerModel.createRasterLayer('r2', 'R2', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    const r3 = LayerModel.createRasterLayer('r3', 'R3', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });

    tree = LayerModel.addLayer(tree, r1);
    tree = LayerModel.addLayer(tree, r2);
    tree = LayerModel.addLayer(tree, r3);

    tree = LayerModel.setSelectedLayers(tree, ['r1']);
    tree = LayerModel.addToSelection(tree, 'r2');

    expect(tree.selectedLayerIds.has('r1')).toBe(true);
    expect(tree.selectedLayerIds.has('r2')).toBe(true);
    expect(tree.selectedLayerIds.size).toBe(2);
  });

  it('removeFromSelection: removes layer from selection', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const r1 = LayerModel.createRasterLayer('r1', 'R1', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    const r2 = LayerModel.createRasterLayer('r2', 'R2', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });

    tree = LayerModel.addLayer(tree, r1);
    tree = LayerModel.addLayer(tree, r2);
    tree = LayerModel.setSelectedLayers(tree, ['r1', 'r2']);

    tree = LayerModel.removeFromSelection(tree, 'r1');

    expect(tree.selectedLayerIds.has('r1')).toBe(false);
    expect(tree.selectedLayerIds.has('r2')).toBe(true);
  });

  it('toggleSelection: adds layer if not selected, removes if selected', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const r1 = LayerModel.createRasterLayer('r1', 'R1', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });

    tree = LayerModel.addLayer(tree, r1);

    expect(tree.selectedLayerIds.has('r1')).toBe(false);

    tree = LayerModel.toggleSelection(tree, 'r1');
    expect(tree.selectedLayerIds.has('r1')).toBe(true);

    tree = LayerModel.toggleSelection(tree, 'r1');
    expect(tree.selectedLayerIds.has('r1')).toBe(false);
  });
});

describe('LayerModel - Immutability', () => {
  it('addLayer: original tree unchanged after operation', () => {
    const tree = LayerModel.createEmptyTree('doc');
    const originalRootOrderLength = tree.rootOrder.length;
    const originalLayersSize = tree.layers.size;

    const layer = LayerModel.createRasterLayer('r1', 'R', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    const newTree = LayerModel.addLayer(tree, layer);

    expect(tree.rootOrder.length).toBe(originalRootOrderLength);
    expect(tree.layers.size).toBe(originalLayersSize);
    expect(newTree).not.toBe(tree);
    expect(newTree.rootOrder).not.toBe(tree.rootOrder);
  });

  it('deleteLayer: original tree unchanged after operation', () => {
    const { tree: initialTree } = createPopulatedTestTree();
    const originalRootOrderLength = initialTree.rootOrder.length;
    const originalLayersSize = initialTree.layers.size;

    const newTree = LayerModel.deleteLayer(initialTree, 'raster-1');

    expect(initialTree.rootOrder.length).toBe(originalRootOrderLength);
    expect(initialTree.layers.size).toBe(originalLayersSize);
    expect(newTree).not.toBe(initialTree);
  });

  it('updateLayerProperty: original tree unchanged after operation', () => {
    let tree = LayerModel.createEmptyTree('doc');
    const layer = LayerModel.createRasterLayer('r1', 'Raster', {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    tree = LayerModel.addLayer(tree, layer);

    const originalOpacity = tree.layers.get('r1')?.opacity;

    const newTree = LayerModel.updateLayerProperty(tree, 'r1', 'opacity', 50);

    expect(tree.layers.get('r1')?.opacity).toBe(originalOpacity);
    expect(newTree).not.toBe(tree);
    expect(newTree.layers).not.toBe(tree.layers);
  });
});
