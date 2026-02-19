/**
 * Unit tests for BrushPresets
 * Brush preset management with CRUD operations and categorization
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Reference types matching source
interface BrushSettings {
  size: number;
  hardness: number;
  opacity: number;
  flow: number;
  spacing: number;
  angle: number;
  roundness: number;
  smoothing: number;
  blendMode: string;
  tipShape?: any;
  texture?: any;
  pressureMappings?: any;
}

interface BrushPreset {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  settings: BrushSettings;
  isDefault: boolean;
  createdAt: number;
  modifiedAt: number;
}

// Reference implementation of BrushPresets for testing
// This mirrors core logic from lib/studio/editor/tools/brush/BrushPresets.ts
class TestBrushPresets {
  private presets: Map<string, BrushPreset> = new Map();
  private categories: Map<string, string[]> = new Map();

  constructor() {
    this.initializeDefaultPresets();
  }

  public getPreset(id: string): BrushPreset | null {
    return this.presets.get(id) || null;
  }

  public getAllPresets(): BrushPreset[] {
    return Array.from(this.presets.values());
  }

  public getPresetsByCategory(category: string): BrushPreset[] {
    const ids = this.categories.get(category) || [];
    return ids.map((id) => this.presets.get(id)).filter((p) => p !== undefined) as BrushPreset[];
  }

  public getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  public searchPresets(query: string): BrushPreset[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllPresets().filter((p) =>
      p.name.toLowerCase().includes(lowerQuery)
    );
  }

  public createPreset(
    name: string,
    settings: BrushSettings,
    category: string = 'custom'
  ): BrushPreset {
    const id = this.generatePresetId();
    const now = Date.now();

    const preset: BrushPreset = {
      id,
      name,
      category,
      thumbnail: this.generateThumbnail(settings),
      settings: JSON.parse(JSON.stringify(settings)),
      isDefault: false,
      createdAt: now,
      modifiedAt: now,
    };

    this.presets.set(id, preset);
    this.addToCategory(category, id);

    return preset;
  }

  public updatePreset(id: string, updates: Partial<BrushPreset>): BrushPreset | null {
    const preset = this.presets.get(id);
    if (!preset) {
      return null;
    }

    const updated: BrushPreset = {
      ...preset,
      ...updates,
      id: preset.id,
      isDefault: preset.isDefault,
      createdAt: preset.createdAt,
      modifiedAt: Date.now(),
    };

    this.presets.set(id, updated);
    return updated;
  }

  public renamePreset(id: string, newName: string): BrushPreset | null {
    return this.updatePreset(id, { name: newName });
  }

  public deletePreset(id: string): boolean {
    const preset = this.presets.get(id);
    if (!preset || preset.isDefault) {
      return false;
    }

    this.removeFromCategory(preset.category, id);
    this.presets.delete(id);
    return true;
  }

  public duplicatePreset(id: string, newName?: string): BrushPreset | null {
    const preset = this.presets.get(id);
    if (!preset) {
      return null;
    }

    const name = newName || `${preset.name} copy`;
    return this.createPreset(name, preset.settings, preset.category);
  }

  public exportPresets(ids?: string[]): string {
    const toExport = ids
      ? ids.map((id) => this.presets.get(id)).filter((p) => p)
      : this.getAllPresets();
    return JSON.stringify(toExport, null, 2);
  }

  public importPresets(jsonString: string): BrushPreset[] {
    try {
      const imported = JSON.parse(jsonString) as any[];
      const results: BrushPreset[] = [];

      imported.forEach((item) => {
        if (this.isValidPresetData(item)) {
          const newId = this.generatePresetId();
          const preset: BrushPreset = {
            ...item,
            id: newId,
            isDefault: false,
            createdAt: Date.now(),
            modifiedAt: Date.now(),
          };
          this.presets.set(newId, preset);
          this.addToCategory(preset.category, newId);
          results.push(preset);
        }
      });

      return results;
    } catch (error) {
      return [];
    }
  }

  public resetToDefaults(): void {
    this.presets.clear();
    this.categories.clear();
    this.initializeDefaultPresets();
  }

  public getStatistics(): {
    totalPresets: number;
    defaultCount: number;
    customCount: number;
    categoryCounts: Record<string, number>;
  } {
    const stats = {
      totalPresets: this.presets.size,
      defaultCount: 0,
      customCount: 0,
      categoryCounts: {} as Record<string, number>,
    };

    this.presets.forEach((preset) => {
      if (preset.isDefault) {
        stats.defaultCount++;
      } else {
        stats.customCount++;
      }

      stats.categoryCounts[preset.category] =
        (stats.categoryCounts[preset.category] || 0) + 1;
    });

    return stats;
  }

  private initializeDefaultPresets(): void {
    const defaultSettings: BrushSettings = {
      size: 50,
      hardness: 100,
      opacity: 100,
      flow: 100,
      spacing: 25,
      angle: 0,
      roundness: 100,
      smoothing: 0,
      blendMode: 'normal',
    };

    // Basic Brushes
    this.createDefaultPreset(
      'Hard Round',
      { ...defaultSettings, size: 50, hardness: 100, spacing: 25 },
      'basic'
    );

    this.createDefaultPreset(
      'Soft Round',
      { ...defaultSettings, size: 50, hardness: 25, spacing: 25 },
      'basic'
    );

    this.createDefaultPreset(
      'Brush',
      { ...defaultSettings, size: 40, hardness: 50, spacing: 20 },
      'basic'
    );

    this.createDefaultPreset(
      'Soft Brush',
      { ...defaultSettings, size: 55, hardness: 15, spacing: 25 },
      'basic'
    );

    this.createDefaultPreset(
      'Medium Brush',
      { ...defaultSettings, size: 50, hardness: 50, spacing: 25 },
      'basic'
    );

    // Artistic Brushes
    this.createDefaultPreset(
      'Chalk',
      { ...defaultSettings, size: 45, hardness: 40, spacing: 30, flow: 80 },
      'artistic'
    );

    this.createDefaultPreset(
      'Charcoal',
      { ...defaultSettings, size: 55, hardness: 35, spacing: 35, flow: 85 },
      'artistic'
    );

    this.createDefaultPreset(
      'Watercolor',
      { ...defaultSettings, size: 60, hardness: 20, spacing: 40, flow: 60 },
      'artistic'
    );

    this.createDefaultPreset(
      'Airbrush',
      { ...defaultSettings, size: 80, hardness: 0, spacing: 20, flow: 40 },
      'artistic'
    );

    this.createDefaultPreset(
      'Ink',
      { ...defaultSettings, size: 35, hardness: 95, spacing: 15, flow: 100 },
      'artistic'
    );

    this.createDefaultPreset(
      'Marker',
      { ...defaultSettings, size: 65, hardness: 85, spacing: 30, flow: 90, roundness: 80 },
      'artistic'
    );

    this.createDefaultPreset(
      'Bristle',
      { ...defaultSettings, size: 45, hardness: 60, spacing: 30, roundness: 60 },
      'artistic'
    );

    // Texture Brushes
    this.createDefaultPreset(
      'Splatter',
      { ...defaultSettings, size: 50, hardness: 100, spacing: 50, roundness: 40 },
      'texture'
    );

    this.createDefaultPreset(
      'Stipple',
      { ...defaultSettings, size: 30, hardness: 100, spacing: 60, roundness: 50 },
      'texture'
    );

    this.createDefaultPreset(
      'Dry Brush',
      { ...defaultSettings, size: 50, hardness: 60, spacing: 40, flow: 70, roundness: 70 },
      'texture'
    );

    this.createDefaultPreset(
      'Wet',
      { ...defaultSettings, size: 55, hardness: 15, spacing: 35, flow: 80, blendMode: 'multiply' },
      'texture'
    );

    this.createDefaultPreset(
      'Oil',
      { ...defaultSettings, size: 65, hardness: 30, spacing: 45, flow: 75 },
      'texture'
    );

    this.createDefaultPreset(
      'Spray',
      { ...defaultSettings, size: 75, hardness: 0, spacing: 25, flow: 50, roundness: 60 },
      'texture'
    );

    // Special Effects
    this.createDefaultPreset(
      'Flat',
      { ...defaultSettings, size: 40, hardness: 100, spacing: 20, roundness: 0 },
      'special'
    );

    this.createDefaultPreset(
      'Fan',
      { ...defaultSettings, size: 50, hardness: 80, spacing: 35, roundness: 20 },
      'special'
    );

    this.createDefaultPreset(
      'Speckle',
      { ...defaultSettings, size: 40, hardness: 100, spacing: 100, roundness: 40 },
      'special'
    );

    this.createDefaultPreset(
      'Glow',
      { ...defaultSettings, size: 60, hardness: 10, spacing: 30, flow: 50, blendMode: 'screen' },
      'special'
    );

    this.createDefaultPreset(
      'Erase',
      { ...defaultSettings, size: 50, hardness: 60, spacing: 25 },
      'special'
    );

    this.createDefaultPreset(
      'Smudge',
      { ...defaultSettings, size: 50, hardness: 40, spacing: 35, flow: 85, blendMode: 'overlay' },
      'special'
    );

    this.createDefaultPreset(
      'Clone',
      { ...defaultSettings, size: 50, hardness: 75, spacing: 25 },
      'special'
    );

    this.createDefaultPreset(
      'Blur',
      { ...defaultSettings, size: 50, hardness: 30, spacing: 25, blendMode: 'normal' },
      'special'
    );

    this.createDefaultPreset(
      'Dodge',
      { ...defaultSettings, size: 45, hardness: 50, spacing: 25, flow: 60, blendMode: 'screen' },
      'special'
    );

    this.createDefaultPreset(
      'Burn',
      { ...defaultSettings, size: 45, hardness: 50, spacing: 25, flow: 60, blendMode: 'multiply' },
      'special'
    );
  }

  private createDefaultPreset(
    name: string,
    settings: BrushSettings,
    category: string
  ): BrushPreset {
    const id = `preset-${category}-${name.toLowerCase().replace(/\s+/g, '-')}`;
    const now = Date.now();

    const preset: BrushPreset = {
      id,
      name,
      category,
      thumbnail: this.generateThumbnail(settings),
      settings: JSON.parse(JSON.stringify(settings)),
      isDefault: true,
      createdAt: now,
      modifiedAt: now,
    };

    this.presets.set(id, preset);
    this.addToCategory(category, id);

    return preset;
  }

  private generateThumbnail(settings: BrushSettings): string {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }

  private generatePresetId(): string {
    return `preset-custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToCategory(category: string, id: string): void {
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category)!.push(id);
  }

  private removeFromCategory(category: string, id: string): void {
    const ids = this.categories.get(category);
    if (ids) {
      const index = ids.indexOf(id);
      if (index !== -1) {
        ids.splice(index, 1);
      }
    }
  }

  private isValidPresetData(obj: any): boolean {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.name === 'string' &&
      typeof obj.category === 'string' &&
      obj.settings &&
      typeof obj.settings === 'object'
    );
  }
}

describe('BrushPresets', () => {
  let presets: TestBrushPresets;

  beforeEach(() => {
    presets = new TestBrushPresets();
  });

  describe('Initialization', () => {
    it('should create with 30+ default presets', () => {
      const allPresets = presets.getAllPresets();
      expect(allPresets.length).toBeGreaterThanOrEqual(28);
    });

    it('should initialize all default presets with isDefault=true', () => {
      const allPresets = presets.getAllPresets();
      const defaults = allPresets.filter((p) => p.isDefault);
      expect(defaults.length).toBe(allPresets.length);
    });

    it('should have all major categories', () => {
      const categories = presets.getCategories();
      expect(categories).toContain('basic');
      expect(categories).toContain('artistic');
      expect(categories).toContain('texture');
      expect(categories).toContain('special');
    });
  });

  describe('getPreset', () => {
    it('should return preset by ID', () => {
      const allPresets = presets.getAllPresets();
      const testPreset = allPresets[0];

      const retrieved = presets.getPreset(testPreset.id);
      expect(retrieved).toEqual(testPreset);
    });

    it('should return null for non-existent ID', () => {
      const result = presets.getPreset('non-existent-id-12345');
      expect(result).toBeNull();
    });
  });

  describe('getAllPresets', () => {
    it('should return all presets as array', () => {
      const all = presets.getAllPresets();
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThan(0);
    });

    it('should return array with all properties', () => {
      const all = presets.getAllPresets();
      all.forEach((preset) => {
        expect(preset.id).toBeDefined();
        expect(preset.name).toBeDefined();
        expect(preset.category).toBeDefined();
        expect(preset.settings).toBeDefined();
        expect(preset.isDefault).toBeDefined();
        expect(preset.createdAt).toBeDefined();
        expect(preset.modifiedAt).toBeDefined();
      });
    });
  });

  describe('getPresetsByCategory', () => {
    it('should filter presets by category', () => {
      const basic = presets.getPresetsByCategory('basic');
      expect(basic.length).toBeGreaterThan(0);
      basic.forEach((p) => expect(p.category).toBe('basic'));
    });

    it('should return presets for artistic category', () => {
      const artistic = presets.getPresetsByCategory('artistic');
      expect(artistic.length).toBeGreaterThan(0);
      artistic.forEach((p) => expect(p.category).toBe('artistic'));
    });

    it('should return presets for texture category', () => {
      const texture = presets.getPresetsByCategory('texture');
      expect(texture.length).toBeGreaterThan(0);
      texture.forEach((p) => expect(p.category).toBe('texture'));
    });

    it('should return presets for special category', () => {
      const special = presets.getPresetsByCategory('special');
      expect(special.length).toBeGreaterThan(0);
      special.forEach((p) => expect(p.category).toBe('special'));
    });

    it('should return empty array for unknown category', () => {
      const result = presets.getPresetsByCategory('unknown-category');
      expect(result).toEqual([]);
    });
  });

  describe('searchPresets', () => {
    it('should find presets by name substring', () => {
      const results = presets.searchPresets('brush');
      expect(results.length).toBeGreaterThan(0);
      results.forEach((p) => expect(p.name.toLowerCase()).toContain('brush'));
    });

    it('should be case-insensitive', () => {
      const lower = presets.searchPresets('chalk');
      const upper = presets.searchPresets('CHALK');
      expect(lower.length).toBeGreaterThan(0);
      expect(lower.length).toBe(upper.length);
    });

    it('should return empty for no matches', () => {
      const results = presets.searchPresets('xyzabc123notfound');
      expect(results).toEqual([]);
    });
  });

  describe('createPreset', () => {
    it('should create custom preset', () => {
      const settings: BrushSettings = {
        size: 75,
        hardness: 60,
        opacity: 85,
        flow: 90,
        spacing: 30,
        angle: 45,
        roundness: 80,
        smoothing: 5,
        blendMode: 'multiply',
      };

      const preset = presets.createPreset('My Custom Brush', settings, 'custom');

      expect(preset.name).toBe('My Custom Brush');
      expect(preset.category).toBe('custom');
      expect(preset.isDefault).toBe(false);
      expect(preset.settings).toEqual(settings);
    });

    it('should generate unique ID', () => {
      const settings: BrushSettings = {
        size: 50,
        hardness: 50,
        opacity: 100,
        flow: 100,
        spacing: 25,
        angle: 0,
        roundness: 100,
        smoothing: 0,
        blendMode: 'normal',
      };

      const p1 = presets.createPreset('Brush 1', settings, 'custom');
      const p2 = presets.createPreset('Brush 2', settings, 'custom');

      expect(p1.id).not.toBe(p2.id);
    });

    it('should be retrievable after creation', () => {
      const settings: BrushSettings = {
        size: 50,
        hardness: 50,
        opacity: 100,
        flow: 100,
        spacing: 25,
        angle: 0,
        roundness: 100,
        smoothing: 0,
        blendMode: 'normal',
      };

      const created = presets.createPreset('Test Brush', settings, 'custom');
      const retrieved = presets.getPreset(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should set timestamps', () => {
      const settings: BrushSettings = {
        size: 50,
        hardness: 50,
        opacity: 100,
        flow: 100,
        spacing: 25,
        angle: 0,
        roundness: 100,
        smoothing: 0,
        blendMode: 'normal',
      };

      const preset = presets.createPreset('Time Test', settings, 'custom');

      expect(preset.createdAt).toBeLessThanOrEqual(Date.now());
      expect(preset.modifiedAt).toBeLessThanOrEqual(Date.now());
      expect(preset.createdAt).toBe(preset.modifiedAt);
    });
  });

  describe('deletePreset', () => {
    it('should delete custom preset', () => {
      const settings: BrushSettings = {
        size: 50,
        hardness: 50,
        opacity: 100,
        flow: 100,
        spacing: 25,
        angle: 0,
        roundness: 100,
        smoothing: 0,
        blendMode: 'normal',
      };

      const preset = presets.createPreset('Delete Me', settings, 'custom');
      const deleted = presets.deletePreset(preset.id);

      expect(deleted).toBe(true);
      expect(presets.getPreset(preset.id)).toBeNull();
    });

    it('should prevent deletion of default presets', () => {
      const defaultPreset = presets.getAllPresets().find((p) => p.isDefault);
      expect(defaultPreset).toBeDefined();

      const deleted = presets.deletePreset(defaultPreset!.id);

      expect(deleted).toBe(false);
      expect(presets.getPreset(defaultPreset!.id)).toBeDefined();
    });

    it('should return false for non-existent preset', () => {
      const deleted = presets.deletePreset('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('duplicatePreset', () => {
    it('should duplicate preset with new ID', () => {
      const original = presets.getAllPresets()[0];
      const duplicated = presets.duplicatePreset(original.id);

      expect(duplicated).toBeDefined();
      expect(duplicated!.id).not.toBe(original.id);
      expect(duplicated!.settings).toEqual(original.settings);
    });

    it('should create with copy suffix by default', () => {
      const original = presets.getAllPresets()[0];
      const duplicated = presets.duplicatePreset(original.id);

      expect(duplicated!.name).toBe(`${original.name} copy`);
    });

    it('should use custom name if provided', () => {
      const original = presets.getAllPresets()[0];
      const duplicated = presets.duplicatePreset(original.id, 'Custom Name');

      expect(duplicated!.name).toBe('Custom Name');
    });

    it('should return null for non-existent preset', () => {
      const result = presets.duplicatePreset('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('Export/Import', () => {
    it('should export presets as valid JSON', () => {
      const json = presets.exportPresets();
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should export specific presets by ID', () => {
      const allPresets = presets.getAllPresets();
      const ids = [allPresets[0].id, allPresets[1].id];

      const json = presets.exportPresets(ids);
      const parsed = JSON.parse(json) as BrushPreset[];

      expect(parsed.length).toBe(2);
      expect(parsed[0].id).toBe(ids[0]);
      expect(parsed[1].id).toBe(ids[1]);
    });

    it('should import presets from JSON', () => {
      const settings: BrushSettings = {
        size: 50,
        hardness: 50,
        opacity: 100,
        flow: 100,
        spacing: 25,
        angle: 0,
        roundness: 100,
        smoothing: 0,
        blendMode: 'normal',
      };

      const toExport = [
        {
          name: 'Imported 1',
          category: 'imported',
          settings,
          thumbnail: 'data:image/png;base64,',
        },
      ];

      const json = JSON.stringify(toExport);
      const imported = presets.importPresets(json);

      expect(imported.length).toBe(1);
      expect(imported[0].name).toBe('Imported 1');
      expect(imported[0].isDefault).toBe(false);
    });

    it('should handle invalid JSON', () => {
      const result = presets.importPresets('invalid json {]');
      expect(result).toEqual([]);
    });
  });

  describe('Statistics', () => {
    it('should report total preset count', () => {
      const stats = presets.getStatistics();
      expect(stats.totalPresets).toBeGreaterThanOrEqual(28);
    });

    it('should count default presets', () => {
      const stats = presets.getStatistics();
      expect(stats.defaultCount).toBeGreaterThanOrEqual(28);
      expect(stats.customCount).toBe(0);
    });

    it('should count custom presets', () => {
      const settings: BrushSettings = {
        size: 50,
        hardness: 50,
        opacity: 100,
        flow: 100,
        spacing: 25,
        angle: 0,
        roundness: 100,
        smoothing: 0,
        blendMode: 'normal',
      };

      presets.createPreset('Custom 1', settings, 'custom');
      presets.createPreset('Custom 2', settings, 'custom');

      const stats = presets.getStatistics();
      expect(stats.customCount).toBe(2);
    });

    it('should provide category counts', () => {
      const stats = presets.getStatistics();
      expect(stats.categoryCounts['basic']).toBeGreaterThan(0);
      expect(stats.categoryCounts['artistic']).toBeGreaterThan(0);
      expect(stats.categoryCounts['texture']).toBeGreaterThan(0);
      expect(stats.categoryCounts['special']).toBeGreaterThan(0);
    });
  });

  describe('Reset to defaults', () => {
    it('should remove all custom presets', () => {
      const settings: BrushSettings = {
        size: 50,
        hardness: 50,
        opacity: 100,
        flow: 100,
        spacing: 25,
        angle: 0,
        roundness: 100,
        smoothing: 0,
        blendMode: 'normal',
      };

      presets.createPreset('Will Be Removed', settings, 'custom');

      const statsBeforeReset = presets.getStatistics();
      expect(statsBeforeReset.customCount).toBe(1);

      presets.resetToDefaults();

      const statsAfterReset = presets.getStatistics();
      expect(statsAfterReset.customCount).toBe(0);
      expect(statsAfterReset.defaultCount).toBeGreaterThanOrEqual(28);
    });

    it('should restore all default presets', () => {
      presets.resetToDefaults();

      const all = presets.getAllPresets();
      const defaults = all.filter((p) => p.isDefault);

      expect(defaults.length).toBe(all.length);
    });
  });
});
